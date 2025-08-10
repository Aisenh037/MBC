# MBC Department Management System

Full-stack app for managing MBC (Mathematics, Bio-Informatics & Computer Applications) Department at NIT-B.

## Local Development

- Prerequisites: Node 18+, MongoDB (or use in-memory DB)
- Backend
  - Copy `.env.example` to `.env` and set values
  - Run: `cd mbc-backend && npm ci && npm run dev`
- Frontend
  - Set `VITE_API_URL` in `.env` (frontend) to `http://localhost:5000`
  - Run: `cd mbc-frontend && npm ci && npm run dev`

## Deploy to Render

A Render blueprint is provided in `render.yaml`:
- `mbc-backend`: Node web service
  - Set environment variables in the dashboard:
    - `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
    - `CORS_ORIGIN` to your frontend URL
- `mbc-frontend`: Static site
  - Set `VITE_API_URL` to your backend URL
  - Proxies `/api/*` and `/uploads/*` to backend

### Environment Variables
See `.env.example` for the list and descriptions.

## Healthcheck
- Backend: `GET /` returns `{ success: true }` when healthy

## Notes
- Uploads are stored at `mbc-backend/public/uploads` and persisted on Render via a disk.
