import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoomDesignSessionService } from '../../features/ai/services/room-design-session.service';
import { NAV_ROUTES } from '../constants';

/**
 * Ensures a valid RoomDesignSession exists before activating the AI Chat page.
 *
 * A session is considered valid when the user has selected a room image
 * (roomFile is non-null). Because the session lives in an in-memory signal,
 * it is always cleared on a browser refresh, which means:
 *
 *   - Direct navigation to /ai-chat  → redirected to /room-upload
 *   - Browser refresh on /ai-chat    → redirected to /room-upload
 *   - Normal flow (upload → continue) → allowed through
 *
 * When the backend Room Upload API is ready, replace the `hasRoom` check
 * with a check for `session().roomId` or `session().uploadedImageUrl`.
 */
export const roomSessionGuard: CanActivateFn = () => {
  const sessionService = inject(RoomDesignSessionService);
  const router = inject(Router);

  if (sessionService.hasRoom()) {
    return true;
  }

  // No active session — send the user back to the upload step.
  return router.createUrlTree([NAV_ROUTES.ROOM_UPLOAD]);
};
