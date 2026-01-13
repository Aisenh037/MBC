# Kill processes on development ports
Write-Host "Cleaning up development ports..." -ForegroundColor Yellow

# Function to kill process on a specific port
function Kill-ProcessOnPort {
    param($Port)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Killing process $($process.Name) (PID: $($process.Id)) on port $Port" -ForegroundColor Cyan
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Clean up ports
Kill-ProcessOnPort 5000  # Backend
Kill-ProcessOnPort 5001  # AI Service
Kill-ProcessOnPort 5173  # Frontend

# Kill any remaining node/python processes from this project
Write-Host "Cleaning up remaining processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*MBC_DEPT_MNGMNT*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*MBC_DEPT_MNGMNT*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Cleanup complete!" -ForegroundColor Green
Start-Sleep -Seconds 2
