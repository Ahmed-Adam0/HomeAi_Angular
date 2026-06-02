import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../constants';

const resolveGuestRedirect = (router: Router, route: ActivatedRouteSnapshot): UrlTree => {
  const redirectUrl =
    typeof route.queryParams['redirectUrl'] === 'string'
      ? route.queryParams['redirectUrl']
      : typeof route.queryParams['returnUrl'] === 'string'
      ? route.queryParams['returnUrl']
      : NAV_ROUTES.HOME;

  return router.parseUrl(redirectUrl);
};

export const guestGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authenticated = authService.isAuthenticated();
  const token = localStorage.getItem('furniture_access_token');
  
  console.log('Current URL:', state.url);
  console.log('Token:', token);
  console.log('Auth result:', authenticated);

  if (!authenticated) {
    return true;
  }

  if (authService.isVendor()) {
    console.warn('[guestGuard] - Vendor already authenticated. Redirecting directly to vendor dashboard.');
    return router.createUrlTree([NAV_ROUTES.VENDOR_DASHBOARD]);
  }

  return resolveGuestRedirect(router, route);
};
