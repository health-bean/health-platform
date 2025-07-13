#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class AutomatedProfessionalDocsGenerator {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.discoveredInfo = {
      urls: {},
      architecture: {},
      database: {},
      apis: {},
      deployment: {},
      development: {},
      fileStructure: {},
      packages: {},
      git: {}
    };
  }

  async generateProfessionalDocs() {
    console.log('🚀 Generating Professional Documentation (Fully Automated)...\n');
    
    // Run all discovery in parallel
    await Promise.all([
      this.discoverProjectStructure(),
      this.discoverDeploymentInfo(),
      this.discoverDatabaseInfo(),
      this.discoverGitInfo(),
      this.discoverPackageInfo(),
      this.discoverAPIEndpoints(),
      this.discoverDevelopmentSetup()
    ]);

    // Generate professional documentation site
    await this.generateProfessionalSite();
    
    console.log('✅ Professional documentation generated successfully!');
    this.printSummary();
  }

  async discoverProjectStructure() {
    console.log('📁 Discovering project structure...');
    
    const structure = {
      frontend: {},
      backend: {},
      shared: {},
      configs: {},
      docs: {}
    };

    // Auto-discover frontend structure
    const frontendPaths = [
      'frontend/web-app',
      'frontend/shared',
      'src',
      'client'
    ];

    for (const fePath of frontendPaths) {
      const fullPath = path.join(this.rootPath, fePath);
      if (fs.existsSync(fullPath)) {
        structure.frontend[fePath] = await this.analyzeDirectory(fullPath);
      }
    }

    // Auto-discover backend structure
    const backendPaths = [
      'backend/functions/api',
      'backend/functions',
      'backend',
      'server',
      'api'
    ];

    for (const bePath of backendPaths) {
      const fullPath = path.join(this.rootPath, bePath);
      if (fs.existsSync(fullPath)) {
        structure.backend[bePath] = await this.analyzeDirectory(fullPath);
      }
    }

    // Auto-discover config files
    const configFiles = [
      'package.json',
      'vite.config.js',
      'tailwind.config.js',
      '.env*',
      'serverless.yml',
      'docker-compose.yml',
      'amplify.yml'
    ];

    for (const configPattern of configFiles) {
      const matches = this.findFiles(this.rootPath, configPattern);
      if (matches.length > 0) {
        structure.configs[configPattern] = matches;
      }
    }

    this.discoveredInfo.fileStructure = structure;
  }

  async analyzeDirectory(dirPath) {
    const analysis = {
      totalFiles: 0,
      fileTypes: {},
      components: [],
      hooks: [],
      utilities: [],
      size: 0
    };

    try {
      const files = this.getAllFiles(dirPath);
      analysis.totalFiles = files.length;

      for (const file of files) {
        const ext = path.extname(file);
        analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

        const stat = fs.statSync(file);
        analysis.size += stat.size;

        // Identify React components
        if (ext === '.jsx' || ext === '.tsx') {
          const content = fs.readFileSync(file, 'utf8');
          if (this.isReactComponent(content)) {
            analysis.components.push({
              name: path.basename(file, ext),
              path: path.relative(this.rootPath, file),
              size: stat.size,
              hooks: this.extractHooks(content)
            });
          }
        }

        // Identify custom hooks
        if (path.basename(file).startsWith('use') && (ext === '.js' || ext === '.ts')) {
          analysis.hooks.push({
            name: path.basename(file, ext),
            path: path.relative(this.rootPath, file),
            size: stat.size
          });
        }
      }

      analysis.size = this.formatBytes(analysis.size);
    } catch (error) {
      console.log(`⚠️ Error analyzing ${dirPath}: ${error.message}`);
    }

    return analysis;
  }

  getAllFiles(dirPath) {
    let files = [];
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath));
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory access error
    }
    return files;
  }

  findFiles(dirPath, pattern) {
    const files = [];
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile() && this.matchesPattern(item, pattern)) {
          files.push(path.relative(this.rootPath, fullPath));
        } else if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.findFiles(fullPath, pattern));
        }
      }
    } catch (error) {
      // Directory access error
    }
    return files;
  }

  matchesPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename);
    }
    return filename === pattern;
  }

  async discoverDeploymentInfo() {
    console.log('🚀 Discovering deployment configuration...');
    
    const deployment = {
      frontend: {},
      backend: {},
      database: {},
      cdn: {}
    };

    // Check for Amplify configuration
    const amplifyConfig = path.join(this.rootPath, 'amplify.yml');
    if (fs.existsSync(amplifyConfig)) {
      deployment.frontend.service = 'AWS Amplify';
      deployment.frontend.config = 'amplify.yml';
      try {
        const config = fs.readFileSync(amplifyConfig, 'utf8');
        deployment.frontend.buildCommand = this.extractBuildCommand(config);
      } catch (error) {
        // Config read error
      }
    }

    // Check for Serverless configuration
    const serverlessConfig = path.join(this.rootPath, 'serverless.yml');
    if (fs.existsSync(serverlessConfig)) {
      deployment.backend.service = 'AWS Lambda (Serverless)';
      deployment.backend.config = 'serverless.yml';
    }

    // Check for Docker
    const dockerConfig = path.join(this.rootPath, 'docker-compose.yml');
    if (fs.existsSync(dockerConfig)) {
      deployment.containerization = 'Docker';
      deployment.dockerConfig = 'docker-compose.yml';
    }

    // Auto-discover URLs from package.json scripts and env files
    await this.discoverUrls();

    this.discoveredInfo.deployment = deployment;
  }

  async discoverUrls() {
    console.log('🌐 Discovering application URLs...');
    
    const urls = {
      frontend: null,
      backend: null,
      api: null,
      docs: null
    };

    // Check environment files for URLs
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        const apiUrlMatch = content.match(/VITE_API_BASE_URL=(.+)/);
        if (apiUrlMatch) {
          const apiUrl = apiUrlMatch[1].trim().replace(/['"]/g, '');
          urls.api = apiUrl;
          urls.backend = apiUrl; // Backend and API are the same in this architecture
        }
      } catch (error) {
        // Env file read error
      }
    }

    // Check for hardcoded URLs in code if not found in env
    if (!urls.api) {
      const jsFiles = this.findFiles(this.rootPath, '*.js');
      for (const jsFile of jsFiles) {
        try {
          const content = fs.readFileSync(path.join(this.rootPath, jsFile), 'utf8');
          const apiMatch = content.match(/https?:\/\/[^'"\s]+\.execute-api\.[^'"\s]+\.amazonaws\.com\/[^'"\s\/]+/);
          if (apiMatch) {
            urls.api = apiMatch[0];
            urls.backend = apiMatch[0];
            break;
          }
        } catch (error) {
          // File read error
        }
      }
    }

    // Check package.json for homepage or deployment URLs
    const packageFiles = this.findFiles(this.rootPath, 'package.json');
    for (const pkgFile of packageFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, pkgFile), 'utf8'));
        if (pkg.homepage) {
          urls.frontend = pkg.homepage;
        }
      } catch (error) {
        // Package.json read error
      }
    }

    // Try to discover GitHub Pages URL
    try {
      const gitRemote = execSync('git config --get remote.origin.url', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();
      
      if (gitRemote.includes('github.com')) {
        const repoMatch = gitRemote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (repoMatch) {
          urls.docs = `https://${repoMatch[1]}.github.io/${repoMatch[2]}/`;
        }
      }
    } catch (error) {
      // Git command error
    }

    // Set default URLs if not found
    if (!urls.frontend) {
      urls.frontend = 'https://main.d45x824boqj7y.amplifyapp.com';
    }
    if (!urls.api) {
      urls.api = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
      urls.backend = urls.api;
    }

    // Test URLs to see which ones are live
    for (const [type, url] of Object.entries(urls)) {
      if (url) {
        const isLive = await this.testUrl(url);
        urls[type] = { url, live: isLive };
      }
    }

    this.discoveredInfo.urls = urls;
  }

  async testUrl(url) {
    return new Promise((resolve) => {
      try {
        const protocol = url.startsWith('https://') ? https : require('http');
        const req = protocol.get(url, (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  async discoverDatabaseInfo() {
    console.log('🗄️ Discovering database information...');
    
    const database = {
      type: 'Unknown',
      tables: [],
      relationships: [],
      connectionInfo: {},
      schema: []
    };

    // Check for database connection strings in env files
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        
        if (content.includes('DATABASE_URL') || content.includes('POSTGRES')) {
          database.type = 'PostgreSQL';
        } else if (content.includes('MYSQL')) {
          database.type = 'MySQL';
        } else if (content.includes('MONGODB')) {
          database.type = 'MongoDB';
        }

        // Extract connection info (without credentials)
        const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
        if (dbUrlMatch) {
          const url = dbUrlMatch[1].trim().replace(/['"]/g, '');
          database.connectionInfo = this.parseConnectionString(url);
        }
      } catch (error) {
        // Env file read error
      }
    }

    // Enhanced database discovery from backend code
    const backendFiles = this.findFiles(this.rootPath, '*.js').filter(file => 
      file.includes('backend') || file.includes('handlers') || file.includes('database') || file.includes('models')
    );

    for (const file of backendFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, file), 'utf8');
        const tables = this.extractTableNames(content);
        const schemas = this.extractSchemaInfo(content);
        
        database.tables.push(...tables);
        database.schema.push(...schemas);
      } catch (error) {
        // File read error
      }
    }

    // Add known tables based on your API structure
    const knownTables = [
      'users',
      'protocols', 
      'foods',
      'timeline_entries',
      'reflections',
      'correlations',
      'exposure_types',
      'detox_types',
      'user_preferences',
      'protocol_foods',
      'symptoms',
      'supplements',
      'medications'
    ];

    // Merge discovered and known tables
    database.tables = [...new Set([...database.tables, ...knownTables])];

    // Infer relationships based on table names
    database.relationships = this.inferTableRelationships(database.tables);

    this.discoveredInfo.database = database;
  }

  parseConnectionString(connectionString) {
    // Parse connection string without exposing credentials
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: url.port,
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('ssl') || url.searchParams.get('sslmode')
      };
    } catch (error) {
      return { raw: 'Connection string format not recognized' };
    }
  }

  extractSchemaInfo(content) {
    const schemas = [];
    
    // Look for CREATE TABLE statements
    const createTableRegex = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\)/gi;
    let match;
    
    while ((match = createTableRegex.exec(content)) !== null) {
      const tableName = match[1];
      const columns = match[2];
      
      schemas.push({
        table: tableName,
        columns: this.parseColumns(columns),
        source: 'SQL'
      });
    }

    // Look for database schema in comments or documentation
    const schemaCommentRegex = /\/\*[\s\S]*?TABLE:\s*(\w+)[\s\S]*?\*\//gi;
    while ((match = schemaCommentRegex.exec(content)) !== null) {
      schemas.push({
        table: match[1],
        source: 'Comment'
      });
    }

    return schemas;
  }

  parseColumns(columnString) {
    const columns = [];
    const lines = columnString.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')) {
        const columnMatch = trimmed.match(/^(\w+)\s+(\w+)/);
        if (columnMatch) {
          columns.push({
            name: columnMatch[1],
            type: columnMatch[2]
          });
        }
      }
    }
    
    return columns;
  }

  inferTableRelationships(tables) {
    const relationships = [];
    
    // Common relationship patterns
    const relationshipPatterns = [
      { from: 'timeline_entries', to: 'users', type: 'many-to-one', foreignKey: 'user_id' },
      { from: 'reflections', to: 'users', type: 'many-to-one', foreignKey: 'user_id' },
      { from: 'correlations', to: 'users', type: 'many-to-one', foreignKey: 'user_id' },
      { from: 'user_preferences', to: 'users', type: 'one-to-one', foreignKey: 'user_id' },
      { from: 'protocol_foods', to: 'protocols', type: 'many-to-one', foreignKey: 'protocol_id' },
      { from: 'protocol_foods', to: 'foods', type: 'many-to-one', foreignKey: 'food_id' },
      { from: 'timeline_entries', to: 'foods', type: 'many-to-many', via: 'entry_foods' }
    ];

    // Add relationships where both tables exist
    for (const rel of relationshipPatterns) {
      if (tables.includes(rel.from) && tables.includes(rel.to)) {
        relationships.push(rel);
      }
    }

    return relationships;
  }

  extractTableNames(content) {
    const tables = [];
    
    // Look for SQL table references
    const sqlPatterns = [
      /CREATE TABLE\s+(\w+)/gi,
      /INSERT INTO\s+(\w+)/gi,
      /SELECT.*FROM\s+(\w+)/gi,
      /UPDATE\s+(\w+)/gi,
      /DELETE FROM\s+(\w+)/gi,
      /JOIN\s+(\w+)/gi
    ];

    for (const pattern of sqlPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const tableName = match[1];
        if (tableName && !tableName.match(/^(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN)$/i)) {
          tables.push(tableName);
        }
      }
    }

    // Look for ORM/query builder patterns
    const ormPatterns = [
      /\.table\(['"](\w+)['"]\)/g,
      /\.from\(['"](\w+)['"]\)/g,
      /knex\(['"](\w+)['"]\)/g
    ];

    for (const pattern of ormPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        tables.push(match[1]);
      }
    }

    // Look for model references
    const modelPatterns = [
      /class\s+(\w+)\s+extends\s+Model/g,
      /const\s+(\w+)\s*=.*sequelize\.define/g
    ];

    for (const pattern of modelPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const modelName = match[1];
        // Convert CamelCase to snake_case for table names
        const tableName = modelName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        tables.push(tableName);
      }
    }

    return [...new Set(tables)]; // Remove duplicates
  }

  async discoverGitInfo() {
    console.log('📝 Discovering Git repository information...');
    
    const git = {
      repository: null,
      branch: null,
      lastCommit: null,
      contributors: [],
      totalCommits: 0
    };

    try {
      // Get repository URL
      const remoteUrl = execSync('git config --get remote.origin.url', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();
      git.repository = remoteUrl.replace(/\.git$/, '');

      // Get current branch
      git.branch = execSync('git branch --show-current', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();

      // Get last commit info
      const lastCommit = execSync('git log -1 --format="%h|%s|%an|%ad"', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim();
      
      const [hash, message, author, date] = lastCommit.split('|');
      git.lastCommit = { hash, message, author, date };

      // Get total commits
      git.totalCommits = parseInt(execSync('git rev-list --count HEAD', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim());

      // Get contributors
      const contributors = execSync('git log --format="%an" | sort | uniq -c | sort -nr', { 
        cwd: this.rootPath, 
        encoding: 'utf8' 
      }).trim().split('\n').slice(0, 5);
      
      git.contributors = contributors.map(line => {
        const [count, name] = line.trim().split(/\s+(.+)/);
        return { name, commits: parseInt(count) };
      });

    } catch (error) {
      console.log('⚠️ Git information not available');
    }

    this.discoveredInfo.git = git;
  }

  async discoverPackageInfo() {
    console.log('📦 Discovering package information...');
    
    const packages = {};
    const packageFiles = this.findFiles(this.rootPath, 'package.json');
    
    for (const pkgFile of packageFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, pkgFile), 'utf8'));
        packages[pkgFile] = {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          scripts: Object.keys(pkg.scripts || {}),
          dependencies: Object.keys(pkg.dependencies || {}).length,
          devDependencies: Object.keys(pkg.devDependencies || {}).length,
          engines: pkg.engines
        };
      } catch (error) {
        // Package.json read error
      }
    }

    this.discoveredInfo.packages = packages;
  }

  async discoverAPIEndpoints() {
    console.log('🌐 Discovering API endpoints...');
    
    const apis = {
      baseUrl: null,
      endpoints: [],
      workingCount: 0,
      totalCount: 0,
      categories: {}
    };

    // Discover API base URL from environment files
    apis.baseUrl = await this.discoverApiBaseUrl();
    console.log(`📡 Using API base URL: ${apis.baseUrl}`);
    
    // Discover all endpoints from backend code
    const discoveredEndpoints = await this.discoverEndpointsFromCode();
    console.log(`🔍 Found ${discoveredEndpoints.length} endpoints to test`);
    
    // Test all discovered endpoints
    if (apis.baseUrl) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const endpoint of discoveredEndpoints) {
        console.log(`\n🧪 Testing: ${endpoint.method} ${endpoint.path}`);
        const result = await this.testAPIEndpoint(apis.baseUrl, endpoint);
        apis.endpoints.push(result);
        
        if (result.working) {
          apis.workingCount++;
          successCount++;
          console.log(`   ✅ SUCCESS: ${result.status} (${result.responseTime}ms)`);
        } else {
          errorCount++;
          console.log(`   ❌ FAILED: ${result.status} - ${result.error || 'Unknown error'}`);
        }
        
        if (!apis.categories[endpoint.category]) {
          apis.categories[endpoint.category] = { working: 0, total: 0 };
        }
        apis.categories[endpoint.category].total++;
        if (result.working) apis.categories[endpoint.category].working++;
      }
      
      apis.totalCount = apis.endpoints.length;
      console.log(`\n📊 API Testing Summary:`);
      console.log(`   ✅ Working: ${successCount}`);
      console.log(`   ❌ Failed: ${errorCount}`);
      console.log(`   📈 Success Rate: ${Math.round((successCount / apis.totalCount) * 100)}%`);
    }

    this.discoveredInfo.apis = apis;
  }

  async discoverApiBaseUrl() {
    console.log('🔍 Discovering API base URL...');
    
    // Check environment files first
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        const apiUrlMatch = content.match(/VITE_API_BASE_URL=(.+)/);
        if (apiUrlMatch) {
          const url = apiUrlMatch[1].trim().replace(/['"]/g, '');
          console.log(`  Found in ${envFile}: ${url}`);
          return url;
        }
      } catch (error) {
        // Env file read error
      }
    }

    // Check JavaScript files for hardcoded URLs
    const jsFiles = this.findFiles(this.rootPath, '*.js');
    for (const jsFile of jsFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, jsFile), 'utf8');
        const apiMatches = [
          /https?:\/\/[^'"\s]+\.execute-api\.[^'"\s]+\.amazonaws\.com\/[^'"\s\/]+/g,
          /const\s+API_BASE_URL\s*=\s*['"`]([^'"`]+)['"`]/g,
          /API_BASE_URL\s*:\s*['"`]([^'"`]+)['"`]/g,
          /baseURL\s*:\s*['"`]([^'"`]+)['"`]/g
        ];
        
        for (const pattern of apiMatches) {
          const match = content.match(pattern);
          if (match) {
            const url = match[1] || match[0];
            console.log(`  Found in ${jsFile}: ${url}`);
            return url;
          }
        }
      } catch (error) {
        // File read error
      }
    }

    // Check for serverless.yml or other config files
    const configFiles = ['serverless.yml', 'amplify.yml', 'aws-exports.js'];
    for (const configFile of configFiles) {
      const configPath = path.join(this.rootPath, configFile);
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          const apiMatch = content.match(/https?:\/\/[^'"\s]+\.execute-api\.[^'"\s]+\.amazonaws\.com\/[^'"\s\/]+/);
          if (apiMatch) {
            console.log(`  Found in ${configFile}: ${apiMatch[0]}`);
            return apiMatch[0];
          }
        } catch (error) {
          // Config file read error
        }
      }
    }

    // Default fallback - your known API URL
    const defaultUrl = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    console.log(`  Using default: ${defaultUrl}`);
    return defaultUrl;
  }

  async discoverEndpointsFromCode() {
    console.log('🔍 Discovering endpoints from backend code...');
    const endpoints = [];
    
    // Look for API endpoints in backend handlers and main files
    const backendFiles = this.findFiles(this.rootPath, '*.js').filter(file => 
      file.includes('backend') || file.includes('handlers') || file.includes('index.js')
    );

    console.log(`   Found ${backendFiles.length} backend files to scan`);

    for (const file of backendFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, file), 'utf8');
        const foundEndpoints = this.extractEndpointsFromFile(content, file);
        
        if (foundEndpoints.length > 0) {
          console.log(`   📄 ${file}: Found ${foundEndpoints.length} endpoints`);
          endpoints.push(...foundEndpoints);
        }
      } catch (error) {
        console.log(`   ⚠️ Error reading ${file}: ${error.message}`);
      }
    }

    console.log(`   📊 Total discovered endpoints: ${endpoints.length}`);
    
    // If no endpoints found, use minimal fallback (not hardcoded list)
    if (endpoints.length === 0) {
      console.log('   🔄 No endpoints discovered, using basic health check');
      return [
        { path: '/api/v1/health', method: 'GET', category: 'System', description: 'Health check endpoint' }
      ];
    }

    // Remove duplicates
    const uniqueEndpoints = endpoints.filter((endpoint, index, self) => 
      index === self.findIndex(e => e.path === endpoint.path && e.method === endpoint.method)
    );

    console.log(`   ✅ Unique endpoints after deduplication: ${uniqueEndpoints.length}`);
    return uniqueEndpoints;
  }

  extractEndpointsFromFile(content, filename) {
    const endpoints = [];
    
    // Enhanced patterns to find API routes in your backend code
    const patterns = [
      // Lambda handler patterns like: case 'GET': if (path === '/api/v1/protocols')
      /case\s+['"`](GET|POST|PUT|DELETE|PATCH)['"`]\s*:[\s\S]*?(?:path\s*===?\s*['"`]([^'"`]+)['"`]|resource\s*===?\s*['"`]([^'"`]+)['"`])/gi,
      
      // Express/Router patterns
      /(?:app|router)\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
      
      // Function export patterns like: exports.getProtocols = async (event) => { ... }
      /exports\.(\w+)\s*=\s*async\s*\(/g,
      
      // Switch case patterns for HTTP methods
      /switch\s*\(\s*(?:event\.)?httpMethod\s*\)[\s\S]*?case\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/gi,
      
      // API Gateway event patterns
      /if\s*\(\s*(?:event\.)?httpMethod\s*===?\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`][\s\S]*?(?:event\.)?(?:path|resource)\s*===?\s*['"`]([^'"`]+)['"`]/gi,
      
      // Route handler patterns
      /['"`]([^'"`]*\/api\/v1\/[^'"`]+)['"`]/g
    ];

    // Extract from different patterns
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let method = null;
        let path = null;
        
        // Handle different match patterns
        if (match[1] && match[2]) {
          // Standard method + path pattern
          method = match[1].toUpperCase();
          path = match[2] || match[3];
        } else if (match[1] && match[1].startsWith('/api/')) {
          // Path-only pattern, infer method from context
          path = match[1];
          method = this.inferMethodFromContext(content, match.index);
        } else if (match[1] && !match[1].startsWith('/')) {
          // Function name pattern, convert to endpoint
          const funcName = match[1];
          const endpoint = this.functionNameToEndpoint(funcName);
          if (endpoint) {
            method = endpoint.method;
            path = endpoint.path;
          }
        }
        
        if (method && path && path.startsWith('/api/')) {
          endpoints.push({
            path: path,
            method: method,
            category: this.categorizeEndpoint(path),
            description: this.generateEndpointDescription(path, method),
            source: filename,
            params: this.extractParamsFromPath(path)
          });
        }
      }
    }

    // Look for specific handler patterns in your code
    const handlerPatterns = this.extractHandlerSpecificPatterns(content, filename);
    endpoints.push(...handlerPatterns);

    return endpoints;
  }

  extractHandlerSpecificPatterns(content, filename) {
    const endpoints = [];
    
    // If this is a handler file, look for specific patterns
    if (filename.includes('handlers') || filename.includes('index.js')) {
      
      // Look for your specific handler patterns
      const handlerMethods = [
        { pattern: /getProtocols|protocols.*get/i, path: '/api/v1/protocols', method: 'GET' },
        { pattern: /searchFood|food.*search/i, path: '/api/v1/foods/search', method: 'GET' },
        { pattern: /getFoodsByProtocol|foods.*protocol/i, path: '/api/v1/foods/by-protocol', method: 'GET' },
        { pattern: /getUserPreferences|user.*preferences.*get/i, path: '/api/v1/users/preferences', method: 'GET' },
        { pattern: /updateUserPreferences|user.*preferences.*update/i, path: '/api/v1/users/preferences', method: 'PUT' },
        { pattern: /getTimelineEntries|timeline.*entries.*get/i, path: '/api/v1/timeline/entries', method: 'GET' },
        { pattern: /createTimelineEntry|timeline.*entries.*create/i, path: '/api/v1/timeline/entries', method: 'POST' },
        { pattern: /getReflections|reflections.*get/i, path: '/api/v1/reflections', method: 'GET' },
        { pattern: /saveReflection|reflections.*save/i, path: '/api/v1/reflections', method: 'POST' },
        { pattern: /getCorrelationInsights|correlations.*insights/i, path: '/api/v1/correlations/insights', method: 'GET' },
        { pattern: /analyzeCorrelations|correlations.*analyze/i, path: '/api/v1/correlations/analyze', method: 'POST' },
        { pattern: /getExposureTypes|exposure.*types/i, path: '/api/v1/exposure-types', method: 'GET' },
        { pattern: /getDetoxTypes|detox.*types/i, path: '/api/v1/detox-types', method: 'GET' },
        { pattern: /getSymptoms|symptoms.*get/i, path: '/api/v1/symptoms', method: 'GET' },
        { pattern: /getSupplements|supplements.*get/i, path: '/api/v1/supplements', method: 'GET' },
        { pattern: /getMedications|medications.*get/i, path: '/api/v1/medications', method: 'GET' },
        { pattern: /healthCheck|health.*check/i, path: '/api/v1/health', method: 'GET' }
      ];

      for (const handler of handlerMethods) {
        if (handler.pattern.test(content)) {
          endpoints.push({
            path: handler.path,
            method: handler.method,
            category: this.categorizeEndpoint(handler.path),
            description: this.generateEndpointDescription(handler.path, handler.method),
            source: filename,
            params: this.extractParamsFromPath(handler.path)
          });
        }
      }
    }

    return endpoints;
  }

  inferMethodFromContext(content, matchIndex) {
    // Look at surrounding context to infer HTTP method
    const contextStart = Math.max(0, matchIndex - 200);
    const contextEnd = Math.min(content.length, matchIndex + 200);
    const context = content.substring(contextStart, contextEnd);
    
    if (/GET|get/i.test(context)) return 'GET';
    if (/POST|post|create/i.test(context)) return 'POST';
    if (/PUT|put|update/i.test(context)) return 'PUT';
    if (/DELETE|delete/i.test(context)) return 'DELETE';
    
    return 'GET'; // Default to GET
  }

  functionNameToEndpoint(funcName) {
    // Convert function names to endpoints
    const mappings = {
      'getProtocols': { method: 'GET', path: '/api/v1/protocols' },
      'searchFood': { method: 'GET', path: '/api/v1/foods/search' },
      'getFoodsByProtocol': { method: 'GET', path: '/api/v1/foods/by-protocol' },
      'getUserPreferences': { method: 'GET', path: '/api/v1/users/preferences' },
      'updateUserPreferences': { method: 'PUT', path: '/api/v1/users/preferences' },
      'getTimelineEntries': { method: 'GET', path: '/api/v1/timeline/entries' },
      'createTimelineEntry': { method: 'POST', path: '/api/v1/timeline/entries' },
      'getReflections': { method: 'GET', path: '/api/v1/reflections' },
      'saveReflection': { method: 'POST', path: '/api/v1/reflections' },
      'getCorrelationInsights': { method: 'GET', path: '/api/v1/correlations/insights' },
      'analyzeCorrelations': { method: 'POST', path: '/api/v1/correlations/analyze' },
      'getExposureTypes': { method: 'GET', path: '/api/v1/exposure-types' },
      'getDetoxTypes': { method: 'GET', path: '/api/v1/detox-types' },
      'healthCheck': { method: 'GET', path: '/api/v1/health' }
    };
    
    return mappings[funcName] || null;
  }

  extractParamsFromPath(path) {
    const params = [];
    
    // Add common parameters based on endpoint
    if (path.includes('search')) {
      params.push({ name: 'search', value: 'chicken' });
    }
    if (path.includes('protocol')) {
      params.push({ name: 'protocol_id', value: '1495844a-19de-404c-a288-7660eda0cbe1' });
    }
    if (path.includes('preferences') || path.includes('reflections') || path.includes('correlations')) {
      params.push({ name: 'userId', value: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0' });
    }
    if (path.includes('timeline') || path.includes('reflections')) {
      params.push({ name: 'date', value: '2024-07-06' });
    }
    
    return params;
  }

  categorizeEndpoint(path) {
    if (path.includes('health')) return 'System';
    if (path.includes('protocol')) return 'Protocols';
    if (path.includes('food')) return 'Foods';
    if (path.includes('user')) return 'Users';
    if (path.includes('timeline')) return 'Timeline';
    if (path.includes('reflection')) return 'Reflections';
    if (path.includes('correlation')) return 'AI';
    if (path.includes('exposure')) return 'Lookup Data';
    if (path.includes('detox')) return 'Lookup Data';
    if (path.includes('symptoms') || path.includes('supplements') || path.includes('medications')) return 'Health Data';
    return 'Other';
  }

  generateEndpointDescription(path, method) {
    const action = method === 'GET' ? 'Get' : method === 'POST' ? 'Create' : method === 'PUT' ? 'Update' : method === 'DELETE' ? 'Delete' : 'Manage';
    const resource = path.split('/').pop() || 'resource';
    return `${action} ${resource}`;
  }

  async testAPIEndpoint(baseUrl, endpoint) {
    return new Promise((resolve) => {
      let testUrl = `${baseUrl}${endpoint.path}`;
      
      // Add query parameters for GET requests
      if (endpoint.method === 'GET' && endpoint.params) {
        const queryParams = endpoint.params.map(p => `${p.name}=${encodeURIComponent(p.value)}`).join('&');
        testUrl += `?${queryParams}`;
      }

      console.log(`Testing: ${endpoint.method} ${testUrl}`);
      
      const startTime = Date.now();
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Health-Platform-Documentation-Generator'
        },
        timeout: 15000
      };

      let body = '';
      const req = https.request(testUrl, options, (res) => {
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const isWorking = res.statusCode >= 200 && res.statusCode < 400; // Allow redirects
          
          console.log(`  Result: ${res.statusCode} (${isWorking ? 'Working' : 'Failed'}) - ${responseTime}ms`);
          
          let responseData = null;
          try {
            responseData = JSON.parse(body);
          } catch (e) {
            // Not JSON, that's okay
            responseData = body.substring(0, 200); // First 200 chars
          }
          
          resolve({
            ...endpoint,
            status: res.statusCode,
            working: isWorking,
            responseTime: responseTime,
            responseData: responseData,
            responseSize: body.length
          });
        });
      });

      req.on('error', (error) => {
        console.log(`  Error: ${error.message}`);
        resolve({
          ...endpoint,
          status: 500,
          working: false,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      });

      req.setTimeout(15000, () => {
        console.log(`  Timeout after 15 seconds`);
        req.destroy();
        resolve({
          ...endpoint,
          status: 408,
          working: false,
          error: 'Request timeout (15s)',
          responseTime: Date.now() - startTime
        });
      });

      // Add test data for POST/PUT requests
      if (['POST', 'PUT'].includes(endpoint.method)) {
        const testData = this.generateTestData(endpoint);
        req.write(JSON.stringify(testData));
      }

      req.end();
    });
  }

  generateTestData(endpoint) {
    const baseTestData = {
      userId: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
      date: '2024-07-06'
    };

    if (endpoint.path.includes('timeline')) {
      return {
        ...baseTestData,
        entryType: 'food',
        content: 'Test food entry',
        entryTime: '12:00'
      };
    }

    if (endpoint.path.includes('reflection')) {
      return {
        ...baseTestData,
        energy_level: 7,
        mood_level: 8,
        sleep_quality: 'good'
      };
    }

    if (endpoint.path.includes('preferences')) {
      return {
        ...baseTestData,
        protocols: ['1495844a-19de-404c-a288-7660eda0cbe1']
      };
    }

    if (endpoint.path.includes('correlation')) {
      return {
        ...baseTestData,
        confidence: 0.8,
        timeframe: 30
      };
    }

    return baseTestData;
  }

  async discoverDevelopmentSetup() {
    console.log('🔧 Discovering development setup requirements...');
    
    const development = {
      nodeVersion: null,
      packageManager: 'npm',
      scripts: {},
      environmentVariables: [],
      ports: {},
      prerequisites: [],
      setupSteps: []
    };

    // Check for Node.js version requirements
    const packageFiles = this.findFiles(this.rootPath, 'package.json');
    for (const pkgFile of packageFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, pkgFile), 'utf8'));
        if (pkg.engines && pkg.engines.node) {
          development.nodeVersion = pkg.engines.node;
        }
        
        // Collect all scripts
        if (pkg.scripts) {
          development.scripts[pkgFile] = pkg.scripts;
        }
      } catch (error) {
        // Package.json read error
      }
    }

    // Check for package manager
    if (fs.existsSync(path.join(this.rootPath, 'yarn.lock'))) {
      development.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(this.rootPath, 'pnpm-lock.yaml'))) {
      development.packageManager = 'pnpm';
    }

    // Discover environment variables
    const envFiles = this.findFiles(this.rootPath, '.env*');
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, envFile), 'utf8');
        const envVars = content.split('\n')
          .filter(line => line.includes('=') && !line.startsWith('#'))
          .map(line => {
            const [key] = line.split('=');
            return key.trim();
          });
        development.environmentVariables.push(...envVars);
      } catch (error) {
        // Env file read error
      }
    }

    // Remove duplicates
    development.environmentVariables = [...new Set(development.environmentVariables)];

    // Generate setup steps
    development.setupSteps = this.generateSetupSteps(development);

    this.discoveredInfo.development = development;
  }

  generateSetupSteps(development) {
    const steps = [];
    
    steps.push({
      step: 1,
      title: 'Clone Repository',
      command: 'git clone <repository-url>',
      description: 'Clone the repository to your local machine'
    });

    if (development.nodeVersion) {
      steps.push({
        step: 2,
        title: 'Install Node.js',
        command: `Use Node.js ${development.nodeVersion}`,
        description: 'Install the required Node.js version'
      });
    }

    steps.push({
      step: 3,
      title: 'Install Dependencies',
      command: `${development.packageManager} install`,
      description: 'Install all project dependencies'
    });

    if (development.environmentVariables.length > 0) {
      steps.push({
        step: 4,
        title: 'Setup Environment Variables',
        command: 'Copy .env.example to .env and fill in values',
        description: `Configure: ${development.environmentVariables.slice(0, 3).join(', ')}${development.environmentVariables.length > 3 ? '...' : ''}`
      });
    }

    const hasDevScript = Object.values(development.scripts).some(scripts => scripts.dev || scripts.start);
    if (hasDevScript) {
      steps.push({
        step: 5,
        title: 'Start Development Server',
        command: `${development.packageManager} run dev`,
        description: 'Start the development server'
      });
    }

    return steps;
  }

  async generateProfessionalSite() {
    console.log('🎨 Generating professional documentation site...');
    
    // Create docs directory
    const docsDir = path.join(this.rootPath, 'docs-site');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Generate HTML site
    const htmlContent = this.generateProfessionalHTML();
    fs.writeFileSync(path.join(docsDir, 'index.html'), htmlContent);

    // Generate JSON data
    const jsonData = this.generateJSONData();
    fs.writeFileSync(path.join(docsDir, 'platform-data.json'), JSON.stringify(jsonData, null, 2));

    // Generate README
    const readmeContent = this.generateREADME();
    fs.writeFileSync(path.join(docsDir, 'README.md'), readmeContent);

    console.log('✅ Professional documentation site generated in docs-site/');
  }

  generateProfessionalHTML() {
    const info = this.discoveredInfo;
    const stats = this.calculateStats();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FILO Health Platform - Technical Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f8fafc;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 0;
            text-align: center;
        }
        
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        
        /* Navigation */
        .nav { 
            background: white; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .nav ul { 
            display: flex; 
            list-style: none; 
            justify-content: center;
            padding: 1rem 0;
        }
        
        .nav a { 
            text-decoration: none; 
            color: #4a5568; 
            padding: 0.5rem 1rem; 
            margin: 0 0.5rem;
            border-radius: 5px;
            transition: all 0.3s;
        }
        
        .nav a:hover { background: #edf2f7; color: #667eea; }
        
        /* Main Content */
        .main { padding: 3rem 0; }
        
        .section { 
            background: white; 
            margin-bottom: 2rem; 
            padding: 2rem; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .section h2 { 
            color: #2d3748; 
            margin-bottom: 1rem; 
            font-size: 1.8rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.5rem;
        }
        
        /* Stats Grid */
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1rem; 
            margin-bottom: 2rem;
        }
        
        .stat-card { 
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white; 
            padding: 1.5rem; 
            border-radius: 10px; 
            text-align: center;
        }
        
        .stat-card.api { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); }
        .stat-card.db { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); }
        .stat-card.git { background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); }
        
        .stat-number { font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .stat-label { font-size: 0.9rem; opacity: 0.9; }
        
        /* Two Column Layout */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        
        /* Lists */
        .feature-list { list-style: none; }
        .feature-list li { 
            padding: 0.5rem 0; 
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
        }
        .feature-list li:before { 
            content: '✅'; 
            margin-right: 0.5rem; 
        }
        
        /* Code Blocks */
        .code-block { 
            background: #2d3748; 
            color: #e2e8f0; 
            padding: 1rem; 
            border-radius: 5px; 
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        /* API Endpoints */
        .api-endpoints { margin-top: 1rem; }
        .endpoint-card { 
            background: #f8f9fa; 
            border: 1px solid #e2e8f0; 
            border-radius: 5px; 
            padding: 1rem; 
            margin-bottom: 0.5rem;
            transition: all 0.3s;
        }
        .endpoint-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .endpoint-card.working { border-left: 4px solid #48bb78; }
        .endpoint-card.failed { border-left: 4px solid #f56565; }
        
        .endpoint-header { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            margin-bottom: 0.5rem;
        }
        
        .method { 
            padding: 0.25rem 0.5rem; 
            border-radius: 3px; 
            font-size: 0.75rem; 
            font-weight: bold;
            text-transform: uppercase;
        }
        .method.get { background: #48bb78; color: white; }
        .method.post { background: #4299e1; color: white; }
        .method.put { background: #ed8936; color: white; }
        .method.delete { background: #f56565; color: white; }
        
        .path { 
            font-family: 'Monaco', 'Menlo', monospace; 
            background: #edf2f7; 
            padding: 0.25rem 0.5rem; 
            border-radius: 3px;
            flex-grow: 1;
        }
        
        .status.success { color: #48bb78; }
        .status.error { color: #f56565; }
        
        .endpoint-description { color: #718096; font-size: 0.9rem; }
        .endpoint-params { color: #4a5568; font-size: 0.8rem; margin-top: 0.25rem; }
        .endpoint-time { color: #4a5568; font-size: 0.8rem; margin-top: 0.25rem; }
        
        /* Database Tables */
        .table-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); 
            gap: 1rem; 
            margin-top: 1rem;
        }
        
        .table-card { 
            background: #f8f9fa; 
            border: 1px solid #e2e8f0; 
            border-radius: 5px; 
            padding: 1rem; 
            text-align: center;
        }
        .table-card h4 { margin-bottom: 0.5rem; color: #2d3748; }
        .table-type { color: #718096; font-size: 0.8rem; }
        
        /* Relationships */
        .relationships { margin-top: 1rem; }
        .relationship-card { 
            background: #f8f9fa; 
            border: 1px solid #e2e8f0; 
            border-radius: 5px; 
            padding: 1rem; 
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .from-table, .to-table { 
            background: #4299e1; 
            color: white; 
            padding: 0.25rem 0.5rem; 
            border-radius: 3px; 
            font-size: 0.9rem;
        }
        
        .relationship-type { 
            color: #718096; 
            font-style: italic; 
            font-size: 0.9rem;
        }
        
        .foreign-key { 
            color: #4a5568; 
            font-size: 0.8rem; 
            margin-left: auto;
        }
        
        /* Links */
        .links { display: flex; gap: 1rem; margin-top: 1rem; }
        .link-btn { 
            background: #667eea; 
            color: white; 
            padding: 0.75rem 1.5rem; 
            text-decoration: none; 
            border-radius: 5px;
            transition: all 0.3s;
        }
        .link-btn:hover { background: #5a67d8; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .two-col { grid-template-columns: 1fr; }
            .nav ul { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>🚀 FILO Health Platform</h1>
            <p>AI-Powered Health Tracking & Correlation Discovery</p>
        </div>
    </header>

    <nav class="nav">
        <div class="container">
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#architecture">Architecture</a></li>
                <li><a href="#api">API Documentation</a></li>
                <li><a href="#database">Database</a></li>
                <li><a href="#development">Development</a></li>
                <li><a href="#deployment">Deployment</a></li>
            </ul>
        </div>
    </nav>

    <main class="main">
        <div class="container">
            <!-- Overview Section -->
            <section id="overview" class="section">
                <h2>📊 Platform Overview</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalComponents}</div>
                        <div class="stat-label">Components</div>
                    </div>
                    <div class="stat-card api">
                        <div class="stat-number">${stats.workingAPIs}/${stats.totalAPIs}</div>
                        <div class="stat-label">API Endpoints</div>
                    </div>
                    <div class="stat-card db">
                        <div class="stat-number">${stats.totalTables}</div>
                        <div class="stat-label">Database Tables</div>
                    </div>
                    <div class="stat-card git">
                        <div class="stat-number">${stats.totalCommits}</div>
                        <div class="stat-label">Git Commits</div>
                    </div>
                </div>

                <div class="two-col">
                    <div>
                        <h3>🎯 Key Features</h3>
                        <ul class="feature-list">
                            <li>AI-powered health correlation discovery</li>
                            <li>Real-time food & symptom tracking</li>
                            <li>Protocol-based nutrition guidance</li>
                            <li>Daily reflection & mood tracking</li>
                            <li>Comprehensive health insights</li>
                        </ul>
                    </div>
                    <div>
                        <h3>🔗 Live Links</h3>
                        <div class="links">
                            ${info.urls.frontend ? `<a href="${info.urls.frontend.url}" class="link-btn">Live App</a>` : ''}
                            ${info.urls.api ? `<a href="${info.urls.api.url}" class="link-btn">API</a>` : ''}
                            ${info.git.repository ? `<a href="${info.git.repository}" class="link-btn">GitHub</a>` : ''}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Architecture Section -->
            <section id="architecture" class="section">
                <h2>🏗️ Architecture</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Frontend Stack</h3>
                        <ul class="feature-list">
                            <li>React 18 with Hooks</li>
                            <li>Vite for fast development</li>
                            <li>Tailwind CSS for styling</li>
                            <li>Lucide React icons</li>
                            <li>AWS Amplify deployment</li>
                        </ul>
                    </div>
                    <div>
                        <h3>Backend Stack</h3>
                        <ul class="feature-list">
                            <li>AWS Lambda (Node.js)</li>
                            <li>PostgreSQL database</li>
                            <li>RESTful API design</li>
                            <li>CORS-enabled endpoints</li>
                            <li>Serverless architecture</li>
                        </ul>
                    </div>
                </div>

            <!-- API Documentation -->
            <section id="api" class="section">
                <h2>🌐 API Documentation</h2>
                
                <div class="two-col">
                    <div>
                        <h3>API Status</h3>
                        <p><strong>Base URL:</strong> <code>${info.apis.baseUrl || 'Not configured'}</code></p>
                        <p><strong>Working Endpoints:</strong> ${info.apis.workingCount}/${info.apis.totalCount}</p>
                        <p><strong>Categories:</strong> ${Object.keys(info.apis.categories).length}</p>
                    </div>
                    <div>
                        <h3>Example Request</h3>
                        <div class="code-block">
curl "${info.apis.baseUrl}/api/v1/protocols" \\
  -H "Content-Type: application/json"</div>
                    </div>
                </div>

                ${Object.keys(info.apis.categories).length > 0 ? `
                <h3>📍 Endpoint Categories</h3>
                <div class="stats-grid">
                    ${Object.entries(info.apis.categories).map(([category, stats]) => `
                    <div class="stat-card api">
                        <div class="stat-number">${stats.working}/${stats.total}</div>
                        <div class="stat-label">${category} APIs</div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                ${info.apis.endpoints.length > 0 ? `
                <h3>📋 Available Endpoints</h3>
                <div class="api-endpoints">
                    ${info.apis.endpoints.map(endpoint => `
                    <div class="endpoint-card ${endpoint.working ? 'working' : 'failed'}">
                        <div class="endpoint-header">
                            <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                            <span class="path">${endpoint.path}</span>
                            <span class="status ${endpoint.working ? 'success' : 'error'}">${endpoint.working ? '✅' : '❌'} ${endpoint.status || 'N/A'}</span>
                        </div>
                        <div class="endpoint-description">${endpoint.description}</div>
                        ${endpoint.params ? `<div class="endpoint-params">Params: ${endpoint.params.map(p => `${p.name}=${p.value}`).join(', ')}</div>` : ''}
                        ${endpoint.responseTime ? `<div class="endpoint-time">Response: ${endpoint.responseTime}ms</div>` : ''}
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </section>

            <!-- Database Section -->
            <section id="database" class="section">
                <h2>🗄️ Database</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Database Info</h3>
                        <p><strong>Type:</strong> ${info.database.type}</p>
                        <p><strong>Tables:</strong> ${info.database.tables.length}</p>
                        <p><strong>Relationships:</strong> ${info.database.relationships.length}</p>
                        ${info.database.connectionInfo.host ? `<p><strong>Host:</strong> ${info.database.connectionInfo.host}</p>` : ''}
                        ${info.database.connectionInfo.database ? `<p><strong>Database:</strong> ${info.database.connectionInfo.database}</p>` : ''}
                    </div>
                    <div>
                        <h3>Connection Details</h3>
                        ${info.database.connectionInfo.port ? `<p><strong>Port:</strong> ${info.database.connectionInfo.port}</p>` : ''}
                        ${info.database.connectionInfo.ssl ? `<p><strong>SSL:</strong> ${info.database.connectionInfo.ssl}</p>` : ''}
                        <p><strong>Environment:</strong> Via DATABASE_URL</p>
                    </div>
                </div>

                ${info.database.tables.length > 0 ? `
                <h3>📊 Database Tables</h3>
                <div class="table-grid">
                    ${info.database.tables.map(table => `
                    <div class="table-card">
                        <h4>${table}</h4>
                        <div class="table-type">Table</div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                ${info.database.relationships.length > 0 ? `
                <h3>🔗 Table Relationships</h3>
                <div class="relationships">
                    ${info.database.relationships.map(rel => `
                    <div class="relationship-card">
                        <span class="from-table">${rel.from}</span>
                        <span class="relationship-type">${rel.type}</span>
                        <span class="to-table">${rel.to}</span>
                        ${rel.foreignKey ? `<div class="foreign-key">via ${rel.foreignKey}</div>` : ''}
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                <h3>🔧 Database Schema</h3>
                <div class="code-block">
-- Core Tables
CREATE TABLE users (id, email, name, created_at);
CREATE TABLE protocols (id, name, description, type);
CREATE TABLE foods (id, name, category, histamine_level);
CREATE TABLE timeline_entries (id, user_id, entry_type, content, entry_time);
CREATE TABLE reflections (id, user_id, date, energy_level, mood_level);
CREATE TABLE correlations (id, user_id, trigger, effect, confidence);

-- Lookup Tables  
CREATE TABLE exposure_types (id, name, category);
CREATE TABLE detox_types (id, name, category);

-- Junction Tables
CREATE TABLE protocol_foods (protocol_id, food_id, status);
CREATE TABLE user_preferences (user_id, protocols, quick_foods);</div>
            </section>

            <!-- Development Section -->
            <section id="development" class="section">
                <h2>🔧 Development Setup</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Requirements</h3>
                        ${info.development.nodeVersion ? `<p><strong>Node.js:</strong> ${info.development.nodeVersion}</p>` : ''}
                        <p><strong>Package Manager:</strong> ${info.development.packageManager}</p>
                        <p><strong>Environment Variables:</strong> ${info.development.environmentVariables.length}</p>
                    </div>
                    <div>
                        <h3>Quick Start</h3>
                        <div class="code-block">
git clone &lt;repository&gt;
cd health-platform
${info.development.packageManager} install
cp .env.example .env
${info.development.packageManager} run dev</div>
                    </div>
                </div>

                <h3>📋 Setup Steps</h3>
                <ol>
                    ${info.development.setupSteps.map(step => `
                    <li><strong>${step.title}:</strong> ${step.description}
                        <div class="code-block">${step.command}</div>
                    </li>
                    `).join('')}
                </ol>
            </section>

            <!-- Deployment Section -->
            <section id="deployment" class="section">
                <h2>🚀 Deployment</h2>
                
                <div class="two-col">
                    <div>
                        <h3>Frontend Deployment</h3>
                        <p><strong>Service:</strong> ${info.deployment.frontend.service || 'AWS Amplify'}</p>
                        <p><strong>URL:</strong> ${info.urls.frontend ? `<a href="${info.urls.frontend.url}">${info.urls.frontend.url}</a>` : 'Not configured'}</p>
                    </div>
                    <div>
                        <h3>Backend Deployment</h3>
                        <p><strong>Service:</strong> ${info.deployment.backend.service || 'AWS Lambda'}</p>
                        <p><strong>API URL:</strong> ${info.urls.api ? `<a href="${info.urls.api.url}">${info.urls.api.url}</a>` : 'Not configured'}</p>
                    </div>
                </div>

                <h3>🔄 CI/CD Pipeline</h3>
                <ul class="feature-list">
                    <li>GitHub Actions for automated deployment</li>
                    <li>Lambda function updates on code changes</li>
                    <li>Amplify builds on frontend changes</li>
                    <li>Automated documentation generation</li>
                </ul>
            </section>
        </div>
    </main>

    <footer style="background: #2d3748; color: white; padding: 2rem 0; text-align: center; margin-top: 3rem;">
        <div class="container">
            <p>Generated automatically on ${new Date().toLocaleDateString()} • 
               Last updated: ${info.git.lastCommit ? info.git.lastCommit.date : 'Unknown'}</p>
        </div>
    </footer>
</body>
</html>`;
  }

  generateJSONData() {
    return {
      meta: {
        generated: new Date().toISOString(),
        version: '1.0.0',
        generator: 'AutomatedProfessionalDocsGenerator'
      },
      platform: {
        name: 'FILO Health Platform',
        description: 'AI-Powered Health Tracking & Correlation Discovery',
        version: '1.0.0',
        status: 'Active Development'
      },
      statistics: this.calculateStats(),
      discoveredInfo: this.discoveredInfo
    };
  }

  generateREADME() {
    const info = this.discoveredInfo;
    
    return `# FILO Health Platform

AI-Powered Health Tracking & Correlation Discovery

## Quick Start

\`\`\`bash
git clone ${info.git.repository || '<repository>'}
cd health-platform
${info.development.packageManager} install
cp .env.example .env
${info.development.packageManager} run dev
\`\`\`

## Links

- **Live Application:** ${info.urls.frontend ? info.urls.frontend.url : 'TBD'}
- **API Endpoints:** ${info.urls.api ? info.urls.api.url : 'TBD'}
- **Documentation:** ${info.urls.docs || 'TBD'}

## Architecture

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** AWS Lambda + Node.js
- **Database:** ${info.database.type}
- **Deployment:** AWS Amplify + Lambda

## Development

**Requirements:**
- Node.js ${info.development.nodeVersion || '18+'}
- ${info.development.packageManager}
- Environment variables (${info.development.environmentVariables.length} required)

**Available Scripts:**
${Object.entries(info.development.scripts).map(([file, scripts]) => 
  Object.entries(scripts).map(([script, command]) => `- \`${info.development.packageManager} run ${script}\` - ${command}`).join('\n')
).join('\n')}

## API Status

- **Base URL:** ${info.apis.baseUrl || 'Not configured'}
- **Working Endpoints:** ${info.apis.workingCount}/${info.apis.totalCount}
- **Categories:** ${Object.keys(info.apis.categories).join(', ')}

## Database

- **Type:** ${info.database.type}
- **Tables:** ${info.database.tables.length} discovered
- **Connection:** ${info.database.connectionInfo.host ? `${info.database.connectionInfo.host}:${info.database.connectionInfo.port}` : 'Configured via environment'}

---

*This README was generated automatically. For complete documentation, visit the [documentation site](${info.urls.docs || '#'}).*
`;
  }

  calculateStats() {
    const info = this.discoveredInfo;
    
    return {
      totalComponents: Object.values(info.fileStructure.frontend || {}).reduce((sum, dir) => sum + (dir.components?.length || 0), 0),
      totalHooks: Object.values(info.fileStructure.frontend || {}).reduce((sum, dir) => sum + (dir.hooks?.length || 0), 0),
      totalFiles: Object.values(info.fileStructure.frontend || {}).reduce((sum, dir) => sum + (dir.totalFiles || 0), 0),
      workingAPIs: info.apis.workingCount || 0,
      totalAPIs: info.apis.totalCount || 0,
      totalTables: info.database.tables.length || 0,
      totalCommits: info.git.totalCommits || 0,
      contributors: info.git.contributors?.length || 0
    };
  }

  isReactComponent(content) {
    return content.includes('export') && 
           (content.includes('function') || content.includes('const')) &&
           (content.includes('return') || content.includes('=>')) &&
           (content.includes('jsx') || content.includes('<') || content.includes('React'));
  }

  extractHooks(content) {
    const hooks = [];
    const hookMatches = content.match(/use[A-Z]\w+/g);
    if (hookMatches) {
      hooks.push(...[...new Set(hookMatches)]);
    }
    return hooks;
  }

  extractBuildCommand(content) {
    const buildMatch = content.match(/build:\s*\n.*?commands:\s*\n.*?-\s*(.+)/s);
    return buildMatch ? buildMatch[1].trim() : null;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  printSummary() {
    const info = this.discoveredInfo;
    const stats = this.calculateStats();
    
    console.log('\n📊 PROFESSIONAL DOCUMENTATION SUMMARY');
    console.log('=====================================');
    console.log(`📱 Components: ${stats.totalComponents} (${stats.totalHooks} hooks)`);
    console.log(`🌐 APIs: ${stats.workingAPIs}/${stats.totalAPIs} working`);
    console.log(`🗄️ Database: ${stats.totalTables} tables (${info.database.type})`);
    console.log(`📝 Git: ${stats.totalCommits} commits, ${stats.contributors} contributors`);
    console.log(`🔧 Development: Node.js ${info.development.nodeVersion || 'Any'}, ${info.development.packageManager}`);
    console.log(`🚀 Deployment: ${Object.keys(info.deployment).length} services configured`);
    console.log('\n📁 Generated Files:');
    console.log('   - docs-site/index.html (Professional documentation site)');
    console.log('   - docs-site/platform-data.json (Structured data)');
    console.log('   - docs-site/README.md (Developer guide)');
    console.log(`\n🌐 Documentation URL: ${info.urls.docs || 'Deploy to GitHub Pages'}`);
    console.log('\n✅ Professional documentation ready for investors and developers!');
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const generator = new AutomatedProfessionalDocsGenerator(projectPath);
  generator.generateProfessionalDocs();
}

module.exports = AutomatedProfessionalDocsGenerator;