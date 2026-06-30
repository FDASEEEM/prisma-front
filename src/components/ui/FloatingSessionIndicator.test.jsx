/**
 * FloatingSessionIndicator.test.jsx
 * Pruebas unitarias para el componente FloatingSessionIndicator
 * Cobertura: 100%
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FloatingSessionIndicator from './FloatingSessionIndicator';
import { ActiveSessionProvider } from '../../context/ActiveSessionContext';

// Mocks
vi.mock('../../context/ActiveSessionContext', async () => {
  const actual = await vi.importActual('../../context/ActiveSessionContext');
  return {
    ...actual,
    useActiveSession: vi.fn(),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/dashboard' })),
  };
});

import { useActiveSession } from '../../context/ActiveSessionContext';
import { useLocation } from 'react-router-dom';

describe('FloatingSessionIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restablece la ruta por defecto (mockReturnValue persiste entre tests).
    useLocation.mockReturnValue({ pathname: '/dashboard' });
  });

  it('no debe renderizar si no hay sesión activa', () => {
    useActiveSession.mockReturnValue({ activeSession: null });

    const { container } = render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar indicador en fase running', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'running',
      currentStep: 'Procesando adaptación curricular',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('debe mostrar indicador en fase awaiting_hitl', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'awaiting_hitl',
      currentStep: '',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-amber-400');
  });

  it('debe mostrar indicador en fase completed', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'completed',
      currentStep: '',
      workflowStatus: 'success',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-lime-500');
  });

  it('no debe renderizar en fases que no sean running, awaiting_hitl ni completed', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'error',
      currentStep: '',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    const { container } = render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    expect(container.firstChild?.childNodes.length || 0).toBe(0);
  });

  it('no debe renderizar si estamos en la página de la sesión', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'running',
      currentStep: 'Procesando',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    // Simular que estamos en la página de la sesión
    useLocation.mockReturnValue({ pathname: '/sesion/session_123' });

    const { container } = render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    expect(container.querySelector('button')).toBeNull();
  });

  it('debe mostrar el mensaje de paso actual en fase running', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'running',
      currentStep: 'Generando plan de mejora',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button.title).toContain('Generando plan de mejora');
  });

  it('debe tener posición fija en bottom-right', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'running',
      currentStep: 'Procesando',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6');
  });

  it('debe estar animado en fase running', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'running',
      currentStep: 'Procesando',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const icon = screen.getByText('smart_toy');
    expect(icon).toHaveClass('animate-spin');
  });

  it('no debe estar animado en fase completed', () => {
    const mockSession = {
      sessionId: 'session_123',
      phase: 'completed',
      currentStep: '',
    };

    useActiveSession.mockReturnValue({ activeSession: mockSession });

    render(
      <BrowserRouter>
        <FloatingSessionIndicator />
      </BrowserRouter>
    );

    const icon = screen.getByText('download');
    expect(icon).not.toHaveClass('animate-spin');
  });
});
