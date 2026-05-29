import { Component, inject, OnInit, OnDestroy, signal, ElementRef, Renderer2, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, isPlatformBrowser } from '@angular/common';
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

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    RouterLink,
    ProductCard,
    SkeletonLoader,
    EmptyStateComponent,
    TranslatePipe,
    PaginationComponent
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
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);
  readonly totalCount = signal<number>(0);

  // Active filters bound to forms and route parameters
  activeFilters: IProductFilter = {
    query: '',
    categoryId: '',
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    sortBy: 'newest',
    page: 1,
    limit: 6
  };

  // Internal visual limits
  priceLimitMin = 0;
  priceLimitMax = 3000;

  private allProductsFromApi: IProduct[] = [];
  private lastApiFiltersStr = '';
  private routeSub!: Subscription;

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
      this.activeFilters.page = params['page'] ? parseInt(params['page']) : 1;
      this.activeFilters.sortBy = params['sortBy'] || 'newest';

      if (params['minPrice']) this.activeFilters.minPrice = parseFloat(params['minPrice']);
      else this.activeFilters.minPrice = undefined;

      if (params['maxPrice']) this.activeFilters.maxPrice = parseFloat(params['maxPrice']);
      else this.activeFilters.maxPrice = undefined;

      if (params['minRating']) this.activeFilters.minRating = parseInt(params['minRating']);
      else this.activeFilters.minRating = undefined;

      this.loadCatalog();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadCatalog(): void {
    const apiFiltersJson = JSON.stringify({
      categoryId: this.activeFilters.categoryId,
      minPrice: this.activeFilters.minPrice,
      maxPrice: this.activeFilters.maxPrice,
      sortBy: this.activeFilters.sortBy
    });

    // If API filters haven't changed, perform instant client-side keyword search and pagination in memory.
    // This completely prevents unnecessary API requests, removes loading skeleton flickering, and eliminates typing lag.
    if (this.allProductsFromApi.length > 0 && apiFiltersJson === this.lastApiFiltersStr) {
      this.applyClientSideFilter();
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);
    this.lastApiFiltersStr = apiFiltersJson;
    
    // Always request up to 100 products from API to do premium client-side filtering and pagination slicing.
    const apiFilters = { ...this.activeFilters, query: '', limit: 100, page: 1 };
    
    this.productService.getProducts(apiFilters).subscribe({
      next: (data) => {
        this.allProductsFromApi = data || [];
        this.applyClientSideFilter();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Catalog loading failure', err);
        this.allProductsFromApi = [];
        this.products.set([]);
        this.totalCount.set(0);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  private preFilterAndSortProducts(): IProduct[] {
    let filtered = [...this.allProductsFromApi];
    
    if (this.activeFilters.query) {
      const q = this.activeFilters.query.toLowerCase().trim();
      filtered = filtered.filter(p => 
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
        (p.categoryNameEn && p.categoryNameEn.toLowerCase().includes(q)) ||
        (p.categoryNameAr && p.categoryNameAr.toLowerCase().includes(q)) ||
        (p.descriptionEn && p.descriptionEn.toLowerCase().includes(q)) ||
        (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
        (p.workshopNameEn && p.workshopNameEn.toLowerCase().includes(q)) ||
        (p.workshopNameAr && p.workshopNameAr.toLowerCase().includes(q))
      );
    }
    
    if (this.activeFilters.minPrice !== undefined && this.activeFilters.minPrice !== null) {
      filtered = filtered.filter(p => p.price >= this.activeFilters.minPrice!);
    }
    if (this.activeFilters.maxPrice !== undefined && this.activeFilters.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= this.activeFilters.maxPrice!);
    }
    
    if (this.activeFilters.categoryId) {
      filtered = filtered.filter(p => p.categoryId === Number(this.activeFilters.categoryId));
    }
    
    if (this.activeFilters.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.activeFilters.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return b.id - a.id;
      });
    }

    return filtered;
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

  private applyClientSideFilter(): void {
    const preFiltered = this.preFilterAndSortProducts();

    if (this.activeFilters.minRating === undefined || this.activeFilters.minRating === null) {
      this.totalCount.set(preFiltered.length);
      
      const totalPages = Math.ceil(preFiltered.length / this.activeFilters.limit) || 1;
      if (this.activeFilters.page > totalPages) {
        this.activeFilters.page = 1;
      }
      const startIndex = (this.activeFilters.page - 1) * this.activeFilters.limit;
      const endIndex = startIndex + this.activeFilters.limit;
      const paginatedProducts = preFiltered.slice(startIndex, endIndex);

      this.enrichProducts(paginatedProducts).subscribe({
        next: (enriched: IProduct[]) => {
          this.products.set(enriched);
        },
        error: () => {
          this.products.set(paginatedProducts);
        }
      });
    } else {
      this.enrichProducts(preFiltered).subscribe({
        next: (enriched: IProduct[]) => {
          const finalFiltered = enriched.filter((p: IProduct) => (p.averageRating ?? 0) >= this.activeFilters.minRating!);
          this.totalCount.set(finalFiltered.length);

          const totalPages = Math.ceil(finalFiltered.length / this.activeFilters.limit) || 1;
          if (this.activeFilters.page > totalPages) {
            this.activeFilters.page = 1;
          }
          const startIndex = (this.activeFilters.page - 1) * this.activeFilters.limit;
          const endIndex = startIndex + this.activeFilters.limit;
          const paginatedProducts = finalFiltered.slice(startIndex, endIndex);

          this.products.set(paginatedProducts);
        },
        error: () => {
          this.products.set([]);
          this.totalCount.set(0);
        }
      });
    }
  }

  calculateVirtualTotal(): void {
    // In a real API, the total item count is returned in a custom header (e.g. X-Total-Count) or body wrapper.
    // For this robust developer interface, we virtualize this based on selected category limits to show fluid pagination.
    let baseCount = 8; // Default mock items count
    if (this.activeFilters.categoryId) {
      const match = this.categories().find(c => c.id === Number(this.activeFilters.categoryId));
      baseCount = match ? 6 : 2;
    }

    // Simulate pagination total limit
    this.totalCount.set(baseCount);
  }

  applyFilters(): void {
    this.activeFilters.page = 1;
    this.updateRoute();
  }

  clearFilters(): void {
    this.activeFilters = {
      query: '',
      categoryId: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      sortBy: 'newest',
      page: 1,
      limit: 6
    };
    this.updateRoute();
  }

  toggleRatingFilter(stars: number): void {
    if (this.activeFilters.minRating === stars) {
      this.activeFilters.minRating = undefined;
    } else {
      this.activeFilters.minRating = stars;
    }
    this.activeFilters.page = 1;
    this.updateRoute();
  }

  onPageChange(page: number): void {
    this.activeFilters.page = page;
    this.updateRoute();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.activeFilters.sortBy = value as any;
    this.activeFilters.page = 1;
    this.updateRoute();
  }

  private updateRoute(): void {
    const queryParams: any = {
      query: this.activeFilters.query || null,
      categoryId: this.activeFilters.categoryId || null,
      sortBy: this.activeFilters.sortBy || null,
      page: this.activeFilters.page > 1 ? this.activeFilters.page : null,
      minPrice: this.activeFilters.minPrice || null,
      maxPrice: this.activeFilters.maxPrice || null,
      minRating: this.activeFilters.minRating || null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Delay observation to ensure browser layout coordinates and heights are fully calculated,
      // preventing race conditions where observed items trigger immediately on initialization.
      setTimeout(() => {
        const revealItems = this.el.nativeElement.querySelectorAll(
          '.filter-sidebar, .catalog-toolbar, .products-grid-row > div, app-pagination'
        );

        const observerOptions = {
          root: null,
          rootMargin: '0px 0px -20% 0px', // Trigger precisely when approximately 20% of section enters viewport
          threshold: 0.05
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.renderer.addClass(entry.target, 'reveal-visible');
              observer.unobserve(entry.target); // Trigger exactly once
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

