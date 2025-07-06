#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ProjectStructureScanner {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.structure = {};
  }

  scan() {
    console.log('🔍 Scanning project structure...\n');
    
    this.structure = {
      packageJsonFiles: this.findPackageJsonFiles(),
      envFiles: this.findEnvFiles(),
      componentDirs: this.findComponentDirectories(),
      hookDirs: this.findHookDirectories(),
      utilDirs: this.findUtilDirectories(),
      srcDirs: this.findSourceDirectories(),
      configFiles: this.findConfigFiles()
    };
    
    this.printStructure();
    this.generatePaths();
    
    return this.structure;
  }

  findPackageJsonFiles() {
    const found = [];
    this.scanForFiles(this.rootPath, 'package.json', found, 4); // Max depth 4
    return found.map(file => ({
      path: path.relative(this.rootPath, file),
      absolutePath: file,
      name: this.getPackageName(file)
    }));
  }

  findEnvFiles() {
    const found = [];
    const envPatterns = ['.env', '.env.local', '.env.development', '.env.production'];
    
    envPatterns.forEach(pattern => {
      this.scanForFiles(this.rootPath, pattern, found, 3); // Max depth 3
    });
    
    return found.map(file => ({
      path: path.relative(this.rootPath, file),
      absolutePath: file,
      variables: this.countEnvVariables(file)
    }));
  }

  findComponentDirectories() {
    const found = [];
    const componentNames = ['components', 'Components'];
    
    componentNames.forEach(name => {
      this.scanForDirectories(this.rootPath, name, found, 4);
    });
    
    return found.map(dir => ({
      path: path.relative(this.rootPath, dir),
      absolutePath: dir,
      componentCount: this.countReactComponents(dir)
    }));
  }

  findHookDirectories() {
    const found = [];
    const hookNames = ['hooks', 'Hooks'];
    
    hookNames.forEach(name => {
      this.scanForDirectories(this.rootPath, name, found, 4);
    });
    
    return found.map(dir => ({
      path: path.relative(this.rootPath, dir),
      absolutePath: dir,
      hookCount: this.countCustomHooks(dir)
    }));
  }

  findUtilDirectories() {
    const found = [];
    const utilNames = ['utils', 'Utils', 'utilities', 'Utilities'];
    
    utilNames.forEach(name => {
      this.scanForDirectories(this.rootPath, name, found, 4);
    });
    
    return found.map(dir => ({
      path: path.relative(this.rootPath, dir),
      absolutePath: dir,
      utilCount: this.countUtilFiles(dir)
    }));
  }

  findSourceDirectories() {
    const found = [];
    const srcNames = ['src', 'source', 'app', 'pages', 'features'];
    
    srcNames.forEach(name => {
      this.scanForDirectories(this.rootPath, name, found, 3);
    });
    
    return found.map(dir => ({
      path: path.relative(this.rootPath, dir),
      absolutePath: dir,
      fileCount: this.countJSFiles(dir)
    }));
  }

  findConfigFiles() {
    const found = [];
    const configFiles = [
      'vite.config.js', 'vite.config.ts',
      'webpack.config.js', 'webpack.config.ts',
      'tailwind.config.js', 'tailwind.config.ts',
      'tsconfig.json', 'jsconfig.json',
      'amplify.yml', 'vercel.json', 'netlify.toml',
      'Dockerfile', 'docker-compose.yml'
    ];
    
    configFiles.forEach(file => {
      this.scanForFiles(this.rootPath, file, found, 3);
    });
    
    return found.map(file => ({
      path: path.relative(this.rootPath, file),
      absolutePath: file,
      type: this.getConfigType(file)
    }));
  }

  scanForFiles(dir, filename, found, maxDepth, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (item.startsWith('.') && item !== filename) continue;
        if (item === 'node_modules') continue;
        
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isFile() && item === filename) {
          found.push(itemPath);
        } else if (stat.isDirectory()) {
          this.scanForFiles(itemPath, filename, found, maxDepth, currentDepth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  scanForDirectories(dir, dirname, found, maxDepth, currentDepth = 0) {
    if (currentDepth >= maxDepth) return;
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (item.startsWith('.')) continue;
        if (item === 'node_modules') continue;
        
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          if (item === dirname) {
            found.push(itemPath);
          }
          this.scanForDirectories(itemPath, dirname, found, maxDepth, currentDepth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  getPackageName(packagePath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return pkg.name || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  countEnvVariables(envPath) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      return content.split('\n').filter(line => 
        line.includes('=') && !line.startsWith('#')
      ).length;
    } catch (error) {
      return 0;
    }
  }

  countReactComponents(dir) {
    try {
      const items = fs.readdirSync(dir);
      let count = 0;
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isFile()) {
          // Check for React component files
          if (item.match(/\.(jsx?|tsx?)$/) && !item.includes('.test.') && !item.includes('.spec.')) {
            count++;
          }
        } else if (stat.isDirectory()) {
          // Recursively count components in subdirectories
          count += this.countReactComponents(itemPath);
        }
      }
      
      return count;
    } catch (error) {
      console.log(`⚠️ Error counting components in ${dir}:`, error.message);
      return 0;
    }
  }

  countCustomHooks(dir) {
    try {
      const items = fs.readdirSync(dir);
      return items.filter(item => 
        item.match(/^use[A-Z].*\.(js|ts)$/)
      ).length;
    } catch (error) {
      return 0;
    }
  }

  countUtilFiles(dir) {
    try {
      const items = fs.readdirSync(dir);
      return items.filter(item => 
        item.match(/\.(js|ts)$/) && !item.includes('.test.')
      ).length;
    } catch (error) {
      return 0;
    }
  }

  countJSFiles(dir) {
    try {
      const items = fs.readdirSync(dir);
      return items.filter(item => 
        item.match(/\.(jsx?|tsx?)$/)
      ).length;
    } catch (error) {
      return 0;
    }
  }

  getConfigType(filePath) {
    const filename = path.basename(filePath);
    if (filename.includes('vite')) return 'Vite Build Config';
    if (filename.includes('webpack')) return 'Webpack Build Config';
    if (filename.includes('tailwind')) return 'Tailwind CSS Config';
    if (filename.includes('tsconfig')) return 'TypeScript Config';
    if (filename.includes('amplify')) return 'AWS Amplify Config';
    if (filename.includes('docker')) return 'Docker Config';
    return 'Configuration';
  }

  printStructure() {
    console.log('📊 PROJECT STRUCTURE ANALYSIS');
    console.log('===============================\n');
    
    // Package.json files
    console.log('📦 Package.json Files:');
    if (this.structure.packageJsonFiles.length > 0) {
      this.structure.packageJsonFiles.forEach(pkg => {
        console.log(`   ✅ ${pkg.path} (${pkg.name})`);
      });
    } else {
      console.log('   ❌ No package.json files found');
    }
    console.log();
    
    // Environment files
    console.log('🔐 Environment Files:');
    if (this.structure.envFiles.length > 0) {
      this.structure.envFiles.forEach(env => {
        console.log(`   ✅ ${env.path} (${env.variables} variables)`);
      });
    } else {
      console.log('   ❌ No .env files found');
    }
    console.log();
    
    // Component directories
    console.log('⚛️ Component Directories:');
    if (this.structure.componentDirs.length > 0) {
      this.structure.componentDirs.forEach(dir => {
        console.log(`   ✅ ${dir.path} (${dir.componentCount} components)`);
      });
    } else {
      console.log('   ❌ No component directories found');
    }
    console.log();
    
    // Hook directories
    console.log('🎣 Hook Directories:');
    if (this.structure.hookDirs.length > 0) {
      this.structure.hookDirs.forEach(dir => {
        console.log(`   ✅ ${dir.path} (${dir.hookCount} hooks)`);
      });
    } else {
      console.log('   ❌ No hook directories found');
    }
    console.log();
    
    // Utility directories
    console.log('🔧 Utility Directories:');
    if (this.structure.utilDirs.length > 0) {
      this.structure.utilDirs.forEach(dir => {
        console.log(`   ✅ ${dir.path} (${dir.utilCount} files)`);
      });
    } else {
      console.log('   ❌ No utility directories found');
    }
    console.log();
    
    // Source directories
    console.log('📁 Source Directories:');
    if (this.structure.srcDirs.length > 0) {
      this.structure.srcDirs.forEach(dir => {
        console.log(`   ✅ ${dir.path} (${dir.fileCount} JS/TS files)`);
      });
    } else {
      console.log('   ❌ No source directories found');
    }
    console.log();
    
    // Config files
    console.log('⚙️ Configuration Files:');
    if (this.structure.configFiles.length > 0) {
      this.structure.configFiles.forEach(config => {
        console.log(`   ✅ ${config.path} (${config.type})`);
      });
    } else {
      console.log('   ❌ No configuration files found');
    }
    console.log();
  }

  generatePaths() {
    console.log('📝 GENERATED PATHS FOR DOCUMENTATION');
    console.log('===================================\n');
    
    // Generate path arrays for documentation generator
    const paths = {
      packageJsonFiles: this.structure.packageJsonFiles.map(p => p.path),
      envFiles: this.structure.envFiles.map(p => p.path),
      componentDirs: this.structure.componentDirs.map(p => p.path),
      hookDirs: this.structure.hookDirs.map(p => p.path),
      utilDirs: this.structure.utilDirs.map(p => p.path),
      srcDirs: this.structure.srcDirs.map(p => p.path)
    };
    
    console.log('// Use these paths in your documentation generator:');
    console.log('const discoveredPaths = {');
    Object.entries(paths).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value, null, 2)},`);
    });
    console.log('};');
    console.log();
    
    // Save to file
    fs.writeFileSync('project-structure.json', JSON.stringify(this.structure, null, 2));
    console.log('💾 Structure saved to: project-structure.json');
    console.log();
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const scanner = new ProjectStructureScanner(projectPath);
  scanner.scan();
}

module.exports = ProjectStructureScanner;