/**
 * API Service - Axios Instance
 * Configuración centralizada para todas las llamadas HTTP
 */

import axios from 'axios';
import storageUtils from '../utils/localStorage';
import { handleAuthFailure } from './authSession';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token en cada request
api.interceptors.request.use(
  (config) => {
    const token = storageUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorResponse = error.response?.data;
    const requestUrl = originalRequest?.url || '';

    if (error.response?.status === 401) {
      handleAuthFailure(errorResponse, requestUrl);
    }

    return Promise.reject(error);
  }
);

export default api;
