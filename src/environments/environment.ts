export const environment = {
  production: false,
  apiUrl: 'https://home-ai.runasp.net/api/',
  featureFlags: {
    enableAiRecommendations: true,
    enableNewCheckout: true,
    enableNotifications: true
  },
  payment: {
    stripePublicKey: 'pk_test_placeholder',
    paypalClientId: 'paypal_client_id_placeholder',
    paymobApiKey: 'paymob_api_key_placeholder'
  },
  localization: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar']
  },
  googleClientId: '834738882064-e87ejpnt830djaabjh07uhhk626sanhe.apps.googleusercontent.com'
};
