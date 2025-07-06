import React, { useState } from 'react';
import { Search, Filter, Eye, EyeOff, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';

// Import hooks from shared folder - FIXED PATH
import { useProtocolFoods, useFoodSearch } from '../../../../shared/hooks/useProtocolFoods';

const ProtocolFoods = ({ protocolId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, allowed, avoid, reintroduction
  const [showStats, setShowStats] = useState(true);
  
  const { 
    foodsByCategory, 
    complianceStats, 
    totalFoods, 
    loading, 
    error 
  } = useProtocolFoods(protocolId);

  // DEBUG LOG - ADD THIS TO SEE WHAT THE COMPONENT RECEIVES
  console.log('🎯 Component received state:', {
    protocolId,
    foodsByCategory,
    foodsByCategoryKeys: Object.keys(foodsByCategory),
    complianceStats,
    totalFoods,
    loading,
    error
  });

  const { 
    foods: searchResults, 
    loading: searchLoading, 
    searchFoods 
  } = useFoodSearch();

  // Handle search
  React.useEffect(() => {
    if (searchTerm.trim()) {
      const timer = setTimeout(() => {
        searchFoods({ 
          search: searchTerm, 
          protocol_id: protocolId 
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, protocolId]);

  const getComplianceColor = (status) => {
    switch (status) {
      case 'allowed': return 'bg-green-100 text-green-800 border-green-200';
      case 'avoid': return 'bg-red-100 text-red-800 border-red-200';
      case 'reintroduction': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'allowed': return '✅';
      case 'avoid': return '❌';
      case 'reintroduction': return '🟡';
      default: return '❓';
    }
  };

  const getPropertyColor = (property, value) => {
    if (property === 'histamine') {
      switch (value) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'moderate': return 'bg-orange-100 text-orange-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    if (property === 'oxalate') {
      switch (value) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'moderate': return 'bg-orange-100 text-orange-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-blue-100 text-blue-800';
  };

  const filterFoods = (foods, filter) => {
    if (filter === 'all') return foods;
    return foods.filter(food => food.compliance_status === filter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Loading protocol foods...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Foods</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!protocolId || protocolId === 'no_protocol') {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 mb-4">
          <Filter className="w-12 h-12 mx-auto" />
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Free Tracking Mode</h3>
          <p className="text-gray-600">
            You're tracking without protocol restrictions. Use the main food tracking 
            features to log your meals and discover your personal patterns.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 text-lg">💡</div>
              <div className="text-sm text-blue-800">
                <div className="font-medium">Track Everything</div>
                <div className="text-blue-700">
                  Log all foods, symptoms, and activities. Our AI will analyze your data 
                  to find personalized correlations and suggest potential triggers.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Filter className="w-7 h-7 text-green-600" />
              <span>Protocol Foods</span>
            </h2>
            <p className="text-gray-600 mt-1">
              Color-coded food guidance for your protocol
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{totalFoods}</div>
            <div className="text-sm text-gray-500">Foods Analyzed</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Foods', count: totalFoods },
            { key: 'allowed', label: 'Allowed', count: complianceStats.allowed || 0 },
            { key: 'avoid', label: 'Avoid', count: complianceStats.avoid || 0 },
            { key: 'reintroduction', label: 'Reintroduction', count: complianceStats.reintroduction || 0 }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeFilter === filter.key
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-sm">Stats</span>
        </button>
      </div>

      {/* Compliance Stats */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">✅</span>
              <div>
                <div className="text-2xl font-bold text-green-600">{complianceStats.allowed || 0}</div>
                <div className="text-sm text-green-700">Allowed Foods</div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❌</span>
              <div>
                <div className="text-2xl font-bold text-red-600">{complianceStats.avoid || 0}</div>
                <div className="text-sm text-red-700">Foods to Avoid</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🟡</span>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{complianceStats.reintroduction || 0}</div>
                <div className="text-sm text-yellow-700">Reintroduction</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results or Category Foods */}
      {searchTerm.trim() ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-500" />
              <span>Search Results for "{searchTerm}"</span>
            </h3>
          </div>
          
          {searchLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-500">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No foods found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filterFoods(searchResults, activeFilter).map((food, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-medium capitalize">{food.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getComplianceColor(food.compliance_status)}`}>
                          {getComplianceIcon(food.compliance_status)} {food.compliance_status || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {food.nightshade && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">🍅 Nightshade</span>
                        )}
                        {food.histamine && (
                          <span className={`px-2 py-1 rounded text-xs ${getPropertyColor('histamine', food.histamine)}`}>
                            Histamine: {food.histamine}
                          </span>
                        )}
                        {food.oxalate && (
                          <span className={`px-2 py-1 rounded text-xs ${getPropertyColor('oxalate', food.oxalate)}`}>
                            Oxalate: {food.oxalate}
                          </span>
                        )}
                        {food.lectin && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">🌾 Lectin</span>
                        )}
                      </div>
                      
                      {food.protocol_notes && (
                        <p className="text-sm text-blue-600 italic">{food.protocol_notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Category View */
        <div className="space-y-6">
          {Object.entries(foodsByCategory).map(([category, foods]) => {
            const filteredFoods = filterFoods(foods, activeFilter);
            
            if (filteredFoods.length === 0) return null;
            
            return (
              <div key={category} className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="capitalize">{category}</span>
                    <span className="text-sm text-gray-500">({filteredFoods.length})</span>
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {filteredFoods.map((food, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-lg font-medium capitalize">{food.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getComplianceColor(food.compliance_status)}`}>
                              {getComplianceIcon(food.compliance_status)} {food.compliance_status || 'Unknown'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {food.nightshade && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">🍅 Nightshade</span>
                            )}
                            {food.histamine && (
                              <span className={`px-2 py-1 rounded text-xs ${getPropertyColor('histamine', food.histamine)}`}>
                                Histamine: {food.histamine}
                              </span>
                            )}
                            {food.oxalate && (
                              <span className={`px-2 py-1 rounded text-xs ${getPropertyColor('oxalate', food.oxalate)}`}>
                                Oxalate: {food.oxalate}
                              </span>
                            )}
                            {food.lectin && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">🌾 Lectin</span>
                            )}
                          </div>
                          
                          {food.protocol_notes && (
                            <p className="text-sm text-blue-600 italic">{food.protocol_notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!searchTerm && Object.keys(foodsByCategory).length === 0 && (
        <div className="text-center p-8">
          <div className="text-gray-400 mb-4">
            <Filter className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">No foods available for this protocol</p>
        </div>
      )}
    </div>
  );
};

export default ProtocolFoods;