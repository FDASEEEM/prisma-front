import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoColegioNotice from './NoColegioNotice';

describe('NoColegioNotice', () => {
  it('muestra el título y el mensaje por defecto', () => {
    render(<NoColegioNotice />);
    expect(
      screen.getByText(/no está asignada a un colegio/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/contacta a un administrador/i)).toBeInTheDocument();
  });

  it('usa el mensaje provisto si viene del backend', () => {
    render(<NoColegioNotice message="Mensaje del servidor" />);
    expect(screen.getByText('Mensaje del servidor')).toBeInTheDocument();
  });
});
