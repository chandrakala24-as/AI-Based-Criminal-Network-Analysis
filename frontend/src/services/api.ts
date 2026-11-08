import axios from 'axios';

// Support VITE_API_BASE_URL for Render / production deployment
// When frontend is hosted on a separate domain (e.g. Render Static Site),
// set VITE_API_BASE_URL to the full backend URL like https://crimegraph-backend.onrender.com
const rawBase = import.meta.env.VITE_API_BASE_URL || '';
export const BACKEND_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crimegraph_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('crimegraph_token');
      localStorage.removeItem('crimegraph_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
