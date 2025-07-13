#!/bin/bash
# Development Environment Setup Script
# This sets up secure environment variables for local development

echo "Setting up secure development environment..."

# Set database password (you'll need to enter this manually for security)
echo "Please enter the database password:"
read -s DB_PASSWORD
export DB_PASSWORD="$DB_PASSWORD"

# Generate a secure JWT secret for this session
export JWT_SECRET=$(openssl rand -base64 32)

echo "Environment variables set for this session."
echo "JWT_SECRET generated: ${JWT_SECRET:0:10}..."
echo "To make permanent, add to your shell profile (.bashrc, .zshrc, etc.)"
echo ""
echo "For production, these should be in AWS Secrets Manager."
