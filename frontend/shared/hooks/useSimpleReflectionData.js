// File: frontend/shared/hooks/useSimpleReflectionData.js
// Simple reflection data hook using clean API system

import { useState, useEffect } from 'react';
import { useJournalApi } from './useSimpleApi';
import safeLogger from '../utils/safeLogger';

const useSimpleReflectionData = (selectedDate, isAuthenticated = false) => {
  const [reflectionData, setReflectionData] = useState({
    bedtime: '',
    wake_time: '',
    sleep_quality: '',
    sleep_symptoms: [],
    energy_level: 5,
    mood_level: 5,
    physical_comfort: 5,
    personal_reflection: '',
    activity_level: '',
    meditation_practice: false,
    meditation_duration: 0,
    cycle_day: '',
    ovulation: false,
    stress_level: 5
  });

  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { getJournalEntry, saveJournalEntry } = useJournalApi();

  // Load reflection data for selected date
  useEffect(() => {
    let isCancelled = false;
    
    const loadReflectionData = async () => {
      if (!isAuthenticated || !selectedDate) {
        // Reset to defaults when not authenticated or no date
        setReflectionData({
          bedtime: '',
          wake_time: '',
          sleep_quality: '',
          sleep_symptoms: [],
          energy_level: 5,
          mood_level: 5,
          physical_comfort: 5,
          personal_reflection: '',
          activity_level: '',
          meditation_practice: false,
          meditation_duration: 0,
          cycle_day: '',
          ovulation: false,
          stress_level: 5
        });
        setHasUnsavedChanges(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getJournalEntry(selectedDate);
        
        if (!isCancelled) {
          if (response.entry && response.entry.reflection_data) {
            // Map API response from nested JSONB structure to component format
            const data = response.entry.reflection_data;
            setReflectionData({
              bedtime: data.sleep?.bedtime || '',
              wake_time: data.sleep?.wake_time || '',
              sleep_quality: data.sleep?.sleep_quality || '',
              sleep_symptoms: data.sleep?.sleep_symptoms || [],
              energy_level: data.wellness?.energy_level || 5,
              mood_level: data.wellness?.mood_level || 5,
              physical_comfort: data.wellness?.physical_comfort || 5,
              personal_reflection: data.notes?.personal_reflection || '',
              activity_level: data.activity?.activity_level || '',
              meditation_practice: data.meditation?.meditation_practice || false,
              meditation_duration: data.meditation?.meditation_duration || 0,
              cycle_day: data.cycle?.cycle_day || '',
              ovulation: data.cycle?.ovulation || false,
              stress_level: data.wellness?.stress_level || 5
            });
          } else {
            // No existing entry for this date, use defaults
            setReflectionData({
              bedtime: '',
              wake_time: '',
              sleep_quality: '',
              sleep_symptoms: [],
              energy_level: 5,
              mood_level: 5,
              physical_comfort: 5,
              personal_reflection: '',
              activity_level: '',
              meditation_practice: false,
              meditation_duration: 0,
              cycle_day: '',
              ovulation: false,
              stress_level: 5
            });
          }
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        if (!isCancelled) {
          safeLogger.error('Failed to load reflection data', { error: error.message });
          
          // Use defaults on error
          setReflectionData({
            bedtime: '',
            wake_time: '',
            sleep_quality: '',
            sleep_symptoms: [],
            energy_level: 5,
            mood_level: 5,
            physical_comfort: 5,
            personal_reflection: '',
            activity_level: '',
            meditation_practice: false,
            meditation_duration: 0,
            cycle_day: '',
            ovulation: false,
            stress_level: 5
          });
          setHasUnsavedChanges(false);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadReflectionData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, isAuthenticated, getJournalEntry]);

  const updateReflectionData = (updates) => {
    setReflectionData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const saveReflectionData = async () => {
    if (!isAuthenticated || !selectedDate) {
      safeLogger.error('Cannot save reflection data: not authenticated or no date selected');
      return false;
    }

    setLoading(true);
    try {
      // Map component data to API format (flat structure for backend processing)
      const apiData = {
        entry_date: selectedDate,
        bedtime: reflectionData.bedtime,
        wake_time: reflectionData.wake_time,
        sleep_quality: reflectionData.sleep_quality,
        energy_level: reflectionData.energy_level,
        mood_level: reflectionData.mood_level,
        physical_comfort: reflectionData.physical_comfort,
        personal_reflection: reflectionData.personal_reflection,
        activity_level: reflectionData.activity_level,
        stress_level: reflectionData.stress_level,
        meditation_practice: reflectionData.meditation_practice,
        meditation_duration: reflectionData.meditation_duration,
        cycle_day: reflectionData.cycle_day,
        ovulation: reflectionData.ovulation,
        sleep_symptoms: reflectionData.sleep_symptoms || []
      };

      // Save using clean API
      const response = await saveJournalEntry(selectedDate, apiData);
      
      if (response && response.message) {
        safeLogger.info('Reflection data saved successfully', { message: response.message });
        setHasUnsavedChanges(false);
        return true;
      } else {
        safeLogger.error('Unexpected API response', { response });
        return false;
      }
    } catch (error) {
      safeLogger.error('Failed to save reflection data', { error: error.message });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    reflectionData,
    updateReflectionData,
    saveReflectionData,
    loading,
    hasUnsavedChanges
  };
};

export default useSimpleReflectionData;
