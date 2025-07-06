#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

class ComprehensiveDocumentationGenerator {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.baseURL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.docs = {
      platform: {
        name: 'FILO Health Platform',
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        architecture: 'Full-Stack React + AWS Lambda',
        status: 'Active Development'
      },
      apis: {
        endpoints: [],
        workingCount: 0,
        totalCount: 0,
        baseURL: this.baseURL
      },
      components: {
        shared: [],
        pages: [],
        hooks: [],
        utilities: []
      },
      database: {
        tables: [],
        relationships: [],
        seedData: {}
      },
      environment: {
        lambda: [],
        local: [],
        required: []
      },
      deployment: {
        frontend: 'AWS Amplify',
        backend: 'AWS Lambda',
        database: 'PostgreSQL',
        cdn: 'CloudFront'
      }
    };
  }

  async generateComprehensiveDocumentation() {
    console.log('🚀 Generating Comprehensive Platform Documentation...\n');
    
    // Run all analysis in parallel for speed
    await Promise.all([
      this.analyzeCodebase(),
      this.testAllAPIs(),
      this.analyzeDatabaseStructure(),
      this.analyzeEnvironmentVariables()
    ]);
    
    this.generateMarkdownDocumentation();
    this.generateJSONSummary();
    
    console.log('✅ Comprehensive documentation generated successfully!');
    this.printSummary();
  }

  async analyzeCodebase() {
    console.log('📁 Analyzing codebase structure...');
    
    // Find all React components
    await this.findAllComponents();
    
    // Find custom hooks
    await this.findCustomHooks();
    
    // Find utility functions
    await this.findUtilities();
    
    // Analyze package.json files
    await this.analyzePackageFiles();
  }

  async findAllComponents() {
    const componentDirs = [
      path.join(this.rootPath, 'frontend', 'shared', 'components'),
      path.join(this.rootPath, 'frontend', 'web', 'components'),
      path.join(this.rootPath, 'frontend', 'web', 'features'),
      path.join(this.rootPath, 'frontend', 'web', 'pages'),
      path.join(this.rootPath, 'src', 'components'),
      path.join(this.rootPath, 'components')
    ];

    for (const dir of componentDirs) {
      if (fs.existsSync(dir)) {
        await this.scanDirectoryForComponents(dir);
      }
    }
  }

  async scanDirectoryForComponents(dirPath, category = 'shared') {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanDirectoryForComponents(itemPath, category);
        } else if (item.match(/\.(jsx?|tsx?)$/) && !item.includes('.test.')) {
          const component = await this.analyzeComponent(itemPath, category);
          if (component) {
            if (category === 'shared') {
              this.docs.components.shared.push(component);
            } else if (category === 'pages') {
              this.docs.components.pages.push(component);
            }
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error scanning ${dirPath}:`, error.message);
    }
  }

  async analyzeComponent(filePath, category) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      if (!this.isReactComponent(content)) return null;
      
      return {
        name: fileName,
        path: path.relative(this.rootPath, filePath),
        category,
        type: this.getComponentType(content),
        hooks: this.extractHooks(content),
        imports: this.extractImports(content),
        exports: this.extractExports(content),
        props: this.extractProps(content),
        size: this.getFileSize(filePath),
        lastModified: this.getLastModified(filePath)
      };
    } catch (error) {
      return null;
    }
  }

  isReactComponent(content) {
    // More sophisticated React component detection
    const reactPatterns = [
      /export\s+default\s+function\s+\w+/,
      /export\s+const\s+\w+\s*=\s*\(/,
      /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*return\s*\(/,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*return\s*\(/,
      /class\s+\w+\s+extends\s+React\.Component/
    ];
    
    return reactPatterns.some(pattern => pattern.test(content)) &&
           (content.includes('jsx') || content.includes('<') || content.includes('React'));
  }

  getComponentType(content) {
    if (content.includes('useState') || content.includes('useEffect')) return 'Functional (Hooks)';
    if (content.includes('class') && content.includes('extends')) return 'Class Component';
    if (content.includes('function') && content.includes('return')) return 'Functional';
    if (content.includes('=>') && content.includes('return')) return 'Arrow Function';
    return 'Component';
  }

  extractHooks(content) {
    const hooks = [];
    const hookMatches = content.match(/use[A-Z]\w+/g);
    if (hookMatches) {
      hooks.push(...[...new Set(hookMatches)]);
    }
    return hooks;
  }

  extractImports(content) {
    const imports = [];
    const importMatches = content.match(/import\s+.*?\s+from\s+['"][^'"]+['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const fromMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (fromMatch) {
          imports.push(fromMatch[1]);
        }
      });
    }
    return imports;
  }

  extractExports(content) {
    const exports = [];
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:function\s+)?(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const nameMatch = match.match(/(\w+)$/);
        if (nameMatch) {
          exports.push(nameMatch[1]);
        }
      });
    }
    return exports;
  }

  extractProps(content) {
    const props = [];
    // Try to find props destructuring
    const propsMatch = content.match(/\{\s*([^}]+)\s*\}\s*=\s*props/);
    if (propsMatch) {
      const propsList = propsMatch[1].split(',').map(prop => prop.trim());
      props.push(...propsList);
    }
    return props;
  }

  getFileSize(filePath) {
    try {
      const stat = fs.statSync(filePath);
      return `${(stat.size / 1024).toFixed(1)}KB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  getLastModified(filePath) {
    try {
      const stat = fs.statSync(filePath);
      return stat.mtime.toISOString().split('T')[0];
    } catch (error) {
      return 'Unknown';
    }
  }

  async findCustomHooks() {
    console.log('🎣 Finding custom hooks...');
    
    const hookDirs = [
      path.join(this.rootPath, 'frontend', 'shared', 'hooks'),
      path.join(this.rootPath, 'src', 'hooks'),
      path.join(this.rootPath, 'hooks')
    ];

    for (const dir of hookDirs) {
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item.match(/^use[A-Z].*\.(js|ts)$/)) {
            const hookPath = path.join(dir, item);
            const hook = await this.analyzeHook(hookPath);
            if (hook) {
              this.docs.components.hooks.push(hook);
            }
          }
        }
      }
    }
  }

  async analyzeHook(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      return {
        name: fileName,
        path: path.relative(this.rootPath, filePath),
        dependencies: this.extractHooks(content),
        exports: this.extractExports(content),
        purpose: this.inferHookPurpose(content),
        size: this.getFileSize(filePath)
      };
    } catch (error) {
      return null;
    }
  }

  inferHookPurpose(content) {
    if (content.includes('fetch') || content.includes('api')) return 'API Integration';
    if (content.includes('localStorage') || content.includes('sessionStorage')) return 'Local Storage';
    if (content.includes('useState') && content.includes('useEffect')) return 'State Management';
    if (content.includes('useContext')) return 'Context Management';
    return 'Custom Logic';
  }

  async findUtilities() {
    console.log('🔧 Finding utility functions...');
    
    const utilDirs = [
      path.join(this.rootPath, 'frontend', 'shared', 'utils'),
      path.join(this.rootPath, 'backend', 'functions', 'api', 'utils'),
      path.join(this.rootPath, 'src', 'utils'),
      path.join(this.rootPath, 'utils')
    ];

    for (const dir of utilDirs) {
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item.match(/\.(js|ts)$/) && !item.includes('.test.')) {
            const utilPath = path.join(dir, item);
            const util = await this.analyzeUtility(utilPath);
            if (util) {
              this.docs.components.utilities.push(util);
            }
          }
        }
      }
    }
  }

  async analyzeUtility(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, path.extname(filePath));
      
      return {
        name: fileName,
        path: path.relative(this.rootPath, filePath),
        functions: this.extractFunctions(content),
        exports: this.extractExports(content),
        purpose: this.inferUtilityPurpose(fileName, content),
        size: this.getFileSize(filePath)
      };
    } catch (error) {
      return null;
    }
  }

  extractFunctions(content) {
    const functions = [];
    const functionMatches = content.match(/(?:export\s+)?(?:const|function)\s+(\w+)/g);
    if (functionMatches) {
      functionMatches.forEach(match => {
        const nameMatch = match.match(/(\w+)$/);
        if (nameMatch) {
          functions.push(nameMatch[1]);
        }
      });
    }
    return functions;
  }

  inferUtilityPurpose(fileName, content) {
    if (fileName.includes('auth')) return 'Authentication';
    if (fileName.includes('api')) return 'API Helpers';
    if (fileName.includes('date')) return 'Date/Time Utilities';
    if (fileName.includes('format')) return 'Data Formatting';
    if (fileName.includes('validation')) return 'Input Validation';
    if (content.includes('handleCors')) return 'CORS Handling';
    if (content.includes('response')) return 'Response Utilities';
    return 'General Utilities';
  }

  async testAllAPIs() {
    console.log('🌐 Testing all API endpoints...');
    
    const endpoints = [
      // Core Platform APIs
      { path: '/api/v1/protocols', method: 'GET', category: 'Core', description: 'Get health protocols' },
      { path: '/api/v1/exposure-types', method: 'GET', category: 'Core', description: 'Get exposure types' },
      { path: '/api/v1/detox-types', method: 'GET', category: 'Core', description: 'Get detox types' },
      
      // Food APIs
      { path: '/api/v1/foods/search', method: 'GET', category: 'Foods', description: 'Search food database', 
        params: [{ name: 'search', value: 'chicken' }] },
      { path: '/api/v1/foods/by-protocol', method: 'GET', category: 'Foods', description: 'Get protocol foods',
        params: [{ name: 'protocol_id', value: '1495844a-19de-404c-a288-7660eda0cbe1' }] },
      
      // User APIs
      { path: '/api/v1/users/preferences', method: 'GET', category: 'User', description: 'Get user preferences',
        params: [{ name: 'userId', value: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0' }] },
      { path: '/api/v1/users/preferences', method: 'PUT', category: 'User', description: 'Update user preferences' },
      
      // Timeline APIs
      { path: '/api/v1/timeline/entries', method: 'GET', category: 'Timeline', description: 'Get timeline entries',
        params: [{ name: 'date', value: '2025-07-04' }] },
      { path: '/api/v1/timeline/entries', method: 'POST', category: 'Timeline', description: 'Create timeline entry' },
      
      // Reflection APIs
      { path: '/api/v1/reflections', method: 'GET', category: 'Reflection', description: 'Get daily reflections',
        params: [{ name: 'date', value: '2025-07-04' }, { name: 'userId', value: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0' }] },
      { path: '/api/v1/reflections', method: 'POST', category: 'Reflection', description: 'Save daily reflection' },
      
      // AI APIs
      { path: '/api/v1/correlations/insights', method: 'GET', category: 'AI', description: 'Get AI insights',
        params: [{ name: 'userId', value: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0' }] },
      { path: '/api/v1/correlations/analyze', method: 'POST', category: 'AI', description: 'Analyze correlations' },
      
      // Health Check
      { path: '/api/v1/health', method: 'GET', category: 'System', description: 'Health check' }
    ];

    this.docs.apis.totalCount = endpoints.length;
    
    for (const endpoint of endpoints) {
      await this.testAPIEndpoint(endpoint);
    }
  }

  async testAPIEndpoint(endpoint) {
    return new Promise((resolve) => {
      let testURL = `${this.baseURL}${endpoint.path}`;
      
      // Add query parameters for GET requests
      if (endpoint.method === 'GET' && endpoint.params) {
        const queryParams = endpoint.params.map(p => `${p.name}=${p.value}`).join('&');
        testURL += `?${queryParams}`;
      }

      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      };

      const req = https.request(testURL, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const apiDoc = {
              ...endpoint,
              status: res.statusCode,
              working: res.statusCode >= 200 && res.statusCode < 300,
              responseTime: Date.now() - startTime,
              responseSchema: this.generateResponseSchema(data),
              sampleResponse: this.generateSampleResponse(data)
            };
            
            this.docs.apis.endpoints.push(apiDoc);
            if (apiDoc.working) this.docs.apis.workingCount++;
            
            console.log(`${apiDoc.working ? '✅' : '❌'} ${endpoint.method} ${endpoint.path} - ${res.statusCode}`);
          } catch (error) {
            this.docs.apis.endpoints.push({
              ...endpoint,
              status: res.statusCode,
              working: false,
              error: 'Invalid JSON response'
            });
            console.log(`❌ ${endpoint.method} ${endpoint.path} - JSON Parse Error`);
          }
          resolve();
        });
      });

      const startTime = Date.now();

      req.on('error', () => {
        this.docs.apis.endpoints.push({
          ...endpoint,
          status: 500,
          working: false,
          error: 'Connection failed'
        });
        console.log(`❌ ${endpoint.method} ${endpoint.path} - Connection Failed`);
        resolve();
      });

      req.setTimeout(10000, () => {
        req.destroy();
        this.docs.apis.endpoints.push({
          ...endpoint,
          status: 408,
          working: false,
          error: 'Request timeout'
        });
        console.log(`❌ ${endpoint.method} ${endpoint.path} - Timeout`);
        resolve();
      });

      // Add test data for POST requests
      if (endpoint.method === 'POST') {
        const testData = this.generateTestData(endpoint);
        req.write(JSON.stringify(testData));
      }

      req.end();
    });
  }

  generateTestData(endpoint) {
    const testData = {
      userId: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
      date: '2025-07-04'
    };

    if (endpoint.path.includes('timeline')) {
      return {
        ...testData,
        entryType: 'food',
        content: 'Test food entry',
        entryTime: '12:00'
      };
    }

    if (endpoint.path.includes('reflection')) {
      return {
        ...testData,
        energy_level: 7,
        mood_level: 8,
        sleep_quality: 'good'
      };
    }

    if (endpoint.path.includes('preferences')) {
      return {
        ...testData,
        protocols: ['1495844a-19de-404c-a288-7660eda0cbe1']
      };
    }

    return testData;
  }

  generateResponseSchema(data) {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.getObjectSchema(data[0]) : { type: 'object' }
      };
    }
    return this.getObjectSchema(data);
  }

  getObjectSchema(obj) {
    if (!obj || typeof obj !== 'object') return { type: typeof obj };
    
    const schema = { type: 'object', properties: {} };
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (Array.isArray(value)) {
        schema.properties[key] = { 
          type: 'array', 
          items: { type: value.length > 0 ? typeof value[0] : 'unknown' }
        };
      } else if (typeof value === 'object' && value !== null) {
        schema.properties[key] = this.getObjectSchema(value);
      } else {
        schema.properties[key] = { type: typeof value };
      }
    });
    return schema;
  }

  generateSampleResponse(data) {
    if (Array.isArray(data)) {
      return data.slice(0, 2); // First 2 items
    }
    if (typeof data === 'object' && data !== null) {
      const sample = {};
      Object.keys(data).slice(0, 5).forEach(key => {
        sample[key] = data[key];
      });
      return sample;
    }
    return data;
  }

  async analyzeDatabaseStructure() {
    console.log('🗄️ Analyzing database structure...');
    
    // Try to get database info from API
    try {
      const schemaEndpoint = `${this.baseURL}/api/v1/database/schema`;
      // Since this might not exist, we'll infer from API responses
      await this.inferDatabaseFromAPIs();
    } catch (error) {
      console.log('ℹ️ Database schema endpoint not available, inferring from API responses');
      await this.inferDatabaseFromAPIs();
    }
  }

  async inferDatabaseFromAPIs() {
    // Infer database structure from API responses
    const workingAPIs = this.docs.apis.endpoints.filter(api => api.working);
    
    const tables = new Set();
    const relationships = [];
    
    workingAPIs.forEach(api => {
      if (api.path.includes('protocols')) tables.add('protocols');
      if (api.path.includes('foods')) tables.add('foods');
      if (api.path.includes('users')) tables.add('users');
      if (api.path.includes('timeline')) tables.add('timeline_entries');
      if (api.path.includes('reflections')) tables.add('reflections');
      if (api.path.includes('correlations')) tables.add('correlations');
      if (api.path.includes('exposure')) tables.add('exposure_types');
      if (api.path.includes('detox')) tables.add('detox_types');
    });

    this.docs.database.tables = Array.from(tables).map(table => ({
      name: table,
      estimated: true,
      source: 'API inference'
    }));

    // Add some known relationships
    this.docs.database.relationships = [
      { from: 'timeline_entries', to: 'users', type: 'many-to-one' },
      { from: 'reflections', to: 'users', type: 'many-to-one' },
      { from: 'foods', to: 'protocols', type: 'many-to-many' },
      { from: 'correlations', to: 'users', type: 'many-to-one' }
    ];
  }

  async analyzeEnvironmentVariables() {
    console.log('🔐 Analyzing environment variables...');
    
    // Check for .env files
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      'frontend/.env',
      'backend/.env'
    ];

    const localEnvVars = [];
    
    for (const envFile of envFiles) {
      const envPath = path.join(this.rootPath, envFile);
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const vars = envContent.split('\n')
            .filter(line => line.includes('=') && !line.startsWith('#'))
            .map(line => {
              const [key, ...valueParts] = line.split('=');
              return {
                key: key.trim(),
                hasValue: valueParts.join('=').trim().length > 0,
                file: envFile
              };
            });
          localEnvVars.push(...vars);
        } catch (error) {
          console.log(`⚠️ Could not read ${envFile}`);
        }
      }
    }

    // Check package.json for environment references
    const packagePaths = [
      'package.json',
      'frontend/package.json',
      'backend/package.json'
    ];

    const requiredEnvVars = [];
    
    for (const pkgPath of packagePaths) {
      const fullPath = path.join(this.rootPath, pkgPath);
      if (fs.existsSync(fullPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const scripts = JSON.stringify(pkg.scripts || {});
          const envMatches = scripts.match(/\$\{?(\w+)\}?/g);
          if (envMatches) {
            requiredEnvVars.push(...envMatches.map(match => match.replace(/\$\{?(\w+)\}?/, '$1')));
          }
        } catch (error) {
          // Package.json parse error
        }
      }
    }

    this.docs.environment.local = localEnvVars;
    this.docs.environment.required = [...new Set(requiredEnvVars)];
    
    // Lambda environment variables would need AWS CLI or be hardcoded
    this.docs.environment.lambda = [
      { key: 'NODE_ENV', estimated: true },
      { key: 'DATABASE_URL', estimated: true },
      { key: 'JWT_SECRET', estimated: true }
    ];
  }

  async analyzePackageFiles() {
    console.log('📦 Analyzing package files...');
    
    const packagePaths = [
      'package.json',
      'frontend/package.json', 
      'backend/package.json'
    ];

    for (const pkgPath of packagePaths) {
      const fullPath = path.join(this.rootPath, pkgPath);
      if (fs.existsSync(fullPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          // Store package info for documentation
          this.docs.packages = this.docs.packages || {};
          this.docs.packages[pkgPath] = {
            name: pkg.name,
            version: pkg.version,
            scripts: Object.keys(pkg.scripts || {}),
            dependencies: Object.keys(pkg.dependencies || {}),
            devDependencies: Object.keys(pkg.devDependencies || {})
          };
        } catch (error) {
          console.log(`⚠️ Could not parse ${pkgPath}`);
        }
      }
    }
  }

  generateMarkdownDocumentation() {
    console.log('📝 Generating markdown documentation...');
    
    const workingAPIs = this.docs.apis.endpoints.filter(api => api.working);
    const apisByCategory = workingAPIs.reduce((acc, api) => {
      if (!acc[api.category]) acc[api.category] = [];
      acc[api.category].push(api);
      return acc;
    }, {});

    const markdown = `# FILO Health Platform - Complete Documentation

## Platform Overview

**Architecture:** ${this.docs.platform.architecture}  
**Status:** ${this.docs.platform.status}  
**Version:** ${this.docs.platform.version}  
**Last Updated:** ${new Date(this.docs.platform.lastUpdated).toLocaleDateString()}

## 📊 Platform Statistics

- **Frontend Components:** ${this.docs.components.shared.length} shared, ${this.docs.components.pages.length} pages
- **Custom Hooks:** ${this.docs.components.hooks.length}
- **Utility Functions:** ${this.docs.components.utilities.length}
- **API Endpoints:** ${this.docs.apis.workingCount}/${this.docs.apis.totalCount} working
- **Database Tables:** ${this.docs.database.tables.length} (estimated)
- **Environment Variables:** ${this.docs.environment.local.length} local, ${this.docs.environment.lambda.length} lambda

## 🌐 API Documentation

**Base URL:** \`${this.docs.apis.baseURL}\`  
**Working Endpoints:** ${this.docs.apis.workingCount}/${this.docs.apis.totalCount}

${Object.keys(apisByCategory).map(category => `### ${category} APIs

${apisByCategory[category].map(api => `#### ${api.method} ${api.path}
**Status:** ${api.working ? '✅ Working' : '❌ Failed'} (${api.status})  
**Description:** ${api.description}  
${api.responseTime ? `**Response Time:** ${api.responseTime}ms` : ''}

${api.params ? `**Parameters:**
${api.params.map(p => `- \`${p.name}\`: ${p.value}`).join('\n')}` : ''}

**Example:**
\`\`\`bash
curl "${this.docs.apis.baseURL}${api.path}${api.params ? '?' + api.params.map(p => `${p.name}=${p.value}`).join('&') : ''}"
\`\`\`

${api.sampleResponse ? `**Sample Response:**
\`\`\`json
${JSON.stringify(api.sampleResponse, null, 2)}
\`\`\`

---` : '---'}`).join('\n\n')}`).join('\n\n')}

