import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { ShowcaseSlide } from '../interfaces/showcase-slide.interface';

@Injectable({
  providedIn: 'root'
})
export class VendorShowcaseService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getShowcases(): Observable<ShowcaseSlide[]> {
    return this.http.get<ShowcaseSlide[]>(`${this.apiUrl}${API_URLS.HOME.SHOWCASE}`);
  }

  getShowcaseById(id: number | string): Observable<ShowcaseSlide> {
    return this.http.get<ShowcaseSlide>(`${this.apiUrl}${API_URLS.HOME.SHOWCASE_DETAILS(id)}`);
  }

  createShowcase(formData: FormData): Observable<ShowcaseSlide> {
    return this.http.post<ShowcaseSlide>(`${this.apiUrl}${API_URLS.HOME.SHOWCASE}`, formData);
  }

  updateShowcase(id: number | string, formData: FormData): Observable<ShowcaseSlide> {
    return this.http.put<ShowcaseSlide>(`${this.apiUrl}${API_URLS.HOME.SHOWCASE_DETAILS(id)}`, formData);
  }

  deleteShowcase(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${API_URLS.HOME.SHOWCASE_DETAILS(id)}`);
  }
}
