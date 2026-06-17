import axios from 'axios';

/**
 * E-SERBISYO API UTILITY
 * Centralized axios instance for handling backend communication.
 * Automatically attaches the JWT token from localStorage for all requests.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Request Interceptor: Attach Authorization Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g., 403 Forbidden or 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Session error or unauthorized access detected.');
    }
    return Promise.reject(error);
  }
);

export default api;