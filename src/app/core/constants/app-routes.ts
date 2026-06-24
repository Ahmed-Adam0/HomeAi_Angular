export const APP_ROUTES = {
  HOME: '',

  LOGIN: 'login',
  REGISTER: 'register',
  GOOGLE_SUCCESS: 'google-success',
  COMPLETE_GOOGLE_REGISTRATION: 'complete-google-registration',

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
  CONFIRM_EMAIL_OTP: 'confirm-email-otp',

  FAVORITES: 'favorites',
  ORDERS: 'orders',
  ORDER_DETAILS: 'orders/:id',
  
  VENDOR: 'vendor',
  VENDOR_LOGIN: 'login',
  VENDOR_REGISTER: 'register',
  VENDOR_ORDERS: 'orders',
  VENDOR_ORDER_DETAILS: 'orders/:id',
  VENDOR_ORDER_DETAILS_FULL: 'vendor/orders/:id',
  VENDOR_REVENUE: 'revenue',
  VENDOR_ANALYTICS: 'analytics',
  VENDOR_PROFILE: 'profile',
  VENDOR_NOTIFICATIONS: 'notifications',
  VENDOR_SETTINGS: 'settings',
  VENDOR_DASHBOARD: 'dashboard',
  VENDOR_REVIEWS: 'reviews',
  VENDOR_PRODUCTS: 'products',
  VENDOR_PRODUCT_ADD: 'products/add',
  VENDOR_PRODUCT_EDIT: 'products/edit/:id',
  VENDOR_MATERIALS: 'materials',

  AI_CHAT: 'ai-chat',

  INSPIRATIONS: 'inspirations',
  SHARE_TRANSFORMATION: 'share-transformation',

  NOT_FOUND: '404',

  WILDCARD: '**'
} as const;

export const NAV_ROUTES = {
  HOME: '/',

  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GOOGLE_SUCCESS: '/auth/google-success',
  COMPLETE_GOOGLE_REGISTRATION: '/auth/complete-google-registration',

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
  CONFIRM_EMAIL_OTP: '/auth/confirm-email-otp',

  FAVORITES: '/favorites',

  ORDERS: '/orders',

  VENDOR: '/vendor',
  VENDOR_LOGIN: '/vendor/login',
  VENDOR_REGISTER: '/vendor/register',
  VENDOR_ORDERS: '/vendor/orders',
  vendorOrderDetails: (id: string | number) => `/vendor/orders/${id}`,
  VENDOR_REVENUE: '/vendor/revenue',
  VENDOR_ANALYTICS: '/vendor/analytics',
  VENDOR_PROFILE: '/vendor/profile',
  VENDOR_NOTIFICATIONS: '/vendor/notifications',
  VENDOR_SETTINGS: '/vendor/settings',
  VENDOR_DASHBOARD: '/vendor/dashboard',
  VENDOR_REVIEWS: '/vendor/reviews',
  VENDOR_PRODUCTS: '/vendor/products',
  VENDOR_PRODUCT_ADD: '/vendor/products/add',
  vendorProductEdit: (id: string | number) => `/vendor/products/edit/${id}`,
  VENDOR_MATERIALS: '/vendor/materials',

  AI_CHAT: '/ai-chat',

  INSPIRATIONS: '/inspirations',
  SHARE_TRANSFORMATION: '/share-transformation',

  NOTIFICATIONS: '/notifications'
} as const;