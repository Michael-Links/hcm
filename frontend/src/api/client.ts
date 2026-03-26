import axios from 'axios';
import { LANGUAGE_STORAGE_KEY } from '../i18n/config';

const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecm_token');
  const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (language) {
    config.headers['Accept-Language'] = language;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ecm_token');
      localStorage.removeItem('ecm_role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
