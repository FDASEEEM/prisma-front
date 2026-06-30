/**
 * localStorage.test.js
 * Pruebas unitarias para utilidades de localStorage
 * Cobertura: 100%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import storageUtils from './localStorage';

describe('storageUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Tokens', () => {
    it('debe guardar y recuperar access token', () => {
      const token = 'access_token_123';
      storageUtils.saveToken(token);
      expect(storageUtils.getToken()).toBe(token);
    });

    it('debe eliminar access token', () => {
      storageUtils.saveToken('token_123');
      storageUtils.removeToken();
      expect(storageUtils.getToken()).toBeNull();
    });

    it('debe guardar y recuperar refresh token', () => {
      const token = 'refresh_token_456';
      storageUtils.saveRefreshToken(token);
      expect(storageUtils.getRefreshToken()).toBe(token);
    });

    it('debe eliminar refresh token', () => {
      storageUtils.saveRefreshToken('refresh_123');
      storageUtils.removeRefreshToken();
      expect(storageUtils.getRefreshToken()).toBeNull();
    });
  });

  describe('User', () => {
    it('debe guardar y recuperar usuario como JSON', () => {
      const user = { id: '1', email: 'test@example.com', nombre: 'Test User' };
      storageUtils.saveUser(user);
      const retrievedUser = storageUtils.getUser();
      expect(retrievedUser).toEqual(user);
    });

    it('debe retornar null si no hay usuario guardado', () => {
      expect(storageUtils.getUser()).toBeNull();
    });

    it('debe eliminar usuario del almacenamiento', () => {
      const user = { id: '1', email: 'test@example.com' };
      storageUtils.saveUser(user);
      storageUtils.removeUser();
      expect(storageUtils.getUser()).toBeNull();
    });

    it('debe manejar usuarios complejos con propiedades anidadas', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        profile: {
          nombre: 'Test',
          bio: 'Biography',
          settings: { notifications: true },
        },
      };
      storageUtils.saveUser(user);
      expect(storageUtils.getUser()).toEqual(user);
    });
  });

  describe('Session', () => {
    it('debe limpiar toda la sesión', () => {
      storageUtils.saveToken('token');
      storageUtils.saveRefreshToken('refresh');
      storageUtils.saveUser({ id: '1' });

      storageUtils.clearSession();

      expect(storageUtils.getToken()).toBeNull();
      expect(storageUtils.getRefreshToken()).toBeNull();
      expect(storageUtils.getUser()).toBeNull();
    });

    it('debe retornar true si está autenticado', () => {
      expect(storageUtils.isAuthenticated()).toBe(false);
      storageUtils.saveToken('token_123');
      expect(storageUtils.isAuthenticated()).toBe(true);
    });

    it('debe retornar false si no está autenticado', () => {
      storageUtils.clearSession();
      expect(storageUtils.isAuthenticated()).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('debe guardar tokens con caracteres especiales', () => {
      const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
      storageUtils.saveToken(specialToken);
      expect(storageUtils.getToken()).toBe(specialToken);
    });

    it('debe manejar usuario vacío', () => {
      storageUtils.saveUser({});
      expect(storageUtils.getUser()).toEqual({});
    });

    it('debe guardar múltiples datos sin conflicto', () => {
      const user1 = { id: '1', email: 'user1@example.com' };
      const token1 = 'token_1';

      storageUtils.saveUser(user1);
      storageUtils.saveToken(token1);
      storageUtils.saveRefreshToken('refresh_1');

      expect(storageUtils.getUser()).toEqual(user1);
      expect(storageUtils.getToken()).toBe(token1);
      expect(storageUtils.getRefreshToken()).toBe('refresh_1');
    });
  });
});
