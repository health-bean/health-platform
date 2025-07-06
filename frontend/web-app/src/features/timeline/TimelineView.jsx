import React from 'react';
import { Plus, Clock, Loader2 } from 'lucide-react';
import { Button } from '../../../../shared/components/ui';
import TimelineEntry from './TimelineEntry';
import AddEntryForm from './AddEntryForm';
import { getProtocolDisplayText } from '../../../../shared/utils/entryHelpers';

const TimelineView = ({ 
  entries, 
  loading,
  showAddEntry,
  onToggleAddEntry,
  formData,
  updateFormData,
  toggleSelectedFood,
  handleQuickSelect,
  onSubmitEntry,
  onCancelEntry,
  preferences,
  protocols,
  exposureTypes,
  detoxTypes
}) => {
  return (
    <div className="space-y-4">
      <Button
        variant="primary"
        size="lg"
        onClick={onToggleAddEntry}
        icon={Plus}
        className="w-full"
      >
        Add Entry
      </Button>

      {showAddEntry && (
        <AddEntryForm
          formData={formData}
          updateFormData={updateFormData}
          toggleSelectedFood={toggleSelectedFood}
          handleQuickSelect={handleQuickSelect}
          onSubmit={onSubmitEntry}
          onCancel={onCancelEntry}
          preferences={preferences}
          exposureTypes={exposureTypes}
          detoxTypes={detoxTypes}
        />
      )}

      {/* Timeline Entries */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
          <Clock size={18} />
          <span>Today's Timeline</span>
          {preferences.protocols.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {getProtocolDisplayText(preferences.protocols, protocols)}
            </span>
          )}
        </h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <Loader2 size={32} className="animate-spin mx-auto mb-2" />
            <p>Loading entries...</p>
          </div>
        ) : entries.length > 0 ? (
          entries.map((entry) => (
            <TimelineEntry key={entry.id} entry={entry} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No entries yet today</p>
            <p className="text-sm">Add your first entry to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;