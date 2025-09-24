// utils/captcha-handler.ts
import { Platform } from 'react-native';

export class CaptchaHandler {
  static isMobileEnvironment(): boolean {
    return Platform.OS !== 'web';
  }

  static shouldSkipCaptcha(): boolean {
    // Skip CAPTCHA in development and mobile environments
    return __DEV__ || this.isMobileEnvironment();
  }

  static getCaptchaConfig() {
    if (this.shouldSkipCaptcha()) {
      return {
        captcha: {
          invisible: true,
          skip: true // This tells Clerk to skip CAPTCHA verification
        }
      };
    }
    
    return {
      captcha: {
        invisible: true
      }
    };
  }

  static handleCaptchaError(error: any): string {
    if (error?.errors?.[0]?.code === 'captcha_failed') {
      return 'Security verification failed. Please try again.';
    }
    
    if (error?.message?.includes('CAPTCHA') || error?.errors?.[0]?.message?.includes('CAPTCHA')) {
      if (this.isMobileEnvironment()) {
        return 'Mobile security verification issue. Please try again or contact support.';
      }
      return 'Security verification failed. Please try a different browser or disable extensions.';
    }
    
    return error?.errors?.[0]?.message || 'An unexpected error occurred';
  }
}