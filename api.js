import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Phone Numbers API functions
export const numbersAPI = {
  getAvailableNumbers: (params = {}) => api.get('/numbers', { params }),
  assignNumber: (phoneNumberId, durationHours = 1) => 
    api.post('/numbers', { phone_number_id: phoneNumberId, duration_hours: durationHours }),
  getNumber: (numberId) => api.get(`/numbers/${numberId}`),
  releaseNumber: (numberId) => api.delete(`/numbers/${numberId}`),
  getMyNumbers: () => api.get('/numbers/my'),
  extendNumber: (numberId, additionalHours) => 
    api.post(`/numbers/${numberId}/extend`, { additional_hours: additionalHours }),
};

// Messages API functions
export const messagesAPI = {
  getMessages: (params = {}) => api.get('/messages', { params }),
  getMessage: (messageId) => api.get(`/messages/${messageId}`),
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
  markAllAsRead: (params = {}) => api.patch('/messages/mark-all-read', {}, { params }),
  getStats: () => api.get('/messages/stats'),
  searchMessages: (params = {}) => api.get('/messages/search', { params }),
};

// Utility functions
export const setAuthTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export default api;

