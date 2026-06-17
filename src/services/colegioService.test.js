import { describe, it, expect, vi, beforeEach } from 'vitest';
import colegioService from './colegioService';
import bffApi from './bffApi';

vi.mock('./bffApi', () => ({
  default: {
    getColegios: vi.fn(),
    getColegioById: vi.fn(),
    createColegio: vi.fn(),
    updateColegio: vi.fn(),
    deactivateColegio: vi.fn(),
    getColegioStats: vi.fn(),
    getColegioProfessors: vi.fn(),
  },
}));

describe('colegioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch colegios with pagination', async () => {
      const mockData = { data: [{ id: '1' }], total: 1, page: 1, limit: 20, totalPages: 1 };
      (bffApi.getColegios as any).mockResolvedValue(mockData);

      const result = await colegioService.getAll({ page: '1', limit: '20' });

      expect(result).toEqual(mockData);
      expect(bffApi.getColegios).toHaveBeenCalledWith({ page: '1', limit: '20' });
    });

    it('should handle errors', async () => {
      (bffApi.getColegios as any).mockRejectedValue(new Error('Error de red'));

      await expect(colegioService.getAll()).rejects.toThrow('Error de red');
    });
  });

  describe('getById', () => {
    it('should fetch a colegio by id', async () => {
      const mockColegio = { id: 'colegio-1', nombre: 'Test' };
      (bffApi.getColegioById as any).mockResolvedValue(mockColegio);

      const result = await colegioService.getById('colegio-1');

      expect(result).toEqual(mockColegio);
      expect(bffApi.getColegioById).toHaveBeenCalledWith('colegio-1');
    });
  });

  describe('create', () => {
    it('should create a colegio', async () => {
      const payload = { nombre: 'Nuevo', email: 'nuevo@test.cl' };
      const mockResponse = { colegio: { id: 'new-id' }, admin: { id: 'admin-id' } };
      (bffApi.createColegio as any).mockResolvedValue(mockResponse);

      const result = await colegioService.create(payload);

      expect(result).toEqual(mockResponse);
      expect(bffApi.createColegio).toHaveBeenCalledWith(payload);
    });
  });

  describe('update', () => {
    it('should update a colegio', async () => {
      const payload = { nombre: 'Actualizado' };
      (bffApi.updateColegio as any).mockResolvedValue({ id: '1', nombre: 'Actualizado' });

      const result = await colegioService.update('1', payload);

      expect(result.nombre).toBe('Actualizado');
      expect(bffApi.updateColegio).toHaveBeenCalledWith('1', payload);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a colegio', async () => {
      (bffApi.deactivateColegio as any).mockResolvedValue({ id: '1', activo: false });

      const result = await colegioService.deactivate('1');

      expect(result.activo).toBe(false);
      expect(bffApi.deactivateColegio).toHaveBeenCalledWith('1');
    });
  });

  describe('getStats', () => {
    it('should fetch stats for a colegio', async () => {
      const mockStats = { totalUsers: 10, activeUsers: 8 };
      (bffApi.getColegioStats as any).mockResolvedValue(mockStats);

      const result = await colegioService.getStats('colegio-1');

      expect(result.totalUsers).toBe(10);
      expect(bffApi.getColegioStats).toHaveBeenCalledWith('colegio-1');
    });
  });

  describe('getProfessors', () => {
    it('should fetch professors for a colegio', async () => {
      const mockProfessors = { data: [{ id: '1', nombreCompleto: 'Prof 1' }] };
      (bffApi.getColegioProfessors as any).mockResolvedValue(mockProfessors);

      const result = await colegioService.getProfessors('colegio-1', { page: '1' });

      expect(result.data).toHaveLength(1);
      expect(bffApi.getColegioProfessors).toHaveBeenCalledWith('colegio-1', { page: '1' });
    });
  });
});
