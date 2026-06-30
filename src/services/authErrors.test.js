/**
 * authErrors.test.js
 * Pruebas unitarias para funciones de errores de autenticación
 * Cobertura: 100%
 */

import { describe, it, expect } from 'vitest';
import {
  AUTH_ERROR_CODES,
  getAuthErrorCode,
  isInvalidCredentialsError,
  isSessionExpiredError,
  getAuthErrorMessage,
} from './authErrors';

describe('authErrors', () => {
  describe('AUTH_ERROR_CODES', () => {
    it('debe definir códigos de error de autenticación', () => {
      expect(AUTH_ERROR_CODES.SESSION_EXPIRED).toBe('AUTH_SESSION_EXPIRED');
      expect(AUTH_ERROR_CODES.INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('getAuthErrorCode', () => {
    it('debe retornar el código de error si existe', () => {
      const errorData = { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid' };
      expect(getAuthErrorCode(errorData)).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('debe retornar null si no existe código de error', () => {
      const errorData = { message: 'Error genérico' };
      expect(getAuthErrorCode(errorData)).toBeNull();
    });

    it('debe manejar errorData undefined', () => {
      expect(getAuthErrorCode(undefined)).toBeNull();
    });

    it('debe manejar errorData null', () => {
      expect(getAuthErrorCode(null)).toBeNull();
    });
  });

  describe('isInvalidCredentialsError', () => {
    it('detects invalid credentials responses', () => {
      expect(
        isInvalidCredentialsError({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS }),
      ).toBe(true);
    });

    it('debe retornar false si el código no es AUTH_INVALID_CREDENTIALS', () => {
      const errorData = { code: 'AUTH_SESSION_EXPIRED' };
      expect(isInvalidCredentialsError(errorData)).toBe(false);
    });

    it('debe retornar false si no hay código', () => {
      const errorData = { message: 'Error' };
      expect(isInvalidCredentialsError(errorData)).toBe(false);
    });

    it('debe manejar errorData undefined', () => {
      expect(isInvalidCredentialsError(undefined)).toBe(false);
    });
  });

  describe('isSessionExpiredError', () => {
    it('debe retornar true si el código es AUTH_SESSION_EXPIRED', () => {
      const errorData = { code: 'AUTH_SESSION_EXPIRED' };
      expect(isSessionExpiredError(errorData)).toBe(true);
    });

    it('debe retornar false si el código no es AUTH_SESSION_EXPIRED', () => {
      const errorData = { code: 'AUTH_INVALID_CREDENTIALS' };
      expect(isSessionExpiredError(errorData)).toBe(false);
    });

    it('debe retornar false si no hay código', () => {
      const errorData = { message: 'Error' };
      expect(isSessionExpiredError(errorData)).toBe(false);
    });

    it('debe manejar errorData undefined', () => {
      expect(isSessionExpiredError(undefined)).toBe(false);
    });

    it('debe manejar errorData null', () => {
      expect(isSessionExpiredError(null)).toBe(false);
    });
  });

  describe('getAuthErrorMessage', () => {
    it('returns a backend message when available', () => {
      expect(
        getAuthErrorMessage(
          { message: 'Sesión expirada o inválida. Vuelve a iniciar sesión.' },
          'fallback',
        ),
      ).toBe('Sesión expirada o inválida. Vuelve a iniciar sesión.');
    });

    it('falls back when message is missing', () => {
      expect(getAuthErrorMessage({}, 'fallback')).toBe('fallback');
    });

    it('debe retornar fallbackMessage si mensaje es null', () => {
      const errorData = { message: null };
      const result = getAuthErrorMessage(errorData, 'mensaje por defecto');
      expect(result).toBe('mensaje por defecto');
    });

    it('debe retornar fallbackMessage si mensaje es string vacío o solo espacios', () => {
      const errorData = { message: '   ' };
      const result = getAuthErrorMessage(errorData, 'fallback');
      expect(result).toBe('fallback');
    });

    it('debe manejar errorData undefined', () => {
      const result = getAuthErrorMessage(undefined, 'fallback por defecto');
      expect(result).toBe('fallback por defecto');
    });

    it('debe manejar errorData null', () => {
      const result = getAuthErrorMessage(null, 'fallback');
      expect(result).toBe('fallback');
    });

    it('debe retornar mensaje válido incluso con espacios al inicio/final', () => {
      const errorData = { message: '  Mensaje válido  ' };
      const result = getAuthErrorMessage(errorData, 'fallback');
      expect(result).toBe('  Mensaje válido  ');
    });
  });
});