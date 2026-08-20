# Orbitwise — Project Walkthrough

A guide for explaining this project out loud: what it does, how it is built, the decisions worth
defending, and exactly what is unfinished.

`README.md` is the developer-facing setup guide. **This document is the narrative.**

---

## 1. The 30-second pitch

> Orbitwise is a study-abroad platform for Indian students. A student builds one profile — their
> qualification, marks, budget, English score and goals — and the platform returns courses they are
> genuinely eligible for, scored against that profile, with the reasoning shown. They can then compare
> options, calculate the real total cost, apply, and track documents through to a decision.
>
> It is a MERN application: React 19 with Vite and Tailwind v4 on the front, Express 5 and MongoDB
> behind it, with role-based auth for students, counsellors and admins. About 240 tests cover the
> logic that would be expensive to get wrong.

**If you say nothing else, say this:** the recommendation engine treats *eligibility* as a hard filter
and *quality of fit* as a score. A student who finished Class 12 is never shown a master's degree.

---

## 2. The one idea that makes it different

Most study-abroad sites are brochures with a search box. The interesting problem here is not search,
it is **honesty under constraint**.

A Class 12 student cannot apply to a master's degree. Showing them one at "62% match" is not a helpful
suggestion — it is a false hope, and it is how a platform loses trust on its first screen.

So the engine has two separate mechanisms:

| Mechanism | Applies to | Behaviour |
|---|---|---|
| **Hard gate** | Education level, passed deadlines | Excluded entirely, never scored |
| **Graded score** | Marks, English, budget, subject, destination, timing | Scored 0–100 with stated reasons |

The distinction is not cosmetic. "You need 75%, you have 72%" is *actionable* — a student can retake or
apply elsewhere. "You cannot do a master's without a degree" is *structural* — no amount of effort
changes it this year. Conflating them into one score would bury the difference.

**Verified live:**

```
education: class_12   →  Foundation, Bachelors, Diploma        (never Masters/PhD)
education: bachelors  →  Masters, Diploma, Certificate         (never Bachelors)
```

There is a third state worth mentioning, because interviewers like it: a student **still studying** in
Class 12 gets a `conditional` route rather than exclusion. Universities issue offers against predicted
grades months before results exist. Hiding those courses would empty the dashboard of exactly the
students who most need to plan.

---

## 3. Architecture

### The request path — one shape, no exceptions

```
route  →  validate(zod)  →  protect / authorize  →  controller  →  service  →  model
                                                       ↑ thin        ↑ all business logic
```

Controllers unwrap the request, call **one** service, and shape the response. That is all they do.

Every piece of domain logic — match scoring, cost arithmetic, eligibility, profile completion,
application state transitions — lives in `server/services/` as functions that take arguments and
return values. No database access, no request object, no clock reads. That is why they can be tested at
their boundaries instead of only through HTTP.

### Why that matters (a good answer to "why this structure?")

The four engines below produce numbers a family makes a ₹25-lakh decision on. If those numbers can only
be observed by making an HTTP request and eyeballing the response, they cannot be verified. Pulling them
out into pure functions is what makes `42` scoring tests and `17` cost tests possible.

### Layout

```
orbitwise/
├── client/                     React 19 · Vite · Tailwind v4 · React Router 7
│   └── src/
│       ├── pages/              39 page components (public · auth · student · onboarding)
│       ├── components/ui/      Button, Input, Select, Badge, Skeleton, EmptyState, ErrorState…
│       ├── components/cards/   CourseCard, ScholarshipCard, MatchBreakdown, ApplicationTimeline
│       ├── layouts/            PublicLayout · StudentLayout · AuthLayout
│       ├── hooks/              useQuery · useMutation · useAuth · useDebounce
│       ├── services/           one module per API area — components never call axios directly
│       └── constants/          domain.js holds every slug→label map
└── server/
    ├── models/                 10 Mongoose schemas
    ├── services/               11 business-logic modules + 2 swappable adapters
    ├── controllers/            thin
    ├── routes/                 10 routers
    ├── validators/             Zod schemas, one per area
    ├── seed/                   catalogue + demo accounts
    └── tests/                  10 suites, 208 tests
```

---

## 4. What actually works — feature inventory

### Public marketing site (15 routes)

Homepage with 10 sections, destination comparison (8 countries, table on desktop / cards on mobile),
university directory with detail pages, full course catalogue with filters, scholarship listings, a
cost calculator, success stories, six guidance pages (study-abroad, visa, PR, IELTS, PTE, TOEFL), and a
counselling enquiry form that persists to the database *before* emailing.

Sticky navbar that shrinks on scroll, a real mobile drawer (not a compressed desktop bar), and a
skip-to-content link.

