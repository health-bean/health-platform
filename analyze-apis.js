#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

class ComprehensiveAPIAnalyzer {
  constructor() {
    this.baseURL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.lambdaPath = './backend/functions/api/';
    this.results = {
      infrastructure: {
        apiGateway: "AWS API Gateway with proxy integration",
        lambdaFunction: "health-platform-dev",
        authMiddleware: "Development mode with demo user fallback",
        corsEnabled: true,
        environment: "Development",
        deploymentDate: new Date().toISOString(),
        baseURL: this.baseURL
      },
      endpoints: [],
      discoveredRoutes: [],
      status: 'unknown',
      timestamp: new Date().toISOString(),
      summary: {
        discovered: 0,
        working: 0,
        broken: 0,
        total: 0
      }
    };
  }

  async analyzeAPIs() {
    console.log('🔍 FILO Health Platform - Complete API Analysis');
    console.log('=================================================');
    console.log(`Base URL: ${this.baseURL}`);
    console.log(`Lambda: ${this.results.infrastructure.lambdaFunction}`);
    console.log(`Environment: ${this.results.infrastructure.environment}\n`);
    
    // Step 1: Auto-discover endpoints from code
    console.log('📡 Auto-discovering endpoints from Lambda code...');
    const discoveredEndpoints = await this.discoverEndpoints();
    
    // Step 2: Use known production endpoints (more reliable)
    const productionEndpoints = this.getProductionEndpoints();
    
    // Step 3: Combine and test all endpoints
    const allEndpoints = [...productionEndpoints, ...discoveredEndpoints];
    const uniqueEndpoints = this.deduplicateEndpoints(allEndpoints);
    
    console.log(`🎯 Testing ${uniqueEndpoints.length} endpoints...\n`);
    
    for (const endpoint of uniqueEndpoints) {
      await this.testEndpoint(endpoint);
      await this.sleep(200);
    }

    this.generateComprehensiveReport();
    this.saveAllResults();
  }

  getProductionEndpoints() {
    return [
      // Core API endpoints with proper dev mode configuration
      { path: '/api/v1/protocols', method: 'GET', description: 'Get available health protocols', category: 'Core', requiresAuth: false },
      { path: '/api/v1/correlations/insights?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0', method: 'GET', description: 'AI correlation insights', category: 'AI', requiresAuth: false },
      { path: '/api/v1/correlations/insights?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0&confidence_threshold=0.7', method: 'GET', description: 'Filtered AI correlations', category: 'AI', requiresAuth: false },
      { path: '/api/v1/foods/by-protocol?protocol_id=1495844a-19de-404c-a288-7660eda0cbe1', method: 'GET', description: 'AIP protocol foods', category: 'Foods', requiresAuth: false },
      { path: '/api/v1/foods/by-protocol?protocol_id=51ca7a24-4691-4629-8ee5-c20876e68c29', method: 'GET', description: 'Low Histamine foods', category: 'Foods', requiresAuth: false },
      { path: '/api/v1/foods/search?search=chicken', method: 'GET', description: 'Food search', category: 'Foods', requiresAuth: false },
      { path: '/api/v1/foods/search?search=broccoli&protocol_id=1495844a-19de-404c-a288-7660eda0cbe1', method: 'GET', description: 'Protocol food search', category: 'Foods', requiresAuth: false },
      { path: '/api/v1/timeline/entries', method: 'GET', description: 'Timeline entries', category: 'Timeline', requiresAuth: false },
      { path: '/api/v1/timeline/entries?date=2025-07-04', method: 'GET', description: 'Timeline by date', category: 'Timeline', requiresAuth: false },
      { path: '/api/v1/timeline/entries?userId=8e8a568a-c2f8-43a8-abf2-4e54408dbdc0', method: 'GET', description: 'User timeline', category: 'Timeline', requiresAuth: false },
      { path: '/api/v1/users', method: 'GET', description: 'User profile (dev mode)', category: 'Users', requiresAuth: false },
      { path: '/api/v1/user/protocols', method: 'GET', description: 'User protocols (dev mode)', category: 'Users', requiresAuth: false },
      { path: '/api/v1/user/preferences', method: 'GET', description: 'User preferences (dev mode)', category: 'Users', requiresAuth: false },
      { path: '/api/v1/journal/entries', method: 'GET', description: 'Journal entries (dev mode)', category: 'Journal', requiresAuth: false },
      { path: '/api/v1/journal/entries?date=2025-07-04', method: 'GET', description: 'Journal by date (dev mode)', category: 'Journal', requiresAuth: false },
      { path: '/api/v1/symptoms/search?search=headache', method: 'GET', description: 'Symptom search', category: 'Search', requiresAuth: false },
      { path: '/api/v1/supplements/search?search=vitamin', method: 'GET', description: 'Supplement search', category: 'Search', requiresAuth: false },
      { path: '/api/v1/medications/search?search=ibuprofen', method: 'GET', description: 'Medication search', category: 'Search', requiresAuth: false },
      { path: '/api/v1/detox-types', method: 'GET', description: 'Detox types', category: 'Search', requiresAuth: false },
      { path: '/api/v1/timeline/entries', method: 'POST', description: 'Create timeline entry (dev mode)', category: 'Timeline', requiresAuth: false,
        body: {
          userId: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
          entryDate: '2025-07-04',
          entryType: 'food',
          content: 'API analyzer test entry',
          selectedFoods: ['test food']
        }
      }
    ];
  }

