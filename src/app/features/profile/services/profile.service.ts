import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants/api-urls';
import { IProfile } from '../interfaces/iprofile';
import { IUpdateProfileDto } from '../interfaces/iupdate-profile.dto';
import { IChangePasswordDto } from '../interfaces/ichange-password.dto';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getProfile(): Observable<IProfile> {
    return this.http.get<IProfile>(`${this.baseUrl}${API_URLS.PROFILE.GET}`);
  }

  updateProfile(payload: IUpdateProfileDto): Observable<IProfile> {
    const sanitizedAddresses = (payload.addresses || []).map(address => {
      const isTemporaryId =
        typeof address.id === 'string' &&
        address.id.startsWith('addr_');

      return {
        ...(isTemporaryId ? {} : { id: address.id }),
        label: address.label,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        country: address.country,
        postalCode: address.postalCode,
        primary: address.primary,
      };
    });

    const sanitizedPayload: IUpdateProfileDto = {
      ...payload,
      addresses: sanitizedAddresses
    };

    if (!environment.production) {
      console.log('Update profile payload:', sanitizedPayload);
    }

    return this.http.put<IProfile>(`${this.baseUrl}${API_URLS.PROFILE.UPDATE}`, sanitizedPayload).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!environment.production) {
          console.error('API Error in ProfileService.updateProfile:', error);
        }
        return throwError(() => error);
      })
    );
  }

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put(`${this.baseUrl}${API_URLS.PROFILE.IMAGE_UPLOAD}`, formData).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!environment.production) {
          console.error('API Error in ProfileService.uploadProfileImage:', error);
        }
        return throwError(() => error);
      })
    );
  }

  changePassword(payload: IChangePasswordDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}${API_URLS.PROFILE.CHANGE_PASSWORD}`, payload);
  }
}
