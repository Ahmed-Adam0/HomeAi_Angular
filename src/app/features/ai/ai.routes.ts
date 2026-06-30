import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { roomSessionGuard } from '../../core/guards/room-session.guard';

export const aiRoutes: Routes = [
  {
    path: 'rooms',
    redirectTo: APP_ROUTES.ROOM_UPLOAD,
    pathMatch: 'full',
  },
  {
    path: APP_ROUTES.ROOM_UPLOAD,
    loadComponent: () =>
      import('./pages/room-upload/room-upload.component').then((m) => m.RoomUpload),
  },
  {
    path: APP_ROUTES.AI_CHAT,
    canActivate: [roomSessionGuard],
    loadComponent: () =>
      import('./pages/ai-chat/ai-chat.component').then((m) => m.AiChat),
  },
  {
    path: 'ai-result',
    loadComponent: () =>
      import('./pages/ai-result/ai-result.component').then((m) => m.AiResult),
  },
  {
    path: 'scan-room',
    loadComponent: () =>
      import('./pages/scan-room/scan-room.component').then((m) => m.ScanRoom),
  },
];
