import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add timestamp for cache busting on GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const tokens = JSON.parse(localStorage.getItem('debtwise_tokens') || '{}');
        if (tokens.refreshToken) {
          const response = await api.post('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data.tokens;
          localStorage.setItem('debtwise_tokens', JSON.stringify(newTokens));
          
          // Update Authorization header and retry original request
          api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('debtwise_tokens');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/me'),
};

export const debtsAPI = {
  getAll: (params = {}) => api.get('/debts', { params }),
  getById: (id) => api.get(`/debts/${id}`),
  create: (debtData) => api.post('/debts', debtData),
  update: (id, debtData) => api.put(`/debts/${id}`, debtData),
  delete: (id) => api.delete(`/debts/${id}`),
  markPaidOff: (id, data) => api.put(`/debts/${id}/payoff`, data),
};

export const paymentsAPI = {
  getByDebt: (debtId, params = {}) => api.get(`/payments/debt/${debtId}`, { params }),
  getAll: (params = {}) => api.get('/payments', { params }),
  create: (paymentData) => api.post('/payments', paymentData),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  delete: (id) => api.delete(`/payments/${id}`),
};

export const strategiesAPI = {
  getAll: () => api.get('/strategies'),
  getById: (id) => api.get(`/strategies/${id}`),
  create: (strategyData) => api.post('/strategies', strategyData),
  update: (id, strategyData) => api.put(`/strategies/${id}`, strategyData),
  delete: (id) => api.delete(`/strategies/${id}`),
  activate: (id) => api.put(`/strategies/${id}/activate`),
  simulate: (strategyData) => api.post('/strategies/simulate', strategyData),
};

export const goalsAPI = {
  getAll: () => api.get('/goals'),
  getById: (id) => api.get(`/goals/${id}`),
  create: (goalData) => api.post('/goals', goalData),
  update: (id, goalData) => api.put(`/goals/${id}`, goalData),
  delete: (id) => api.delete(`/goals/${id}`),
  markAchieved: (id) => api.put(`/goals/${id}/achieve`),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getChartData: (type, period = '12m') => api.get(`/dashboard/charts/${type}`, { params: { period } }),
  getRecentActivity: (limit = 10) => api.get('/dashboard/activity', { params: { limit } }),
  getFinancialHealth: () => api.get('/dashboard/financial-health'),
};

export const calculatorsAPI = {
  loan: (data) => api.post('/calculators/loan', data),
  payoff: (data) => api.post('/calculators/payoff', data),
  debtComparison: (data) => api.post('/calculators/debt-comparison', data),
  emergencyFund: (data) => api.post('/calculators/emergency-fund', data),
  investment: (data) => api.post('/calculators/investment', data),
};

export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Utility functions
export const formatApiError = (error) => {
  if (error.response?.data?.error) {
    return {
      message: error.response.data.error.message,
      details: error.response.data.error.details,
      status: error.response.status,
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred',
    status: error.response?.status || 500,
  };
};

export const isNetworkError = (error) => {
  return !error.response && error.message === 'Network Error';
};

export { api };