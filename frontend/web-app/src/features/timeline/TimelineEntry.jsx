import React from 'react';
import { getEntryIcon, getEntryColor } from '../../../../shared/utils/entryHelpers';

const TimelineEntry = ({ entry }) => {
  // Helper function to render content properly
  const renderContent = (content) => {
    // Handle null/undefined
    if (!content) return 'No content';
    
    // Handle strings
    if (typeof content === 'string') {
      return content;
    }
    
    // Handle numbers
    if (typeof content === 'number') {
      return content.toString();
    }
    
    if (typeof content === 'object' && content !== null) {
      // Handle structured content with name
      if (content.name) {
        const parts = [content.name];
        
        if (content.amount) parts.push(`(${content.amount})`);
        if (content.dosage) parts.push(`- ${content.dosage}`);
        if (content.timing) parts.push(`${content.timing}`);
        if (content.severity) parts.push(`Severity: ${content.severity}/10`);
        if (content.notes) parts.push(`Notes: ${content.notes}`);
        
        return parts.join(' ');
      }
      
      // Handle other common object structures
      if (content.description) {
        return content.description;
      }
      
      if (content.value) {
        return String(content.value);
      }
      
      if (content.text) {
        return content.text;
      }
      
      // Handle arrays
      if (Array.isArray(content)) {
        return content.map(item => 
          typeof item === 'string' ? item : 
          typeof item === 'object' && item.name ? item.name :
          String(item)
        ).join(', ');
      }
      
      // For objects without standard properties, show key-value pairs
      const entries = Object.entries(content);
      if (entries.length > 0) {
        return entries
          .filter(([key, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(', ');
      }
      
      // Last resort - but avoid [object Object]
      return 'Content available';
    }
    
    // Final fallback
    return String(content);
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${getEntryColor(entry.entry_type)}`}>
      <div className="flex items-start space-x-3">
        <div className="text-lg">{getEntryIcon(entry.entry_type)}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-sm">{entry.entry_time}</span>
            <span className="text-xs bg-white px-2 py-1 rounded-full capitalize">
              {entry.entry_type}
            </span>
            {entry.protocol_compliant === false && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                ⚠️ Protocol Alert
              </span>
            )}
            {entry.protocol_compliant === true && (
              <span className="text-xs bg-success-100 text-success-800 px-2 py-1 rounded-full">
                ✅ Compliant
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">{renderContent(entry.content)}</p>
          {entry.severity && (
            <div className="text-xs text-gray-500 mt-1">
              Severity: {entry.severity}/10
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineEntry;