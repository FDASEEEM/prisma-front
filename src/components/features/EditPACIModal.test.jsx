/**
 * EditPACIModal.test.jsx
 * Pruebas del modal de edición de PACI: carga del perfil, envío de cambios y
 * manejo de errores de carga/guardado.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditPACIModal from './EditPACIModal';
import paciService from '../../services/paciService';

vi.mock('../ui/Modal', () => ({
  default: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));
vi.mock('../ui/Button', () => ({
  default: ({ children, loading, variant, size, ...props }) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock('../ui/Input', () => ({
  default: ({ label, error, ...props }) => <input aria-label={label} {...props} />,
}));

vi.mock('../../services/paciService', () => ({
  default: { getPACIById: vi.fn(), updatePACI: vi.fn() },
}));

const paci = {
  diagnostico: 'TEA',
  fechaElaboracion: '2025-03-01T00:00:00.000Z',
  fechaRevision: '2025-06-01T00:00:00.000Z',
  duracion: 'Semestre 1',
  validFrom: '2025-03-01T00:00:00.000Z',
  validUntil: '2025-07-31T00:00:00.000Z',
  datosEstructurales: { resumen: 'x' },
};

describe('EditPACIModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga el perfil PACI al abrir y rellena el formulario', async () => {
    paciService.getPACIById.mockResolvedValue(paci);
    render(<EditPACIModal isOpen paciId="p1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByLabelText(/Diagnóstico/i)).toHaveValue('TEA'),
    );
    expect(paciService.getPACIById).toHaveBeenCalledWith('p1');
    expect(screen.getByLabelText(/Fecha Elaboración/i)).toHaveValue('2025-03-01');
  });

  it('guarda los cambios y dispara onSuccess + onClose', async () => {
    paciService.getPACIById.mockResolvedValue(paci);
    paciService.updatePACI.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<EditPACIModal isOpen paciId="p1" onClose={onClose} onSuccess={onSuccess} />);

    await waitFor(() => expect(screen.getByLabelText(/Diagnóstico/i)).toHaveValue('TEA'));

    fireEvent.change(screen.getByLabelText(/Diagnóstico/i), {
      target: { name: 'diagnostico', value: 'TDAH' },
    });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'));

    await waitFor(() => expect(paciService.updatePACI).toHaveBeenCalled());
    expect(paciService.updatePACI).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ diagnostico: 'TDAH' }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra error si falla la carga', async () => {
    paciService.getPACIById.mockRejectedValue(new Error('No existe'));
    render(<EditPACIModal isOpen paciId="p1" onClose={vi.fn()} onSuccess={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('No existe')).toBeInTheDocument());
  });

  it('muestra error si falla el guardado', async () => {
    paciService.getPACIById.mockResolvedValue(paci);
    paciService.updatePACI.mockRejectedValue(new Error('Error al actualizar'));
    render(<EditPACIModal isOpen paciId="p1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText(/Diagnóstico/i)).toHaveValue('TEA'));
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'));

    await waitFor(() => expect(screen.getByText('Error al actualizar')).toBeInTheDocument());
  });
});
