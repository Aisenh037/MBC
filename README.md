# MBC Department Management System

Full-stack app for managing MBC (Mathematics, Bio-Informatics & Computer Applications) Department at NIT-B.

## Quick Start (Local without Docker)
- Prerequisites: Node 18+, MongoDB (or use in-memory DB)
- Backend
  - Copy `.env.example` to `.env` and set values
  - Run: `cd mbc-backend && npm ci && npm run dev`
- Frontend
  - Set `VITE_API_URL` in `.env` (frontend) to `http://localhost:5000`
  - Run: `cd mbc-frontend && npm ci && npm run dev`

## Local with Docker Compose
- Copy `mbc-backend/.env.example` to `mbc-backend/.env` and set secrets
- Run: `docker compose up --build`
- Open: Frontend http://localhost:5173, Backend http://localhost:5000

## Deploy to Render
A Render blueprint is provided in `render.yaml`:
- `mbc-backend`: Node web service
  - Set environment variables in the dashboard:
    - `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
    - `CORS_ORIGIN` to your frontend URL
- `mbc-frontend`: Static site
  - Set `VITE_API_URL` to your backend URL (or rely on provided proxy routes)
  - Proxies `/api/*` and `/uploads/*` to backend

### Environment Variables
See `mbc-backend/.env.example` and `mbc-frontend/.env.example` for the list and descriptions.

## Healthcheck
- Backend: `GET /` returns `{ success: true }` when healthy

## Notes
- Uploads are stored at `mbc-backend/public/uploads` and persisted in Docker via a volume and on Render via a disk.

See `DEPLOYMENT.md` for more details.
