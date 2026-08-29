# CineWrite AI — Backend + Writing Room UI (Phase 1)

Core writing features from the CineWrite AI spec: auth, projects, character
tracking, the Structure Engine (Three Act + Save the Cat, combinable),
scenes, page/pacing tracking, a basic project-aware "Ask AI" assistant, and
a dark, screenplay-room-styled single-page frontend (`public/index.html`)
served directly by the same server.

See `ARCHITECTURE.md` for the full design rationale and extension points for
Phases 2–6.

**This has been run end-to-end on a real local PostgreSQL 16 instance** —
register → create project → generate beat sheet → write a scene → check
pacing all verified working, including the spec's own pacing example
(Catalyst target page 12, scene placed at page 18 → flagged
"potentially_delayed", +6). The `/ai/ask` endpoint needs your own
`ANTHROPIC_API_KEY` to respond (untested here — no key in this sandbox).

## Setup

```bash
# 1. Postgres (if you don't already have it)
#    macOS:  brew install postgresql@16 && brew services start postgresql@16
#    Ubuntu: sudo apt install postgresql postgresql-contrib && sudo service postgresql start

# 2. Create the database
sudo -u postgres psql -c "CREATE USER cinewrite WITH PASSWORD 'devpassword' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE cinewrite OWNER cinewrite;"

# 3. Install & configure
npm install
cp .env.example .env
# edit .env: DATABASE_URL=postgres://cinewrite:devpassword@localhost:5432/cinewrite
#            JWT_SECRET=<any long random string>
#            ANTHROPIC_API_KEY=<optional, only needed for the Ask AI tab>

# 4. Create the schema
npm run db:init

# 5. Run it
npm start          # or: npm run dev  (auto-restarts on file changes)
```

Open **http://localhost:4000** — that's the writing room UI. Register an
account, create a project, generate a beat sheet, and start writing scenes.

Requires PostgreSQL 13+ (uses `gen_random_uuid()` via `pgcrypto`) and Node 18+
(uses the global `fetch` and `crypto` APIs).

## API (Phase 1 + Phase 2/4/5 additions)

All project-scoped routes require `Authorization: Bearer <token>` and are
isolated per `user_id`.

```
POST   /auth/register              { name, email, password }
POST   /auth/login                 { email, password }

GET    /frameworks                 -> list of system frameworks (three-act, save-the-cat)
GET    /admin/stats                -> usage counts (no screenplay content exposed)

POST   /projects                   { title, genre, target_runtime_minutes, ... }
GET    /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id

POST   /projects/:id/structure/generate   { frameworkKeys: ["three-act"] }
                                            or ["three-act", "save-the-cat"] to combine
GET    /projects/:id/structure
GET    /projects/:id/pacing

POST   /projects/:id/characters
GET    /projects/:id/characters
PUT    /projects/:id/characters/:charId
DELETE /projects/:id/characters/:charId

POST   /projects/:id/relationships        { character_a_id, character_b_id, relationship_type }
GET    /projects/:id/relationships        -> { nodes, edges } graph shape
DELETE /projects/:id/relationships/:relId

POST   /projects/:id/scenes        { act_id | sequence_id, heading, content, ... }
GET    /projects/:id/scenes
PUT    /projects/:id/scenes/:sceneId
DELETE /projects/:id/scenes/:sceneId

POST   /projects/:id/setups               { description, expected_payoff? }
GET    /projects/:id/setups
PUT    /projects/:id/setups/:setupId      { status, payoff_scene_id? }
DELETE /projects/:id/setups/:setupId

POST   /projects/:id/analysis/run         { draftLabel? }  -- calls the AI once per dimension
GET    /projects/:id/analysis             -> { dashboard, history }

POST   /projects/:id/versions             { label }  -- snapshots current scenes+beats
GET    /projects/:id/versions
GET    /projects/:id/versions/compare?from=<id>&to=<id>

GET    /projects/:id/search?q=...         -- real pgvector cosine-similarity search over scenes

POST   /projects/:id/research             { source: "tmdb"|"omdb"|"google_books", query }
GET    /projects/:id/research

POST   /projects/:id/ai/ask        { question }
```

## What's real vs. what needs your own keys

**Built and verified against a live PostgreSQL 16 + pgvector database in this
session** (15 automated tests in `test/api.test.js`, all passing, plus manual
end-to-end curl runs): auth, projects, page targets, structure generation and
combination, pacing deviation math (matches the spec's own worked example:
Catalyst target p12/p11, scene at p18 → `potentially_delayed`), scenes with
auto beat-sync, setup/payoff tracking, character relationships, version
snapshot/compare, and semantic search (scenes are embedded on save and found
by meaning via pgvector cosine similarity — using a local deterministic
fallback embedding since no `VOYAGE_API_KEY` was available here).

