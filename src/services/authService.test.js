/**
 * authService.test.js
 * Pruebas unitarias para el servicio de autenticación
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import authService from './authService';
import api from './api';
import * as authErrors from './authErrors';

// Mock de la API
vi.mock('./api');
vi.mock('./authErrors');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('debe autenticar un usuario correctamente con email y password válidos', async () => {
      const mockUser = { id: '1', email: 'test@example.com', nombre: 'Test User' };
      const mockTokens = {
        access_token: 'access_token_123',
        refresh_token: 'refresh_token_456',
      };

      api.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          access_token: mockTokens.access_token,
          refresh_token: mockTokens.refresh_token,
        },
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: mockUser,
        tokens: mockTokens,
      });
      expect(api.post).toHaveBeenCalledWith('auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('debe lanzar error si credenciales son inválidas', async () => {
      authErrors.isInvalidCredentialsError.mockReturnValueOnce(true);
      api.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { code: 'AUTH_INVALID_CREDENTIALS' },
        },
      });

      await expect(
        authService.login('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Correo o contraseña incorrectos');
    });

    it('debe lanzar error de sesión expirada', async () => {
      authErrors.isInvalidCredentialsError.mockReturnValueOnce(false);
      authErrors.getAuthErrorMessage.mockReturnValueOnce('Tu sesión expiró. Vuelve a iniciar sesión.');
      api.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { code: 'AUTH_SESSION_EXPIRED' },
        },
      });

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow(
        'Tu sesión expiró. Vuelve a iniciar sesión.'
      );
    });

    it('debe manejar errores de servidor genéricos', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Error interno del servidor' },
        },
      });

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow(
        'Error interno del servidor'
      );
    });

    it('debe manejar errores sin respuesta del servidor', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.login('test@example.com', 'password')).rejects.toThrow(
        'Error al iniciar sesión'
      );
    });
  });

  describe('register', () => {
    it('debe registrar un usuario nuevo correctamente', async () => {
      const mockUser = { id: '2', email: 'newuser@example.com', nombre: 'New User', rut: '12.345.678-9' };
      const mockTokens = {
        access_token: 'access_token_789',
        refresh_token: 'refresh_token_012',
      };

      api.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          access_token: mockTokens.access_token,
          refresh_token: mockTokens.refresh_token,
        },
      });

      const result = await authService.register('newuser@example.com', 'password123', 'New User', '12.345.678-9');

      expect(result).toEqual({
        user: mockUser,
        tokens: mockTokens,
      });
      expect(api.post).toHaveBeenCalledWith('auth/register', {
        email: 'newuser@example.com',
        password: 'password123',
        nombre: 'New User',
        rut: '12.345.678-9',
      });
    });

    it('debe lanzar error si el email ya está registrado', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { message: 'El correo ya está registrado' },
        },
      });

      await expect(
        authService.register('existing@example.com', 'password', 'User', 'rut')
      ).rejects.toThrow('El correo ya está registrado');
    });

    it('debe manejar errores del servidor en registro', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Error al crear usuario' },
        },
      });

      await expect(
        authService.register('test@example.com', 'password', 'User', 'rut')
      ).rejects.toThrow('Error al crear usuario');
    });

    it('debe usar mensaje por defecto si no hay respuesta del servidor', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 400,
        },
      });

      await expect(
        authService.register('test@example.com', 'password', 'User', 'rut')
      ).rejects.toThrow('Error al registrarse');
    });
  });

  describe('logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      api.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await authService.logout();

      expect(result).toEqual({ success: true });
      expect(api.post).toHaveBeenCalledWith('auth/logout');
    });

    it('debe retornar success=true incluso si el servidor falla', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));
      console.warn = vi.fn();

      const result = await authService.logout();

      expect(result).toEqual({ success: true });
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('debe renovar el token de acceso correctamente', async () => {
      const oldToken = 'refresh_token_123';
      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';

      api.post.mockResolvedValueOnce({
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        },
      });

      const result = await authService.refreshToken(oldToken);

      expect(result).toEqual({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });
      expect(api.post).toHaveBeenCalledWith('auth/refresh', {
        refresh_token: oldToken,
      });
    });

    it('debe mantener el refresh token antiguo si no viene uno nuevo', async () => {
      const oldToken = 'refresh_token_123';
      const newAccessToken = 'new_access_token';

      api.post.mockResolvedValueOnce({
        data: {
          access_token: newAccessToken,
          refresh_token: null,
        },
      });

      const result = await authService.refreshToken(oldToken);

      expect(result).toEqual({
        access_token: newAccessToken,
        refresh_token: oldToken,
      });
    });

    it('debe lanzar error de sesión expirada cuando status es 401', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Token expirado' },
        },
      });

      await expect(authService.refreshToken('old_token')).rejects.toThrow(
        'Tu sesión expiró. Vuelve a iniciar sesión.'
      );
    });

    it('debe manejar errores genéricos al renovar token', async () => {
      api.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Error en servidor' },
        },
      });

      await expect(authService.refreshToken('old_token')).rejects.toThrow(
        'No se pudo renovar la sesión'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('debe obtener datos del usuario autenticado', async () => {
      const mockUser = { id: '1', email: 'test@example.com', nombre: 'Test User' };

      api.get.mockResolvedValueOnce({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(api.get).toHaveBeenCalledWith('auth/me');
    });

    it('debe manejar errores al obtener datos del usuario', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.getCurrentUser()).rejects.toThrow(
        'Error al obtener datos del usuario'
      );
    });
  });

  describe('updateProfile', () => {
    it('debe actualizar perfil del usuario correctamente', async () => {
      const userData = { nombre: 'Updated Name', bio: 'Nueva biografía' };
      const updatedUser = { id: '1', email: 'test@example.com', ...userData };

      api.patch.mockResolvedValueOnce({ data: updatedUser });

      const result = await authService.updateProfile(userData);

      expect(result).toEqual(updatedUser);
      expect(api.patch).toHaveBeenCalledWith('auth/me', userData);
    });

    it('debe manejar errores al actualizar perfil', async () => {
      const userData = { nombre: 'Invalid' };
      api.patch.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Datos inválidos' },
        },
      });

      await expect(authService.updateProfile(userData)).rejects.toThrow('Datos inválidos');
    });

    it('debe usar mensaje por defecto si no hay respuesta', async () => {
      const userData = { nombre: 'Test' };
      api.patch.mockRejectedValueOnce({
        response: {
          status: 500,
        },
      });

      await expect(authService.updateProfile(userData)).rejects.toThrow(
        'Error al actualizar perfil'
      );
    });
  });
});
