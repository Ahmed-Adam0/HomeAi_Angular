import { Component, inject, OnInit, OnDestroy, signal, ElementRef, Renderer2, PLATFORM_ID, AfterViewInit } from '@angular/core';
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
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';

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
    LocalizedPipe,
    AutoDirectionDirective
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
  readonly availableMaterialGroups = signal<any[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);
  readonly totalCount = signal<number>(0);
  isMobileFiltersOpen = false;
  activeAccordionSection: string | null = 'category';

  // Active filters bound to forms and route parameters
  activeFilters: IProductFilter = {
    query: '',
    categoryId: '',
    subCategoryId: null,
    vendorId: null,
    materialOptionIds: [],
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    isFeatured: undefined,
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
  private filterOptionsCache = new Map<string, { vendors: any[], groups: any[] }>();

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

      const matIds = params['materialOptionIds'];
      if (matIds) {
        this.activeFilters.materialOptionIds = Array.isArray(matIds)
          ? matIds.map(Number)
          : matIds.toString().split(',').map(Number).filter((n: number) => !isNaN(n));
      } else {
        this.activeFilters.materialOptionIds = [];
      }

      if (params['minPrice']) this.activeFilters.minPrice = parseFloat(params['minPrice']);
      else this.activeFilters.minPrice = undefined;

      if (params['maxPrice']) this.activeFilters.maxPrice = parseFloat(params['maxPrice']);
      else this.activeFilters.maxPrice = undefined;

      if (params['minRating']) this.activeFilters.minRating = parseInt(params['minRating']);
      else this.activeFilters.minRating = undefined;

      this.activeFilters.isFeatured = params['isFeatured'] === 'true';

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
    const vendorId = this.activeFilters.vendorId;
    const cacheKey = `${categoryId || 'null'}_${subCategoryId || 'null'}_${vendorId || 'null'}`;
    if (this.filterOptionsCache.has(cacheKey)) {
      const cached = this.filterOptionsCache.get(cacheKey)!;
      this.availableVendors.set(cached.vendors);
      this.availableMaterialGroups.set(cached.groups);
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

        // If no vendor is selected, we don't display or load materials
        if (!vendorId) {
          this.availableMaterialGroups.set([]);
          this.filterOptionsCache.set(cacheKey, { vendors, groups: [] });
          return;
        }

        // A vendor IS selected, so load products and their materials specifically for this category/subcategory/vendor
        const vendorFilters: IProductFilter = {
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined,
          vendorId: vendorId || undefined,
          page: 1,
          limit: 20
        };

        this.productService.getProducts(vendorFilters).subscribe({
          next: (vendorData) => {
            const vendorProducts = vendorData || [];
            if (vendorProducts.length === 0) {
              this.availableMaterialGroups.set([]);
              this.filterOptionsCache.set(cacheKey, { vendors, groups: [] });
              return;
            }

            const detailsRequests = vendorProducts.map(p =>
              this.productService.getProductById(p.id).pipe(
                catchError(() => of(p))
              )
            );

            forkJoin(detailsRequests).subscribe({
              next: (detailedProducts) => {
                const groupMap = new Map<number, {
                  id: number;
                  nameAr: string;
                  nameEn: string;
                  optionsMap: Map<number, { id: number; valueAr: string; valueEn: string; priceDelta: number }>
                }>();

                detailedProducts.forEach(p => {
                  if (p.materials && Array.isArray(p.materials)) {
                    p.materials.forEach((group: any) => {
                      if (!group.materialId) return;

                      if (!groupMap.has(group.materialId)) {
                        groupMap.set(group.materialId, {
                          id: group.materialId,
                          nameAr: group.nameAr || group.name || '',
                          nameEn: group.nameEn || group.name || '',
                          optionsMap: new Map()
                        });
                      }

                      const existingGroup = groupMap.get(group.materialId)!;
                      if (group.options && Array.isArray(group.options)) {
                        group.options.forEach((opt: any) => {
                          if (!opt.id) return;
                          existingGroup.optionsMap.set(opt.id, {
                            id: opt.id,
                            valueAr: opt.valueAr || opt.name || '',
                            valueEn: opt.valueEn || opt.name || '',
                            priceDelta: opt.priceDelta || 0
                          });
                        });
                      }
                    });
                  }
                });

                const groups = Array.from(groupMap.values()).map(g => ({
                  id: g.id,
                  nameAr: g.nameAr,
                  nameEn: g.nameEn,
                  options: Array.from(g.optionsMap.values())
                }));

                this.filterOptionsCache.set(cacheKey, { vendors, groups });
                this.availableMaterialGroups.set(groups);
              },
              error: (err) => {
                console.error('Failed to load detailed vendor products for materials', err);
              }
            });
          },
          error: (err) => {
            console.error('Failed to load broad vendor products for materials', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load broad filter vendors', err);
      }
    });
  }

  loadCatalog(): void {
    const apiFiltersJson = JSON.stringify({
      categoryId: this.activeFilters.categoryId,
      subCategoryId: this.activeFilters.subCategoryId,
      vendorId: this.activeFilters.vendorId
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
    // Only pass backend-supported filters: categoryId, subCategoryId, and vendorId.
    const apiFilters = {
      categoryId: this.activeFilters.categoryId || undefined,
      subCategoryId: this.activeFilters.subCategoryId || undefined,
      vendorId: this.activeFilters.vendorId || undefined,
      limit: 100,
      page: 1
    };
    
    this.productService.getProducts(apiFilters).subscribe({
      next: (data) => {
        const productsList = data || [];
        if (productsList.length === 0) {
          this.allProductsFromApi = [];
          this.applyClientSideFilter();
          this.isLoading.set(false);
          return;
        }

        // Fetch details for each product in parallel to populate materials and vendorMaterialOptionIds
        const detailsRequests = productsList.map(p => 
          this.productService.getProductById(p.id).pipe(
            catchError(() => of(p)) // fallback to basic product if details call fails
          )
        );

        forkJoin(detailsRequests).subscribe({
          next: (detailedProducts) => {
            this.allProductsFromApi = detailedProducts;
            this.applyClientSideFilter();
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error fetching product details', err);
            this.allProductsFromApi = productsList;
            this.applyClientSideFilter();
            this.isLoading.set(false);
          }
        });
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

    if (this.activeFilters.subCategoryId) {
      filtered = filtered.filter(p => p.subCategoryId === Number(this.activeFilters.subCategoryId));
    }

    if (this.activeFilters.vendorId) {
      filtered = filtered.filter(p => p.workshopId === Number(this.activeFilters.vendorId));
    }

    if (this.activeFilters.materialOptionIds && this.activeFilters.materialOptionIds.length > 0) {
      let groups = this.availableMaterialGroups();
      if (groups.length === 0 && this.allProductsFromApi.length > 0) {
        // extract group list on the fly to avoid race conditions
        const groupMap = new Map<number, { id: number; options: { id: number }[] }>();
        this.allProductsFromApi.forEach(p => {
          if (p.materials && Array.isArray(p.materials)) {
            p.materials.forEach((g: any) => {
              if (!g.materialId) return;
              if (!groupMap.has(g.materialId)) {
                groupMap.set(g.materialId, { id: g.materialId, options: [] });
              }
              const groupObj = groupMap.get(g.materialId)!;
              if (g.options && Array.isArray(g.options)) {
                g.options.forEach((opt: any) => {
                  if (opt.id && !groupObj.options.some((o: any) => o.id === opt.id)) {
                    groupObj.options.push({ id: opt.id });
                  }
                });
              }
            });
          }
        });
        groups = Array.from(groupMap.values());
      }

      const groupsWithSelectedOptions = groups.map(group => {
        const selectedIdsInGroup = group.options
          .map((opt: any) => opt.id)
          .filter((id: number) => this.activeFilters.materialOptionIds!.includes(id));
        return selectedIdsInGroup;
      }).filter(selectedIds => selectedIds.length > 0);

      filtered = filtered.filter(p => {
        if (!p.vendorMaterialOptionIds || p.vendorMaterialOptionIds.length === 0) {
          return false;
        }
        return groupsWithSelectedOptions.every(selectedIds => 
          selectedIds.some((id: number) => p.vendorMaterialOptionIds!.includes(id))
        );
      });
    }

    if (this.activeFilters.isFeatured) {
      filtered = filtered.filter(p => (p as any).isFeatured);
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
    let baseCount = 8;
    if (this.activeFilters.categoryId) {
      const match = this.categories().find(c => c.id === Number(this.activeFilters.categoryId));
      baseCount = match ? 6 : 2;
    }
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
      subCategoryId: null,
      vendorId: null,
      materialOptionIds: [],
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      isFeatured: undefined,
      sortBy: 'newest',
      page: 1,
      limit: 6
    };
    this.subCategories.set([]);
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

  onCategoryChange(catId: string): void {
    this.activeFilters.categoryId = catId;
    this.activeFilters.subCategoryId = null;
    this.activeFilters.vendorId = null;
    this.activeFilters.materialOptionIds = [];
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
    this.activeFilters.materialOptionIds = [];
    this.activeFilters.page = 1;

    this.loadFilterOptions(this.activeFilters.categoryId, subCatId);
    this.applyFilters();
  }

  onVendorChange(vendorId: string | null): void {
    this.activeFilters.vendorId = vendorId || null;
    this.activeFilters.materialOptionIds = [];
    this.activeFilters.page = 1;

    this.loadFilterOptions(this.activeFilters.categoryId, this.activeFilters.subCategoryId);
    this.applyFilters();
  }

  getSelectedOptionForGroup(groupId: number): number | null {
    if (!this.activeFilters.materialOptionIds || this.activeFilters.materialOptionIds.length === 0) {
      return null;
    }
    const group = this.availableMaterialGroups().find(g => g.id === groupId);
    if (!group) return null;
    const groupOptionIds = group.options.map((opt: any) => opt.id);
    const selected = this.activeFilters.materialOptionIds.find(id => groupOptionIds.includes(id));
    return selected !== undefined ? selected : null;
  }

  onMaterialOptionGroupChange(groupId: number, optionId: number | null): void {
    if (!this.activeFilters.materialOptionIds) {
      this.activeFilters.materialOptionIds = [];
    }

    const group = this.availableMaterialGroups().find(g => g.id === groupId);
    if (!group) return;
    const groupOptionIds = group.options.map((opt: any) => opt.id);

    // Filter out any other selections from this group
    this.activeFilters.materialOptionIds = this.activeFilters.materialOptionIds.filter(
      id => !groupOptionIds.includes(id)
    );

    if (optionId !== null && optionId !== undefined) {
      this.activeFilters.materialOptionIds.push(optionId);
    }

    this.applyFilters();
  }

  toggleMobileFilters(open: boolean): void {
    this.isMobileFiltersOpen = open;
  }

  toggleAccordionSection(section: string): void {
    if (this.activeAccordionSection === section) {
      this.activeAccordionSection = null;
    } else {
      this.activeAccordionSection = section;
    }
  }

  isAccordionSectionOpen(section: string, isMobile: boolean): boolean {
    if (!isMobile) {
      return true;
    }
    return this.activeAccordionSection === section;
  }

  extractFiltersFromProducts(products: IProduct[]): void {
    const vendorMap = new Map<number, { id: number; nameAr: string; nameEn: string }>();
    const groupMap = new Map<number, {
      id: number;
      nameAr: string;
      nameEn: string;
      optionsMap: Map<number, { id: number; valueAr: string; valueEn: string; priceDelta: number }>
    }>();

    products.forEach(p => {
      if (p.workshopId) {
        vendorMap.set(p.workshopId, {
          id: p.workshopId,
          nameAr: p.workshopNameAr || `ورشة ${p.workshopId}`,
          nameEn: p.workshopNameEn || `Workshop ${p.workshopId}`
        });
      }

      if (p.materials && Array.isArray(p.materials)) {
        p.materials.forEach((group: any) => {
          if (!group.materialId) return;

          if (!groupMap.has(group.materialId)) {
            groupMap.set(group.materialId, {
              id: group.materialId,
              nameAr: group.nameAr || group.name || '',
              nameEn: group.nameEn || group.name || '',
              optionsMap: new Map()
            });
          }

          const existingGroup = groupMap.get(group.materialId)!;
          if (group.options && Array.isArray(group.options)) {
            group.options.forEach((opt: any) => {
              if (!opt.id) return;
              existingGroup.optionsMap.set(opt.id, {
                id: opt.id,
                valueAr: opt.valueAr || opt.name || '',
                valueEn: opt.valueEn || opt.name || '',
                priceDelta: opt.priceDelta || 0
              });
            });
          }
        });
      }
    });

    this.availableVendors.set(Array.from(vendorMap.values()));

    const groups = Array.from(groupMap.values()).map(g => ({
      id: g.id,
      nameAr: g.nameAr,
      nameEn: g.nameEn,
      options: Array.from(g.optionsMap.values())
    }));
    this.availableMaterialGroups.set(groups);
  }

  private updateRoute(): void {
    const queryParams: any = {
      query: this.activeFilters.query || null,
      categoryId: this.activeFilters.categoryId || null,
      subCategoryId: this.activeFilters.subCategoryId || null,
      vendorId: this.activeFilters.vendorId || null,
      materialOptionIds: this.activeFilters.materialOptionIds && this.activeFilters.materialOptionIds.length > 0
        ? this.activeFilters.materialOptionIds.join(',')
        : null,
      sortBy: this.activeFilters.sortBy || null,
      page: this.activeFilters.page > 1 ? this.activeFilters.page : null,
      minPrice: this.activeFilters.minPrice || null,
      maxPrice: this.activeFilters.maxPrice || null,
      minRating: this.activeFilters.minRating || null,
      isFeatured: this.activeFilters.isFeatured ? 'true' : null
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

