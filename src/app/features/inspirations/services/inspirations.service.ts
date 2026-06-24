import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants/api-urls';
import { IInspirationsResponse } from '../interfaces/inspiration.interface';
import { formatImageUrl } from '../../../core/utils/api-utils';

@Injectable({
  providedIn: 'root'
})
export class InspirationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetches paginated inspirations from the backend API.
   * @param pageNumber The page index to fetch.
   * @param pageSize The number of items to return per page (defaults to 4).
   */
  /**
   * Submits a new room transformation post (before/after images) for admin review.
   * @param formData FormData containing OrderId, BeforeImages[], AfterImages[].
   */
  createInspiration(formData: FormData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}${API_URLS.INSPIRATIONS.CREATE}`, formData);
  }

  getInspirations(pageNumber: number, pageSize: number = 4): Observable<IInspirationsResponse> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<IInspirationsResponse>(`${this.apiUrl}${API_URLS.INSPIRATIONS.LIST}`, { params }).pipe(
      map((response: IInspirationsResponse) => {
        const data = (response.data || []).map(item => ({
          ...item,
          beforeImageUrl: formatImageUrl(item.beforeImageUrl),
          afterImageUrl: formatImageUrl(item.afterImageUrl)
        }));

        return {
          data,
          pagination: response.pagination || {
            currentPage: pageNumber,
            totalPages: 1,
            totalCount: data.length,
            pageSize: pageSize
          }
        };
      })
    );
  }
}
