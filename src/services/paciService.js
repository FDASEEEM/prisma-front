/**
 * PACI Service
 * Servicio para comunicación con el microservicio de perfiles PACI
 */

import api from './api';

const PACI_BASE_URL = process.env.REACT_APP_API_PERFIL_ALUMNO_URL || 'http://localhost:3000';

const paciApi = api.create({
  baseURL: PACI_BASE_URL,
});

/**
 * Obtener todos los perfiles PACI
 */
export const getAllPACIs = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.studentId) params.append('studentId', filters.studentId);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
  if (filters.curso) params.append('curso', filters.curso);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);

  const response = await paciApi.get(`/paci-profiles/filter?${params.toString()}`);
  return response.data;
};

/**
 * Obtener solo perfiles PACI activos
 */
export const getActivePACIs = async () => {
  const response = await paciApi.get('/paci-profiles/active');
  return response.data;
};

/**
 * Obtener solo perfiles PACI históricos
 */
export const getHistoricalPACIs = async () => {
  const response = await paciApi.get('/paci-profiles/historical');
  return response.data;
};

/**
 * Obtener perfiles PACI recientes
 */
export const getRecentPACIs = async (limit = 10) => {
  const response = await paciApi.get(`/paci-profiles/recent?limit=${limit}`);
  return response.data;
};

/**
 * Crear un nuevo perfil PACI (crea también el estudiante)
 */
export const createPACI = async (data) => {
  const response = await paciApi.post('/paci-profiles', data);
  return response.data;
};

/**
 * Crear un nuevo estudiante
 */
export const createStudent = async (data) => {
  const response = await paciApi.post('/students', data);
  return response.data;
};

/**
 * Actualizar un perfil PACI (archiva el anterior automáticamente)
 */
export const updatePACI = async (id, data) => {
  const response = await paciApi.patch(`/paci-profiles/${id}`, data);
  return response.data;
};

/**
 * Obtener un perfil PACI por ID
 */
export const getPACIById = async (id) => {
  const response = await paciApi.get(`/paci-profiles/${id}`);
  return response.data;
};

/**
 * Obtener perfiles PACI por ID de estudiante
 */
export const getPACIsByStudentId = async (studentId) => {
  const response = await paciApi.get(`/paci-profiles/student/${studentId}`);
  return response.data;
};

/**
 * Eliminar un perfil PACI
 */
export const deletePACI = async (id) => {
  const response = await paciApi.delete(`/paci-profiles/${id}`);
  return response.data;
};

export default {
  getAllPACIs,
  getActivePACIs,
  getHistoricalPACIs,
  getRecentPACIs,
  createPACI,
  createStudent,
  updatePACI,
  getPACIById,
  getPACIsByStudentId,
  deletePACI,
};
