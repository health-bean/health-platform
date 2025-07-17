import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert } from '../../../../shared/components/ui';
import { ACTIVITY_LEVELS, SLEEP_QUALITY_OPTIONS, CYCLE_DAY_OPTIONS } from '../../../../shared/constants/constants';
import SmartSymptomSelector from '../../components/common/SmartSymptomSelector';

// UPDATED VERSION - Cache Buster 2025-07-13-21:15

const ReflectionView = ({ 
  reflectionData, 
  updateReflectionData, 
  saveReflectionData,
  hasUnsavedChanges,
  loading,
  selectedDate
}) => {
  console.log('🔍 ReflectionView rendering with data:', reflectionData);
  
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
      <Card variant="outlined" className="border-blue-200">
        <div className="p-4 border-b border-blue-100 bg-blue-50">
          <h3 className="text-lg font-semibold text-blue-800">Sleep & Recovery</h3>
        </div>
        <div className="p-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep-Related Symptoms
              </label>
              <SmartSymptomSelector
                selectedSymptoms={reflectionData.sleep_symptoms || []}
                onSymptomsChange={(symptoms) => updateReflectionData({ sleep_symptoms: symptoms })}
                placeholder="Any pain, discomfort, or symptoms during sleep..."
                prioritizeUserHistory={true}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Wellness Check */}
      <Card variant="outlined" className="border-yellow-200">
        <div className="p-4 border-b border-yellow-100 bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-800">Daily Wellness Check</h3>
        </div>
        <div className="p-4">
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
          </div>
        </div>
      </Card>

      {/* Activity Level */}
      <Card variant="outlined" className="border-green-200">
        <div className="p-4 border-b border-green-100 bg-green-50">
          <h3 className="text-lg font-semibold text-green-800">Activity Level</h3>
        </div>
        <div className="p-4">
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
        </div>
      </Card>

      {/* Mindfulness & Meditation */}
      <Card variant="outlined" className="border-purple-200">
        <div className="p-4 border-b border-purple-100 bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-800">Mindfulness & Meditation</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meditation Duration: {reflectionData.meditation_duration || 0} minutes
            </label>
            
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={reflectionData.meditation_duration || 0}
                onChange={(e) => updateReflectionData({ 
                  meditation_duration: parseInt(e.target.value),
                  meditation_practice: parseInt(e.target.value) > 0 
                })}
                className="flex-1" 
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={reflectionData.meditation_duration || 0}
                  onChange={(e) => {
                    const minutes = Math.max(0, parseInt(e.target.value) || 0);
                    updateReflectionData({ 
                      meditation_duration: minutes,
                      meditation_practice: minutes > 0 
                    });
                  }}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              {(reflectionData.meditation_duration || 0) === 0 
                ? "Set to 0 if you didn't meditate today" 
                : `Great! ${reflectionData.meditation_duration} minutes of mindfulness practice`
              }
            </div>
          </div>
        </div>
      </Card>

      {/* Menstrual Cycle */}
      <Card variant="outlined" className="border-pink-200">
        <div className="p-4 border-b border-pink-100 bg-pink-50">
          <h3 className="text-lg font-semibold text-pink-800">Menstrual Cycle</h3>
        </div>
        <div className="p-4">
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
        </div>
      </Card>

      {/* Personal Reflection */}
      <Card variant="outlined" className="border-teal-200">
        <div className="p-4 border-b border-teal-100 bg-teal-50">
          <h3 className="text-lg font-semibold text-teal-800">Personal Reflection</h3>
        </div>
        <div className="p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Notes</label>
            <Textarea
              placeholder="How are you feeling overall today? Any patterns, insights, or anything else noteworthy..."
              value={reflectionData.personal_reflection}
              onChange={(e) => updateReflectionData({ personal_reflection: e.target.value })}
              rows={3}
            />
          </div>
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
      {!hasUnsavedChanges && !loading && (
        <Alert variant="success" title="Reflection Saved">
          Your reflection for {selectedDate} has been saved successfully.
        </Alert>
      )}
    </div>
  );
};

export default ReflectionView;