import axios from 'axios';
import { SUPERADMIN_ENDPOINTS } from '../constants/api';
import storageUtils from '../utils/localStorage';
import { handleAuthFailure } from './authSession';

const createSuperAdminApi = () => {
  const superAdminApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  superAdminApi.interceptors?.request?.use?.((config) => {
    const token = storageUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  superAdminApi.interceptors?.response?.use?.(
    (response) => response,
    (error) => {
      const originalRequest = error.config;
      const errorResponse = error.response?.data;
      const requestUrl = originalRequest?.url || '';
      if (error.response?.status === 401) {
        handleAuthFailure(errorResponse, requestUrl);
      }
      return Promise.reject(error);
    }
  );

  return superAdminApi;
};

const getMessage = (error, fallback) => error.response?.data?.message || fallback;

const colegioService = {
  getAll: async (params) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const url = new URL(SUPERADMIN_ENDPOINTS.COLEGIOS, window.location.origin);
      if (params?.page) url.searchParams.set('page', params.page);
      if (params?.limit) url.searchParams.set('limit', params.limit);
      if (params?.activo !== undefined) url.searchParams.set('activo', params.activo);
      if (params?.plan) url.searchParams.set('plan', params.plan);
      const response = await superAdminApi.get(url.pathname + url.search);
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al obtener colegios'));
    }
  },

  getById: async (id) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const response = await superAdminApi.get(SUPERADMIN_ENDPOINTS.COLEGIO(id));
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al obtener colegio'));
    }
  },

  create: async (payload) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const response = await superAdminApi.post(SUPERADMIN_ENDPOINTS.COLEGIOS, payload);
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al crear colegio'));
    }
  },

  update: async (id, payload) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const response = await superAdminApi.patch(SUPERADMIN_ENDPOINTS.COLEGIO(id), payload);
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al actualizar colegio'));
    }
  },

  deactivate: async (id) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const response = await superAdminApi.delete(SUPERADMIN_ENDPOINTS.COLEGIO(id));
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al desactivar colegio'));
    }
  },

  getStats: async (id) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const response = await superAdminApi.get(SUPERADMIN_ENDPOINTS.COLEGIO_STATS(id));
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al obtener estadísticas'));
    }
  },

  getProfessors: async (id) => {
    try {
      const superAdminApi = createSuperAdminApi();
      const response = await superAdminApi.get(SUPERADMIN_ENDPOINTS.COLEGIO_PROFESSORS(id));
      return response.data;
    } catch (error) {
      throw new Error(getMessage(error, 'Error al obtener profesores'));
    }
  },
};

export default colegioService;
