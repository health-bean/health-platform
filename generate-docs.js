#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DynamicDocumentationGenerator {
  constructor(projectRoot, docsRoot) {
    this.projectRoot = projectRoot;
    this.docsRoot = docsRoot;
    this.analysisFile = path.join(projectRoot, 'FILO_ANALYSIS_REPORT.json');
    this.apiAnalysisFile = path.join(projectRoot, 'FILO_API_ANALYSIS.json');
    
    // Dynamic configuration - auto-detected
    this.config = {
      projectName: this.detectProjectName(),
      repositoryUrl: this.detectRepositoryUrl(),
      deploymentUrl: this.detectDeploymentUrl(),
      apiBaseUrl: this.detectApiBaseUrl(),
      customDomain: this.detectCustomDomain()
    };
  }

  async generateDocumentation() {
    console.log('📚 Generating Dynamic Documentation...\n');
    console.log(`Project: ${this.config.projectName}`);
    console.log(`Repository: ${this.config.repositoryUrl}`);
    console.log(`Deployment: ${this.config.deploymentUrl}`);
    console.log(`API Base: ${this.config.apiBaseUrl}\n`);
    
    try {
      // Load analysis data
      const analysis = this.loadAnalysisData();
      const apiAnalysis = this.loadAPIAnalysisData();
      
      // Extract dynamic data
      const dynamicData = await this.extractDynamicData(analysis, apiAnalysis);
      
      // Generate all documentation sections
      await this.generateOverview(dynamicData);
      await this.generateArchitecture(dynamicData);
      await this.generateComponents(dynamicData);
      await this.generateAPIs(dynamicData);
      await this.generateSetupGuide(dynamicData);
      await this.generateDeployment(dynamicData);
      
      // Update configurations dynamically
      this.updateDocusaurusConfig(dynamicData);
      this.updateSidebar(dynamicData);
      
      console.log('✅ Dynamic documentation generated successfully!');
      
    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
    }
  }

  // DYNAMIC DETECTION METHODS
  detectProjectName() {
    // Try package.json first
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (pkg.name) return this.formatProjectName(pkg.name);
    }
    
    // Try web-app package.json
    const webAppPackagePath = path.join(this.projectRoot, 'frontend/web-app/package.json');
    if (fs.existsSync(webAppPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(webAppPackagePath, 'utf8'));
      if (pkg.name) return this.formatProjectName(pkg.name);
    }
    
    // Fall back to directory name
    return this.formatProjectName(path.basename(this.projectRoot));
  }

  detectRepositoryUrl() {
    try {
      // Try to get from git remote
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git config --get remote.origin.url', { 
        cwd: this.projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      // Convert SSH to HTTPS if needed
      if (remoteUrl.startsWith('git@github.com:')) {
        return remoteUrl.replace('git@github.com:', 'https://github.com/').replace('.git', '');
      }
      
      return remoteUrl.replace('.git', '');
    } catch (error) {
      console.log('⚠️  Could not detect repository URL from git remote');
      return null;
    }
  }

  detectDeploymentUrl() {
    // Check amplify.yml for app ID or custom domain
    const amplifyPath = path.join(this.projectRoot, 'amplify.yml');
    if (fs.existsSync(amplifyPath)) {
      // For now, return null - will be detected from environment or config later
      return null;
    }
    
    // Check for Vercel, Netlify, or other deployment configs
    if (fs.existsSync(path.join(this.projectRoot, 'vercel.json'))) {
      return this.detectVercelUrl();
    }
    
    if (fs.existsSync(path.join(this.projectRoot, 'netlify.toml'))) {
      return this.detectNetlifyUrl();
    }
    
    return null;
  }

  detectApiBaseUrl() {
    // Check environment files
    const envFiles = [
      path.join(this.projectRoot, 'frontend/web-app/.env'),
      path.join(this.projectRoot, 'frontend/web-app/.env.development'),
      path.join(this.projectRoot, 'frontend/web-app/.env.local'),
      path.join(this.projectRoot, '.env')
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const apiMatch = envContent.match(/VITE_API_BASE_URL=(.+)/);
        if (apiMatch) {
          return apiMatch[1].trim().replace(/["']/g, '');
        }
      }
    }
    
    // Check API analysis for base URL
    if (fs.existsSync(this.apiAnalysisFile)) {
      const apiAnalysis = JSON.parse(fs.readFileSync(this.apiAnalysisFile, 'utf8'));
      if (apiAnalysis.endpoints && apiAnalysis.endpoints.length > 0) {
        const firstEndpoint = apiAnalysis.endpoints[0];
        if (firstEndpoint.url) {
          return firstEndpoint.url.split('/api')[0];
        }
      }
    }
    
    return null;
  }

  detectCustomDomain() {
    // Check for CNAME file or custom domain config
    const cnameFile = path.join(this.projectRoot, 'CNAME');
    if (fs.existsSync(cnameFile)) {
      return fs.readFileSync(cnameFile, 'utf8').trim();
    }
    
    // Check docs CNAME
    const docsCnameFile = path.join(this.docsRoot, 'static/CNAME');
    if (fs.existsSync(docsCnameFile)) {
      return fs.readFileSync(docsCnameFile, 'utf8').trim();
    }
    
    return null;
  }

  // DYNAMIC DATA EXTRACTION
  async extractDynamicData(analysis, apiAnalysis) {
    return {
      project: {
        name: this.config.projectName,
        repositoryUrl: this.config.repositoryUrl,
        deploymentUrl: this.config.deploymentUrl,
        apiBaseUrl: this.config.apiBaseUrl,
        customDomain: this.config.customDomain,
        stats: analysis.overview.stats,
        lastModified: analysis.overview.stats?.lastModified
      },
      
      components: {
        shared: this.extractComponentData(analysis.shared.components),
        frontend: this.extractComponentData(analysis.frontend.components),
        total: analysis.shared.components.length + analysis.frontend.components.length
      },
      
      hooks: this.extractHookData(analysis.frontend.hooks),
      
      apis: apiAnalysis ? this.extractAPIData(apiAnalysis) : null,
      
      protocols: apiAnalysis ? this.extractProtocolData(apiAnalysis) : null,
      
      architecture: this.extractArchitectureData(analysis),
      
      deployment: this.extractDeploymentData(analysis),
      
      dependencies: this.extractDependencyData(analysis.dependencies),
      
      features: this.detectFeatures(analysis, apiAnalysis)
    };
  }

  extractComponentData(components) {
    return components.map(comp => ({
      name: comp.name,
      path: comp.path,
      type: comp.type,
      description: this.extractComponentDescription(comp),
      props: this.extractComponentProps(comp),
      imports: comp.imports || [],
      usage: this.generateComponentUsage(comp)
    }));
  }

  extractComponentDescription(comp) {
    // Try to extract description from component file
    try {
      const componentPath = path.join(this.projectRoot, comp.path);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Look for JSDoc comments
        const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
        if (jsdocMatch) {
          return jsdocMatch[1];
        }
        
        // Look for single-line comments at the top
        const commentMatch = content.match(/^\/\/\s*(.+)/m);
        if (commentMatch) {
          return commentMatch[1];
        }
      }
    } catch (error) {
      // If we can't read the file, use fallback
    }
    
    // Fallback to intelligent guessing based on name and type
    return this.generateComponentDescription(comp);
  }

  extractHookData(hooks) {
    return hooks.map(hook => ({
      name: hook.name,
      path: hook.path,
      returns: hook.returns,
      description: this.extractHookDescription(hook),
      usage: this.generateHookUsage(hook)
    }));
  }

  extractAPIData(apiAnalysis) {
    const workingEndpoints = apiAnalysis.endpoints.filter(ep => ep.working);
    const brokenEndpoints = apiAnalysis.endpoints.filter(ep => !ep.working);
    
    return {
      baseUrl: this.config.apiBaseUrl,
      working: workingEndpoints.map(ep => ({
        ...ep,
        responseExample: this.formatResponseExample(ep),
        dataStructure: this.analyzeDataStructure(ep)
      })),
      protected: brokenEndpoints.filter(ep => ep.status === 403),
      broken: brokenEndpoints.filter(ep => ep.status !== 403),
      summary: apiAnalysis.summary,
      avgResponseTime: this.calculateAverageResponseTime(workingEndpoints)
    };
  }

  extractProtocolData(apiAnalysis) {
    // Find the protocols endpoint and extract real protocol data
    const protocolsEndpoint = apiAnalysis.endpoints.find(ep => 
      ep.path === '/api/v1/protocols' && ep.working
    );
    
    if (protocolsEndpoint && protocolsEndpoint.sampleData) {
      const protocols = protocolsEndpoint.sampleData.sample?.protocols;
      if (protocols) {
        return protocols.map(protocol => ({
          id: protocol.id,
          name: protocol.name,
          description: protocol.description,
          category: protocol.category,
          official: protocol.official
        }));
      }
    }
    
    return null;
  }

  detectFeatures(analysis, apiAnalysis) {
    const features = [];
    
    // Detect setup wizard
    if (analysis.frontend.components.some(comp => comp.name.includes('Setup') || comp.name.includes('Wizard'))) {
      const wizardSteps = analysis.frontend.components.filter(comp => 
        comp.name.includes('Step') || comp.name.includes('setup')
      ).length;
      features.push({
        name: 'Setup Wizard',
        status: 'implemented',
        details: `${wizardSteps} steps detected`
      });
    }
    
    // Detect timeline functionality
    if (apiAnalysis && apiAnalysis.endpoints.some(ep => ep.path.includes('timeline'))) {
      features.push({
        name: 'Timeline Management',
        status: 'implemented',
        details: 'API endpoints available'
      });
    }
    
    // Detect protocol management
    if (apiAnalysis && apiAnalysis.endpoints.some(ep => ep.path.includes('protocol'))) {
      features.push({
        name: 'Protocol Management',
        status: 'implemented',
        details: 'API integration complete'
      });
    }
    
    // Detect shared component library
    if (analysis.shared.components.length > 0) {
      features.push({
        name: 'UI Component Library',
        status: 'implemented',
        details: `${analysis.shared.components.length} reusable components`
      });
    }
    
    // Detect custom hooks
    if (analysis.frontend.hooks.length > 0) {
      features.push({
        name: 'Data Management Hooks',
        status: 'implemented',
        details: `${analysis.frontend.hooks.length} custom hooks`
      });
    }
    
    return features;
  }

  // DYNAMIC DOCUMENT GENERATION
  async generateOverview(data) {
    console.log('📄 Generating dynamic overview...');
    
    const overview = `# ${data.project.name}

## Platform Summary

${data.project.name} is a sophisticated Protocol Management & Healing Platform designed for chronic illness recovery. Built as a comprehensive monorepo with modern React architecture.

### Current Statistics
- **Total Files:** ${data.project.stats?.totalFiles || 'N/A'}
- **Directories:** ${data.project.stats?.directories || 'N/A'}
- **Last Updated:** ${data.project.lastModified ? new Date(data.project.lastModified).toLocaleDateString() : 'N/A'}
- **Components:** ${data.components.total}
- **Custom Hooks:** ${data.hooks.length}
${data.apis ? `- **API Endpoints:** ${data.apis.working.length} working, ${data.apis.protected.length} protected` : ''}

## Live Links
${data.project.deploymentUrl ? `- **Live Application:** [${data.project.deploymentUrl}](${data.project.deploymentUrl})` : ''}
${data.project.repositoryUrl ? `- **Source Code:** [${data.project.repositoryUrl}](${data.project.repositoryUrl})` : ''}
${data.project.apiBaseUrl ? `- **API Base:** \`${data.project.apiBaseUrl}\`` : ''}

