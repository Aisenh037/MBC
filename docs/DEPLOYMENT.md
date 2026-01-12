## Deployment Guide

### Environment Variables

Backend (`mbc-backend/.env`):
- NODE_ENV, PORT, HOST, LOG_LEVEL
- MONGO_URI, USE_IN_MEMORY_DB
- JWT_SECRET, CORS_ORIGIN
- SEED_ADMIN, ADMIN_EMAIL, ADMIN_PASSWORD
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, FROM_NAME, FROM_EMAIL

Frontend (`mbc-frontend/.env`):
- VITE_API_URL (leave empty when using Docker/Compose so Nginx proxies /api)

### Local with Docker Compose

1. Copy env examples and fill secrets:
   - `cp mbc-backend/.env.example mbc-backend/.env`
   - Optionally set `MONGO_URI=mongodb://mongo:27017/mbcdb`
   - Set `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
2. Start:
   - `docker compose up --build`
3. Open:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

Uploads persist in `backend-uploads` volume; logs in `backend-logs`.

### Deploy to Render

A blueprint is provided in `render.yaml`.
- Backend: set `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN`.
- Frontend: set `VITE_API_URL` to backend URL or use provided proxy routes in render config.

### Production Notes
- Always set a strong `JWT_SECRET` and restrict `CORS_ORIGIN` to your domains.
- Configure SMTP for password resets/notifications.
- Monitor logs (`/logs`) and consider external logging/monitoring.
- Use MongoDB Atlas for production database with IP allowlists and users.