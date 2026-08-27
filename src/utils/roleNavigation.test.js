/**
 * roleNavigation.test.js
 * Pruebas del mapeo rol -> ruta inicial.
 */

import { describe, it, expect } from 'vitest';
import { getHomePathForRole } from './roleNavigation';

describe('getHomePathForRole', () => {
  it('mapea SUPERADMIN a /colegios', () => {
    expect(getHomePathForRole('SUPERADMIN')).toBe('/colegios');
  });

  it('mapea ADMIN a /admin', () => {
    expect(getHomePathForRole('ADMIN')).toBe('/admin');
  });

  it('mapea TEACHER a /dashboard', () => {
    expect(getHomePathForRole('TEACHER')).toBe('/dashboard');
  });

  it('mapea roles desconocidos o ausentes a /dashboard', () => {
    expect(getHomePathForRole(undefined)).toBe('/dashboard');
    expect(getHomePathForRole('OTRO')).toBe('/dashboard');
  });
});