**Written but NOT exercised against the real external service** — this
sandbox's network egress doesn't reach these domains, so treat as a
first draft to verify yourself:
- `POST /projects/:id/research` (TMDB, OMDb, Google Books) — needs
  `TMDB_API_KEY` / `OMDB_API_KEY` in `.env`
- The Story Analyzer and Ask AI endpoints need a real `ANTHROPIC_API_KEY` —
  verified here only in that they fail *gracefully* (a clean JSON error, not
  a crash) when the key is missing
- Real semantic embeddings need `VOYAGE_API_KEY` (Anthropic's docs recommend
  Voyage AI, since Claude doesn't serve embeddings directly) — without it,
  search still works end-to-end but on a cruder local embedding

**Not built at all** — genuinely needs infrastructure/accounts only you can
provide, not just more coding time:
- Cloud deployment (AWS/GCP/Azure) — a `Dockerfile` + `docker-compose.yml`
  are included but untested here (no Docker in this sandbox)
- Billing/subscriptions, OAuth (email/password auth only)
- Document upload + OCR pipeline (Phase 4's PDF/DOCX ingestion)
- Multi-provider AI switching beyond the `AIProvider` abstraction already
  in place (only the Anthropic implementation is written)

## Running the tests

```bash
createdb cinewrite_test   # or: psql -c "CREATE DATABASE cinewrite_test OWNER cinewrite;"
psql -d cinewrite_test -f db/schema.sql
psql -d cinewrite_test -f db/migrations/002_phase2_phase4_additions.sql
npm test
```

## Docker (untested in this sandbox — no Docker available here)

```bash
docker compose up --build
```
Starts Postgres+pgvector and the API together. Set `ANTHROPIC_API_KEY`,
`VOYAGE_API_KEY`, `TMDB_API_KEY`, `OMDB_API_KEY` as environment variables
before running if you want those features live.

## Story Development + Beat Sheet + Learning System (additive expansion)

Built on top of Phase 1/2/4/5 without touching or breaking any existing
project data — verified with a regression test and by hand against the
project created earlier in this build.

**16 structure frameworks**, categorized (spec section 2):
- *Whole story structures:* Three-Act, Five-Act, Hero's Journey, Seven-Point,
  Freytag's Pyramid, Dan Harmon's Story Circle, Kishōtenketsu (explicitly
  non-conflict-centered, not forced into a Three-Act shape), Fichtean Curve,
  Heroine's Journey, The Virgin's Promise
- *Beat sheets:* Save the Cat, Eight Sequence Structure, Sequence Approach
- *Scene-level methods:* Scene-Sequel, Goal→Conflict→Disaster,
  Reaction→Dilemma→Decision, Try-Fail Cycle

One naming note: the spec's "Fichte's Dramatic Structure" isn't a
documented screenwriting framework under that name — I used the Fichtean
Curve (a real, named structure) as the closest match. Flag it if you meant
something else.

**Custom Structure Builder** (`POST /custom-structures`) — a user-defined
structure (e.g. "Tamil Commercial Cinema Structure") is stored in the
existing `user_frameworks` table and flows through the *same* structure-
generation pipeline as system frameworks — verified with a test that checks
its page-percentage math computes correctly.

**Hybrid structures** (spec section 23) — generating structure with multiple
`frameworkKeys` plus a `layers` map (e.g. `{"three-act":"primary_structure",
"save-the-cat":"beat_sheet","scene-sequel":"scene_method"}`) records which
framework plays which role in `project_structure_layers`, retrievable via
`GET /projects/:id/structure/layers`.

**Learn system** (spec sections 6-10, 31-32) — every Save the Cat and
Three-Act beat has hand-authored, structured content (`GET
/learn/:frameworkKey/:stageName`): definition, purpose, typical function,
writer questions, common mistakes, an original (non-copyrighted) example,
and how it relates to other beats. Frameworks without authored content yet
fall back to an AI explanation grounded in that framework's own stated
purpose (never inventing terminology from nothing) — clearly labeled
`source: "ai_generated"` vs `"verified_content"` in the response so the UI
can distinguish them.

**Apply to My Story** (`POST /projects/:id/learn/:frameworkKey/:stageName/apply`)
pulls the project's actual premise, characters, and beats and gives
project-specific suggestions — framed as options, never as required
changes, per spec section 30's "never force a formula" principle.

**Not yet authored:** structured Learn content for the other 14 frameworks
(Hero's Journey, Seven-Point, etc.) — those currently use the AI-grounded
fallback rather than hand-verified content. Extending `frameworks/
learningLibrary.js` with more entries is the natural next step; the pattern
is established and tested for two frameworks.
