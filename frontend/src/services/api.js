import axios from 'axios';
import toast from 'react-hot-toast';

// Use relative URL since frontend and backend are on the same domain
// This avoids CORS issues and works with the nginx proxy
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('afms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('afms_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${BACKEND_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('afms_access_token', access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('afms_access_token');
        localStorage.removeItem('afms_refresh_token');
        localStorage.removeItem('afms_user');
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((res) => res.data),
  
  register: (userData) =>
    api.post('/auth/register', userData).then((res) => res.data),
  
  logout: () =>
    api.post('/auth/logout').then((res) => res.data),
  
  getCurrentUser: () =>
    api.get('/auth/me').then((res) => res.data),
  
  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }).then((res) => res.data),
  
  generateDemoData: () =>
    api.post('/auth/generate-demo-data', {}, { timeout: 120000 }).then((res) => res.data),
};

// Documents API
export const documentsAPI = {
  uploadDocument: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data),
  
  getDocuments: (params = {}) =>
    api.get('/documents', { params }).then((res) => res.data),
  
  getDocument: (id) =>
    api.get(`/documents/${id}`).then((res) => res.data),
  
  updateDocument: (id, data) =>
    api.put(`/documents/${id}`, data).then((res) => res.data),
  
  deleteDocument: (id) =>
    api.delete(`/documents/${id}`).then((res) => res.data),
  
  processDocument: (id) =>
    api.post(`/documents/${id}/process`).then((res) => res.data),
};

// Transactions API
export const transactionsAPI = {
  getTransactions: (params = {}) =>
    api.get('/transactions', { params }).then((res) => res.data),
  
  getTransaction: (id) =>
    api.get(`/transactions/${id}`).then((res) => res.data),
  
  createTransaction: (data) =>
    api.post('/transactions', data).then((res) => res.data),
  
  updateTransaction: (id, data) =>
    api.put(`/transactions/${id}`, data).then((res) => res.data),
  
  deleteTransaction: (id) =>
    api.delete(`/transactions/${id}`).then((res) => res.data),
  
  bulkImportTransactions: (data) =>
    api.post('/transactions/bulk-import', data).then((res) => res.data),
};

// Accounts API
export const accountsAPI = {
  getAccounts: (params = {}) =>
    api.get('/accounts', { params }).then((res) => res.data),
  
  getAccount: (id) =>
    api.get(`/accounts/${id}`).then((res) => res.data),
  
  createAccount: (data) =>
    api.post('/accounts', data).then((res) => res.data),
  
  updateAccount: (id, data) =>
    api.put(`/accounts/${id}`, data).then((res) => res.data),
  
  deleteAccount: (id) =>
    api.delete(`/accounts/${id}`).then((res) => res.data),
  
  setupDefaultAccounts: () =>
    api.post('/accounts/setup-defaults').then((res) => res.data),
};

// Reports API
export const reportsAPI = {
  getProfitLossReport: (params = {}) =>
    api.get('/reports/profit-loss', { params }).then((res) => res.data),
  
  getBalanceSheetReport: (params = {}) =>
    api.get('/reports/balance-sheet', { params }).then((res) => res.data),
  
  getCashFlowReport: (params = {}) =>
    api.get('/reports/cash-flow', { params }).then((res) => res.data),
  
  getDashboardSummary: () =>
    api.get('/reports/dashboard-summary').then((res) => res.data),
};

// Admin API
export const adminAPI = {
  getUsers: (params = {}) =>
    api.get('/admin/users', { params }).then((res) => res.data),
  
  getCompanies: (params = {}) =>
    api.get('/admin/companies', { params }).then((res) => res.data),
  
  getAuditLogs: (params = {}) =>
    api.get('/admin/audit-logs', { params }).then((res) => res.data),
  
  getSystemStats: () =>
    api.get('/admin/system-stats').then((res) => res.data),
  
  activateUser: (userId) =>
    api.put(`/admin/users/${userId}/activate`).then((res) => res.data),
  
  deactivateUser: (userId) =>
    api.put(`/admin/users/${userId}/deactivate`).then((res) => res.data),
  
  updateCompanySettings: (companyId, settings) =>
    api.put(`/admin/companies/${companyId}/settings`, settings).then((res) => res.data),
  
  getCompanyUsers: (companyId) =>
    api.get(`/admin/companies/${companyId}/users`).then((res) => res.data),
  
  cleanupAuditLogs: (daysToKeep = 365) =>
    api.post('/admin/maintenance/cleanup-audit-logs', null, {
      params: { days_to_keep: daysToKeep },
    }).then((res) => res.data),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health').then((res) => res.data),
};

export default api;