### Authentication and roles

Register, login, logout, email verification, forgot/reset password, change password.

- **Access token** — 15-minute JWT, held in memory only. Never in `localStorage`.
- **Refresh token** — 7-day JWT in an `HttpOnly` `SameSite=Lax` cookie, only a SHA-256 hash stored server-side.
- **Rotation** — every refresh invalidates the old token. A stolen one works at most once.
- **Multi-device** — up to 5 concurrent sessions. Signing in on a phone does not sign out a laptop.
- Three roles: `student`, `counsellor`, `admin`, enforced by `protect` + `authorize` middleware.

### Student onboarding

A 5-step wizard (education → goals → destinations → budget → English) with per-step Zod validation,
saved after each step, and resumable — refresh halfway through and you land back where you were.

### OrbitMatch — the recommendation engine

Seven weighted scorers behind two eligibility gates. Every course returns a full breakdown:

```json
{
  "score": 91, "band": "excellent", "route": "direct",
  "breakdown": [
    { "label": "Academic fit",   "score": 25, "max": 25, "verdict": "strong",
      "reason": "Your 88% clears the 80% requirement" },
    { "label": "Budget fit",     "score": 14, "max": 20, "verdict": "fair",
      "reason": "₹24.8L/yr against your ₹28L budget" }
  ],
  "strengths": [...], "watchouts": [...], "unknowns": ["English requirement"]
}
```

`unknowns` is the part worth pointing at. If a student has no IELTS score, that factor is reported as
**unscored** rather than scored zero — because zero implies failure where the truth is "we don't know
yet, and here is the band you need."

### Course discovery

Server-side search, filters and pagination bound to URL query params (so a filtered view is shareable
and the back button works), course and university detail pages, a 20-item shortlist, and side-by-side
comparison of 2–4 courses with per-dimension winners computed server-side.

### Applications

An 8-state machine (`draft → documents_pending → ready_to_apply → submitted → under_review →
offer_received / rejected / withdrawn`) with an append-only timeline, notes, and a tracker.

### Documents

Upload, replace, preview, delete, and a counsellor/admin review workflow. Nine document types with a
checklist derived from the applications a student has actually started.

### Scholarships and cost calculator

24 seeded awards with scored matching, a deadline tracker, and a nine-line cost engine covering
tuition, accommodation, food, transport, insurance, flights, visa, setup and other — with a budget
verdict.

### Seeded demo data

8 countries · 23 universities · 59 courses · 24 scholarships · 8 success stories · 3 demo accounts.

```
student@orbitwise.dev     orbitwise2027   → /app
counsellor@orbitwise.dev  orbitwise2027   → /counsellor
admin@orbitwise.dev       orbitwise2027   → /admin
```

---

## 5. The four engines — your deep-dive material

Interviewers push on one thing until it breaks. These are the four places where the answer holds up.

### `academics.js` — eligibility and conversions

- **Marks conversion is not linear.** CBSE CGPA × 9.5, and a proper 4.0-GPA table. A naive
  `cgpa/10*100` inflates a 7.0 CGPA to 70% instead of 66.5% — the difference between clearing a 70%
  cut-off and not.
- **English tests convert to an IELTS equivalent** using published concordances (PTE 58 ≈ IELTS 6.5,
  TOEFL 79 ≈ 6.5). Courses store one requirement, so adding a test is a row in a table rather than a
  column on every course.
- **The eligibility table returns `direct` / `conditional` / `null`**, not a boolean — which is what
  lets a card say "conditional offer on predicted grades" instead of vanishing.

### `matchService.js` — scoring

Seven weighted dimensions: academic 25, budget 20, English 15, destination 12, course fit 12, intake
timing 8, admission likelihood 8. Each scorer returns `{ score, reason, verdict }`, so the explanation
is a **by-product of the same computation** that produced the number. They cannot disagree.

Performance: candidates are pre-filtered in MongoDB (eligible levels, budget range, active, deadline
open) and capped at 500 before scoring runs in Node. When the cap trims the pool, the API says so with a
`capped` flag rather than silently truncating.

### `costService.js` — the money

Two decisions carry the whole file:

**A scholarship reduces tuition, not total cost.** A 50% award on ₹20L tuition with ₹10.8L annual
living costs saves ₹20L over two years — **32% of the ₹62.4L total, not 50%**. Getting this wrong tells
a student they can afford something they cannot. It has its own test.

**One-time costs are not multiplied by years.** Visa and setup fees are paid once; charging them against
all three years of a degree overstates the total by twice the fee. `firstYear` and `laterYear` report
separately.

