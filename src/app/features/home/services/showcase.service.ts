import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ShowcaseHotspot {
  productId: number;
  x: number; // percentage
  y: number; // percentage
}

export interface ShowcaseSlide {
  id: number;
  backgroundImage: string;
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  hotspots: ShowcaseHotspot[];
}

@Injectable({
  providedIn: 'root'
})
export class ShowcaseService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getShowcaseSlides(): Observable<ShowcaseSlide[]> {
    // Temporary hybrid architecture: mock presentation data only
    const mockSlides: ShowcaseSlide[] = [
      {
        id: 1,
        backgroundImage: 'assets/images/beige_interior.png',
        title: 'Modern Living Room',
        titleAr: 'غرفة معيشة عصرية',
        subtitle: 'A harmonious blend of warm neutrals and organic shapes.',
        subtitleAr: 'مزيج متناغم من الألوان المحايدة الدافئة والأشكال العضوية.',
        hotspots: [
          { productId: 1, x: 25, y: 66 },
          { productId: 2, x: 42, y: 71 },
          { productId: 3, x: 68, y: 60 }
        ]
      },
      {
        id: 2,
        backgroundImage: 'assets/images/room_dining.png',
        title: 'Luxury Dining Area',
        titleAr: 'منطقة طعام فاخرة',
        subtitle: 'Elevate your culinary experiences with bespoke craftsmanship.',
        subtitleAr: 'ارتقِ بتجارب تناول الطعام الخاصة بك مع الحرفية المخصصة.',
        hotspots: [
          { productId: 4, x: 50, y: 75 },
          { productId: 5, x: 30, y: 60 }
        ]
      },
      {
        id: 3,
        backgroundImage: 'assets/images/room_bedroom.png',
        title: 'Serene Bedroom Oasis',
        titleAr: 'واحة نوم هادئة',
        subtitle: 'Transform your resting space into a sanctuary of peace.',
        subtitleAr: 'حول مساحة راحتك إلى ملاذ من السلام والهدوء.',
        hotspots: [
          { productId: 6, x: 45, y: 55 },
          { productId: 7, x: 75, y: 65 }
        ]
      }
    ];

    // Later: return this.http.get<ShowcaseSlide[]>(`${this.apiUrl}home/showcase`);
    return of(mockSlides);
  }
}
