import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class ProductList implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly translationService = inject(TranslationService);

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

  private applyClientSideFilter(): void {
    let filtered = [...this.allProductsFromApi];
    
    // 1. Live Search keyword filtering (name, category, description, and workshop in En/Ar)
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
    
    // 2. Pricing Threshold Live Filtering
    if (this.activeFilters.minPrice !== undefined && this.activeFilters.minPrice !== null) {
      filtered = filtered.filter(p => p.price >= this.activeFilters.minPrice!);
    }
    if (this.activeFilters.maxPrice !== undefined && this.activeFilters.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= this.activeFilters.maxPrice!);
    }
    
    // 3. Category Filter Live Filtering (fallback)
    if (this.activeFilters.categoryId) {
      filtered = filtered.filter(p => p.categoryId === Number(this.activeFilters.categoryId));
    }
    
    // 4. Client-side Sorting
    if (this.activeFilters.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.activeFilters.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // 'newest' sort option: sort by createdAt descending, fallback to id descending
      filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return b.id - a.id;
      });
    }
    
    // Update total count with filtered list size
    this.totalCount.set(filtered.length);
    
    // 5. Apply Client-Side Pagination Slicing
    const totalPages = Math.ceil(filtered.length / this.activeFilters.limit) || 1;
    if (this.activeFilters.page > totalPages) {
      this.activeFilters.page = 1;
    }
    
    const startIndex = (this.activeFilters.page - 1) * this.activeFilters.limit;
    const endIndex = startIndex + this.activeFilters.limit;
    const paginatedProducts = filtered.slice(startIndex, endIndex);
    
    this.products.set(paginatedProducts);
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
      sortBy: 'newest',
      page: 1,
      limit: 6
    };
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
      maxPrice: this.activeFilters.maxPrice || null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
}
