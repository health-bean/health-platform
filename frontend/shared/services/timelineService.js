import { apiClient } from './api';

export const timelineService = {
  async getEntries(date) {
    const response = await apiClient.get(`/api/v1/timeline/entries?date=${date}`);
    return response;
  },

  async createEntry(entryData) {
    const response = await apiClient.post('/api/v1/timeline/entries', entryData);
    return response;
  }
};