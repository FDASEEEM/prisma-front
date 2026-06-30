/**
 * localStorage Utilities
 * Funciones auxiliares para manejo de localStorage
 */

const TOKEN_KEY = 'prisma_access_token';
const REFRESH_TOKEN_KEY = 'prisma_refresh_token';
const USER_KEY = 'prisma_user';

export const storageUtils = {
  // Tokens
  saveToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  saveRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),

  // User
  saveUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem(USER_KEY),

  // Session
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

export default storageUtils;