## Current Features

${data.features.map(feature => `### ${feature.name}
**Status:** ${feature.status}  
**Details:** ${feature.details}
`).join('\n')}

## Technology Stack

### Frontend
- **Framework:** React ${this.detectReactVersion()}
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Components:** ${data.components.shared.length} shared, ${data.components.frontend.length} app-specific

### Backend
${data.apis ? `- **API:** ${data.apis.baseUrl}` : '- **API:** Development/Mock data'}
- **Database:** PostgreSQL (planned for production)
- **Hosting:** AWS Lambda + API Gateway
- **Deployment:** AWS Amplify

### Development
- **Monorepo:** Multi-app architecture
- **Documentation:** Auto-generated from code analysis
- **Analysis:** Automated codebase and API analysis

${data.protocols ? `## Supported Health Protocols

Currently supporting ${data.protocols.length} health protocols:

${data.protocols.map(protocol => `- **${protocol.name}:** ${protocol.description}`).join('\n')}` : ''}

## Getting Started

1. **For Developers:** See [Development Setup](./development/setup)
2. **Architecture Overview:** See [System Architecture](./architecture/overview)
3. **Component Library:** See [UI Components](./components/overview)
${data.apis ? `4. **API Integration:** See [API Reference](./api/overview)` : ''}

---

