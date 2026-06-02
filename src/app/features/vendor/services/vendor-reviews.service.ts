import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { unwrap } from '../../../core/utils/api-utils';

export interface IVendorReview {
  id: number | string;
  productId: number | string;
  productName?: string;
  productNameEn?: string;
  productNameAr?: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  rating: number;
  comment: string;
  replyText?: string;
  isReported?: boolean;
  reportReason?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorReviewsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  readonly reviews = signal<IVendorReview[]>([]);

  /**
   * Fetch all reviews for products owned by the vendor.
   * Target: GET /api/Reviews/vendor
   */
  getVendorReviews(): Observable<IVendorReview[]> {
    return this.http.get<any>(`${this.apiUrl}Reviews/vendor`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        let items: any[] = [];
        if (Array.isArray(unwrapped)) {
          items = unwrapped;
        } else if (unwrapped && typeof unwrapped === 'object') {
          for (const key of Object.keys(unwrapped)) {
            if (Array.isArray(unwrapped[key])) {
              items = unwrapped[key];
              break;
            }
          }
        }
        return items.map((r: any) => this.normalizeReview(r));
      }),
      tap(data => this.reviews.set(data))
    );
  }

  /**
   * Report a review as toxic/spam to administrators.
   * Target: POST /api/Reviews/{reviewId}/report
   */
  reportReview(reviewId: string | number, payload: { reason: string; notes?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Reviews/${reviewId}/report`, payload).pipe(
      tap(() => {
        // Optimistically update status in the local signal
        this.reviews.update(list =>
          list.map(r => r.id === reviewId ? { ...r, isReported: true, reportReason: payload.reason } : r)
        );
      })
    );
  }

  /**
   * Submit a reply to a product review.
   * Target: POST /api/Reviews/{reviewId}/reply
   */
  replyToReview(reviewId: string | number, replyText: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Reviews/${reviewId}/reply`, { reply: replyText }).pipe(
      tap(() => {
        // Optimistically update reply in the local signal
        this.reviews.update(list =>
          list.map(r => r.id === reviewId ? { ...r, replyText } : r)
        );
      })
    );
  }

  /**
   * Local normalization helper for review response structures.
   */
  private normalizeReview(review: any): IVendorReview {
    return {
      id: review.id,
      productId: review.productId,
      productName: review.productName || review.product?.nameEn || review.product?.nameAr || 'Product',
      productNameEn: review.productNameEn || review.product?.nameEn || '',
      productNameAr: review.productNameAr || review.product?.nameAr || '',
      userId: review.userId,
      userName: review.userName || review.user?.name || 'Customer',
      userAvatarUrl: review.userAvatarUrl || review.user?.avatarUrl,
      rating: Number(review.rating || 5),
      comment: review.comment || '',
      replyText: review.replyText || review.vendorReply || '',
      isReported: !!(review.isReported || review.reported),
      reportReason: review.reportReason || '',
      createdAt: review.createdAt || new Date().toISOString()
    };
  }
}
