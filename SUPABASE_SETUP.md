# Supabase setup (free tier)

Follow these steps **once** before running the app.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. **New project** → choose a name and database password (save the password).
3. Wait until the project is ready (~2 minutes).

## 2. Run the database schema

1. In Supabase: **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy all contents, paste into the editor.
3. Click **Run**. You should see “Success”.

## 3. Turn off email confirmation (required for invites)

1. **Authentication** → **Providers** → **Email**.
2. Disable **Confirm email** (or “Enable email confirmations” OFF).
3. Save.

Invited family members can sign in immediately with the password you set.

## 4. Copy API keys into `.env`

1. **Project Settings** → **API**.
2. Copy **Project URL** and **anon public** key.
3. In the project folder, create `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** URL must be **only** `https://YOUR_PROJECT.supabase.co` — do **not** add `/rest/v1` (causes error `PGRST125`).

4. Restart the dev server: `npm run dev`.

## 5. First launch — create admin

1. Open the app in the browser.
2. You’ll see **Set up your trip**.
3. Enter your name, **email**, **password**, and trip name.
4. This creates your Supabase account, trip, and admin profile.

## 6. Deploy (Vercel / Netlify / GitHub Pages)

Add the same two variables in the host’s environment settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the **anon public** key (starts with `eyJ...`). If you see a newer `sb_publishable_` key, check API settings for the legacy anon key as well.

Redeploy after saving.

### GitHub Pages — required Auth URLs

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL:** `https://alon-reshef.github.io/vacation-planner/`
3. **Redirect URLs** — add:
   - `https://alon-reshef.github.io/vacation-planner/**`
4. Save

Without this, sign-in and data loading can fail on the public site.

### GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then push to `main` — the workflow redeploys automatically.

## 7. Migrating old browser data

If you used the app before Supabase, data may still be in `localStorage`. After you sign in as **admin**, it uploads automatically if the cloud trip is empty.

## Tables (what is stored where)

| Table | Content |
|-------|---------|
| `trips` | Trip name, page titles |
| `hotels` | Hotel reservations |
| `travel_days` | Itinerary days |
| `profiles` | Users, roles, emails (linked to Supabase Auth) |

Auth passwords are managed by **Supabase Auth**, not in your tables.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Supabase is not configured” | Create `.env` with both `VITE_` variables and restart `npm run dev` |
| “No profile found” | User was not invited; admin must add them under Admin → Invite |
| Invite fails | Turn off email confirmation; use a new email not already registered |
| Data not syncing | Check same Supabase project keys on PC and phone builds |
| Error on GitHub Pages | Set Auth URL Configuration; use anon key in GitHub secrets; click Clear sign-in & retry |
| `PGRST125` Invalid path | Fix `VITE_SUPABASE_URL` — use `https://xxx.supabase.co` only, no `/rest/v1` |
