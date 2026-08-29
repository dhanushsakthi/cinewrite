-- Phase 2/4/5 additions. Run after db/schema.sql.
-- Adds: real vector columns (pgvector) for scenes/characters/references so
-- semantic search (spec section 38) and RAG retrieval (section 26) work for
-- real instead of just reserving a text placeholder column.

CREATE EXTENSION IF NOT EXISTS vector;

-- 1536 dims matches common embedding model output sizes; adjust if your
-- chosen embedding model differs.
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE characters ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE "references" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- IVFFlat indexes for approximate nearest-neighbor search. `lists` is tuned
-- for small-to-medium projects; a production deployment with many projects
-- should retune based on row count (rule of thumb: rows / 1000).
CREATE INDEX IF NOT EXISTS idx_scenes_embedding ON scenes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX IF NOT EXISTS idx_characters_embedding ON characters USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Character relationships already exist in db/schema.sql — nothing to add there.

-- Analysis table already supports draft_label for the "Story Evolution"
-- comparison (spec section 32) — no structural change needed, just usage.
