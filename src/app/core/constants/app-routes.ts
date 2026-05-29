export const APP_ROUTES = {
  HOME: '',

  LOGIN: 'login',
  REGISTER: 'register',

  PROFILE: 'profile',

  FILTER_SIDEBAR: 'filter-sidebar',

  PRODUCTS: 'products',
  PRODUCT_DETAILS: 'products/:id',

  CATEGORIES: 'categories',
  CATEGORY_DETAIL: 'categories/:id',

  SEARCH: 'search',

  CART: 'cart',
  CHECKOUT: 'checkout',
  ADDRESSES: 'addresses',
  FORGOT_PASSWORD: 'forgot-password',
  VERIFY_OTP: 'verify-otp',
  RESET_PASSWORD: 'reset-password',

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

  CATEGORIES: '/categories',
  categoryDetail: (id: string | number) => `/categories/${id}`,
  SEARCH: '/search',

  CART: '/cart',
  CHECKOUT: '/checkout',
  ADDRESSES: '/addresses',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_OTP: '/auth/verify-otp',
  RESET_PASSWORD: '/auth/reset-password',

  FAVORITES: '/favorites',

  ORDERS: '/orders',

  AI_CHAT: '/ai-chat'
} as const;
