import React from 'react';

const QuickChecks = ({ type, preferences, onQuickSelect }) => {
  const getQuickItems = () => {
    if (!preferences) return [];
    
    switch(type) {
      case 'supplement': return preferences.quick_supplements || [];
      case 'medication': return preferences.quick_medications || [];
      case 'food': return preferences.quick_foods || [];
      case 'symptom': return preferences.quick_symptoms || [];
      case 'detox': return preferences.quick_detox || [];
      default: return [];
    }
  };

  const quickItems = getQuickItems();

  if (quickItems.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">⚡ Quick Checks</h4>
      <div className="flex flex-wrap gap-2">
        {quickItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onQuickSelect(item.name)}
            className={`px-3 py-1.5 text-sm rounded-full hover:opacity-80 transition-colors ${
              type === 'detox' 
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickChecks;