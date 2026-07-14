import axios from 'axios';

const resolveBaseURL = () => {
    const configured = import.meta.env.VITE_API_BASE_URL?.trim();
    if (configured) {
        return configured;
    }

    if (typeof window !== 'undefined') {
        const currentOrigin = window.location.origin;
        if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
            return 'http://localhost:3000/api/v1';
        }
        return `${currentOrigin}/api/v1`;
    }

    return '/api/v1';
};

const api = axios.create({
    baseURL: resolveBaseURL(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;