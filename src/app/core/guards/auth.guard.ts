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
 *
 * For SSR/Prerender execution, the guard allows navigation since localStorage/client state is unavailable,
 * relying on initial client hydration to enforce auth check instantly.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  // Instantly redirect to login page, preserving the intended URL for post-login redirect
  return router.createUrlTree([NAV_ROUTES.LOGIN], {
    queryParams: { returnUrl: state.url }
  });
};