*This documentation is automatically generated from codebase analysis and updates with every commit.*
`;

    this.writeDocFile('docs/intro.md', overview);
  }

  async generateComponents(data) {
    console.log('🧩 Generating dynamic component documentation...');
    
    const componentsDoc = `# Component Library

## Overview

The ${data.project.name} includes ${data.components.total} React components:
- **${data.components.shared.length} Shared Components** - Reusable across all applications
- **${data.components.frontend.length} App Components** - Application-specific components

## Shared Components

${data.components.shared.map(comp => `### ${comp.name}

**File:** \`${comp.path}\`  
**Type:** ${comp.type || 'React Component'}  
**Description:** ${comp.description}

${comp.props ? `**Props:**
\`\`\`javascript
${comp.props.slice(0, 2).join('\n')}
\`\`\`` : ''}

**Usage:**
\`\`\`jsx
${comp.usage}
\`\`\`
`).join('\n')}

## Application Components

${data.components.frontend.map(comp => `### ${comp.name}

**File:** \`${comp.path}\`  
**Type:** ${comp.type || 'React Component'}  
**Description:** ${comp.description}
`).join('\n')}

## Custom Hooks

${data.hooks.map(hook => `### ${hook.name}

**File:** \`${hook.path}\`  
**Returns:** \`${hook.returns || 'Object'}\`  
**Description:** ${hook.description}

**Usage:**
\`\`\`jsx
${hook.usage}
\`\`\`
`).join('\n')}

---

