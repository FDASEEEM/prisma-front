/**
 * api.test.js
 * Pruebas unitarias de la configuración de endpoints (constants/api).
 */

import { describe, it, expect } from 'vitest';
import {
  AUTH_ENDPOINTS,
  CHAT_ENDPOINTS,
  JOBS_ENDPOINTS,
  ADMIN_ENDPOINTS,
  SUPERADMIN_ENDPOINTS,
  API_URLS,
} from './api';

describe('constants/api', () => {
  it('expone los endpoints de autenticación', () => {
    expect(AUTH_ENDPOINTS.LOGIN).toContain('/api/auth/login');
    expect(AUTH_ENDPOINTS.REGISTER).toContain('/api/auth/register');
    expect(AUTH_ENDPOINTS.ME).toContain('/api/auth/me');
  });

  it('construye endpoints de chat con el sessionId', () => {
    expect(CHAT_ENDPOINTS.STREAM('abc')).toContain('/chat/abc/stream');
    expect(CHAT_ENDPOINTS.STATE('abc')).toContain('/chat/abc/state');
    expect(CHAT_ENDPOINTS.HITL('abc')).toContain('/chat/abc/hitl');
  });

  it('construye endpoints de jobs con el id', () => {
    expect(JOBS_ENDPOINTS.UPLOAD).toContain('/api/jobs/upload');
    expect(JOBS_ENDPOINTS.STATUS('job1')).toContain('/api/jobs/job1');
    expect(JOBS_ENDPOINTS.DOWNLOAD('job1')).toContain('/api/jobs/job1/download');
  });

  it('expone endpoints de admin y superadmin', () => {
    expect(ADMIN_ENDPOINTS.USERS).toContain('/api/admin/users');
    expect(ADMIN_ENDPOINTS.USER_ROLE('u1')).toContain('/api/admin/users/u1/role');
    expect(SUPERADMIN_ENDPOINTS.COLEGIO('c1')).toContain('/api/colegios/c1');
  });

  it('agrupa todo en API_URLS', () => {
    expect(API_URLS.AUTH).toBe(AUTH_ENDPOINTS);
    expect(API_URLS.JOBS).toBe(JOBS_ENDPOINTS);
    expect(API_URLS.SUPERADMIN).toBe(SUPERADMIN_ENDPOINTS);
  });
});
