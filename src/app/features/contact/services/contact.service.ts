import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface IInquiry {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);

  submitInquiry(inquiry: IInquiry): Observable<{ success: boolean; message: string }> {
    // Scaffold dynamic endpoint loading using environment config
    // return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}contact`, inquiry);
    return of({ success: true, message: 'Your message has been sent successfully. We will contact you soon.' });
  }
}
