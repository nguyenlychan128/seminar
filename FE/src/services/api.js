import axios from 'axios';
import useAuthStore from '../stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/api',
});

// Track if refresh is in progress to prevent multiple concurrent calls
let isRefreshing = false;
let failedQueue = [];
const REFRESH_TIMEOUT = 30000; // 30 second timeout for refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

// Request interceptor: add token to headers
api.interceptors.request.use(
  (config) => {
    const { tokens } = useAuthStore.getState();
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 → refresh token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Only handle 401 responses and avoid infinite retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { tokens, setAccessToken, clearAuth } = useAuthStore.getState();

      if (!isRefreshing) {
        isRefreshing = true;

        if (!tokens.refreshToken) {
          clearAuth();
          isRefreshing = false;
          failedQueue = [];
          return Promise.reject(error);
        }

        // Call refresh endpoint with timeout to prevent infinite isRefreshing state
        const refreshPromise = Promise.race([
          api.post('/auth/refresh', { refreshToken: tokens.refreshToken }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Refresh token timeout')), REFRESH_TIMEOUT)
          ),
        ]);

        refreshPromise
          .then(({ data }) => {
            // Update both tokens if backend returns them
            if (data.data?.accessToken) {
              setAccessToken(data.data.accessToken, data.data?.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
              processQueue(null, data.data.accessToken);
            } else if (data.accessToken) {
              setAccessToken(data.accessToken, data.refreshToken);
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              processQueue(null, data.accessToken);
            }
          })
          .catch((err) => {
            clearAuth();
            processQueue(err);
          });
      }

      // Queue the request if refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
