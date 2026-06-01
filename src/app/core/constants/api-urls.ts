/**
 * Professional Grouped API Endpoints for the Furniture AI Application.
 * This structure keeps endpoints organized by feature area and maintains scalability.
 */
export const API_URLS = {
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    VENDOR_LOGIN: 'Vendors/login',
    VENDOR_REGISTER: 'Vendors/create',
    REFRESH_TOKEN: 'auth/refresh-token',
    LOGOUT: 'auth/logout',
    ME: 'auth/me',
    GOOGLE: 'auth/google',
    FORGOT_PASSWORD: 'auth/forgot-password',
    VERIFY_OTP: 'auth/verify-otp',
    RESET_PASSWORD: 'auth/reset-password',
  },
  PRODUCTS: {
    LIST: 'Products',
    DETAILS: (id: string | number) => `Products/${id}`,
    CATEGORIES: 'Categories',
    SEARCH: 'Products',
    FEATURED: 'Products',
  },
  CART: {
    GET: 'Cart',
    CLEAR: 'Cart',
    ADD_ITEM: 'Cart/items',
    UPDATE_ITEM: 'Cart/items',
    REMOVE_ITEM: (id: string | number) => `Cart/items/${id}`,
  },
  ORDERS: {
    LIST: 'Order/my-orders',
    DETAILS: (id: string | number) => `Order/${id}`,
    CREATE: 'Order',
    UPDATE_STATUS: (id: string | number) => `Order/${id}/status`,
  },
  AI: {
    RECOMMEND: 'ai/recommend',
    CHAT: 'ai/chat',
    VISUAL_SEARCH: 'ai/visual-search',
  },
  PROFILE: {
    GET: 'profile',
    UPDATE: 'profile',
    CHANGE_PASSWORD: 'profile/change-password',
  },
  VENDOR: {
    ORDERS: 'vendor/orders',
    ORDER_DETAILS: (id: string | number) => `vendor/orders/${id}`,
    REVENUE: 'vendor/revenue',
    ANALYTICS: 'vendor/analytics',
    NOTIFICATIONS: 'vendor/notifications',
    WORKSHOP_PROFILE: 'vendor/workshop-profile',
    UPDATE_ORDER_STATUS: (id: string | number) => `vendor/orders/${id}/status`,
  },
} as const;

export type ApiUrls = typeof API_URLS;
export type VendorApiUrls = typeof API_URLS.VENDOR;
