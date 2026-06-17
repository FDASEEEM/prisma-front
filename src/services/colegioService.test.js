import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import colegioService from './colegioService';

vi.mock('axios');
vi.mock('../utils/localStorage', () => ({
  default: {
    getToken: vi.fn(() => 'mock-token'),
  },
}));
vi.mock('./authSession', () => ({
  handleAuthFailure: vi.fn(),
}));

describe('colegioService', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axios.create.mockReturnValue(mockAxiosInstance);
  });

  describe('getAll', () => {
    it('should fetch colegios with pagination', async () => {
      const mockData = { data: [{ id: '1' }], total: 1, page: 1, limit: 20, totalPages: 1 };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await colegioService.getAll({ page: '1', limit: '20' });

      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { data: { message: 'Error de red' } },
      });

      await expect(colegioService.getAll()).rejects.toThrow('Error de red');
    });
  });

  describe('getById', () => {
    it('should fetch a colegio by id', async () => {
      const mockColegio = { id: 'colegio-1', nombre: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockColegio });

      const result = await colegioService.getById('colegio-1');

      expect(result).toEqual(mockColegio);
    });
  });

  describe('create', () => {
    it('should create a colegio', async () => {
      const payload = { nombre: 'Nuevo', email: 'nuevo@test.cl' };
      const mockResponse = { colegio: { id: 'new-id' }, admin: { id: 'admin-id' } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await colegioService.create(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a colegio', async () => {
      const payload = { nombre: 'Actualizado' };
      mockAxiosInstance.patch.mockResolvedValue({ data: { id: '1', nombre: 'Actualizado' } });

      const result = await colegioService.update('1', payload);

      expect(result.nombre).toBe('Actualizado');
    });
  });

  describe('deactivate', () => {
    it('should deactivate a colegio', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { id: '1', activo: false } });

      const result = await colegioService.deactivate('1');

      expect(result.activo).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should fetch stats for a colegio', async () => {
      const mockStats = { totalUsers: 10, activeUsers: 8 };
      mockAxiosInstance.get.mockResolvedValue({ data: mockStats });

      const result = await colegioService.getStats('colegio-1');

      expect(result.totalUsers).toBe(10);
    });
  });

  describe('getProfessors', () => {
    it('should fetch professors for a colegio', async () => {
      const mockProfessors = [{ id: '1', nombreCompleto: 'Prof 1' }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockProfessors });

      const result = await colegioService.getProfessors('colegio-1');

      expect(result).toHaveLength(1);
    });
  });
});
