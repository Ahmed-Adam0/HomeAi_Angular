import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../constants';
import { AuthRequiredService } from '../services/auth-required.service';
import { PLATFORM_ID } from '@angular/core';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthRequiredService: jasmine.SpyObj<AuthRequiredService>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.returnValue({} as any);

    mockAuthRequiredService = jasmine.createSpyObj('AuthRequiredService', ['requestAuthRequired']);
    mockAuthRequiredService.requestAuthRequired.and.returnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthRequiredService, useValue: mockAuthRequiredService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow navigation if token exists in localStorage', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, 'test-token');

    const result = executeGuard({} as any, {} as any);

    expect(result).toBeTrue();
  });

  it('should ask for login confirmation if token does not exist', (done) => {
    const result$ = executeGuard({} as any, { url: '/checkout' } as any) as any;

    result$.subscribe((result: boolean | object) => {
      expect(result).toBeFalse();
      expect(mockAuthRequiredService.requestAuthRequired).toHaveBeenCalledWith('/checkout');
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
      done();
    });
  });

  it('should redirect to login when confirmation is accepted', (done) => {
    mockAuthRequiredService.requestAuthRequired.and.returnValue(of(true));

    const result$ = executeGuard({} as any, { url: '/checkout' } as any) as any;

    result$.subscribe((result: object) => {
      expect(result).toBe(mockRouter.createUrlTree.calls.mostRecent().returnValue);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith([NAV_ROUTES.LOGIN], {
        queryParams: { returnUrl: '/checkout' }
      });
      done();
    });
  });
});
