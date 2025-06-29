# Deployment Guide

## Current Deployment Status

**Live Application:** Deployment in progress
**Source Code:** https://github.com/deebyrne26/health-platform
**Documentation Site:** Auto-deployed with GitHub Pages

## Deployment Architecture

### AWS Infrastructure
- **Frontend Hosting:** AWS Amplify
- **Backend API:** AWS Lambda + API Gateway
- **Database:** AWS RDS PostgreSQL
- **CDN:** CloudFront for global distribution
- **DNS:** Route 53 (planned)

### Build Pipeline
1. **Code Push** → GitHub repository
2. **GitHub Actions** → Automated analysis and documentation
3. **AWS Amplify** → Frontend build and deployment
4. **GitHub Pages** → Documentation deployment

## Automatic Deployment

### Frontend Deployment (AWS Amplify)

**Build Configuration:**
```yaml
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
```

**Environment Variables:**
- `VITE_API_BASE_URL`: https://9ob6wg0l1e.execute-api.us-east-1.amazonaws.com/dev
- `VITE_APP_ENV`: production

### Documentation Deployment (GitHub Actions)

**Automatic Updates:**
- ✅ Runs on every push to main branch
- ✅ Analyzes codebase for changes
- ✅ Regenerates documentation
- ✅ Deploys to GitHub Pages

**Workflow Triggers:**
- Code changes in `frontend/`, `backend/`, or `docs/`
- Manual workflow dispatch
- Pull request to main branch (for testing)

## Manual Deployment

### Frontend Build and Deploy

```bash
# Build for production
npm run web:build

# Deploy via AWS CLI (if configured)
aws amplify start-deployment --app-id YOUR_APP_ID

# Or use Amplify Console for manual deployment
```

### Documentation Build and Deploy

```bash
# Generate latest documentation
npm run generate-docs

# Build documentation site
npm run docs:build

# Manual deploy to GitHub Pages (if needed)
npm run docs:deploy
```

## Environment Configuration

### Development Environment
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### Staging Environment
```env
VITE_API_BASE_URL=https://staging-api.health platform.com
VITE_APP_ENV=staging
VITE_DEBUG_MODE=false
```

### Production Environment
```env
VITE_API_BASE_URL=https://9ob6wg0l1e.execute-api.us-east-1.amazonaws.com/dev
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_SENTRY_DSN=your_sentry_dsn_here
```

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
```bash
# Check application health
curl https://your-app.com/health

# Check API health
npm run analyze-api

# Check documentation build
npm run docs:build
```

## Rollback Procedures

### Amplify Rollback
1. **Access AWS Amplify Console**
2. **Navigate to your app**
3. **Go to "App settings" → "Rewrites and redirects"**
4. **Select previous successful deployment**
5. **Click "Promote to main"**

### Git-based Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit (destructive)
git reset --hard COMMIT_HASH
git push --force origin main
```

### Documentation Rollback
Documentation automatically reverts with code rollbacks since it's generated from the codebase.

## Security Configuration

### HTTPS and SSL
- **Amplify:** Automatic SSL certificate management
- **Custom Domain:** AWS Certificate Manager integration
- **HSTS:** HTTP Strict Transport Security enabled

### CORS Configuration
```javascript
// API Gateway CORS settings
{
  "Access-Control-Allow-Origin": "https://your-app.com",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
}
```

## Custom Domain Setup

### Setting Up Custom Domain

1. **Purchase domain** through Route 53 or external registrar
2. **Configure DNS** in Route 53 hosted zone
3. **Add domain to Amplify** app settings
4. **Update SSL certificate** via Certificate Manager
5. **Configure redirects** from www to apex domain

### DNS Configuration
```
# Route 53 Records
Type: A
Name: @
Value: Amplify app domain

Type: CNAME  
Name: www
Value: main.amplifyapp.com
```

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
