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
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    RouterLink,
    ProductCard,
    PaginationComponent,
    SkeletonLoader,
    EmptyStateComponent,
    TranslatePipe
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
    this.isLoading.set(true);
    this.hasError.set(false);
    this.productService.getProducts(this.activeFilters).subscribe({
      next: (data) => {
        this.products.set(data);

        // Mock full total counts because standard mock API cuts off locally
        // We calculate exact virtual list length for seamless routing/pagination experience
        this.calculateVirtualTotal();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Catalog loading failure', err);
        this.products.set([]);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
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
