import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';

export interface ShowcaseProduct {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  basePrice: number;
  mainImageUrl: string;
  averageRating: number;
  availability: boolean;
}

export interface ShowcaseHotspot {
  id: number;
  x: number; // percentage
  y: number; // percentage
  displayOrder: number;
  isActive: boolean;
  product: ShowcaseProduct;
}

export interface ShowcaseSlide {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  backgroundImageUrl: string;
  displayOrder: number;
  isActive: boolean;
  workshopId: number | null;
  hotspots: ShowcaseHotspot[];
}

@Injectable({
  providedIn: 'root'
})
export class ShowcaseService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getShowcase(): Observable<ShowcaseSlide[]> {
    return this.http.get<ShowcaseSlide[]>(`${this.apiUrl}${API_URLS.HOME.SHOWCASE}`);
  }

  // Keep for backward compatibility
  getShowcaseSlides(): Observable<ShowcaseSlide[]> {
    return this.getShowcase();
  }
}
