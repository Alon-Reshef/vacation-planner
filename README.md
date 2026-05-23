# Vacation Plan 🌴

Mobile-first vacation itinerary app with **Supabase** cloud storage — sync hotels and travel days across iPhone, PC, and the web.

## Features

- **Home** — day-by-day itinerary (date, hotel, activities, travel to next destination)
- **Hotels** — reservations with confirmations and contact info
- **Admin** — invite users (viewer/editor), customize titles, export/import JSON backup
- **Cloud sync** — all devices share the same data via Supabase (free tier)

## Quick start

### 1. Set up Supabase

Follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** (create project, run SQL, add `.env`).

### 2. Run locally

```powershell
cd vacation-planner
npm install
npm run dev
```

Open `http://localhost:5173` — first time you’ll create your admin account.

### 3. iPhone (same Wi‑Fi)

Use the **Network** URL from the terminal, e.g. `http://192.168.x.x:5173`.

---

## Upload a new version to GitHub

If the repo already exists and you only want to push updates:

```powershell
cd vacation-planner
git add .
git commit -m "Add Supabase cloud sync for hotels and itinerary"
git push
```

### First time pushing to GitHub

1. Create a repo at [github.com/new](https://github.com/new) (no README).
2. Run:

```powershell
cd vacation-planner
git init
git add .
git commit -m "Vacation planner with Supabase sync"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vacation-planner.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Deploy (Vercel recommended)

1. Push to GitHub (above).
2. [vercel.com](https://vercel.com) → Import repository.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy → use the `.vercel.app` URL or connect your custom domain.

Every `git push` to `main` can auto-deploy a new version.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (network enabled for phone testing) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Tech stack

React, TypeScript, Vite, Tailwind CSS, React Router, Supabase
