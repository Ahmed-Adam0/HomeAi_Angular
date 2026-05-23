import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const aiRoutes: Routes = [
  {
    path: APP_ROUTES.AI_CHAT,
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
