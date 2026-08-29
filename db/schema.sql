-- CineWrite AI — Phase 1 schema
-- PostgreSQL. Run with: psql -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ========== USERS ==========
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    preferences     JSONB DEFAULT '{}'::jsonb,
    subscription    TEXT DEFAULT 'free',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== FRAMEWORKS (system + user-defined) ==========
CREATE TABLE frameworks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,               -- e.g. "Save the Cat"
    is_system       BOOLEAN DEFAULT true,
    configuration   JSONB NOT NULL,               -- acts -> beats -> {purpose, page %, ...}
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_frameworks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    configuration   JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== PROJECTS ==========
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    genre           TEXT,
    subgenre        TEXT,
    theme           TEXT,
    tone            TEXT,
    setting         TEXT,
    time_period     TEXT,
    language        TEXT DEFAULT 'English',
    target_audience TEXT,
    rating_target   TEXT,
    logline         TEXT,
    premise         TEXT,
    central_conflict TEXT,
    protagonist     TEXT,
    antagonist      TEXT,
    main_goal       TEXT,
    stakes          TEXT,
    internal_conflict TEXT,
    external_conflict TEXT,
    theme_statement TEXT,
    target_runtime_minutes INTEGER,               -- e.g. 100
    target_pages    INTEGER,                       -- derived, but user-editable
    framework_id    UUID REFERENCES frameworks(id),
    user_framework_id UUID REFERENCES user_frameworks(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CHECK (framework_id IS NOT NULL OR user_framework_id IS NOT NULL OR true) -- allow null until chosen
);

CREATE INDEX idx_projects_user ON projects(user_id);

-- ========== CHARACTERS ==========
CREATE TABLE characters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    age             TEXT,
    background      TEXT,
    personality     TEXT,
    goal            TEXT,
    motivation      TEXT,
    fear            TEXT,
    desire          TEXT,
    flaw            TEXT,
    strength        TEXT,
    secret          TEXT,
    internal_conflict TEXT,
    external_conflict TEXT,
    arc_beginning   TEXT,
    arc_midpoint    TEXT,
    arc_ending      TEXT,
    embedding_id    TEXT,                          -- Phase 4: pgvector lookup key
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_characters_project ON characters(project_id);

CREATE TABLE character_relationships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    character_a_id  UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    character_b_id  UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,                -- friendship/love/family/rivalry/...
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== ACTS / BEATS / SEQUENCES / SCENES ==========
CREATE TABLE acts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                  -- "Act 1", "Act 2A", ...
    order_index     INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_acts_project ON acts(project_id);

CREATE TABLE beats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id          UUID NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                  -- "Catalyst"
    order_index     INTEGER NOT NULL,
    target_page     NUMERIC,
    actual_page     NUMERIC,
    target_percentage NUMERIC,
    purpose         TEXT,
    emotional_purpose TEXT,
    notes           TEXT,
    is_optional     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_beats_act ON beats(act_id);

CREATE TABLE sequences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_id          UUID NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    order_index     INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scenes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id     UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    beat_id         UUID REFERENCES beats(id) ON DELETE SET NULL,
    scene_number    INTEGER NOT NULL,
    heading         TEXT,                            -- "INT. HOUSE - NIGHT"
    content         TEXT DEFAULT '',                  -- screenplay-formatted text
    int_ext         TEXT,
    location        TEXT,
    time_of_day     TEXT,
    objective       TEXT,
    conflict        TEXT,
    outcome         TEXT,
    emotional_value TEXT,
    page_count      NUMERIC DEFAULT 0,
    story_function  TEXT,
    embedding_id    TEXT,                             -- Phase 4
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scenes_sequence ON scenes(sequence_id);
CREATE INDEX idx_scenes_beat ON scenes(beat_id);

CREATE TABLE scene_characters (
    scene_id        UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    character_id    UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    PRIMARY KEY (scene_id, character_id)
);

-- ========== SETUPS / PAYOFFS (Phase 2/5, schema ready now) ==========
CREATE TABLE setups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scene_id        UUID REFERENCES scenes(id) ON DELETE SET NULL,
    description     TEXT NOT NULL,
    expected_payoff TEXT,
    payoff_scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    status          TEXT DEFAULT 'unresolved',        -- unresolved/partially_resolved/resolved/unnecessary
    confirmed_by_user BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== ANALYSIS (Phase 2, schema ready now) ==========
CREATE TABLE analysis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scene_id        UUID REFERENCES scenes(id) ON DELETE SET NULL,
    category        TEXT NOT NULL,                     -- pacing/structure/character/...
    score           NUMERIC,
    explanation     TEXT,
    recommendation  TEXT,
    confidence      TEXT,                               -- low/medium/high
    draft_label     TEXT,                                -- "Draft 1", "Draft 2"...
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== RESEARCH / REFERENCES (Phase 3/4, schema ready now) ==========
CREATE TABLE research (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source          TEXT NOT NULL,                       -- e.g. "TMDB"
    external_id     TEXT,
    content         JSONB,
    retrieved_at    TIMESTAMPTZ DEFAULT now(),
    confidence      TEXT
);

CREATE TABLE "references" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,
    original_name   TEXT,
    file_type       TEXT,
    metadata        JSONB,
    embedding_id    TEXT,
    processed       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ========== VERSIONING (Phase 5, schema ready now) ==========
CREATE TABLE screenplay_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label           TEXT NOT NULL,                        -- "Draft 1"
    snapshot        JSONB NOT NULL,                        -- full scenes/beats snapshot
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_characters_updated BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_beats_updated BEFORE UPDATE ON beats FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_scenes_updated BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
