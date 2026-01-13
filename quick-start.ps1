# Quick Start Script for MBC Department Management System
# PowerShell version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MBC Department Management System" -ForegroundColor Cyan
Write-Host "Quick Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker Desktop is running
$dockerRunning = $false
try {
    $null = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "[OK] Docker Desktop is running" -ForegroundColor Green
    }
}
catch {
    # Docker not available
}

if (-not $dockerRunning) {
    Write-Host "[!] Docker Desktop is not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Start Docker Desktop - recommended" -ForegroundColor White
    Write-Host "2. Manual setup without Docker" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter your choice - 1 or 2"
    
    if ($choice -eq "1") {
        Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Write-Host "Waiting for Docker to initialize..." -ForegroundColor Yellow
        Write-Host "This will take about 30 seconds" -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        $dockerRunning = $true
    }
    else {
        Write-Host ""
        Write-Host "Manual Setup Required:" -ForegroundColor Yellow
        Write-Host "1. Install PostgreSQL 15+" -ForegroundColor White
        Write-Host "2. Install Redis 7+" -ForegroundColor White
        Write-Host "3. Install MongoDB 6+" -ForegroundColor White
        Write-Host "4. Update .env file with connection details" -ForegroundColor White
        Write-Host ""
        Write-Host "Then run: npm run dev" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit
    }
}

if ($dockerRunning) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Starting Database Services" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Start database services
    Write-Host "Starting PostgreSQL, Redis, and MongoDB..." -ForegroundColor Yellow
    docker-compose up -d postgres redis mongo
    
    Write-Host "Waiting for databases to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Setting Up Backend" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location mbc-backend
    
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate
    
    Write-Host "Running Database Migrations..." -ForegroundColor Yellow
    npx prisma migrate deploy
    
    Write-Host "Seeding Initial Data..." -ForegroundColor Yellow
    npm run seed
    
    Write-Host "Creating Admin User..." -ForegroundColor Yellow
    npx tsx src/scripts/create-admin-simple.ts
    
    Write-Host ""
    Write-Host "Starting Backend Server..." -ForegroundColor Green
    $backendPath = Get-Location
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"
    
    Pop-Location
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Starting Frontend" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Push-Location mbc-frontend
    $frontendPath = Get-Location
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"
    Pop-Location
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services Running:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "Default Admin Login:" -ForegroundColor Cyan
    Write-Host "  Email:    admin@mbc.edu" -ForegroundColor White
    Write-Host "  Password: Password@123" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Next Steps" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Set up tunneling with ngrok:" -ForegroundColor Yellow
    Write-Host "  1. Install: choco install ngrok" -ForegroundColor White
    Write-Host "  2. Run: ngrok http 5173" -ForegroundColor White
    Write-Host ""
    Write-Host "Test the application:" -ForegroundColor Yellow  
    Write-Host "  1. Open http://localhost:5173" -ForegroundColor White
    Write-Host "  2. Login with admin credentials" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Read-Host "Press Enter to exit"