## ⚛️ Components Architecture

### Shared Components (${this.docs.components.shared.length})
${this.docs.components.shared.map(comp => `- **${comp.name}** (${comp.type}) - \`${comp.path}\`
  - Size: ${comp.size}
  - Hooks: ${comp.hooks.join(', ') || 'None'}
  - Last Modified: ${comp.lastModified}`).join('\n')}

### Custom Hooks (${this.docs.components.hooks.length})
${this.docs.components.hooks.map(hook => `- **${hook.name}** - ${hook.purpose}
  - Path: \`${hook.path}\`
  - Size: ${hook.size}
  - Dependencies: ${hook.dependencies.join(', ') || 'None'}`).join('\n')}

### Utility Functions (${this.docs.components.utilities.length})
${this.docs.components.utilities.map(util => `- **${util.name}** - ${util.purpose}
  - Path: \`${util.path}\`
  - Functions: ${util.functions.join(', ') || 'None'}
  - Size: ${util.size}`).join('\n')}

## 🗄️ Database Structure

### Tables (${this.docs.database.tables.length})
${this.docs.database.tables.map(table => `- **${table.name}** ${table.estimated ? '(estimated)' : ''}`).join('\n')}

### Relationships (${this.docs.database.relationships.length})
${this.docs.database.relationships.map(rel => `- **${rel.from}** → **${rel.to}** (${rel.type})`).join('\n')}

