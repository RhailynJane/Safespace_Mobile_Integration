// lib/clerk-config.js
import { CLERK_PUBLISHABLE_KEY } from '@env';

export const getClerkConfig = () => {
  const isDevelopment = __DEV__;
  const isMobile = Platform.OS !== 'web';
  
  return {
    publishableKey: CLERK_PUBLISHABLE_KEY,
    captcha: {
      // Disable CAPTCHA in development and mobile environments
      invisible: isDevelopment || isMobile
    }
  };
};