import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { NAV_ROUTES } from '../constants';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Functional Authentication Guard (Angular 20)
 *
 * Verifies if the user is authenticated via AuthService signals.
 * If the user is authenticated, it allows navigation to proceed.
 * Otherwise, it immediately redirects the user to the login page
 * while preserving the intended URL as a redirect parameter.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  console.log('[authGuard] - Guard run on URL:', state.url);
  console.log('[authGuard] - Is Platform Browser:', isPlatformBrowser(platformId));

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authenticated = authService.isAuthenticated();
  const token = localStorage.getItem('furniture_access_token');
  
  console.log('Current URL:', state.url);
  console.log('Token:', token);
  console.log('Auth result:', authenticated);

  if (authenticated) {
    console.log('[authGuard] - Authentication check passed. Allowing navigation.');
    return true;
  }

  console.warn('[authGuard] - Authentication check failed. Redirecting to login.');
  
  // Instantly redirect to login page, preserving the intended URL for post-login redirect
  return router.createUrlTree([NAV_ROUTES.LOGIN], {
    queryParams: { returnUrl: state.url }
  });
};
