/**
 * CreateColegioModal.test.jsx
 * Pruebas del modal de creación de colegio: validaciones (RUT, email, nombre),
 * envío exitoso y manejo de error del servicio. Los componentes de `../ui` se
 * mockean con stand-ins simples para aislar la lógica del formulario.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateColegioModal from './CreateColegioModal';
import colegioService from '../../services/colegioService';

vi.mock('../ui', () => ({
  Modal: ({ isOpen, title, children }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
  Input: ({ label, error, ...props }) => (
    <div>
      <input aria-label={label} {...props} />
      {error ? <span role="alert">{error}</span> : null}
    </div>
  ),
  Button: ({ children, loading, variant, size, ...props }) => (
    <button {...props}>{children}</button>
  ),
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock('../../services/colegioService', () => ({
  default: { create: vi.fn() },
}));

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText(/Nombre del Colegio/i), {
    target: { name: 'nombre', value: 'Colegio Test' },
  });
  fireEvent.change(screen.getByLabelText(/^RUT/i), {
    target: { name: 'rut', value: '11.111.111-1' },
  });
  fireEvent.change(screen.getByLabelText(/Dirección/i), {
    target: { name: 'direccion', value: 'Av Siempre Viva 123' },
  });
  fireEvent.change(screen.getByLabelText(/^Email \*/i), {
    target: { name: 'email', value: 'colegio@test.cl' },
  });
  fireEvent.change(screen.getByLabelText(/Nombre del Admin/i), {
    target: { name: 'adminNombre', value: 'Admin Test' },
  });
  fireEvent.change(screen.getByLabelText(/Email del Admin/i), {
    target: { name: 'adminEmail', value: 'admin@test.cl' },
  });
  fireEvent.change(screen.getByLabelText(/Contraseña del Admin/i), {
    target: { name: 'adminPassword', value: '12345678' },
  });
};

const submitForm = () => {
  fireEvent.submit(screen.getByRole('dialog').querySelector('form'));
};

describe('CreateColegioModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <CreateColegioModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el formulario cuando está abierto', () => {
    render(<CreateColegioModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/Nombre del Colegio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Colegio/i })).toBeInTheDocument();
  });

  it('muestra errores de validación y no llama al servicio con datos vacíos', async () => {
    render(<CreateColegioModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    submitForm();

    await waitFor(() =>
      expect(screen.getByText(/El nombre del colegio es requerido/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/El RUT es requerido/i)).toBeInTheDocument();
    expect(colegioService.create).not.toHaveBeenCalled();
  });

  it('rechaza un RUT con dígito verificador inválido', async () => {
    render(<CreateColegioModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/^RUT/i), {
      target: { name: 'rut', value: '11.111.111-2' },
    });
    submitForm();

    await waitFor(() =>
      expect(screen.getByText(/dígito verificador incorrecto/i)).toBeInTheDocument(),
    );
    expect(colegioService.create).not.toHaveBeenCalled();
  });

  it('crea el colegio y dispara onSuccess + onClose con datos válidos', async () => {
    colegioService.create.mockResolvedValue({ colegio: { id: 'c1' } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<CreateColegioModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    fillValidForm();
    submitForm();

    await waitFor(() => expect(colegioService.create).toHaveBeenCalled());
    expect(colegioService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Colegio Test',
        rut: '11.111.111-1',
        email: 'colegio@test.cl',
        adminEmail: 'admin@test.cl',
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra el mensaje de error del servidor cuando falla la creación', async () => {
    colegioService.create.mockRejectedValue(new Error('RUT ya registrado'));
    render(<CreateColegioModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);

    fillValidForm();
    submitForm();

    await waitFor(() =>
      expect(screen.getByText('RUT ya registrado')).toBeInTheDocument(),
    );
  });
});
