/**
 * ForbiddenPage.test.jsx
 * Página 403: mensaje y enlace de retorno.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForbiddenPage from './ForbiddenPage';

describe('ForbiddenPage', () => {
  it('muestra el mensaje de acceso denegado y el enlace al inicio', () => {
    render(
      <MemoryRouter>
        <ForbiddenPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('403 Forbidden')).toBeInTheDocument();
    expect(screen.getByText(/No tienes permisos para entrar aquí/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Volver al inicio/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});
