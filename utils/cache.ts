// utils/cache.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TokenCache } from '@clerk/clerk-expo';

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        if (Platform.OS === 'web') {
          return localStorage.getItem(key);
        }
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch (err) {
        console.error('Error getting token from cache:', err);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        if (Platform.OS === 'web') {
          localStorage.setItem(key, token);
          return;
        }
        await SecureStore.setItemAsync(key, token);
      } catch (err) {
        console.error('Error saving token to cache:', err);
      }
    },
  };
};

export const tokenCache = createTokenCache();