## 🔐 Environment Configuration

### Local Environment (${this.docs.environment.local.length})
${this.docs.environment.local.map(env => `- **${env.key}** ${env.hasValue ? '✅' : '❌'} (${env.file})`).join('\n')}

### Lambda Environment (${this.docs.environment.lambda.length})
${this.docs.environment.lambda.map(env => `- **${env.key}** ${env.estimated ? '(estimated)' : ''}`).join('\n')}

### Required Variables (${this.docs.environment.required.length})
${this.docs.environment.required.map(env => `- **${env}**`).join('\n')}

## 🚀 Deployment

- **Frontend:** ${this.docs.deployment.frontend}
- **Backend:** ${this.docs.deployment.backend}  
- **Database:** ${this.docs.deployment.database}
- **CDN:** ${this.docs.deployment.cdn}

## 📦 Package Information

${this.docs.packages ? Object.keys(this.docs.packages).map(pkg => {
  const pkgInfo = this.docs.packages[pkg];
  return `### ${pkg}
- **Name:** ${pkgInfo.name}
- **Version:** ${pkgInfo.version}
- **Scripts:** ${pkgInfo.scripts.join(', ')}
- **Dependencies:** ${pkgInfo.dependencies.length}
- **Dev Dependencies:** ${pkgInfo.devDependencies.length}`;
}).join('\n\n') : 'No package information available'}

