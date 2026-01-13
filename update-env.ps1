# Update mbc-backend/.env for Local Development
# Run this script to update your .env file

Write-Host "Updating .env for local development..." -ForegroundColor Cyan

$envPath = "c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-backend\.env"

# Backup current .env
Copy-Item $envPath "$envPath.backup" -Force
Write-Host "✓ Backed up current .env to .env.backup" -ForegroundColor Green

# Read current .env
$content = Get-Content $envPath -Raw

# Update DATABASE_URL
$content = $content -replace 'DATABASE_URL=.*', 'DATABASE_URL="postgresql://postgres:Postgres21@localhost:5432/mbc"'

# Update DIRECT_URL (add if not exists)
if ($content -notmatch 'DIRECT_URL=') {
    $content = $content -replace '(DATABASE_URL=.*)', "`$1`nDIRECT_URL=`"postgresql://postgres:Postgres21@localhost:5432/mbc`""
}
else {
    $content = $content -replace 'DIRECT_URL=.*', 'DIRECT_URL="postgresql://postgres:Postgres21@localhost:5432/mbc"'
}

# Update REDIS_URL
$content = $content -replace 'REDIS_URL=.*', 'REDIS_URL="redis://localhost:6379"'

# Save updated .env
Set-Content -Path $envPath -Value $content

Write-Host "✓ Updated .env file" -ForegroundColor Green
Write-Host ""
Write-Host "Database connection updated to:" -ForegroundColor Yellow
Write-Host "  postgresql://postgres:Postgres21@localhost:5432/mbc" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd mbc-backend" -ForegroundColor White
Write-Host "2. npx prisma migrate deploy" -ForegroundColor White
Write-Host "3. npm run dev" -ForegroundColor White
