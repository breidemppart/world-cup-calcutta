# World Cup Calcutta 2026 — Setup Guide

This app uses **Next.js** (hosted on Vercel) + **Supabase** (free-tier Postgres database with realtime).
Total setup time: ~15 minutes.

---

## Step 1 — Create a Supabase Project

1. Go to **https://supabase.com** and sign up / log in (free).
2. Click **"New project"**.
3. Name it something like `world-cup-calcutta`.
4. Choose a region close to you (e.g., US East).
5. Set a database password — save it somewhere safe.
6. Wait ~2 minutes for the project to spin up.

---

## Step 2 — Run the Database Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **"New query"**.
3. Open the file `supabase/schema.sql` from this project folder.
4. Copy the entire contents and paste into the SQL editor.
5. Click **"Run"**.
6. You should see: `Success. No rows returned.`

This creates the `teams` and `bids` tables, seeds all 48 teams, and sets up the atomic `place_bid` function.

### Enable Realtime (so bids update live without refreshing)

1. In Supabase, go to **Database → Replication** (in the left sidebar).
2. Under **"Source"**, find `supabase_realtime`.
3. Click **"0 tables"** next to it.
4. Toggle ON both **`teams`** and **`bids`**.
5. Save.

---

## Step 3 — Get Your Supabase Keys

1. In Supabase, go to **Settings → API** (gear icon in sidebar).
2. Copy these three values — you'll need them in Step 5:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Keep the service_role key secret — never expose it publicly.

---

## Step 4 — Push the Code to GitHub

1. Go to **https://github.com** and create a new **private** repository named `world-cup-calcutta`.
2. On your computer, open a terminal in the `world-cup-calcutta/` folder.
3. Run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/world-cup-calcutta.git
   git push -u origin main
   ```

---

## Step 5 — Deploy to Vercel

1. Go to **https://vercel.com** and sign up / log in (free — sign in with GitHub).
2. Click **"Add New… → Project"**.
3. Import your `world-cup-calcutta` GitHub repository.
4. Vercel auto-detects Next.js — no framework settings needed.
5. Before clicking Deploy, click **"Environment Variables"** and add all four:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |
   | `ADMIN_PASSWORD` | a password you choose for the admin panel |

6. Click **"Deploy"**.
7. Wait ~1 minute. Vercel gives you a URL like `world-cup-calcutta.vercel.app`.

---

## Step 6 — Share the Link

- **Main site** (for everyone): `https://your-project.vercel.app`
- **Admin panel** (for you): `https://your-project.vercel.app/admin`

Send the main site URL to your office. Anyone with the link can bid.

---

## Using the Admin Panel

Navigate to `/admin` and enter your `ADMIN_PASSWORD`.

**Teams tab** — Use the dropdown next to each team to update their tournament status as the World Cup progresses:
- `Active` = still in the tournament
- `Quarterfinalist` = out at QF (owner gets 5% of pool)
- `Semifinalist` = out at SF (owner gets 10% of pool)
- `Runner-Up` = lost the final (owner gets 20% of pool)
- `Champion` = won it all (owner gets 40% of pool)

**Bids tab** — View all bids. You can delete individual bids if needed (e.g., a test bid or mistake). Deleting a bid automatically recalculates the leading bid for that team.

**Payouts tab** — Once teams have been eliminated, see exactly who gets paid what and how much.

---

## Payout Structure

| Result | Pool % |
|--------|--------|
| Champion | 40% |
| Runner-Up | 20% |
| Each Semifinalist (×2) | 10% each |
| Each Quarterfinalist (×4) | 5% each |
| Everyone else | 0% |

**Example:** Pool = $500. Champion owner gets $200. Runner-up owner gets $100. Each SF owner gets $50. Each QF owner gets $25.

Money is handled on the **honor system** — the site shows who owes what, and you collect/pay outside the app (Venmo, cash, etc.).

---

## Bidding Rules

- Bidding closes **Thursday June 11, 2026 at 12:00 PM ET** (noon, when the World Cup kicks off).
- Minimum opening bid: **$5**.
- To take a team from someone, you must bid **at least $1 more** than the current bid.
- No login required — just enter your name. Be honest!
- Anyone can bid on as many teams as they want.

---

## Troubleshooting

**"Error: NEXT_PUBLIC_SUPABASE_URL is not defined"**
→ You forgot to add environment variables in Vercel. Go to your Vercel project → Settings → Environment Variables.

**Bids aren't updating in real time**
→ Make sure you enabled Realtime for the `teams` and `bids` tables in Supabase (Step 2, Realtime section).

**Admin panel won't log in**
→ Double-check your `ADMIN_PASSWORD` environment variable in Vercel matches what you're typing.

**Teams show 0 bids**
→ Make sure you ran the full `schema.sql` in Supabase, especially the INSERT statements at the bottom.
