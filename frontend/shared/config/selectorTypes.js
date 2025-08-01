/**
 * UNIFIED SELECTOR TYPE CONFIGURATION
 * Centralized configuration for all selector types across the application
 * Provides consistent UI, icons, colors, and behavior
 */

import { AlertCircle, Pill, Droplets, Apple, Leaf, Activity } from 'lucide-react';

/**
 * Unified selector type definitions
 * Each type has consistent structure for UI, API, and behavior
 */
export const SELECTOR_TYPES = {
  food: {
    // UI Configuration
    label: 'Food',
    labelPlural: 'Foods',
    placeholder: 'Add your foods...',
    emptyState: 'Start typing to add foods',
    searchPlaceholder: 'Search foods...',
    
    // Visual Design
    icon: Apple,
    iconEmoji: '🍎',
    color: 'blue',
    colorClass: 'text-blue-500',
    bgColorClass: 'bg-blue-50',
    borderColorClass: 'border-blue-200',
    
    // API Configuration
    endpoint: '/api/v1/foods/search',
    responseKey: 'foods',
    
    // Behavior
    supportsProtocol: true,
    supportsHistory: true,
    enableCache: true,
    debounceMs: 300
  },
  
  symptom: {
    // UI Configuration
    label: 'Symptom',
    labelPlural: 'Symptoms',
    placeholder: 'Add your symptoms...',
    emptyState: 'Start typing to add symptoms',
    searchPlaceholder: 'Search symptoms...',
    
    // Visual Design
    icon: AlertCircle,
    iconEmoji: '🤒',
    color: 'orange',
    colorClass: 'text-orange-500',
    bgColorClass: 'bg-orange-50',
    borderColorClass: 'border-orange-200',
    
    // API Configuration
    endpoint: '/api/v1/symptoms/search',
    responseKey: 'symptoms',
    
    // Behavior
    supportsProtocol: false,
    supportsHistory: true,
    enableCache: true,
    debounceMs: 300
  },
  
  supplement: {
    // UI Configuration
    label: 'Supplement',
    labelPlural: 'Supplements',
    placeholder: 'Add your supplements...',
    emptyState: 'Start typing to add supplements',
    searchPlaceholder: 'Search supplements...',
    
    // Visual Design
    icon: Pill,
    iconEmoji: '💊',
    color: 'green',
    colorClass: 'text-green-500',
    bgColorClass: 'bg-green-50',
    borderColorClass: 'border-green-200',
    
    // API Configuration
    endpoint: '/api/v1/supplements/search',
    responseKey: 'supplements',
    
    // Behavior
    supportsProtocol: false,
    supportsHistory: true,
    enableCache: true,
    debounceMs: 300
  },
  
  medication: {
    // UI Configuration
    label: 'Medication',
    labelPlural: 'Medications',
    placeholder: 'Add your medications...',
    emptyState: 'Start typing to add medications',
    searchPlaceholder: 'Search medications...',
    
    // Visual Design
    icon: Pill,
    iconEmoji: '💉',
    color: 'red',
    colorClass: 'text-red-500',
    bgColorClass: 'bg-red-50',
    borderColorClass: 'border-red-200',
    
    // API Configuration
    endpoint: '/api/v1/medications/search',
    responseKey: 'medications',
    
    // Behavior
    supportsProtocol: false,
    supportsHistory: true,
    enableCache: true,
    debounceMs: 300
  },
  
  exposure: {
    // UI Configuration
    label: 'Exposure',
    labelPlural: 'Environmental Exposures',
    placeholder: 'Add your exposures...',
    emptyState: 'Start typing to add environmental exposures',
    searchPlaceholder: 'Search exposures...',
    
    // Visual Design
    icon: Leaf,
    iconEmoji: '🌿',
    color: 'yellow',
    colorClass: 'text-yellow-600',
    bgColorClass: 'bg-yellow-50',
    borderColorClass: 'border-yellow-200',
    
    // API Configuration
    endpoint: '/api/v1/exposures/search',
    responseKey: 'exposures',
    
    // Behavior
    supportsProtocol: false,
    supportsHistory: true,
    enableCache: true,
    debounceMs: 300
  },
  
  detox: {
    // UI Configuration
    label: 'Detox Activity',
    labelPlural: 'Detox Activities',
    placeholder: 'Add your detox activities...',
    emptyState: 'Start typing to add detox activities',
    searchPlaceholder: 'Search detox activities...',
    
    // Visual Design
    icon: Droplets,
    iconEmoji: '💧',
    color: 'purple',
    colorClass: 'text-purple-500',
    bgColorClass: 'bg-purple-50',
    borderColorClass: 'border-purple-200',
    
    // API Configuration
    endpoint: '/api/v1/detox-types/search',
    responseKey: 'detox_types',
    
    // Behavior
    supportsProtocol: false,
    supportsHistory: true,
    enableCache: true,
    debounceMs: 300
  }
};

/**
 * Get configuration for a specific selector type
 * @param {string} type - The selector type
 * @returns {object} Configuration object for the type
 */
export const getSelectorConfig = (type) => {
  return SELECTOR_TYPES[type] || SELECTOR_TYPES.food;
};

/**
 * Get all available selector types
 * @returns {string[]} Array of selector type keys
 */
export const getAllSelectorTypes = () => {
  return Object.keys(SELECTOR_TYPES);
};

/**
 * Check if a selector type supports protocol filtering
 * @param {string} type - The selector type
 * @returns {boolean} Whether the type supports protocols
 */
export const supportsProtocol = (type) => {
  return getSelectorConfig(type).supportsProtocol;
};

export default SELECTOR_TYPES;