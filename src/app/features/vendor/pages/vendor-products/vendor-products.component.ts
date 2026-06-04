import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendorProductService } from '../../services/vendor-product.service';
import { ProductCard } from '../../../../shared/components/product-card/product-card.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { localized } from '../../../../shared/utils/localized';

@Component({
  selector: 'app-vendor-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './vendor-products.component.html',
  styleUrl: './vendor-products.component.css'
})
export class VendorProducts implements OnInit {
  private vendorProductService = inject(VendorProductService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly products = this.vendorProductService.products;
  readonly loading = signal<boolean>(true);
  
  readonly searchQuery = signal<string>('');

  // Filtered Products list
  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const products = this.products();

    let filtered = products;

    // Apply search query filter
    if (query) {
      filtered = filtered.filter(product => {
        const nameAr = (product.nameAr || '').toLowerCase();
        const nameEn = (product.nameEn || '').toLowerCase();
        const descAr = (product.descriptionAr || '').toLowerCase();
        const descEn = (product.descriptionEn || '').toLowerCase();
        return nameAr.includes(query) || nameEn.includes(query) || descAr.includes(query) || descEn.includes(query);
      });
    }

    return filtered;
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProducts();
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

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onDeleteProduct(productId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    const confirmMsg = isAr ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product?';
    
    if (confirm(confirmMsg)) {
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
}
