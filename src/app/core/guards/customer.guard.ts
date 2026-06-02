import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../constants';

/**
 * Customer Guard
 *
 * Purpose: Prevents vendors from accessing customer storefront pages.
 * If an authenticated vendor attempts access, redirect them to `/vendor/dashboard`.
 */
export const customerGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  // SSR bypass: allow on server-side
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // If user is authenticated as a vendor, redirect to vendor dashboard
  if (authService.isAuthenticated() && authService.isVendor()) {
    console.warn('[customerGuard] - Vendor attempting to access customer area. Redirecting to vendor dashboard.');
    return router.createUrlTree([NAV_ROUTES.VENDOR_DASHBOARD]);
  }

  return true;
};
