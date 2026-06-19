/**
 * UserAvatar.test.jsx
 * Pruebas unitarias del avatar de usuario (iniciales + color determinista).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserAvatar from './UserAvatar';

describe('UserAvatar', () => {
  it('genera las iniciales a partir de dos palabras del nombre', () => {
    render(<UserAvatar name="Ada Lovelace" />);
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('usa solo la inicial cuando hay una sola palabra', () => {
    render(<UserAvatar name="Ada" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('toma como máximo dos iniciales aunque haya más palabras', () => {
    render(<UserAvatar name="Ada Augusta Byron King" />);
    expect(screen.getByText('AA')).toBeInTheDocument();
  });

  it('usa el nombre por defecto "Usuario" cuando no se entrega', () => {
    render(<UserAvatar />);
    const avatar = screen.getByText('U');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('title', 'Usuario');
  });

  it('expone el nombre completo como title', () => {
    render(<UserAvatar name="Grace Hopper" />);
    expect(screen.getByText('GH')).toHaveAttribute('title', 'Grace Hopper');
  });

  it('aplica las clases de tamaño según el prop size', () => {
    const { rerender } = render(<UserAvatar name="Test User" size="sm" />);
    expect(screen.getByText('TU').className).toContain('w-8');

    rerender(<UserAvatar name="Test User" size="lg" />);
    expect(screen.getByText('TU').className).toContain('w-12');
  });

  it('asigna un color de fondo determinista para el mismo nombre', () => {
    const { container: c1 } = render(<UserAvatar name="Linus" />);
    const { container: c2 } = render(<UserAvatar name="Linus" />);
    const cls1 = c1.firstChild.className;
    const cls2 = c2.firstChild.className;
    expect(cls1).toBe(cls2);
    expect(cls1).toMatch(/bg-\w+-500/);
  });

  it('agrega className personalizado', () => {
    render(<UserAvatar name="Test" className="ring-2" />);
    expect(screen.getByText('T').className).toContain('ring-2');
  });
});
