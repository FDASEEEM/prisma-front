/**
 * Auth Service
 * Funciones para autenticación con la API
 */

import api from './api';
import { AUTH_ENDPOINTS } from '../constants/api';
import {
  getAuthErrorMessage,
  isInvalidCredentialsError,
} from './authErrors';

const authService = {
  /**
   * Login - Autentica el usuario con email y password
   */
  login: async (email, password) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      return {
        user,
        tokens: {
          access_token,
          refresh_token,
        },
      };
    } catch (error) {
      if (error.response?.status === 401) {
        if (isInvalidCredentialsError(error.response?.data)) {
          throw new Error('Correo o contraseña incorrectos');
        }

        throw new Error(
          getAuthErrorMessage(error.response?.data, 'Tu sesión expiró. Vuelve a iniciar sesión.'),
        );
      }
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  },

  /**
   * Register - Crea un nuevo usuario
   */
  register: async (email, password, nombre, rut) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, {
        email,
        password,
        nombre,
        rut,
      });

      const { access_token, refresh_token, user } = response.data;

      return {
        user,
        tokens: {
          access_token,
          refresh_token,
        },
      };
    } catch (error) {
      if (error.response?.status === 409) {
        throw new Error('El correo ya está registrado');
      }
      throw new Error(error.response?.data?.message || 'Error al registrarse');
    }
  },

  /**
   * Logout - Invalida la sesión en el servidor
   */
  logout: async () => {
    try {
      await api.post(AUTH_ENDPOINTS.LOGOUT);
      return { success: true };
    } catch (error) {
      // Aunque falle la llamada al servidor, limpiamos la sesión local
      console.warn('Error al cerrar sesión en el servidor:', error);
      return { success: true };
    }
  },

  /**
   * Refresh Token - Renueva el token de acceso
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REFRESH, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;

      return {
        access_token,
        refresh_token: newRefreshToken || refreshToken,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      }

      throw new Error('No se pudo renovar la sesión');
    }
  },

  /**
   * Get Current User - Obtiene los datos del usuario autenticado
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get(AUTH_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener datos del usuario');
    }
  },

  /**
   * Update Profile - Actualiza datos del perfil del usuario
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.patch(AUTH_ENDPOINTS.ME, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al actualizar perfil');
    }
  },
};

export default authService;
