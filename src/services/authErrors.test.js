import {
  AUTH_ERROR_CODES,
  getAuthErrorMessage,
  isInvalidCredentialsError,
} from './authErrors';

describe('authErrors', () => {
  it('detects invalid credentials responses', () => {
    expect(
      isInvalidCredentialsError({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS }),
    ).toBe(true);
  });

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
});