import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { VendorShowcaseService } from '../../services/vendor-showcase.service';
import { ShowcaseSlide } from '../../interfaces/showcase-slide.interface';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { DialogService } from '../../../../shared/services/dialog.service';
import { ShowcasePreviewComponent } from '../../components/showcase-preview/showcase-preview.component';

@Component({
  selector: 'app-showcase-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ShowcasePreviewComponent],
  templateUrl: './showcase-list.component.html',
  styleUrl: './showcase-list.component.css'
})
export class ShowcaseListComponent implements OnInit {
  private showcaseService = inject(VendorShowcaseService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  readonly showcases = signal<ShowcaseSlide[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);
  readonly selectedSlideForPreview = signal<ShowcaseSlide | null>(null);

  ngOnInit(): void {
    this.fetchShowcases();
  }

  fetchShowcases(): void {
    this.loading.set(true);
    this.error.set(false);
    this.showcaseService.getShowcases().subscribe({
      next: (data) => {
        // Sort slides by displayOrder
        const sorted = (data || []).sort((a, b) => a.displayOrder - b.displayOrder);
        this.showcases.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to retrieve showcase banners:', err);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  onDelete(id: number, event: MouseEvent): void {
    event.stopPropagation();

    const isAr = this.translationService.currentLang() === 'ar';
    this.dialogService.openConfirm({
      title: isAr ? 'تأكيد الحذف' : 'Confirm Delete',
      message: isAr 
        ? 'هل أنت متأكد من رغبتك في حذف هذا المعرض نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' 
        : 'Are you sure you want to delete this showcase banner permanently? This action cannot be undone.',
      confirmText: isAr ? 'حذف' : 'Delete',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.showcaseService.deleteShowcase(id).subscribe({
          next: () => {
            this.uiState.showAlert(
              'success',
              isAr ? 'تم حذف المعرض بنجاح' : 'Showcase banner deleted successfully'
            );
            this.fetchShowcases();
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.uiState.showAlert(
              'danger',
              isAr ? 'فشل حذف المعرض. يرجى المحاولة لاحقاً.' : 'Failed to delete showcase banner. Please try again.'
            );
          }
        });
      }
    });
  }

  onPreview(slide: ShowcaseSlide, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedSlideForPreview.set(slide);
  }

  closePreview(): void {
    this.selectedSlideForPreview.set(null);
  }

  onEdit(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/vendor/showcases/edit', id]);
  }
}
