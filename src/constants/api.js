/**
 * API Endpoints & URLs
 * Configuración centralizada para todos los endpoints de la aplicación
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const DOCS_API_URL = import.meta.env.VITE_DOCS_API_URL || 'http://localhost:3000';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3004';
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
  CANCEL: (sessionId) => `${CHAT_API_URL}/chat/${sessionId}/cancel`,
  DOWNLOAD: (sessionId) => `${CHAT_API_URL}/chat/${sessionId}/download`,
  HEALTH: `${CHAT_API_URL}/health`,
  FEEDBACK: `${CHAT_API_URL}/feedback/approval`,
};

export const JOBS_ENDPOINTS = {
  UPLOAD: `${DOCS_API_URL}/api/jobs/upload`,
  LIST: `${DOCS_API_URL}/api/jobs`,
  HISTORY: `${DOCS_API_URL}/api/jobs/history`,
  STATUS: (id) => `${DOCS_API_URL}/api/jobs/${id}`,
  DOWNLOAD: (id) => `${DOCS_API_URL}/api/jobs/${id}/download`,
};

export const ADMIN_ENDPOINTS = {
  SUMMARY: `${ADMIN_API_URL}/api/admin/dashboard/summary`,
  ME: `${ADMIN_API_URL}/api/admin/me`,
  TICKETS: `${ADMIN_API_URL}/api/admin/tickets`,
  TICKET: (id) => `${ADMIN_API_URL}/api/admin/tickets/${id}`,
  TICKETS_BY_REQUESTER: (requesterId) => `${ADMIN_API_URL}/api/admin/tickets/by-requester/${requesterId}`,
  RESOURCES: `${ADMIN_API_URL}/api/admin/resources`,
  RESOURCE: (id) => `${ADMIN_API_URL}/api/admin/resources/${id}`,
  ANNOUNCEMENTS: `${ADMIN_API_URL}/api/admin/announcements`,
  ANNOUNCEMENT: (id) => `${ADMIN_API_URL}/api/admin/announcements/${id}`,
  ANNOUNCEMENTS_ACTIVE: `${ADMIN_API_URL}/api/admin/announcements/active`,
  AUDIT_LOGS: `${ADMIN_API_URL}/api/admin/audit-logs`,
  PROFESSORS: `${ADMIN_API_URL}/api/admin/professors`,
  PROFESSOR: (id) => `${ADMIN_API_URL}/api/admin/professors/${id}`,
  SESSIONS_ACTIVE: `${ADMIN_API_URL}/api/admin/sessions/active`,
  SESSIONS_HISTORICAL: `${ADMIN_API_URL}/api/admin/sessions/historical`,
  SESSIONS_BLOCKED: `${ADMIN_API_URL}/api/admin/sessions/blocked`,
  SESSIONS_BY_USER: (userId) => `${ADMIN_API_URL}/api/admin/sessions/user/${userId}`,
  SESSION: (id) => `${ADMIN_API_URL}/api/admin/sessions`,
  SESSION_BLOCK: (id) => `${ADMIN_API_URL}/api/admin/sessions/${id}/block`,
  SESSION_UNBLOCK: (id) => `${ADMIN_API_URL}/api/admin/sessions/${id}/unblock`,
  SESSION_TERMINATE: (id) => `${ADMIN_API_URL}/api/admin/sessions/${id}/terminate`,
  NOTIFICATIONS: `${ADMIN_API_URL}/api/notifications`,
  NOTIFICATION_READ: (id) => `${ADMIN_API_URL}/api/notifications/${id}/read`,
};

export const SUPERADMIN_ENDPOINTS = {
  COLEGIOS: `${API_BASE_URL}/api/superadmin/colegios`,
  COLEGIO: (id) => `${API_BASE_URL}/api/superadmin/colegios/${id}`,
  COLEGIO_STATS: (id) => `${API_BASE_URL}/api/superadmin/colegios/${id}/stats`,
  COLEGIO_PROFESSORS: (id) => `${API_BASE_URL}/api/superadmin/colegios/${id}/professors`,
};

export const API_URLS = {
  AUTH: AUTH_ENDPOINTS,
  CHAT: CHAT_ENDPOINTS,
  JOBS: JOBS_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  SUPERADMIN: SUPERADMIN_ENDPOINTS,
};
