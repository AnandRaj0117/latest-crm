import axios from 'axios';
import { apiCache, cacheConfig } from '../utils/apiCache';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Handle 401 unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

// Enhanced API methods with caching
const getCacheOptions = (url) => {
  const endpoint = url.split('/')[1] || url.split('/')[0];
  return cacheConfig[endpoint] || {};
};

// Wrap GET requests with caching
const originalGet = api.get.bind(api);
api.get = function(url, config = {}) {
  const cacheOptions = getCacheOptions(url);
  const params = config.params || {};

  return apiCache.fetch(
    'GET',
    url,
    params,
    () => originalGet(url, config),
    { ...cacheOptions, ...config.cache }
  );
};

// Wrap mutation methods to invalidate cache
const wrapMutationMethod = (method, originalMethod) => {
  return function(url, data, config = {}) {
    return originalMethod(url, data, config).then((result) => {
      // Auto-invalidate related cache after mutations
      const endpoint = url.split('/')[1] || url.split('/')[0];
      if (endpoint && apiCache.clearPattern) {
        apiCache.clearPattern(`GET:/${endpoint}`);
      }
      return result;
    });
  };
};

api.post = wrapMutationMethod('POST', api.post.bind(api));
api.put = wrapMutationMethod('PUT', api.put.bind(api));
api.patch = wrapMutationMethod('PATCH', api.patch.bind(api));
api.delete = wrapMutationMethod('DELETE', api.delete.bind(api));

// Export cache utilities for manual cache management
export { apiCache, cacheConfig };
export default api;
