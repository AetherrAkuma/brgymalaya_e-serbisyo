import axios from 'axios';

// Create a configured instance of Axios
const api = axios.create({
    // FIX: Read the URL from the .env file using Vite's syntax
    baseURL: import.meta.env.VITE_API_BASE_URL, 
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