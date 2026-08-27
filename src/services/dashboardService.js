/**
 * Dashboard Service
 * Funciones para obtener datos reales del dashboard desde el BFF
 */

import bffApi from './bffApi';

const dashboardService = {
  /**
   * Get User Dashboard - Obtiene datos del dashboard del usuario autenticado
   */
  getUserDashboard: async () => {
    return bffApi.getUserDashboard();
  },

  /**
   * Get Students - Obtiene lista de estudiantes del docente
   */
  getStudents: async (page = 1, limit = 50) => {
    return bffApi.getStudents({ page, limit });
  },

  /**
   * Get PACI Profiles - Obtiene perfiles PACI del docente
   */
  getPaciProfiles: async (filters = {}) => {
    return bffApi.getPaciProfiles(filters);
  },

  /**
   * Get Recent Jobs - Obtiene trabajos recientes del docente
   */
  getRecentJobs: async (page = 1, limit = 5) => {
    return bffApi.getJobs({ page, limit });
  },

  /**
   * Get Jobs History - Obtiene historial de trabajos
   */
  getJobsHistory: async () => {
    return bffApi.getJobsHistory();
  },
};

export default dashboardService;
