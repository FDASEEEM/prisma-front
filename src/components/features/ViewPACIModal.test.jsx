/**
 * ViewPACIModal.test.jsx
 * Pruebas del modal de visualización (solo lectura) de un perfil PACI.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ViewPACIModal from './ViewPACIModal';
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
vi.mock('../ui/Badge', () => ({
  default: ({ children }) => <span data-testid="badge">{children}</span>,
}));

vi.mock('../../services/paciService', () => ({
  default: { getPACIById: vi.fn() },
}));

const paci = {
  isActive: true,
  createdAt: '2025-03-01T00:00:00.000Z',
  diagnostico: 'TEA',
  duracion: 'Semestre 1',
  fechaElaboracion: '2025-03-01T00:00:00.000Z',
  fechaRevision: '2025-06-01T00:00:00.000Z',
  validFrom: '2025-03-01T00:00:00.000Z',
  validUntil: '2025-07-31T00:00:00.000Z',
  student: {
    id: 'st1',
    nombreCompleto: 'Juan Pérez',
    cursoActual: '5° Básico',
    fechaNacimiento: '2010-05-01T00:00:00.000Z',
  },
};

describe('ViewPACIModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(<ViewPACIModal isOpen={false} paciId="p1" onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el spinner mientras carga', async () => {
    let resolve;
    paciService.getPACIById.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { container } = render(<ViewPACIModal isOpen paciId="p1" onClose={vi.fn()} />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    resolve(paci);
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
  });

  it('renderiza los datos del PACI y del estudiante', async () => {
    paciService.getPACIById.mockResolvedValue(paci);
    render(<ViewPACIModal isOpen paciId="p1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
    expect(screen.getByText('5° Básico')).toBeInTheDocument();
    expect(screen.getByText('TEA')).toBeInTheDocument();
    expect(screen.getByTestId('badge')).toHaveTextContent('Activo');
  });

  it('marca como Histórico un PACI inactivo', async () => {
    paciService.getPACIById.mockResolvedValue({ ...paci, isActive: false });
    render(<ViewPACIModal isOpen paciId="p1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByTestId('badge')).toHaveTextContent('Histórico'));
  });

  it('muestra error cuando falla la carga', async () => {
    paciService.getPACIById.mockRejectedValue(new Error('No se pudo cargar'));
    render(<ViewPACIModal isOpen paciId="p1" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('No se pudo cargar')).toBeInTheDocument());
  });
});
