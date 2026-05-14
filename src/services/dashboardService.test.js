/**
 * dashboardService.test.js
 * Pruebas unitarias para el servicio del dashboard
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dashboardService from './dashboardService';
import api from './api';

// Mock api
vi.mock('./api');

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('debe obtener estadísticas del dashboard', async () => {
      const mockStats = {
        totalStudents: 25,
        totalPACIs: 15,
        completedSessions: 42,
        pending: 3,
      };
      api.get.mockResolvedValueOnce({ data: mockStats });

      const result = await dashboardService.getDashboardStats();

      expect(result).toEqual(mockStats);
      expect(api.get).toHaveBeenCalledWith('/api/dashboard/stats');
    });

    it('debe manejar errores al obtener estadísticas', async () => {
      api.get.mockRejectedValueOnce({
        response: { data: { message: 'Error en servidor' } },
      });

      await expect(dashboardService.getDashboardStats()).rejects.toThrow(
        'Error en servidor'
      );
    });

    it('debe usar mensaje por defecto si no hay respuesta', async () => {
      api.get.mockRejectedValueOnce({ response: { data: {} } });

      await expect(dashboardService.getDashboardStats()).rejects.toThrow(
        'Error al obtener estadísticas'
      );
    });
  });

  describe('getStudents', () => {
    it('debe obtener lista de estudiantes', async () => {
      const mockStudents = {
        students: [{ id: '1', nombre: 'Student 1' }],
        total: 1,
      };
      api.get.mockResolvedValueOnce({ data: mockStudents });

      const result = await dashboardService.getStudents();

      expect(result).toEqual(mockStudents);
      expect(api.get).toHaveBeenCalledWith('/api/students', {
        params: { page: 1, limit: 20 },
      });
    });

    it('debe permitir paginación personalizada', async () => {
      api.get.mockResolvedValueOnce({ data: { students: [] } });

      await dashboardService.getStudents(2, 50);

      expect(api.get).toHaveBeenCalledWith('/api/students', {
        params: { page: 2, limit: 50 },
      });
    });

    it('debe manejar errores al obtener estudiantes', async () => {
      api.get.mockRejectedValueOnce({
        response: { data: { message: 'Acceso denegado' } },
      });

      await expect(dashboardService.getStudents()).rejects.toThrow('Acceso denegado');
    });
  });

  describe('getStudent', () => {
    it('debe obtener datos de un estudiante específico', async () => {
      const mockStudent = {
        id: 'student_1',
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
      };
      api.get.mockResolvedValueOnce({ data: mockStudent });

      const result = await dashboardService.getStudent('student_1');

      expect(result).toEqual(mockStudent);
      expect(api.get).toHaveBeenCalledWith('/api/students/student_1');
    });

    it('debe manejar estudiante no encontrado', async () => {
      api.get.mockRejectedValueOnce({
        response: { data: { message: 'Estudiante no encontrado' } },
      });

      await expect(dashboardService.getStudent('invalid_id')).rejects.toThrow(
        'Estudiante no encontrado'
      );
    });

    it('debe usar mensaje por defecto', async () => {
      api.get.mockRejectedValueOnce({ response: { data: {} } });

      await expect(dashboardService.getStudent('student_1')).rejects.toThrow(
        'Error al obtener estudiante'
      );
    });
  });

  describe('getRecentMaterials', () => {
    it('debe obtener materiales recientes', async () => {
      const mockMaterials = {
        materials: [{ id: '1', titulo: 'Matemáticas' }],
        total: 1,
      };
      api.get.mockResolvedValueOnce({ data: mockMaterials });

      const result = await dashboardService.getRecentMaterials();

      expect(result).toEqual(mockMaterials);
      expect(api.get).toHaveBeenCalledWith('/api/materials/recent', {
        params: { limit: 5 },
      });
    });

    it('debe permitir límite personalizado', async () => {
      api.get.mockResolvedValueOnce({ data: { materials: [] } });

      await dashboardService.getRecentMaterials(10);

      expect(api.get).toHaveBeenCalledWith('/api/materials/recent', {
        params: { limit: 10 },
      });
    });

    it('debe manejar errores al obtener materiales', async () => {
      api.get.mockRejectedValueOnce({
        response: { data: { message: 'Error al acceder a materiales' } },
      });

      await expect(dashboardService.getRecentMaterials()).rejects.toThrow(
        'Error al acceder a materiales'
      );
    });
  });
});
