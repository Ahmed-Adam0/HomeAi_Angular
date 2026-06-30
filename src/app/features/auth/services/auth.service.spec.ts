import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/localstorage-keys';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('stores the email and flags pending confirmation for the special backend message', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        message: 'OTP sent to your email to confirm your account.'
      }
    });

    expect(service.isPendingEmailConfirmationError(error)).toBeTrue();

    service.handlePendingEmailConfirmation(error, 'user@example.com');

    expect(service.getPendingEmailConfirmation()).toBe('user@example.com');
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.PENDING_EMAIL_CONFIRMATION)).toBe('user@example.com');
  });
});
