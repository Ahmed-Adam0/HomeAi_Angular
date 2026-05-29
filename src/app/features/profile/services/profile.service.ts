import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.put<IProfile>(`${this.baseUrl}${API_URLS.PROFILE.UPDATE}`, payload);
  }

  changePassword(payload: IChangePasswordDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}${API_URLS.PROFILE.CHANGE_PASSWORD}`, payload);
  }
}
