import axios from 'axios';
import { useStoreStore } from '../store/storeStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token and active store to every request
api.interceptors.request.use(
  (config) => {
    if (typeof globalThis !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Subdomain-based tenant resolution (preferred):
      // Read the subdomain from the cookie set by Next.js middleware
      const tenantMatch = /(?:^|;\s*)x-tenant=([^;]*)/.exec(document.cookie);
      const tenant = tenantMatch?.[1];
      if (tenant) {
        config.headers['X-Tenant'] = tenant;
      } else {
        // Fallback: send X-Store-Id from Zustand store (plain localhost)
        const storeId = useStoreStore.getState().activeStore?.id;
        if (storeId) {
          config.headers['X-Store-Id'] = storeId;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track whether a token refresh is already in progress to avoid duplicate refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const forceLogout = () => {
  if (typeof globalThis !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth-storage');
    globalThis.location.href = '/login';
  }
};

// Handle 401 — attempt token refresh before logging out
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors, skip if already retried or if this IS the refresh/login request
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/token/refresh/' ||
      originalRequest.url === '/auth/login/'
    ) {
      throw error;
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = typeof globalThis === 'undefined'
      ? null
      : localStorage.getItem('refresh_token');

    if (!refreshToken) {
      isRefreshing = false;
      forceLogout();
      throw error;
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccess = data.access;
      const newRefresh = data.refresh; // rotation gives a new refresh token

      localStorage.setItem('access_token', newAccess);
      if (newRefresh) {
        localStorage.setItem('refresh_token', newRefresh);
      }

      // Update Zustand persisted store so it stays in sync
      try {
        const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        if (stored.state) {
          stored.state.token = newAccess;
          localStorage.setItem('auth-storage', JSON.stringify(stored));
        }
      } catch { /* ignore parse errors */ }

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);

      // Retry the original request with the fresh token
      try {
        return await api(originalRequest);
      } catch (retryError) {
        // If the retry ALSO gets 401, the token is fundamentally broken
        // (e.g. user was deleted). Force logout to clear the invalid tokens.
        if (retryError.response?.status === 401) {
          forceLogout();
        }
        throw retryError;
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/update/', data),
  changePassword: (data) => api.post('/auth/profile/change-password/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  verifyResetToken: (uid, token) => api.post('/auth/verify-reset-token/', { uid, token }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
};

// Store API
export const storeAPI = {
  list: () => api.get('/tenant/stores/'),
  myStores: () => api.get('/tenant/stores/my_stores/'),
  create: (data) => api.post('/tenant/stores/', data),
  get: (id) => api.get(`/tenant/stores/${id}/`),
  update: (id, data) => api.put(`/tenant/stores/${id}/`, data),
  patch: (id, data) => api.patch(`/tenant/stores/${id}/`, data),
  delete: (id) => api.delete(`/tenant/stores/${id}/`),
};

// Category API
export const categoryAPI = {
  list: () => api.get('/products/categories/'),
  create: (data) => api.post('/products/categories/', data),
  get: (id) => api.get(`/products/categories/${id}/`),
  update: (id, data) => api.put(`/products/categories/${id}/`, data),
  toggleActive: (id) => api.post(`/products/categories/${id}/toggle_active/`),
  delete: (id) => api.delete(`/products/categories/${id}/`),
};

// Attribute API
export const attributeAPI = {
  list: () => api.get('/attributes/'),
  create: (data) => api.post('/attributes/', data),
  get: (id) => api.get(`/attributes/${id}/`),
  update: (id, data) => api.put(`/attributes/${id}/`, data),
  delete: (id) => api.delete(`/attributes/${id}/`),
  addValue: (id, value) => api.post(`/attributes/${id}/add_value/`, { value }),
  deleteValue: (id, valueId) => api.delete(`/attributes/${id}/values/${valueId}/`),
  byCategory: (categoryId) => api.get(`/attributes/category/${categoryId}/`),
};

// Product API
export const productAPI = {
  list: (params) => api.get('/products/', { params }),
  create: (data) => api.post('/products/', data),
  get: (id) => api.get(`/products/${id}/`),
  update: (id, data) => api.patch(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  checkSku: (sku) => api.post('/products/check_sku/', { sku }),
  uploadMedia: (id, formData) => api.post(`/products/${id}/upload_media/`, formData, {
    headers: { 'Content-Type': undefined },
  }),
  deleteMedia: (productId, mediaId) => api.delete(`/products/${productId}/media/${mediaId}/delete/`),
  setThumbnail: (productId, mediaId) => api.post(`/products/${productId}/media/${mediaId}/set_thumbnail/`),
  storefrontDetail: (id) => api.get(`/products/${id}/storefront_detail/`),
  selectAttributes: (id, attributeIds) => api.post(`/products/${id}/select_attributes/`, {
    attribute_ids: attributeIds,
  }),
  generateCatalog: (id, data) => api.post(`/products/${id}/generate_catalog/`, data),
  // Variant management
  updateVariant: (productId, variantId, data) =>
    api.patch(`/products/${productId}/variants/${variantId}/`, data),
  deleteVariant: (productId, variantId) =>
    api.delete(`/products/${productId}/variants/${variantId}/delete/`),
};

// Order API
export const orderAPI = {
  list: (status) => api.get('/orders/', { params: status ? { status } : {} }),
  get: (id) => api.get(`/orders/${id}/`),
  updateStatus: (id, status, notes) => api.patch(`/orders/${id}/status/`, { status, notes }),
  customers: (search) => api.get('/orders/customers/', { params: search ? { search } : {} }),
  customerOrders: ({ email, name }) => api.get('/orders/customers/by-email/', { params: email ? { email } : { name } }),
};

// Notification API
export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.patch('/notifications/read_all/'),
};

export default api;
