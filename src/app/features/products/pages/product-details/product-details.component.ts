import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, Renderer2, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { ReviewsService } from '../../services/reviews.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { AuthService } from '../../../auth/services/auth.service';
import { IProduct } from '../../interfaces/iproduct';
import { IReview } from '../../interfaces/ireview';
import { IFavoriteItem } from '../../../favorites/interfaces/ifavorite-item';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CartService } from '../../../cart/services/cart.service';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductCard } from '../../../../shared/components/product-card/product-card.component';
import { LOCAL_STORAGE_KEYS } from '../../../../core/constants/localstorage-keys';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { UiState } from '../../../../core/state/ui.state';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

interface ISpecification {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    SkeletonLoader,
    CurrencyFormatPipe,
    DatePipe,
    LoadingSpinner,
    ProductCard,
    FormsModule,
    TranslatePipe,
    LocalizedPipe,
    LazyImageDirective
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetails implements OnInit, OnDestroy, AfterViewInit {
  private productService = inject(ProductService);
  private reviewsService = inject(ReviewsService);
  private favoritesService = inject(FavoritesService);
  readonly authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly cartService = inject(CartService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  protected readonly Math = Math;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Active Tab
  readonly activeTab = signal<'description' | 'specifications' | 'reviews'>('description');

  // Product Core States
  readonly product = signal<IProduct | undefined>(undefined);
  readonly isLoading = signal<boolean>(true);
  readonly activeImage = signal<string>('');
  
  // Images Gallery
  readonly productImages = computed<string[]>(() => {
    const prod = this.product();
    if (!prod) {
      return [];
    }
    const list: string[] = [];
    if (prod.mainImageUrl) {
      list.push(prod.mainImageUrl);
    }
    if (prod.images && Array.isArray(prod.images)) {
      prod.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img.imageUrl;
        if (url && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list;
  });

  readonly itemQuantity = signal<number>(1);

  // Favorites States
  readonly isFavorite = computed(() => this.favoritesService.isFavorited(this.product()?.id ?? 0));
  readonly isTogglingFavorite = signal<boolean>(false);

  // Reviews States
  readonly reviews = signal<IReview[]>([]);
  readonly averageRating = signal<number>(5.0);
  readonly reviewsCount = signal<number>(0);
  readonly isSubmittingReview = signal<boolean>(false);
  readonly ratingsBreakdown = signal<{ stars: number; count: number; percentage: number }[]>([]);

  // Check if current authenticated user has already submitted a review for this product
  readonly hasUserReviewed = computed<boolean>(() => {
    const user = this.authService.currentUser();
    if (!user || !this.authService.isLoggedIn()) {
      return false;
    }
    const currentReviews = this.reviews();
    return currentReviews.some((r) => {
      const matchId = user.id && r.userId && String(r.userId) === String(user.id);
      const matchName = user.name && r.userName && r.userName.toLowerCase() === user.name.toLowerCase();
      const matchEmail = user.email && r.userName && r.userName.toLowerCase() === user.email.toLowerCase();
      return !!(matchId || matchName || matchEmail);
    });
  });

  // Review Form Controls
  newReviewRating = 5;
  newReviewComment = '';
  newReviewError = '';
  newReviewSuccess = false;

  // Dynamic Product Meta
  readonly specifications = signal<ISpecification[]>([]);
  readonly relatedProducts = signal<IProduct[]>([]);

  private routeSub!: Subscription;

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadProductDetails(id: string): void {
    if (this.isBrowser) {
      window.scrollTo(0, 0);
    }
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        if (data) {
          this.product.set(data);
          this.activeImage.set(data.mainImageUrl);
          
          // Generate context-aware architectural specifications based on category/name
          this.generateSpecifications(data);

          // Fetch real reviews & ratings from APIs
          this.loadReviewsAndRatings(data.id);

          // Sync Favorites state from API (single source of truth)
          this.syncFavoritesState(data.id);

          // Load related products from category
          this.loadRelatedProducts(data.categoryId, data.id);
        } else {
          this.router.navigate(['/404']);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product details', err);
        this.isLoading.set(false);
        this.router.navigate(['/404']);
      }
    });
  }

  private loadReviewsAndRatings(productId: number): void {
    this.reviewsService.getProductReviews(productId).subscribe({
      next: (revs) => {
        this.reviews.set(revs || []);
        this.reviewsCount.set(revs ? revs.length : 0);
        
        // Calculate average rating dynamically from loaded reviews
        if (revs && revs.length > 0) {
          const sum = revs.reduce((acc, r) => acc + r.rating, 0);
          const avg = Number((sum / revs.length).toFixed(1));
          this.averageRating.set(avg);
          
          // Calculate dynamic stats breakdown
          const breakdownMap: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          revs.forEach((r) => {
            if (breakdownMap[r.rating] !== undefined) {
              breakdownMap[r.rating]++;
            }
          });
          
          const breakdown = [5, 4, 3, 2, 1].map((stars) => {
            const count = breakdownMap[stars];
            const percentage = Math.round((count / revs.length) * 100);
            return { stars, count, percentage };
          });
          this.ratingsBreakdown.set(breakdown);
        } else {
          this.averageRating.set(5.0);
          this.ratingsBreakdown.set([
            { stars: 5, count: 0, percentage: 0 },
            { stars: 4, count: 0, percentage: 0 },
            { stars: 3, count: 0, percentage: 0 },
            { stars: 2, count: 0, percentage: 0 },
            { stars: 1, count: 0, percentage: 0 }
          ]);
        }
      },
      error: (err) => {
        console.error('Failed to fetch product reviews', err);
      }
    });
  }

  private syncFavoritesState(productId: number): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favs) => {
        this.syncLocalStorageFavorites(favs);
      },
      error: (err) => {
        console.error('Failed to sync favorites on initialization', err);
      }
    });
  }

  private loadRelatedProducts(categoryId: number, currentProductId: number): void {
    this.productService.getProducts({ categoryId: categoryId.toString(), page: 1, limit: 10 } as any).subscribe({
      next: (prods) => {
        // Filter out the current product from related products
        let filtered = prods.filter(p => p.id !== currentProductId);
        
        // Settle on showing exactly 4 related products
        if (filtered.length > 4) {
          filtered = filtered.slice(0, 4);
        }
        
        this.relatedProducts.set(filtered);
      },
      error: (err) => {
        console.error('Failed to fetch related products', err);
        this.relatedProducts.set([]);
      }
    });
  }

  private generateSpecifications(prod: IProduct): void {
    const isSofa = prod.nameEn.toLowerCase().includes('sofa') || prod.descriptionEn.toLowerCase().includes('sofa');
    const isChair = prod.nameEn.toLowerCase().includes('chair') || prod.descriptionEn.toLowerCase().includes('chair');
    const isLighting = prod.categoryNameEn.toLowerCase().includes('light') || prod.nameEn.toLowerCase().includes('lamp');
    const isTable = prod.nameEn.toLowerCase().includes('table') || prod.nameEn.toLowerCase().includes('desk');

    let specs: ISpecification[] = [];

    if (isSofa) {
      specs = [
        { labelEn: 'Material', labelAr: 'المادة المصنعة', valueEn: 'Luxury velvet fabric / Solid oak support frame', valueAr: 'قماش مخملي فاخر / هيكل دعم خشب بلوط صلب' },
        { labelEn: 'Cushioning', labelAr: 'الحشوة الداخلية', valueEn: 'High-density resilient padding memory foam', valueAr: 'رغوة مرنة عالية الكثافة ممتازة للراحة' },
        { labelEn: 'Dimensions', labelAr: 'الأبعاد القياسية', valueEn: '220cm (W) x 95cm (D) x 85cm (H)', valueAr: '220سم (عرض) × 95سم (عمق) × 85سم (ارتفاع)' },
        { labelEn: 'Weight Capacity', labelAr: 'أقصى وزن للتحمل', valueEn: 'Up to 320 kg', valueAr: 'حتى 320 كجم' },
        { labelEn: 'Product Origin', labelAr: 'المنشأ', valueEn: 'Hand-crafted editorial design', valueAr: 'تصميم يدوي فني فريد' }
      ];
    } else if (isChair) {
      specs = [
        { labelEn: 'Material', labelAr: 'المادة المصنعة', valueEn: 'Eco-bouclé textile fabric / Steel inner base', valueAr: 'نسيج البوكليه الصديق للبيئة / قاعدة فولاذية داخلية' },
        { labelEn: 'Legs Profile', labelAr: 'حواف الأرجل', valueEn: 'Matte black walnut finish lacquer wood', valueAr: 'خشب الجوز المطلي بلون أسود مطفأ فاخر' },
        { labelEn: 'Dimensions', labelAr: 'الأبعاد القياسية', valueEn: '85cm (W) x 82cm (D) x 78cm (H)', valueAr: '85سم (عرض) × 82سم (عمق) × 78سم (ارتفاع)' },
        { labelEn: 'Weight Capacity', labelAr: 'أقصى وزن للتحمل', valueEn: 'Up to 150 kg', valueAr: 'حتى 150 كجم' },
        { labelEn: 'Product Origin', labelAr: 'المنشأ', valueEn: 'Hand-crafted luxury series', valueAr: 'صناعة يدوية فاخرة' }
      ];
    } else if (isLighting) {
      specs = [
        { labelEn: 'Material', labelAr: 'المادة المصنعة', valueEn: 'Hand-blown opaline glass / Antique brass metal', valueAr: 'زجاج أوبالين منفوخ يدوياً / نحاس عتيق مصقول' },
        { labelEn: 'Light Source', labelAr: 'مخرج الضوء', valueEn: 'E27 socket max 40W (warm LED included)', valueAr: 'قابس E27 بحد أقصى 40 واط (مصباح LED دافئ مشمول)' },
        { labelEn: 'Dimensions', labelAr: 'الأبعاد القياسية', valueEn: '40cm x 40cm x 155cm', valueAr: '40سم × 40سم × 155سم' },
        { labelEn: 'Voltage support', labelAr: 'دعم الجهد الكهربائي', valueEn: '220V - 240V AC', valueAr: '220 فولت - 240 فولت تيار متردد' },
        { labelEn: 'Care Directions', labelAr: 'إرشادات العناية', valueEn: 'Dust with soft microfibre cloth when turned off', valueAr: 'يُنظف بقطعة قماش ناعمة جافة عند إيقاف التشغيل' }
      ];
    } else if (isTable) {
      specs = [
        { labelEn: 'Material', labelAr: 'المادة المصنعة', valueEn: 'Polished white Calacatta marble / Ash veneer wood', valueAr: 'رخام كالاكاتا أبيض مصقول / قشرة خشب الرماد' },
        { labelEn: 'Base Structural', labelAr: 'هيكل القاعدة', valueEn: 'Double-fluted pedestal geometry column base', valueAr: 'قاعدة هندسية مزدوجة الحواف على شكل عمود فني' },
        { labelEn: 'Dimensions', labelAr: 'الأبعاد القياسية', valueEn: '140cm (Diameter) x 76cm (Height)', valueAr: 'قطر 140سم × ارتفاع 76سم' },
        { labelEn: 'Weight', labelAr: 'الوزن التقريبي', valueEn: '82 kg (Highly heavy - Requires safe handling)', valueAr: '82 كجم (ثقيل جداً - يتطلب مناولة آمنة)' },
        { labelEn: 'Care Directions', labelAr: 'إرشادات العناية', valueEn: 'Use stone coaster overlays; wipe spills immediately', valueAr: 'استخدم قواعد للأكواب، وجفف السوائل المسكوبة فوراً' }
      ];
    } else {
      specs = [
        { labelEn: 'Material', labelAr: 'المادة المصنعة', valueEn: 'Premium luxury composite blends / Ashwood solid frame', valueAr: 'مزيج فاخر من المواد المركبة / خشب الرماد الصلب' },
        { labelEn: 'Dimensions', labelAr: 'الأبعاد القياسية', valueEn: 'Standard editorial proportions', valueAr: 'أبعاد فنية قياسية متناسقة' },
        { labelEn: 'Weight Profile', labelAr: 'الوزن التقريبي', valueEn: 'Medium heavy premium profile', valueAr: 'وزن متوسط يعكس جودة المواد' },
        { labelEn: 'Care Directions', labelAr: 'إرشادات العناية', valueEn: 'Clean with dry warm microfiber towel', valueAr: 'يُنظف بقطعة قماش ناعمة ودافئة من الميكروفيبر' }
      ];
    }

    this.specifications.set(specs);
  }

  setActiveImage(img: string): void {
    this.activeImage.set(img);
  }

  incrementQuantity(): void {
    this.itemQuantity.update((q) => q + 1);
  }

  decrementQuantity(): void {
    this.itemQuantity.update((q) => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    if (this.cartService.isProductAdding(product.id)) {
      return;
    }

    this.cartService.addToCart(product, this.itemQuantity());
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();

    const prod = this.product();
    if (!prod) return;

    this.isTogglingFavorite.set(true);

    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(prod.id).subscribe({
        next: () => {
          this.isTogglingFavorite.set(false);
          this.refreshLocalStorageFavorites();
        },
        error: (err) => {
          console.error('Failed to remove favorite', err);
          this.isTogglingFavorite.set(false);
        }
      });
    } else {
      this.favoritesService.addFavorite(prod.id).subscribe({
        next: () => {
          this.isTogglingFavorite.set(false);
          this.refreshLocalStorageFavorites();
          
          // Trigger Success Toast
          const isAr = this.translationService.currentLang() === 'ar';
          const prodName = isAr ? (prod.nameAr || prod.nameEn) : (prod.nameEn || prod.nameAr);
          const msg = isAr ? `تم إضافة "${prodName}" إلى المفضلة` : `"${prodName}" added to favorites`;
          this.uiState.showAlert('success', msg, { label: isAr ? 'عرض المفضلة' : 'View Favorites', routerLink: '/favorites' });
        },
        error: (err) => {
          console.error('Failed to add favorite', err);
          this.isTogglingFavorite.set(false);
        }
      });
    }
  }

  private refreshLocalStorageFavorites(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favs) => {
        this.syncLocalStorageFavorites(favs);
      }
    });
  }

  private syncLocalStorageFavorites(favs: IFavoriteItem[]): void {
    if (this.isBrowser) {
      // Sync in format expected by navbar component count calculations
      localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      // Dispatch standard browser storage event to trigger real-time recalculations in navbar Count computed signal
      window.dispatchEvent(new Event('storage'));
    }
  }

  setActiveTab(tab: 'description' | 'specifications' | 'reviews'): void {
    this.activeTab.set(tab);
  }

  submitReview(event: Event): void {
    event.preventDefault();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const prod = this.product();
    if (!prod) return;

    if (!this.newReviewComment.trim()) {
      this.newReviewError = this.translationService.currentLang() === 'ar' ? 'من فضلك اكتب تعليقاً أولاً.' : 'Please enter a comment first.';
      return;
    }

    this.newReviewError = '';
    this.isSubmittingReview.set(true);

    const reviewPayload = {
      productId: prod.id,
      rating: this.newReviewRating,
      comment: this.newReviewComment.trim()
    };

    this.reviewsService.addReview(reviewPayload).subscribe({
      next: () => {
        this.isSubmittingReview.set(false);
        this.newReviewSuccess = true;
        this.newReviewComment = '';
        this.newReviewRating = 5;
        
        // Reload all reviews & rating statistics from server immediately
        this.loadReviewsAndRatings(prod.id);

        // Hide success alert after 4 seconds
        setTimeout(() => {
          this.newReviewSuccess = false;
        }, 4000);
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        
        let isDuplicate = false;
        const errMsg = typeof err.error === 'string' 
          ? err.error 
          : (err.error?.message || err.error?.error || err.error?.title || err.message || '');
        
        if (
          err.status === 409 || 
          (err.status === 400 && (
            errMsg.toLowerCase().includes('already reviewed') || 
            errMsg.toLowerCase().includes('duplicate') || 
            errMsg.toLowerCase().includes('already submitted') || 
            errMsg.toLowerCase().includes('already exists')
          ))
        ) {
          isDuplicate = true;
        }

        if (isDuplicate) {
          this.newReviewError = this.translationService.currentLang() === 'ar' 
            ? 'لقد قمت بالفعل بكتابة مراجعة لهذا المنتج سابقاً. لا يمكن إضافة أكثر من مراجعة واحدة لكل منتج.' 
            : 'You have already submitted a review for this product. Only one review is allowed per customer.';
        } else if (err.status === 401) {
          this.newReviewError = this.translationService.currentLang() === 'ar'
            ? 'جلسة العمل الخاصة بك قد انتهت. يرجى تسجيل الدخول مرة أخرى لإرسال المراجعة.'
            : 'Your session has expired. Please sign in again to submit your review.';
        } else if (err.status === 403) {
          this.newReviewError = this.translationService.currentLang() === 'ar'
            ? 'عذراً، ليس لديك الصلاحية لكتابة مراجعة. فقط المشترين المعتمدين يمكنهم ذلك.'
            : 'Sorry, you do not have permission to write a review. Only verified buyers can submit.';
        } else {
          this.newReviewError = this.translationService.currentLang() === 'ar' 
            ? 'عذراً، حدث خطأ أثناء إرسال المراجعة. يرجى التحقق من اتصالك بالشبكة والمحاولة مجدداً.' 
            : 'Sorry, an error occurred while posting your review. Please check your network connection and try again.';
        }
        
        this.isSubmittingReview.set(false);
      }
    });
  }

  setRating(rating: number): void {
    this.newReviewRating = rating;
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        const revealItems = this.el.nativeElement.querySelectorAll(
          '.gallery-wrapper, .details-col, .tabs-wrapper, .related-products-section'
        );

        const observerOptions = {
          root: null,
          rootMargin: '0px 0px -20% 0px',
          threshold: 0.05
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.renderer.addClass(entry.target, 'reveal-visible');
              observer.unobserve(entry.target);
            }
          });
        }, observerOptions);

        revealItems.forEach((item: HTMLElement) => {
          this.renderer.addClass(item, 'scroll-reveal-item');
          observer.observe(item);
        });
      }, 100);
    }
  }
}
