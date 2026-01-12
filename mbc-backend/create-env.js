
const fs = require('fs');
const path = require('path');

const content = `NODE_ENV=development
PORT=5000
HOST=0.0.0.0
LOG_LEVEL=info

# Database Configuration (Supabase Cloud)
DATABASE_URL="postgresql://postgres.tkdzmxtedaqgsbkzmmch:#Supabase$25@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.tkdzmxtedaqgsbkzmmch:#Supabase$25@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://tkdzmxtedaqgsbkzmmch.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrZHpteHRlZGFxZ3Nia3ptbWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDY2NjAsImV4cCI6MjA3NTU4MjY2MH0.sgRH2a7VQFv_505Rvfipc5HOjlONtJhWgX735zLwBFU"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAwNjY2MCwiZXhwIjoyMDc1NTgyNjYwfQ.7Waa2jt9QeYlDuJsFXHfwIoCy4A8AfhXF88PYZGnRJ8"

# JWT Configuration
JWT_SECRET="super-secret-jwt-key-256-bit-encryption"
JWT_EXPIRES_IN="1d"
JWT_COOKIE_EXPIRES_IN="1"

# Frontend Configuration
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"
`;

fs.writeFileSync(path.join(__dirname, '.env'), content.trim());
console.log('.env file created successfully');
