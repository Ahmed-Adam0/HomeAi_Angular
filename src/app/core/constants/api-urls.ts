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
  },
  PRODUCTS: {
    LIST: 'Products',
    DETAILS: (id: string | number) => `Products/${id}`,
    CATEGORIES: 'Categories',
    SEARCH: 'Products',
    FEATURED: 'Products',
  },
  CART: {
    GET: 'cart',
    ADD: 'cart/add',
    UPDATE: (id: string | number) => `cart/update/${id}`,
    REMOVE: (id: string | number) => `cart/remove/${id}`,
    CLEAR: 'cart/clear',
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
