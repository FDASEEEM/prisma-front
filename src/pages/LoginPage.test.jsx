/**
 * LoginPage.test.jsx
 * Pruebas de autenticación: validación de formulario, redirección por rol y
 * manejo de errores del servicio.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import authService from '../services/authService';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('../services/authService', () => ({
  default: { login: vi.fn() },
}));

vi.mock('../components', () => ({
  Input: ({ label, error, icon, iconPosition, ...props }) => (
    <div>
      <input aria-label={label || props.placeholder} {...props} />
      {error ? <span role="alert">{error}</span> : null}
    </div>
  ),
  Button: ({ children, loading, fullWidth, size, variant, ...props }) => (
    <button {...props}>{children}</button>
  ),
  Alert: ({ children }) => <div role="status">{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
}));

const fill = (email, password) => {
  fireEvent.change(screen.getByLabelText('Correo Electrónico'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText('••••••••'), {
    target: { value: password },
  });
};

const submit = () =>
  fireEvent.submit(screen.getByRole('button', { name: /Ingresar/i }).closest('form'));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra errores de validación con campos vacíos', async () => {
    render(<LoginPage />);
    submit();
    await waitFor(() =>
      expect(screen.getByText('El correo es requerido')).toBeInTheDocument(),
    );
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('valida formato de correo y largo de contraseña', async () => {
    render(<LoginPage />);
    fill('correo-malo', '123');
    submit();
    await waitFor(() => expect(screen.getByText('Correo inválido')).toBeInTheDocument());
    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
  });

  it('inicia sesión y redirige a /dashboard para un docente', async () => {
    authService.login.mockResolvedValue({
      user: { role: 'TEACHER' },
      tokens: { access_token: 't' },
    });
    render(<LoginPage />);
    fill('docente@test.cl', 'secret123');
    submit();

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith('docente@test.cl', 'secret123'));
    expect(mockLogin).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('redirige a /colegios para SUPERADMIN y a /admin para ADMIN', async () => {
    authService.login.mockResolvedValue({ user: { role: 'SUPERADMIN' }, tokens: {} });
    const { unmount } = render(<LoginPage />);
    fill('super@test.cl', 'secret123');
    submit();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/colegios'));
    unmount();

    vi.clearAllMocks();
    authService.login.mockResolvedValue({ user: { role: 'ADMIN' }, tokens: {} });
    render(<LoginPage />);
    fill('admin@test.cl', 'secret123');
    submit();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('muestra el error del servicio al fallar el login', async () => {
    authService.login.mockRejectedValue(new Error('Credenciales inválidas'));
    render(<LoginPage />);
    fill('docente@test.cl', 'secret123');
    submit();

    await waitFor(() =>
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument(),
    );
  });
});
