import axios from 'axios';
import { saveToken, deleteToken } from '../utils/secureStorage';

// MUST USE HTTPS in production to prevent MitM
// In development, map to your local dev IP
const API_URL = 'http://localhost:5000/api/auth';

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Perform a secure login and store the token.
 */
export const login = async (email, password) => {
  try {
    const response = await authApi.post('/login', { email, password });
    
    // Extract token from response and securely save it
    const { token, user } = response.data;
    if (token) {
        await saveToken(token);
    }
    
    return { success: true, user };
  } catch (error) {
    console.error("Login failed:", error.response?.data?.error || error.message);
    return { 
        success: false, 
        error: error.response?.data?.error || "Login failed due to a network or server error." 
    };
  }
};

/**
 * Register a new account and securely store the token.
 */
export const register = async (email, password) => {
  try {
    const response = await authApi.post('/register', { email, password });

    const { token, user } = response.data;
    if (token) {
      await saveToken(token);
    }

    return { success: true, user };
  } catch (error) {
    console.error("Registration failed:", error.response?.data?.error || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Registration failed due to a network or server error.",
    };
  }
};

/**
 * Trigger forgot-password flow.
 */
export const forgotPassword = async (email) => {
  try {
    const response = await authApi.post('/forgot-password', { email });
    return {
      success: true,
      message: response.data.message,
      resetToken: response.data.resetToken,
    };
  } catch (error) {
    console.error("Forgot-password failed:", error.response?.data?.error || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Unable to process forgot password request.",
    };
  }
};

/**
 * Complete password reset with reset token + new password.
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await authApi.post('/reset-password', { token, newPassword });
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Reset-password failed:", error.response?.data?.error || error.message);
    return {
      success: false,
      error: error.response?.data?.error || "Unable to reset password.",
    };
  }
};

/**
 * Handle logout securely by destroying the local token.
 */
export const logout = async () => {
    await deleteToken();
    // Logic to clear user state from Context/Redux goes here
};
