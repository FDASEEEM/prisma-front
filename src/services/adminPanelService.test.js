import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import adminPanelService from './adminPanelService';
import storageUtils from '../utils/localStorage';

vi.mock('axios');
vi.mock('../utils/localStorage');

describe('adminPanelService', () => {
  let mockAdminApi;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminApi = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn((fn) => fn) } },
    };
    axios.create.mockReturnValue(mockAdminApi);
    storageUtils.getToken.mockReturnValue('token-123');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('obtiene el resumen del panel', async () => {
    mockAdminApi.get.mockResolvedValueOnce({ data: { kpis: { activeUsers: 1 } } });

    await expect(adminPanelService.getSummary()).resolves.toEqual({ kpis: { activeUsers: 1 } });
  });

  it('propaga errores con el mensaje del servidor', async () => {
    mockAdminApi.get.mockRejectedValueOnce({ response: { data: { message: 'Fallo' } } });

    await expect(adminPanelService.getTickets()).rejects.toThrow('Fallo');
  });
});