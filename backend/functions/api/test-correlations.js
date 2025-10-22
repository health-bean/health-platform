// Test script for correlations fix
const { handleGetCorrelationInsights } = require('./handlers/correlations');

async function testCorrelations() {
  console.log('Testing correlations handler...');
  
  // Test with demo user
  const queryParams = {
    user_id: 'demo-user-123',
    confidence_threshold: 0.1,
    timeframe_days: 180
  };
  
  const mockEvent = {
    httpMethod: 'GET',
    path: '/api/v1/correlations/insights',
    queryStringParameters: queryParams,
    headers: {
      'X-Demo-Mode': 'true',
      'X-Demo-User-Id': 'demo-user-123'
    }
  };
  
  try {
    const result = await handleGetCorrelationInsights(mockEvent);
    console.log('✅ Correlations handler test result:');
    console.log('Status Code:', result.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(result.body), null, 2));
    
    if (result.statusCode === 200) {
      console.log('✅ SUCCESS: Correlations handler working correctly');
    } else {
      console.log('❌ FAILED: Unexpected status code');
    }
  } catch (error) {
    console.error('❌ ERROR in correlations handler:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testCorrelations();
}

module.exports = { testCorrelations };
