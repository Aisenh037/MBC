# QUICK START - Manual Commands
# Use these commands if Docker Desktop is not ready yet

## Step 1: Start Docker Desktop First
Open Docker Desktop from Start Menu and wait until it fully starts (whale icon in system tray should be steady).

## Step 2: Start Database Services
```powershell
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT
docker-compose up -d postgres redis mongo
```

Wait 10 seconds for databases to initialize.

## Step 3: Setup Backend Database
```powershell
cd mbc-backend
npx prisma generate
npx prisma migrate deploy
npm run seed
npx tsx src/scripts/create-admin-simple.ts
```

## Step 4: Start Backend Server (Terminal 1)
```powershell
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-backend
npm run dev
```

Keep this terminal open - backend runs at http://localhost:5000

## Step 5: Start Frontend Server (Terminal 2 - New Window)
```powershell
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-frontend
npm run dev
```

Keep this terminal open - frontend runs at http://localhost:5173

## Step 6: Access Application
Open browser: http://localhost:5173

Login:
- Email: admin@mbc.edu
- Password: Password@123

## Step 7: Setup Tunneling (Terminal 3 - Optional)
```powershell
# Install ngrok first
choco install ngrok

# Then tunnel frontend
ngrok http 5173
```

Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok-free.app)

## Step 8: Configure Backend Tunnel (Terminal 4 - Optional)
```powershell
ngrok http 5000
```

Update `mbc-frontend\.env`:
```
VITE_API_URL=https://your-backend-url.ngrok-free.app
```

Restart frontend (Ctrl+C in Terminal 2, then `npm run dev` again)

---

## Troubleshooting

### Database Connection Failed
```powershell
docker-compose restart postgres redis mongo
```

### Port Already in Use
```powershell
netstat -ano | findstr :5000
netstat -ano | findstr :5173
# Kill the process if needed
taskkill /PID <PID_NUMBER> /F
```

### Prisma Client Not Found
```powershell
cd mbc-backend
npx prisma generate
npm run build
```
