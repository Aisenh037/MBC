import axios from 'axios';

// Configurable token getter
let getToken = () => null;

export const configureApiClient = ({ getToken: tokenGetter }) => {
  getToken = tokenGetter;
};

const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.debug('Token retrieval failed:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Prevent redirect loop
      if (!window.location.pathname.includes('/login')) {
        try {
          // Optional: Call logout if configured
          if (typeof getToken()?.logout === 'function') {
            getToken().logout();
          }
        } catch (e) {
          console.debug('Logout failed:', e);
        }
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Unauthorized'));
    }
    
    // Generic error handling
    if (error.response) {
      // Server responded with non-2xx status
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || 'Request failed',
        data: error.response.data
      });
    } else if (error.request) {
      // Request was made but no response
      return Promise.reject(new Error('Network error - no response received'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export default apiClient;