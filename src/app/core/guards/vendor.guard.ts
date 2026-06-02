import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../constants';

/**
 * Vendor Guard
 *
 * Purpose: Protects all vendor/workshop pages under `/vendor/dashboard`, `/vendor/products`, etc.
 *
 * Behavior:
 * - If NOT authenticated: Redirect to `/vendor/login` (preserve returnUrl for post-login redirect)
 * - If authenticated AND has workshopId (is a vendor): Allow access ✓
 * - If authenticated but NO workshopId (is a customer): Block and redirect to `/` (home)
 */
export const vendorGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  // SSR bypass: allow on server-side
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authenticated = authService.isAuthenticated();

  // Step 1: User is not authenticated → redirect to vendor login
  if (!authenticated) {
    console.warn('[vendorGuard] - User not authenticated. Redirecting to vendor login.');
    return router.createUrlTree([NAV_ROUTES.VENDOR_LOGIN], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Step 2: User is authenticated → check role via workshopId
  const user = authService.currentUser();

  // Vendor indicator: has workshopId
  if (user && user.workshopId) {
    console.log('[vendorGuard] - Vendor authenticated. Allowing access.');
    return true;
  }

  // Step 3: Authenticated but no workshopId → customer trying to access vendor pages
  console.warn('[vendorGuard] - Authenticated user is a customer, not a vendor. Blocking access and redirecting to home.');
  return router.createUrlTree([NAV_ROUTES.HOME]);
};
