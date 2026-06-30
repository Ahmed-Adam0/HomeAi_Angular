/**
 * Keys used across the application for LocalStorage persistence.
 * Prevents magic strings and ensures consistent storage access.
 */
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'furniture_access_token',
  REFRESH_TOKEN: 'furniture_refresh_token',
  USER: 'furniture_user_profile',
  THEME: 'fm_theme',
  LANGUAGE: 'furniture_language',
  CART: 'furniture_cart_items',
  FAVORITES: 'furniture_favorites_list',
  AVATAR_URL: 'furniture_avatar_url',
  PENDING_EMAIL_CONFIRMATION: 'furniture_pending_email_confirmation'
} as const;
