/**
 * GoogleCallbackPage.test.jsx
 * Pruebas del callback de Google: parseo del fragment, login y navegación por rol.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import GoogleCallbackPage from './GoogleCallbackPage';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('../components', () => ({
  Alert: ({ children }) => <div role="status">{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
}));

const hashWithUser = (user) =>
  `#access_token=abc&refresh_token=def&expires_in=3600&user=${encodeURIComponent(
    JSON.stringify(user),
  )}`;

describe('GoogleCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
  });

  it('completa la sesión con los tokens del fragment y navega por rol', async () => {
    window.location.hash = hashWithUser({ id: '1', role: 'TEACHER' });
    render(<GoogleCallbackPage />);

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(mockLogin).toHaveBeenCalledWith(
      { id: '1', role: 'TEACHER' },
      { access_token: 'abc', refresh_token: 'def' },
    );
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('navega a /colegios para SUPERADMIN y a /admin para ADMIN', async () => {
    window.location.hash = hashWithUser({ id: '1', role: 'SUPERADMIN' });
    const { unmount } = render(<GoogleCallbackPage />);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/colegios', { replace: true }),
    );
    unmount();

    vi.clearAllMocks();
    window.location.hash = hashWithUser({ id: '2', role: 'ADMIN' });
    render(<GoogleCallbackPage />);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true }),
    );
  });

  it('muestra el error de OAuth y redirige a login', async () => {
    vi.useFakeTimers();
    window.location.hash = `#error=${encodeURIComponent('Access denied')}`;
    render(<GoogleCallbackPage />);

    expect(screen.getByText('Access denied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    vi.useRealTimers();
  });

  it('muestra error si no vienen tokens en el fragment', () => {
    window.location.hash = '#foo=bar';
    render(<GoogleCallbackPage />);

    expect(
      screen.getByText('No se pudo completar el inicio de sesión con Google.'),
    ).toBeInTheDocument();
  });
});