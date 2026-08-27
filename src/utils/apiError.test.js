import { describe, it, expect } from 'vitest';
import { getApiErrorCode, getApiErrorMessage, isNoColegioError } from './apiError';

describe('apiError', () => {
  describe('getApiErrorCode', () => {
    it('devuelve el code del backend', () => {
      expect(getApiErrorCode({ response: { data: { code: 'X' } } })).toBe('X');
    });
    it('devuelve null si no hay code', () => {
      expect(getApiErrorCode({ response: { data: {} } })).toBeNull();
      expect(getApiErrorCode(undefined)).toBeNull();
    });
  });

  describe('getApiErrorMessage', () => {
    it('prioriza el message del backend', () => {
      expect(
        getApiErrorMessage({ response: { data: { message: 'Falló X' } } }, 'fb'),
      ).toBe('Falló X');
    });
    it('une arrays de mensajes (class-validator)', () => {
      expect(
        getApiErrorMessage({ response: { data: { message: ['a', 'b'] } } }),
      ).toBe('a, b');
    });
    it('ignora el mensaje genérico de axios y usa el fallback', () => {
      expect(
        getApiErrorMessage(new Error('Request failed with status code 500'), 'fb'),
      ).toBe('fb');
    });
    it('usa err.message si es informativo', () => {
      expect(getApiErrorMessage(new Error('sin conexión'), 'fb')).toBe('sin conexión');
    });
  });

  describe('isNoColegioError', () => {
    it('detecta por code', () => {
      expect(
        isNoColegioError({ response: { data: { code: 'NO_COLEGIO_ASSIGNED' } } }),
      ).toBe(true);
    });
    it('detecta por 403 + mención de colegio (fallback)', () => {
      expect(
        isNoColegioError({
          response: { status: 403, data: { message: 'no tiene colegio asignado' } },
        }),
      ).toBe(true);
    });
    it('no matchea otros 403', () => {
      expect(
        isNoColegioError({ response: { status: 403, data: { message: 'forbidden' } } }),
      ).toBe(false);
    });
    it('no matchea 401', () => {
      expect(isNoColegioError({ response: { status: 401, data: {} } })).toBe(false);
    });
  });
});
