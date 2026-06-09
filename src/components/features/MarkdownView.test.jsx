/**
 * MarkdownView.test.jsx
 * Pruebas unitarias para el render de Markdown del contenido de los agentes.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownView from './MarkdownView';

describe('MarkdownView', () => {
  it('renderiza encabezados como elementos de título (no texto crudo con ##)', () => {
    const { container } = render(<MarkdownView>{'## Diagnóstico y NEE'}</MarkdownView>);
    const heading = screen.getByRole('heading', { name: /Diagnóstico y NEE/i });
    expect(heading).toBeInTheDocument();
    expect(container.textContent).not.toContain('##');
  });

  it('renderiza listas como elementos <li>', () => {
    const { container } = render(<MarkdownView>{'- Apoyo visual\n- Tiempos extendidos'}</MarkdownView>);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Apoyo visual');
  });

  it('renderiza negritas como <strong> sin asteriscos literales', () => {
    const { container } = render(<MarkdownView>{'Diagnóstico: **TEA nivel 1**'}</MarkdownView>);
    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong.textContent).toBe('TEA nivel 1');
    expect(container.textContent).not.toContain('**');
  });

  it('oculta el bloque METADATOS del contenido renderizado', () => {
    const md = 'Contenido visible\n\n---METADATOS---\nPUEDE_CONTINUAR: SI\n---FIN_METADATOS---';
    const { container } = render(<MarkdownView>{md}</MarkdownView>);
    expect(container.textContent).toContain('Contenido visible');
    expect(container.textContent).not.toContain('PUEDE_CONTINUAR');
    expect(container.textContent).not.toContain('METADATOS');
  });

  it('renderiza tablas GFM', () => {
    const md = '| Criterio | Nivel |\n| --- | --- |\n| Comprensión | Logrado |';
    const { container } = render(<MarkdownView>{md}</MarkdownView>);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.textContent).toContain('Comprensión');
  });
});
