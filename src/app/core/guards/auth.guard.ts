import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../constants';

/**
 * Functional Authentication Guard (Angular 20)
 * 
 * Verifies the presence of the authentication token in localStorage.
 * If the user is authenticated, it allows navigation to proceed.
 * Otherwise, it redirects the user to the login page.
 * 
 * For SSR execution, the guard allows navigation since localStorage is unavailable.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  if (token) {
    return true;
  }

  return router.createUrlTree([NAV_ROUTES.LOGIN]);
};
