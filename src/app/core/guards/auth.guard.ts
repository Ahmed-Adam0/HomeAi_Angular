import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../constants';

/**
 * Functional Authentication Guard (Angular 20)
 * 
 * Verifies the presence of the authentication token in localStorage.
 * If the user is authenticated, it allows navigation to proceed.
 * Otherwise, it redirects the user to the login page.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  if (token) {
    return true;
  }

  // Redirect to the login route and block current navigation
  return router.createUrlTree([NAV_ROUTES.LOGIN]);
};
