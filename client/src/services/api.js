import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication Endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/v1/auth/login', credentials),
  register: (userData) => api.post('/api/v1/auth/resident/register', userData),
  setupSuperAdmin: () => api.post('/api/v1/setup/superadmin'),
};

// Public Portal Endpoints
export const publicAPI = {
  getAnnouncements: () => api.get('/api/v1/public/announcements'),
  getDocumentTypes: () => api.get('/api/v1/public/document-types'),
  getSettings: () => api.get('/api/v1/public/settings'),
  verifyQR: (qrHash) => api.get(`/api/v1/public/verify/${qrHash}`),
};

// Resident Endpoints
export const residentAPI = {
  getDashboard: () => api.get('/api/v1/requests/resident/me'),
  submitRequest: (requestData) => api.post('/api/v1/requests', requestData),
  updateIDProof: (filename) => api.put('/api/v1/residents/me/id-proof', { id_proof_filename: filename }),
};

// File Handling Endpoints
export const fileAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFile: (filename) => api.get(`/api/v1/files/${filename}`, { responseType: 'arraybuffer' }),
};

// Admin Endpoints
export const adminAPI = {
  // System Settings
  updateSetting: (settingKey, value) => api.put(`/api/v1/admin/settings/${settingKey}`, { setting_value: value }),
  getSettings: () => api.get('/api/v1/admin/settings'),
  
  // Document Types
  createDocumentType: (docTypeData) => api.post('/api/v1/admin/document-types', docTypeData),
  updateDocumentType: (id, docTypeData) => api.put(`/api/v1/admin/document-types/${id}`, docTypeData),
  updateLayoutConfig: (id, layoutConfig) => api.put(`/api/v1/admin/document-types/${id}/layout`, { layout_config: layoutConfig }),
  uploadTemplate: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/v1/admin/document-types/${id}/template`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Announcements
  createAnnouncement: (announcementData) => api.post('/api/v1/admin/announcements', announcementData),
  
  // Officials Management
  createOfficial: (officialData) => api.post('/api/v1/admin/officials', officialData),
  updateOfficialStatus: (id, status) => api.put(`/api/v1/admin/officials/${id}/status`, { account_status: status }),
  
  // Residents Management
  updateResidentStatus: (id, status) => api.put(`/api/v1/admin/residents/${id}/status`, { account_status: status }),
  
  // Requests Management
  getPendingRequests: () => api.get('/api/v1/requests/pending'),
  verifyRequest: (requestId, action, rejectionReason) => 
    api.put(`/api/v1/requests/${requestId}/verify`, { action, rejection_reason }),
  
  // Payments
  processPayment: (paymentData) => api.post('/api/v1/payments', paymentData),
  exemptPayment: (requestId, payorName) => 
    api.post(`/api/v1/payments/exempt/${requestId}`, { payor_name: payorName }),
  
  // Document Processing
  markReadyForPickup: (requestId) => api.put(`/api/v1/requests/${requestId}/ready`),
  issueDocument: (requestId) => api.put(`/api/v1/requests/${requestId}/issue`),
  
  // PDF Generation
  generatePDF: (requestId) => api.get(`/api/v1/requests/${requestId}/generate-pdf`, { responseType: 'arraybuffer' }),
  
  // Digital Signatures
  uploadSignature: (signatureFile) => {
    return api.post('/api/v1/admin/signatures/upload', signatureFile, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  },
  
  // Audit Logs
  getAuditLogs: (limit = 100, offset = 0) => api.get(`/api/v1/admin/audit-logs?limit=${limit}&offset=${offset}`),
};

// Utility function to get user role from localStorage
export const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role;
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Utility function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;