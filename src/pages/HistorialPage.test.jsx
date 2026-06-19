/**
 * HistorialPage.test.jsx
 * Pruebas del historial de sesiones: estados de carga/vacío/error, render de
 * filas, descarga y navegación a una sesión en curso.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistorialPage from './HistorialPage';
import jobsService from '../services/jobsService';
import chatService from '../services/chatService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children, title }) => <div data-title={title}>{children}</div>,
}));

vi.mock('../components/ui', () => ({
  Card: ({ children }) => <div>{children}</div>,
  Badge: ({ children }) => <span>{children}</span>,
  Button: ({ children, loading, icon, variant, ...props }) => (
    <button {...props}>{children}</button>
  ),
  Alert: ({ children }) => <div role="alert">{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
}));

vi.mock('../services/jobsService', () => ({
  default: { getHistory: vi.fn() },
}));

vi.mock('../services/chatService', () => ({
  default: { downloadResult: vi.fn() },
}));

describe('HistorialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el spinner mientras carga', () => {
    jobsService.getHistory.mockReturnValue(new Promise(() => {}));
    render(<HistorialPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay sesiones', async () => {
    jobsService.getHistory.mockResolvedValue([]);
    render(<HistorialPage />);
    await waitFor(() =>
      expect(screen.getByText(/Aún no tienes sesiones generadas/i)).toBeInTheDocument(),
    );
  });

  it('muestra un Alert cuando la carga falla', async () => {
    jobsService.getHistory.mockRejectedValue(new Error('Fallo de red'));
    render(<HistorialPage />);
    await waitFor(() => expect(screen.getByText('Fallo de red')).toBeInTheDocument());
  });

  it('renderiza las sesiones y permite descargar una completada', async () => {
    chatService.downloadResult.mockResolvedValue({});
    jobsService.getHistory.mockResolvedValue([
      {
        sessionId: 'sess-1',
        phase: 'completed',
        workflowStatus: 'success',
        prompt: 'Adaptar matemáticas',
        docxS3Key: 'key.docx',
        createdAt: '2025-06-01T10:00:00Z',
      },
    ]);
    render(<HistorialPage />);

    await waitFor(() => expect(screen.getByText('Adaptar matemáticas')).toBeInTheDocument());
    expect(screen.getByText('sess-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Descargar/i }));
    await waitFor(() => expect(chatService.downloadResult).toHaveBeenCalledWith('sess-1'));
  });

  it('permite ver una sesión en curso (navega a /sesion/:id)', async () => {
    jobsService.getHistory.mockResolvedValue([
      {
        sessionId: 'sess-2',
        phase: 'running',
        prompt: 'En progreso',
        createdAt: '2025-06-01T10:00:00Z',
      },
    ]);
    render(<HistorialPage />);

    await waitFor(() => expect(screen.getByText('En progreso')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Ver/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/sesion/sess-2');
  });
});
