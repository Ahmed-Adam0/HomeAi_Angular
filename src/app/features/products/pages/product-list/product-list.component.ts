import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, Renderer2, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, from, of, forkJoin, Observable } from 'rxjs';
import { mergeMap, toArray, map, catchError } from 'rxjs/operators';
import { ReviewsService } from '../../services/reviews.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { IProduct } from '../../interfaces/iproduct';
import { ICategory } from '../../../categories/interfaces/icategory';
import { IProductFilter } from '../../interfaces/iproduct-filter';
import { ProductCard } from '../../../../shared/components/product-card/product-card.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    FormsModule,
    RouterLink,
    ProductCard,
    SkeletonLoader,
    EmptyStateComponent,
    TranslatePipe,
    PaginationComponent,
    AutoDirectionDirective,
    CustomDropdownComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductList implements OnInit, OnDestroy, AfterViewInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private reviewsService = inject(ReviewsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly translationService = inject(TranslationService);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  // States
  readonly products = signal<IProduct[]>([]);
  readonly categories = signal<ICategory[]>([]);
  readonly subCategories = signal<any[]>([]);
  readonly availableVendors = signal<{ id: number; nameAr: string; nameEn: string }[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);
  readonly totalCount = signal<number>(0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.activeFilters.limit)));
  isFiltersOpen = false;

  // Premium UI layout states
  readonly viewMode = signal<'large-grid' | 'compact-grid' | 'list'>('large-grid');

  // Active filters bound to forms and route parameters
  activeFilters: IProductFilter = {
    query: '',
    categoryId: '',
    subCategoryId: null,
    vendorId: null,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: 'newest',
    page: 1,
    limit: 10 // match default backend page size
  };

  private lastApiFiltersStr = '';
  private routeSub!: Subscription;
  private filterOptionsCache = new Map<string, { vendors: any[] }>();

  // Collapsible Accordion Sections State
  openSections: Record<string, boolean> = {
    search: true,
    category: true,
    subcategory: true,
    vendor: true,
    price: true
  };

  // Custom Dropdown Options computeds (reactive to language shifts)
  readonly categoryOptions = computed(() => {
    const isAr = this.translationService.currentLang() === 'ar';
    const list = this.categories().map(cat => ({
      value: cat.id.toString(),
      label: isAr ? cat.nameAr : cat.nameEn
    }));
    return [{ value: '', label: this.translationService.translate('FILTER_ALL_CATEGORIES') }, ...list];
  });

  readonly subCategoryOptions = computed(() => {
    const isAr = this.translationService.currentLang() === 'ar';
    const list = this.subCategories().map(sub => ({
      value: sub.id.toString(),
      label: isAr ? sub.nameAr : sub.nameEn
    }));
    return [{ value: '', label: this.translationService.translate('FILTER_ALL_SUBCATEGORIES') }, ...list];
  });

  readonly vendorOptions = computed(() => {
    const isAr = this.translationService.currentLang() === 'ar';
    const list = this.availableVendors().map(v => ({
      value: v.id.toString(),
      label: isAr ? v.nameAr : v.nameEn
    }));
    return [{ value: '', label: this.translationService.translate('FILTER_ALL_VENDORS') }, ...list];
  });

  readonly sortOptions = computed(() => {
    return [
      { value: 'newest', label: this.translationService.translate('CATALOG_SORT_NEWEST') },
      { value: 'price_asc', label: this.translationService.translate('CATALOG_SORT_PRICE_ASC') },
      { value: 'price_desc', label: this.translationService.translate('CATALOG_SORT_PRICE_DESC') }
    ];
  });

  readonly pageSizeOptions = computed(() => {
    const showText = this.translationService.translate('TOOLBAR_SHOW');
    return [
      { value: 10, label: `${showText} 10` },
      { value: 20, label: `${showText} 20` },
      { value: 30, label: `${showText} 30` },
      { value: 50, label: `${showText} 50` }
    ];
  });

  ngOnInit(): void {
    // Load categories first for dropdowns/filters
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });

    // Listen reactively to route parameter transitions
    this.routeSub = this.route.queryParams.subscribe((params) => {
      this.activeFilters.query = params['query'] || '';
      this.activeFilters.categoryId = params['categoryId'] || '';
      this.activeFilters.subCategoryId = params['subCategoryId'] || null;
      this.activeFilters.vendorId = params['vendorId'] || null;
      this.activeFilters.page = params['page'] ? parseInt(params['page']) : 1;
      this.activeFilters.sortBy = params['sortBy'] || 'newest';
      this.activeFilters.limit = params['limit'] ? parseInt(params['limit']) : 10;

      if (params['viewMode'] === 'large-grid' || params['viewMode'] === 'compact-grid' || params['viewMode'] === 'list') {
        this.viewMode.set(params['viewMode']);
      } else if (params['viewMode'] === 'grid') {
        this.viewMode.set('large-grid');
      }

      if (params['minPrice']) this.activeFilters.minPrice = parseFloat(params['minPrice']);
      else this.activeFilters.minPrice = undefined;

      if (params['maxPrice']) this.activeFilters.maxPrice = parseFloat(params['maxPrice']);
      else this.activeFilters.maxPrice = undefined;

      if (this.activeFilters.categoryId) {
        this.categoryService.getSubcategories(Number(this.activeFilters.categoryId)).subscribe({
          next: (data) => this.subCategories.set(data || []),
          error: () => this.subCategories.set([])
        });
      } else {
        this.subCategories.set([]);
      }

      this.loadFilterOptions(this.activeFilters.categoryId, this.activeFilters.subCategoryId);
      this.loadCatalog();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadFilterOptions(categoryId: string | undefined, subCategoryId: string | null | undefined): void {
    const cacheKey = `${categoryId || 'null'}_${subCategoryId || 'null'}`;
    if (this.filterOptionsCache.has(cacheKey)) {
      const cached = this.filterOptionsCache.get(cacheKey)!;
      this.availableVendors.set(cached.vendors);
      return;
    }

    const broadFilters: IProductFilter = {
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      page: 1,
      limit: 100
    };

    this.productService.getProducts(broadFilters).subscribe({
      next: (broadData) => {
        const productsList = broadData || [];
        const vendorMap = new Map<number, { id: number; nameAr: string; nameEn: string }>();
        productsList.forEach(p => {
          if (p.workshopId) {
            vendorMap.set(p.workshopId, {
              id: p.workshopId,
              nameAr: p.workshopNameAr || `ورشة ${p.workshopId}`,
              nameEn: p.workshopNameEn || `Workshop ${p.workshopId}`
            });
          }
        });
        const vendors = Array.from(vendorMap.values());
        this.availableVendors.set(vendors);
        this.filterOptionsCache.set(cacheKey, { vendors });
      },
      error: (err) => {
        console.error('Failed to load broad filter vendors', err);
      }
    });
  }

  loadCatalog(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    const apiFilters = {
      query: this.activeFilters.query || undefined,
      categoryId: this.activeFilters.categoryId || undefined,
      subCategoryId: this.activeFilters.subCategoryId || undefined,
      vendorId: this.activeFilters.vendorId || undefined,
      minPrice: this.activeFilters.minPrice || undefined,
      maxPrice: this.activeFilters.maxPrice || undefined,
      sortBy: this.activeFilters.sortBy || undefined,
      page: this.activeFilters.page,
      limit: this.activeFilters.limit
    };
    
    this.productService.getProductsPaginated(apiFilters).subscribe({
      next: (res) => {
        this.totalCount.set(res.totalItems);
        if (res.data.length === 0) {
          this.products.set([]);
          this.isLoading.set(false);
          return;
        }

        this.enrichProducts(res.data).subscribe({
          next: (enriched: IProduct[]) => {
            this.products.set(enriched);
            this.isLoading.set(false);
          },
          error: () => {
            this.products.set(res.data);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Catalog loading failure', err);
        this.products.set([]);
        this.totalCount.set(0);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  enrichProducts(products: IProduct[]): Observable<IProduct[]> {
    const needsFetch = products.filter(p => p.averageRating === undefined);
    if (needsFetch.length === 0) {
      return of(products);
    }

    return from(needsFetch).pipe(
      mergeMap((p: IProduct) => this.reviewsService.getProductRating(p.id).pipe(
        map(stats => {
          p.averageRating = stats.averageRating;
          p.totalReviews = stats.totalReviews;
          return p;
        }),
        catchError(() => {
          p.averageRating = 5.0;
          p.totalReviews = 0;
          return of(p);
        })
      ), 5),
      toArray(),
      map(() => products)
    );
  }

  applyFilters(): void {
    this.activeFilters.page = 1;
    this.updateRoute();
  }

  clearFilters(): void {
    this.activeFilters = {
      query: '',
      categoryId: '',
      subCategoryId: null,
      vendorId: null,
      materialOptionIds: [],
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'newest',
      page: 1,
      limit: 10
    };
    this.subCategories.set([]);
    this.updateRoute();
  }

  onPageChange(page: number): void {
    this.activeFilters.page = page;
    this.updateRoute();
  }

  onSortChange(value: string): void {
    this.activeFilters.sortBy = value as any;
    this.activeFilters.page = 1;
    this.updateRoute();
  }

  onPageSizeChange(value: number): void {
    this.activeFilters.limit = value;
    this.activeFilters.page = 1;
    this.updateRoute();
  }

  onCategoryChange(catId: string): void {
    this.activeFilters.categoryId = catId;
    this.activeFilters.subCategoryId = null;
    this.activeFilters.vendorId = null;
    this.activeFilters.page = 1;

    if (catId) {
      this.categoryService.getSubcategories(Number(catId)).subscribe({
        next: (data) => {
          this.subCategories.set(data || []);
          this.loadFilterOptions(catId, null);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Failed to load subcategories', err);
          this.subCategories.set([]);
          this.loadFilterOptions(catId, null);
          this.applyFilters();
        }
      });
    } else {
      this.subCategories.set([]);
      this.loadFilterOptions('', null);
      this.applyFilters();
    }
  }

  onSubCategoryChange(subCatId: string | null): void {
    this.activeFilters.subCategoryId = subCatId || null;
    this.activeFilters.vendorId = null;
    this.activeFilters.page = 1;

    this.loadFilterOptions(this.activeFilters.categoryId, subCatId);
    this.applyFilters();
  }

  onVendorChange(vendorId: string | null): void {
    this.activeFilters.vendorId = vendorId || null;
    this.activeFilters.page = 1;

    this.loadFilterOptions(this.activeFilters.categoryId, this.activeFilters.subCategoryId);
    this.applyFilters();
  }

  toggleFilters(open: boolean): void {
    this.isFiltersOpen = open;
  }

  toggleAccordionSection(section: string): void {
    this.openSections[section] = !this.openSections[section];
  }

  isAccordionSectionOpen(section: string, isMobile: boolean): boolean {
    return !!this.openSections[section];
  }

  private updateRoute(): void {
    const queryParams: any = {
      query: this.activeFilters.query || null,
      categoryId: this.activeFilters.categoryId || null,
      subCategoryId: this.activeFilters.subCategoryId || null,
      vendorId: this.activeFilters.vendorId || null,
      sortBy: this.activeFilters.sortBy || null,
      page: this.activeFilters.page > 1 ? this.activeFilters.page : null,
      minPrice: this.activeFilters.minPrice || null,
      maxPrice: this.activeFilters.maxPrice || null,
      limit: this.activeFilters.limit !== 10 ? this.activeFilters.limit : null,
      viewMode: this.viewMode() !== 'large-grid' ? this.viewMode() : null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const revealItems = this.el.nativeElement.querySelectorAll(
          '.catalog-toolbar, .products-grid-row > div, app-pagination'
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

