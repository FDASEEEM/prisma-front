/**
 * ColegiosPage.test.jsx
 * Pruebas de la gestión de colegios: carga, lista, búsqueda en cliente, apertura
 * de modales y desactivación con confirmación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ColegiosPage from './ColegiosPage';
import colegioService from '../services/colegioService';

vi.mock('../components', () => ({
  Button: ({ children, icon, variant, ...props }) => <button {...props}>{children}</button>,
  Badge: ({ children }) => <span>{children}</span>,
  Input: ({ label, error, icon, ...props }) => <input aria-label={label || props.placeholder} {...props} />,
}));

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/features/CreateColegioModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="create-modal" /> : null),
}));
vi.mock('../components/features/EditColegioModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="edit-modal" /> : null),
}));
vi.mock('../components/features/ViewColegioModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="view-modal" /> : null),
}));

vi.mock('../services/colegioService', () => ({
  default: { getAll: vi.fn(), deactivate: vi.fn() },
}));

const colegios = [
  { id: 'c1', nombre: 'Colegio Andes', email: 'andes@test.cl', rut: '1-9', plan: 'premium', activo: true, _count: { users: 3, admins: 1 } },
  { id: 'c2', nombre: 'Liceo Sur', email: 'sur@test.cl', rut: '2-7', plan: 'basic', activo: false, _count: { users: 0, admins: 0 } },
];

describe('ColegiosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    colegioService.getAll.mockResolvedValue({ data: colegios, total: 2, totalPages: 1 });
  });

  it('muestra el spinner mientras carga', () => {
    colegioService.getAll.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ColegiosPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renderiza la lista de colegios', async () => {
    render(<ColegiosPage />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());
    expect(screen.getByText('Liceo Sur')).toBeInTheDocument();
  });

  it('filtra los colegios por el buscador (lado cliente)', async () => {
    render(<ColegiosPage />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Buscar por nombre/i), {
      target: { value: 'Andes' },
    });
    // Cambiar el filtro re-dispara la carga; esperamos a que el filtro en cliente se aplique
    await waitFor(() => expect(screen.queryByText('Liceo Sur')).not.toBeInTheDocument());
    expect(screen.getByText('Colegio Andes')).toBeInTheDocument();
  });

  it('abre el modal de creación al pulsar "Nuevo Colegio"', async () => {
    render(<ColegiosPage />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Nuevo Colegio/i }));
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });

  it('desactiva un colegio tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    colegioService.deactivate.mockResolvedValue({});
    render(<ColegiosPage />);
    await waitFor(() => expect(screen.getByText('Colegio Andes')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Desactivar'));
    await waitFor(() => expect(colegioService.deactivate).toHaveBeenCalledWith('c1'));
  });

  it('muestra un mensaje de error si la carga falla', async () => {
    colegioService.getAll.mockRejectedValue(new Error('Error al cargar'));
    render(<ColegiosPage />);
    await waitFor(() => expect(screen.getByText('Error al cargar')).toBeInTheDocument());
  });
});
