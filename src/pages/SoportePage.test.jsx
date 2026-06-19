/**
 * SoportePage.test.jsx
 * Pruebas de soporte: carga de tickets propios, filtro por prioridad y creación
 * de tickets (éxito, validación y error).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SoportePage from './SoportePage';
import adminPanelService from '../services/adminPanelService';

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../components/ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Input: ({ label, error, ...props }) => <input aria-label={label} {...props} />,
}));

vi.mock('../services/adminPanelService', () => ({
  default: { getTicketsByRequester: vi.fn(), createTicket: vi.fn() },
}));

describe('SoportePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga y muestra los tickets del usuario', async () => {
    adminPanelService.getTicketsByRequester.mockResolvedValue([
      { id: 't1', subject: 'No carga PDF', message: 'detalle', status: 'open', priority: 'high', createdAt: '2025-06-01' },
    ]);
    render(<SoportePage />);

    await waitFor(() => expect(screen.getByText('No carga PDF')).toBeInTheDocument());
    expect(adminPanelService.getTicketsByRequester).toHaveBeenCalledWith('u1');
  });

  it('filtra los tickets por prioridad', async () => {
    adminPanelService.getTicketsByRequester.mockResolvedValue([
      { id: 't1', subject: 'Ticket alta', message: 'm', status: 'open', priority: 'high', createdAt: '2025-06-01' },
      { id: 't2', subject: 'Ticket baja', message: 'm', status: 'open', priority: 'low', createdAt: '2025-06-01' },
    ]);
    render(<SoportePage />);
    await waitFor(() => expect(screen.getByText('Ticket alta')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Baja' }));
    expect(screen.queryByText('Ticket alta')).not.toBeInTheDocument();
    expect(screen.getByText('Ticket baja')).toBeInTheDocument();
  });

  it('mantiene deshabilitado el envío si faltan asunto o mensaje', async () => {
    adminPanelService.getTicketsByRequester.mockResolvedValue([]);
    render(<SoportePage />);
    await waitFor(() =>
      expect(screen.getByText(/No has enviado tickets aún/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /Enviar ticket/i })).toBeDisabled();
  });

  it('crea un ticket con datos válidos y muestra confirmación', async () => {
    adminPanelService.getTicketsByRequester.mockResolvedValue([]);
    adminPanelService.createTicket.mockResolvedValue({ id: 't9' });
    render(<SoportePage />);
    await waitFor(() => expect(adminPanelService.getTicketsByRequester).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Asunto'), {
      target: { value: 'Error al generar' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe tu problema/i), {
      target: { value: 'No funciona la descarga' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar ticket/i }));

    await waitFor(() => expect(adminPanelService.createTicket).toHaveBeenCalled());
    expect(adminPanelService.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: 'u1',
        subject: 'Error al generar',
        message: 'No funciona la descarga',
        priority: 'medium',
      }),
    );
    expect(await screen.findByText(/Ticket enviado correctamente/i)).toBeInTheDocument();
  });

  it('muestra error si la creación del ticket falla', async () => {
    adminPanelService.getTicketsByRequester.mockResolvedValue([]);
    adminPanelService.createTicket.mockRejectedValue(new Error('Servidor caído'));
    render(<SoportePage />);
    await waitFor(() => expect(adminPanelService.getTicketsByRequester).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'X' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe tu problema/i), {
      target: { value: 'Y' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar ticket/i }));

    expect(await screen.findByText('Servidor caído')).toBeInTheDocument();
  });
});
