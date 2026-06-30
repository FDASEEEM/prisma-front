/**
 * FeedbackWidget.test.jsx
 * Pruebas del widget de feedback de la rúbrica generada.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackWidget from './FeedbackWidget';
import chatService from '../../services/chatService';

vi.mock('../../services/chatService', () => ({
  default: { submitFeedback: vi.fn() },
}));

describe('FeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra la pregunta y el botón de enviar deshabilitado al inicio', () => {
    render(<FeedbackWidget sessionId="s1" />);
    expect(screen.getByText('¿La rúbrica generada es útil?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar feedback/i })).toBeDisabled();
  });

  it('habilita el envío tras elegir una valoración', () => {
    render(<FeedbackWidget sessionId="s1" />);
    fireEvent.click(screen.getByText('👍'));
    expect(screen.getByRole('button', { name: /Enviar feedback/i })).toBeEnabled();
  });

  it('envía feedback aprobado con el comentario y muestra confirmación', async () => {
    chatService.submitFeedback.mockResolvedValue({});
    render(<FeedbackWidget sessionId="s1" />);

    fireEvent.click(screen.getByText('👍'));
    fireEvent.change(screen.getByPlaceholderText(/Comentario opcional/i), {
      target: { value: 'Muy útil' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar feedback/i }));

    await waitFor(() =>
      expect(screen.getByText('Feedback enviado')).toBeInTheDocument(),
    );
    expect(chatService.submitFeedback).toHaveBeenCalledWith('s1', {
      approved: true,
      comment: 'Muy útil',
    });
  });

  it('envía feedback rechazado (approved=false)', async () => {
    chatService.submitFeedback.mockResolvedValue({});
    render(<FeedbackWidget sessionId="s2" />);

    fireEvent.click(screen.getByText('👎'));
    fireEvent.click(screen.getByRole('button', { name: /Enviar feedback/i }));

    await waitFor(() => expect(chatService.submitFeedback).toHaveBeenCalled());
    expect(chatService.submitFeedback).toHaveBeenCalledWith('s2', {
      approved: false,
      comment: '',
    });
  });

  it('muestra el mensaje de error si el envío falla y no confirma', async () => {
    chatService.submitFeedback.mockRejectedValue(new Error('Falló el envío'));
    render(<FeedbackWidget sessionId="s1" />);

    fireEvent.click(screen.getByText('👍'));
    fireEvent.click(screen.getByRole('button', { name: /Enviar feedback/i }));

    await waitFor(() =>
      expect(screen.getByText('Falló el envío')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Feedback enviado')).not.toBeInTheDocument();
  });
});
