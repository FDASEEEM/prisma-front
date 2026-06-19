/**
 * AdminPanelPage.test.jsx
 * Pruebas del panel de administración: carga inicial, KPIs del dashboard,
 * navegación entre pestañas, creación de recurso, validación de anuncio y
 * eliminación con diálogo de confirmación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPanelPage from './AdminPanelPage';
import adminPanelService from '../services/adminPanelService';

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { nombreCompleto: 'Admin Root' } }),
}));

vi.mock('../components/ui', () => ({
  Alert: ({ children }) => <div role="alert">{children}</div>,
  Badge: ({ children }) => <span>{children}</span>,
  Button: ({ children, variant, size, ...props }) => <button {...props}>{children}</button>,
  Card: ({ children }) => <div>{children}</div>,
  Input: ({ label, error, ...props }) => <input aria-label={label} {...props} />,
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock('../services/adminPanelService', () => ({
  default: {
    getSummary: vi.fn(),
    getTickets: vi.fn(),
    getResources: vi.fn(),
    getAnnouncements: vi.fn(),
    getAuditLogs: vi.fn(),
    getProfessors: vi.fn(),
    getActiveSessions: vi.fn(),
    getHistoricalSessions: vi.fn(),
    getBlockedSessions: vi.fn(),
    createResource: vi.fn(),
    createAnnouncement: vi.fn(),
    createProfessor: vi.fn(),
    deleteResource: vi.fn(),
  },
}));

const setDefaults = () => {
  adminPanelService.getSummary.mockResolvedValue({
    kpis: { openTickets: 3, publishedAnnouncements: 2, totalResources: 5, activeProfessors: 8, activeSessions: 1 },
    recentTickets: [{ id: 't1', subject: 'Ayuda con PDF', status: 'open', priority: 'high', createdAt: '2025-06-01' }],
  });
  adminPanelService.getTickets.mockResolvedValue({ items: [] });
  adminPanelService.getResources.mockResolvedValue([]);
  adminPanelService.getAnnouncements.mockResolvedValue([]);
  adminPanelService.getAuditLogs.mockResolvedValue([]);
  adminPanelService.getProfessors.mockResolvedValue([]);
  adminPanelService.getActiveSessions.mockResolvedValue([]);
  adminPanelService.getHistoricalSessions.mockResolvedValue([]);
  adminPanelService.getBlockedSessions.mockResolvedValue([]);
};

const goToTab = (name) => fireEvent.click(screen.getByRole('button', { name }));

describe('AdminPanelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaults();
  });

  it('muestra el spinner mientras carga', () => {
    adminPanelService.getSummary.mockReturnValue(new Promise(() => {}));
    render(<AdminPanelPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renderiza los KPIs y los tickets recientes en el dashboard', async () => {
    render(<AdminPanelPage />);
    await waitFor(() =>
      expect(screen.getByText('Panel de Administración')).toBeInTheDocument(),
    );
    expect(screen.getByText('Tickets abiertos')).toBeInTheDocument();
    expect(screen.getByText('Ayuda con PDF')).toBeInTheDocument();
  });

  it('navega entre pestañas mostrando sus encabezados', async () => {
    render(<AdminPanelPage />);
    await waitFor(() => expect(screen.getByText('Panel de Administración')).toBeInTheDocument());

    goToTab('Tickets');
    await waitFor(() => expect(screen.getByText(/^Tickets \(/)).toBeInTheDocument());

    goToTab('Recursos');
    await waitFor(() => expect(screen.getByText('Crear Recurso')).toBeInTheDocument());

    goToTab('Anuncios');
    await waitFor(() => expect(screen.getByText('Crear Anuncio')).toBeInTheDocument());

    goToTab('Profesores');
    await waitFor(() => expect(screen.getByText('Crear Profesor')).toBeInTheDocument());

    goToTab('Sesiones');
    await waitFor(() => expect(screen.getByText(/Sesiones Activas/)).toBeInTheDocument());

    goToTab('Auditoría');
    await waitFor(() => expect(screen.getByText(/^Auditoría \(/)).toBeInTheDocument());
  });

  it('crea un recurso y muestra el toast de éxito', async () => {
    adminPanelService.createResource.mockResolvedValue({ id: 'r1' });
    render(<AdminPanelPage />);
    await waitFor(() => expect(screen.getByText('Panel de Administración')).toBeInTheDocument());

    goToTab('Recursos');
    await waitFor(() => expect(screen.getByText('Crear Recurso')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Guía PACI' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear recurso/i }));

    await waitFor(() => expect(adminPanelService.createResource).toHaveBeenCalled());
    expect(await screen.findByText('Recurso creado correctamente')).toBeInTheDocument();
  });

  it('valida el anuncio: exige "Publicado por"', async () => {
    render(<AdminPanelPage />);
    await waitFor(() => expect(screen.getByText('Panel de Administración')).toBeInTheDocument());

    goToTab('Anuncios');
    await waitFor(() => expect(screen.getByText('Crear Anuncio')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Crear anuncio/i }));

    expect(
      await screen.findByText('El campo "Publicado por" es obligatorio'),
    ).toBeInTheDocument();
    expect(adminPanelService.createAnnouncement).not.toHaveBeenCalled();
  });

  it('elimina un recurso tras confirmar en el diálogo', async () => {
    adminPanelService.getResources.mockResolvedValue([
      { id: 'r1', title: 'Guía', type: 'document', url: 'http://x' },
    ]);
    adminPanelService.deleteResource.mockResolvedValue({});
    render(<AdminPanelPage />);
    await waitFor(() => expect(screen.getByText('Panel de Administración')).toBeInTheDocument());

    goToTab('Recursos');
    await waitFor(() => expect(screen.getByText('Guía')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(adminPanelService.deleteResource).toHaveBeenCalledWith('r1'));
  });
});
