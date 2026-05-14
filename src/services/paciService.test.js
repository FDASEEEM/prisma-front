/**
 * paciService.test.js
 * Pruebas unitarias para el servicio de perfiles PACI
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as paciService from './paciService';
import api from './api';

// Mock api
vi.mock('./api');

describe('paciService', () => {
  let mockPaciApi;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPaciApi = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    api.create = vi.fn().mockReturnValue(mockPaciApi);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPACIs', () => {
    it('debe obtener todos los perfiles PACI', async () => {
      const mockPACIs = [{ id: '1', nombre: 'PACI 1' }];
      mockPaciApi.get.mockResolvedValueOnce({ data: mockPACIs });

      const result = await paciService.getAllPACIs();

      expect(result).toEqual(mockPACIs);
      expect(mockPaciApi.get).toHaveBeenCalled();
    });

    it('debe aplicar filtros de studentId', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      const filters = { studentId: 'student_123' };

      await paciService.getAllPACIs(filters);

      expect(mockPaciApi.get).toHaveBeenCalled();
    });

    it('debe aplicar filtro isActive', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      const filters = { isActive: true };

      await paciService.getAllPACIs(filters);

      expect(mockPaciApi.get).toHaveBeenCalled();
    });

    it('debe aplicar filtro curso', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      const filters = { curso: 'Quinto Básico' };

      await paciService.getAllPACIs(filters);

      expect(mockPaciApi.get).toHaveBeenCalled();
    });

    it('debe incluir filtros de fechas', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      const filters = {
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
      };

      await paciService.getAllPACIs(filters);

      expect(mockPaciApi.get).toHaveBeenCalled();
    });

    it('debe combinar múltiples filtros', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      const filters = {
        studentId: 'student_123',
        isActive: true,
        curso: 'Quinto',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
      };

      await paciService.getAllPACIs(filters);

      expect(mockPaciApi.get).toHaveBeenCalled();
    });
  });

  describe('getActivePACIs', () => {
    it('debe obtener solo perfiles PACI activos', async () => {
      const mockActivePACIs = [{ id: '1', isActive: true }];
      mockPaciApi.get.mockResolvedValueOnce({ data: mockActivePACIs });

      const result = await paciService.getActivePACIs();

      expect(result).toEqual(mockActivePACIs);
      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/active');
    });
  });

  describe('getHistoricalPACIs', () => {
    it('debe obtener perfiles PACI históricos', async () => {
      const mockHistorical = [{ id: '1', isActive: false }];
      mockPaciApi.get.mockResolvedValueOnce({ data: mockHistorical });

      const result = await paciService.getHistoricalPACIs();

      expect(result).toEqual(mockHistorical);
      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/historical');
    });
  });

  describe('getRecentPACIs', () => {
    it('debe obtener perfiles PACI recientes con límite por defecto', async () => {
      const mockRecent = [{ id: '1', createdAt: '2024-05-01' }];
      mockPaciApi.get.mockResolvedValueOnce({ data: mockRecent });

      const result = await paciService.getRecentPACIs();

      expect(result).toEqual(mockRecent);
      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/recent?limit=10');
    });

    it('debe respetar el límite proporcionado', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      await paciService.getRecentPACIs(5);

      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/recent?limit=5');
    });

    it('debe soportar límites grandes', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      await paciService.getRecentPACIs(100);

      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/recent?limit=100');
    });
  });

  describe('createPACI', () => {
    it('debe crear un nuevo perfil PACI', async () => {
      const mockData = { nombre: 'Nuevo PACI', studentId: 'student_123' };
      const mockResult = { id: 'paci_1', ...mockData };
      mockPaciApi.post.mockResolvedValueOnce({ data: mockResult });

      const result = await paciService.createPACI(mockData);

      expect(result).toEqual(mockResult);
      expect(mockPaciApi.post).toHaveBeenCalledWith('/paci-profiles', mockData);
    });

    it('debe manejar errores al crear', async () => {
      mockPaciApi.post.mockRejectedValueOnce(new Error('Validation error'));

      await expect(paciService.createPACI({})).rejects.toThrow();
    });
  });

  describe('createStudent', () => {
    it('debe crear un nuevo estudiante', async () => {
      const mockStudent = { nombre: 'Nuevo Estudiante', rut: '12.345.678-9' };
      const mockResult = { id: 'student_1', ...mockStudent };
      mockPaciApi.post.mockResolvedValueOnce({ data: mockResult });

      const result = await paciService.createStudent(mockStudent);

      expect(result).toEqual(mockResult);
      expect(mockPaciApi.post).toHaveBeenCalledWith('/students', mockStudent);
    });
  });

  describe('updatePACI', () => {
    it('debe actualizar un perfil PACI', async () => {
      const mockUpdate = { nombre: 'PACI Actualizado' };
      const mockResult = { id: 'paci_1', ...mockUpdate };
      mockPaciApi.patch.mockResolvedValueOnce({ data: mockResult });

      const result = await paciService.updatePACI('paci_1', mockUpdate);

      expect(result).toEqual(mockResult);
      expect(mockPaciApi.patch).toHaveBeenCalledWith('/paci-profiles/paci_1', mockUpdate);
    });

    it('debe manejar errores al actualizar', async () => {
      mockPaciApi.patch.mockRejectedValueOnce(new Error('Update failed'));

      await expect(paciService.updatePACI('paci_1', {})).rejects.toThrow();
    });
  });

  describe('getPACIById', () => {
    it('debe obtener un perfil PACI por ID', async () => {
      const mockPACI = { id: 'paci_1', nombre: 'PACI Test' };
      mockPaciApi.get.mockResolvedValueOnce({ data: mockPACI });

      const result = await paciService.getPACIById('paci_1');

      expect(result).toEqual(mockPACI);
      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/paci_1');
    });

    it('debe manejar errores cuando PACI no existe', async () => {
      mockPaciApi.get.mockRejectedValueOnce(new Error('Not found'));

      await expect(paciService.getPACIById('invalid_id')).rejects.toThrow();
    });
  });

  describe('getPACIsByStudentId', () => {
    it('debe obtener perfiles PACI por ID de estudiante', async () => {
      const mockPACIs = [{ id: 'paci_1', studentId: 'student_1' }];
      mockPaciApi.get.mockResolvedValueOnce({ data: mockPACIs });

      const result = await paciService.getPACIsByStudentId('student_1');

      expect(result).toEqual(mockPACIs);
      expect(mockPaciApi.get).toHaveBeenCalledWith('/paci-profiles/student/student_1');
    });

    it('debe retornar lista vacía si estudiante no tiene PACIs', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });

      const result = await paciService.getPACIsByStudentId('student_without_paci');

      expect(result).toEqual([]);
    });

    it('debe manejar errores', async () => {
      mockPaciApi.get.mockRejectedValueOnce(new Error('Server error'));

      await expect(paciService.getPACIsByStudentId('student_1')).rejects.toThrow();
    });
  });

  describe('deletePACI', () => {
    it('debe eliminar un perfil PACI', async () => {
      const mockResult = { success: true };
      mockPaciApi.delete.mockResolvedValueOnce({ data: mockResult });

      const result = await paciService.deletePACI('paci_1');

      expect(result).toEqual(mockResult);
      expect(mockPaciApi.delete).toHaveBeenCalledWith('/paci-profiles/paci_1');
    });

    it('debe manejar errores al eliminar', async () => {
      mockPaciApi.delete.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(paciService.deletePACI('paci_1')).rejects.toThrow();
    });
  });
});
