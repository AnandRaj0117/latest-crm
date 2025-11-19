// =========================================
// CENTRALIZED API CONFIGURATION
// =========================================
// Change the API URL in ONE place here!

// Get API URL from environment variable or use default
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Remove /api suffix if it exists (we'll add it back in helper functions)
export const API_ROOT = API_BASE_URL.replace('/api', '');

// Helper function to get full API URL
export const getApiUrl = (endpoint = '') => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // If endpoint starts with 'api/', use API_ROOT
  if (cleanEndpoint.startsWith('api/')) {
    return `${API_ROOT}/${cleanEndpoint}`;
  }

  // Otherwise, assume it needs /api prefix
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function for authenticated fetch requests
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const defaultHeaders = {
    ...(options.headers || {}),
  };

  // Add Authorization header if token exists and not already set
  if (token && !defaultHeaders.Authorization) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // Don't add Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData) && !defaultHeaders['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: defaultHeaders,
  };

  const url = getApiUrl(endpoint);
  const response = await fetch(url, config);

  return response;
};

// Export for easy importing
export default {
  API_BASE_URL,
  API_ROOT,
  getApiUrl,
  apiFetch,
};
