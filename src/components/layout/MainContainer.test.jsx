/**
 * MainContainer.test.jsx
 * Pruebas del layout principal. SideNav y TopNav se mockean para aislar el
 * contenedor (su responsabilidad es componer el layout y pasar el título).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainContainer from './MainContainer';

vi.mock('./SideNav', () => ({ default: () => <nav data-testid="sidenav" /> }));
vi.mock('./TopNav', () => ({
  default: ({ title }) => <header data-testid="topnav">{title}</header>,
}));

describe('MainContainer', () => {
  it('renderiza SideNav, TopNav y el contenido hijo', () => {
    render(
      <MainContainer>
        <p>Contenido principal</p>
      </MainContainer>,
    );
    expect(screen.getByTestId('sidenav')).toBeInTheDocument();
    expect(screen.getByTestId('topnav')).toBeInTheDocument();
    expect(screen.getByText('Contenido principal')).toBeInTheDocument();
  });

  it('usa el título por defecto cuando no se entrega', () => {
    render(<MainContainer>x</MainContainer>);
    expect(screen.getByTestId('topnav')).toHaveTextContent('Aula Orgánica');
  });

  it('propaga el título recibido a TopNav', () => {
    render(<MainContainer title="Dashboard">x</MainContainer>);
    expect(screen.getByTestId('topnav')).toHaveTextContent('Dashboard');
  });
});
