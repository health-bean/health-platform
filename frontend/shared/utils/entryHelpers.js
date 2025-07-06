export const getEntryIcon = (type) => ({
  food: '🍽️',
  symptom: '⚠️',
  supplement: '💊',
  medication: '💉',
  exposure: '🏭',
  detox: '🧘'
}[type] || '📝');

export const getEntryColor = (type) => ({
  food: 'bg-green-50 border-green-200',
  symptom: 'bg-red-50 border-red-200',
  supplement: 'bg-blue-50 border-blue-200',
  medication: 'bg-purple-50 border-purple-200',
  exposure: 'bg-orange-50 border-orange-200',
  detox: 'bg-purple-50 border-purple-200'
}[type] || 'bg-gray-50 border-gray-200');

export const getProtocolDisplayText = (selectedProtocols, protocols) => {
  if (!selectedProtocols || selectedProtocols.length === 0) return 'No protocols selected';
  
  // Handle "No Protocol" selection
  if (selectedProtocols.includes('no_protocol')) {
    return 'No Protocol';
  }
  
  const selectedProtocolObjects = protocols.filter(p => 
    selectedProtocols.includes(p.id)
  );
  
  if (selectedProtocols.length === 1) {
    return selectedProtocolObjects[0]?.name || 'Protocol';
  }
  if (selectedProtocols.length === 2) {
    const names = selectedProtocolObjects.map(p => p.name.split(' ')[0]);
    return names.join(' + ');
  }
  return `${selectedProtocols.length} Active Protocols`;
};