*Component documentation is automatically generated from code analysis.*
`;

    this.ensureDir('docs/components');
    this.writeDocFile('docs/components/overview.md', componentsDoc);
  }

  // DYNAMIC CONFIGURATION UPDATES
  updateDocusaurusConfig(data) {
    console.log('⚙️  Updating Docusaurus configuration...');
    
    const configPath = path.join(this.docsRoot, 'docusaurus.config.js');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  docusaurus.config.js not found, skipping update');
      return;
    }
    
    // Read existing config
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update dynamic values
    if (data.project.name) {
      configContent = configContent.replace(
        /(title:\s*['"`]).*(['"`])/,
        `$1${data.project.name}$2`
      );
    }
    
    if (data.project.repositoryUrl) {
      configContent = configContent.replace(
        /(editUrl:\s*['"`]).*(['"`])/,
        `$1${data.project.repositoryUrl}/tree/main/docs/$2`
      );
      
      configContent = configContent.replace(
        /(href:\s*['"`]).*(['"`])/,
        `$1${data.project.repositoryUrl}$2`
      );
    }
    
    if (data.project.customDomain) {
      configContent = configContent.replace(
        /(url:\s*['"`]).*(['"`])/,
        `$1https://${data.project.customDomain}$2`
      );
    }
    
    fs.writeFileSync(configPath, configContent);
  }

  // UTILITY METHODS
  formatProjectName(name) {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  detectReactVersion() {
    const packagePath = path.join(this.projectRoot, 'frontend/web-app/package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.dependencies?.react?.replace('^', '') || '18+';
    }
    return '18+';
  }

  generateComponentDescription(comp) {
    const descriptions = {
      'Alert': 'Displays notification and alert messages with customizable variants and dismissal options',
      'Button': 'Interactive button component with loading states, variants, and icon support',
      'Card': 'Container component with optional title, subtitle, icon, and content sections',
      'Input': 'Form input component with focus colors, validation, and styling options',
      'Select': 'Dropdown selection component with customizable styling and focus colors',
      'Textarea': 'Multi-line text input with configurable rows and styling options'
    };
    
    return descriptions[comp.name] || `${comp.name} component for the application`;
  }

  generateComponentUsage(comp) {
    const usageExamples = {
      'Alert': `import { Alert } from '@/shared/components/ui';

<Alert variant="success" title="Success!">
  Operation completed successfully
</Alert>`,
      'Button': `import { Button } from '@/shared/components/ui';

<Button variant="primary" loading={isLoading}>
  Save Changes
</Button>`,
      'Card': `import { Card } from '@/shared/components/ui';

<Card title="Card Title" variant="primary">
  Card content goes here
</Card>`
    };
    
    return usageExamples[comp.name] || `import { ${comp.name} } from '${comp.path.replace(/\.[^/.]+$/, "")}';

<${comp.name} />`;
  }

  // ... (continuing with other utility methods)

  loadAnalysisData() {
    if (!fs.existsSync(this.analysisFile)) {
      throw new Error('Analysis file not found. Run: node analyze-codebase.js first');
    }
    return JSON.parse(fs.readFileSync(this.analysisFile, 'utf8'));
  }

  loadAPIAnalysisData() {
    if (!fs.existsSync(this.apiAnalysisFile)) {
      console.log('⚠️  API analysis not found. Continuing with codebase analysis only.');
      return null;
    }
    return JSON.parse(fs.readFileSync(this.apiAnalysisFile, 'utf8'));
  }

  ensureDir(dirPath) {
    const fullPath = path.join(this.docsRoot, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  writeDocFile(relativePath, content) {
    const fullPath = path.join(this.docsRoot, relativePath);
    this.ensureDir(path.dirname(relativePath));
    fs.writeFileSync(fullPath, content);
  }

// Add these complete method implementations to your generate-docs.js

async generateArchitecture(data) {
  console.log('🏗️  Generating architecture documentation...');
  
  const architecture = `# System Architecture

## Overview

The ${data.project.name} follows a modern monorepo architecture with clear separation of concerns and scalable design patterns.

## Project Structure

\`\`\`
${data.project.name}/
├── frontend/
│   ├── web-app/          # Main React application
│   ├── mobile-app/       # Future mobile app (${data.features.find(f => f.name.includes('mobile')) ? 'planned' : 'not planned'})
│   ├── practitioner-dashboard/  # Future practitioner interface
│   └── shared/           # Shared components and utilities
├── backend/
│   ├── functions/        # AWS Lambda functions
│   ├── database/         # Database schemas and migrations
│   └── shared/           # Shared backend utilities
├── docs/                 # Documentation (Docusaurus)
├── infrastructure/       # Infrastructure as Code
└── scripts/              # Build and deployment scripts
\`\`\`

## Technology Stack

### Frontend Architecture
- **Framework:** React ${this.detectReactVersion()}
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React hooks and context

### Component Architecture
${data.components.shared.length > 0 ? `
#### Shared Component Library
${data.components.shared.map(comp => `- **${comp.name}:** ${comp.description}`).join('\n')}

#### Application Components  
- **Total Components:** ${data.components.total}
- **Shared Components:** ${data.components.shared.length}
- **App-Specific Components:** ${data.components.frontend.length}
` : ''}

### Data Management
${data.hooks.length > 0 ? `
#### Custom Hooks
${data.hooks.map(hook => `- **${hook.name}:** ${hook.description}`).join('\n')}
` : ''}

## Backend Architecture

### AWS Infrastructure
${data.apis ? `
- **API Gateway:** REST API endpoints
- **Base URL:** \`${data.apis.baseUrl}\`
- **Lambda Functions:** Serverless compute
- **Working Endpoints:** ${data.apis.working.length}
- **Protected Endpoints:** ${data.apis.protected.length}
` : '- **Backend:** Development/Mock data phase'}

### Database Design
- **Primary Database:** PostgreSQL (RDS)
- **Caching:** Redis (planned for production)
- **File Storage:** AWS S3 (planned)

## Data Flow Architecture

### Request Flow
1. **Frontend** makes API calls via custom hooks
2. **API Gateway** routes requests to appropriate Lambda functions  
3. **Lambda Functions** process business logic and database operations
4. **PostgreSQL** stores all application data
5. **Response** returns through the same chain

### State Management
- **Local State:** React useState/useReducer for component state
- **Global State:** Context providers for shared data
- **Server State:** Custom hooks for API data fetching and caching
- **Form State:** Controlled components with validation

## Deployment Architecture

### Current Deployment
- **Frontend Hosting:** AWS Amplify
- **Backend API:** AWS Lambda + API Gateway  
- **Database:** AWS RDS PostgreSQL
- **Documentation:** GitHub Pages

### CI/CD Pipeline
1. **Code Push** → GitHub repository
2. **GitHub Actions** → Automated testing and building
3. **AWS Amplify** → Frontend deployment
4. **Documentation** → Auto-generated and deployed

## Security Architecture

### Current Implementation
- **HTTPS:** All traffic encrypted in transit
- **CORS:** Configured for secure cross-origin requests
${data.apis?.protected.length > 0 ? `- **API Protection:** ${data.apis.protected.length} endpoints require authentication` : ''}

### Production Security Plan
- **Authentication:** JWT tokens with refresh mechanism
- **Authorization:** Role-based access control (Patient/Practitioner)  
- **Data Encryption:** Encryption at rest for sensitive data
- **API Security:** Rate limiting, input validation, API keys

## Scalability Considerations

### Horizontal Scaling
- **Lambda Functions:** Auto-scaling based on demand
- **Database:** Read replicas for query scaling
- **CDN:** Global CloudFront distribution for static assets

### Performance Optimization
- **Bundle Splitting:** Dynamic imports for code splitting
- **API Caching:** Response caching with appropriate TTL
- **Database Optimization:** Indexed queries and connection pooling
- **Image Optimization:** WebP format and responsive images

## Development Workflow

### Monorepo Benefits
- **Shared Components:** Reusable across all applications
- **Consistent Tooling:** Same build tools and configurations
- **Atomic Changes:** Update multiple apps in single commit
- **Code Sharing:** Utilities and types shared across projects

### Quality Assurance
- **Automated Analysis:** Codebase analysis on every commit
- **Documentation:** Auto-generated and always up-to-date
- **Type Safety:** TypeScript integration (planned)
- **Testing:** Unit and integration testing (planned)

---

*This architecture documentation is automatically generated from codebase analysis.*
`;

  this.ensureDir('docs/architecture');
  this.writeDocFile('docs/architecture/overview.md', architecture);
}

async generateAPIs(data) {
  console.log('🌐 Generating API documentation...');
  
  if (!data.apis) {
    const basicAPI = `# API Reference

## Overview

The ${data.project.name} API is currently in development/POC phase with mock data.

**Current Status:** Development Phase
- **Authentication:** Not yet implemented
- **Data:** Mock/development data
- **Environment:** Development/testing

## Development API Information

**Base URL:** \`${data.project.apiBaseUrl || 'Development environment'}\`

## Planned Production API

### Authentication
- **Method:** JWT Bearer tokens
- **Refresh Tokens:** Automatic token renewal
- **Scopes:** Role-based permissions (Patient, Practitioner, Admin)

### Endpoints Overview
- **Health Protocols:** Management of treatment protocols
- **Timeline Entries:** Patient timeline and journaling
- **User Management:** Patient and practitioner accounts
- **Food Database:** Comprehensive food and nutrition data
- **Symptom Tracking:** Health metrics and symptoms

### Rate Limiting
- **Development:** No limits
- **Production:** 1000 requests per hour per user

### Response Format
All API responses follow consistent JSON format:

#### Success Response
\`\`\`json
{
  "data": { ... },
  "total": number,
  "status": "success",
  "timestamp": "ISO-8601"
}
\`\`\`

#### Error Response
\`\`\`json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "status": "error",
  "timestamp": "ISO-8601"
}
\`\`\`

## Testing

To test API endpoints when available:
\`\`\`bash
# Run automated API tests
npm run analyze-api

# Test specific endpoint (when production ready)
curl -H "Authorization: Bearer TOKEN" \\
     https://api.${data.project.name.toLowerCase()}.com/api/v1/protocols
\`\`\`

---

*API documentation will be automatically updated as endpoints are implemented.*
`;
    
    this.ensureDir('docs/api');
    this.writeDocFile('docs/api/overview.md', basicAPI);
    return;
  }

  const workingEndpoints = data.apis.working || [];
  const protectedEndpoints = data.apis.protected || [];

  const apiDocs = `# API Reference

## Overview

The ${data.project.name} API provides endpoints for managing health protocols, timeline entries, and user data.

**Base URL:** \`${data.apis.baseUrl}\`
**Current Status:** ${workingEndpoints.length > 0 ? 'Active Development' : 'Development Phase'}

## Authentication

**Current:** Development phase - mixed authentication requirements
**Production Plan:** JWT Bearer token authentication

## Working Endpoints (${workingEndpoints.length})

${workingEndpoints.map(ep => `
### ${ep.method} ${ep.path}

**Description:** ${ep.description}  
**Response Time:** ${ep.responseTime}ms  
**Status:** ${ep.status}

${ep.responseExample ? `**Response Example:**
\`\`\`json
${JSON.stringify(ep.responseExample, null, 2)}
\`\`\`` : ''}

${ep.dataStructure ? `**Data Structure:**
${Object.entries(ep.dataStructure).map(([key, type]) => `- \`${key}\`: ${type}`).join('\n')}` : ''}
`).join('\n')}

## Protected Endpoints (${protectedEndpoints.length})

These endpoints require authentication in production:

${protectedEndpoints.map(ep => `- **${ep.method} ${ep.path}** - ${ep.description}`).join('\n')}

## Performance Metrics

${data.apis.avgResponseTime ? `- **Average Response Time:** ${data.apis.avgResponseTime}ms` : ''}
- **Success Rate:** ${Math.round((workingEndpoints.length / (workingEndpoints.length + protectedEndpoints.length)) * 100)}%

## Error Handling

### Common HTTP Status Codes
- **200:** Success
- **400:** Bad Request - Invalid parameters
- **401:** Unauthorized - Authentication required
- **403:** Forbidden - Access denied
- **404:** Not Found - Endpoint or resource not found
- **500:** Internal Server Error

### Error Response Format
\`\`\`json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE", 
  "status": "error"
}
\`\`\`

## Rate Limiting

- **Development:** No rate limiting
- **Production:** 1000 requests per hour per authenticated user

## Testing

### Automated Testing
\`\`\`bash
# Test all endpoints
npm run analyze-api
\`\`\`

### Manual Testing
\`\`\`bash
# Test working endpoints
curl ${data.apis.baseUrl}/api/v1/protocols

# Test with authentication (when available)
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     ${data.apis.baseUrl}/api/v1/user-preferences
\`\`\`

---

*API documentation is automatically generated from live endpoint testing.*
`;

  this.ensureDir('docs/api');
  this.writeDocFile('docs/api/overview.md', apiDocs);
}

async generateSetupGuide(data) {
  console.log('🚀 Generating setup guide...');
  
  const setupGuide = `# Development Setup Guide

## Prerequisites

- **Node.js:** v18 or higher ([Download](https://nodejs.org/))
- **npm:** v8 or higher (comes with Node.js)
- **Git:** Latest version ([Download](https://git-scm.com/))
- **Code Editor:** VS Code recommended ([Download](https://code.visualstudio.com/))

## Quick Start

### 1. Clone the Repository

\`\`\`bash
${data.project.repositoryUrl ? `git clone ${data.project.repositoryUrl}.git` : 'git clone YOUR_REPOSITORY_URL'}
cd ${data.project.name.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install root dependencies and set up monorepo
npm install

# Install all workspace dependencies
npm run install-all
\`\`\`

### 3. Environment Configuration

\`\`\`bash
# Copy environment template
cp frontend/web-app/.env.example frontend/web-app/.env

# Edit environment variables
nano frontend/web-app/.env
\`\`\`

**Required Environment Variables:**
\`\`\`env
VITE_API_BASE_URL=${data.project.apiBaseUrl || 'http://localhost:8000'}
VITE_APP_ENV=development
\`\`\`

### 4. Start Development Servers

\`\`\`bash
# Start web application (Frontend)
npm run web:dev

# Start documentation site (separate terminal)
npm run docs:dev

# Run analysis tools
npm run analyze
\`\`\`

## Project Structure

\`\`\`
${data.project.name}/
├── frontend/
│   ├── shared/           # ${data.components.shared.length} shared components
│   └── web-app/          # Main React application
├── backend/              # API and server logic
├── docs/                 # Documentation site
├── scripts/              # Build and utility scripts
└── package.json          # Root package.json (monorepo)
\`\`\`

## Available Scripts

### Root Level Commands
- \`npm run analyze\` - Analyze codebase and generate reports
- \`npm run analyze-api\` - Test API endpoints
- \`npm run generate-docs\` - Generate documentation
- \`npm run web:dev\` - Start web app development server
- \`npm run web:build\` - Build web app for production
- \`npm run docs:dev\` - Start documentation server
- \`npm run docs:build\` - Build documentation

### Web Application (\`frontend/web-app/\`)
- \`npm run dev\` - Start development server (http://localhost:5173)
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

### Documentation (\`docs/\`)
- \`npm start\` - Start development server (http://localhost:3000)
- \`npm run build\` - Build static site
- \`npm run serve\` - Serve built site locally

## Development Workflow

### 1. Feature Development
\`\`\`bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Run analysis to check impact
npm run analyze

# Test the application
npm run web:dev
\`\`\`

### 2. Testing Changes
\`\`\`bash
# Test web application
npm run web:dev
# Visit: http://localhost:5173

# Test documentation  
npm run docs:dev
# Visit: http://localhost:3000

# Run API tests (if backend available)
npm run analyze-api
\`\`\`

### 3. Documentation Updates
\`\`\`bash
# Generate fresh documentation
npm run generate-docs

# Preview documentation changes
npm run docs:dev
\`\`\`

### 4. Commit and Deploy
\`\`\`bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add your feature description"  

# Push to trigger auto-deployment
git push origin feature/your-feature-name
\`\`\`

## Component Development

### Creating Shared Components

\`\`\`bash
# Navigate to shared components
cd frontend/shared/components/ui

# Create new component file
touch NewComponent.jsx
\`\`\`

**Component Template:**
\`\`\`jsx
import React from 'react';

const NewComponent = ({ 
  variant = 'default',
  children,
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'bg-white border-gray-200',
    primary: 'bg-blue-50 border-blue-200',
    // Add more variants...
  };

  return (
    <div 
      className={\`\${variants[variant]} \${className}\`}
      {...props}
    >
      {children}
    </div>
  );
};

export default NewComponent;
\`\`\`

### Using Shared Components

\`\`\`jsx
import { NewComponent } from '../../../shared/components/ui';

function MyPage() {
  return (
    <NewComponent variant="primary">
      Content here
    </NewComponent>
  );
}
\`\`\`

## Troubleshooting

### Common Issues

**Port Already in Use:**
\`\`\`bash
# Kill processes on port 3000 or 5173
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
\`\`\`

**Node Modules Issues:**
\`\`\`bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf frontend/*/node_modules
rm -rf docs/node_modules
npm install
\`\`\`

**Build Failures:**
\`\`\`bash
# Check Node.js version
node --version  # Should be v18+

# Clear npm cache
npm cache clean --force

# Rebuild from scratch
npm run clean && npm install
\`\`\`

### Getting Help

1. **Check documentation:** Generated docs at http://localhost:3000
2. **Review analysis reports:** Run \`npm run analyze\`
3. **Check API status:** Run \`npm run analyze-api\`
4. **Component issues:** Review component library documentation

## IDE Setup (VS Code)

### Recommended Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Settings
\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
\`\`\`

---

*This setup guide is automatically generated and updated with each codebase analysis.*
`;

  this.ensureDir('docs/development');
  this.writeDocFile('docs/development/setup.md', setupGuide);
}

async generateDeployment(data) {
  console.log('🚀 Generating deployment documentation...');
  
  const deployment = `# Deployment Guide

## Current Deployment Status

**Live Application:** ${data.project.deploymentUrl || 'Deployment in progress'}
${data.project.repositoryUrl ? `**Source Code:** ${data.project.repositoryUrl}` : ''}
**Documentation Site:** Auto-deployed with GitHub Pages

## Deployment Architecture

### AWS Infrastructure
- **Frontend Hosting:** AWS Amplify
- **Backend API:** AWS Lambda + API Gateway
- **Database:** AWS RDS PostgreSQL
- **CDN:** CloudFront for global distribution
- **DNS:** Route 53 (${data.project.customDomain ? data.project.customDomain : 'planned'})

### Build Pipeline
1. **Code Push** → GitHub repository
2. **GitHub Actions** → Automated analysis and documentation
3. **AWS Amplify** → Frontend build and deployment
4. **GitHub Pages** → Documentation deployment

## Automatic Deployment

### Frontend Deployment (AWS Amplify)

**Build Configuration:**
\`\`\`yaml
version: 1
applications:
  - appRoot: frontend/web-app
    frontend:
      phases:
        preBuild:
          commands:
            - cd ../shared && npm ci
            - cd ../web-app && npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
\`\`\`

**Environment Variables:**
- \`VITE_API_BASE_URL\`: ${data.project.apiBaseUrl || 'Production API URL'}
- \`VITE_APP_ENV\`: production

### Documentation Deployment (GitHub Actions)

**Automatic Updates:**
- ✅ Runs on every push to main branch
- ✅ Analyzes codebase for changes
- ✅ Regenerates documentation
- ✅ Deploys to GitHub Pages

**Workflow Triggers:**
- Code changes in \`frontend/\`, \`backend/\`, or \`docs/\`
- Manual workflow dispatch
- Pull request to main branch (for testing)

## Manual Deployment

### Frontend Build and Deploy

\`\`\`bash
# Build for production
npm run web:build

# Deploy via AWS CLI (if configured)
aws amplify start-deployment --app-id YOUR_APP_ID

# Or use Amplify Console for manual deployment
\`\`\`

### Documentation Build and Deploy

\`\`\`bash
# Generate latest documentation
npm run generate-docs

# Build documentation site
npm run docs:build

# Manual deploy to GitHub Pages (if needed)
npm run docs:deploy
\`\`\`

## Environment Configuration

### Development Environment
\`\`\`env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
\`\`\`

### Staging Environment
\`\`\`env
VITE_API_BASE_URL=https://staging-api.${data.project.name.toLowerCase()}.com
VITE_APP_ENV=staging
VITE_DEBUG_MODE=false
\`\`\`

### Production Environment
\`\`\`env
VITE_API_BASE_URL=${data.project.apiBaseUrl || 'https://api.yourapp.com'}
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_SENTRY_DSN=your_sentry_dsn_here
\`\`\`

## Monitoring and Observability

### Performance Monitoring
- **AWS CloudWatch:** Infrastructure metrics
- **Amplify Console:** Build and deployment logs
- **GitHub Actions:** CI/CD pipeline monitoring

### Application Monitoring (Planned)
- **Error Tracking:** Sentry integration
- **Performance:** Real User Monitoring (RUM)
- **Analytics:** User behavior tracking
- **Uptime:** External monitoring service

### Health Checks
\`\`\`bash
# Check application health
curl ${data.project.deploymentUrl || 'https://your-app.com'}/health

# Check API health
npm run analyze-api

# Check documentation build
npm run docs:build
\`\`\`

## Rollback Procedures

### Amplify Rollback
1. **Access AWS Amplify Console**
2. **Navigate to your app**
3. **Go to "App settings" → "Rewrites and redirects"**
4. **Select previous successful deployment**
5. **Click "Promote to main"**

### Git-based Rollback
\`\`\`bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit (destructive)
git reset --hard COMMIT_HASH
git push --force origin main
\`\`\`

### Documentation Rollback
Documentation automatically reverts with code rollbacks since it's generated from the codebase.

## Security Configuration

### HTTPS and SSL
- **Amplify:** Automatic SSL certificate management
- **Custom Domain:** AWS Certificate Manager integration
- **HSTS:** HTTP Strict Transport Security enabled

### CORS Configuration
\`\`\`javascript
// API Gateway CORS settings
{
  "Access-Control-Allow-Origin": "${data.project.deploymentUrl || 'https://your-app.com'}",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
}
\`\`\`

## Custom Domain Setup

${data.project.customDomain ? `### Current Custom Domain
**Domain:** ${data.project.customDomain}
**Status:** Configured and active` : `### Setting Up Custom Domain`}

1. **Purchase domain** through Route 53 or external registrar
2. **Configure DNS** in Route 53 hosted zone
3. **Add domain to Amplify** app settings
4. **Update SSL certificate** via Certificate Manager
5. **Configure redirects** from www to apex domain

### DNS Configuration
\`\`\`
# Route 53 Records
Type: A
Name: @
Value: Amplify app domain

Type: CNAME  
Name: www
Value: main.amplifyapp.com
\`\`\`

## Production Readiness Checklist

### Security
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] Authentication system active

### Performance
- [ ] Bundle size optimized
- [ ] Images optimized and compressed
- [ ] CDN cache headers configured
- [ ] Database queries optimized
- [ ] Performance monitoring enabled

### Reliability
- [ ] Error boundaries implemented
- [ ] Graceful error handling
- [ ] Database backups scheduled
- [ ] Monitoring alerts configured
- [ ] Health check endpoints active

### Documentation
- [ ] API documentation complete
- [ ] Component library documented
- [ ] Deployment procedures documented
- [ ] Troubleshooting guides available

---

*Deployment documentation is automatically updated based on current infrastructure configuration.*
`;

  this.ensureDir('docs/deployment');
  this.writeDocFile('docs/deployment/overview.md', deployment);
}

// Helper method for React version detection
detectReactVersion() {
  try {
    const packagePath = path.join(this.projectRoot, 'frontend/web-app/package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.dependencies?.react?.replace('^', '') || '18+';
    }
  } catch (error) {
    // Fallback if package.json can't be read
  }
  return '18+';
}

updateSidebar(data) {
  console.log('📋 Updating documentation sidebar...');
  
  const sidebar = `/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Architecture',
      items: ['architecture/overview'],
    },
    {
      type: 'category', 
      label: 'Components',
      items: ['components/overview'],
    },
    {
      type: 'category',
      label: 'API Reference', 
      items: ['api/overview'],
    },
    {
      type: 'category',
      label: 'Development',
      items: ['development/setup'],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment/overview'],
    },
  ],
};

export default sidebars;
`;

  this.writeDocFile('sidebars.js', sidebar);
}
  
  // Additional utility methods
  extractArchitectureData(analysis) { return {}; }
  extractDeploymentData(analysis) { return {}; }
  extractDependencyData(deps) { return deps; }
  formatResponseExample(endpoint) { return endpoint.sampleData?.sample; }
  analyzeDataStructure(endpoint) { return endpoint.sampleData?.structure; }
  calculateAverageResponseTime(endpoints) { 
    if (!endpoints.length) return 0;
    return Math.round(endpoints.reduce((sum, ep) => sum + (ep.responseTime || 0), 0) / endpoints.length);
  }
  extractHookDescription(hook) { return `Custom React hook: ${hook.name}`; }
  generateHookUsage(hook) { return `const result = ${hook.name}();`; }
  extractComponentProps(comp) { return comp.props; }
  detectVercelUrl() { return null; }
  detectNetlifyUrl() { return null; }
}

// CLI execution
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const docsRoot = path.join(projectRoot, 'docs');
  
  if (!fs.existsSync(docsRoot)) {
    console.error('❌ Docs directory not found. Make sure you\'re in the project root.');
    process.exit(1);
  }
  
  const generator = new DynamicDocumentationGenerator(projectRoot, docsRoot);
  generator.generateDocumentation().catch(error => {
    console.error('❌ Documentation generation failed:', error);
    process.exit(1);
  });
}

module.exports = DynamicDocumentationGenerator;