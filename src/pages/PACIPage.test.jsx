/**
 * PACIPage.test.jsx
 * Pruebas de la gestión de perfiles PACI: carga por pestaña, estado vacío,
 * filtros, eliminación con confirmación y apertura de modales.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PACIPage from './PACIPage';
import paciService from '../services/paciService';

vi.mock('../components', () => ({
  MainContainer: ({ children }) => <div>{children}</div>,
  Button: ({ children, size, variant, ...props }) => <button {...props}>{children}</button>,
  Card: ({ children }) => <div>{children}</div>,
  Badge: ({ children }) => <span>{children}</span>,
  Spinner: () => <div data-testid="spinner" />,
  Alert: ({ children }) => <div role="alert">{children}</div>,
}));

vi.mock('../components/features/CreatePACIModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="create-modal" /> : null),
}));
vi.mock('../components/features/EditPACIModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="edit-modal" /> : null),
}));
vi.mock('../components/features/ViewPACIModal', () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="view-modal" /> : null),
}));

vi.mock('../services/paciService', () => ({
  default: {
    getActivePACIs: vi.fn(),
    getHistoricalPACIs: vi.fn(),
    getRecentPACIs: vi.fn(),
    getAllPACIs: vi.fn(),
    deletePACI: vi.fn(),
  },
}));

const activePaci = {
  id: 'p1',
  isActive: true,
  diagnostico: 'TEA',
  validFrom: '2025-03-01',
  validUntil: '2025-07-31',
  createdAt: '2025-03-01',
  student: { nombreCompleto: 'Juan Pérez', cursoActual: '5° Básico' },
};

describe('PACIPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paciService.getActivePACIs.mockResolvedValue([activePaci]);
    paciService.getHistoricalPACIs.mockResolvedValue([]);
    paciService.getRecentPACIs.mockResolvedValue([]);
  });

  it('carga los PACIs activos al montar', async () => {
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
    expect(paciService.getActivePACIs).toHaveBeenCalled();
  });

  it('cambia a la pestaña Historial y carga los históricos', async () => {
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Historial/i }));
    await waitFor(() => expect(paciService.getHistoricalPACIs).toHaveBeenCalled());
    expect(screen.getByText(/No hay perfiles en el historial/i)).toBeInTheDocument();
  });

  it('aplica filtros con getAllPACIs', async () => {
    paciService.getAllPACIs.mockResolvedValue([]);
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Curso'), { target: { value: '5° Básico' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));

    await waitFor(() => expect(paciService.getAllPACIs).toHaveBeenCalled());
    expect(paciService.getAllPACIs).toHaveBeenCalledWith(
      expect.objectContaining({ curso: '5° Básico', isActive: true }),
    );
  });

  it('elimina un PACI tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    paciService.deletePACI.mockResolvedValue({});
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(paciService.deletePACI).toHaveBeenCalledWith('p1'));
  });

  it('abre el modal de creación', async () => {
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Nuevo PACI/i }));
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });

  it('abre el modal de visualización al pulsar "Ver"', async () => {
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Ver' }));
    expect(screen.getByTestId('view-modal')).toBeInTheDocument();
  });

  it('muestra error si la carga falla', async () => {
    paciService.getActivePACIs.mockRejectedValue(new Error('Fallo PACI'));
    render(<PACIPage />);
    await waitFor(() => expect(screen.getByText('Fallo PACI')).toBeInTheDocument());
  });
});
