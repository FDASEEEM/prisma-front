/**
 * jobsService.test.js
 * Pruebas unitarias para el servicio de trabajos/sesiones
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jobsService from './jobsService';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('jobsService', () => {
  let mockDocsApi;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocsApi = {
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn((fn) => fn) },
      },
    };
    axios.create.mockReturnValue(mockDocsApi);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createJob', () => {
    it('debe crear un job con archivos y prompt', async () => {
      const mockJob = { jobId: 'job_123', status: 'processing' };
      mockDocsApi.post.mockResolvedValueOnce({ data: mockJob });

      const paciFile = new File(['content'], 'paci.pdf');
      const planningFile = new File(['content'], 'planning.pdf');
      const prompt = 'Generate planning';

      const result = await jobsService.createJob(paciFile, planningFile, prompt);

      expect(result).toEqual(mockJob);
      expect(mockDocsApi.post).toHaveBeenCalled();
    });

    it('debe manejar errores al crear job', async () => {
      mockDocsApi.post.mockRejectedValueOnce({
        response: { data: { message: 'Archivos inválidos' } },
      });

      const paciFile = new File(['content'], 'paci.pdf');
      const planningFile = new File(['content'], 'planning.pdf');

      await expect(
        jobsService.createJob(paciFile, planningFile, 'prompt')
      ).rejects.toThrow('Archivos inválidos');
    });

    it('debe manejar error sin mensaje específico', async () => {
      mockDocsApi.post.mockRejectedValueOnce({
        response: { data: {} },
      });

      const paciFile = new File(['content'], 'paci.pdf');
      const planningFile = new File(['content'], 'planning.pdf');

      await expect(
        jobsService.createJob(paciFile, planningFile, 'prompt')
      ).rejects.toThrow('Error al crear la sesión');
    });
  });

  describe('getHistory', () => {
    it('debe obtener historial de sesiones', async () => {
      const mockHistory = { sessions: [{ id: '1', status: 'completed' }] };
      mockDocsApi.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await jobsService.getHistory();

      expect(result).toEqual(mockHistory);
      expect(mockDocsApi.get).toHaveBeenCalled();
    });

    it('debe manejar error al obtener historial', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: { message: 'Error en servidor' } },
      });

      await expect(jobsService.getHistory()).rejects.toThrow('Error en servidor');
    });

    it('debe usar mensaje por defecto', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: {} },
      });

      await expect(jobsService.getHistory()).rejects.toThrow('Error al obtener historial');
    });
  });

  describe('listJobs', () => {
    it('debe listar jobs con paginación', async () => {
      const mockJobs = { jobs: [{ id: 'job_1' }], total: 1 };
      mockDocsApi.get.mockResolvedValueOnce({ data: mockJobs });

      const result = await jobsService.listJobs(1, 10);

      expect(result).toEqual(mockJobs);
      expect(mockDocsApi.get).toHaveBeenCalled();
    });

    it('debe usar valores por defecto de paginación', async () => {
      mockDocsApi.get.mockResolvedValueOnce({ data: { jobs: [] } });

      await jobsService.listJobs();

      expect(mockDocsApi.get).toHaveBeenCalled();
    });

    it('debe manejar errores', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: { message: 'Error en servidor' } },
      });

      await expect(jobsService.listJobs()).rejects.toThrow('Error en servidor');
    });
  });

  describe('getJobStatus', () => {
    it('debe obtener estado de un job', async () => {
      const mockStatus = { jobId: 'job_123', status: 'completed', progress: 100 };
      mockDocsApi.get.mockResolvedValueOnce({ data: mockStatus });

      const result = await jobsService.getJobStatus('job_123');

      expect(result).toEqual(mockStatus);
    });

    it('debe manejar errores al obtener estado', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: { message: 'Job no encontrado' } },
      });

      await expect(jobsService.getJobStatus('invalid_id')).rejects.toThrow(
        'Job no encontrado'
      );
    });

    it('debe usar mensaje por defecto', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: {} },
      });

      await expect(jobsService.getJobStatus('invalid_id')).rejects.toThrow(
        'Error al obtener estado del job'
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('debe obtener URL de descarga', async () => {
      const mockUrl = { url: 'https://storage.example.com/file.pdf' };
      mockDocsApi.get.mockResolvedValueOnce({ data: mockUrl });

      const result = await jobsService.getDownloadUrl('job_123');

      expect(result).toEqual(mockUrl);
    });

    it('debe manejar errores al obtener URL', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: { message: 'Archivo no disponible' } },
      });

      await expect(jobsService.getDownloadUrl('invalid_id')).rejects.toThrow(
        'Archivo no disponible'
      );
    });

    it('debe usar mensaje por defecto', async () => {
      mockDocsApi.get.mockRejectedValueOnce({
        response: { data: {} },
      });

      await expect(jobsService.getDownloadUrl('invalid_id')).rejects.toThrow(
        'Error al obtener URL de descarga'
      );
    });
  });
});
