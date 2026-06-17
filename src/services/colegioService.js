import bffApi from './bffApi';

const colegioService = {
  getAll: async (params) => {
    return await bffApi.getColegios(params);
  },

  getById: async (id) => {
    return await bffApi.getColegioById(id);
  },

  create: async (payload) => {
    return await bffApi.createColegio(payload);
  },

  update: async (id, payload) => {
    return await bffApi.updateColegio(id, payload);
  },

  deactivate: async (id) => {
    return await bffApi.deactivateColegio(id);
  },

  getStats: async (id) => {
    return await bffApi.getColegioStats(id);
  },

  getProfessors: async (id, params) => {
    return await bffApi.getColegioProfessors(id, params);
  },
};

export default colegioService;
