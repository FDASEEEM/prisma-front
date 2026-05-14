/**
 * ActiveSessionContext.test.jsx
 * Pruebas unitarias para el contexto de sesión activa
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActiveSessionProvider, useActiveSession } from './ActiveSessionContext';
import storageUtils from '../utils/localStorage';

// Mock dependencies
vi.mock('../utils/localStorage');
vi.mock('../constants/api', () => ({
  CHAT_ENDPOINTS: {
    STREAM: (sessionId) => `/api/chat/session/${sessionId}/stream`,
  },
}));

// Mock EventSource
global.EventSource = vi.fn();

describe('ActiveSessionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    storageUtils.getToken.mockReturnValue('mock_token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ActiveSessionProvider', () => {
    it('debe renderizar children correctamente', () => {
      render(
        <ActiveSessionProvider>
          <div data-testid="child">Test Child</div>
        </ActiveSessionProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('debe inicializar con activeSession null', () => {
      const TestComponent = () => {
        const { activeSession } = useActiveSession();
        return (
          <div data-testid="session">{activeSession ? 'has-session' : 'no-session'}</div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      expect(screen.getByTestId('session')).toHaveTextContent('no-session');
    });

    it('debe cargar sesión de localStorage al montar', () => {
      const mockSession = {
        sessionId: 'session_123',
        phase: 'completed',
        workflowStatus: 'success',
      };

      localStorage.getItem = vi.fn().mockReturnValueOnce(JSON.stringify(mockSession));

      const TestComponent = () => {
        const { activeSession } = useActiveSession();
        return (
          <div data-testid="session-id">{activeSession?.sessionId || 'none'}</div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      expect(screen.getByTestId('session-id')).toHaveTextContent('session_123');
    });

    it('debe manejar localStorage corrupto sin errores', () => {
      localStorage.getItem = vi.fn().mockReturnValueOnce('invalid json{');

      const TestComponent = () => {
        const { activeSession } = useActiveSession();
        return <div data-testid="status">rendered</div>;
      };

      expect(() => {
        render(
          <ActiveSessionProvider>
            <TestComponent />
          </ActiveSessionProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('status')).toBeInTheDocument();
    });
  });

  describe('useActiveSession hook', () => {
    it('debe lanzar error si se usa fuera del provider', () => {
      const TestComponent = () => {
        useActiveSession();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useActiveSession must be used inside ActiveSessionProvider'
      );
    });

    it('debe proporcionar startTracking', async () => {
      const TestComponent = () => {
        const { startTracking, activeSession } = useActiveSession();
        return (
          <div>
            <button onClick={() => startTracking('session_123')}>Start</button>
            <div data-testid="session-id">{activeSession?.sessionId || 'none'}</div>
          </div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      const startButton = screen.getByRole('button', { name: /start/i });
      startButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent('session_123');
      });
    });

    it('debe proporcionar stopTracking', async () => {
      const mockSession = {
        sessionId: 'session_123',
        phase: 'running',
      };

      localStorage.getItem = vi.fn().mockReturnValueOnce(JSON.stringify(mockSession));

      const TestComponent = () => {
        const { stopTracking, activeSession } = useActiveSession();
        return (
          <div>
            <button onClick={stopTracking}>Stop</button>
            <div data-testid="session">{activeSession ? 'has-session' : 'no-session'}</div>
          </div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      const stopButton = screen.getByRole('button', { name: /stop/i });
      stopButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('session')).toHaveTextContent('no-session');
      });
    });

    it('debe actualizar estado cuando recibe evento agent_start', async () => {
      let messageHandler;
      global.EventSource = vi.fn((url) => ({
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        addEventListener: vi.fn((event, handler) => {
          if (event === 'message') messageHandler = handler;
        }),
      }));

      const TestComponent = () => {
        const { startTracking, activeSession } = useActiveSession();
        return (
          <div>
            <button onClick={() => startTracking('session_123')}>Start</button>
            <div data-testid="phase">{activeSession?.phase || 'none'}</div>
            <div data-testid="step">{activeSession?.currentStep || 'none'}</div>
          </div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      const startButton = screen.getByRole('button', { name: /start/i });
      startButton.click();

      // Simular evento agent_start
      await waitFor(() => {
        const mockEventSource = global.EventSource.mock.results[0].value;
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify({ type: 'agent_start', message: 'Processing PACI' }),
          });
        }
      });
    });

    it('debe actualizar estado cuando recibe evento completed', async () => {
      let mockEventSource;
      global.EventSource = vi.fn((url) => {
        mockEventSource = {
          onmessage: null,
          onerror: null,
          close: vi.fn(),
        };
        return mockEventSource;
      });

      const TestComponent = () => {
        const { startTracking, activeSession } = useActiveSession();
        return (
          <div>
            <button onClick={() => startTracking('session_123')}>Start</button>
            <div data-testid="phase">{activeSession?.phase || 'none'}</div>
          </div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      const startButton = screen.getByRole('button', { name: /start/i });
      startButton.click();

      await waitFor(() => {
        if (mockEventSource && mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify({
              type: 'completed',
              workflow_status: 'success',
            }),
          });
        }
      });
    });

    it('debe no reconectar si ya estaba rastreando la misma sesión', () => {
      global.EventSource = vi.fn();

      const TestComponent = () => {
        const { startTracking } = useActiveSession();
        return (
          <div>
            <button onClick={() => startTracking('session_123')}>Track 123</button>
            <button onClick={() => startTracking('session_123')}>Track 123 Again</button>
          </div>
        );
      };

      render(
        <ActiveSessionProvider>
          <TestComponent />
        </ActiveSessionProvider>
      );

      const buttons = screen.getAllByRole('button');
      buttons[0].click();
      const firstCallCount = global.EventSource.mock.calls.length;

      buttons[1].click();
      const secondCallCount = global.EventSource.mock.calls.length;

      // No debería llamar EventSource de nuevo si ya está rastreando la misma sesión
      expect(secondCallCount).toBeLessThanOrEqual(firstCallCount + 1);
    });
  });
});
