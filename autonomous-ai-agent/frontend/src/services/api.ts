import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'; // LOCAL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://54.84.238.141:4000'; // LIVE EC2

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    register: (email: string, password: string) =>
        api.post('/auth/register', { email, password }),
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    getProfile: () => api.get('/auth/me'),
};

// Agent API
export const agentApi = {
    create: (name: string, spendingLimit?: number) =>
        api.post('/agents/create', { name, spendingLimit }),
    getAll: () => api.get('/agents'),
    getById: (id: string) => api.get(`/agents/${id}`),
    updateSpendingLimit: (id: string, spendingLimit: number) =>
        api.patch(`/agents/${id}/spending-limit`, { spendingLimit }),
    setActive: (id: string, isActive: boolean) =>
        api.patch(`/agents/${id}/status`, { isActive }),
    delete: (id: string) => api.delete(`/agents/${id}`),
};

// Task API
export const taskApi = {
    create: (agentId: string, prompt: string) =>
        api.post('/tasks/create', { agentId, prompt }),
    execute: (taskId: string) => api.post(`/tasks/${taskId}/execute`),
    retry: (taskId: string) => api.post(`/tasks/${taskId}/retry`),
    getById: (id: string) => api.get(`/tasks/${id}`),
    getByAgent: (agentId: string) => api.get(`/tasks/agent/${agentId}`),
};

export default api;
