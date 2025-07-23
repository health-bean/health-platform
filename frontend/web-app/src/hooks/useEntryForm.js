import { useState } from 'react';
import { ENTRY_TYPES, SEVERITY_LEVELS } from '../../../shared/constants/constants';

export const useEntryForm = () => {
  const [formData, setFormData] = useState({
    time: new Date().toTimeString().slice(0, 5),
    type: ENTRY_TYPES.FOOD,
    selectedItems: [], // New unified structure
    // Legacy support
    selectedFoods: [],
    customText: '',
    severity: SEVERITY_LEVELS.DEFAULT
  });

  const updateFormData = (updates) => {
    // Clear selectedItems when type changes to prevent cross-contamination
    if (updates.type && updates.type !== formData.type) {
      setFormData(prev => ({ 
        ...prev, 
        ...updates, 
        selectedItems: [] // Clear items when type changes
      }));
    } else {
      setFormData(prev => ({ ...prev, ...updates }));
    }
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
      selectedItems: [], // New unified structure
      selectedFoods: [], // Legacy support
      customText: '',
      severity: SEVERITY_LEVELS.DEFAULT
    });
  };

  const buildEntryData = (selectedDate) => {
    // Use new selectedItems structure if available, fallback to legacy selectedFoods
    const items = formData.selectedItems && formData.selectedItems.length > 0 
      ? formData.selectedItems 
      : formData.selectedFoods;
    
    // Create display content from items
    const displayContent = items.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item.name) return item.name;
      return String(item);
    }).join(', ') + (formData.customText.trim() ? ', ' + formData.customText.trim() : '');
    
    return {
      entryDate: selectedDate,
      entryTime: formData.time,
      entryType: formData.type,
      selectedItems: items, // New unified structure for backend
      // Legacy support
      content: displayContent,
      selectedFoods: formData.selectedFoods, // Keep for backward compatibility
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