The budget check returns a **shortfall per year**, not a verdict. "₹5L short annually" lets a student
act; "unaffordable" only discourages.

### `applicationService.js` — the state machine

Illegal and forbidden are **different failures**:

- `draft → submitted` returns **400** — that edge does not exist, documents come first.
- `submitted → under_review` by a student returns **403** — a real transition, but a university's to
  make, not theirs.

Collapsing both into one error would tell a student a legitimate step never happens. The API also
returns `availableTransitions` filtered by the caller's role, so the client renders exactly the buttons
the server will honour instead of re-deriving the rules and drifting.

---

## 6. Security decisions worth stating

| Decision | Why |
|---|---|
| Access token in memory, never `localStorage` | XSS has nothing persistent to steal |
| Refresh token `HttpOnly`, hash stored server-side | A database leak cannot be replayed into live sessions |
| Registration hardcodes `role: 'student'` | Zod strips a client-supplied `role` before any service sees it |
| `protect` re-reads the role from the DB every request | A demotion takes effect immediately, not in 15 minutes |
| `tokenVersion` counter, not a timestamp | JWT `iat` has second precision; a timestamp leaves a sub-second window where a pre-password-change token still works |
| Wrong password and unknown email return identical responses | Equalized with a dummy bcrypt compare, so timing does not leak either |
| Rate limits keyed per IPv6 **/64**, not per address | A residential IPv6 allocation is a whole /64 — keying on the full address hands an attacker billions of free buckets |
| **No `express.static` for uploads at all** | A passport scan reachable by guessing a URL is the failure the whole design prevents |
| Uploaded filename never builds a filesystem path | `../../../etc/passwd.pdf` uploads fine and stores as random hex — tested |
| Extension **and** mime type must agree | Extension-only lets a script be renamed `.pdf`; mime-only trusts a client header |
| Another student's document returns **404, not 403** | A 403 confirms the id is real, turning enumeration into discovery |
| Counsellor-private notes filtered **server-side** | A flag the browser is trusted to honour is not a privacy control |

---

## 7. Testing — 238 tests

| Suite | Tests | Covers |
|---|---|---|
| `match.test.js` | 42 | All seven scorers, band boundaries, eligibility gates |
| `auth.test.js` | 34 | Full credential lifecycle over real HTTP |
| `recommendations.test.js` | 26 | Ranking, filtering, pagination, candidate cap |
| `documents.test.js` | 22 | Upload validation, path traversal, access control |
| `applications.test.js` | 21 | State machine legality, ownership, private notes |
| `scholarships.test.js` | 17 | Matching, gates, deadline ordering |
| `cost.test.js` | 17 | Cost arithmetic and scholarship application |
| `studentProfile.test.js` | 16 | Profile writes, completion weighting |
| `rbac.test.js` | 8 | Every role against every guard combination |
| `rateLimiter.test.js` | 5 | IPv6 /64 bucketing |
| `useQuery.test.jsx` | 6 | Loading/error/empty, StrictMode, out-of-order responses |
| `wizardSteps.test.js` | 24 | Per-step schemas and form↔profile mapping |

**A test worth describing out loud:** `useQuery` had a bug where React StrictMode's simulated unmount
set a `mounted` flag false and never restored it — so *every* data-loading page would have hung on a
skeleton forever in development. I fixed it, then **reverted the fix to confirm the test actually
failed**, because a regression test that passes either way is worthless.

Another: `applications.test.js` originally asserted a student could not set `offer_received`. It failed —
because the student could not even reach `under_review` to attempt it. My test had misread my own
design. The rewritten version tests the role gate on a legal edge, which is a sharper assertion.

---

## 8. What is pending — say this plainly

**Complete: all 14 phases.**

| Phase | Status | What is missing |
|---|---|---|
| 1 Foundation | ✅ | — |
| 2 Authentication | ✅ | — |
| 3 Domain models + seed | ✅ | — |
| 4 Public website | ✅ | — |
| 5 Onboarding wizard | ✅ | — |
| 6 OrbitMatch | ✅ | — |
| 7 Student dashboard | ✅ | — |
| 8 Course discovery | ✅ | — |
| 9 Applications | ✅ | — |
| 10 Documents | ✅ | — |
| 11 Scholarships + calculator | ✅ | — |
| 12 Counsellor portal | ✅ | Messaging UI (see below) |
| 13 Admin portal | ✅ | Catalogue CRUD screens (see below) |
| 14 Polish | ✅ | — |

### What phases 12 and 13 actually shipped

