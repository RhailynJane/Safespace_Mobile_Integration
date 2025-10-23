import { Platform } from 'react-native';
// Using optional import since expo-constants may not be available in some non-Expo builds
let Constants: any;
try {
  Constants = require('expo-constants');
} catch {
  Constants = undefined;
}

/**
 * Resolve the API base URL in a device/emulator-friendly way.
 * Priority:
 * 1) EXPO_PUBLIC_API_URL env var
 * 2) LAN host (from Expo hostUri/debuggerHost) + port 3001
 * 3) Platform fallback (Android: 10.0.2.2, others: localhost)
 */
export const getApiBaseUrl = (port: number = 3001): string => {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env && typeof env === 'string' && env.startsWith('http')) {
    return env.replace(/\/$/, '');
  }

  let host: string | undefined;
  const hostUri = Constants?.expoConfig?.hostUri
    || Constants?.manifest?.debuggerHost
    || Constants?.manifest2?.extra?.expoClient?.hostUri;

  if (typeof hostUri === 'string') {
    // Expect forms like "192.168.1.5:19000" or "localhost:19000"
    host = hostUri.split(':')[0];
  }

  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    // Emulators need translation for localhost
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${port}`;
    }
    return `http://localhost:${port}`;
  }

  // Use LAN host
  return `http://${host}:${port}`;
};

/**
 * Ensure a URL is absolute by prefixing the API base when a leading slash is provided.
 */
export const makeAbsoluteUrl = (pathOrUrl: string, port: number = 3001): string => {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) return `${getApiBaseUrl(port)}${pathOrUrl}`;
  return pathOrUrl;
};

export default getApiBaseUrl;
