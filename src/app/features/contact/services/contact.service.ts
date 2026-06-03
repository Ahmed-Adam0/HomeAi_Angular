import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import type { ContactFormData } from '../models/contact.models';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);

  submitInquiry(inquiry: ContactFormData): Observable<{ success: boolean }> {
    return of({ success: true });
  }
}
