import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../constants';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.returnValue({} as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter }
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

  it('should redirect to login if token does not exist in localStorage', () => {
    executeGuard({} as any, {} as any);

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith([NAV_ROUTES.LOGIN]);
  });
});
