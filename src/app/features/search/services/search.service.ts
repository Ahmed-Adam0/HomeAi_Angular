import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ISearchResult {
  id: string | number;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);

  private mockResults: ISearchResult[] = [
    { id: 1, name: 'Minimalist Oak Chair', price: 149.99, category: 'living', imageUrl: 'assets/images/chair.jpg' },
    { id: 2, name: 'Scandinavian Fabric Sofa', price: 799.99, category: 'living', imageUrl: 'assets/images/sofa.jpg' },
    { id: 3, name: 'Modern Wooden Desk', price: 299.99, category: 'office', imageUrl: 'assets/images/desk.jpg' }
  ];

  searchProducts(query: string): Observable<ISearchResult[]> {
    if (!query) {
      return of([]);
    }
    const filtered = this.mockResults.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filtered);
  }
}
