/**
 * Auth Service
 * Funciones para autenticación con el BFF
 */

import bffApi from './bffApi';

const authService = {
  /**
   * Login - Autentica el usuario con email y password
   */
  login: async (email, password) => {
    try {
      const response = await bffApi.login(email, password);

      return {
        user: response.user,
        tokens: {
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        },
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Correo o contraseña incorrectos');
      }
      const message =
        error.response?.data?.message || error.message || 'Error al iniciar sesión';
      throw new Error(message);
    }
  },

  /**
   * Register - Crea un nuevo usuario
   */
  register: async (email, password, nombre, rut) => {
    try {
      const response = await bffApi.register({ email, password, nombre, rut });

      return {
        user: response.user,
        tokens: {
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        },
      };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Error al registrarse';
      throw new Error(message);
    }
  },

  /**
   * Logout - Invalida la sesión en el servidor
   */
  logout: async () => {
    try {
      await bffApi.logout();
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
      const response = await bffApi.refresh(refreshToken);

      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token || refreshToken,
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
      return await bffApi.getCurrentUser();
    } catch (error) {
      throw new Error('Error al obtener datos del usuario');
    }
  },

  /**
   * Update Profile - Actualiza datos del perfil del usuario
   */
  updateProfile: async (userData) => {
    try {
      return await bffApi.updateProfile(userData);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Error al actualizar perfil';
      throw new Error(message);
    }
  },
};

export default authService;
