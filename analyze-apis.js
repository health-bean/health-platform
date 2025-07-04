#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

class FILOAPIAnalyzer {
  constructor() {
    this.baseURL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.results = {
      endpoints: [],
      status: 'unknown',
      timestamp: new Date().toISOString(),
      summary: {
        working: 0,
        broken: 0,
        total: 0
      }
    };
  }

  async analyzeAPIs() {
    console.log('🌐 Testing FILO Health Platform APIs...');
    console.log(`Base URL: ${this.baseURL}\n`);
    
    // Production endpoints that your app actually uses
    const productionEndpoints = [
      // Core protocol endpoints
      { path: '/api/v1/protocols', method: 'GET', description: 'Get available health protocols' },
      
      // AI correlation endpoints
      { path: '/api/v1/correlations/insights?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0', method: 'GET', description: 'Get AI correlation insights' },
      { path: '/api/v1/correlations/insights?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0&confidence_threshold=0.7', method: 'GET', description: 'Get filtered correlation insights' },
      
      // Protocol foods endpoints
      { path: '/api/v1/foods/by-protocol?protocol_id=1495844a-19de-404c-a288-7660eda0cbe1', method: 'GET', description: 'Get AIP Core protocol foods' },
      { path: '/api/v1/foods/by-protocol?protocol_id=51ca7a24-4691-4629-8ee5-c20876e68c29', method: 'GET', description: 'Get Low Histamine protocol foods' },
      { path: '/api/v1/foods/search?search=chicken', method: 'GET', description: 'Search foods - chicken' },
      { path: '/api/v1/foods/search?search=broccoli&protocol_id=1495844a-19de-404c-a288-7660eda0cbe1', method: 'GET', description: 'Search foods with protocol context' },
      
      // Timeline endpoints
      { path: '/api/v1/timeline/entries', method: 'GET', description: 'Get timeline entries' },
      { path: '/api/v1/timeline/entries?date=2025-07-04', method: 'GET', description: 'Get timeline entries with date filter' },
      { path: '/api/v1/timeline/entries?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0', method: 'GET', description: 'Get user timeline entries' },
      
      // User management endpoints
      { path: '/api/v1/users', method: 'GET', description: 'Get user data' },
      { path: '/api/v1/user/protocols', method: 'GET', description: 'Get user active protocols' },
      { path: '/api/v1/user/preferences', method: 'GET', description: 'Get user preferences' },
      
      // Journal endpoints
      { path: '/api/v1/journal/entries', method: 'GET', description: 'Get journal entries' },
      { path: '/api/v1/journal/entries?date=2025-07-04', method: 'GET', description: 'Get journal entries with date filter' },
      
      // Search endpoints
      { path: '/api/v1/symptoms/search?search=headache', method: 'GET', description: 'Search symptoms' },
      { path: '/api/v1/supplements/search?search=vitamin', method: 'GET', description: 'Search supplements' },
      { path: '/api/v1/medications/search?search=ibuprofen', method: 'GET', description: 'Search medications' },
      
      // Exposure and detox endpoints
      { path: '/api/v1/exposure-types', method: 'GET', description: 'Get exposure types' },
      { path: '/api/v1/detox-types', method: 'GET', description: 'Get detox types' },
      
      // Test POST endpoint (timeline creation)
      { path: '/api/v1/timeline/entries', method: 'POST', description: 'Create timeline entry', 
        body: {
          entryDate: '2025-07-04',
          entryTime: '12:00:00',
          entryType: 'food',
          content: 'API test entry',
          selectedFoods: ['test food']
        }
      }
    ];

    console.log(`Testing ${productionEndpoints.length} production endpoints...\n`);
    
    for (const endpoint of productionEndpoints) {
      await this.testEndpoint(endpoint);
      await this.sleep(300); // Rate limiting between requests
    }

    this.generateReport();
    this.saveResults();
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = `${this.baseURL}${endpoint.path}`;
      const startTime = Date.now();
      
      console.log(`🔄 Testing: ${endpoint.method} ${endpoint.path}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FILO-API-Analyzer/1.0'
        }
      };

      // Add body for POST requests
      let postData = null;
      if (endpoint.method === 'POST' && endpoint.body) {
        postData = JSON.stringify(endpoint.body);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = https.request(url, options, (res) => {
        let body = '';
        const responseTime = Date.now() - startTime;
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedBody = JSON.parse(body);
            const dataType = Array.isArray(parsedBody) ? 'array' : typeof parsedBody;
            const working = res.statusCode >= 200 && res.statusCode < 300;
            
            // Create sample data structure
            const sampleData = this.createSampleData(parsedBody);
            
            const endpointResult = {
              path: endpoint.path,
              method: endpoint.method,
              description: endpoint.description,
              url: url,
              status: res.statusCode,
              responseTime: responseTime,
              dataType: dataType,
              dataSize: Buffer.byteLength(body),
              sampleData: sampleData,
              headers: {
                'content-type': res.headers['content-type'],
                'content-length': res.headers['content-length']
              },
              working: working,
              rawResponse: working ? null : body
            };
            
            this.results.endpoints.push(endpointResult);
            
            if (working) {
              this.results.summary.working++;
              console.log(`  ✅ ${res.statusCode} (${responseTime}ms) - ${dataType} with ${Object.keys(parsedBody).length} properties`);
            } else {
              this.results.summary.broken++;
              console.log(`  ❌ ${res.statusCode} (${responseTime}ms) - Error`);
            }
            
          } catch (error) {
            const working = res.statusCode >= 200 && res.statusCode < 300;
            this.results.endpoints.push({
              path: endpoint.path,
              method: endpoint.method,
              description: endpoint.description,
              url: url,
              status: res.statusCode,
              responseTime: responseTime,
              dataType: 'text',
              dataSize: Buffer.byteLength(body),
              sampleData: { raw: body },
              headers: {
                'content-type': res.headers['content-type'],
                'content-length': res.headers['content-length']
              },
              working: working,
              rawResponse: body
            });
            
            if (working) {
              this.results.summary.working++;
              console.log(`  ✅ ${res.statusCode} (${responseTime}ms) - Text response`);
            } else {
              this.results.summary.broken++;
              console.log(`  ❌ ${res.statusCode} (${responseTime}ms) - ${error.message}`);
            }
          }
          
          this.results.summary.total++;
          resolve();
        });
      });
      
      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        this.results.endpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          url: url,
          status: 0,
          responseTime: responseTime,
          dataType: 'error',
          dataSize: 0,
          sampleData: { error: error.message },
          headers: {},
          working: false,
          rawResponse: error.message
        });
        
        this.results.summary.broken++;
        this.results.summary.total++;
        console.log(`  ❌ Network Error (${responseTime}ms) - ${error.message}`);
        resolve();
      });
      
      // Send POST data if present
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }

  createSampleData(data) {
    if (!data || typeof data !== 'object') {
      return { raw: data };
    }
    
    const type = Array.isArray(data) ? 'array' : 'object';
    const keys = Array.isArray(data) ? [] : Object.keys(data);
    
    // Create structure description
    const structure = {};
    if (Array.isArray(data)) {
      structure.length = data.length;
      if (data.length > 0) {
        structure.sample = data[0];
      }
    } else {
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          structure[key] = `array[${value.length}]`;
        } else {
          structure[key] = typeof value;
        }
      });
    }
    
    return {
      type: type,
      keys: keys,
      sample: Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data,
      structure: structure
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    const successRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.working / this.results.summary.total) * 100)
      : 0;
    
    console.log('\n📊 FILO API Analysis Report');
    console.log('============================\n');
    
    console.log('🎯 SUMMARY:');
    console.log(`✅ Working: ${this.results.summary.working}/${this.results.summary.total}`);
    console.log(`❌ Broken: ${this.results.summary.broken}/${this.results.summary.total}`);
    console.log(`📊 Success Rate: ${successRate}%\n`);
    
    const workingEndpoints = this.results.endpoints.filter(e => e.working);
    const brokenEndpoints = this.results.endpoints.filter(e => !e.working);
    
    if (workingEndpoints.length > 0) {
      console.log('🟢 WORKING ENDPOINTS:');
      workingEndpoints.forEach(endpoint => {
        console.log(`  ${endpoint.method} ${endpoint.path}`);
        console.log(`    Status: ${endpoint.status} | Response Time: ${endpoint.responseTime}ms`);
        console.log(`    Data: ${endpoint.dataType} with keys: ${endpoint.sampleData.keys ? endpoint.sampleData.keys.join(', ') : 'N/A'}`);
        console.log('');
      });
    }
    
    if (brokenEndpoints.length > 0) {
      console.log('🔴 BROKEN/ERROR ENDPOINTS:');
      brokenEndpoints.forEach(endpoint => {
        console.log(`  ${endpoint.method} ${endpoint.path}`);
        console.log(`    Status: ${endpoint.status} | Issue: ${endpoint.status === 0 ? 'Network Error' : 'HTTP Error'}`);
        console.log('');
      });
    }
    
    // Performance metrics
    const responseTimes = this.results.endpoints.map(e => e.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log('⚡ PERFORMANCE METRICS:');
    console.log(`  Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`  Fastest Response: ${minResponseTime}ms`);
    console.log(`  Slowest Response: ${maxResponseTime}ms\n`);
    
    // Data insights
    console.log('📋 API DATA INSIGHTS:');
    workingEndpoints.forEach(endpoint => {
      if (endpoint.sampleData.structure) {
        console.log(`  ${endpoint.path}:`);
        Object.keys(endpoint.sampleData.structure).forEach(key => {
          console.log(`    - ${key}: ${endpoint.sampleData.structure[key]}`);
        });
        console.log('');
      }
    });
    
    this.results.status = successRate > 50 ? 'healthy' : 'degraded';
  }

