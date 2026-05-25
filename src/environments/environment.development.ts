export const environment = {
  production: false,
  apiUrl: 'http://home-ai.runasp.net/api/',
  featureFlags: {
    enableAiRecommendations: true,
    enableNewCheckout: true,
    enableNotifications: true
  },
  payment: {
    stripePublicKey: 'pk_test_dev',
    paypalClientId: 'paypal_client_id_dev',
    paymobApiKey: 'paymob_api_key_dev'
  },
  localization: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar']
  }
};