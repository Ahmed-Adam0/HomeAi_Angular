import { Component, inject, OnInit, OnDestroy, signal, computed, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, NgStyle, NgClass, isPlatformBrowser, SlicePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { IProduct, IProductImage } from '../../interfaces/iproduct';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CartService } from '../../../cart/services/cart.service';
import { ProductCard } from '../../../../shared/components/product-card/product-card.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { UiState } from '../../../../core/state/ui.state';
import { ProductReviewsComponent } from '../../components/product-reviews/product-reviews.component';
import { ThreeDViewerComponent } from '../../../../shared/components/three-d-viewer/three-d-viewer.component';

interface IConfigOption {
  id: number;
  name: string;
  valueAr: string;
  valueEn: string;
  priceDelta: number;
}

interface IConfigGroup {
  id: string;
  rawId: number;
  type: 'attribute' | 'material';
  name: string;
  nameAr: string;
  nameEn: string;
  options: IConfigOption[];
}

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgStyle,
    NgClass,
    RouterLink,
    SkeletonLoader,
    CurrencyFormatPipe,
    ProductCard,
    TranslatePipe,
    LocalizedPipe,
    ProductReviewsComponent,
    SlicePipe,
    ThreeDViewerComponent,
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetails implements OnInit, OnDestroy {
  @ViewChild('carouselViewport') carouselViewport?: ElementRef<HTMLElement>;
  @ViewChild('detailsViewer') detailsViewerComponent?: ThreeDViewerComponent;

  readonly show3DMode = signal<boolean>(false);

  toggle3DMode(): void {
    this.show3DMode.update(val => !val);
  }

  triggerAR(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.detailsViewerComponent) {
      this.detailsViewerComponent.triggerAR();
    } else {
      console.warn('3D Viewer component is not loaded for AR action.');
    }
  }

  private productService = inject(ProductService);
  private favoritesService = inject(FavoritesService);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly cartService = inject(CartService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  readonly product = signal<IProduct | undefined>(undefined);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notFound = signal(false);
  readonly currentProductId = signal<string>('');

  readonly selectedImage = signal<string>('');
  readonly imageTransitioning = signal(false);
  readonly zoomStyle = signal<Record<string, string>>({});
  readonly productImages = computed<string[]>(() => {
    const prod = this.product();
    if (!prod) return [];
    const list: string[] = [];
    if (prod.mainImageUrl && !list.includes(prod.mainImageUrl)) list.push(prod.mainImageUrl);
    if (prod.images && Array.isArray(prod.images)) {
      for (const img of prod.images) {
        const url = typeof img === 'string' ? img : (img as IProductImage).imageUrl;
        if (url && !list.includes(url)) list.push(url);
      }
    }
    return list;
  });

  readonly selectedOptions = signal<Record<string, number>>({});
  readonly validationErrors = signal<Record<string, boolean>>({});

  readonly configGroups = computed<IConfigGroup[]>(() => {
    const prod = this.product();
    if (!prod) return [];

    const groups: IConfigGroup[] = [];
    const seenGroupIds = new Set<string>();

    // 1. Process attributes
    if (prod.attributes && Array.isArray(prod.attributes)) {
      for (const attr of prod.attributes) {
        const idStr = `attr-${attr.id}`;
        if (!seenGroupIds.has(idStr)) {
          seenGroupIds.add(idStr);
          groups.push({
            id: idStr,
            rawId: attr.id,
            type: 'attribute',
            name: attr.nameEn || attr.nameAr || attr.name || '',
            nameAr: attr.nameAr || attr.name || '',
            nameEn: attr.nameEn || attr.name || '',
            options: (attr.values || []).map((val: any) => ({
              id: val.id,
              name: val.valueEn || val.valueAr || '',
              valueAr: val.valueAr || '',
              valueEn: val.valueEn || '',
              priceDelta: Number(val.priceDelta || 0)
            }))
          });
        }
      }
    }

    // 2. Process materialGroups
    if (prod.materialGroups && Array.isArray(prod.materialGroups)) {
      for (const group of prod.materialGroups) {
        const groupId = group.materialId || (group as any).id;
        const idStr = `group-${groupId}`;
        if (!seenGroupIds.has(idStr)) {
          seenGroupIds.add(idStr);
          groups.push({
            id: idStr,
            rawId: groupId,
            type: 'material',
            name: group.nameEn || group.nameAr || group.name || '',
            nameAr: group.nameAr || group.name || '',
            nameEn: group.nameEn || group.name || '',
            options: (group.options || []).map((opt: any) => ({
              id: opt.id,
              name: opt.valueEn || opt.valueAr || opt.name || '',
              valueAr: opt.valueAr || '',
              valueEn: opt.valueEn || '',
              priceDelta: Number(opt.priceOption !== undefined ? opt.priceOption : (opt.priceDelta || 0))
            }))
          });
        }
      }
    }

    // 3. Fallback to materials (just in case)
    if (groups.length === 0 && prod.materials && Array.isArray(prod.materials)) {
      for (const mat of prod.materials) {
        const idStr = `mat-${mat.materialId}`;
        if (!seenGroupIds.has(idStr)) {
          seenGroupIds.add(idStr);
          groups.push({
            id: idStr,
            rawId: mat.materialId,
            type: 'material',
            name: mat.nameEn || mat.nameAr || mat.name || '',
            nameAr: mat.nameAr || mat.name || '',
            nameEn: mat.nameEn || mat.name || '',
            options: (mat.options || []).map((opt: any) => ({
              id: opt.id,
              name: opt.valueEn || opt.valueAr || opt.name || '',
              valueAr: opt.valueAr || '',
              valueEn: opt.valueEn || '',
              priceDelta: Number(opt.priceDelta || 0)
            }))
          });
        }
      }
    }

    return groups;
  });

  readonly finalPrice = computed(() => {
    const prod = this.product();
    if (!prod) return 0;
    const base = prod.basePrice ?? prod.price ?? 0;
    let delta = 0;
    for (const group of this.configGroups()) {
      const sid = this.selectedOptions()[group.id];
      if (sid) {
        const opt = group.options.find(o => o.id === sid);
        if (opt) delta += opt.priceDelta;
      }
    }
    return base + delta;
  });

  readonly hasDiscount = computed(() => {
    const p = this.product();
    return p ? (p.discountPercentage ?? 0) > 0 : false;
  });

  readonly quantity = signal(1);
  readonly totalPrice = computed(() => this.finalPrice() * this.quantity());
  readonly priceAnimating = signal(false);

  private triggerPriceAnimation(): void {
    this.priceAnimating.set(true);
    setTimeout(() => {
      this.priceAnimating.set(false);
    }, 250);
  }

  readonly descriptionText = computed(() => {
    const prod = this.product();
    if (!prod) return '';
    const lang = this.translationService.currentLang();
    if (lang === 'ar') return prod.descriptionAr || prod.descriptionEn || '';
    return prod.descriptionEn || prod.descriptionAr || '';
  });

  readonly hasLongDescription = computed(() => this.descriptionText().length > 200);
  readonly descriptionExpanded = signal(false);

  readonly isFavorite = computed(() => this.favoritesService.isFavorited(this.product()?.id ?? 0));
  readonly isTogglingFavorite = signal(false);

  readonly relatedProducts = signal<IProduct[]>([]);
  readonly isLoadingRelated = signal(false);

  private routeSub!: Subscription;

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadProduct(id);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadProduct(id: string): void {
    if (this.isBrowser) window.scrollTo(0, 0);
    this.isLoading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.currentProductId.set(id);
    this.show3DMode.set(false);
    this.validationErrors.set({});

    this.productService.getProductById(id).subscribe({
      next: (data) => {
        if (!data) { 
          this.notFound.set(true); 
          this.isLoading.set(false); 
          return; 
        }
        this.product.set(data);
        this.selectedImage.set(data.mainImageUrl || '');

        this.selectedOptions.set({});
        this.quantity.set(1);

        this.loadRelatedProducts(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err.status === 404) this.notFound.set(true);
        else this.error.set('Failed to load product');
        this.isLoading.set(false);
      },
    });
  }

  setActiveImage(img: string): void { 
    if (this.selectedImage() === img) return;
    this.imageTransitioning.set(true);
    setTimeout(() => {
      this.selectedImage.set(img);
      this.imageTransitioning.set(false);
    }, 200);
  }

  onMouseMove(event: MouseEvent): void {
    if (this.show3DMode()) return;
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomStyle.set({
      'transform-origin': `${x}% ${y}%`,
      'transform': 'scale(1.8)'
    });
  }

  onMouseLeave(): void {
    this.zoomStyle.set({
      'transform-origin': 'center center',
      'transform': 'scale(1)'
    });
  }

  selectOption(groupId: string, optionId: number): void {
    const isAlreadySelected = this.selectedOptions()[groupId] === optionId;

    this.selectedOptions.update(prev => {
      const next = { ...prev };
      if (isAlreadySelected) {
        delete next[groupId];
      } else {
        next[groupId] = optionId;
      }
      return next;
    });

    this.validationErrors.update(prev => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    this.triggerPriceAnimation();
  }

  getOptionSwatchColor(value: string): string | null {
    if (!value) return null;
    const val = value.toLowerCase();
    if (val.includes('oak') || val.includes('بلوط') || val.includes('أرو')) return '#C2A679';
    if (val.includes('walnut') || val.includes('جوز')) return '#5C4033';
    if (val.includes('beige') || val.includes('بيج')) return '#E5D3B3';
    if (val.includes('black') || val.includes('أسود')) return '#1A1A1A';
    if (val.includes('white') || val.includes('أبيض')) return '#FAFAFA';
    if (val.includes('grey') || val.includes('رمادي')) return '#8C8C8C';
    if (val.includes('brown') || val.includes('بني')) return '#6F4E37';
    if (val.includes('leather') || val.includes('جلد')) return '#B87333';
    if (val.includes('fabric') || val.includes('قماش')) return '#D9D3C7';
    if (val.includes('wood') || val.includes('خشب')) return '#A0522D';
    return null;
  }

  getSelectedOptionValue(group: any, selectedId: number): string {
    const opt = group.options.find((o: any) => o.id === selectedId);
    if (!opt) return '';
    const lang = this.translationService.currentLang();
    return lang === 'ar' ? opt.valueAr || opt.name : opt.valueEn || opt.name;
  }

  decrementQuantity(): void { 
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
      this.triggerPriceAnimation();
    }
  }
  
  incrementQuantity(): void { 
    this.quantity.update(q => q + 1); 
    this.triggerPriceAnimation();
  }

  addToCart(): void {
    const prod = this.product();
    if (!prod || this.cartService.isProductAdding(prod.id)) return;

    // Validate that all option groups have a selection
    const missing: Record<string, boolean> = {};
    let hasError = false;
    for (const group of this.configGroups()) {
      if (this.selectedOptions()[group.id] === undefined) {
        missing[group.id] = true;
        hasError = true;
      }
    }
    this.validationErrors.set(missing);

    if (hasError) {
      const isAr = this.translationService.currentLang() === 'ar';
      const firstMissingGroup = this.configGroups().find(g => missing[g.id]);
      const optionName = firstMissingGroup
        ? (isAr 
            ? (firstMissingGroup.nameAr || firstMissingGroup.nameEn || firstMissingGroup.name) 
            : (firstMissingGroup.nameEn || firstMissingGroup.nameAr || firstMissingGroup.name))
        : '';
      
      const message = isAr
        ? `يرجى تحديد ${optionName || 'جميع الخيارات'}.`
        : `Please select ${optionName ? optionName.toLowerCase() : 'all options'}.`;

      this.uiState.showAlert('warning', message);
      return;
    }

    this.cartService.addToCart(prod, this.quantity(), Object.values(this.selectedOptions()));
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    const prod = this.product();
    if (!prod) return;
    this.isTogglingFavorite.set(true);

    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(prod.id).subscribe({
        next: () => this.isTogglingFavorite.set(false),
        error: () => this.isTogglingFavorite.set(false),
      });
    } else {
      this.favoritesService.addFavorite(prod.id).subscribe({
        next: () => {
          this.isTogglingFavorite.set(false);
          const isAr = this.translationService.currentLang() === 'ar';
          const name = isAr ? (prod.nameAr || prod.nameEn) : (prod.nameEn || prod.nameAr);
          this.uiState.showAlert('success', `"${name}" ${isAr ? 'تمت الإضافة إلى المفضلة' : 'added to favorites'}`, {
            label: isAr ? 'عرض المفضلة' : 'View Favorites',
            routerLink: '/favorites',
          });
        },
        error: () => this.isTogglingFavorite.set(false),
      });
    }
  }

  private loadRelatedProducts(product: IProduct): void {
    this.isLoadingRelated.set(true);
    
    const filter: any = {
      page: 1,
      limit: 12
    };
    
    if (product.subCategoryId) {
      filter.subCategoryId = product.subCategoryId.toString();
    } else if (product.categoryId) {
      filter.categoryId = product.categoryId.toString();
    } else {
      this.relatedProducts.set([]);
      this.isLoadingRelated.set(false);
      return;
    }

    this.productService.getProducts(filter).subscribe({
      next: (prods) => {
        const filtered = prods.filter(p => p.id !== product.id);
        
        if (filtered.length < 3 && product.subCategoryId && product.categoryId) {
          const fallbackFilter = {
            categoryId: product.categoryId.toString(),
            page: 1,
            limit: 12
          };
          this.productService.getProducts(fallbackFilter).subscribe({
            next: (catProds) => {
              const catFiltered = catProds.filter(p => p.id !== product.id);
              const combined = [...filtered];
              for (const p of catFiltered) {
                if (!combined.some(x => x.id === p.id)) {
                  combined.push(p);
                }
              }
              this.relatedProducts.set(combined.slice(0, 8));
              this.isLoadingRelated.set(false);
            },
            error: () => {
              this.relatedProducts.set(filtered.slice(0, 8));
              this.isLoadingRelated.set(false);
            }
          });
        } else {
          this.relatedProducts.set(filtered.slice(0, 8));
          this.isLoadingRelated.set(false);
        }
      },
      error: () => {
        this.relatedProducts.set([]);
        this.isLoadingRelated.set(false);
      }
    });
  }

  toggleDescription(): void { 
    this.descriptionExpanded.update(v => !v); 
  }

  scrollCarousel(direction: 'left' | 'right' | number): void {
    if (!this.carouselViewport) return;
    const viewport = this.carouselViewport.nativeElement;
    const viewportWidth = viewport.clientWidth;
    
    let scrollAmount = viewportWidth;
    if (typeof direction === 'number') {
      scrollAmount = direction * viewportWidth;
    } else if (direction === 'left') {
      scrollAmount = -viewportWidth;
    } else if (direction === 'right') {
      scrollAmount = viewportWidth;
    }

    viewport.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  trackById(_: number, item: any): any { 
    return item.id; 
  }
}
