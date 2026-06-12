import axios from 'axios';
import { useStoreStore } from '../store/storeStore';
import { API_BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Request deduplication for GET requests
const pendingRequests = new Map();

const getRequestKey = (url, params, storeId) => {
  return `GET:${url}:${storeId || ''}:${JSON.stringify(params || {})}`;
};

const dedupGet = (url, config = {}) => {
  const storeId = useStoreStore.getState().activeStore?.id;
  const key = getRequestKey(url, config.params, storeId);

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = api.get(url, config).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

const shouldRetry = (error) => {
  if (axios.isCancel(error)) return false;
  if (error.code === 'ERR_CANCELED') return false;
  if (!error.config) return false;
  if (error.config._retryCount >= 3) return false;
  if (['post', 'put', 'patch', 'delete'].includes(error.config.method) && error.response) {
    return false;
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') return true;
  if (!error.response) return true;
  if (error.response.status >= 500) return true;
  return false;
};

const retryRequest = async (error) => {
  const config = error.config;
  config._retryCount = (config._retryCount || 0) + 1;
  const delay = Math.min(1000 * Math.pow(2, config._retryCount - 1), 5000);
  await sleep(delay);
  return api(config);
};

// Attach JWT token and active store to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const tenantMatch = /(?:^|;\s*)x-tenant-name=([^;]*)/.exec(document.cookie);
      const tenant = tenantMatch?.[1];
      if (tenant) {
        config.headers['X-Tenant'] = tenant;
      } else {
        const activeStore = useStoreStore.getState().activeStore;
        if (activeStore) {
          config.headers['X-Store-Id'] = activeStore.id;
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
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
  }
};

// Handle 401 — attempt token refresh before logging out
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    if (shouldRetry(error)) {
      return retryRequest(error);
    }

    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/token/refresh/' ||
      originalRequest.url === '/auth/login/'
    ) {
      throw error;
    }

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

    const refreshToken = typeof window === 'undefined'
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
      const newRefresh = data.refresh;

      localStorage.setItem('access_token', newAccess);
      if (newRefresh) {
        localStorage.setItem('refresh_token', newRefresh);
      }

      try {
        const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        if (stored.state) {
          stored.state.token = newAccess;
          localStorage.setItem('auth-storage', JSON.stringify(stored));
        }
      } catch { /* ignore parse errors */ }

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      processQueue(null, newAccess);

      try {
        return await api(originalRequest);
      } catch (retryError) {
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
  list: (params) => dedupGet('/tenant/stores/', { params }),
  myStores: (options) => api.get('/tenant/stores/my_stores/', options),
  create: (data) => api.post('/tenant/stores/', data),
  get: (id) => api.get(`/tenant/stores/${id}/`),
  update: (id, data) => api.put(`/tenant/stores/${id}/`, data),
  patch: (id, data) => api.patch(`/tenant/stores/${id}/`, data),
  delete: (id) => api.delete(`/tenant/stores/${id}/`),
};

// Category API
export const categoryAPI = {
  list: (params) => dedupGet('/products/categories/', { params }),
  create: (data) => api.post('/products/categories/', data),
  get: (id) => api.get(`/products/categories/${id}/`),
  update: (id, data) => api.put(`/products/categories/${id}/`, data),
  toggleActive: (id) => api.post(`/products/categories/${id}/toggle_active/`),
  delete: (id) => api.delete(`/products/categories/${id}/`),
};

// Attribute API
export const attributeAPI = {
  list: (params) => dedupGet('/attributes/', { params }),
  create: (data) => api.post('/attributes/', data),
  get: (id) => api.get(`/attributes/${id}/`),
  update: (id, data) => api.put(`/attributes/${id}/`, data),
  delete: (id) => api.delete(`/attributes/${id}/`),
  addValue: (id, value) => api.post(`/attributes/${id}/add_value/`, { value }),
  deleteValue: (id, valueId) => api.delete(`/attributes/${id}/values/${valueId}/`),
  byCategory: (categoryId) => dedupGet(`/attributes/category/${categoryId}/`),
};

// Product API
export const productAPI = {
  list: (params) => dedupGet('/products/', { params }),
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
  toggleActive: (id) => api.post(`/products/${id}/toggle_active/`),
};

// Order API
export const orderAPI = {
  list: (params) => dedupGet('/orders/', { params }),
  get: (id) => api.get(`/orders/${id}/`),
  updateStatus: (id, status, notes) => api.patch(`/orders/${id}/status/`, { status, notes }),
  customers: (search) => dedupGet('/orders/customers/', { params: search ? { search } : {} }),
  customerOrders: ({ email, name }) => api.get('/orders/customers/by-email/', { params: email ? { email } : { name } }),
  dashboardStats: () => dedupGet('/orders/dashboard-stats/'),
};

// Notification API
export const notificationAPI = {
  list: () => dedupGet('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.patch('/notifications/read_all/'),
};

export const isCancelledError = (error) =>
  axios.isCancel(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';

export default api;
