/**
 * SessionToast.test.jsx
 * Pruebas unitarias del componente SessionToast.
 *
 * NOTA: el componente actualiza `visible` en un useEffect que se ejecuta durante
 * el render (act de RTL), por lo que las aserciones son SÍNCRONAS. No se usa
 * `waitFor` junto a `vi.useFakeTimers()` porque esa combinación se deadlockea
 * (waitFor sondea con timers congelados).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionToast from './SessionToast';

vi.mock('../../context/ActiveSessionContext', () => ({
  useActiveSession: vi.fn(),
}));

vi.mock('../../services/chatService', () => ({
  default: { downloadResult: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn(() => vi.fn()) };
});

import { useActiveSession } from '../../context/ActiveSessionContext';
import chatService from '../../services/chatService';

const setSession = (activeSession, stopTracking = vi.fn()) =>
  useActiveSession.mockReturnValue({ activeSession, stopTracking });

const renderToast = () =>
  render(
    <BrowserRouter>
      <SessionToast />
    </BrowserRouter>,
  );

describe('SessionToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no renderiza si no hay sesión activa', () => {
    setSession(null);
    const { container } = renderToast();
    expect(container.firstChild).toBeNull();
  });

  it('no renderiza si la sesión está en fase running', () => {
    setSession({ sessionId: 's1', phase: 'running', currentStep: 'Procesando' });
    renderToast();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('muestra el toast de éxito cuando la sesión se completa', () => {
    setSession({ sessionId: 's1', phase: 'completed', workflowStatus: 'success' });
    renderToast();
    expect(screen.getByText('Tu material se ha generado')).toBeInTheDocument();
  });

  it('muestra el toast de error con su mensaje', () => {
    setSession({ sessionId: 's1', phase: 'error', error: 'Error al procesar el documento' });
    renderToast();
    expect(screen.getByText('Error en la generación')).toBeInTheDocument();
    expect(screen.getByText('Error al procesar el documento')).toBeInTheDocument();
  });

  it('cierra automáticamente el toast de error tras el tiempo especificado', () => {
    const stopTracking = vi.fn();
    setSession({ sessionId: 's1', phase: 'error', error: 'x' }, stopTracking);
    renderToast();
    act(() => { vi.advanceTimersByTime(13000); });
    expect(stopTracking).toHaveBeenCalled();
  });

  it('no cierra automáticamente el toast de éxito', () => {
    const stopTracking = vi.fn();
    setSession({ sessionId: 's1', phase: 'completed', workflowStatus: 'success' }, stopTracking);
    renderToast();
    act(() => { vi.advanceTimersByTime(20000); });
    expect(stopTracking).not.toHaveBeenCalled();
  });

  it('muestra un toast terminal restaurado (éxito) inmediatamente', () => {
    setSession({ sessionId: 's1', phase: 'completed', workflowStatus: 'success' });
    renderToast();
    expect(screen.getByText('Tu material se ha generado')).toBeInTheDocument();
  });

  it('muestra una barra de progreso en el toast de error', () => {
    setSession({ sessionId: 's1', phase: 'error', error: 'Error' });
    const { container } = renderToast();
    expect(container.querySelector('[style*="width"]')).toBeInTheDocument();
  });

  it('ofrece acciones (ver sesión y descargar) en el toast de éxito', () => {
    setSession({ sessionId: 's1', phase: 'completed', workflowStatus: 'success' });
    renderToast();
    expect(screen.getByText('Ver sesion')).toBeInTheDocument();
    expect(screen.getByText('Descargar')).toBeInTheDocument();
  });

  it('llama downloadResult al hacer clic en descargar', () => {
    chatService.downloadResult.mockResolvedValue({ success: true });
    setSession({ sessionId: 's1', phase: 'completed', workflowStatus: 'success' });
    renderToast();
    fireEvent.click(screen.getByText('Descargar'));
    expect(chatService.downloadResult).toHaveBeenCalledWith('s1');
  });

  it('maneja errores al descargar sin crashear', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    chatService.downloadResult.mockRejectedValue(new Error('Download failed'));
    setSession({ sessionId: 's1', phase: 'completed', workflowStatus: 'success' });
    renderToast();
    await act(async () => {
      fireEvent.click(screen.getByText('Descargar'));
    });
    expect(chatService.downloadResult).toHaveBeenCalledWith('s1');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('muestra un bloqueo normativo distinto del error de sistema', () => {
    setSession({
      sessionId: 's1',
      phase: 'error',
      workflowStatus: 'compliance_blocked',
      error: 'El PACI no es procesable — informe vencido. (Decreto 170/2010)',
    });
    renderToast();
    expect(screen.getByText('Documento no conforme a normativa')).toBeInTheDocument();
    expect(screen.getByText(/Decreto 170\/2010/)).toBeInTheDocument();
    expect(screen.queryByText('Error en la generación')).not.toBeInTheDocument();
  });

  it('auto-cierra el bloqueo/error sin crashear (regresión TDZ de handleDismiss)', () => {
    const stopTracking = vi.fn();
    setSession(
      { sessionId: 's1', phase: 'error', workflowStatus: 'compliance_blocked', error: 'bloqueo' },
      stopTracking,
    );
    renderToast();
    act(() => { vi.advanceTimersByTime(13000); });
    expect(stopTracking).toHaveBeenCalled();
  });
});
