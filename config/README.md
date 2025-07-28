# Configuration Templates

This folder contains environment configuration templates for different deployment environments.

## 🗂️ Files

### Environment Templates (Safe for Git)
- **`.env.local.template`** - Local development configuration
- **`.env.staging.template`** - Staging environment configuration  
- **`.env.production.template`** - Production environment configuration
- **`amplify.yml`** - AWS Amplify deployment configuration

## 🚀 Usage

### Setting Up Local Development
```bash
# Copy template to root directory
cp config/.env.local.template .env.local

# Edit with your actual values
nano .env.local

# The .env.local file will be git-ignored for security
```

### Setting Up Other Environments
```bash
# For staging
cp config/.env.staging.template .env.staging

# For production  
cp config/.env.production.template .env.production
```

## 🔒 Security Notes

- **Templates are safe to commit** - they contain placeholders, not real secrets
- **Actual .env files are git-ignored** - they contain real passwords/secrets
- **Never commit files with real credentials** to version control
- **Replace ALL placeholder values** before using

## 📝 Template Format

Templates use placeholder format:
```bash
DB_PASSWORD=REPLACE_WITH_YOUR_ACTUAL_PASSWORD
JWT_SECRET=REPLACE_WITH_YOUR_JWT_SECRET
```

Replace `REPLACE_WITH_*` values with actual configuration for your environment.

---

**Last Updated**: July 27, 2025  
**Security Level**: Templates only - no actual secrets
