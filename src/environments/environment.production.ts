export const environment = {
  production: true,
  apiUrl: 'https://api.furnimind-ai.com/api/',
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
  }
};
