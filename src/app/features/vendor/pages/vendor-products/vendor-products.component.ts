import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { VendorProductService } from '../../services/vendor-product.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { DialogService } from '../../../../shared/services/dialog.service';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../categories/interfaces/icategory';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

@Component({
  selector: 'app-vendor-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CustomDropdownComponent,
    CurrencyFormatPipe,
    LocalizedPipe,
    LazyImageDirective
  ],
  templateUrl: './vendor-products.component.html',
  styleUrl: './vendor-products.component.css'
})
export class VendorProducts implements OnInit {
  private vendorProductService = inject(VendorProductService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private dialogService = inject(DialogService);
  private platformId = inject(PLATFORM_ID);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  readonly products = this.vendorProductService.products;
  readonly loading = signal<boolean>(true);
  
  // Filter & View State signals
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('all');
  readonly selectedStatus = signal<string>('all');
  readonly selectedSort = signal<string>('newest');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly categories = signal<ICategory[]>([]);



  // Quick View drawer signals
  readonly selectedProductForView = signal<IProduct | null>(null);
  readonly activeImageIndex = signal<number>(0);

  // Computed totals for stats badges
  readonly totalCount = computed(() => this.products().length);
  readonly activeCount = computed(() => this.products().filter(p => p.isActive ?? true).length);
  readonly archivedCount = computed(() => this.products().filter(p => !(p.isActive ?? true)).length);

  // Computed list of all unique images for the Quick View gallery
  readonly productImagesList = computed(() => {
    const prod = this.selectedProductForView();
    if (!prod) return [];
    
    const list: string[] = [];
    if (prod.mainImageUrl) {
      list.push(prod.mainImageUrl);
    }
    if (prod.images && prod.images.length > 0) {
      prod.images.forEach(img => {
        if (img.imageUrl && !list.includes(img.imageUrl)) {
          list.push(img.imageUrl);
        }
      });
    }
    return list;
  });

  // Computed Dropdown Options (reactive to language shifts)
  readonly categoryOptions = computed(() => {
    const isAr = this.translationService.currentLang() === 'ar';
    const list = this.categories().map(cat => ({
      value: cat.id.toString(),
      label: isAr ? cat.nameAr : cat.nameEn
    }));
    return [{ value: 'all', label: isAr ? 'كل الفئات' : 'All Categories' }, ...list];
  });

  readonly statusOptions = computed(() => {
    const isAr = this.translationService.currentLang() === 'ar';
    return [
      { value: 'all', label: isAr ? 'كل الحالات' : 'All Statuses' },
      { value: 'active', label: isAr ? 'نشط' : 'Active' },
      { value: 'archived', label: isAr ? 'مؤرشف' : 'Archived' }
    ];
  });

  readonly sortOptions = computed(() => {
    const isAr = this.translationService.currentLang() === 'ar';
    return [
      { value: 'newest', label: isAr ? 'الأحدث' : 'Newest' },
      { value: 'price_asc', label: isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High' },
      { value: 'price_desc', label: isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low' },
      { value: 'rating', label: isAr ? 'التقييم' : 'Rating' },
      { value: 'name_asc', label: isAr ? 'الاسم: أ-ي' : 'Name: A-Z' }
    ];
  });

  // Filtered and Sorted Products list
  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategory();
    const status = this.selectedStatus();
    const sort = this.selectedSort();
    const products = this.products();

    let filtered = [...products];

    // 1. Apply search query filter
    if (query) {
      filtered = filtered.filter(product => {
        const nameAr = (product.nameAr || '').toLowerCase();
        const nameEn = (product.nameEn || '').toLowerCase();
        const descAr = (product.descriptionAr || '').toLowerCase();
        const descEn = (product.descriptionEn || '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(query) || descAr.includes(query) || descEn.includes(query);
      });
    }

    // 2. Apply category filter
    if (catId && catId !== 'all') {
      const idNum = parseInt(catId, 10);
      filtered = filtered.filter(product => product.categoryId === idNum);
    }

    // 3. Apply status filter
    if (status && status !== 'all') {
      const isAct = status === 'active';
      filtered = filtered.filter(product => {
        const currentActive = product.isActive ?? true;
        return currentActive === isAct;
      });
    }

    // 4. Apply sort
    filtered.sort((a, b) => {
      if (sort === 'price_asc') {
        return a.price - b.price;
      } else if (sort === 'price_desc') {
        return b.price - a.price;
      } else if (sort === 'rating') {
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      } else if (sort === 'name_asc') {
        const nameA = this.translationService.currentLang() === 'ar' ? (a.nameAr || '') : (a.nameEn || '');
        const nameB = this.translationService.currentLang() === 'ar' ? (b.nameAr || '') : (b.nameEn || '');
        return nameA.localeCompare(nameB);
      } else {
        // newest
        return b.id - a.id;
      }
    });

    return filtered;
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProducts();
      this.loadCategories();
    }
  }

  loadProducts(): void {
    this.loading.set(true);
    this.vendorProductService.getVendorProducts().subscribe({
      next: (data) => {
        this.products.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load vendor products', err);
        this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل تحميل المنتجات.' : 'Failed to load products.');
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data || []);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onCategoryChange(catId: any): void {
    this.selectedCategory.set(catId);
  }

  onStatusFilterChange(status: any): void {
    this.selectedStatus.set(status);
  }

  onSortChange(sort: any): void {
    this.selectedSort.set(sort);
  }

  toggleViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  async onDeleteProduct(productId: number): Promise<void> {
    const isAr = this.translationService.currentLang() === 'ar';
    const confirmed = await this.dialogService.openConfirm({
      title: isAr ? 'حذف المنتج' : 'Delete Product',
      message: isAr ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product?',
      confirmText: isAr ? 'حذف' : 'Delete',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
    });

    if (!confirmed) return;

    this.uiState.showLoader();
    this.vendorProductService.deleteProduct(productId).subscribe({
      next: () => {
        this.products.update(prev => prev.filter(p => p.id !== productId));
        this.uiState.showAlert('success', isAr ? 'تم حذف المنتج بنجاح.' : 'Product deleted successfully.');
        this.uiState.hideLoader();
      },
      error: (err) => {
        console.error('Failed to delete product', err);
        this.uiState.showAlert('danger', isAr ? 'فشل حذف المنتج.' : 'Failed to delete product.');
        this.uiState.hideLoader();
      }
    });
  }

  onStatusChange(event: { id: number; isActive: boolean }): void {
    const isAr = this.translationService.currentLang() === 'ar';

    this.vendorProductService.updateProductStatus(event.id, event.isActive).subscribe({
      next: () => {
        this.products.update(prev => prev.map(p => p.id === event.id ? { ...p, isActive: event.isActive } : p));
        this.uiState.showAlert('success', isAr ? 'تم تحديث حالة المنتج.' : 'Product status updated successfully.');
      },
      error: (err) => {
        console.error('Failed to update product status:', err);
        this.uiState.showAlert('danger', isAr ? 'فشل تحديث حالة المنتج.' : 'Failed to update product status.');
        // Revert UI checkbox
        this.products.update(prev => [...prev]);
      }
    });
  }

  async onStatusToggle(productId: number, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const newStatus = checkbox.checked;
    
    const isAr = this.translationService.currentLang() === 'ar';
    if (!newStatus) {
      const confirmed = await this.dialogService.openConfirm({
        title: isAr ? 'أرشفة المنتج' : 'Archive Product',
        message: isAr 
          ? 'هل أنت متأكد من رغبتك في أرشفة هذا المنتج؟ سيتم إزالته من المتجر العام وإخفائه عن العملاء.' 
          : 'Are you sure you want to archive this product? It will be removed from the public marketplace and hidden from customers.',
        confirmText: isAr ? 'أرشفة' : 'Archive',
        cancelText: isAr ? 'إلغاء' : 'Cancel',
        variant: 'warning',
      });
      if (!confirmed) {
        checkbox.checked = true;
        return;
      }
    } else {
      const confirmed = await this.dialogService.openConfirm({
        title: isAr ? 'إعادة تفعيل المنتج' : 'Reactivate Product',
        message: isAr 
          ? 'هل ترغب في إعادة تفعيل هذا المنتج وعرضه في المتجر للعملاء؟' 
          : 'Do you want to re-activate this product and show it in the marketplace to customers?',
        confirmText: isAr ? 'تفعيل' : 'Activate',
        cancelText: isAr ? 'إلغاء' : 'Cancel',
        variant: 'info',
      });
      if (!confirmed) {
        checkbox.checked = false;
        return;
      }
    }
    
    this.onStatusChange({ id: productId, isActive: newStatus });
  }

  onOpenQuickView(product: IProduct, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Set basic info first (so the UI opens instantly)
    this.selectedProductForView.set(product);
    this.activeImageIndex.set(0);

    // Fetch full product details (images, description, materials, etc.)
    this.vendorProductService.getProductById(product.id).subscribe({
      next: (fullProduct) => {
        if (this.selectedProductForView()?.id === product.id) {
          this.selectedProductForView.set(fullProduct);
        }
      },
      error: (err) => {
        console.error('Failed to load full product details', err);
      }
    });
  }

  onCloseQuickView(): void {
    this.selectedProductForView.set(null);
  }

  onProductSaved(): void {
    this.loadProducts();
  }

  selectImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  async onDeleteFromQuickView(): Promise<void> {
    const prod = this.selectedProductForView();
    if (!prod) return;
    
    const isAr = this.translationService.currentLang() === 'ar';
    const confirmed = await this.dialogService.openConfirm({
      title: isAr ? 'حذف المنتج' : 'Delete Product',
      message: isAr ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product?',
      confirmText: isAr ? 'حذف' : 'Delete',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
    });

    if (!confirmed) return;

    this.uiState.showLoader();
    this.vendorProductService.deleteProduct(prod.id).subscribe({
      next: () => {
        this.products.update(prev => prev.filter(p => p.id !== prod.id));
        this.onCloseQuickView();
        this.uiState.showAlert('success', isAr ? 'تم حذف المنتج بنجاح.' : 'Product deleted successfully.');
        this.uiState.hideLoader();
      },
      error: (err) => {
        console.error('Failed to delete product', err);
        this.uiState.showAlert('danger', isAr ? 'فشل حذف المنتج.' : 'Failed to delete product.');
        this.uiState.hideLoader();
      }
    });
  }
}
