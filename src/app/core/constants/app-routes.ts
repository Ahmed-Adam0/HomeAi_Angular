export const APP_ROUTES = {
  HOME: '',

  LOGIN: 'login',
  REGISTER: 'register',

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

  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  PROFILE: '/profile',

  FILTER_SIDEBAR: '/filter-sidebar',

  PRODUCTS: '/products',

  CART: '/cart',

  FAVORITES: '/favorites',

  ORDERS: '/orders',

  AI_CHAT: '/ai-chat'
} as const;
