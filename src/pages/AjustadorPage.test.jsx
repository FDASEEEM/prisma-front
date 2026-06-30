/**
 * AjustadorPage.test.jsx
 * Página placeholder del Ajustador IA.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AjustadorPage from './AjustadorPage';

vi.mock('../components', () => ({
  MainContainer: ({ children, title }) => (
    <div data-testid="main" data-title={title}>
      {children}
    </div>
  ),
  Card: ({ children }) => <div>{children}</div>,
}));

describe('AjustadorPage', () => {
  it('renderiza el encabezado del Ajustador IA', () => {
    render(<AjustadorPage />);
    expect(screen.getByRole('heading', { name: 'Ajustador IA' })).toBeInTheDocument();
    expect(screen.getByText(/Adapta tu contenido/i)).toBeInTheDocument();
  });
});
