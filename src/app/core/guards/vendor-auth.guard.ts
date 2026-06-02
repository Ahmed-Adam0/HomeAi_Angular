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
  const user = authService.currentUser();

  // Has workshopId → this is a vendor already logged in
  if (user && user.workshopId) {
    console.warn('[vendorAuthGuard] - Vendor already authenticated. Redirecting to vendor dashboard.');
    return router.createUrlTree([NAV_ROUTES.VENDOR_DASHBOARD]);
  }

  // Customer logged in trying to access vendor auth → allow (they can't actually log in as vendor)
  console.log('[vendorAuthGuard] - Customer is authenticated but attempting vendor auth page. Allowing (no workshop access).');
  return true;
};
