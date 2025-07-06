import React from 'react';
import { Button, Card, Input, Select, Textarea } from '../../../../shared/components/ui';
import SmartFoodSelector from '../../components/common/SmartFoodSelector';
import QuickChecks from '../../components/common/QuickChecks';
import { ENTRY_TYPES } from '../../../../shared/constants/constants';

const AddEntryForm = ({ 
  formData, 
  updateFormData, 
  toggleSelectedFood, 
  handleQuickSelect,
  onSubmit,
  onCancel,
  preferences,
  exposureTypes,
  detoxTypes
}) => {
  return (
    <Card variant="primary" className="space-y-4">
      <div className="flex space-x-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => updateFormData({ time: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <Select
            value={formData.type}
            onChange={(e) => updateFormData({ type: e.target.value })}
          >
            <option value={ENTRY_TYPES.FOOD}>Food</option>
            <option value={ENTRY_TYPES.SYMPTOM}>Symptom</option>
            <option value={ENTRY_TYPES.SUPPLEMENT}>Supplement</option>
            <option value={ENTRY_TYPES.MEDICATION}>Medication</option>
            <option value={ENTRY_TYPES.EXPOSURE}>Exposure</option>
            <option value={ENTRY_TYPES.DETOX}>Detox</option>
          </Select>
        </div>
      </div>

      <Card>
        {formData.type === ENTRY_TYPES.FOOD && (
          <div className="space-y-3">
            <QuickChecks 
              type="food" 
              preferences={preferences} 
              onQuickSelect={handleQuickSelect}
            />
            <SmartFoodSelector
              selectedItems={formData.selectedFoods}
              onToggleItem={toggleSelectedFood}
              selectedProtocols={preferences.protocols}
            />
          </div>
        )}
        
        {formData.type === ENTRY_TYPES.EXPOSURE && (
          <div className="space-y-3">
            <QuickChecks 
              type="exposure" 
              preferences={preferences} 
              onQuickSelect={handleQuickSelect}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exposure Type</label>
              <Select>
                <option value="">Select exposure type...</option>
                {Object.entries(
                  exposureTypes.reduce((acc, exposure) => {
                    if (!acc[exposure.category]) acc[exposure.category] = [];
                    acc[exposure.category].push(exposure);
                    return acc;
                  }, {})
                ).map(([category, exposures]) => (
                  <optgroup key={category} label={category}>
                    {exposures.map(exposure => (
                      <option key={exposure.id} value={exposure.id}>
                        {exposure.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
              <Input
                placeholder="Describe the exposure..."
                value={formData.customText}
                onChange={(e) => updateFormData({ customText: e.target.value })}
              />
            </div>
          </div>
        )}

        {formData.type === ENTRY_TYPES.DETOX && (
          <div className="space-y-3">
            <QuickChecks 
              type="detox" 
              preferences={preferences} 
              onQuickSelect={handleQuickSelect}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detox Activity</label>
              <Select focusColor="purple">
                <option value="">Select detox activity...</option>
                {Object.entries(
                  detoxTypes.reduce((acc, detox) => {
                    if (!acc[detox.category]) acc[detox.category] = [];
                    acc[detox.category].push(detox);
                    return acc;
                  }, {})
                ).map(([category, detoxes]) => (
                  <optgroup key={category} label={category}>
                    {detoxes.map(detox => (
                      <option key={detox.id} value={detox.id}>
                        {detox.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <Input
                type="number"
                placeholder="e.g., 20"
                focusColor="purple"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Input
                placeholder="Additional details..."
                value={formData.customText}
                onChange={(e) => updateFormData({ customText: e.target.value })}
                focusColor="purple"
              />
            </div>
          </div>
        )}
        
        {[ENTRY_TYPES.SYMPTOM, ENTRY_TYPES.SUPPLEMENT, ENTRY_TYPES.MEDICATION].includes(formData.type) && (
          <div className="space-y-3">
            <QuickChecks 
              type={formData.type} 
              preferences={preferences} 
              onQuickSelect={handleQuickSelect}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
              <Input
                placeholder={`Enter ${formData.type} details...`}
                value={formData.customText}
                onChange={(e) => updateFormData({ customText: e.target.value })}
              />
            </div>
            {formData.type === ENTRY_TYPES.SYMPTOM && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity: {formData.severity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.severity}
                  onChange={(e) => updateFormData({ severity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex space-x-2">
        <Button variant="success" onClick={onSubmit} className="flex-1">
          Add Entry
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default AddEntryForm;