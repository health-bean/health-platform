# Development Setup Guide

## Prerequisites

- **Node.js:** v18 or higher ([Download](https://nodejs.org/))
- **npm:** v8 or higher (comes with Node.js)
- **Git:** Latest version ([Download](https://git-scm.com/))
- **Code Editor:** VS Code recommended ([Download](https://code.visualstudio.com/))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/deebyrne26/health-platform.git
cd health-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies and set up monorepo
npm install

# Install all workspace dependencies
npm run install-all
```

### 3. Environment Configuration

```bash
# Copy environment template
cp frontend/web-app/.env.example frontend/web-app/.env

# Edit environment variables
nano frontend/web-app/.env
```

**Required Environment Variables:**
```env
VITE_API_BASE_URL=https://9ob6wg0l1e.execute-api.us-east-1.amazonaws.com/dev
VITE_APP_ENV=development
```

### 4. Start Development Servers

```bash
# Start web application (Frontend)
npm run web:dev

# Start documentation site (separate terminal)
npm run docs:dev

# Run analysis tools
npm run analyze
```

## Project Structure

```
Health Platform/
├── frontend/
│   ├── shared/           # 6 shared components
│   └── web-app/          # Main React application
├── backend/              # API and server logic
├── docs/                 # Documentation site
├── scripts/              # Build and utility scripts
└── package.json          # Root package.json (monorepo)
```

## Available Scripts

### Root Level Commands
- `npm run analyze` - Analyze codebase and generate reports
- `npm run analyze-api` - Test API endpoints
- `npm run generate-docs` - Generate documentation
- `npm run web:dev` - Start web app development server
- `npm run web:build` - Build web app for production
- `npm run docs:dev` - Start documentation server
- `npm run docs:build` - Build documentation

### Web Application (`frontend/web-app/`)
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Documentation (`docs/`)
- `npm start` - Start development server (http://localhost:3000)
- `npm run build` - Build static site
- `npm run serve` - Serve built site locally

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Run analysis to check impact
npm run analyze

# Test the application
npm run web:dev
```

### 2. Testing Changes
```bash
# Test web application
npm run web:dev
# Visit: http://localhost:5173

# Test documentation  
npm run docs:dev
# Visit: http://localhost:3000

# Run API tests (if backend available)
npm run analyze-api
```

### 3. Documentation Updates
```bash
# Generate fresh documentation
npm run generate-docs

# Preview documentation changes
npm run docs:dev
```

### 4. Commit and Deploy
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add your feature description"  

# Push to trigger auto-deployment
git push origin feature/your-feature-name
```

## Component Development

### Creating Shared Components

```bash
# Navigate to shared components
cd frontend/shared/components/ui

# Create new component file
touch NewComponent.jsx
```

**Component Template:**
```jsx
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
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default NewComponent;
```

### Using Shared Components

```jsx
import { NewComponent } from '../../../shared/components/ui';

function MyPage() {
  return (
    <NewComponent variant="primary">
      Content here
    </NewComponent>
  );
}
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill processes on port 3000 or 5173
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**Node Modules Issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf frontend/*/node_modules
rm -rf docs/node_modules
npm install
```

**Build Failures:**
```bash
# Check Node.js version
node --version  # Should be v18+

# Clear npm cache
npm cache clean --force

# Rebuild from scratch
npm run clean && npm install
```

### Getting Help

1. **Check documentation:** Generated docs at http://localhost:3000
2. **Review analysis reports:** Run `npm run analyze`
3. **Check API status:** Run `npm run analyze-api`
4. **Component issues:** Review component library documentation

## IDE Setup (VS Code)

### Recommended Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

---

*This setup guide is automatically generated and updated with each codebase analysis.*
