import { api } from './api';

export const entityService = {
  async searchEntities(query?: string, entity_type?: string) {
    const res = await api.get('/entities', { params: { query, entity_type } });
    return res.data;
  },

  async getEntityProfile(entity_type: string, entity_id: string) {
    const res = await api.get(`/entities/${entity_type}/${entity_id}`);
    return res.data;
  },

  async resolveMatch(name: string, entity_type: string = 'PERSON') {
    const res = await api.post('/entities/resolve', null, { params: { name, entity_type } });
    return res.data;
  }
};
