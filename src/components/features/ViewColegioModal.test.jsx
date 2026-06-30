/**
 * ViewColegioModal.test.jsx
 * Pruebas del modal de detalle de colegio: carga combinada, navegación entre
 * pestañas y acciones sobre administradores (activar/desactivar, reset password).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ViewColegioModal from './ViewColegioModal';
import colegioService from '../../services/colegioService';
import bffApi from '../../services/bffApi';

vi.mock('../ui', () => ({
  Modal: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
  Button: ({ children, loading, variant, size, ...props }) => (
    <button {...props}>{children}</button>
  ),
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock('../../services/colegioService', () => ({
  default: { getById: vi.fn(), getStats: vi.fn(), getProfessors: vi.fn() },
}));

vi.mock('../../services/bffApi', () => ({
  default: {
    getColegioAdmins: vi.fn(),
    setUserActive: vi.fn(),
    resetUserPassword: vi.fn(),
  },
}));

const colegio = {
  nombre: 'Colegio Andes',
  rut: '99.999.999-9',
  email: 'andes@test.cl',
  telefono: '123',
  plan: 'premium',
  direccion: 'Calle 1',
  activo: true,
  fechaInicio: '2024-01-01',
  fechaTermino: '2025-12-31',
};

const stats = {
  totalUsers: 10,
  activeUsers: 8,
  admins: 2,
  teachers: 5,
  superadmins: 1,
};

const admins = [
  { id: 'a1', nombreCompleto: 'Admin Uno', email: 'a1@test.cl', rut: '1-9', active: true },
];

const professors = [{ id: 'p1', nombreCompleto: 'Prof Uno', email: 'p1@test.cl', active: true }];

const mockLoad = () => {
  colegioService.getById.mockResolvedValue(colegio);
  colegioService.getStats.mockResolvedValue(stats);
  colegioService.getProfessors.mockResolvedValue(professors);
  bffApi.getColegioAdmins.mockResolvedValue({ data: admins });
};

describe('ViewColegioModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad();
  });

  it('carga y muestra la información básica del colegio', async () => {
    render(<ViewColegioModal isOpen colegioId="c1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());
    expect(screen.getByText('99.999.999-9')).toBeInTheDocument();
    expect(screen.getByText('andes@test.cl')).toBeInTheDocument();
  });

  it('muestra estadísticas al cambiar a la pestaña correspondiente', async () => {
    render(<ViewColegioModal isOpen colegioId="c1" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Estadísticas/i }));
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
  });

  it('desactiva un admin y recarga los datos', async () => {
    bffApi.setUserActive.mockResolvedValue({});
    render(<ViewColegioModal isOpen colegioId="c1" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Admins/i }));
    expect(screen.getByText('Admin Uno')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Desactivar/i }));

    await waitFor(() => expect(bffApi.setUserActive).toHaveBeenCalledWith('a1', false));
    // getById se llamó una vez al montar y otra al recargar
    await waitFor(() => expect(colegioService.getById).toHaveBeenCalledTimes(2));
  });

  it('muestra el password temporal tras resetear', async () => {
    bffApi.resetUserPassword.mockResolvedValue({
      temporaryPassword: 'TempPass123',
      user: { email: 'a1@test.cl' },
    });
    render(<ViewColegioModal isOpen colegioId="c1" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Admins/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

    await waitFor(() => expect(screen.getByText('TempPass123')).toBeInTheDocument());
  });

  it('lista los profesores en su pestaña', async () => {
    render(<ViewColegioModal isOpen colegioId="c1" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Profesores/i }));
    expect(screen.getByText('Prof Uno')).toBeInTheDocument();
  });
});
