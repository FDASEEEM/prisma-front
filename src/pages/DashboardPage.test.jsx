/**
 * DashboardPage.test.jsx
 * Pruebas del escritorio del docente: carga, saludo, stats, estudiantes,
 * anuncios y acción rápida de navegación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import adminPanelService from '../services/adminPanelService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { nombre: 'Ada' } }),
}));

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../components/ui', () => ({
  Card: ({ children }) => <div>{children}</div>,
  Badge: ({ children }) => <span>{children}</span>,
  Button: ({ children, variant, ...props }) => <button {...props}>{children}</button>,
  Alert: ({ children }) => <div role="alert">{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock('../services/dashboardService', () => ({ default: {} }));
vi.mock('../services/adminPanelService', () => ({
  default: { getActiveAnnouncements: vi.fn() },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el spinner mientras carga', () => {
    adminPanelService.getActiveAnnouncements.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renderiza saludo, estadísticas y estudiantes recientes', async () => {
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText(/¡Hola, Ada!/)).toBeInTheDocument());
    expect(screen.getByText('12')).toBeInTheDocument(); // totalStudents
    expect(screen.getByText('Pablo Rodríguez')).toBeInTheDocument();
  });

  it('muestra los anuncios activos cuando existen', async () => {
    adminPanelService.getActiveAnnouncements.mockResolvedValue([
      { id: 'a1', title: 'Mantención', body: 'El sistema estará offline', audience: 'TODOS' },
    ]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Mantención')).toBeInTheDocument());
    expect(screen.getByText('El sistema estará offline')).toBeInTheDocument();
  });

  it('navega a /paci con la acción rápida "Nuevo PACI"', async () => {
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText(/¡Hola, Ada!/)).toBeInTheDocument());

    fireEvent.click(screen.getByText('Nuevo PACI'));
    expect(mockNavigate).toHaveBeenCalledWith('/paci');
  });

  it('tolera el fallo al cargar anuncios sin romper la página', async () => {
    adminPanelService.getActiveAnnouncements.mockRejectedValue(new Error('sin anuncios'));
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText(/¡Hola, Ada!/)).toBeInTheDocument());
  });
});