**Counsellor portal** — caseload ordered as a worklist (students with documents waiting sort first,
not alphabetically), per-student detail refused server-side unless the student is on the caller's
caseload, a document review queue where rejection *requires* a note, and appointment booking with
true interval-overlap conflict detection. Slots are generated server-side from published availability
and filtered against existing bookings, so the UI never offers a time the booking call would reject —
and a 409 from a lost race refetches rather than lying.

**Admin portal** — six Recharts visuals, a student table with server-side search / filter / sort /
pagination whose filter state lives in the URL, inline counsellor assignment, and a CSV export that
reuses the exact same query method as the table so the export can never drift from the view.

Two details worth volunteering, because they are the kind of thing that separates working from
correct:

- The CSV quotes every field and prefixes anything starting `=`, `+`, `-` or `@`. Excel executes
  those, so a student named `=1+1` is a CSV injection. There is a test that fails without the guard.
- The export is fetched through the API client and saved from a Blob, not pointed at by an
  `<a href>`. The access token lives in memory and travels as an `Authorization` header — a link
  navigation carries no header, so the browser would have cheerfully downloaded a 401 body as a .csv.

### Concrete gaps, stated honestly

- **4 of 16 planned models are unbuilt:** `Conversation`, `Message`, `Notification`, `Blog`.
  (`Shortlist` is embedded in `StudentProfile` — a deliberate choice for a 20-item capped list, not
  a gap. `Counsellor` and `Appointment` landed in phase 12.)
- **Messaging does not exist.** Counsellor and student communicate through the appointment agenda and
  document review notes, both of which are real and working. There is no conversation thread.
- **Catalogue CRUD is read-only in the admin UI.** Courses, universities, countries and scholarships
  are seeded and fully queryable, but there is no create/edit form for them. The admin screens built
  are the ones an admin uses daily — students, caseload assignment, enquiries — rather than the
  data-entry screens used once at setup.
- **The AI assistant was never built.** `AI_PROVIDER` is configured in `.env.example` but has no
  implementation. It was scoped as "UI + architecture only" and did not get built.
- **Cloudinary storage is not implemented.** Selecting it **fails loudly at boot** rather than silently
  writing to disk — a wrong-but-working path is discovered only when someone needs the files back.
- **Real-time messaging is REST-shaped, not built.** The schemas were designed Socket.IO-ready; no
  sockets exist.
- **The entry chunk is 461 KB (144 KB gzipped).** Everything past the landing-and-signup path is
  lazy-loaded. Further splitting would mean carving up the homepage itself, which is diminishing
  returns.

### If an interviewer asks "why isn't it finished?"

The honest answer, and a good one: the work was sequenced so that the **vertical slice a user actually
needs works end to end** — discover, profile, match, compare, apply, upload, plan cost — before
building internal-facing tooling, and the staff tooling was then built in the order staff would
actually use it. What is left is the least interesting third of phase 14 (an accessibility and
performance sweep) plus two features that are genuinely separate products: a messaging system and a
CMS for the catalogue.

### A thing worth saying out loud

Both staff portals were verified by driving a real Chrome over the DevTools protocol — signing in,
walking every screen, and asserting zero console errors, zero uncaught exceptions and zero failed
requests. That found three defects a passing build and a green test suite had both missed: an API
serving a counsellor whose user account had been deleted (an unbookable card with an undefined React
key), a seeder that orphaned rows on re-run, and demo fixtures keyed by array position that had
attached one student's passport to another student's file. Worth mentioning because "it builds" and
"it works" are different claims.

---

## 9. Questions you should expect

**"Why MongoDB and not Postgres?"**
The catalogue is document-shaped — a course carries nested requirements, intakes and scholarship
sub-objects that are always read together. That said, applications and profiles are relational, and a
production version at scale would benefit from Postgres. I would not defend Mongo as universally
correct; it fits this read pattern.

**"How do you handle currency?"**
Normalized to INR at write time and stored alongside the display currency. Converting at read time
would mean the number that produced a recommendation is unreproducible next month, and a student who
screenshotted "₹29L" for their parents would find it says ₹31L later. The FX snapshot is deliberate and
refreshed as an explicit act.

**"What happens when the recommendation engine gets slow?"**
Candidates are pre-filtered in MongoDB before scoring in Node, capped at 500. Beyond that, scores are
deterministic given a profile, so they cache per `studentId:profileUpdatedAt` — the key self-invalidates
whenever the profile changes, which removes stale-score bugs by construction.

**"What was the hardest bug?"**
The `tokenVersion` one. I had used the conventional `passwordChangedAt` vs JWT `iat` comparison. That
claim has only second precision, and the pattern backdates by a second to avoid killing the token the
change itself issues — so a token minted under a second before a password change **survived it**. Found
by a test, fixed with an exact integer counter.

