import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VendorShowcaseService } from '../../services/vendor-showcase.service';
import { VendorProductService } from '../../../vendor/services/vendor-product.service';
import { ShowcaseFormComponent } from '../../components/showcase-form/showcase-form.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { ShowcaseSlide } from '../../interfaces/showcase-slide.interface';
import { ShowcaseHotspot } from '../../interfaces/showcase-hotspot.interface';

@Component({
  selector: 'app-edit-showcase',
  standalone: true,
  imports: [CommonModule, RouterLink, ShowcaseFormComponent],
  templateUrl: './edit-showcase.component.html',
  styleUrl: './edit-showcase.component.css'
})
export class EditShowcase implements OnInit {
  private showcaseService = inject(VendorShowcaseService);
  private vendorProductService = inject(VendorProductService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly slide = signal<ShowcaseSlide | null>(null);
  readonly productsList = signal<{ value: number; label: string }[]>([]);
  readonly loadingProducts = signal<boolean>(true);
  readonly loadingShowcase = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  private slideId!: number;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.slideId = parseInt(idParam || '', 10);
    
    if (isNaN(this.slideId)) {
      this.uiState.showAlert('danger', 'Invalid showcase banner ID');
      this.router.navigate(['/vendor/showcases']);
      return;
    }

    this.fetchProducts();
    this.fetchShowcaseDetail();
  }

  private fetchProducts(): void {
    this.loadingProducts.set(true);
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
        console.error('Failed to load products:', err);
        this.loadingProducts.set(false);
      }
    });
  }

  private fetchShowcaseDetail(): void {
    this.loadingShowcase.set(true);
    const isAr = this.translationService.currentLang() === 'ar';

    // Try loading details by ID first
    this.showcaseService.getShowcaseById(this.slideId).subscribe({
      next: (slide) => {
        this.slide.set(slide);
        this.loadingShowcase.set(false);
      },
      error: () => {
        // Fallback: search within list
        this.showcaseService.getShowcases().subscribe({
          next: (slides) => {
            const matched = (slides || []).find(s => s.id === this.slideId);
            if (matched) {
              this.slide.set(matched);
              this.loadingShowcase.set(false);
            } else {
              this.uiState.showAlert(
                'danger', 
                isAr ? 'عذراً، لم يتم العثور على البانر المطلوب.' : 'Sorry, the requested banner was not found.'
              );
              this.router.navigate(['/vendor/showcases']);
            }
          },
          error: (err) => {
            console.error('Failed to retrieve showcases list fallback:', err);
            this.uiState.showAlert(
              'danger',
              isAr ? 'فشل تحميل تفاصيل المعرض.' : 'Failed to retrieve showcase details.'
            );
            this.router.navigate(['/vendor/showcases']);
          }
        });
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

    this.showcaseService.updateShowcase(this.slideId, formData).subscribe({
      next: () => {
        this.uiState.showAlert(
          'success',
          isAr ? 'تم تعديل معرض البانر بنجاح' : 'Showcase banner updated successfully'
        );
        this.router.navigate(['/vendor/showcases']);
      },
      error: (err) => {
        console.error('Update showcase failed:', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل تحديث المعرض. يرجى التحقق من المدخلات والمحاولة مجدداً.' : 'Failed to update showcase. Please check inputs and try again.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/vendor/showcases']);
  }
}
