/**
 * Application route definitions for Angular Routing.
 * Includes both route definitions (used in route config) and navigation helpers (absolute paths for routerLink).
 */
export const APP_ROUTES = {
  HOME: '',
  LOGIN: 'Login',
  REGISTER: 'Register',
  PROFILE: 'profile',
  FILTER_SIDEBAR: 'filter-sidebar',
  PRODUCTS: 'products',
  PRODUCT_DETAILS: 'products/:id',
  CART: 'cart',
  FAVORITES: 'favorites',
  ORDERS: 'orders',
  ORDER_DETAILS: 'orders/:id',
  AI_CHAT: 'ai-chat',
  NOT_FOUND: '404',
  WILDCARD: '**'
} as const;

export const NAV_ROUTES = {
  HOME: '/',
  LOGIN: '/Login',
  REGISTER: '/Register',
  PROFILE: '/profile',
  FILTER_SIDEBAR: '/filter-sidebar',
  PRODUCTS: '/products',
  CART: '/cart',
  FAVORITES: '/favorites',
  ORDERS: '/orders',
  AI_CHAT: '/ai-chat'
} as const;
