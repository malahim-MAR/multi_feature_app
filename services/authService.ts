/**
 * Auth Service - Handles user authentication with the backend
 */
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────
interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

interface AuthResponse {
    success: boolean;
    token: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
}

// ─── Auth Functions ─────────────────────────────────────────

/**
 * Register a new user
 */
export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', payload);
    if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
    }
    return data;
};

/**
 * Login existing user
 */
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', payload);
    if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
    }
    return data;
};

/**
 * Logout — clear stored token
 */
export const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
};

/**
 * Get currently logged-in user profile
 */
export const getProfile = async () => {
    const { data } = await api.get('/auth/profile');
    return data;
};

/**
 * Check if user is authenticated (has a stored token)
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
};
