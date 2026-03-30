import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'secure_auth_token';

const canUseLocalStorage = () => {
  if (Platform.OS !== 'web') return false;
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

/**
 * Securesly save the JWT token to the device keychain/keystore.
 * Never use plain AsyncStorage for tokens.
 */
export async function saveToken(token) {
  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      return;
    } catch (error) {
      console.error('Error saving token to localStorage', error);
    }
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error securely saving token', error);
  }
}

/**
 * Retrieve the securely stored token.
 */
export async function getToken() {
  if (canUseLocalStorage()) {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token from localStorage', error);
      return null;
    }
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving secure token', error);
    return null;
  }
}

/**
 * Delete the securely stored token on logout.
 */
export async function deleteToken() {
  if (canUseLocalStorage()) {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    } catch (error) {
      console.error('Error deleting token from localStorage', error);
    }
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error deleting secure token', error);
  }
}
