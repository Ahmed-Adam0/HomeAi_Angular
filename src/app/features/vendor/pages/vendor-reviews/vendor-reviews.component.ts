import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VendorReviewsService, IVendorReview } from '../../services/vendor-reviews.service';
import { ReportReviewDialog } from '../../components/report-review-dialog/report-review-dialog.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-vendor-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReportReviewDialog],
  templateUrl: './vendor-reviews.component.html',
  styleUrl: './vendor-reviews.component.css'
})
export class VendorReviews implements OnInit {
  private reviewsService = inject(VendorReviewsService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly loading = signal<boolean>(true);
  readonly reviews = this.reviewsService.reviews;

  // Search and status filters
  readonly searchQuery = signal<string>('');
  readonly ratingFilter = signal<number | 'all'>('all');
  readonly statusFilter = signal<'all' | 'unreplied' | 'replied' | 'reported'>('all');

  // Reply tracking
  readonly activeReplyReviewId = signal<string | number | null>(null);
  readonly replyText = signal<string>('');
  readonly submittingReply = signal<boolean>(false);

  // Report modal tracking
  readonly reportModalVisible = signal<boolean>(false);
  readonly selectedReportReviewId = signal<string | number | null>(null);
  readonly submittingReport = signal<boolean>(false);

  // Computed Filtered Reviews list
  readonly filteredReviews = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const rating = this.ratingFilter();
    const status = this.statusFilter();
    const list = this.reviews();

    let filtered = list;

    // Apply status filter
    if (status === 'unreplied') {
      filtered = filtered.filter(r => !r.replyText);
    } else if (status === 'replied') {
      filtered = filtered.filter(r => !!r.replyText);
    } else if (status === 'reported') {
      filtered = filtered.filter(r => !!r.isReported);
    }

    // Apply rating filter
    if (rating !== 'all') {
      filtered = filtered.filter(r => r.rating === rating);
    }

    // Apply search query filter
    if (query) {
      filtered = filtered.filter(r => {
        const reviewer = (r.userName || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        const product = (r.productName || r.productNameEn || r.productNameAr || '').toLowerCase();
        return reviewer.includes(query) || comment.includes(query) || product.includes(query);
      });
    }

    // Sort by date descending
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.loadReviews();
    }
  }

  loadReviews(): void {
    this.loading.set(true);
    this.reviewsService.getVendorReviews().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
        const isAr = this.translationService.currentLang() === 'ar';
        this.uiState.showAlert('danger', isAr ? 'فشل تحميل المراجعات.' : 'Failed to load reviews.');
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onFilterStatus(filter: 'all' | 'unreplied' | 'replied' | 'reported'): void {
    this.statusFilter.set(filter);
  }

  onFilterRating(rating: number | 'all'): void {
    this.ratingFilter.set(rating);
  }

  // Reply Flow
  toggleReplyForm(reviewId: string | number): void {
    if (this.activeReplyReviewId() === reviewId) {
      this.activeReplyReviewId.set(null);
      this.replyText.set('');
    } else {
      const review = this.reviews().find(r => r.id === reviewId);
      this.activeReplyReviewId.set(reviewId);
      this.replyText.set(review?.replyText || '');

      // Smoothly scroll the opened reply editor card into view center
      setTimeout(() => {
        const formElement = document.querySelector('.vendor-reply-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 120);
    }
  }

  submitReply(reviewId: string | number): void {
    const text = this.replyText().trim();
    if (!text) return;

    const isAr = this.translationService.currentLang() === 'ar';
    this.submittingReply.set(true);
    this.uiState.showLoader();

    this.reviewsService.replyToReview(reviewId, text).subscribe({
      next: () => {
        this.submittingReply.set(false);
        this.activeReplyReviewId.set(null);
        this.replyText.set('');
        this.uiState.hideLoader();
        this.uiState.showAlert('success', isAr ? 'تم إرسال الرد بنجاح.' : 'Reply submitted successfully.');
      },
      error: (err) => {
        console.error('Failed to submit reply', err);
        this.submittingReply.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert('danger', isAr ? 'فشل إرسال الرد.' : 'Failed to submit reply.');
      }
    });
  }

  // Report Flow
  openReportModal(reviewId: string | number): void {
    const review = this.reviews().find(r => r.id === reviewId);
    if (review?.isReported) {
      const isAr = this.translationService.currentLang() === 'ar';
      this.uiState.showAlert('warning', isAr ? 'تم الإبلاغ عن هذا التقييم بالفعل.' : 'This review has already been reported.');
      return;
    }
    this.selectedReportReviewId.set(reviewId);
    this.reportModalVisible.set(true);

    // Smoothly scroll report dialog card into view center
    setTimeout(() => {
      const dialogElement = document.querySelector('.report-dialog-card');
      if (dialogElement) {
        dialogElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }

  closeReportModal(): void {
    this.reportModalVisible.set(false);
    this.selectedReportReviewId.set(null);
  }

  onSubmitReport(event: { reason: string; notes: string }): void {
    const reviewId = this.selectedReportReviewId();
    if (!reviewId) return;

    const isAr = this.translationService.currentLang() === 'ar';
    this.submittingReport.set(true);
    this.uiState.showLoader();

    this.reviewsService.reportReview(reviewId, event).subscribe({
      next: () => {
        this.submittingReport.set(false);
        this.closeReportModal();
        this.uiState.hideLoader();
        this.uiState.showAlert('success', isAr ? 'تم تقديم بلاغ الإبلاغ للمراجعة.' : 'Report submitted for review.');
      },
      error: (err) => {
        console.error('Failed to submit report', err);
        this.submittingReport.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert('danger', isAr ? 'فشل تقديم البلاغ.' : 'Failed to submit report.');
      }
    });
  }
}
