# MBC Department Management System - Tunneling Setup

Quick guide to expose your local development server for external testing.

## Option 1: ngrok (Recommended)

### Install
```powershell
# Via Chocolatey
choco install ngrok

# Or download from https://ngrok.com/download
```

### Usage
```powershell
# Tunnel frontend (in new terminal)
ngrok http 5173

# Tunnel backend (in another terminal)  
ngrok http 5000
```

### Update Frontend Config
After ngrok starts, copy the HTTPS URL and update `mbc-frontend/.env`:
```bash
VITE_API_URL=https://your-backend-url.ngrok-free.app
```

## Option 2: localtunnel

### Install
```powershell
npm install -g localtunnel
```

### Usage
```powershell
# Frontend
lt --port 5173

# Backend
lt --port 5000
```

## Option 3: Cloudflare Tunnel (Most Secure)

### Install
Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

### Usage
```powershell
cloudflared tunnel --url http://localhost:5173
```

## Testing Your Tunnel

1. Start your tunnel
2. Copy the public URL (e.g., `https://abc123.ngrok-free.app`)
3. Share with others to test
4. They can access your app externally

## Tips

- **Keep tunnels running**: Don't close the terminal with the tunnel
- **Update CORS**: If you get CORS errors, update backend `.env`:
  ```
  CORS_ORIGIN=https://your-frontend-tunnel-url.ngrok-free.app
  ```
- **Restart backend**: After changing CORS settings
- **Security**: Never expose production databases via tunnels
