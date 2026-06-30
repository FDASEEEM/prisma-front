/**
 * authService.test.js
 * Pruebas unitarias del servicio de autenticación (delega en bffApi).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './authService';
import bffApi from './bffApi';

// bffApi es la capa HTTP hacia el BFF; la mockeamos para aislar authService.
vi.mock('./bffApi', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('autentica y devuelve user + tokens', async () => {
      bffApi.login.mockResolvedValueOnce({
        user: { id: '1', email: 'test@example.com' },
        access_token: 'access_123',
        refresh_token: 'refresh_456',
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: { id: '1', email: 'test@example.com' },
        tokens: { access_token: 'access_123', refresh_token: 'refresh_456' },
      });
      expect(bffApi.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('lanza "Correo o contraseña incorrectos" ante un 401', async () => {
      bffApi.login.mockRejectedValueOnce({ response: { status: 401 } });
      await expect(authService.login('a@a.com', 'bad')).rejects.toThrow(
        'Correo o contraseña incorrectos',
      );
    });

    it('usa el mensaje del servidor en otros errores', async () => {
      bffApi.login.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Servidor no disponible' } },
      });
      await expect(authService.login('a@a.com', 'x')).rejects.toThrow('Servidor no disponible');
    });

    it('usa mensaje por defecto si no hay información del error', async () => {
      bffApi.login.mockRejectedValueOnce({});
      await expect(authService.login('a@a.com', 'x')).rejects.toThrow('Error al iniciar sesión');
    });
  });

  describe('register', () => {
    it('registra y devuelve user + tokens', async () => {
      bffApi.register.mockResolvedValueOnce({
        user: { id: '2' },
        access_token: 'a',
        refresh_token: 'r',
      });

      const result = await authService.register('e@e.com', 'pw', 'Nombre', '11.111.111-1');

      expect(result).toEqual({
        user: { id: '2' },
        tokens: { access_token: 'a', refresh_token: 'r' },
      });
      expect(bffApi.register).toHaveBeenCalledWith({
        email: 'e@e.com',
        password: 'pw',
        nombre: 'Nombre',
        rut: '11.111.111-1',
      });
    });

    it('propaga el mensaje de error del servidor', async () => {
      bffApi.register.mockRejectedValueOnce({
        response: { data: { message: 'El email ya está registrado' } },
      });
      await expect(authService.register('e', 'p', 'n', 'r')).rejects.toThrow(
        'El email ya está registrado',
      );
    });
  });

  describe('logout', () => {
    it('cierra sesión correctamente', async () => {
      bffApi.logout.mockResolvedValueOnce(undefined);
      await expect(authService.logout()).resolves.toEqual({ success: true });
    });

    it('devuelve success=true aunque el servidor falle', async () => {
      bffApi.logout.mockRejectedValueOnce(new Error('network'));
      await expect(authService.logout()).resolves.toEqual({ success: true });
    });
  });

  describe('refreshToken', () => {
    it('renueva el token de acceso', async () => {
      bffApi.refresh.mockResolvedValueOnce({ access_token: 'nuevo', refresh_token: 'nuevoR' });
      const result = await authService.refreshToken('viejoR');
      expect(result).toEqual({ access_token: 'nuevo', refresh_token: 'nuevoR' });
    });

    it('mantiene el refresh token antiguo si no viene uno nuevo', async () => {
      bffApi.refresh.mockResolvedValueOnce({ access_token: 'nuevo' });
      const result = await authService.refreshToken('viejoR');
      expect(result).toEqual({ access_token: 'nuevo', refresh_token: 'viejoR' });
    });

    it('lanza sesión expirada cuando el status es 401', async () => {
      bffApi.refresh.mockRejectedValueOnce({ response: { status: 401 } });
      await expect(authService.refreshToken('viejoR')).rejects.toThrow(
        'Tu sesión expiró. Vuelve a iniciar sesión.',
      );
    });

    it('lanza error genérico en otros fallos', async () => {
      bffApi.refresh.mockRejectedValueOnce(new Error('x'));
      await expect(authService.refreshToken('viejoR')).rejects.toThrow('No se pudo renovar la sesión');
    });
  });

  describe('getCurrentUser', () => {
    it('obtiene los datos del usuario autenticado', async () => {
      bffApi.getCurrentUser.mockResolvedValueOnce({ id: '1', email: 'test@example.com' });
      await expect(authService.getCurrentUser()).resolves.toEqual({
        id: '1',
        email: 'test@example.com',
      });
    });

    it('lanza error si falla', async () => {
      bffApi.getCurrentUser.mockRejectedValueOnce(new Error('x'));
      await expect(authService.getCurrentUser()).rejects.toThrow('Error al obtener datos del usuario');
    });
  });

  describe('updateProfile', () => {
    it('actualiza el perfil del usuario', async () => {
      bffApi.updateProfile.mockResolvedValueOnce({ id: '1', nombre: 'Nuevo' });
      const result = await authService.updateProfile({ nombre: 'Nuevo' });
      expect(result).toEqual({ id: '1', nombre: 'Nuevo' });
      expect(bffApi.updateProfile).toHaveBeenCalledWith({ nombre: 'Nuevo' });
    });

    it('propaga el mensaje de error al actualizar', async () => {
      bffApi.updateProfile.mockRejectedValueOnce({
        response: { data: { message: 'No permitido' } },
      });
      await expect(authService.updateProfile({})).rejects.toThrow('No permitido');
    });
  });
});
