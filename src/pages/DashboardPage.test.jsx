/**
 * DashboardPage.test.jsx
 * Pruebas del escritorio del docente: carga, saludo, stats, estudiantes,
 * anuncios y acción rápida de navegación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import dashboardService from '../services/dashboardService';
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

vi.mock('../services/dashboardService', () => ({
  default: {
    getStudents: vi.fn(),
    getPaciProfiles: vi.fn(),
    getRecentJobs: vi.fn(),
    getJobsHistory: vi.fn(),
  },
}));

vi.mock('../services/adminPanelService', () => ({
  default: { getActiveAnnouncements: vi.fn() },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardService.getStudents.mockResolvedValue([]);
    dashboardService.getPaciProfiles.mockResolvedValue([]);
    dashboardService.getRecentJobs.mockResolvedValue([]);
  });

  it('muestra el spinner mientras carga', () => {
    dashboardService.getStudents.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renderiza saludo y estadísticas con datos vacíos', async () => {
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText(/¡Hola, Ada!/)).toBeInTheDocument());
    expect(screen.getByText('Estudiantes')).toBeInTheDocument();
    expect(screen.getByText('PACIs Activos')).toBeInTheDocument();
    expect(screen.getByText('Adaptaciones')).toBeInTheDocument();
    expect(screen.getByText('Pendientes')).toBeInTheDocument();
  });

  it('muestra la tabla vacía de estudiantes cuando no hay datos', async () => {
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('No hay estudiantes registrados')).toBeInTheDocument());
  });

  it('muestra la sección vacía de materiales cuando no hay datos', async () => {
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('No hay materiales adaptados aún')).toBeInTheDocument());
  });

  it('renderiza estudiantes reales cuando la API responde', async () => {
    dashboardService.getStudents.mockResolvedValue([
      { id: '1', nombre: 'Juan Pérez', rut: '12.345.678-9', active: true },
    ]);
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
    expect(screen.getByText('12.345.678-9')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
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

  it('tolera fallos individuales de la API sin romper el dashboard', async () => {
    dashboardService.getStudents.mockRejectedValue(new Error('network error'));
    dashboardService.getPaciProfiles.mockResolvedValue([]);
    dashboardService.getRecentJobs.mockResolvedValue([]);
    adminPanelService.getActiveAnnouncements.mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText(/¡Hola, Ada!/)).toBeInTheDocument());
  });
});
