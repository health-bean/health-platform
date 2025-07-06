import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert } from '../../../../shared/components/ui';
import { ACTIVITY_LEVELS, SLEEP_QUALITY_OPTIONS, CYCLE_DAY_OPTIONS } from '../../../../shared/constants/constants';

const ReflectionView = ({ 
  reflectionData, 
  updateReflectionData, 
  saveReflectionData,
  hasUnsavedChanges,
  loading,
  selectedDate
}) => {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CheckCircle2 size={20} className="text-green-600" />
          <h2 className="text-lg font-semibold">End of Day Reflection</h2>
        </div>
        {hasUnsavedChanges && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Sleep & Recovery */}
      <Card variant="primary" title="Sleep & Recovery">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime</label>
              <Input
                type="time"
                value={reflectionData.bedtime}
                onChange={(e) => updateReflectionData({ bedtime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wake Time</label>
              <Input
                type="time"
                value={reflectionData.wake_time}
                onChange={(e) => updateReflectionData({ wake_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
            <div className="flex space-x-4">
              {SLEEP_QUALITY_OPTIONS.map((quality) => (
                <label key={quality} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="sleepQuality"
                    value={quality}
                    checked={reflectionData.sleep_quality === quality}
                    onChange={(e) => updateReflectionData({ sleep_quality: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm capitalize">{quality}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overnight Symptoms</label>
            <Textarea
              placeholder="Any pain, discomfort, or symptoms during sleep..."
              value={reflectionData.overnight_symptoms}
              onChange={(e) => updateReflectionData({ overnight_symptoms: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Overall Feeling */}
      <Card variant="warning" title="Overall Feeling - End of Day">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy Level: {reflectionData.energy_level}/10
            </label>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
              <span>Exhausted</span>
              <div className="flex-1"></div>
              <span>Energized</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={reflectionData.energy_level}
              onChange={(e) => updateReflectionData({ energy_level: parseInt(e.target.value) })}
              className="w-full" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood: {reflectionData.mood_level}/10
            </label>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
              <span>Low/Stressed</span>
              <div className="flex-1"></div>
              <span>Great/Positive</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={reflectionData.mood_level}
              onChange={(e) => updateReflectionData({ mood_level: parseInt(e.target.value) })}
              className="w-full" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Physical Comfort: {reflectionData.physical_comfort}/10
            </label>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
              <span>Pain/Discomfort</span>
              <div className="flex-1"></div>
              <span>Feeling Good</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={reflectionData.physical_comfort}
              onChange={(e) => updateReflectionData({ physical_comfort: parseInt(e.target.value) })}
              className="w-full" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall Notes</label>
            <Textarea
              placeholder="How are you feeling overall today? Any patterns or insights?"
              value={reflectionData.overall_notes}
              onChange={(e) => updateReflectionData({ overall_notes: e.target.value })}
              rows={2}
              focusColor="orange"
            />
          </div>
        </div>
      </Card>

      {/* Activity Level */}
      <Card variant="success" title="Activity Level">
        <div className="flex space-x-4">
          {Object.values(ACTIVITY_LEVELS).map((level) => (
            <label key={level} className="flex items-center space-x-2">
              <input
                type="radio"
                name="activityLevel"
                value={level}
                checked={reflectionData.activity_level === level}
                onChange={(e) => updateReflectionData({ activity_level: e.target.value })}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm capitalize">{level}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Mindfulness & Meditation */}
      <Card title="Mindfulness & Meditation" variant="indigo">
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={reflectionData.meditation_practice}
              onChange={(e) => updateReflectionData({ meditation_practice: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500" 
            />
            <span className="text-sm">Meditation Practice</span>
          </label>
          
          <div className="ml-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration: {reflectionData.meditation_duration} minutes
            </label>
            <input 
              type="range" 
              min="0" 
              max="60" 
              value={reflectionData.meditation_duration}
              onChange={(e) => updateReflectionData({ meditation_duration: parseInt(e.target.value) })}
              className="w-full" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mindfulness Activities</label>
            <Input
              placeholder="e.g., breathing exercises, grounding, nature connection..."
              value={reflectionData.mindfulness_activities}
              onChange={(e) => updateReflectionData({ mindfulness_activities: e.target.value })}
              focusColor="indigo"
              className="text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Menstrual Cycle */}
      <Card variant="pink" title="Menstrual Cycle">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Day</label>
            <div className="flex space-x-2">
              {CYCLE_DAY_OPTIONS.map((day) => (
                <label key={day} className="flex items-center space-x-1">
                  <input 
                    type="radio" 
                    name="cycleDay" 
                    value={day} 
                    checked={reflectionData.cycle_day === day}
                    onChange={(e) => updateReflectionData({ cycle_day: e.target.value })}
                    className="text-pink-600 focus:ring-pink-500" 
                  />
                  <span className="text-xs">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={reflectionData.ovulation}
                onChange={(e) => updateReflectionData({ ovulation: e.target.checked })}
                className="rounded text-pink-600 focus:ring-pink-500" 
              />
              <span className="text-sm">Ovulation</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Additional Reflections */}
      <Card title="Additional Reflections" variant="teal">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anything else noteworthy about today?</label>
          <Textarea
            placeholder="Patterns, insights, connections, or anything else you want to remember..."
            value={reflectionData.additional_reflections}
            onChange={(e) => updateReflectionData({ additional_reflections: e.target.value })}
            rows={3}
            focusColor="teal"
          />
        </div>
      </Card>

      {/* Save Button */}
      <Button 
        variant="success" 
        size="lg" 
        icon={CheckCircle2} 
        className="w-full"
        loading={loading}
        onClick={saveReflectionData}
      >
        {loading ? 'Saving...' : 'Save Reflection'}
      </Button>

      {/* Success message */}
      {!hasUnsavedChanges && !loading && reflectionData.bedtime && (
        <Alert variant="success" title="Reflection Saved">
          Your reflection for {selectedDate} has been saved successfully.
        </Alert>
      )}
    </div>
  );
};

export default ReflectionView;