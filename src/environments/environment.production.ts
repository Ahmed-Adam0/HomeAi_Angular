export const environment = {
  production: true,
  apiUrl: 'http://home-ai.runasp.net/api/',
  featureFlags: {
    enableAiRecommendations: true,
    enableNewCheckout: true,
    enableNotifications: true
  },
  payment: {
    stripePublicKey: 'pk_live_prod_placeholder',
    paypalClientId: 'paypal_client_id_prod_placeholder',
    paymobApiKey: 'paymob_api_key_prod_placeholder'
  },
  localization: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar']
  },
  googleClientId: '834738882064-e87ejpnt830djaabjh07uhhk626sanhe.apps.googleusercontent.com'
};