  async discoverEndpoints() {
    try {
      const lambdaFiles = this.findLambdaFiles();
      const endpoints = [];
      
      for (const file of lambdaFiles) {
        const routes = this.parseRoutes(file);
        endpoints.push(...routes);
      }
      
      this.results.discoveredRoutes = endpoints;
      this.results.summary.discovered = endpoints.length;
      
      return endpoints;
    } catch (error) {
      console.log('⚠️  Auto-discovery failed, using production endpoints');
      return [];
    }
  }

  findLambdaFiles() {
    const files = [];
    const searchPaths = [this.lambdaPath, './backend/', './src/'];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const foundFiles = this.scanDirectory(searchPath);
        if (foundFiles.length > 0) {
          files.push(...foundFiles);
          break;
        }
      }
    }
    
    return files;
  }

  scanDirectory(dir) {
    const files = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...this.scanDirectory(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or no permission
    }
    return files;
  }

  parseRoutes(filePath) {
    const routes = [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const apiPathRegex = /\/api\/v\d+\/[a-zA-Z0-9\-\/\?\=\&\_]+/g;
      const matches = content.match(apiPathRegex);
      
      if (matches) {
        matches.forEach(match => {
          routes.push({
            path: match,
            method: 'GET',
            description: `Auto-discovered: ${match}`,
            category: 'Discovered',
            requiresAuth: match.includes('/user/') || match.includes('/journal/'),
            source: path.basename(filePath)
          });
        });
      }
    } catch (error) {
      // File read error
    }
    return routes;
  }

  deduplicateEndpoints(endpoints) {
    const seen = new Set();
    return endpoints.filter(endpoint => {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
          'User-Agent': 'FILO-Complete-Analyzer/1.0'
        }
      };

      // Dev mode: no auth headers to trigger demo user fallback
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
            const working = res.statusCode >= 200 && res.statusCode < 300;
            
            const endpointResult = {
              ...endpoint,
              url: url,
              status: res.statusCode,
              responseTime: responseTime,
              dataType: Array.isArray(parsedBody) ? 'array' : typeof parsedBody,
              dataSize: Buffer.byteLength(body),
              sampleData: this.createSampleData(parsedBody),
              working: working,
              error: working ? null : body.substring(0, 200)
            };
            
            this.results.endpoints.push(endpointResult);
            
            if (working) {
              this.results.summary.working++;
              console.log(`  ✅ ${res.statusCode} (${responseTime}ms)`);
            } else {
              this.results.summary.broken++;
              console.log(`  ❌ ${res.statusCode} (${responseTime}ms)`);
            }
            
          } catch (error) {
            this.results.endpoints.push({
              ...endpoint,
              url: url,
              status: res.statusCode,
              responseTime: Date.now() - startTime,
              dataType: 'text',
              working: res.statusCode >= 200 && res.statusCode < 300,
              error: body.substring(0, 200)
            });
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              this.results.summary.working++;
              console.log(`  ✅ ${res.statusCode} (${responseTime}ms) - Text response`);
            } else {
              this.results.summary.broken++;
              console.log(`  ❌ ${res.statusCode} (${responseTime}ms) - Parse error`);
            }
          }
          
          this.results.summary.total++;
          resolve();
        });
      });
      
      req.on('error', (error) => {
        this.results.endpoints.push({
          ...endpoint,
          url: url,
          status: 0,
          responseTime: Date.now() - startTime,
          working: false,
          error: error.message
        });
        
        this.results.summary.broken++;
        this.results.summary.total++;
        console.log(`  ❌ Network Error - ${error.message}`);
        resolve();
      });
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  }

  createSampleData(data) {
    if (!data || typeof data !== 'object') return { raw: data };
    
    const structure = {};
    if (Array.isArray(data)) {
      structure.length = data.length;
      structure.sample = data[0] || null;
    } else {
      Object.keys(data).forEach(key => {
        const value = data[key];
        structure[key] = Array.isArray(value) ? `array[${value.length}]` : typeof value;
      });
    }
    
    return {
      type: Array.isArray(data) ? 'array' : 'object',
      keys: Array.isArray(data) ? [] : Object.keys(data),
      structure: structure
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateComprehensiveReport() {
    const successRate = this.results.summary.total > 0 
      ? Math.round((this.results.summary.working / this.results.summary.total) * 100)
      : 0;
    
    console.log('\n📊 FILO Health Platform - Complete Analysis Report');
    console.log('==================================================\n');
    
    // Infrastructure Summary
    console.log('🏗️  INFRASTRUCTURE:');
    console.log(`   API Gateway: ${this.results.infrastructure.apiGateway}`);
    console.log(`   Lambda Function: ${this.results.infrastructure.lambdaFunction}`);
    console.log(`   Auth Middleware: ${this.results.infrastructure.authMiddleware}`);
    console.log(`   CORS Enabled: ${this.results.infrastructure.corsEnabled}`);
    console.log(`   Environment: ${this.results.infrastructure.environment}\n`);
    
    // API Summary
    console.log('🎯 API SUMMARY:');
    console.log(`✅ Working: ${this.results.summary.working}/${this.results.summary.total}`);
    console.log(`❌ Broken: ${this.results.summary.broken}/${this.results.summary.total}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🔍 Auto-discovered: ${this.results.summary.discovered} additional endpoints\n`);
    
    // Category breakdown
    const categories = {};
    this.results.endpoints.forEach(endpoint => {
      const cat = endpoint.category || 'Other';
      if (!categories[cat]) categories[cat] = { working: 0, total: 0 };
      categories[cat].total++;
      if (endpoint.working) categories[cat].working++;
    });
    
    console.log('📈 BY CATEGORY:');
    Object.keys(categories).forEach(cat => {
      const stats = categories[cat];
      const rate = Math.round((stats.working / stats.total) * 100);
      console.log(`   ${cat}: ${stats.working}/${stats.total} (${rate}%)`);
    });
    
    // Performance metrics
    const workingEndpoints = this.results.endpoints.filter(e => e.working);
    if (workingEndpoints.length > 0) {
      const responseTimes = workingEndpoints.map(e => e.responseTime);
      const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      const minTime = Math.min(...responseTimes);
      const maxTime = Math.max(...responseTimes);
      
      console.log('\n⚡ PERFORMANCE:');
      console.log(`   Average Response: ${avgTime}ms`);
      console.log(`   Fastest: ${minTime}ms`);
      console.log(`   Slowest: ${maxTime}ms`);
    }
    
    this.results.status = successRate >= 95 ? 'excellent' : successRate >= 80 ? 'good' : 'needs-attention';
    
    console.log(`\n🎯 OVERALL STATUS: ${this.results.status.toUpperCase()}`);
  }

  saveAllResults() {
    // Complete analysis
    fs.writeFileSync('API_ANALYSIS_COMPLETE.json', JSON.stringify(this.results, null, 2));
    
    // OpenAPI/Swagger spec
    const openapi = this.generateOpenAPI();
    fs.writeFileSync('API_OPENAPI_SPEC.json', JSON.stringify(openapi, null, 2));
    
    // GitHub Actions friendly summary
    const summary = {
      timestamp: this.results.timestamp,
      infrastructure: this.results.infrastructure,
      summary: this.results.summary,
      status: this.results.status,
      successRate: Math.round((this.results.summary.working / this.results.summary.total) * 100),
      categories: this.getCategoryStats()
    };
    fs.writeFileSync('API_SUMMARY.json', JSON.stringify(summary, null, 2));
    
    console.log('\n💾 SAVED FILES:');
    console.log('   📋 API_ANALYSIS_COMPLETE.json - Full analysis');
    console.log('   📋 API_OPENAPI_SPEC.json - OpenAPI specification');
    console.log('   📋 API_SUMMARY.json - Summary for automation');
  }

  getCategoryStats() {
    const categories = {};
    this.results.endpoints.forEach(endpoint => {
      const cat = endpoint.category || 'Other';
      if (!categories[cat]) categories[cat] = { working: 0, total: 0 };
      categories[cat].total++;
      if (endpoint.working) categories[cat].working++;
    });
    return categories;
  }

  generateOpenAPI() {
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: 'FILO Health Platform API',
        version: '1.0.0',
        description: 'AI-powered health intelligence platform with proxy integration',
        contact: {
          name: 'FILO Health Platform',
          url: 'https://deebyrne26.github.io/health-platform/'
        }
      },
      servers: [
        {
          url: this.baseURL,
          description: 'Production API Gateway (AWS Lambda Proxy)'
        }
      ],
      paths: {},
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'JWT token (dev mode: optional - falls back to demo user)'
          }
        }
      }
    };
    
    this.results.endpoints.forEach(endpoint => {
      const path = endpoint.path.split('?')[0];
      if (!openapi.paths[path]) openapi.paths[path] = {};
      
      openapi.paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        tags: [endpoint.category || 'General'],
        responses: {
          [endpoint.status]: {
            description: endpoint.working ? 'Success' : 'Error',
            content: {
              'application/json': {
                schema: {
                  type: endpoint.dataType || 'object'
                }
              }
            }
          }
        },
        security: endpoint.requiresAuth ? [{ BearerAuth: [] }] : []
      };
    });
    
    return openapi;
  }
}

// Run the complete analysis
const analyzer = new ComprehensiveAPIAnalyzer();
analyzer.analyzeAPIs().catch(console.error);
