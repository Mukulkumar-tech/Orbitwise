# Deploying Orbitwise to Vercel

Verified working: `vercel.json`, the serverless entry point and connection caching
are in place, and a production-mode simulation passes 9/9 checks (health, catalogue
reads, auth writes, Secure cookies, cached connections, JSON 404s).

**One thing is required before it will work: a MongoDB Atlas cluster.** Everything
else is configuration.

---

## Why the earlier deploys failed

Four structural problems, none of them a typo:

| Problem | Why it breaks Vercel |
|---|---|
| No `vercel.json` | Vercel cannot infer how to build an npm-workspaces monorepo, or that the output is `client/dist` |
| `server.js` calls `app.listen()` | Serverless has no long-lived process to listen on |
| In-memory MongoDB | `mongodb-memory-server` spawns a `mongod` binary — impossible on serverless |
| Local disk uploads | Vercel's filesystem is read-only outside `/tmp` |

All four are now handled. The Express app is exported as a serverless function from
`api/[...slug].js`; `server.js` is only used for local development.

---

## Step 1 — MongoDB Atlas (required)

1. Create a free **M0** cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Database Access** → add a user with *Read and write to any database*
3. **Network Access** → add `0.0.0.0/0`

   Not optional. Vercel's function IPs are dynamic, so an allowlist of specific
   addresses will fail intermittently and look like a random outage.
4. Copy the connection string and append a database name:

   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/orbitwise?retryWrites=true&w=majority
   ```

## Step 2 — Seed the cluster

Run this **locally**, pointed at Atlas. The in-memory database auto-seeds at boot,
but Atlas starts empty, so without this the deployed site has no courses to
recommend and the demo logins will not exist.

```bash
MONGODB_URI="your-atlas-uri" npm run seed
```

Expect: 3 demo accounts, 8 countries, 23 universities, 59 courses, 24 scholarships,
8 success stories.

## Step 3 — Environment variables in Vercel

**Project → Settings → Environment Variables.** Set all of these for *Production*:

| Variable | Value | Notes |
|---|---|---|
| `MONGODB_URI` | your Atlas string | Required. Without it every request returns 503 |
| `JWT_ACCESS_SECRET` | 40+ random chars | Must differ from the refresh secret |
| `JWT_REFRESH_SECRET` | 40+ random chars | |
| `CLIENT_URL` | `https://your-app.vercel.app` | Drives the CORS allowlist and email links |
| `EMAIL_PROVIDER` | `console` | Or `smtp` with `SMTP_*` set |
| `COOKIE_SAMESITE` | `lax` | Correct while the API and client share a domain |

Generate secrets:

```bash
node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
```

`NODE_ENV=production` is set by Vercel automatically. The server **refuses to boot**
with a placeholder JWT secret or a missing `MONGODB_URI` — a deployment that starts
with a known secret is worse than one that fails.

## Step 4 — Deploy

Vercel picks up `vercel.json` from the repo root. Push, or use the CLI:

```bash
npm i -g vercel
vercel --prod
```

Confirm it worked:

```bash
curl https://your-app.vercel.app/api/health
```

Expect `"status":"ok"` and `"ephemeral":false`. If `ephemeral` is `true`, `MONGODB_URI`
did not reach the function.

---

## What works, and what does not

**Works:** the whole public site, authentication with rotating refresh cookies,
onboarding, OrbitMatch, course discovery and comparison, applications, scholarships
and the cost calculator.

**Does not work: document upload.** Vercel's filesystem is read-only, so the local
storage provider refuses with a clear message rather than a raw `EROFS`.

It deliberately does **not** fall back to `/tmp`. A student would see "uploaded" and
their passport scan would be gone on the next request — silently losing a file is
worse than refusing to accept one.

To enable uploads, add an object-storage provider behind the existing
`services/storage/` interface (`put` / `getStream` / `remove` / `exists`):

- **GridFS** — no new service, since the Atlas cluster is already there
- **Cloudinary** — `STORAGE_PROVIDER=cloudinary`, currently unimplemented and
  fails loudly at boot rather than silently writing to disk

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Build fails: no output directory | `vercel.json` missing, or Root Directory is set to a subfolder in project settings — leave it at the repo root |
| Every API call 503s | `MONGODB_URI` unset, or Atlas Network Access does not allow `0.0.0.0/0` |
| `/api/health` says `ephemeral: true` | The env var is not reaching Production scope — check the environment selector when adding it |
| API routes return the HTML page | The SPA rewrite is catching them. The `/((?!api/).*)` lookahead prevents this; check `vercel.json` was not overwritten |
| Login works, then reload signs you out | `CLIENT_URL` does not match the deployed origin, so the cookie is rejected by CORS |
| Client and API on different domains | Set `COOKIE_SAMESITE=none` (requires HTTPS). With `lax` the browser silently drops the refresh cookie cross-site |
| Atlas connection limit exceeded | Each warm instance holds a pool of 5. On M0, avoid very high concurrency or raise the tier |

---

## Recommended if Vercel keeps fighting you: split the deploy

Express is a long-lived server. Vercel serverless is a poor fit for it, and every
problem so far traces back to that mismatch — no listener, no writable disk, path
prefixes, dependency resolution. Render runs a normal Node process, so
`server.js` executes unchanged and all of it goes away.

**Frontend stays on Vercel. API moves to Render. About ten minutes.**

### 1. API on Render

1. [render.com](https://render.com) → **New → Blueprint** → connect this repo.
   `render.yaml` is picked up automatically.
2. Set the two values it asks for:
   - `MONGODB_URI` — your Atlas string
   - `CLIENT_URL` — `https://your-app.vercel.app`

   JWT secrets are generated by Render. `COOKIE_SAMESITE=none` is already in the
   blueprint, which a split deployment requires.
3. When the build finishes, check `https://orbitwise-api.onrender.com/api/health`

### 2. Point the frontend at it

Vercel → Settings → Environment Variables:

```
VITE_API_URL = https://orbitwise-api.onrender.com/api
```

This is baked in at build time, so **redeploy after adding it**. Vercel does not
retroactively apply a new variable to an existing build.

You can then remove `MONGODB_URI` and the JWT secrets from Vercel — the frontend
is a static site and no longer needs them.

### What this buys you

- `server.js` runs unchanged, with no serverless constraints
- **Document upload works**, because the disk is writable
- One Mongo connection opened at boot, instead of a cached pool per warm instance
- Ordinary server logs rather than per-invocation function traces

The free tier sleeps after 15 minutes idle, so the first request after a gap takes
about 30 seconds. Fine for a demo — worth mentioning if you are showing it live.

---

## Alternative: keep everything on Vercel

If document upload matters more than single-platform simplicity, put the client on
Vercel and the API on **Render** or **Railway**, both of which give a persistent
filesystem and a long-lived process — so `server.js` runs unchanged and local disk
storage works.

That split needs `COOKIE_SAMESITE=none` and `CLIENT_URL` set to the Vercel origin.
Both are already supported: the CORS allowlist and cookie policy read from env, with
`assertProductionEnv()` validating the combination at boot.
