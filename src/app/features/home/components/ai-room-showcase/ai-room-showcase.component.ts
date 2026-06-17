import { Component, OnInit, inject, signal, computed, PLATFORM_ID, HostListener } from '@angular/core';
import { NgIf, NgFor, NgClass, isPlatformBrowser } from '@angular/common';
import { ProductService } from '../../../products/services/product.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CartService } from '../../../cart/services/cart.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { localized } from '../../../../shared/utils/localized';
import { ThreeDViewerComponent } from '../../../../shared/components/three-d-viewer/three-d-viewer.component';

interface Hotspot {
  top: number; // percentage from top
  left: number; // percentage from left
  type: 'sofa' | 'chair' | 'table' | 'lamp' | string;
  glbUrl?: string;
  defaultProduct: Partial<IProduct> & { id: number; price: number; nameEn: string; nameAr: string };
  product: IProduct; // resolved product
}

@Component({
  selector: 'app-ai-room-showcase',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, TranslatePipe, CurrencyFormatPipe, LocalizedPipe, ThreeDViewerComponent],
  templateUrl: './ai-room-showcase.component.html',
  styleUrl: './ai-room-showcase.component.css'
})
export class AiRoomShowcaseComponent implements OnInit {
  protected translationService = inject(TranslationService);
  protected cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  private productService = inject(ProductService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly isArabic = computed(() => this.translationService.currentLang() === 'ar');
  readonly selectedHotspot = signal<Hotspot | null>(null);
  readonly isTogglingFav = signal<boolean>(false);
  readonly isMobile = signal<boolean>(false);

  // Position settings for the active preview card
  readonly cardPosition = computed(() => {
    const active = this.selectedHotspot();
    if (!active) return { top: 0, left: 0, isRight: true };

    if (this.isMobile()) {
      return { top: 0, left: 0, isRight: true }; // mobile slide up layout
    }

    // If hotspot is on the left half of the room, display preview card on the right side
    const isRightSide = active.left <= 50;
    return {
      top: 15,
      left: isRightSide ? 68 : 4,
      isRight: isRightSide
    };
  });

  // Predefined hotspots with coordinates and beautiful fallbacks
  hotspots: Hotspot[] = [
    {
      top: 66,
      left: 15,
      type: 'sofa',
      glbUrl: 'assets/models/furniture.glb',
      defaultProduct: {
        id: 99901,
        nameEn: 'Living Room Lounge Tan',
        nameAr: 'أريكة غرفة المعيشة بيج',
        descriptionEn: 'Luxury velvet sofa with plush foam filling and robust wooden frame.',
        descriptionAr: 'أريكة مخملية فاخرة مع حشوة رغوية ناعمة وإطار خشبي متين.',
        price: 1868.00,
        categoryId: 8,
        categoryNameEn: 'Furniture',
        categoryNameAr: 'الأثاث',
        workshopId: 4,
        workshopNameEn: 'IdealInstitute',
        workshopNameAr: 'معهد النماذج',
        mainImageUrl: '/assets/images/room_living.png',
        isActive: true
      },
      product: null as any
    },
    {
      top: 71,
      left: 42,
      type: 'table',
      glbUrl: 'assets/models/furniture.glb',
      defaultProduct: {
        id: 99902,
        nameEn: 'Brass Nesting Coffee Tables',
        nameAr: 'طاولات قهوة متداخلة من النحاس',
        descriptionEn: 'Elegantly nested travertine coffee tables with warm brushed gold base.',
        descriptionAr: 'طاولات قهوة من الترافرتين متداخلة بأناقة مع قاعدة ذهبية دافئة.',
        price: 650.00,
        categoryId: 8,
        categoryNameEn: 'Furniture',
        categoryNameAr: 'الأثاث',
        workshopId: 4,
        workshopNameEn: 'Travertine Design',
        workshopNameAr: 'تصميم الترافرتين',
        mainImageUrl: '/assets/images/kitchen_furniture.png',
        isActive: true
      },
      product: null as any
    },
    {
      top: 81,
      left: 53,
      type: 'chair',
      glbUrl: 'assets/models/furniture.glb',
      defaultProduct: {
        id: 99903,
        nameEn: 'Rounded Luxury Dining Chair',
        nameAr: 'كرسي طعام فاخر مستدير',
        descriptionEn: 'Modern luxury dining chair with ergonomic cashmere backrest and steel legs.',
        descriptionAr: 'كرسي طعام فاخر حديث بمسند ظهر مريح من الكشمير وأرجل فولاذية.',
        price: 320.00,
        categoryId: 8,
        categoryNameEn: 'Furniture',
        categoryNameAr: 'الأثاث',
        workshopId: 4,
        workshopNameEn: 'Cashmere Living',
        workshopNameAr: 'المعيشة الكشميرية',
        mainImageUrl: '/assets/images/room_dining.png',
        isActive: true
      },
      product: null as any
    },
    {
      top: 60,
      left: 46,
      type: 'chair',
      glbUrl: 'assets/models/furniture.glb',
      defaultProduct: {
        id: 99904,
        nameEn: 'Modern Armchair Swivel',
        nameAr: 'كرسي ذراعين دوار حديث',
        descriptionEn: 'Swivelling lounge armchair with cashmere shell and gold brass base.',
        descriptionAr: 'كرسي صالون دوار ذو غلاف كشمير وقاعدة نحاسية ذهبية.',
        price: 580.00,
        categoryId: 8,
        categoryNameEn: 'Furniture',
        categoryNameAr: 'الأثاث',
        workshopId: 4,
        workshopNameEn: 'IdealInstitute',
        workshopNameAr: 'معهد النماذج',
        mainImageUrl: '/assets/images/room_office.png',
        isActive: true
      },
      product: null as any
    },
    {
      top: 19,
      left: 72,
      type: 'lamp',
      glbUrl: 'assets/models/furniture.glb',
      defaultProduct: {
        id: 99905,
        nameEn: 'Minimalist Halo Chandelier',
        nameAr: 'نجفة هالو البسيطة',
        descriptionEn: 'Brushed metal gold light rings and warm glass spheres for ambient luxury lighting.',
        descriptionAr: 'حلقات إضاءة ذهبية معدنية مصقولة وكرات زجاجية دافئة لإضاءة محيطة فاخرة.',
        price: 890.00,
        categoryId: 9,
        categoryNameEn: 'Lighting',
        categoryNameAr: 'الإضاءة',
        workshopId: 5,
        workshopNameEn: 'Halo Light Co.',
        workshopNameAr: 'شركة هالو للإضاءة',
        mainImageUrl: '/assets/images/kitchen_furniture.png',
        isActive: true
      },
      product: null as any
    }
  ];

  ngOnInit(): void {
    this.checkScreenSize();
    this.resolveProducts();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 992);
    }
  }

  /**
   * Try loading matching products from the database API, otherwise use detailed fallbacks.
   */
  private resolveProducts(): void {
    // Populate with default fallback first
    this.hotspots.forEach(h => {
      h.product = {
        ...h.defaultProduct,
        nameAr: h.defaultProduct.nameAr,
        nameEn: h.defaultProduct.nameEn,
        price: h.defaultProduct.price,
        descriptionAr: h.defaultProduct.descriptionAr || '',
        descriptionEn: h.defaultProduct.descriptionEn || '',
        categoryId: h.defaultProduct.categoryId || 0,
        categoryNameAr: h.defaultProduct.categoryNameAr || '',
        categoryNameEn: h.defaultProduct.categoryNameEn || '',
        workshopId: h.defaultProduct.workshopId || 0,
        workshopNameAr: h.defaultProduct.workshopNameAr || '',
        workshopNameEn: h.defaultProduct.workshopNameEn || '',
        createdAt: new Date().toISOString(),
        mainImageUrl: h.defaultProduct.mainImageUrl || ''
      } as IProduct;
    });

    // Try fetching products from the API and map matches
    this.productService.getProducts({ page: 1, limit: 30 } as any).subscribe({
      next: (products) => {
        if (!products || products.length === 0) return;

        this.hotspots.forEach(hotspot => {
          // Attempt to find an actual product matching the name or type
          const match = products.find(p => {
            const nameEn = p.nameEn.toLowerCase();
            const nameAr = p.nameAr;
            const type = hotspot.type;

            if (type === 'sofa') {
              return nameEn.includes('sofa') || nameEn.includes('lounge') || nameAr.includes('أريكة') || nameAr.includes('كنبة');
            } else if (type === 'table') {
              return nameEn.includes('table') || nameAr.includes('طاولة');
            } else if (type === 'chair') {
              return nameEn.includes('chair') || nameAr.includes('كرسي') || nameAr.includes('مقعد');
            } else if (type === 'lamp') {
              return nameEn.includes('lamp') || nameEn.includes('chandelier') || nameEn.includes('light') || nameAr.includes('نجفة') || nameAr.includes('إضاءة') || nameAr.includes('مصباح');
            }
            return false;
          });

          if (match) {
            // Found a live product match in the database catalog!
            hotspot.product = match;
          }
        });
      },
      error: (err) => {
        console.warn('Could not query live catalog products for hotspots. Running with mock luxury showroom products.', err);
      }
    });
  }

  selectHotspot(hotspot: Hotspot, event: Event): void {
    event.stopPropagation();
    if (this.selectedHotspot() === hotspot) {
      this.selectedHotspot.set(null);
    } else {
      this.selectedHotspot.set(hotspot);
    }
  }

  closeCard(): void {
    this.selectedHotspot.set(null);
  }

  isFavorited(productId: number): boolean {
    return this.favoritesService.isFavorited(productId);
  }

  toggleFavorite(product: IProduct, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.isTogglingFav()) return;
    this.isTogglingFav.set(true);

    if (this.isFavorited(product.id)) {
      this.favoritesService.removeFavorite(product.id).subscribe({
        next: () => {
          this.isTogglingFav.set(false);
        },
        error: () => {
          this.isTogglingFav.set(false);
        }
      });
    } else {
      this.favoritesService.addFavorite(product.id).subscribe({
        next: () => {
          this.isTogglingFav.set(false);
          
          // Trigger Success Toast
          const isAr = this.isArabic();
          const prodName = localized(product, 'name', this.translationService.currentLang());
          const msg = isAr ? `تم إضافة "${prodName}" إلى المفضلة` : `"${prodName}" added to favorites`;
          this.uiState.showAlert('success', msg, { 
            label: isAr ? 'عرض المفضلة' : 'View Favorites', 
            routerLink: '/favorites' 
          });
        },
        error: () => {
          this.isTogglingFav.set(false);
        }
      });
    }
  }

  addToCart(product: IProduct, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.cartService.isProductAdding(product.id)) {
      return;
    }

    this.cartService.addToCart(product).then(() => {
      // Trigger Success Toast
      const isAr = this.isArabic();
      const prodName = localized(product, 'name', this.translationService.currentLang());
      const msg = isAr ? `تم إضافة "${prodName}" إلى العربة بنجاح` : `"${prodName}" added to cart successfully`;
      this.uiState.showAlert('success', msg, { 
        label: isAr ? 'عرض العربة' : 'View Cart', 
        routerLink: '/cart' 
      });
    });
  }
}
