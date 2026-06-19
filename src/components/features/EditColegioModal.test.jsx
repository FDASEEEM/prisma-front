/**
 * EditColegioModal.test.jsx
 * Pruebas del modal de edición de colegio: carga inicial de datos, envío de la
 * actualización y manejo de errores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditColegioModal from './EditColegioModal';
import colegioService from '../../services/colegioService';

vi.mock('../ui', () => ({
  Modal: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
  Input: ({ label, error, ...props }) => <input aria-label={label} {...props} />,
  Button: ({ children, loading, variant, size, ...props }) => (
    <button {...props}>{children}</button>
  ),
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock('../../services/colegioService', () => ({
  default: { getById: vi.fn(), update: vi.fn() },
}));

const colegio = {
  nombre: 'Colegio Andes',
  direccion: 'Calle 1',
  telefono: '123456789',
  plan: 'standard',
  fechaTermino: '2025-12-31T00:00:00.000Z',
  activo: true,
};

describe('EditColegioModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga los datos del colegio al abrir y los muestra en el formulario', async () => {
    colegioService.getById.mockResolvedValue(colegio);
    render(<EditColegioModal isOpen colegioId="c1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByLabelText(/Nombre del Colegio/i)).toHaveValue('Colegio Andes'),
    );
    expect(colegioService.getById).toHaveBeenCalledWith('c1');
    expect(screen.getByLabelText(/Fecha Término/i)).toHaveValue('2025-12-31');
  });

  it('envía la actualización y dispara onSuccess + onClose', async () => {
    colegioService.getById.mockResolvedValue(colegio);
    colegioService.update.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<EditColegioModal isOpen colegioId="c1" onClose={onClose} onSuccess={onSuccess} />);

    await waitFor(() =>
      expect(screen.getByLabelText(/Nombre del Colegio/i)).toHaveValue('Colegio Andes'),
    );

    fireEvent.change(screen.getByLabelText(/Nombre del Colegio/i), {
      target: { name: 'nombre', value: 'Colegio Andes 2' },
    });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'));

    await waitFor(() => expect(colegioService.update).toHaveBeenCalled());
    expect(colegioService.update).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ nombre: 'Colegio Andes 2' }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra error si falla la carga del colegio', async () => {
    colegioService.getById.mockRejectedValue(new Error('No encontrado'));
    render(<EditColegioModal isOpen colegioId="c1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('No encontrado')).toBeInTheDocument());
  });

  it('muestra error si falla la actualización', async () => {
    colegioService.getById.mockResolvedValue(colegio);
    colegioService.update.mockRejectedValue(new Error('Error al guardar'));
    render(<EditColegioModal isOpen colegioId="c1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByLabelText(/Nombre del Colegio/i)).toHaveValue('Colegio Andes'),
    );
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'));

    await waitFor(() => expect(screen.getByText('Error al guardar')).toBeInTheDocument());
  });
});
