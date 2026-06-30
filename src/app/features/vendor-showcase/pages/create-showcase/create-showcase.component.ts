import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { VendorShowcaseService } from '../../services/vendor-showcase.service';
import { VendorProductService } from '../../../vendor/services/vendor-product.service';
import { ShowcaseFormComponent } from '../../components/showcase-form/showcase-form.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { ShowcaseHotspot } from '../../interfaces/showcase-hotspot.interface';

@Component({
  selector: 'app-create-showcase',
  standalone: true,
  imports: [CommonModule, RouterLink, ShowcaseFormComponent],
  templateUrl: './create-showcase.component.html',
  styleUrl: './create-showcase.component.css'
})
export class CreateShowcase implements OnInit {
  private showcaseService = inject(VendorShowcaseService);
  private vendorProductService = inject(VendorProductService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private router = inject(Router);

  readonly productsList = signal<{ value: number; label: string }[]>([]);
  readonly loadingProducts = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.loadingProducts.set(true);
    // Fetch up to 100 products of the vendor
    this.vendorProductService.getVendorProducts(1, 100).subscribe({
      next: (products) => {
        const list = (products || []).map(p => ({
          value: p.id,
          label: this.translationService.currentLang() === 'ar' ? (p.nameAr || p.nameEn) : p.nameEn
        }));
        this.productsList.set(list);
        this.loadingProducts.set(false);
      },
      error: (err) => {
        console.error('Failed to load vendor products for selection:', err);
        this.uiState.showAlert(
          'danger',
          this.translationService.currentLang() === 'ar' 
            ? 'فشل تحميل المنتجات. يرجى إعادة المحاولة لتتمكن من ربط النقاط بالمنتجات.' 
            : 'Failed to load products. Please reload to link hotspots to products.'
        );
        this.loadingProducts.set(false);
      }
    });
  }

  onSubmit(data: { formValue: any; imageFile: File | null; hotspots: ShowcaseHotspot[] }): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const isAr = this.translationService.currentLang() === 'ar';
    const formData = new FormData();
    formData.append('TitleAr', data.formValue.titleAr);
    formData.append('TitleEn', data.formValue.titleEn);
    formData.append('SubtitleAr', data.formValue.subtitleAr || '');
    formData.append('SubtitleEn', data.formValue.subtitleEn || '');
    formData.append('ButtonTextAr', data.formValue.buttonTextAr || '');
    formData.append('ButtonTextEn', data.formValue.buttonTextEn || '');
    formData.append('ButtonLink', data.formValue.buttonLink);
    formData.append('DisplayOrder', data.formValue.displayOrder.toString());
    formData.append('IsActive', data.formValue.isActive.toString());

    const payloadHotspots = data.hotspots
      .filter(h => h.productId !== undefined && h.productId !== null)
      .map(h => ({
        productId: h.productId,
        x: h.x,
        y: h.y,
        displayOrder: h.displayOrder,
        isActive: h.isActive
      }));

    formData.append('HotspotsJson', JSON.stringify(payloadHotspots));

    if (data.imageFile) {
      formData.append('BackgroundImage', data.imageFile);
    }

    this.showcaseService.createShowcase(formData).subscribe({
      next: () => {
        this.uiState.showAlert(
          'success',
          isAr ? 'تم إنشاء معرض البانر بنجاح' : 'Showcase banner created successfully'
        );
        this.router.navigate(['/vendor/showcases']);
      },
      error: (err) => {
        console.error('Create showcase failed:', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل إنشاء المعرض. يرجى التحقق من المدخلات والمحاولة مجدداً.' : 'Failed to create showcase. Please check inputs and try again.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/vendor/showcases']);
  }
}
