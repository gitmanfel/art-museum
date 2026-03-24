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
 * Handle logout securely by destroying the local token.
 */
export const logout = async () => {
    await deleteToken();
    // Logic to clear user state from Context/Redux goes here
};
