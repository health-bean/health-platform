import { useState, useEffect } from 'react';
import { timelineService } from '../../../shared/services/timelineService';

export const useTimelineEntries = (selectedDate) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = async () => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await timelineService.getEntries(selectedDate);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to load timeline entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entryData) => {
    try {
      await timelineService.createEntry(entryData);
      await loadEntries(); // Refresh entries after adding
    } catch (err) {
      console.error('Failed to add entry:', err);
      setError(err.message);
      throw err;
    }
  };

  const hasCriticalInsights = () => {
    return entries.some(entry => entry.protocol_compliant === false);
  };

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  return {
    entries,
    loading,
    error,
    addEntry,
    hasCriticalInsights,
    refreshEntries: loadEntries
  };
};