# Orbitwise

**Orbitwise helps students discover, plan and complete their study-abroad journey.**

A production-grade MERN platform: a public marketing site, a student portal, a counsellor portal
and an admin portal over a single domain core. The centrepiece is **OrbitMatch** — a recommendation
engine that scores every course against a student's real academic profile, budget, English test and
goals, and explains *why* it scored that way.

---

## Quick start

```bash
npm install
npm run dev          # client → http://localhost:5173   API → http://localhost:5000/api
```

That's the whole setup. **No MongoDB installation required** — if `MONGODB_URI` is empty the server
starts an ephemeral in-memory MongoDB automatically (a ~100 MB `mongod` binary downloads once on
first run) and seeds the demo accounts **and the course catalogue** at boot, so the credentials below
always work and there is something to recommend. Data resets on restart; set `MONGODB_URI` to persist.

Sign in with `student@orbitwise.dev` / `orbitwise2027`, spend two minutes on the five-step profile
wizard, and the dashboard fills with scored, explained matches — see [OrbitMatch](#orbitmatch) for how
the scoring works and [Demo accounts](#demo-accounts) for the other roles.

```bash
cp server/.env.example server/.env     # optional — sensible dev defaults are already committed
```

| Script | What it does |
|---|---|
| `npm run dev` | Runs API + client together |
| `npm run seed` | Seeds demo accounts **and the catalogue** (8 destinations, 23 universities, 59 courses) into a **persistent** database (`-- --force` to rebuild). Unnecessary with the in-memory database, which auto-seeds at boot. |
| `npm test` | All tests — API (Vitest + Supertest) and client (Vitest + jsdom) |
| `npm run test:server` / `test:client` | One workspace only |
| `npm run lint` | ESLint across workspaces |
| `npm run build` | Production client build |

---

## Architecture

```
orbitwise/
├── client/          React 19 · Vite 7 · Tailwind v4 · React Router 7
│   └── src/
│       ├── components/  ui/ · cards/ · shared/
│       ├── pages/ layouts/ routes/ hooks/ services/ context/ utils/ constants/ styles/
├── server/          Express 5 · Mongoose 8
│   ├── controllers/ models/ routes/ middleware/ services/
│   ├── validators/ utils/ config/ constants/ seed/ tests/
│   ├── app.js       middleware + route assembly
│   └── server.js    boot, DB connection, graceful shutdown
```

The pieces that carry the product, and why they sit where they do:

| File | Holds |
|---|---|
| [`services/academics.js`](server/services/academics.js) | Marks conversion, English-test equivalence, and the eligibility table. Pure and total, because these rules decide what a student may be shown |
| [`services/matchService.js`](server/services/matchService.js) | The seven OrbitMatch scorers and the two eligibility gates |
| [`services/profileService.js`](server/services/profileService.js) | Profile writes, completion weighting, and next-step guidance |
| [`services/catalogueService.js`](server/services/catalogueService.js) | Candidate filtering, ranking, pagination |
| [`services/dashboardService.js`](server/services/dashboardService.js) | Composes the above into one dashboard payload |
| [`client/src/pages/onboarding/wizardSteps.js`](client/src/pages/onboarding/wizardSteps.js) | Per-step schemas and the form↔profile mapping — the wizard's testable core |
| [`client/src/constants/domain.js`](client/src/constants/domain.js) | Every slug→label mapping, so renaming a label can never break a query |

Every request follows one path, with no exceptions:

```
route → validate(zod) → protect / authorize → controller → service → model
                                                 ↑ thin       ↑ all business logic
```

Controllers unwrap the request, call one service, and shape the response. Business logic — match
scoring, profile completion, cost calculation, next-step derivation — lives in `server/services/`
as pure functions that are unit-testable without HTTP or a database.

### API surface

| Method | Route | Notes |
|---|---|---|
| `GET` | `/api/health` | Ahead of the rate limiter, so probes are never throttled |
| `POST` | `/api/auth/…` | register · login · refresh · logout · verify · reset · change-password |
| `GET` | `/api/options` | Every enum the onboarding wizard renders, in one request |
| `GET` | `/api/countries` · `/api/universities` | Reference data, paginated |
| `GET` | `/api/courses` · `/api/courses/:slug` | `optionalAuth` — anonymous gets the catalogue, a student gets it scored |
| `GET` | `/api/students/me/dashboard` | The whole dashboard in one payload |
| `GET · PATCH` | `/api/students/me/profile` | Patches merge leaf paths; the response carries completion, guidance and eligibility |
| `GET` | `/api/students/me/recommendations` | Ranked, filterable, paginated |
| `GET · POST · DELETE` | `/api/students/me/shortlist[/:courseId]` | Capped at 20 |
| `GET` | `/api/courses/compare?slugs=a,b,c` | 2–4 courses with per-dimension winners. Registered *before* `/:slug` |
| `GET · POST` | `/api/applications` | Own applications; opens in `draft` |
| `GET` | `/api/applications/:id` | Includes rendered stages and the transitions **your role** may make |
| `PATCH` | `/api/applications/:id/status` | Rejects illegal edges (400) and role-forbidden ones (403) separately |
| `POST` | `/api/applications/:id/notes` | Counsellor-private notes filtered server-side |
| `GET` | `/api/scholarships` · `/:slug` | `optionalAuth` — scored and gated by education level for a student |
| `GET` | `/api/scholarships/deadlines` | Eligible awards closing soonest |
| `GET · POST` | `/api/tools/cost-calculator[/prefill]` | Prefills from a course; POST so a family's budget stays out of URLs and proxy logs |

### Two things the cost engine gets right on purpose

**A scholarship reduces tuition, not total cost.** A 50% award on ₹20L tuition with ₹10.8L annual
living costs saves ₹20L across two years — **32% of the ₹62.4L total, not 50%**. Telling a student
otherwise would say they can afford something they cannot.

**One-time costs are not multiplied by years.** Visa and setup fees are paid once; charging them
against every year of a three-year degree overstates the total by twice the fee. `firstYear` and
`laterYear` are reported separately for the same reason.

Every student route says `me`. There is no `:studentId` anywhere in the portal, so one student cannot
read another's profile by guessing an id — counsellor access will be a separate, explicitly authorized
route in Phase 12.

### Swappable adapters

Each is selected by environment variable, never by a code change. The defaults all work offline.

| Adapter | Default | Production option |
|---|---|---|
| `config/db.js` | in-memory MongoDB | `MONGODB_URI` (Atlas / self-hosted) |
| `services/email/` | console — prints verify/reset links to the terminal | Nodemailer SMTP |

Two more adapters are designed and configured (`STORAGE_PROVIDER`, `AI_PROVIDER` in `.env.example`) but
not yet built — storage lands with document upload in Phase 10, the AI provider after it. The
`/api/health` payload lists only adapters that exist, so it never claims a capability the server
does not have.

---

## Security

- **Passwords** — bcrypt, cost 12. Never logged, never serialized (`select: false` plus a `toJSON` strip).
- **Access tokens** — 15-minute JWT, held in client memory only. Never in `localStorage`, so XSS has nothing persistent to steal.
- **Refresh tokens** — 7-day JWT in an `HttpOnly` `SameSite=Lax` cookie scoped to `/api/auth`. Only a SHA-256 hash is stored server-side, so a database leak cannot be replayed into live sessions.
- **Rotation** — every refresh issues a new token and invalidates the old one. A stolen refresh token works at most once.
- **Multi-device** — up to 5 concurrent sessions; signing in on a phone does not sign out a laptop. Logout revokes one session; a password change or reset revokes all of them.
- **Role integrity** — registration hardcodes `role: 'student'`. A client that posts `role: 'admin'` has it stripped by Zod before any service sees it. `protect` re-reads the role from the database on every request rather than trusting the token payload.
- **No enumeration** — wrong password and unknown email return byte-identical responses, equalized with a dummy bcrypt compare so timing does not leak either.
- **Private files** — there is no `express.static` for uploads. Student documents stream only through an authenticated, ownership-checked endpoint, and `storageKey` is never serialized to a client.
- **Rate limiting** — keyed per IPv4 address and per IPv6 **/64**, because a residential IPv6 allocation is usually a whole /64; keying on the full address would hand an attacker billions of free buckets. Credential routes additionally key on the submitted email so one NAT cannot lock out everyone behind it.
- Plus `helmet`, a CORS allowlist with credentials, and a `$`/dotted-key sanitizer behind Zod's strip-unknown behaviour.

### Deploying on split domains

If the client and API live on **different** domains, set `COOKIE_SAMESITE=none` (requires HTTPS).
With the default `lax`, the browser silently declines to attach the refresh cookie to the cross-site
refresh call and every session dies on reload — with no error anywhere to explain it.

---

## OrbitMatch

Every course is scored against the student's real profile out of 100, and the score always unpacks
into the seven comparisons that produced it. Weights are proportional to how much each answer should
move a decision, not spread evenly:

| Scorer | Weight | Compares |
|---|---|---|
| Academic fit | 25 | Marks against the course's published cut-off, with backlogs as a hard gate |
| Budget fit | 20 | Tuition **plus** living costs against what the family can fund each year |
| English requirement | 15 | IELTS-equivalent score against the course minimum |
| Destination | 12 | Where the country sits in the student's own preference order |
| Course fit | 12 | Subject area (60%) and the qualification they said they wanted (40%) |
| Intake timing | 8 | Distance from their target intake, measured on a 12-month circle |
| Admission likelihood | 8 | University selectivity adjusted by the student's academic headroom |

```
90+  Excellent match      75–89  Strong match      60–74  Possible match      <60  Ambitious match
```

Three decisions make the number trustworthy rather than decorative:

- **Every scorer returns a sentence.** Not "82" but "your 84% clears the 75% requirement" and
  "₹8L over your budget unless you win the merit scholarship". The card shows the strengths, the
  watch-outs, and the full breakdown on demand.
- **Unanswered questions score partial credit, never zero** — and say so. A half-finished profile
  gets provisional scores plus a list of what would sharpen them, because ranking every course as
  hopeless is the opposite of what an incomplete profile needs.
- **A scholarship never quietly closes a budget gap.** Where one would, the score reflects the
  discounted cost *and* the reason states it as a condition, since nobody has won it yet.

Scoring is pure functions in [`server/services/matchService.js`](server/services/matchService.js) —
a profile, a course and a country in, a score out. MongoDB narrows candidates with indexed filters;
ranking happens in memory, because IELTS equivalence and marks normalization cannot be expressed as
an aggregation pipeline without rewriting the engine in a language it can't be unit-tested in.

### Eligibility — what a qualification actually opens

The most decisive input is where the student is academically, so it is modelled explicitly in
[`server/services/academics.js`](server/services/academics.js) rather than inferred. Each education
level maps to the degree levels on its trajectory, by route:

| Route | Meaning | Example |
|---|---|---|
| `direct` | Admissible today | Class 12 complete → bachelor's degree |
| `conditional` | Apply now, confirmed when the pending result lands | In Class 12 → bachelor's on predicted grades |
| `future` | Opens once the current milestone is complete | In Class 11 → the degrees Class 12 will unlock |

A second gate reads the course's own minimum qualification, and the two together are what keep the
engine honest in both directions: a student sitting Class 12 **is** offered bachelor's degrees on
predicted grades, and a Class 12 school-leaver is **never** offered a postgraduate certificate on the
fiction that a degree transcript is on its way. Students still in school therefore get a real
dashboard — a foundation year they can start now, the degrees their result will open, and the
milestone in between — instead of an empty list.

---

## Design system

Tailwind v4, CSS-first. All tokens live in [`client/src/styles/theme.css`](client/src/styles/theme.css)
under `@theme` — there is no `tailwind.config.js`.

```
Primary   #4F46E5   Electric Indigo — actions, links, match emphasis
Navy      #0B1220   surfaces, headings, body text
Success   #059669   verified, match scores        Warning  #D97706   deadlines
Danger    #E11D48   errors, rejected              Canvas   #F8FAFC   page background
```

Inter for UI, Fraunces for display. Cards `rounded-2xl`, navy-tinted low-alpha shadows,
micro-interactions 150–200 ms and section reveals 400–600 ms. One accent hue, two font families.

**Accessibility** is built into the primitives, not bolted on: every interactive element has a
visible focus ring, form errors are wired through `aria-invalid` + `aria-describedby`, and both
`prefers-reduced-motion` (globally in CSS) and Framer Motion's `useReducedMotion` are respected.

---

## Build status

| Phase | Status |
|---|---|
| 1 · Foundation — workspaces, design tokens, Express skeleton, DB fallback, error handling, health check | ✅ Complete |
| 2 · Authentication — register, login, refresh rotation, verify, reset, RBAC, guards, demo accounts | ✅ Complete |
| 3 · Domain models + catalogue seed data — countries, universities, courses, student profiles | ✅ Complete |
| 4 · Public website — homepage, destinations, universities, courses, guides, counselling form | ✅ Complete |
| 5 · Student onboarding — 5-step wizard, saved per step, eligibility-aware | ✅ Complete |
| 6 · OrbitMatch recommendation engine — 7 weighted scorers, explained | ✅ Complete |
| 7 · Student dashboard — guidance, stats, next steps, top matches | ✅ Complete |
| 8 · Course discovery — search, filters, shortlist, public catalogue, detail pages, side-by-side comparison | ✅ Complete |
| 9 · Applications — status machine, append-only timeline, tracker, notes | ✅ Complete |
| 10 · Documents | ⬜ |
| 11 · Scholarships + cost calculator — scored matching, deadline tracker, full cost engine | ✅ Complete |
| 12 · Counsellor portal + messaging | ⬜ |
| 13 · Admin portal | ⬜ |
| 14 · Polish, a11y, performance, hardening | ⬜ |

**Currently runnable:** `/` (system status — replaced by the homepage in Phase 4), `/login`,
`/register`, `/forgot-password`, `/reset-password/:token`, `/verify-email/:token`, `/onboarding`,
`/app` (dashboard), `/app/courses`, `/app/shortlist`, `/app/profile`, `/counsellor`, `/admin`, `/403`.

The student journey works end to end: sign in → build a profile in five steps → land on a dashboard
of scored matches → open "Why this matches" → shortlist. A new account starts at 0% profile and its
dashboard leads with one action; nothing is scored until a real answer exists to score it against.

Because the default email provider is `console`, verification and password-reset links are printed
to the terminal running the API — the full flow is testable locally with no SMTP account.

### Demo accounts

Created automatically at boot on the in-memory database, or by `npm run seed` against a persistent
one. All three are pre-verified, so they work without an inbox.

| Role | Email | Password | Lands on |
|---|---|---|---|
| Student | `student@orbitwise.dev` | `orbitwise2027` | `/app` — empty profile, so it opens on "Build my profile" |
| Counsellor | `counsellor@orbitwise.dev` | `orbitwise2027` | `/counsellor` |
| Admin | `admin@orbitwise.dev` | `orbitwise2027` | `/admin` |

**Local development only.** The seeder refuses to run with `NODE_ENV=production` — these credentials
are published in this file, so creating them against a real database would hand anyone who read it an
admin login.

Registration always creates a `student`; the role is hardcoded server-side and a client-supplied
`role` is stripped before any service sees it. Counsellor and admin accounts therefore only ever come
from the seeder or, later, the admin portal.

---

## Testing

```bash
npm test
```

**161 tests, ~27s.** Server (131), client (30).

**Authentication (47)** — the credential lifecycle end to end over real HTTP: role-escalation
resistance, account-enumeration resistance, forged and expired tokens, refresh rotation and replay,
multi-device independence, single-use email tokens, session revocation on password change — including
the same-second edge case a timestamp-based check silently lets through — plus the full `authorize()`
role matrix (every role against every guard combination, including immediate effect of a role change
or deactivation), demo-account seeding, session cookie lifecycle, health-check exposure, and IPv6
rate-limit bucketing.

**OrbitMatch (42)** — written at the boundary, never the middle: every band edge (59/60, 74/75,
89/90), marks exactly on a cut-off, one backlog over the limit, half a band short of the English
requirement, the CGPA ×9.5 conversion a naive linear stretch gets wrong, IELTS/PTE/TOEFL/Duolingo
equivalence, intake distance across a year boundary, tie-breaking on cost, and the eligibility matrix
including the case a single `>=` comparison gets backwards — a Class 12 leaver being offered a
postgraduate certificate.

**Student portal (42)** — profile reads and writes over HTTP: partial patches that must not erase a
section they did not mention, grading-system and test-scale bounds, stripped fields a client may not
set, the shortlist lifecycle, and recommendations against the real seeded catalogue — that a saved
profile changes what comes back, that a master's is never offered to a school leaver, that a Class 11
student sees what Class 12 will unlock labelled as future, and that `?allFields=false` does not
coerce to `true`.

**Catalogue integrity (5)** — the seed is idempotent, every course has a slug and a rupee price, and
no course advertises an intake month its destination does not run.

**Client (30)** — `useQuery`, which backs every data-loading page: loading/success/error/empty
transitions, refetch recovery, StrictMode double-mounting, and the out-of-order response race where a
slow earlier request must not overwrite a newer one. Plus the wizard's pure core: per-step validation
and the form↔profile mapping, where writing marks into the wrong field would silently score a
master's applicant on their Class 12 percentage.

The full student journey is also verified in a real browser — sign in, five wizard steps, scored
dashboard, expanded breakdown, shortlist — driven over the Chrome DevTools Protocol.

Later phases add: document access control, application status transition legality, and cost
calculator arithmetic.
