import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add auth token automatically
apiClient.interceptors.request.use(
  (config) => {
    // Get token from cookies
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Return the full response data (includes data, meta, etc.)
    return response.data;
  },
  (error) => {
    let errorMessage = 'An error occurred';

    if (error.response) {
      // Server responded with error status
      const { data, status } = error.response;

      // Handle Laravel validation errors
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (data?.message) {
        errorMessage = data.message;
      } else {
        errorMessage = `HTTP error! status: ${status}`;
      }

      // Handle 401 Unauthorized - clear token and redirect to login
      if (status === 401 && typeof window !== 'undefined') {
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request made but no response received
      errorMessage = `Cannot connect to server. Please make sure the backend server is running on ${API_URL}`;
    } else {
      // Something else happened
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

// Middleware functions for different HTTP methods
export const apiMiddleware = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// Route definitions - centralized endpoint management
export const routes = {
  // Auth routes
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
  },

  // User routes
  user: {
    profile: '/profile',
  },

  // Consumption logs routes
  consumptionLogs: {
    list: '/consumption-logs',
    create: '/consumption-logs',
    delete: (id) => `/consumption-logs/${id}`,
  },

  // Inventory routes
  inventory: {
    list: '/inventory',
    create: '/inventory',
    update: (id) => `/inventory/${id}`,
    delete: (id) => `/inventory/${id}`,
    expiring: '/inventory/expiring',
    expiringCount: '/inventory/expiring/count',
    totalCount: '/inventory/count',
  },

  // Food items routes
  foodItems: {
    list: '/food-items',
  },

  // Resources routes
  resources: {
    list: '/resources',
  },

  // Dashboard routes
  dashboard: {
    summary: '/dashboard/summary',
    recommendations: '/dashboard/recommendations',
  },

  // Image routes
  images: {
    upload: '/images/upload',
    list: '/images',
  },
};

export default apiClient;
