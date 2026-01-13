@echo off
REM Quick Start Script for MBC Department Management System
REM This script helps you start the development environment

echo ========================================
echo MBC Department Management System
echo Quick Start Script
echo ========================================
echo.

REM Check if Docker Desktop is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker Desktop is not running!
    echo.
    echo Please start Docker Desktop and run this script again, OR
    echo Use manual setup option below.
    echo.
    choice /C YN /M "Do you want to start Docker Desktop now"
    if errorlevel 2 goto MANUAL_SETUP
    if errorlevel 1 (
        echo Opening Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo Waiting for Docker to start...
        timeout /t 30
    )
)

:DOCKER_SETUP
echo.
echo ========================================
echo Starting Services with Docker
echo ========================================
echo.

REM Start database services only
echo Starting PostgreSQL, Redis, and MongoDB...
docker-compose up -d postgres redis mongo

echo.
echo Waiting for databases to initialize...
timeout /t 10

echo.
echo ========================================
echo Setting Up Backend
echo ========================================

cd mbc-backend

echo Generating Prisma Client...
call npx prisma generate

echo.
echo Running Database Migrations...
call npx prisma migrate deploy

echo.
echo Seeding Initial Data...
call npm run seed

echo.
echo Creating Admin User...
call npx tsx src/scripts/create-admin-simple.ts

echo.
echo Starting Backend Server...
start "MBC Backend" cmd /k "npm run dev"

cd..

echo.
echo ========================================
echo Starting Frontend
echo ========================================

cd mbc-frontend
start "MBC Frontend" cmd /k "npm run dev"

cd..

goto END

:MANUAL_SETUP
echo.
echo ========================================
echo Manual Setup Instructions
echo ========================================
echo.
echo You need to install these services locally:
echo 1. PostgreSQL 15 or higher
echo 2. Redis 7 or higher  
echo 3. MongoDB 6 or higher
echo.
echo After installation:
echo 1. Update .env file with connection details
echo 2. Run: npm install
echo 3. Run: cd mbc-backend ^&^& npx prisma generate
echo 4. Run: cd mbc-backend ^&^& npx prisma migrate deploy
echo 5. Run: cd mbc-backend ^&^& npm run seed
echo 6. Run: npm run dev
echo.
pause
goto END

:END
echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Services Running:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo.
echo Default Admin Login:
echo   Email:    admin@mbc.edu
echo   Password: Password@123
echo.
echo ========================================
echo What's Next?
echo ========================================
echo.  
echo 1. Set up tunneling with ngrok:
echo    - Install: choco install ngrok
echo    - Run: ngrok http 5173
echo.
echo 2. Test the application:
echo    - Open http://localhost:5173
echo    - Login with admin credentials
echo.
echo Press any key to exit...
pause >nul
