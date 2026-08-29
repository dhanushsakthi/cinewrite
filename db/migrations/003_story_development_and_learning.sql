-- Phase: Story Development + Beat Sheet + Learning System
-- Purely additive — existing acts/beats/frameworks rows are untouched.
-- Existing Three-Act and Save the Cat projects keep working exactly as before;
-- new columns are nullable so old rows are simply "not yet classified."

-- Distinguishes a beat-sheet beat (Save the Cat's "Catalyst") from a
-- whole-story-structure stage (Hero's Journey's "Ordinary World") from a
-- scene-level micro-structure step (Scene-Sequel's "Goal") — spec section 3's
-- "do not mix these concepts" requirement, enforced in the data model.
ALTER TABLE beats ADD COLUMN IF NOT EXISTS beat_type TEXT DEFAULT 'beat_sheet';
-- 'structure_stage' | 'beat_sheet' | 'scene_level'

-- Framework-level metadata: which category a framework belongs to, and
-- whether it's a whole-story structure, a beat sheet, or a scene-level
-- method (spec section 2's three category headers).
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'beat_sheet';
ALTER TABLE user_frameworks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'beat_sheet';

-- Structured learning content library (spec section 31: "structured, not
-- hard-coded into random UI components"). Keyed by framework + stage name so
-- both system frameworks and future custom ones can attach learning content.
CREATE TABLE IF NOT EXISTS learning_content (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_key   TEXT NOT NULL,           -- e.g. "save-the-cat"
    stage_name      TEXT NOT NULL,           -- e.g. "B Story"
    definition      TEXT NOT NULL,
    purpose         TEXT NOT NULL,
    typical_function TEXT NOT NULL,
    writer_questions TEXT[] NOT NULL DEFAULT '{}',
    common_mistakes  TEXT[] NOT NULL DEFAULT '{}',
    example         TEXT,                    -- original, non-copyrighted
    relation_notes  TEXT,                    -- e.g. "How it connects to A Story"
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (framework_key, stage_name)
);

-- Records a project's active combination of structures (spec section 23:
-- Hybrid Structures) so "Three-Act as primary + Save the Cat beats + Scene-
-- Sequel at scene level" can be represented and displayed without needing
-- three separate ad hoc columns on `projects`.
CREATE TABLE IF NOT EXISTS project_structure_layers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    layer           TEXT NOT NULL,            -- 'primary_structure' | 'beat_sheet' | 'scene_method'
    framework_key   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (project_id, layer)
);
