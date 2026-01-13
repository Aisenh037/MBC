# 🚀 SIMPLIFIED STARTUP GUIDE

Your local PostgreSQL and Redis are already running! Follow these steps:

## Step 1: Configure Local Database (One-time Setup)

Create `mbc-backend/.env.development`:

```bash
# Database - Using your LOCAL PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mbc_db"

# Redis - Using your LOCAL Redis  
REDIS_URL="redis://localhost:6379"

# Supabase (use your actual credentials for auth)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here

# JWT
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# App Config
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

## Step 2: Create Database & Run Migrations

```powershell
# Connect to PostgreSQL and create database
psql -U postgres
CREATE DATABASE mbc_db;
\q

# Run migrations
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-backend
npx prisma migrate deploy

# Seed initial data
npm run seed

# Create admin user
npx tsx src/scripts/create-admin-simple.ts
```

## Step 3: Start Backend

```powershell
# Terminal 1
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-backend
npm run dev
```

Backend runs at: http://localhost:5000

## Step 4: Start Frontend

```powershell
# Terminal 2 (new window)
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-frontend
npm run dev
```

Frontend runs at: http://localhost:5173

## Step 5: Access Application

Open: http://localhost:5173

Login:
- Email: **admin@mbc.edu**
- Password: **Password@123**

## Step 6: Setup Tunneling (Optional)

```powershell
# Install ngrok
choco install ngrok

# Terminal 3  
ngrok http 5173
```

Share the HTTPS URL for external testing!

---

## Quick Troubleshooting

**Can't create database?**
```powershell
# Use pgAdmin or run:
createdb -U postgres mbc_db
```

**Don't have PostgreSQL password?**
- Default is usually: `postgres`
- Or check your PostgreSQL installation

**Port conflicts?**
- Your services are ALREADY running on 5432 (PostgreSQL) and 6379 (Redis)
- Just use them!

**Supabase credentials?**
- Get from: https://supabase.com/dashboard
- Project Settings → API → URL and Keys
