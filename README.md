# Parklift Tracker

A production & shipping status tracker with:
- **One admin account** (you) that can add clients and machines, and update each machine's status.
- **One login per client**, set by you, where that client sees only their own machines and each machine's live status.

This is a full rebuild of the original single-file demo. The original stored everything in the browser (so nothing was shared between devices and there were no real accounts) — this version has a real backend and a real database, so it works properly once deployed.

---

## How it works

**Admin**
1. Go to the site → **Admin / team login** → sign in with the admin username/password.
2. **Clients** page: add a client (their display name + a username/password you choose for them), search clients, click into one.
3. Inside a client: add machines, edit the client's login/name, or delete the client.
4. Inside a machine: edit model/serial, and tap any stage to cycle it **pending → in progress → done**. Changes save immediately.

**Client**
1. Go to the site → **Client login** → sign in with the username/password you gave them.
2. They see a list of only their own machines.
3. Tapping a machine shows a read-only progress view (percent complete, current stage, full timeline) — they cannot edit anything.

Default admin login (change this before sharing the site — see below):
- Username: `cmcparklift`
- Password: `CMC2026@`

---

## Project structure

```
pages/
  index.js              All screens (login, admin dashboard, client dashboard)
  api/
    login.js, logout.js, me.js         Auth
    admin/clients/...                  Admin: manage clients & their machines
    admin/machines/[id].js             Admin: edit/delete one machine, update stages
    client/machines/...                Client: read-only view of their own machines
lib/
  auth.js        Login sessions (signed cookie, no third-party auth service needed)
  db.js          Data storage + password hashing
  stages.js      The list of production/shipping stages (edit this to change the stages)
components/
  Timeline.js    Renders the stage list
styles/globals.css   All the visual styling (same look as the original)
```

To change the production stages themselves (add/remove/rename steps), edit `lib/stages.js` — everything else (progress %, timeline rendering, admin editor) reads from that one file automatically.

---

## Running it locally (optional, to preview before deploying)

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Locally, data is saved to a temp file automatically — no database setup needed just to look around. On Vercel you'll connect a real (free) database, described below.

---

## Deploying to Vercel

### 1. Put the code on GitHub
1. Create a new repository on [github.com](https://github.com) (e.g. `parklift-tracker`).
2. Upload this project folder to it. Easiest way if you're not familiar with git:
   - On the new repo's page, click **uploading an existing file**, and drag in all the files from this folder (keep the folder structure).
   - Or, if you have git installed:
     ```bash
     cd parklift-tracker
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/parklift-tracker.git
     git push -u origin main
     ```

### 2. Import into Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/log in (you can sign in with your GitHub account — this is the easiest option).
2. Click **Add New… → Project**, then select your `parklift-tracker` GitHub repo and click **Import**.
3. Framework preset should auto-detect as **Next.js** — leave the defaults and click **Deploy**.
4. Wait ~1 minute. You'll get a live URL like `https://parklift-tracker-xxxx.vercel.app`.

At this point the site works, but data won't be saved permanently yet (each deploy resets it) — do step 3 next.

### 3. Add a real database (free)
This app needs somewhere to permanently store clients and machines. We use **Upstash Redis**, available for free directly inside Vercel:

1. In your Vercel project, open the **Storage** tab.
2. Click **Create Database**, choose **Upstash** → **Redis** (or search "Redis" in the marketplace), pick the free plan, and create it.
3. When asked, **connect it to your project** (this automatically adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables — you don't need to type anything).
4. Go to **Settings → Deployments**, and redeploy the latest deployment (or just push any small change to GitHub) so the app picks up the new variables.

### 4. Set your admin login and a security key
In your Vercel project: **Settings → Environment Variables**, add these three (for Production, and Preview if you want):

| Name | Value |
|---|---|
| `ADMIN_USERNAME` | `cmcparklift` (or change it) |
| `ADMIN_PASSWORD` | `CMC2026@` (or change it — recommended) |
| `SESSION_SECRET` | any long random string, e.g. generate one at [randomkeygen.com](https://randomkeygen.com) |

Then redeploy (Deployments tab → ⋯ on the latest → Redeploy) so they take effect.

> If you skip this step, the admin login still works using the built-in defaults (`cmcparklift` / `CMC2026@`), but you should set `SESSION_SECRET` for real use — it's what keeps login sessions secure.

### 5. Try it
Open your `*.vercel.app` URL, log in as admin, add a test client and machine, then open the site in a private/incognito window and log in as that client to confirm they only see their own machine.

---

## Getting your own domain

1. Buy a domain from any registrar (Namecheap, GoDaddy, Google Domains successor Squarespace Domains, or directly through Vercel's own domain registration).
2. In your Vercel project: **Settings → Domains → Add**, type your domain (e.g. `tracker.yourcompany.com` or `yourcompany.com`).
3. Vercel shows you either:
   - A **CNAME record** to add (if using a subdomain like `tracker.yourcompany.com`), or
   - **A records / nameservers** (if using the root domain).
4. Add that record in your domain registrar's DNS settings (every registrar has a "DNS" or "Manage DNS" page).
5. Wait a few minutes to a few hours for DNS to update — Vercel will show a green checkmark and auto-issue HTTPS once it's live.

---

## Notes on security

- Client passwords are stored hashed (never in plain text).
- Each client can only ever see their own machines — this is enforced on the server, not just hidden in the UI.
- The admin password is only ever compared on the server.
- Anyone with the admin login can see/edit everything, so keep it private and change the default password before going live.
