import { create } from 'zustand';
import { authApi } from '../services/api';

interface User {
    id: string;
    email: string;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true,
    isAuthenticated: false,

    login: async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },

    register: async (email: string, password: string) => {
        const response = await authApi.register(email, password);
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }
        try {
            const response = await authApi.getProfile();
            set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
