import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('partner_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('partner_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Normalize backend-hosted URLs (uploads, etc.) for local dev ports and relative paths. */
export function normalizeServerUrl(url: string) {
  if (!url) return url;
  if (url.startsWith('/')) return `${SERVER_ORIGIN}${url}`;

  for (const prefix of [
    'http://localhost:3000/',
    'https://localhost:3000/',
    'http://localhost:3003/',
    'https://localhost:3003/',
  ]) {
    if (url.startsWith(prefix)) {
      return `${SERVER_ORIGIN}/${url.substring(prefix.length)}`;
    }
  }
  return url;
}

// Auth (country = ISO 3166-1 alpha-2; required by API for parsing national or E.164 numbers)
export const authApi = {
  sendOtp: (phone: string, country: string) =>
    api.post('/auth/send-otp', { phone, country: country.toUpperCase() }),
  verifyOtp: (phone: string, code: string, country: string) =>
    api.post('/auth/verify-otp', { phone, code, country: country.toUpperCase() }),
  getMe: () => api.get('/auth/me'),
};

/** Multipart upload — avoid default JSON Content-Type on the shared axios instance. */
export function uploadPartnerPropertyImages(propertyId: string, files: File[]) {
  const token = Cookies.get('partner_token');
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  return axios.post(`${API_URL}/uploads/property/${propertyId}`, fd, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Partner
export const partnerApi = {
  /** Call as USER after phone login to create partner profile (pending admin approval). */
  register: (data: {
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    address?: string;
    licenseNumber?: string;
  }) => api.post('/partner/register', data),
  getProfile: () => api.get('/partner/profile'),
  getProperties: () => api.get('/partner/properties'),
  getProperty: (id: string) => api.get(`/partner/properties/${id}`),
  createProperty: (data: any) => api.post('/partner/properties', data),
  updateProperty: (id: string, data: any) => api.put(`/partner/properties/${id}`, data),
  createRoom: (propertyId: string, data: any) =>
    api.post(`/partner/properties/${propertyId}/rooms`, data),
  updateRoom: (id: string, data: any) => api.put(`/partner/rooms/${id}`, data),
  deleteRoom: (id: string) => api.delete(`/partner/rooms/${id}`),
  getBookings: () => api.get('/partner/bookings'),
  approveBooking: (id: string) => api.post(`/partner/bookings/${id}/approve`),
  rejectBooking: (id: string, reason?: string) =>
    api.post(`/partner/bookings/${id}/reject`, { reason }),
};

export default api;
