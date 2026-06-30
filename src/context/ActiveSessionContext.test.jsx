/**
 * ActiveSessionContext.test.jsx
 * Pruebas unitarias del contexto de sesión activa (tracking SSE).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ActiveSessionProvider, useActiveSession } from './ActiveSessionContext';

vi.mock('../utils/localStorage', () => ({
  default: { getToken: vi.fn(() => 'mock_token') },
}));

vi.mock('../constants/api', () => ({
  CHAT_ENDPOINTS: {
    STREAM: (sessionId) => `/chat/${sessionId}/stream`,
  },
}));

// localStorage controlado (la jsdom de esta versión no expone clear utilizable).
const makeStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    clear: vi.fn(() => store.clear()),
  };
};

let lastEventSource;
beforeEach(() => {
  vi.clearAllMocks();
  global.localStorage = makeStorage();
  lastEventSource = null;
  global.EventSource = vi.fn(function (url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.close = vi.fn();
    lastEventSource = this;
  });
});

const Consumer = () => {
  const { activeSession, startTracking, stopTracking } = useActiveSession();
  return (
    <div>
      <button onClick={() => startTracking('session_123')}>start</button>
      <button onClick={stopTracking}>stop</button>
      <div data-testid="session">{activeSession ? 'has-session' : 'no-session'}</div>
      <div data-testid="id">{activeSession?.sessionId || 'none'}</div>
      <div data-testid="phase">{activeSession?.phase || 'none'}</div>
      <div data-testid="step">{activeSession?.currentStep || 'none'}</div>
    </div>
  );
};

const renderProvider = () =>
  render(
    <ActiveSessionProvider>
      <Consumer />
    </ActiveSessionProvider>,
  );

describe('ActiveSessionContext', () => {
  it('renderiza los children', () => {
    render(
      <ActiveSessionProvider>
        <div data-testid="child">hijo</div>
      </ActiveSessionProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('inicializa con activeSession en null', () => {
    renderProvider();
    expect(screen.getByTestId('session')).toHaveTextContent('no-session');
  });

  it('restaura la sesión desde localStorage al montar', () => {
    global.localStorage.getItem.mockReturnValueOnce(
      JSON.stringify({ sessionId: 'session_999', phase: 'completed' }),
    );
    renderProvider();
    expect(screen.getByTestId('id')).toHaveTextContent('session_999');
  });

  it('maneja localStorage corrupto sin lanzar', () => {
    global.localStorage.getItem.mockReturnValueOnce('json roto {');
    expect(() => renderProvider()).not.toThrow();
    expect(screen.getByTestId('session')).toHaveTextContent('no-session');
  });

  it('useActiveSession lanza error fuera del provider', () => {
    const Bad = () => {
      useActiveSession();
      return null;
    };
    expect(() => render(<Bad />)).toThrow('useActiveSession must be used inside ActiveSessionProvider');
  });

  it('startTracking crea la sesión en running y abre el EventSource', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'start' }));
    expect(screen.getByTestId('id')).toHaveTextContent('session_123');
    expect(screen.getByTestId('phase')).toHaveTextContent('running');
    expect(global.EventSource).toHaveBeenCalledTimes(1);
    expect(lastEventSource.url).toContain('/chat/session_123/stream');
  });

  it('stopTracking limpia la sesión', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'start' }));
    fireEvent.click(screen.getByRole('button', { name: 'stop' }));
    expect(screen.getByTestId('session')).toHaveTextContent('no-session');
  });

  it('actualiza el estado ante un evento agent_start', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'start' }));
    act(() => {
      lastEventSource.onmessage({
        data: JSON.stringify({ type: 'agent_start', message: 'Procesando PACI' }),
      });
    });
    expect(screen.getByTestId('step')).toHaveTextContent('Procesando PACI');
  });

  it('marca la sesión como completed ante un evento completed', () => {
    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'start' }));
    act(() => {
      lastEventSource.onmessage({
        data: JSON.stringify({ type: 'completed', workflow_status: 'success' }),
      });
    });
    expect(screen.getByTestId('phase')).toHaveTextContent('completed');
    expect(lastEventSource.close).toHaveBeenCalled();
  });

  it('no reconecta si ya está rastreando la misma sesión', () => {
    renderProvider();
    const start = screen.getByRole('button', { name: 'start' });
    fireEvent.click(start);
    fireEvent.click(start);
    expect(global.EventSource).toHaveBeenCalledTimes(1);
  });
});
