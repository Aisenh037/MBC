#!/usr/bin/env node

/**
 * Environment Setup Script
 * Copies .env.example files to .env files if they don't exist
 * and provides guidance for configuration
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const envFiles = [
  {
    source: join(rootDir, '.env.example'),
    target: join(rootDir, '.env'),
    name: 'Root'
  },
  {
    source: join(rootDir, 'mbc-backend', '.env.example'),
    target: join(rootDir, 'mbc-backend', '.env'),
    name: 'Backend'
  },
  {
    source: join(rootDir, 'mbc-frontend', '.env.example'),
    target: join(rootDir, 'mbc-frontend', '.env'),
    name: 'Frontend'
  }
];

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyEnvFile(source, target, name) {
  try {
    if (await fileExists(target)) {
      console.log(`✅ ${name} .env file already exists`);
      return;
    }

    if (!(await fileExists(source))) {
      console.log(`⚠️  ${name} .env.example file not found`);
      return;
    }

    await fs.copyFile(source, target);
    console.log(`✅ Created ${name} .env file from .env.example`);
  } catch (error) {
    console.error(`❌ Failed to create ${name} .env file:`, error.message);
  }
}

async function generateSecrets() {
  const crypto = await import('crypto');
  
  return {
    jwtSecret: crypto.randomBytes(64).toString('hex'),
    postgresPassword: crypto.randomBytes(32).toString('hex'),
    redisPassword: crypto.randomBytes(32).toString('hex')
  };
}

async function main() {
  console.log('🚀 Setting up MBC Department Management System environment...\n');

  // Copy environment files
  for (const envFile of envFiles) {
    await copyEnvFile(envFile.source, envFile.target, envFile.name);
  }

  console.log('\n📝 Environment Setup Complete!\n');

  // Generate secure secrets
  const secrets = await generateSecrets();
  
  console.log('🔐 Generated secure secrets (replace in your .env files):');
  console.log(`JWT_SECRET=${secrets.jwtSecret}`);
  console.log(`POSTGRES_PASSWORD=${secrets.postgresPassword}`);
  console.log(`REDIS_PASSWORD=${secrets.redisPassword}\n`);

  console.log('📋 Next Steps:');
  console.log('1. Update the .env files with your actual configuration values');
  console.log('2. Set up your Supabase project and update SUPABASE_* variables');
  console.log('3. Configure your email service (SMTP_* variables)');
  console.log('4. Run "npm run docker:up" to start the services');
  console.log('5. Run "npm run migrate" to set up the database schema');
  console.log('6. Run "npm run seed" to populate initial data\n');

  console.log('🔗 Useful Commands:');
  console.log('  npm run dev          - Start all services in development mode');
  console.log('  npm run docker:up    - Start Docker services');
  console.log('  npm run migrate      - Run database migrations');
  console.log('  npm run seed         - Seed initial data');
  console.log('  npm run test         - Run all tests');
  console.log('  npm run build        - Build all services for production\n');

  console.log('📚 Documentation:');
  console.log('  - Backend API: http://localhost:5000/api/v1/docs (after starting)');
  console.log('  - Frontend: http://localhost:5173 (after starting)');
  console.log('  - AI Service: http://localhost:5001/docs (after starting)\n');
}

main().catch(console.error);