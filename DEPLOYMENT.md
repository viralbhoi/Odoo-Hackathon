# TransitOps Deployment Guide

Both services are deployment-ready. Follow the steps below to go live.

---

## 1. Deploy Backend on Render

### Step 1 — Create a Web Service
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect the GitHub repo: `viralbhoi/Odoo-Hackathon`

### Step 2 — Configure the Service
| Field | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Node Version** | `22` |

### Step 3 — Add Environment Variables
In the Render dashboard under **Environment → Environment Variables**, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `JWT_SECRET` | Any strong random string (e.g. use [randomkeygen.com](https://randomkeygen.com)) |
| `JWT_REFRESH_SECRET` | A different strong random string |
| `PORT` | `5000` |
| `FRONTEND_URL` | *(Add this AFTER deploying the frontend — paste your Vercel URL here)* |

> **Note:** Leave `GOOGLE_CLIENT_ID`, `REDIS_URL`, and `SENTRY_DSN` empty for now — they are optional.

### Step 4 — Deploy
Click **Create Web Service**. Render will build and start the backend automatically.

Once deployed, copy the URL — it will look like:
`https://transitops-backend.onrender.com`

---

## 2. Deploy Frontend on Vercel

### Step 1 — Import the Project
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import the GitHub repo: `viralbhoi/Odoo-Hackathon`

### Step 2 — Configure the Project (IMPORTANT for pnpm monorepo)
| Field | Value |
|---|---|
| **Root Directory** | *(Leave empty / root of repo)* |
| **Framework Preset** | `Vite` |
| **Build Command** | `cd frontend && pnpm run build` |
| **Output Directory** | `frontend/dist/public` |
| **Install Command** | `pnpm install` |

### Step 3 — Add Environment Variable
In Vercel under **Environment Variables**, add:

| Key | Value |
|---|---|
| `BACKEND_URL` | Your Render backend URL **without** `https://` (e.g. `transitops-backend.onrender.com`) |

> This is used in `vercel.json` to proxy all `/api/*` requests to the Render backend.

### Step 4 — Deploy
Click **Deploy**. Vercel will build and publish the frontend.

---

## 3. Final Step — Update CORS on Render

Once the frontend is deployed and you have the Vercel URL (e.g. `https://transitops.vercel.app`):

1. Go back to your Render backend service
2. Under **Environment**, add/update:
   - `FRONTEND_URL` = `https://transitops.vercel.app`
3. Render will auto-redeploy with the new CORS setting

---

## Summary

```
Render (Backend) ← API requests ← Vercel (Frontend)
     |                                    |
     └── DATABASE_URL (Neon)             └── BACKEND_URL (Render URL)
         JWT_SECRET                           (no https://)
         JWT_REFRESH_SECRET
         FRONTEND_URL (Vercel URL)
```

**That's it! The app will be fully live.**
