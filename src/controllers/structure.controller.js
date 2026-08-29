const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');
const { listFrameworks, getFramework, combineFrameworks } = require('../frameworks');
const { computeBeatTargets, pacingDeviation, projectCompletion } = require('../services/pacingEngine');

function getAvailableFrameworks(req, res) {
  res.json(listFrameworks());
}

// Resolves either a system framework key (from the in-code registry) or a
// user-created custom structure ("user:<uuid>", spec section 22) into the
// same { name, acts: [{ name, beats: [...] }] } shape, so generateStructure
// never needs to know which kind it's dealing with.
async function resolveFrameworkKey(key, userId) {
  if (key.startsWith('user:')) {
    const id = key.slice(5);
    const result = await pool.query(
      'SELECT configuration FROM user_frameworks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0]?.configuration || null;
  }
  return getFramework(key);
}

async function resolveFrameworks(frameworkKeys, userId) {
  if (frameworkKeys.length === 1) return resolveFrameworkKey(frameworkKeys[0], userId);
  // combineFrameworks only knows the system registry; for a mix that
  // includes a custom structure, resolve each individually and merge here.
  const defs = [];
  for (const key of frameworkKeys) {
    const def = await resolveFrameworkKey(key, userId);
    if (def) defs.push(def);
  }
  if (defs.length === 0) return null;
  if (defs.length === 1) return defs[0];
  const combinedName = defs.map((d) => d.name).join(' + ');
  const allBeats = defs.flatMap((d) => d.acts.flatMap((act) => act.beats.map((b) => ({ ...b, source_framework: d.name, source_act: act.name }))));
  allBeats.sort((a, b) => (a.target_percentage || 0) - (b.target_percentage || 0));
  return { name: combinedName, acts: [{ name: 'Combined Timeline', beats: allBeats }] };
}

// POST /projects/:projectId/structure/generate
//   { frameworkKeys: ["three-act"] }                                    -- single/combined
//   { frameworkKeys: ["three-act","save-the-cat","scene-sequel"],
//     layers: { "three-act": "primary_structure", "save-the-cat": "beat_sheet", "scene-sequel": "scene_method" } }
// The optional `layers` map records a Hybrid Structure (spec section 23) in
// project_structure_layers for display, without changing how beats are
// generated — generation still flattens everything into one combined
// timeline; `layers` is purely the "which framework plays which role" record.
async function generateStructure(req, res, next) {
  const client = await pool.connect();
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { frameworkKeys, layers } = req.body || {};
    if (!Array.isArray(frameworkKeys) || frameworkKeys.length === 0) {
      return res.status(400).json({ error: 'frameworkKeys must be a non-empty array' });
    }

    const existing = await client.query('SELECT id FROM acts WHERE project_id = $1', [projectId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Project already has structure. Delete existing acts first or use a merge endpoint.',
      });
    }

    const framework = await resolveFrameworks(frameworkKeys, req.user.id);

    if (!framework) return res.status(400).json({ error: 'Unknown framework key(s)' });

    const projectResult = await client.query('SELECT target_pages FROM projects WHERE id = $1', [projectId]);
    const targetPages = projectResult.rows[0]?.target_pages;

    await client.query('BEGIN');

    const createdActs = [];
    for (let actIndex = 0; actIndex < framework.acts.length; actIndex++) {
      const act = framework.acts[actIndex];
      const actResult = await client.query(
        'INSERT INTO acts (project_id, name, order_index) VALUES ($1, $2, $3) RETURNING *',
        [projectId, act.name, actIndex]
      );
      const actRow = actResult.rows[0];

      const beatsWithTargets = computeBeatTargets(act.beats, targetPages);
      const createdBeats = [];
      for (let beatIndex = 0; beatIndex < beatsWithTargets.length; beatIndex++) {
        const beat = beatsWithTargets[beatIndex];
        const beatResult = await client.query(
          `INSERT INTO beats (act_id, name, order_index, target_page, target_percentage, purpose, is_optional)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [actRow.id, beat.name, beatIndex, beat.target_page ?? null, beat.target_percentage ?? null,
            beat.purpose ?? null, !!beat.is_optional]
        );
        createdBeats.push(beatResult.rows[0]);
      }
      createdActs.push({ ...actRow, beats: createdBeats });
    }

    // Record the hybrid layer assignment (spec section 23), if provided —
    // purely informational for the UI, doesn't affect the beats just created.
    if (layers && typeof layers === 'object') {
      for (const [fwKey, layer] of Object.entries(layers)) {
        await client.query(
          'DELETE FROM project_structure_layers WHERE project_id = $1 AND layer = $2',
          [projectId, layer]
        );
        await client.query(
          'INSERT INTO project_structure_layers (project_id, layer, framework_key) VALUES ($1, $2, $3)',
          [projectId, layer, fwKey]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ framework: framework.name, acts: createdActs });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function getStructure(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const acts = await pool.query(
      'SELECT * FROM acts WHERE project_id = $1 ORDER BY order_index ASC',
      [projectId]
    );
    const beats = await pool.query(
      `SELECT b.* FROM beats b JOIN acts a ON b.act_id = a.id
       WHERE a.project_id = $1 ORDER BY a.order_index, b.order_index`,
      [projectId]
    );

    const beatsByAct = {};
    for (const beat of beats.rows) {
      (beatsByAct[beat.act_id] ||= []).push({ ...beat, ...pacingDeviation(beat) });
    }

    res.json(acts.rows.map((act) => ({ ...act, beats: beatsByAct[act.id] || [] })));
  } catch (err) {
    next(err);
  }
}

// GET /projects/:projectId/pacing — spec section 4
async function getPacing(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await pool.query('SELECT target_pages FROM projects WHERE id = $1', [projectId]);
    const targetPages = project.rows[0]?.target_pages;

    const pageSum = await pool.query(
      `SELECT COALESCE(SUM(s.page_count), 0) AS current_pages
       FROM scenes s
       JOIN sequences sq ON s.sequence_id = sq.id
       JOIN acts a ON sq.act_id = a.id
       WHERE a.project_id = $1`,
      [projectId]
    );
    const currentPages = Number(pageSum.rows[0].current_pages);

    const beats = await pool.query(
      `SELECT b.* FROM beats b JOIN acts a ON b.act_id = a.id WHERE a.project_id = $1 ORDER BY b.target_page`,
      [projectId]
    );

    res.json({
      targetPages,
      currentPages,
      ...projectCompletion({ currentPages, targetPages }),
      beats: beats.rows.map((b) => ({ ...b, ...pacingDeviation(b) })),
    });
  } catch (err) {
    next(err);
  }
}

async function getStructureLayers(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'SELECT layer, framework_key FROM project_structure_layers WHERE project_id = $1',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailableFrameworks, generateStructure, getStructure, getPacing, getStructureLayers };
