/**
 * AyudaPage.test.jsx
 * Pruebas de la guía de uso: render de pasos y navegación entre ellos.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AyudaPage from './AyudaPage';

vi.mock('../components/layout/MainContainer', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe('AyudaPage', () => {
  it('muestra la introducción y el primer paso', () => {
    render(<AyudaPage />);
    expect(screen.getByText(/¿Cómo funciona P.R.I.S.M.A.?/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Inicia una nueva sesión/i })).toBeInTheDocument();
  });

  it('deshabilita "Anterior" en el primer paso', () => {
    render(<AyudaPage />);
    expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
  });

  it('avanza al siguiente paso con el botón Siguiente', () => {
    render(<AyudaPage />);
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(screen.getByRole('heading', { name: /Sube los documentos/i })).toBeInTheDocument();
  });

  it('llega al último paso y deshabilita "Siguiente"', () => {
    render(<AyudaPage />);
    const next = () => screen.getByRole('button', { name: /Siguiente/i });
    for (let i = 0; i < 5; i++) fireEvent.click(next());
    expect(
      screen.getByRole('heading', { name: /Descarga la rúbrica adaptada/i }),
    ).toBeInTheDocument();
    expect(next()).toBeDisabled();
  });
});
