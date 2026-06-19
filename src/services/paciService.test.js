/**
 * paciService.test.js
 * Pruebas unitarias del servicio de perfiles PACI (axios → BFF).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// El servicio crea su instancia de axios en import-time → mock hoisted.
const { mockPaciApi } = vi.hoisted(() => ({
  mockPaciApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}));

vi.mock('axios', () => ({
  default: { create: vi.fn(() => mockPaciApi) },
}));

import paciService, {
  getAllPACIs,
  getActivePACIs,
  getHistoricalPACIs,
  getRecentPACIs,
  createPACI,
  createStudent,
  updatePACI,
  getPACIById,
  getPACIsByStudentId,
  deletePACI,
} from './paciService';

describe('paciService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPACIs', () => {
    it('obtiene todos los perfiles sin filtros', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [{ id: 'p1' }] });
      const result = await getAllPACIs();
      expect(result).toEqual([{ id: 'p1' }]);
      expect(mockPaciApi.get).toHaveBeenCalledWith(expect.stringContaining('/api/students/paci-profiles/all'));
    });

    it('arma el query string con los filtros provistos', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });
      await getAllPACIs({ studentId: 's1', isActive: true, curso: '2B' });
      const url = mockPaciApi.get.mock.calls[0][0];
      expect(url).toContain('studentId=s1');
      expect(url).toContain('isActive=true');
      expect(url).toContain('curso=2B');
    });

    it('propaga el error si la petición falla', async () => {
      mockPaciApi.get.mockRejectedValueOnce(new Error('boom'));
      await expect(getAllPACIs()).rejects.toThrow('boom');
    });
  });

  describe('getActivePACIs / getHistoricalPACIs', () => {
    it('pide los activos', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });
      await getActivePACIs();
      expect(mockPaciApi.get).toHaveBeenCalledWith('/api/students/paci-profiles/all?isActive=true');
    });

    it('pide los históricos', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });
      await getHistoricalPACIs();
      expect(mockPaciApi.get).toHaveBeenCalledWith('/api/students/paci-profiles/all?isActive=false');
    });
  });

  describe('getRecentPACIs', () => {
    it('usa el límite indicado', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });
      await getRecentPACIs(5);
      expect(mockPaciApi.get).toHaveBeenCalledWith('/api/students/paci-profiles/all?limit=5');
    });

    it('usa el límite por defecto', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });
      await getRecentPACIs();
      expect(mockPaciApi.get).toHaveBeenCalledWith('/api/students/paci-profiles/all?limit=10');
    });
  });

  describe('createPACI / createStudent', () => {
    it('crea un perfil PACI', async () => {
      const data = { studentId: 's1', diagnostico: 'DX' };
      mockPaciApi.post.mockResolvedValueOnce({ data: { id: 'p1' } });
      const result = await createPACI(data);
      expect(result).toEqual({ id: 'p1' });
      expect(mockPaciApi.post).toHaveBeenCalledWith('/api/students/paci-profiles/create', data);
    });

    it('crea un estudiante', async () => {
      const data = { nombreCompleto: 'Ana' };
      mockPaciApi.post.mockResolvedValueOnce({ data: { id: 's1' } });
      const result = await createStudent(data);
      expect(result).toEqual({ id: 's1' });
      expect(mockPaciApi.post).toHaveBeenCalledWith('/api/students', data);
    });
  });

  describe('updatePACI', () => {
    it('actualiza un perfil PACI', async () => {
      mockPaciApi.patch.mockResolvedValueOnce({ data: { id: 'p1', diagnostico: 'DX2' } });
      const result = await updatePACI('p1', { diagnostico: 'DX2' });
      expect(result).toEqual({ id: 'p1', diagnostico: 'DX2' });
      expect(mockPaciApi.patch).toHaveBeenCalledWith('/api/students/paci-profiles/p1', { diagnostico: 'DX2' });
    });
  });

  describe('getPACIById / getPACIsByStudentId', () => {
    it('obtiene un perfil por id', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: { id: 'p1' } });
      const result = await getPACIById('p1');
      expect(result).toEqual({ id: 'p1' });
      expect(mockPaciApi.get).toHaveBeenCalledWith('/api/students/paci-profiles/p1');
    });

    it('obtiene los perfiles de un estudiante', async () => {
      mockPaciApi.get.mockResolvedValueOnce({ data: [] });
      await getPACIsByStudentId('s1');
      expect(mockPaciApi.get).toHaveBeenCalledWith('/api/students/s1/paci-profiles');
    });
  });

  describe('deletePACI', () => {
    it('elimina un perfil PACI', async () => {
      mockPaciApi.delete.mockResolvedValueOnce({ data: { id: 'p1' } });
      const result = await deletePACI('p1');
      expect(result).toEqual({ id: 'p1' });
      expect(mockPaciApi.delete).toHaveBeenCalledWith('/api/students/paci-profiles/p1');
    });
  });

  it('exporta un objeto default con las funciones del servicio', () => {
    expect(typeof paciService.getAllPACIs).toBe('function');
    expect(typeof paciService.deletePACI).toBe('function');
  });
});
