# MANUAL .env UPDATE INSTRUCTIONS

Since you have the .env file open in your editor, please update these lines manually:

## Find and Replace in mbc-backend/.env

### 1. Update DATABASE_URL
**Find this line** (around line 35):
```
DATABASE_URL=postgresql://postgres.tkgsbkzmmch...
```

**Replace with**:
```
DATABASE_URL="postgresql://postgres:Postgres21@localhost:5432/mbc"
```

### 2. Add/Update DIRECT_URL
**Add this line right after DATABASE_URL**:
```
DIRECT_URL="postgresql://postgres:Postgres21@localhost:5432/mbc"
```

### 3. Update REDIS_URL
**Find**:
```
REDIS_URL=redis://:...
```

**Replace with**:
```
REDIS_URL="redis://localhost:6379"
```

## After Saving

Run these commands:

```powershell
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-backend

# Run migrations
npx prisma migrate deploy

# Start backend
npm run dev
```

In a new terminal:
```powershell
cd c:\Users\ASUS\Desktop\MDS_Minor_Projects\MBC_DEPT_MNGMNT\mbc-frontend

# Start frontend
npm run dev
```

## Verify

- Backend: http://localhost:5000/api/v1/health
- Frontend: http://localhost:5173
- Login: admin@mbc.edu / Password@123
