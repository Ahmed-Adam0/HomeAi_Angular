import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ICategory } from '../interfaces/icategory';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  
  private mockCategories: ICategory[] = [
    { id: 'living', name: 'Living Room', description: 'Sofas, armchairs, coffee tables', itemCount: 120, imageUrl: 'assets/images/living.jpg' },
    { id: 'bedroom', name: 'Bedroom', description: 'Beds, wardrobes, nightstands', itemCount: 85, imageUrl: 'assets/images/bedroom.jpg' },
    { id: 'kitchen', name: 'Kitchen & Dining', description: 'Dining tables, chairs, cabinets', itemCount: 64, imageUrl: 'assets/images/kitchen.jpg' },
    { id: 'office', name: 'Office', description: 'Desks, office chairs, bookshelves', itemCount: 42, imageUrl: 'assets/images/office.jpg' }
  ];

  readonly categories = signal<ICategory[]>(this.mockCategories);

  getCategories(): Observable<ICategory[]> {
    // Scaffold dynamic endpoint loading using environment config
    // return this.http.get<ICategory[]>(`${environment.apiUrl}categories`);
    return of(this.mockCategories);
  }
}
