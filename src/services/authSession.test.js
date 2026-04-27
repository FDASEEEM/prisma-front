import { shouldRedirectToLogin } from './authSession';

describe('authSession', () => {
  it('does not redirect for login invalid credentials', () => {
    expect(
      shouldRedirectToLogin(
        { code: 'AUTH_INVALID_CREDENTIALS' },
        '/api/auth/login',
      ),
    ).toBe(false);
  });

  it('redirects for protected route 401 responses', () => {
    expect(shouldRedirectToLogin({ code: 'AUTH_SESSION_EXPIRED' }, '/api/chat')).toBe(true);
    expect(shouldRedirectToLogin({}, '/api/chat')).toBe(true);
  });
});