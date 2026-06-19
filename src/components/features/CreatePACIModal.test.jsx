/**
 * CreatePACIModal.test.jsx
 * Pruebas del modal de creación de PACI: cálculo del rango de vigencia según el
 * semestre, envío (crea estudiante y luego PACI) y manejo de error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreatePACIModal from './CreatePACIModal';
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

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', colegioId: 'col1' } }),
}));

vi.mock('../../services/paciService', () => ({
  default: { createStudent: vi.fn(), createPACI: vi.fn() },
}));

const getForm = () => screen.getByRole('dialog').querySelector('form');

describe('CreatePACIModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los datos del estudiante y del PACI cuando está abierto', () => {
    render(<CreatePACIModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText('Datos del Estudiante')).toBeInTheDocument();
    expect(screen.getByText('Datos del PACI')).toBeInTheDocument();
  });

  it('calcula el rango de vigencia para Semestre 1 según la fecha de elaboración', () => {
    render(<CreatePACIModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Fecha Elaboración/i), {
      target: { name: 'fechaElaboracion', value: '2025-04-10' },
    });
    fireEvent.change(screen.getByDisplayValue('Selecciona un semestre'), {
      target: { name: 'duracion', value: 'Semestre 1' },
    });

    expect(screen.getByLabelText(/Válido Desde/i)).toHaveValue('2025-03-01');
    expect(screen.getByLabelText(/Válido Hasta/i)).toHaveValue('2025-07-31');
  });

  it('crea estudiante y PACI, luego dispara onSuccess + onClose', async () => {
    paciService.createStudent.mockResolvedValue({ id: 'st1' });
    paciService.createPACI.mockResolvedValue({ id: 'paci1' });
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<CreatePACIModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), {
      target: { name: 'nombreCompleto', value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de Nacimiento/i), {
      target: { name: 'fechaNacimiento', value: '2010-05-01' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha Elaboración/i), {
      target: { name: 'fechaElaboracion', value: '2025-04-10' },
    });

    fireEvent.submit(getForm());

    await waitFor(() => expect(paciService.createStudent).toHaveBeenCalled());
    expect(paciService.createStudent).toHaveBeenCalledWith(
      expect.objectContaining({ nombreCompleto: 'Juan Pérez', fechaNacimiento: '2010-05-01' }),
    );
    expect(paciService.createPACI).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 'st1' }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra el mensaje de error si la creación falla', async () => {
    paciService.createStudent.mockRejectedValue(new Error('Estudiante duplicado'));
    render(<CreatePACIModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.submit(getForm());

    await waitFor(() =>
      expect(screen.getByText('Estudiante duplicado')).toBeInTheDocument(),
    );
    expect(paciService.createPACI).not.toHaveBeenCalled();
  });
});
