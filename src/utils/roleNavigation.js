/**
 * roleNavigation.js
 * Utilidad para mapear un rol de usuario a la ruta inicial de la app.
 */

export const getHomePathForRole = (role) => {
  if (role === 'SUPERADMIN') return '/colegios';
  if (role === 'ADMIN') return '/admin';
  return '/dashboard';
};