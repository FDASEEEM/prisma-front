/**
 * Dashboard Service
 * Funciones para obtener datos del dashboard
 */

import api from './api';

const dashboardService = {
  /**
   * Get Dashboard Stats - Obtiene estadísticas del docente
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  },

  /**
   * Get Students - Obtiene lista de estudiantes del docente
   */
  getStudents: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/api/students', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estudiantes');
    }
  },

  /**
   * Get Student by ID - Obtiene datos de un estudiante específico
   */
  getStudent: async (studentId) => {
    try {
      const response = await api.get(`/api/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener estudiante');
    }
  },

  /**
   * Get Recent Materials - Obtiene materiales recientes del docente
   */
  getRecentMaterials: async (limit = 5) => {
    try {
      const response = await api.get('/api/materials/recent', {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener materiales');
    }
  },
};

export default dashboardService;
