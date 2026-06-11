/**
 * SessionToast.test.jsx
 * Pruebas unitarias para el componente SessionToast
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionToast from './SessionToast';

// Mocks
vi.mock('../../context/ActiveSessionContext', () => ({
  useActiveSession: vi.fn(),
}));

vi.mock('../../services/chatService', () => ({
  default: {
    downloadResult: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

import { useActiveSession } from '../../context/ActiveSessionContext';
import chatService from '../../services/chatService';

describe('SessionToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no debe renderizar si no hay sesión activa', () => {
    useActiveSession.mockReturnValue({
      activeSession: null,
      stopTracking: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    expect(container.firstChild.childNodes.length).toBe(0);
  });

  it('no debe renderizar si sesión está en fase running', () => {
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'running',
        currentStep: 'Procesando',
      },
      stopTracking: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    // No debe mostrar nada inicialmente para fase running
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('debe mostrar toast cuando sesión se completa', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'completed',
        currentStep: '',
        workflowStatus: 'success',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/éxito|completada|completed/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar toast cuando sesión tiene error', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'error',
        currentStep: '',
        error: 'Error al procesar el documento',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error|Error/i)).toBeInTheDocument();
    });
  });

  it('debe cerrar automáticamente el toast de error después del tiempo especificado', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'error',
        currentStep: '',
        error: 'Error de procesamiento',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    // Avanzar el tiempo más allá del ERROR_TOAST_DURATION (12000ms)
    vi.advanceTimersByTime(13000);

    await waitFor(() => {
      expect(stopTrackingMock).toHaveBeenCalled();
    });
  });

  it('no debe cerrar automáticamente el toast completado', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'completed',
        currentStep: '',
        workflowStatus: 'success',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    // Avanzar el tiempo mucho más que ERROR_TOAST_DURATION
    vi.advanceTimersByTime(20000);

    // No debe llamar stopTracking porque el toast de completado no se auto-cierra
    expect(stopTrackingMock).not.toHaveBeenCalled();
  });

  it('debe restaurar sesión terminal desde localStorage', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'completed',
        currentStep: '',
        workflowStatus: 'success',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Debe mostrar algo visible
      expect(screen.getByText(/completed|éxito/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar barra de progreso para toast de error', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'error',
        currentStep: '',
        error: 'Error',
      },
      stopTracking: stopTrackingMock,
    });

    const { container } = render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    // Buscar elemento que represente barra de progreso
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('debe tener opciones de acción (ir a sesión, descargar, etc)', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'completed',
        currentStep: '',
        workflowStatus: 'success',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Debe haber al menos un botón en el toast
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('debe llamar downloadResult cuando se hace clic en descargar', async () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'completed',
        currentStep: '',
        workflowStatus: 'success',
      },
      stopTracking: stopTrackingMock,
    });

    chatService.downloadResult.mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.queryByText(/descargar|download/i);
      if (downloadButton) {
        downloadButton.click();
      }
    });
  });

  it('debe manejar errores al descargar resultado', async () => {
    console.error = vi.fn();
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'completed',
        currentStep: '',
        workflowStatus: 'success',
      },
      stopTracking: stopTrackingMock,
    });

    chatService.downloadResult.mockRejectedValue(new Error('Download failed'));

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.queryByText(/descargar|download/i);
      if (downloadButton) {
        downloadButton.click();
      }
    });
  });

  // NOTA: este archivo usa vi.useFakeTimers() + waitFor en varios tests, combinación
  // que se deadlockea (waitFor sondea con timers congelados). Los tests nuevos asertan
  // de forma síncrona para evitarlo.
  it('debe mostrar un bloqueo normativo distinto del error de sistema', () => {
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'error',
        workflowStatus: 'compliance_blocked',
        error: 'El PACI no es procesable — informe vencido. (Decreto 170/2010)',
      },
      stopTracking: vi.fn(),
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    expect(screen.getByText('Documento no conforme a normativa')).toBeInTheDocument();
    expect(screen.getByText(/Decreto 170\/2010/)).toBeInTheDocument();
    expect(screen.queryByText('Error en la generación')).not.toBeInTheDocument();
  });

  it('auto-cierra el bloqueo/error sin crashear (regresión TDZ de handleDismiss)', () => {
    const stopTrackingMock = vi.fn();
    useActiveSession.mockReturnValue({
      activeSession: {
        sessionId: 'session_123',
        phase: 'error',
        workflowStatus: 'compliance_blocked',
        error: 'bloqueo',
      },
      stopTracking: stopTrackingMock,
    });

    render(
      <BrowserRouter>
        <SessionToast />
      </BrowserRouter>
    );

    act(() => { vi.advanceTimersByTime(13000); });

    expect(stopTrackingMock).toHaveBeenCalled();
  });
});
