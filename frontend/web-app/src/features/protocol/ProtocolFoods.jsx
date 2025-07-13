import React, { useState } from 'react';
import { Search, Filter, Eye, EyeOff, AlertCircle, TrendingUp, Loader2, Info, AlertTriangle } from 'lucide-react';

// Import hooks from shared folder
import { useProtocolFoods, useFoodSearch } from '../../../../shared/hooks/useProtocolFoods';

const ProtocolFoods = ({ protocolId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(false);
  
  // Only call useProtocolFoods hook if we have a valid protocol
  const hasValidProtocol = protocolId && protocolId !== 'no_protocol';
  
  const { 
    foodsByCategory, 
    complianceStats, 
    totalFoods, 
    loading, 
    error 
  } = useProtocolFoods(hasValidProtocol ? protocolId : null);

  const { 
    foods: searchResults, 
    loading: searchLoading, 
    searchFoods 
  } = useFoodSearch();

  // Handle search - works even without protocol
  React.useEffect(() => {
    if (searchTerm.trim()) {
      console.log('🔍 SEARCH DEBUG:', {
        searchTerm,
        protocolId,
        hasValidProtocol,
        searchParams: { 
          search: searchTerm, 
          protocol_id: hasValidProtocol ? protocolId : null 
        }
      });
      
      const timer = setTimeout(() => {
        searchFoods({ 
          search: searchTerm, 
          protocol_id: hasValidProtocol ? protocolId : null 
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, protocolId, hasValidProtocol]);

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

  const getComplianceLabel = (status) => {
    switch (status) {
      case 'allowed': return 'Included';
      case 'avoid': return 'Avoid for now';
      case 'reintroduction': return 'Try in moderation';
      default: return 'Not specified';
    }
  };

  // Smart food deduplication and status merging
  const deduplicateAndMergeFoods = (foods) => {
    const foodMap = new Map();
    
    foods.forEach(food => {
      const baseName = food.name.toLowerCase().trim();
      
      if (foodMap.has(baseName)) {
        const existing = foodMap.get(baseName);
        // Prioritize foods with known compliance status
        if (food.compliance_status && food.compliance_status !== 'unknown' && 
            (!existing.compliance_status || existing.compliance_status === 'unknown')) {
          foodMap.set(baseName, {
            ...food,
            // Keep the simpler name if it exists
            name: existing.name.length <= food.name.length ? existing.name : food.name
          });
        }
      } else {
        foodMap.set(baseName, food);
      }
    });
    
    return Array.from(foodMap.values());
  };

  // Process search results with deduplication
  const processedSearchResults = React.useMemo(() => {
    if (!searchResults || searchResults.length === 0) return [];
    return deduplicateAndMergeFoods(searchResults);
  }, [searchResults]);

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

  // Filter to only show allowed foods for default view
  const filterAllowedFoods = (foods) => {
    return foods.filter(food => food.compliance_status === 'allowed');
  };

  // Smart search result analysis
  const analyzeSearchResults = () => {
    if (!searchTerm.trim()) return { type: 'none' };
    if (searchLoading) return { type: 'loading' };
    
    const hasResults = processedSearchResults.length > 0;
    const hasProtocolCompliance = processedSearchResults.some(food => 
      food.compliance_status && food.compliance_status !== 'unknown'
    );
    
    if (!hasResults) {
      return { type: 'no_results' };
    }
    
    if (hasValidProtocol && !hasProtocolCompliance) {
      return { type: 'not_in_protocol', foods: processedSearchResults };
    }
    
    return { type: 'results', foods: processedSearchResults };
  };

  const FoodItem = ({ food, showCompliance = true, showProtocolWarning = false }) => (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-lg font-medium capitalize">{food.name}</span>
            {showCompliance && food.compliance_status && (
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getComplianceColor(food.compliance_status)}`}>
                {getComplianceIcon(food.compliance_status)} {getComplianceLabel(food.compliance_status)}
              </span>
            )}
            {showProtocolWarning && !food.compliance_status && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded text-xs">
                ⚠️ Not in Protocol
              </span>
            )}
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
          
          {showProtocolWarning && !food.compliance_status && (
            <p className="text-sm text-blue-700 mt-2 p-2 bg-blue-50 rounded">
              <Info className="w-4 h-4 inline mr-1" />
              <strong>Not yet categorized:</strong> We're still building our database. This food hasn't been categorized for your protocol yet, but you can still track it. Our team will review and categorize it soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Show loading only if we have a protocol and it's loading
  if (hasValidProtocol && loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Loading protocol foods...</span>
        </div>
      </div>
    );
  }

  if (hasValidProtocol && error) {
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

  const searchAnalysis = analyzeSearchResults();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Filter className="w-7 h-7 text-green-600" />
              <span>{hasValidProtocol ? 'Allowed Foods' : 'Food Database'}</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {hasValidProtocol 
                ? 'Foods that are included in your protocol'
                : 'Search our comprehensive food database'
              }
            </p>
          </div>
          {hasValidProtocol && (
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{complianceStats.allowed || 0}</div>
              <div className="text-sm text-gray-500">Included Foods</div>
            </div>
          )}
        </div>
      </div>

      {/* Universal Search - Always at Top */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={hasValidProtocol ? "Search to check if foods are included..." : "Search foods..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {hasValidProtocol && (
          <div className="mt-2 text-sm text-gray-600">
            <Info className="w-4 h-4 inline mr-1" />
            Search any food to see if it's included, should be avoided, or can be tried in moderation
          </div>
        )}
      </div>

      {/* Search Results - Directly under search */}
      {searchTerm.trim() && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Search className="w-5 h-5 text-blue-500" />
              <span>Search Results for "{searchTerm}"</span>
            </h3>
          </div>
          
          {searchAnalysis.type === 'loading' && (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-500">Searching...</p>
            </div>
          )}
          
          {searchAnalysis.type === 'no_results' && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Food not found</p>
              <p className="text-sm text-gray-500 mt-1">
                "{searchTerm}" isn't in our database yet
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 text-left">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Help us grow our database!</p>
                    <p className="mt-1">
                      You can still track this food in your journal. When you add it, our team will be notified to research and properly categorize it for your protocol.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  // This would integrate with the entry form to add custom food
                  console.log('🍎 Adding custom food to be categorized:', searchTerm);
                  // TODO: Integrate with entry form or show modal
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Track "{searchTerm}" anyway
              </button>
            </div>
          )}
          
          {searchAnalysis.type === 'not_in_protocol' && (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Food Not in Protocol</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      "{searchTerm}" was found in our database but does not appear to be specifically addressed in your current protocol.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {searchAnalysis.foods.map((food, index) => (
                  <FoodItem 
                    key={index} 
                    food={food} 
                    showCompliance={false}
                    showProtocolWarning={true}
                  />
                ))}
              </div>
            </div>
          )}
          
          {searchAnalysis.type === 'results' && (
            <div className="divide-y divide-gray-100">
              {searchAnalysis.foods.map((food, index) => (
                <FoodItem 
                  key={index} 
                  food={food} 
                  showCompliance={hasValidProtocol}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Protocol Message */}
      {!hasValidProtocol && !searchTerm.trim() && (
        <div className="text-center p-8">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Food Database Search</h3>
            <p className="text-gray-600">
              This tab is designed to show protocol-specific food guidance when you have a protocol selected.
            </p>
            <p className="text-gray-600">
              You can search for any food above to learn more about its properties.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 text-lg">💡</div>
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Tip</div>
                  <div className="text-blue-700">
                    Use the search above to look up foods and see their histamine, oxalate, and other properties.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol-specific content (only allowed foods) */}
      {hasValidProtocol && !searchTerm.trim() && (
        <>
          {/* Stats Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {complianceStats.allowed || 0} included foods from your protocol
            </div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">Protocol Stats</span>
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
                    <div className="text-sm text-green-700">Included Foods</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{complianceStats.avoid || 0}</div>
                    <div className="text-sm text-red-700">Avoid for now</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🟡</span>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{complianceStats.reintroduction || 0}</div>
                    <div className="text-sm text-yellow-700">Try in moderation</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Allowed Foods by Category */}
          <div className="space-y-6">
            {Object.entries(foodsByCategory).map(([category, foods]) => {
              const allowedFoods = filterAllowedFoods(foods);
              
              if (allowedFoods.length === 0) return null;
              
              return (
                <div key={category} className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="capitalize">{category}</span>
                      <span className="text-sm text-gray-500">({allowedFoods.length} included)</span>
                    </h3>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {allowedFoods.map((food, index) => (
                      <FoodItem key={index} food={food} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {Object.keys(foodsByCategory).length === 0 && (
            <div className="text-center p-8">
              <div className="text-gray-400 mb-4">
                <Filter className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">No included foods available for this protocol</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProtocolFoods;