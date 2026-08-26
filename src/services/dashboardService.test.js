/**
 * dashboardService.test.js
 * Pruebas unitarias para el servicio del dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import dashboardService from './dashboardService';
import bffApi from './bffApi';

vi.mock('./bffApi', () => ({
  default: {
    getUserDashboard: vi.fn(),
    getStudents: vi.fn(),
    getPaciProfiles: vi.fn(),
    getJobs: vi.fn(),
    getJobsHistory: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserDashboard', () => {
    it('debe retornar el dashboard del usuario', async () => {
      const mockDashboard = { user: { id: '1' }, recentJobs: [], timestamp: '2025-01-01' };
      bffApi.getUserDashboard.mockResolvedValueOnce(mockDashboard);

      const result = await dashboardService.getUserDashboard();

      expect(result).toEqual(mockDashboard);
      expect(bffApi.getUserDashboard).toHaveBeenCalledOnce();
    });
  });

  describe('getStudents', () => {
    it('debe retornar la lista de estudiantes', async () => {
      const mockStudents = [{ id: '1', nombre: 'Student 1' }];
      bffApi.getStudents.mockResolvedValueOnce(mockStudents);

      const result = await dashboardService.getStudents();

      expect(result).toEqual(mockStudents);
      expect(bffApi.getStudents).toHaveBeenCalledWith({ page: 1, limit: 50 });
    });

    it('debe pasar paginación personalizada', async () => {
      bffApi.getStudents.mockResolvedValueOnce([]);

      await dashboardService.getStudents(2, 10);

      expect(bffApi.getStudents).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  describe('getPaciProfiles', () => {
    it('debe retornar perfiles PACI con filtros por defecto', async () => {
      const mockProfiles = [{ id: '1', isActive: true }];
      bffApi.getPaciProfiles.mockResolvedValueOnce(mockProfiles);

      const result = await dashboardService.getPaciProfiles();

      expect(result).toEqual(mockProfiles);
      expect(bffApi.getPaciProfiles).toHaveBeenCalledWith({});
    });

    it('debe pasar filtros al bffApi', async () => {
      bffApi.getPaciProfiles.mockResolvedValueOnce([]);

      await dashboardService.getPaciProfiles({ isActive: true });

      expect(bffApi.getPaciProfiles).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('getRecentJobs', () => {
    it('debe retornar trabajos recientes con parámetros por defecto', async () => {
      const mockJobs = [{ id: '1', status: 'completed' }];
      bffApi.getJobs.mockResolvedValueOnce(mockJobs);

      const result = await dashboardService.getRecentJobs();

      expect(result).toEqual(mockJobs);
      expect(bffApi.getJobs).toHaveBeenCalledWith({ page: 1, limit: 5 });
    });

    it('debe pasar paginación personalizada', async () => {
      bffApi.getJobs.mockResolvedValueOnce([]);

      await dashboardService.getRecentJobs(2, 10);

      expect(bffApi.getJobs).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  describe('getJobsHistory', () => {
    it('debe retornar el historial de trabajos', async () => {
      const mockHistory = [{ id: '1' }];
      bffApi.getJobsHistory.mockResolvedValueOnce(mockHistory);

      const result = await dashboardService.getJobsHistory();

      expect(result).toEqual(mockHistory);
      expect(bffApi.getJobsHistory).toHaveBeenCalledOnce();
    });
  });
});
