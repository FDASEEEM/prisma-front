/**
 * stripMetadatos.test.js
 * Pruebas unitarias para el util que elimina el bloque ---METADATOS---...---FIN_METADATOS---
 * antes de mostrar el texto del agente al profesor.
 */

import { describe, it, expect } from 'vitest';
import stripMetadatos from './stripMetadatos';

describe('stripMetadatos', () => {
  it('elimina el bloque METADATOS y conserva el resto del texto', () => {
    const input = [
      '## 1. Diagnóstico y NEE',
      'TEA nivel 1, requiere apoyo visual.',
      '',
      '---METADATOS---',
      'PUEDE_CONTINUAR: SI',
      'FECHA_INFORME: 2025-01-10',
      '---FIN_METADATOS---',
    ].join('\n');

    const result = stripMetadatos(input);

    expect(result).toContain('## 1. Diagnóstico y NEE');
    expect(result).toContain('TEA nivel 1, requiere apoyo visual.');
    expect(result).not.toContain('METADATOS');
    expect(result).not.toContain('PUEDE_CONTINUAR');
    expect(result).not.toContain('FECHA_INFORME');
  });

  it('devuelve el texto intacto (trim) cuando no hay bloque METADATOS', () => {
    const input = '## Planificación\n- Punto uno\n- Punto dos';
    expect(stripMetadatos(input)).toBe('## Planificación\n- Punto uno\n- Punto dos');
  });

  it('es tolerante a espacios alrededor de los marcadores', () => {
    const input = 'Contenido visible\n\n  ---METADATOS---  \nFOO: BAR\n  ---FIN_METADATOS---  ';
    const result = stripMetadatos(input);
    expect(result).toBe('Contenido visible');
    expect(result).not.toContain('FOO');
  });

  it('maneja entrada vacía o no-string sin romper', () => {
    expect(stripMetadatos('')).toBe('');
    expect(stripMetadatos(null)).toBe('');
    expect(stripMetadatos(undefined)).toBe('');
  });
});
