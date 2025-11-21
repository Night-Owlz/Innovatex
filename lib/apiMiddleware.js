import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AI_URL = process.env.NEXT_PUBLIC_AI_API_URL;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Create separate axios instance for AI routes
const aiClient = axios.create({
  baseURL: `${AI_URL}/api/ai`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Shared request interceptor function
const requestInterceptor = (config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Shared response interceptor functions
const responseSuccessInterceptor = (response) => response.data;

const responseErrorInterceptor = (error) => {
  let errorMessage = 'An error occurred';

  if (error.response) {
    const { data, status } = error.response;

    if (data?.errors) {
      const firstError = Object.values(data.errors)[0];
      errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
    } else if (data?.message) {
      errorMessage = data.message;
    } else {
      errorMessage = `HTTP error! status: ${status}`;
    }

    if (status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
  } else if (error.request) {
    errorMessage = `Cannot connect to server. Please make sure the backend server is running on ${API_URL}`;
  } else {
    errorMessage = error.message;
  }

  return Promise.reject(new Error(errorMessage));
};

// Apply interceptors to both clients
apiClient.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
apiClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

aiClient.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
aiClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

// Middleware functions for different HTTP methods
export const apiMiddleware = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data, config = {}) => apiClient.post(url, data, config),
  put: (url, data, config = {}) => apiClient.put(url, data, config),
  patch: (url, data, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// AI middleware using the AI client
export const aiMiddleware = {
  get: (url, config = {}) => aiClient.get(url, config),
  post: (url, data, config = {}) => aiClient.post(url, data, config),
  put: (url, data, config = {}) => aiClient.put(url, data, config),
  patch: (url, data, config = {}) => aiClient.patch(url, data, config),
  delete: (url, config = {}) => aiClient.delete(url, config),
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

  // Chatbot routes
  chatbot: {
    message: '/chatbot/message',
    sessions: '/chatbot/sessions',
    deleteSession: (sessionId) => `/chatbot/sessions/${sessionId}`,
  },

  // OCR routes
  ocr: {
    extract: '/ocr-extract',
  },

  // AI routes (use aiMiddleware for these)
  ai: {
    wasteEstimation: '/waste-estimation',
    sdgScore: '/calculate-sdg-score',
  },
};

export default apiClient;