## 🔧 Quick Start

1. **Clone & Install:**
   \`\`\`bash
   git clone <repository>
   npm install
   \`\`\`

2. **Test API Connection:**
   \`\`\`bash
   curl ${this.docs.apis.baseURL}/api/v1/protocols
   \`\`\`

3. **Start Development:**
   \`\`\`bash
   npm run dev
   \`\`\`

---
*Generated automatically on ${new Date().toLocaleDateString()} by Comprehensive Documentation Generator*
`;

    fs.writeFileSync('PLATFORM_DOCUMENTATION.md', markdown);
  }

  generateJSONSummary() {
    const summary = {
      platform: this.docs.platform,
      stats: {
        components: {
          shared: this.docs.components.shared.length,
          pages: this.docs.components.pages.length,
          hooks: this.docs.components.hooks.length,
          utilities: this.docs.components.utilities.length
        },
        apis: {
          working: this.docs.apis.workingCount,
          total: this.docs.apis.totalCount,
          categories: [...new Set(this.docs.apis.endpoints.map(api => api.category))].length
        },
        database: {
          tables: this.docs.database.tables.length,
          relationships: this.docs.database.relationships.length
        },
        environment: {
          local: this.docs.environment.local.length,
          lambda: this.docs.environment.lambda.length,
          required: this.docs.environment.required.length
        }
      },
      fullDocs: this.docs
    };

    fs.writeFileSync('platform-summary.json', JSON.stringify(summary, null, 2));
  }

  printSummary() {
    console.log('\n📊 DOCUMENTATION SUMMARY');
    console.log('========================');
    console.log(`📱 Components: ${this.docs.components.shared.length} shared, ${this.docs.components.hooks.length} hooks, ${this.docs.components.utilities.length} utilities`);
    console.log(`🌐 APIs: ${this.docs.apis.workingCount}/${this.docs.apis.totalCount} working`);
    console.log(`🗄️ Database: ${this.docs.database.tables.length} tables, ${this.docs.database.relationships.length} relationships`);
    console.log(`🔐 Environment: ${this.docs.environment.local.length} local, ${this.docs.environment.lambda.length} lambda vars`);
    console.log('\n📁 Generated Files:');
    console.log('   - PLATFORM_DOCUMENTATION.md (Complete documentation)');
    console.log('   - platform-summary.json (Structured data)');
    console.log('\n✅ Ready for GitHub Actions deployment!');
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const generator = new ComprehensiveDocumentationGenerator(projectPath);
  generator.generateComprehensiveDocumentation();
}

module.exports = ComprehensiveDocumentationGenerator;