import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { map } from 'rxjs/operators';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../constants';
import { AuthRequiredService } from '../services/auth-required.service';

/**
 * Functional Authentication Guard (Angular 20)
 *
 * Verifies the presence of the authentication token in localStorage.
 * If the user is authenticated, it allows navigation to proceed.
 * Otherwise, it shows the auth-required modal and redirects to login when confirmed.
 *
 * For SSR execution, the guard allows navigation since localStorage is unavailable.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authRequiredService = inject(AuthRequiredService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);

  if (token) {
    return true;
  }

  return authRequiredService.requestAuthRequired(state.url).pipe(
    map((confirmed) =>
      confirmed
        ? router.createUrlTree([NAV_ROUTES.LOGIN], {
            queryParams: { returnUrl: state.url }
          })
        : false
    )
  );
};
