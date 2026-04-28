import axios from 'axios';
import { useStorefrontAuthStore } from '@/store/storefrontAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const storefrontApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Read auth from the Zustand in-memory store (already rehydrated from localStorage).
function getStoredAuth() {
  return useStorefrontAuthStore.getState();
}

// Write refreshed tokens back to both Zustand in-memory AND localStorage (via persist).
function setStoredTokens(accessToken, refreshToken) {
  useStorefrontAuthStore.setState({ accessToken, refreshToken });
}

// Clear auth from both Zustand in-memory AND localStorage (via persist).
function clearStoredAuth() {
  useStorefrontAuthStore.getState().logout();
}

// Attach X-Tenant header from cookie + auth token
storefrontApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tenantMatch = document.cookie.match(/(?:^|;\s*)x-tenant=([^;]*)/);
    const tenant = tenantMatch?.[1];
    if (tenant) {
      config.headers['X-Tenant'] = tenant;
    }

    const { accessToken } = getStoredAuth();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// Response interceptor: auto-refresh expired tokens
let refreshPromise = null;

storefrontApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Don't try refresh for auth endpoints themselves
    if (original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    const { refreshToken } = getStoredAuth();
    if (!refreshToken) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Deduplicate concurrent refresh calls
    if (!refreshPromise) {
      refreshPromise = axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken })
        .then((res) => {
          const newAccess = res.data.access;
          const newRefresh = res.data.refresh || refreshToken;
          setStoredTokens(newAccess, newRefresh);
          return newAccess;
        })
        .catch(() => {
          clearStoredAuth();
          return null;
        })
        .finally(() => { refreshPromise = null; });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers['Authorization'] = `Bearer ${newToken}`;
    return storefrontApi(original);
  }
);

export const storefrontAPI = {
  // Public
  getStoreInfo:  ()       => storefrontApi.get('/storefront/store/'),
  getCategories: ()       => storefrontApi.get('/storefront/categories/'),
  getProducts:   (params) => storefrontApi.get('/storefront/products/', { params }),
  getProduct:    (slug)   => storefrontApi.get(`/storefront/products/${encodeURIComponent(slug)}/`),
  createOrder:   (data)   => storefrontApi.post('/storefront/orders/', data),

  // Auth
  login:    (data) => storefrontApi.post('/auth/login/', data),
  register: (data) => storefrontApi.post('/auth/register/', data),
  refreshToken: (data) => storefrontApi.post('/auth/token/refresh/', data),

  // Customer (authenticated)
  getProfile:      ()     => storefrontApi.get('/auth/profile/'),
  updateProfile:   (data) => storefrontApi.patch('/auth/profile/update/', data),
  getAddresses:    ()     => storefrontApi.get('/auth/addresses/'),
  createAddress:   (data) => storefrontApi.post('/auth/addresses/', data),
  updateAddress:   (id, data) => storefrontApi.patch(`/auth/addresses/${id}/`, data),
  deleteAddress:   (id)   => storefrontApi.delete(`/auth/addresses/${id}/`),
  getMyOrders:     ()     => storefrontApi.get('/storefront/customer/orders/'),
  getOrderDetail:  (id)  => storefrontApi.get(`/storefront/customer/orders/${id}/`),
  requestReturn:   (id)  => storefrontApi.post(`/storefront/orders/${id}/return/`),
};

export default storefrontApi;
