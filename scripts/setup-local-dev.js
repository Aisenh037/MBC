#!/usr/bin/env node

/**
 * Local Development Setup Script
 * Sets up the complete MBC system for local development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up MBC Department Management System for local development...\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, cwd = process.cwd()) {
  try {
    log(`Executing: ${command}`, 'cyan');
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error executing: ${command}`, 'red');
    log(error.message, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('📋 Checking prerequisites...', 'yellow');
  
  const requirements = [
    { name: 'Node.js', command: 'node --version', minVersion: '18.0.0' },
    { name: 'npm', command: 'npm --version', minVersion: '8.0.0' },
    { name: 'Docker', command: 'docker --version', minVersion: '20.0.0' },
    { name: 'Docker Compose', command: 'docker-compose --version', minVersion: '2.0.0' }
  ];

  let allGood = true;
  
  for (const req of requirements) {
    try {
      const output = execSync(req.command, { encoding: 'utf8' });
      log(`✅ ${req.name}: ${output.trim()}`, 'green');
    } catch (error) {
      log(`❌ ${req.name}: Not found or not working`, 'red');
      allGood = false;
    }
  }

  if (!allGood) {
    log('\n❌ Please install missing prerequisites before continuing.', 'red');
    process.exit(1);
  }

  log('✅ All prerequisites satisfied!\n', 'green');
}

function setupEnvironmentFiles() {
  log('📝 Setting up environment files...', 'yellow');

  // Backend environment
  const backendEnvPath = path.join(__dirname, '../mbc-backend/.env');
  if (!fs.existsSync(backendEnvPath)) {
    const backendEnvExample = path.join(__dirname, '../mbc-backend/.env.example');
    if (fs.existsSync(backendEnvExample)) {
      fs.copyFileSync(backendEnvExample, backendEnvPath);
      log('✅ Created mbc-backend/.env from example', 'green');
    } else {
      log('⚠️  No .env.example found for backend', 'yellow');
    }
  } else {
    log('✅ Backend .env already exists', 'green');
  }

  // Frontend environment
  const frontendEnvPath = path.join(__dirname, '../mbc-frontend/.env');
  if (!fs.existsSync(frontendEnvPath)) {
    const frontendEnvContent = `
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:5001
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
`;
    fs.writeFileSync(frontendEnvPath, frontendEnvContent.trim());
    log('✅ Created mbc-frontend/.env', 'green');
  } else {
    log('✅ Frontend .env already exists', 'green');
  }

  // AI Service environment
  const aiEnvPath = path.join(__dirname, '../ai-service/.env');
  if (!fs.existsSync(aiEnvPath)) {
    const aiEnvContent = `
DATABASE_URL=postgresql://mbc_user:mbc_password@localhost:5432/mbc_db
REDIS_URL=redis://:redis_password@localhost:6379
BACKEND_URL=http://localhost:5000
AI_PORT=5001
PYTHONPATH=/usr/src/app
`;
    fs.writeFileSync(aiEnvPath, aiEnvContent.trim());
    log('✅ Created ai-service/.env', 'green');
  } else {
    log('✅ AI service .env already exists', 'green');
  }

  log('');
}

function installDependencies() {
  log('📦 Installing dependencies...', 'yellow');

  // Root dependencies
  if (fs.existsSync('package.json')) {
    log('Installing root dependencies...', 'cyan');
    if (!execCommand('npm install')) {
      log('❌ Failed to install root dependencies', 'red');
      return false;
    }
  }

  // Backend dependencies
  log('Installing backend dependencies...', 'cyan');
  if (!execCommand('npm install', 'mbc-backend')) {
    log('❌ Failed to install backend dependencies', 'red');
    return false;
  }

  // Frontend dependencies
  log('Installing frontend dependencies...', 'cyan');
  if (!execCommand('npm install', 'mbc-frontend')) {
    log('❌ Failed to install frontend dependencies', 'red');
    return false;
  }

  // AI Service dependencies
  if (fs.existsSync('ai-service/requirements.txt')) {
    log('Installing AI service dependencies...', 'cyan');
    if (!execCommand('pip install -r requirements.txt', 'ai-service')) {
      log('⚠️  Failed to install AI service dependencies (optional)', 'yellow');
    }
  }

  log('✅ Dependencies installed successfully!\n', 'green');
  return true;
}

function setupDatabase() {
  log('🗄️  Setting up database...', 'yellow');

  // Start PostgreSQL and Redis with Docker Compose
  log('Starting PostgreSQL and Redis...', 'cyan');
  if (!execCommand('docker-compose up -d postgres redis')) {
    log('❌ Failed to start database services', 'red');
    return false;
  }

  // Wait for services to be ready
  log('Waiting for services to be ready...', 'cyan');
  execCommand('sleep 10');

  // Run database migrations
  log('Running database migrations...', 'cyan');
  if (!execCommand('npm run db:migrate', 'mbc-backend')) {
    log('⚠️  Database migrations failed (you may need to run them manually)', 'yellow');
  }

  // Seed database
  log('Seeding database...', 'cyan');
  if (!execCommand('npm run db:seed', 'mbc-backend')) {
    log('⚠️  Database seeding failed (you may need to run it manually)', 'yellow');
  }

  log('✅ Database setup completed!\n', 'green');
  return true;
}

function buildProjects() {
  log('🔨 Building projects...', 'yellow');

  // Build backend
  log('Building backend...', 'cyan');
  if (!execCommand('npm run build', 'mbc-backend')) {
    log('⚠️  Backend build failed', 'yellow');
  }

  // Build frontend
  log('Building frontend...', 'cyan');
  if (!execCommand('npm run build', 'mbc-frontend')) {
    log('⚠️  Frontend build failed', 'yellow');
  }

  log('✅ Build completed!\n', 'green');
}

function createStartupScripts() {
  log('📜 Creating startup scripts...', 'yellow');

  // Development startup script
  const devScript = `#!/bin/bash
echo "🚀 Starting MBC Development Environment..."

# Start database services
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services
echo "Waiting for services to start..."
sleep 5

# Start backend in background
echo "Starting backend server..."
cd mbc-backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background
echo "Starting frontend server..."
cd ../mbc-frontend && npm run dev &
FRONTEND_PID=$!

# Start AI service in background (optional)
if [ -f "ai-service/main.py" ]; then
  echo "Starting AI service..."
  cd ../ai-service && python main.py &
  AI_PID=$!
fi

echo ""
echo "🎉 MBC Development Environment is starting up!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5000"
echo "🤖 AI Service: http://localhost:5001"
echo "📊 API Docs: http://localhost:5000/api-docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID $AI_PID 2>/dev/null; docker-compose down; exit' INT
wait
`;

  fs.writeFileSync('start-dev.sh', devScript);
  execCommand('chmod +x start-dev.sh');

  // Windows batch script
  const winScript = `@echo off
echo 🚀 Starting MBC Development Environment...

echo Starting PostgreSQL and Redis...
docker-compose up -d postgres redis

echo Waiting for services to start...
timeout /t 5 /nobreak > nul

echo Starting backend server...
start "Backend" cmd /k "cd mbc-backend && npm run dev"

echo Starting frontend server...
start "Frontend" cmd /k "cd mbc-frontend && npm run dev"

if exist "ai-service\\main.py" (
    echo Starting AI service...
    start "AI Service" cmd /k "cd ai-service && python main.py"
)

echo.
echo 🎉 MBC Development Environment is starting up!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:5000
echo 🤖 AI Service: http://localhost:5001
echo 📊 API Docs: http://localhost:5000/api-docs
echo.
echo Close the command windows to stop services
pause
`;

  fs.writeFileSync('start-dev.bat', winScript);

  log('✅ Startup scripts created!', 'green');
  log('  - Linux/Mac: ./start-dev.sh', 'cyan');
  log('  - Windows: start-dev.bat\n', 'cyan');
}

function displayFinalInstructions() {
  log('🎉 Setup completed successfully!', 'green');
  log('', 'reset');
  log('📋 Next steps:', 'yellow');
  log('', 'reset');
  log('1. Configure your environment variables:', 'cyan');
  log('   - Update mbc-backend/.env with your database and service credentials', 'reset');
  log('   - Update mbc-frontend/.env with your API URLs', 'reset');
  log('', 'reset');
  log('2. Start the development environment:', 'cyan');
  log('   - Linux/Mac: ./start-dev.sh', 'reset');
  log('   - Windows: start-dev.bat', 'reset');
  log('   - Or manually: npm run dev in each service directory', 'reset');
  log('', 'reset');
  log('3. Access the application:', 'cyan');
  log('   - Frontend: http://localhost:5173', 'reset');
  log('   - Backend API: http://localhost:5000', 'reset');
  log('   - API Documentation: http://localhost:5000/api-docs', 'reset');
  log('   - AI Service: http://localhost:5001', 'reset');
  log('', 'reset');
  log('4. Test features:', 'cyan');
  log('   - User registration and login', 'reset');
  log('   - Assignment upload and submission', 'reset');
  log('   - Email notifications (configure Resend)', 'reset');
  log('   - SMS/WhatsApp notifications (configure Twilio)', 'reset');
  log('   - Real-time notifications', 'reset');
  log('', 'reset');
  log('📚 Documentation:', 'yellow');
  log('   - README.md for detailed setup instructions', 'reset');
  log('   - DEPLOYMENT_GUIDE.md for production deployment', 'reset');
  log('   - API documentation at /api-docs when server is running', 'reset');
  log('', 'reset');
  log('🐛 Troubleshooting:', 'yellow');
  log('   - Check logs in each service directory', 'reset');
  log('   - Ensure all environment variables are set', 'reset');
  log('   - Verify database and Redis are running', 'reset');
  log('', 'reset');
  log('Happy coding! 🚀', 'green');
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    setupEnvironmentFiles();
    
    if (!installDependencies()) {
      process.exit(1);
    }
    
    setupDatabase();
    buildProjects();
    createStartupScripts();
    displayFinalInstructions();
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();