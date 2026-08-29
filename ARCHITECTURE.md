# CineWrite AI — Architecture

## Scope of this build
Phase 1 (core writing) plus the parts of Phase 2, 4, and 5 that don't require
external accounts: Story Analyzer, Setup/Payoff engine, character
relationships, real pgvector-based semantic search, and version control.
Phase 3 (TMDB/OMDb/Google Books) is written but unverified — needs your API
keys and network access this sandbox didn't have. Phase 6 (cloud deploy,
billing, monitoring) is out of scope entirely — see README.md's "What's real
vs. what needs your own keys" section for the exact line.

## Stack
- **Backend:** Node.js + Express (REST API, OpenAPI-documentable)
- **Database:** PostgreSQL (raw SQL via `pg`, no heavy ORM — keeps schema changes explicit
  and makes the later move to pgvector for embeddings trivial)
- **Auth:** JWT (email + password to start; OAuth is a drop-in swap later)
- **AI layer:** a single `AIProvider` interface (`src/services/aiProvider.js`) wrapping the
  Anthropic API, so swapping/adding providers (OpenAI, Gemini) never touches route code
- **Background jobs:** stubbed as an in-process queue (`src/services/jobQueue.js`) with the
  same interface a real queue (SQS/Cloud Tasks/BullMQ+Redis) would expose, so Phase 6 can
  swap the implementation without touching callers

## Folder structure
```
cinewrite-ai/
  ARCHITECTURE.md
  package.json
  .env.example
  db/
    schema.sql              # Phase 1 tables (+ forward-compatible columns for later phases)
  src/
    server.js               # entrypoint
    app.js                  # express app, middleware wiring
    config/
      db.js                 # pg pool
    middleware/
      auth.js                # JWT verification
      errorHandler.js
    routes/
      auth.routes.js
      projects.routes.js
      characters.routes.js
      structure.routes.js    # acts/beats + framework generation
      scenes.routes.js
      ai.routes.js           # basic "Ask AI" assistant endpoint
    controllers/             # one per route file, thin — validation + calling services
    services/
      aiProvider.js          # AIProvider abstraction (generate/analyze/summarize/embed)
      jobQueue.js             # background job stub
      pacingEngine.js         # page/percentage target math
    frameworks/
      threeAct.js
      saveTheCat.js
      index.js                # framework registry (add more without touching routes)
```

## Data model (Phase 1 subset of the full spec)
`users → projects → { characters, acts → beats, sequences → scenes }`, plus
`frameworks` (system-defined) and `user_frameworks` (custom, JSON-configured) so the
Structure Engine never hard-codes a single beat sheet.

Every table that will later need semantic search (scenes, characters, beats) has a
placeholder `embedding_id` column so Phase 4 (RAG/pgvector) is additive, not a migration
that touches existing data shape.

## Security posture (Phase 1 baseline)
- All project-scoped routes check `user_id` ownership before returning/mutating anything
  (`WHERE project_id = $1 AND user_id = $2`) — this is the `user_id + project_id` isolation
  the spec requires, enforced at the query layer, not just in the app layer.
- Passwords hashed with bcrypt; JWT secret from env; no secrets committed.
- Input validated at the controller layer before hitting the DB.

## Extension points for later phases
- `AIProvider.analyze()` is already shaped for the Story Analyzer (Phase 2) — it just isn't
  called by a dashboard yet.
- `frameworks/index.js` registry means "Custom Tamil Commercial Cinema Structure" (Phase 4/5)
  is a new JSON row, not new code.
- `embedding_id` columns + `db/schema.sql`'s `references` and `research` tables are ready for
  pgvector once Phase 4 starts.
