import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../constants';

/**
 * Vendor Auth Guard (Redirect If Authenticated for Vendors)
 *
 * Purpose: Prevents already-logged-in vendors from accessing vendor login/register pages.
 * Applied to: `/vendor/login` and `/vendor/register`
 *
 * Behavior:
 * - If NOT authenticated: Allow access (proceed to login page)
 * - If authenticated AND has workshopId (is a vendor): Redirect to `/vendor/dashboard`
 * - If authenticated but NO workshopId (is a customer): Allow access (they won't be able to vendor-login anyway)
 */
export const vendorAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  // SSR bypass: allow on server-side
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const authenticated = authService.isAuthenticated();

  // Not authenticated: allow to proceed to login/register
  if (!authenticated) {
    console.log('[vendorAuthGuard] - User not authenticated. Allowing access to vendor auth page.');
    return true;
  }

  // Authenticated: check if vendor or customer
  if (authService.isVendor()) {
    console.warn('[vendorAuthGuard] - Vendor already authenticated. Redirecting to vendor dashboard.');
    return router.createUrlTree([NAV_ROUTES.VENDOR_DASHBOARD]);
  }

  if (authService.isCustomer()) {
    console.warn('[vendorAuthGuard] - Customer authenticated. Redirecting to customer home.');
    return router.createUrlTree([NAV_ROUTES.HOME]);
  }

  return true;
};
