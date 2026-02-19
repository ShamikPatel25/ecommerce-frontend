import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
// api.interceptors.request.use(
//   (config) => {
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('access_token');
      
//       console.log('📤 API Request:', config.method.toUpperCase(), config.url); // Debug
//       console.log('🔑 Token:', token ? 'Present' : 'Missing'); // Debug
      
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Handle 401 errors
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     console.error('❌ API Error:', error.response?.status, error.response?.data); // Debug
    
//     if (error.response?.status === 401) {
//       if (typeof window !== 'undefined') {
//         console.log('🚪 Unauthorized - clearing auth'); // Debug
//         localStorage.clear();
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

api.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', config.method.toUpperCase(), config.url); // Debug
    console.log('📦 Request data:', config.data); // Debug
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data); // Debug
    console.error('❌ Request URL:', error.config?.url); // Debug
    
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  getProfile: () => api.get('/auth/profile/'),
};

// Store API
export const storeAPI = {
  list: () => api.get('/tenant/stores/'),
  myStores: () => api.get('/tenant/stores/my_stores/'),
  create: (data) => api.post('/tenant/stores/', data),
  get: (id) => api.get(`/tenant/stores/${id}/`),
  update: (id, data) => api.put(`/tenant/stores/${id}/`, data),
  delete: (id) => api.delete(`/tenant/stores/${id}/`),
};

// Category API
export const categoryAPI = {
  list: () => api.get('/products/categories/'),
  tree: () => api.get('/products/categories/tree/'),
  create: (data) => api.post('/products/categories/', data),
  get: (id) => api.get(`/products/categories/${id}/`),
  update: (id, data) => api.put(`/products/categories/${id}/`, data),
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
  addBulkValues: (id, values) => api.post(`/attributes/${id}/add_bulk_values/`, { values }),
  deleteValue: (id, valueId) => api.delete(`/attributes/${id}/values/${valueId}/`),
  byCategory: (categoryId) => api.get(`/attributes/category/${categoryId}/`),
};

// Product API
export const productAPI = {
  list: () => api.get('/products/'),
  create: (data) => api.post('/products/', data),
  get: (id) => api.get(`/products/${id}/`),
  update: (id, data) => api.put(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  uploadMedia: (id, formData) => api.post(`/products/${id}/upload_media/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  selectAttributes: (id, attributeIds) => api.post(`/products/${id}/select_attributes/`, { 
    attribute_ids: attributeIds 
  }),
  generateCatalog: (id, data) => api.post(`/products/${id}/generate_catalog/`, data),
  availableAttributes: (id) => api.get(`/products/${id}/available_attributes/`),
  featured: () => api.get('/products/featured/'),
  toggleFeatured: (id) => api.post(`/products/${id}/toggle_featured/`),
};

export default api;