/**
 * ProfilePage.test.jsx
 * Pruebas del perfil: poblado desde el contexto, guardado (updateUser) y flujo
 * de cierre de sesión con confirmación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ProfilePage from './ProfilePage';
import authService from '../services/authService';

const mockUpdateUser = vi.fn();
const mockLogout = vi.fn();
const user = { nombre: 'Ada Lovelace', email: 'ada@test.cl', rut: '11.111.111-1' };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user, updateUser: mockUpdateUser, logout: mockLogout }),
}));

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/ui', () => ({
  Card: ({ children }) => <div>{children}</div>,
  Button: ({ children, variant, ...props }) => <button {...props}>{children}</button>,
  Input: ({ label, error, ...props }) => <input aria-label={label} {...props} />,
  Alert: ({ children }) => <div role="status">{children}</div>,
  Badge: ({ children }) => <span>{children}</span>,
  Modal: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock('../services/authService', () => ({
  default: { logout: vi.fn().mockResolvedValue({}) },
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rellena el formulario con los datos del usuario', () => {
    render(<ProfilePage />);
    expect(screen.getByLabelText('Nombre Completo')).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Correo Electrónico')).toHaveValue('ada@test.cl');
  });

  it('guarda los cambios actualizando el contexto y muestra éxito', async () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/Institución Educativa/i), {
      target: { name: 'institucion', value: 'Colegio Andes' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalled());
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ institucion: 'Colegio Andes' }),
    );
    expect(screen.getByText(/Perfil actualizado correctamente/i)).toBeInTheDocument();
  });

  it('confirma el cierre de sesión y llama a authService.logout + logout', async () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: /^Cerrar Sesión$/i }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Cerrar Sesión/i }));

    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
    expect(mockLogout).toHaveBeenCalled();
  });

  it('cierra el modal de confirmación al cancelar', () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: /^Cerrar Sesión$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
