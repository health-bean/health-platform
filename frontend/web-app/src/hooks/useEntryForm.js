import { useState } from 'react';
import { ENTRY_TYPES, SEVERITY_LEVELS } from '../../../shared/constants/constants';

export const useEntryForm = () => {
  const [formData, setFormData] = useState({
    time: new Date().toTimeString().slice(0, 5),
    type: ENTRY_TYPES.FOOD,
    selectedFoods: [],
    customText: '',
    severity: SEVERITY_LEVELS.DEFAULT
  });

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleSelectedFood = (food) => {
    const isSelected = formData.selectedFoods.includes(food);
    updateFormData({
      selectedFoods: isSelected 
        ? formData.selectedFoods.filter(f => f !== food)
        : [...formData.selectedFoods, food]
    });
  };

  const handleQuickSelect = (itemName) => {
    updateFormData({
      customText: formData.customText ? `${formData.customText}, ${itemName}` : itemName
    });
  };

  const resetForm = () => {
    setFormData({
      time: new Date().toTimeString().slice(0, 5),
      type: ENTRY_TYPES.FOOD,
      selectedFoods: [],
      customText: '',
      severity: SEVERITY_LEVELS.DEFAULT
    });
  };

  const buildEntryData = (selectedDate) => {
    const allItems = [...formData.selectedFoods];
    if (formData.customText.trim()) {
      allItems.push(formData.customText.trim());
    }
    
    return {
      entryDate: selectedDate,
      entryTime: formData.time,
      entryType: formData.type,
      content: allItems.join(', '),
      selectedFoods: formData.selectedFoods,
      severity: formData.type === ENTRY_TYPES.SYMPTOM ? formData.severity : null
    };
  };

  return {
    formData,
    updateFormData,
    toggleSelectedFood,
    handleQuickSelect,
    resetForm,
    buildEntryData
  };
};