import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { IReview } from '../interfaces/ireview';

export interface IRatingStats {
  averageRating: number;
  totalReviews: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private ratingCache = new Map<string | number, IRatingStats>();

  getProductReviews(productId: string | number): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.apiUrl}Reviews/product/${productId}`);
  }

  hasCachedRating(productId: string | number): boolean {
    return this.ratingCache.has(productId);
  }

  getProductRating(productId: string | number): Observable<IRatingStats> {
    if (this.ratingCache.has(productId)) {
      return of(this.ratingCache.get(productId)!);
    }
    return this.http.get<IRatingStats>(`${this.apiUrl}Reviews/product/${productId}/rating`).pipe(
      tap(stats => this.ratingCache.set(productId, stats))
    );
  }

  addReview(review: { productId: number; rating: number; comment: string }): Observable<IReview> {
    return this.http.post<IReview>(`${this.apiUrl}Reviews`, review);
  }

  deleteReview(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}Reviews/${id}`);
  }
}
