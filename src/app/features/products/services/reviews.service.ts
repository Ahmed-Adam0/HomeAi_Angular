import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  getProductReviews(productId: string | number): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.apiUrl}Reviews/product/${productId}`);
  }

  getProductRating(productId: string | number): Observable<IRatingStats> {
    return this.http.get<IRatingStats>(`${this.apiUrl}Reviews/product/${productId}/rating`);
  }

  addReview(review: { productId: number; rating: number; comment: string }): Observable<IReview> {
    return this.http.post<IReview>(`${this.apiUrl}Reviews`, review);
  }

  deleteReview(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}Reviews/${id}`);
  }
}
