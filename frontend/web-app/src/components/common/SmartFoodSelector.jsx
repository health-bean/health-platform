import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../../shared/components/ui';

const SmartFoodSelector = ({ selectedItems, onToggleItem, selectedProtocols = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const loadFoods = async () => {
      if (!searchTerm.trim()) {
        setFoods([]);
        return;
      }

      setLoading(true);
      try {
        const protocolId = selectedProtocols[0];
        let url = `${API_BASE_URL}/api/v1/foods/search?search=${encodeURIComponent(searchTerm)}`;
        if (protocolId && protocolId !== 'no_protocol') {
          url += `&protocol_id=${protocolId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setFoods(data.foods || []);
      } catch (err) {
        console.error('Failed to load foods:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadFoods, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedProtocols, API_BASE_URL]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Searching foods...</div>}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {foods.map((food) => {
          const isSelected = selectedItems.includes(food.name);
          
          return (
            <div key={food.id} className={`p-3 border rounded-lg cursor-pointer transition-all ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => onToggleItem(food.name)}>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleItem(food.name)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium capitalize">{food.name}</span>
                {food.protocol_status && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    food.protocol_status === 'allowed' ? 'bg-green-100 text-green-800' :
                    food.protocol_status === 'avoid' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {food.protocol_status === 'allowed' ? '✅ Allowed' :
                     food.protocol_status === 'avoid' ? '❌ Avoid' : 
                     '🟡 Reintroduction'}
                  </span>
                )}
              </div>
              
              {food.protocol_notes && (
                <p className="text-xs text-blue-600 mb-2 italic">{food.protocol_notes}</p>
              )}
              
              <div className="flex flex-wrap gap-1">
                {food.nightshade && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Nightshade</span>
                )}
                <span className={`px-2 py-1 rounded text-xs ${
                  food.histamine === 'high' ? 'bg-red-100 text-red-800' :
                  food.histamine === 'moderate' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {food.histamine} histamine
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {searchTerm && !loading && foods.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No foods found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default SmartFoodSelector;