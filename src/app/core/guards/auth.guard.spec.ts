import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { authGuard } from './auth.guard';
import { NAV_ROUTES } from '../constants';
import { AuthService } from '../../features/auth/services/auth.service';
import { PLATFORM_ID } from '@angular/core';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockRouter: jasmine.SpyObj<Router>;
  let authStateSignal: WritableSignal<boolean>;
  let mockAuthService: { isAuthenticated: WritableSignal<boolean> };

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.returnValue({} as any);

    authStateSignal = signal<boolean>(false);
    mockAuthService = {
      isAuthenticated: authStateSignal
    };
  });

  describe('on Browser platform', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
    });

    it('should be created', () => {
      expect(executeGuard).toBeTruthy();
    });

    it('should allow navigation if user is authenticated', () => {
      authStateSignal.set(true);

      const result = executeGuard({} as any, { url: '/profile' } as any);

      expect(result).toBeTrue();
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should immediately redirect to login with returnUrl if user is unauthenticated', () => {
      authStateSignal.set(false);
      const mockUrlTree = {} as any;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      const result = executeGuard({} as any, { url: '/profile' } as any);

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith([NAV_ROUTES.LOGIN], {
        queryParams: { returnUrl: '/profile' }
      });
    });
  });

  describe('on Server platform (SSR/Prerendering)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: AuthService, useValue: mockAuthService },
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
    });

    it('should allow navigation on server side without checking auth', () => {
      authStateSignal.set(false);

      const result = executeGuard({} as any, { url: '/profile' } as any);

      expect(result).toBeTrue();
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });
  });
});

