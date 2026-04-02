import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const storefrontApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Only attach X-Tenant header — no auth token for public storefront
storefrontApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tenantMatch = document.cookie.match(/(?:^|;\s*)x-tenant=([^;]*)/);
    const tenant = tenantMatch?.[1];
    if (tenant) {
      config.headers['X-Tenant'] = tenant;
    }
  }
  return config;
});

export const storefrontAPI = {
  getStoreInfo:  ()       => storefrontApi.get('/storefront/store/'),
  getCategories: ()       => storefrontApi.get('/storefront/categories/'),
  getProducts:   (params) => storefrontApi.get('/storefront/products/', { params }),
  getProduct:    (slug)   => storefrontApi.get(`/storefront/products/${slug}/`),
  createOrder:   (data)   => storefrontApi.post('/storefront/orders/', data),
};

export default storefrontApi;
