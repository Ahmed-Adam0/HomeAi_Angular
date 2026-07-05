import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.homeai.app',
  appName: 'FurniMind',
  webDir: 'dist/furniture-ai/browser',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '834738882064-e87ejpnt830djaabjh07uhhk626sanhe.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
