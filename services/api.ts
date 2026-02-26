/**
 * API Service - Centralized Axios instance for communicating
 * with the Express/MongoDB backend server.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANT: Update this to your backend server URL
// For Android Emulator: http://10.0.2.2:5000/api
// For iOS Simulator:    http://localhost:5000/api
// For Physical Device:  http://YOUR_LOCAL_IP:5000/api
const API_URL = 'http://192.168.1.100:5000/api';

// Create Axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────
// Automatically attach auth token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────
// Handle common error responses globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Token expired or invalid — clear stored token
          await AsyncStorage.removeItem('authToken');
          // You can navigate to login screen here
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
      }
    } else if (error.request) {
      // Network error — no response received
      console.error('Network error — is the backend server running?');
    }
    return Promise.reject(error);
  }
);

export default api;
