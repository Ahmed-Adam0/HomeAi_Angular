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
    GOOGLE_LOGIN: 'Auth/google-login',
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
    SUBCATEGORIES: (categoryId: string | number) => `SubCategories/category/${categoryId}`,
    PRODUCT_TYPES: (subCategoryId: string | number) => `ProductTypes/subcategory/${subCategoryId}`,
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
    UPDATE_ITEMS: (id: string | number) => `Order/${id}/items`,
  },
  PAYMENTS: {
    PAYMOB: 'payments/paymob',
    PAYMOB_WEBHOOK: 'payments/paymob/webhook',
    PAYMOB_CALLBACK: 'payments/paymob/callback',
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
    IMAGE_UPLOAD: 'Profile/image',
  },
  NOTIFICATIONS: {
    LIST: 'internal-notifications',
    UNREAD_COUNT: 'internal-notifications/unread-count',
    MARK_READ: (id: number) => `internal-notifications/${id}/read`,
    MARK_ALL_READ: 'internal-notifications/read-all',
  },
  VENDOR: {
    ORDERS_FILTER: 'VendorOrders/orders/filter',
    ORDER_DETAILS: (orderId: number | string) => `VendorOrders/orders/${orderId}`,
    UPDATE_ORDER_STATUS: (orderId: number | string) => `VendorOrders/orders/${orderId}/status`,
    REVENUE_ANALYTICS: 'VendorOrders/analytics/revenue',
    ORDERS_ANALYTICS: 'VendorOrders/analytics/orders',
    DASHBOARD_METRICS: 'VendorOrders/dashboard/metrics',
    PROFILE: 'Vendors/profile',
    UPLOAD_LOGO: 'Vendors/logo',
    UPLOAD_PROFILE_IMAGE: 'Vendors/profile/image',
    NOTIFICATIONS: 'internal-notifications',
    NOTIFICATION_READ: (id: number) => `internal-notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: 'internal-notifications/read-all',
    NOTIFICATIONS_UNREAD_COUNT: 'internal-notifications/unread-count',
    MATERIALS: 'VendorMaterials',
    CREATE_GROUP: 'VendorMaterials/Groups',
    DELETE_GROUP: (groupId: string | number) => `VendorMaterials/Groups/${groupId}`,
    ADD_OPTION: (groupId: string | number) => `VendorMaterials/Groups/${groupId}/Options`,
    DELETE_OPTION: (optionId: string | number) => `VendorMaterials/Options/${optionId}`,
  },
} as const;

export type ApiUrls = typeof API_URLS;
export type VendorApiUrls = typeof API_URLS.VENDOR;
