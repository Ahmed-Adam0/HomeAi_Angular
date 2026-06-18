import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { ReviewsService } from '../../services/reviews.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UiState } from '../../../../core/state/ui.state';
import { IReview } from '../../interfaces/ireview';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './product-reviews.component.html',
  styleUrl: './product-reviews.component.css',
})
export class ProductReviewsComponent implements OnInit {
  readonly translationService = inject(TranslationService);
  private reviewsService = inject(ReviewsService);
  private authService = inject(AuthService);
  private uiState = inject(UiState);

  // Accept product ID as a signal input
  readonly productId = input.required<number>();

  // State for reviews API integration
  readonly reviews = signal<IReview[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Statistics properties
  readonly averageRating = signal<number>(0);
  readonly totalReviews = signal<number>(0);

  // Auth helper
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  // Star breakdown count
  readonly starBreakdown = computed(() => {
    const list = this.reviews();
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    for (const r of list) {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        counts[rating]++;
      }
    }
    return counts;
  });

  // Review Form States
  readonly formRating = signal<number>(0);
  readonly hoverRating = signal<number>(0);
  readonly formComment = signal<string>('');
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadReviews();
  }

  /**
   * Fetches the reviews and ratings statistics for the product.
   */
  loadReviews(): void {
    const id = this.productId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      reviews: this.reviewsService.getProductReviews(id).pipe(
        catchError((err) => {
          console.warn('Could not fetch reviews:', err);
          return of([] as IReview[]);
        })
      ),
      rating: this.reviewsService.getProductRating(id).pipe(
        catchError((err) => {
          console.warn('Could not fetch rating stats:', err);
          return of({ averageRating: 0, totalReviews: 0 });
        })
      )
    }).subscribe({
      next: (res) => {
        this.reviews.set(res.reviews);
        
        // If rating stats are returned, use them; otherwise, compute locally from list
        if (res.rating.totalReviews > 0) {
          this.averageRating.set(res.rating.averageRating);
          this.totalReviews.set(res.rating.totalReviews);
        } else if (res.reviews.length > 0) {
          const avg = res.reviews.reduce((acc, r) => acc + r.rating, 0) / res.reviews.length;
          this.averageRating.set(avg);
          this.totalReviews.set(res.reviews.length);
        } else {
          this.averageRating.set(0);
          this.totalReviews.set(0);
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load reviews');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Submits a new review.
   */
  submitReview(event: Event): void {
    event.preventDefault();
    const id = this.productId();
    const commentText = this.formComment().trim();
    const starRating = this.formRating();
    const isAr = this.translationService.currentLang() === 'ar';

    if (starRating < 1 || starRating > 5) {
      this.submitError.set(isAr ? 'الرجاء اختيار التقييم بالنجوم.' : 'Please select a star rating.');
      return;
    }

    if (!commentText) {
      this.submitError.set(isAr ? 'الرجاء كتابة تعليقك أولاً.' : 'Please enter your comment first.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.reviewsService.addReview({
      productId: id,
      rating: starRating,
      comment: commentText
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.formComment.set('');
        this.formRating.set(0);
        this.loadReviews();
        
        this.uiState.showAlert('success', isAr ? 'تمت إضافة تقييمك بنجاح. شكراً لك!' : 'Your review has been submitted successfully. Thank you!');
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        this.isSubmitting.set(false);
        this.submitError.set(isAr ? 'حدث خطأ أثناء إرسال التقييم. حاول مرة أخرى.' : 'An error occurred while submitting your review. Please try again.');
      }
    });
  }

  /**
   * Helper to get localized premium textual feedback for selected stars.
   */
  getRatingLabel(rating: number): string {
    const isAr = this.translationService.currentLang() === 'ar';
    switch (rating) {
      case 1: return isAr ? 'سيء جداً' : 'Terrible';
      case 2: return isAr ? 'سيء' : 'Poor';
      case 3: return isAr ? 'متوسط' : 'Average';
      case 4: return isAr ? 'جيد جداً' : 'Very Good';
      case 5: return isAr ? 'ممتاز' : 'Excellent';
      default: return '';
    }
  }

  /**
   * Safe path resolver for review user avatars.
   */
  getAvatarUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
      return url;
    }
    const origin = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanUrl = url.replace(/^\/+/, '');
    return `${origin}/${cleanUrl}`;
  }

  /**
   * Sets the rating value from the star form selection.
   */
  setFormRating(rating: number): void {
    this.formRating.set(rating);
  }

  /**
   * Generates initials for a user name to display as an avatar fallback.
   */
  getUserInitials(name: string): string {
    if (!name) return 'U';
    const cleanName = name.trim();
    if (!cleanName) return 'U';
    
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanName[0].toUpperCase();
  }
}