**"What would you do differently?"**
Add route-level code splitting from the start rather than deferring it — retrofitting lazy boundaries
across 39 pages is more work than building them in. And I would have built the counsellor portal
alongside the student one, since the backend authorization for it already exists and is untested from
the UI side.

**"How much is AI-generated?"**
Be straightforward about it. The value you can defend is the *decisions*: eligibility as a gate rather
than a score, scholarship-applies-to-tuition-only, illegal-vs-forbidden transitions, 404-not-403 on
foreign documents. Those are the things an interviewer will actually probe, and they are all defensible
on their own terms.

---

## 10. Live demo script (5 minutes)

```bash
npm install
npm run dev          # http://localhost:5173
```

1. **Homepage** — scroll to the OrbitMatch explainer showing the seven weights.
2. **`/countries/canada`** — point out the *programme-level breakdown*: "what can I do here after 12th?"
   comes before the university list.
3. **Sign in** as `student@orbitwise.dev` / `orbitwise2027`.
4. **`/app`** — dashboard: completion ring, next steps, scored matches.
5. **Open any match** — expand the breakdown. Show a factor marked `unknown` and explain why that is
   not zero.
6. **`/app/profile`** — change education level from `bachelors` to `class_12`, save, return to matches.
   **The master's degrees disappear.** This is the demo moment.
7. **`/cost-calculator`** — apply a 50% scholarship. Point at "saves 32% of total, not 50%."
8. **`/app/documents`** — upload a PDF, then note the file URL is `/api/documents/:id/file` and returns
   401 in a signed-out tab.

Close with the pending list from section 8. Volunteering what is unfinished reads as judgement, not as
a gap.

---

## 11. Numbers for the CV line

- **~29,000 lines** across 187 tracked files
- **238 tests** (208 API via Vitest + Supertest, 30 client via Vitest + jsdom)
- **10 Mongoose models**, 11 service modules, 10 routers, 39 page components
- **2 swappable adapters** (email, storage) selected by env var, with offline defaults
- **Zero-setup local run** — no MongoDB install needed; an in-memory database auto-seeds at boot

---

## 10. Phase 14: what "accessible" was made to mean

Phase 14 was run as a measurement exercise rather than a styling pass. axe-core
was driven over all 33 routes in a real Chrome — public, student, counsellor and
admin, each signed in as the right role — at 1440px for WCAG and 375px for
layout.

**Starting state:** 290 colour-contrast failures across all 33 routes, 14
`aria-prohibited-attr`, 3 `aria-allowed-attr`, and horizontal overflow on 2
routes. **Ending state: zero of each.**

What that surfaced, and why each one is worth mentioning:

**Four design tokens were unusable as text.** `navy-400` measured 2.81:1 and
`navy-500` 4.30:1 against the darkest light surface in use; `success-600`,
`warning-600` and `danger-600` came in at 3.40, 2.88 and 4.24. The binding
constraint is not white — dark text on the tinted `#f5f3ff` canvas has *less*
contrast than the same text on white, so measuring against white would have
declared them passing.

**The dark surfaces needed the opposite fix.** The footer, the auth aside and the
cost-calculator summary panel are all `navy-950`. Muted text there had to get
*lighter*, and darkening the tokens for the light surfaces made those three
panels worse before they got better. That asymmetry is exactly why it was missed
by eye.

**`grid` without a base column count is a latent overflow.** `grid gap-5
lg:grid-cols-2` sets `display: grid` and no template, so the mobile track is an
implicit `auto` track that sizes to max-content — measured at 377px inside a
335px container. 68 class strings had this shape; two overflowed with today's
content and the rest were waiting for a longer course title. All now declare
`grid-cols-1`.

**`aria-sort` on a `<button>` does nothing.** It belongs on the `columnheader`.
On the button it is an unsupported attribute, silently dropped, so the sort state
was never announced.

**`aria-label` on a bare `<div>` is prohibited.** With no role there is nothing
for the label to name, so the star ratings were announced as five unlabelled
icons. `role="img"` makes the label legal.

The contrast findings are now locked in by `client/src/styles/contrast.test.js`,
which parses `theme.css` and asserts the ratios against every surface each token
actually sits on — including one deliberately inverted assertion that `navy-400`
must *not* pass on `navy-950`, so the trap stays documented rather than
rediscovered. Reverting a single token makes it fail; that was checked.

**Honest limit:** axe-core catches roughly a third to a half of WCAG issues. It
cannot judge whether focus order is sensible, whether alt text is *accurate*, or
whether an interaction works by keyboard alone. Zero automated violations is a
floor, not a certificate.
