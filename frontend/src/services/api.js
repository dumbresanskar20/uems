import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('uems_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('uems_refresh_token');
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const newToken = res.data.token;
          localStorage.setItem('uems_token', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('uems_token');
        localStorage.removeItem('uems_user');
        localStorage.removeItem('uems_refresh_token');
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      window.location.href = '/subscription?expired=true';
    }

    return Promise.reject(error);
  }
);

export default api;
