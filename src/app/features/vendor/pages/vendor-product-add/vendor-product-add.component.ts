import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { VendorProductService } from '../../services/vendor-product.service';
import { ProductForm } from '../../components/product-form/product-form.component';
import { ImageUploader } from '../../components/image-uploader/image-uploader.component';
import { IProduct } from '../../../products/interfaces/iproduct';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { AuthService } from '../../../auth/services/auth.service';
import { localized } from '../../../../shared/utils/localized';

@Component({
  selector: 'app-vendor-product-add',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductForm, ImageUploader],
  templateUrl: './vendor-product-add.component.html',
  styleUrl: './vendor-product-add.component.css'
})
export class VendorProductAdd {
  private vendorProductService = inject(VendorProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);

  readonly submitting = signal<boolean>(false);
  
  selectedFiles: File[] = [];
  primaryIndex = 0;

  onFilesSelected(event: { files: File[]; primaryIndex: number }): void {
    this.selectedFiles = event.files;
    this.primaryIndex = event.primaryIndex;
  }

  onFormSubmit(productData: Partial<IProduct>): void {
    const isAr = this.translationService.currentLang() === 'ar';
    this.submitting.set(true);
    this.uiState.showLoader();

    // Strict Creation Payload matching POST /api/Products
    const productPayload = {
      name: productData.nameEn || productData.nameAr || '',
      description: productData.descriptionEn || productData.descriptionAr || '',
      basePrice: Number(productData.price),
      productTypeId: Number(productData.productTypeId),
      categoryId: Number(productData.categoryId),
      subCategoryId: Number(productData.subCategoryId),
      nameAr: productData.nameAr || '',
      nameEn: productData.nameEn || '',
      descriptionAr: productData.descriptionAr || '',
      descriptionEn: productData.descriptionEn || '',
      price: Number(productData.price),
      isActive: productData.isActive ?? true,
      materialOptions: (productData as any).materialOptions || []
    };

    // 1. Create Product first
    this.vendorProductService.createProduct(productPayload).pipe(
      switchMap((createdProduct) => {
        const productId = createdProduct.id;
        
        // 2. If there are no images, just return an observable of null and proceed
        if (this.selectedFiles.length === 0) {
          return of({ productId, images: [] });
        }
        
        // 3. Upload selected images and set primary index directly
        return this.vendorProductService.uploadImages(productId, this.selectedFiles, this.primaryIndex).pipe(
          switchMap((uploadedImages) => {
            return of({ productId, images: uploadedImages });
          }),
          catchError((uploadErr) => {
            console.error('Failed to upload images, but product created.', uploadErr);
            throw new Error('image_upload_failed');
          })
        );
      })
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr
            ? 'تم إنشاء المنتج ورفع الصور بنجاح.'
            : 'Product created and images uploaded successfully.'
        );
        void this.router.navigate(['/vendor/products']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.uiState.hideLoader();
        
        if (err.message === 'image_upload_failed') {
          this.uiState.showAlert(
            'warning',
            isAr
              ? 'تم إنشاء المنتج ولكن فشل رفع الصور. يمكنك المحاولة مجدداً من صفحة التعديل.'
              : 'Product created, but image upload failed. You can retry from the Edit page.'
          );
          void this.router.navigate(['/vendor/products']);
        } else {
          console.error('Product creation pipeline failed', err);
          this.uiState.showAlert(
            'danger',
            isAr
              ? 'فشل إنشاء المنتج. يرجى مراجعة البيانات والمحاولة مرة أخرى.'
              : 'Failed to create product. Please verify details and try again.'
          );
        }
      }
    });
  }

  onCancel(): void {
    void this.router.navigate(['/vendor/products']);
  }
}
