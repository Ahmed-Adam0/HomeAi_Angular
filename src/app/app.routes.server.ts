import { RenderMode, ServerRoute } from '@angular/ssr';
import { APP_ROUTES } from './core/constants';

export const serverRoutes: ServerRoute[] = [
  {
    path: APP_ROUTES.PRODUCT_DETAILS,
    renderMode: RenderMode.Server,
  },
  {
    path: APP_ROUTES.CATEGORY_DETAIL,
    renderMode: RenderMode.Server,
  },
  {
    path: APP_ROUTES.ORDER_DETAILS,
    renderMode: RenderMode.Server,
  },
  {
    path: APP_ROUTES.VENDOR_ORDER_DETAILS_FULL,
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
