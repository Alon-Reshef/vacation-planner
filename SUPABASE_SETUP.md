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

4. Restart the dev server: `npm run dev`.

## 5. First launch — create admin

1. Open the app in the browser.
2. You’ll see **Set up your trip**.
3. Enter your name, **email**, **password**, and trip name.
4. This creates your Supabase account, trip, and admin profile.

## 6. Deploy (Vercel / Netlify)

Add the same two variables in the host’s environment settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy after saving.

## Migrating old browser data

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
