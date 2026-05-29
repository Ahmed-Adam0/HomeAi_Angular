/**
 * Professional Grouped API Endpoints for the Furniture AI Application.
 * This structure keeps endpoints organized by feature area and maintains scalability.
 */
export const API_URLS = {
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
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
    UPDATE: 'profile/update',
    CHANGE_PASSWORD: 'profile/change-password',
  }
} as const;
