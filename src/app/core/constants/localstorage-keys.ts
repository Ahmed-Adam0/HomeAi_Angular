/**
 * Keys used across the application for LocalStorage persistence.
 * Prevents magic strings and ensures consistent storage access.
 */
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'furniture_access_token',
  REFRESH_TOKEN: 'furniture_refresh_token',
  USER: 'furniture_user_profile',
  THEME: 'furniture_theme_mode',
  LANGUAGE: 'furniture_language',
  CART: 'furniture_cart_items',
  FAVORITES: 'furniture_favorites_list'
} as const;
