/**
 * TopNav.test.jsx
 * Pruebas de la barra superior: avatar, dropdowns (notificaciones, status,
 * perfil), conteo de no leídas, marcar como leída y cierre de sesión.
 *
 * Se mockean los servicios y `fetch` para que los efectos resuelvan de
 * inmediato; los intervalos de 30s no se disparan durante el test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TopNav from './TopNav';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  default: { logout: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../services/adminPanelService', () => ({
  default: {
    getActiveAnnouncements: vi.fn(),
    getNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
  },
}));

import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import adminPanelService from '../../services/adminPanelService';

const user = { id: 'u1', nombre: 'Ada Lovelace', email: 'ada@test.cl' };
const logout = vi.fn();

const setup = ({ notifications = [], announcements = [] } = {}) => {
  useAuth.mockReturnValue({ user, logout });
  adminPanelService.getActiveAnnouncements.mockResolvedValue(announcements);
  adminPanelService.getNotifications.mockResolvedValue(notifications);
  return render(<TopNav title="Dashboard" />);
};

describe('TopNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el avatar con las iniciales del usuario', async () => {
    setup();
    expect(screen.getByText('AL')).toBeInTheDocument();
    await waitFor(() => expect(adminPanelService.getNotifications).toHaveBeenCalledWith('u1'));
  });

  it('muestra el badge con el conteo de notificaciones no leídas', async () => {
    setup({
      notifications: [
        { id: 'n1', title: 'Hola', message: 'msg', read: false, createdAt: '2025-06-01' },
        { id: 'n2', title: 'Leída', message: 'msg', read: true, createdAt: '2025-06-01' },
      ],
    });
    await waitFor(() => expect(screen.getAllByText('1').length).toBeGreaterThan(0));
  });

  it('abre el dropdown de notificaciones y marca una como leída', async () => {
    adminPanelService.markNotificationRead.mockResolvedValue({});
    setup({
      notifications: [
        { id: 'n1', title: 'Nueva alerta', message: 'detalle', read: false, createdAt: '2025-06-01' },
      ],
    });

    await waitFor(() => expect(adminPanelService.getNotifications).toHaveBeenCalled());

    fireEvent.click(screen.getByText('notifications'));
    expect(await screen.findByText('Nueva alerta')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Leído'));
    await waitFor(() =>
      expect(adminPanelService.markNotificationRead).toHaveBeenCalledWith('n1'),
    );
    await waitFor(() => expect(screen.queryByText('Nueva alerta')).not.toBeInTheDocument());
  });

  it('abre el menú de perfil y navega a /profile', async () => {
    setup();
    fireEvent.click(screen.getByText('AL'));
    fireEvent.click(screen.getByText('Mi Perfil'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('cierra sesión: llama a authService.logout, logout del contexto y navega a /login', async () => {
    setup();
    fireEvent.click(screen.getByText('AL'));
    fireEvent.click(screen.getByText('Salir'));

    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('muestra el estado de los servicios en el dropdown de status', async () => {
    setup();
    fireEvent.click(screen.getByText('settings'));
    expect(screen.getByText('Auth')).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
