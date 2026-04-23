import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/admin-login', { email, password }),
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) =>
    api.post('/auth/verify-otp', { phone, code }),
  getMe: () => api.get('/auth/me'),
};

// Admin endpoints
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),

  // Partners
  getPendingPartners: () => api.get('/admin/partners/pending'),
  approvePartner: (id: string) => api.post(`/admin/partners/${id}/approve`),
  rejectPartner: (id: string) => api.post(`/admin/partners/${id}/reject`),

  // Properties
  getPendingProperties: () => api.get('/admin/properties/pending'),
  approveProperty: (id: string) => api.post(`/admin/properties/${id}/approve`),
  rejectProperty: (id: string) => api.post(`/admin/properties/${id}/reject`),

  // Users
  getUsers: (page = 1, limit = 20) =>
    api.get('/admin/users', { params: { page, limit } }),

  // Bookings
  getBookings: (page = 1, limit = 20) =>
    api.get('/admin/bookings', { params: { page, limit } }),
};

export default api;
