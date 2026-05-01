/**
 * API Endpoints & URLs
 * Configuración centralizada para todos los endpoints de la aplicación
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const DOCS_API_URL = import.meta.env.VITE_DOCS_API_URL || 'http://localhost:3000';
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL ?? '';

export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  ME: `${API_BASE_URL}/api/auth/me`,
};

export const CHAT_ENDPOINTS = {
  START: `${CHAT_API_URL}/chat/start`,
  STATE: (sessionId) => `${CHAT_API_URL}/chat/${sessionId}/state`,
  STREAM: (sessionId) => `${CHAT_API_URL}/chat/${sessionId}/stream`,
  HITL: (sessionId) => `${CHAT_API_URL}/chat/${sessionId}/hitl`,
  DOWNLOAD: (sessionId) => `${CHAT_API_URL}/chat/${sessionId}/download`,
  HEALTH: `${CHAT_API_URL}/health`,
};

export const JOBS_ENDPOINTS = {
  UPLOAD: `${DOCS_API_URL}/api/jobs/upload`,
  LIST: `${DOCS_API_URL}/api/jobs`,
  STATUS: (id) => `${DOCS_API_URL}/api/jobs/${id}`,
  DOWNLOAD: (id) => `${DOCS_API_URL}/api/jobs/${id}/download`,
};

export const API_URLS = {
  AUTH: AUTH_ENDPOINTS,
  CHAT: CHAT_ENDPOINTS,
  JOBS: JOBS_ENDPOINTS,
};
