import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants/api-urls';
import { AuthService } from '../../../features/auth/services/auth.service';
import { IVendorLoginRequest, IVendorRegisterRequest } from '../interfaces/vendor-auth-request';
import { IVendorAuthResponse } from '../interfaces/vendor-auth-response';

@Injectable({
  providedIn: 'root'
})
export class VendorAuthService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = environment.apiUrl;

  login(data: IVendorLoginRequest) {
    return this.http
      .post<IVendorAuthResponse>(`${this.baseUrl}${API_URLS.AUTH.VENDOR_LOGIN}`, data)
      .pipe(
        tap((response) => {
          const token = response.token ?? null;
          if (token) {
            this.authService.authenticate(token);
          }
        })
      );
  }

  register(data: IVendorRegisterRequest) {
    return this.http.post<IVendorAuthResponse>(`${this.baseUrl}${API_URLS.AUTH.VENDOR_REGISTER}`, data);
  }
}
