import { API_BASE_URL } from '../constants/constants';

export const timelineService = {
  async getEntries(date) {
    const response = await fetch(`${API_BASE_URL}/api/v1/timeline/entries?date=${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch timeline entries');
    }
    return response.json();
  },

  async createEntry(entryData) {
    const response = await fetch(`${API_BASE_URL}/api/v1/timeline/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create timeline entry');
    }
    return response.json();
  }
};