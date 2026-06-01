import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { VendorProductService } from '../../services/vendor-product.service';
import { ProductForm } from '../../components/product-form/product-form.component';
import { ImageUploader } from '../../components/image-uploader/image-uploader.component';
import { IProduct, IProductImage } from '../../../products/interfaces/iproduct';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-vendor-product-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductForm, ImageUploader],
  templateUrl: './vendor-product-edit.component.html',
  styleUrl: './vendor-product-edit.component.css'
})
export class VendorProductEdit implements OnInit {
  private vendorProductService = inject(VendorProductService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly productId = signal<string | number>('');
  readonly product = signal<IProduct | null>(null);
  
  readonly loading = signal<boolean>(true);
  readonly submitting = signal<boolean>(false);
  readonly uploading = signal<boolean>(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.productId.set(id);
        this.loadProduct(id);
      } else {
        void this.router.navigate(['/vendor/products']);
      }
    }
  }

  private loadProduct(id: string | number): void {
    this.loading.set(true);
    this.vendorProductService.getProductById(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product details', err);
        this.uiState.showAlert(
          'danger',
          this.translationService.currentLang() === 'ar'
            ? 'فشل تحميل بيانات المنتج.'
            : 'Failed to load product details.'
        );
        void this.router.navigate(['/vendor/products']);
      }
    });
  }

  onFormSubmit(updatedData: Partial<IProduct>): void {
    const isAr = this.translationService.currentLang() === 'ar';
    this.submitting.set(true);
    this.uiState.showLoader();

    const currentActive = this.product()?.isActive ?? true;
    const newActive = updatedData.isActive ?? true;
    const statusChanged = currentActive !== newActive;

    // Strict Update Payload matching PUT /api/Products/{id} - WITHOUT isActive to isolate status updates
    const productPayload = {
      categoryId: Number(updatedData.categoryId),
      nameAr: updatedData.nameAr || '',
      nameEn: updatedData.nameEn || '',
      descriptionAr: updatedData.descriptionAr || '',
      descriptionEn: updatedData.descriptionEn || '',
      price: Number(updatedData.price)
    };

    const updateObs = this.vendorProductService.updateProduct(this.productId(), productPayload);
    const statusObs = statusChanged
      ? this.vendorProductService.updateProductStatus(this.productId(), newActive)
      : of(null);

    forkJoin([updateObs, statusObs]).subscribe({
      next: ([updatedProd, statusResult]) => {
        // Ensure final product model reflects the active status
        const finalProduct = {
          ...updatedProd,
          isActive: newActive
        };
        this.product.set(finalProduct);

        this.submitting.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr
            ? 'تم حفظ تفاصيل المنتج بنجاح.'
            : 'Product details saved successfully.'
        );
      },
      error: (err) => {
        console.error('Failed to update product', err);
        this.uiState.showAlert(
          'danger',
          isAr
            ? 'فشل تحديث بيانات المنتج.'
            : 'Failed to update product details.'
        );
        this.submitting.set(false);
        this.uiState.hideLoader();
      }
    });
  }

  onCancel(): void {
    void this.router.navigate(['/vendor/products']);
  }

  onUploadImages(files: File[]): void {
    const isAr = this.translationService.currentLang() === 'ar';
    this.uploading.set(true);
    this.uiState.showLoader();

    this.vendorProductService.uploadImages(this.productId(), files).subscribe({
      next: (images) => {
        this.uploading.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم رفع الصور بنجاح.' : 'Images uploaded successfully.'
        );
        
        // Refresh product to pull in the newly uploaded images gallery
        this.loadProduct(this.productId());
      },
      error: (err) => {
        console.error('Failed to upload images', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل رفع الصور.' : 'Failed to upload images.'
        );
        this.uploading.set(false);
        this.uiState.hideLoader();
      }
    });
  }

  onDeleteImage(imageId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    if (confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذه الصورة؟' : 'Are you sure you want to delete this image?')) {
      this.uiState.showLoader();
      this.vendorProductService.deleteImage(this.productId(), imageId).subscribe({
        next: () => {
          this.uiState.hideLoader();
          this.uiState.showAlert(
            'success',
            isAr ? 'تم حذف الصورة بنجاح.' : 'Image deleted successfully.'
          );
          // Update local state by filtering out the image
          this.product.update(current => {
            if (!current) return null;
            const updatedImages = (current.images || []).filter(img => img.id !== imageId);
            return { ...current, images: updatedImages };
          });
        },
        error: (err) => {
          console.error('Failed to delete image', err);
          this.uiState.showAlert(
            'danger',
            isAr ? 'فشل حذف الصورة.' : 'Failed to delete image.'
          );
          this.uiState.hideLoader();
        }
      });
    }
  }

  onSetPrimaryImage(imageId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    this.uiState.showLoader();
    this.vendorProductService.setPrimaryImage(this.productId(), imageId).subscribe({
      next: () => {
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم تعيين الصورة كغلاف رئيسي.' : 'Image set as primary cover successfully.'
        );
        // Update local images list mapping to set this one as primary and reset others
        this.product.update(current => {
          if (!current) return null;
          const updatedImages = (current.images || []).map(img => ({
            ...img,
            isPrimary: img.id === imageId
          }));
          return { ...current, images: updatedImages };
        });
      },
      error: (err) => {
        console.error('Failed to set primary image', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل تعيين الصورة الرئيسية.' : 'Failed to set primary image.'
        );
        this.uiState.hideLoader();
      }
    });
  }
}
