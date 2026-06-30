/**
 * SideNav.test.jsx
 * Pruebas de la navegación lateral: items visibles según rol, marcado de la
 * ruta activa y flujo de confirmación de cierre de sesión.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SideNav from './SideNav';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../ui', () => ({
  Modal: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
  Button: ({ children, variant, ...props }) => <button {...props}>{children}</button>,
}));

import { useAuth } from '../../context/AuthContext';

const renderNav = (auth = {}, route = '/dashboard') => {
  useAuth.mockReturnValue({
    logout: vi.fn(),
    isAdmin: false,
    isSuperAdmin: false,
    ...auth,
  });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SideNav />
    </MemoryRouter>,
  );
};

describe('SideNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los items base para cualquier usuario', () => {
    renderNav();
    expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
    expect(screen.getByText('Escritorio')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
    expect(screen.getByText('Alumnos')).toBeInTheDocument();
    expect(screen.getByText('Soporte')).toBeInTheDocument();
  });

  it('oculta Colegios y Admin Panel a usuarios sin privilegios', () => {
    renderNav();
    expect(screen.queryByText('Colegios')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('muestra Colegios solo a superadmin', () => {
    renderNav({ isSuperAdmin: true });
    expect(screen.getByText('Colegios')).toBeInTheDocument();
  });

  it('muestra Admin Panel a admin', () => {
    renderNav({ isAdmin: true });
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('marca como activo el item de la ruta actual', () => {
    renderNav({}, '/historial');
    const activeLink = screen.getByText('Historial').closest('a');
    expect(activeLink.className).toContain('bg-stone-200/50');
  });

  it('confirma el cierre de sesión: abre modal y ejecuta logout', () => {
    const logout = vi.fn();
    renderNav({ logout });

    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sí, cerrar sesión/i }));
    expect(logout).toHaveBeenCalled();
  });

  it('permite cancelar el cierre de sesión sin desloguear', () => {
    const logout = vi.fn();
    renderNav({ logout });

    fireEvent.click(screen.getByText('Salir'));
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(logout).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