  saveResults() {
    // Save detailed analysis
    fs.writeFileSync('FILO_API_ANALYSIS.json', JSON.stringify(this.results, null, 2));
    console.log('💾 Detailed API report saved to: FILO_API_ANALYSIS.json');
    
    // Save Swagger-like documentation
    const swagger = this.generateSwagger();
    fs.writeFileSync('FILO_API_SWAGGER.json', JSON.stringify(swagger, null, 2));
    console.log('📋 API documentation saved to: FILO_API_SWAGGER.json');
    
    // Save summary
    const summary = {
      timestamp: this.results.timestamp,
      baseURL: this.baseURL,
      summary: this.results.summary,
      status: this.results.status,
      workingEndpoints: this.results.endpoints.filter(e => e.working).length,
      totalEndpoints: this.results.summary.total
    };
    fs.writeFileSync('FILO_API_SUMMARY.json', JSON.stringify(summary, null, 2));
    console.log('📊 API summary saved to: FILO_API_SUMMARY.json');
  }

  generateSwagger() {
    const swagger = {
      openapi: '3.0.0',
      info: {
        title: 'FILO Health Platform API',
        version: '1.0.0',
        description: 'Production-ready API with proxy integration for AI-powered health intelligence platform'
      },
      servers: [
        {
          url: this.baseURL,
          description: 'Production API Gateway with proxy integration'
        }
      ],
      paths: {}
    };
    
    this.results.endpoints.forEach(endpoint => {
      const path = endpoint.path.split('?')[0]; // Remove query parameters for swagger
      if (!swagger.paths[path]) {
        swagger.paths[path] = {};
      }
      
      swagger.paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        responses: {
          [endpoint.status]: {
            description: endpoint.working ? 'Success' : 'Error',
            content: {
              'application/json': {
                schema: {
                  type: endpoint.sampleData.type || 'object'
                }
              }
            }
          }
        }
      };
    });
    
    return swagger;
  }
}

// Run the analysis
const analyzer = new FILOAPIAnalyzer();
analyzer.analyzeAPIs().catch(console.error);