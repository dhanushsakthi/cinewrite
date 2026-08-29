const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');
const { embedAndStoreScene } = require('../services/ragService');

const SCENE_FIELDS = [
  'heading', 'content', 'int_ext', 'location', 'time_of_day', 'objective',
  'conflict', 'outcome', 'emotional_value', 'page_count', 'story_function', 'beat_id',
];

// A sequence must exist to hold scenes (spec's Acts -> Sequences -> Scenes).
// This helper creates a default sequence for an act on first use so a writer
// can start dropping in scenes without a separate "create sequence" step,
// while the explicit /sequences endpoint still exists for the story map UI.
async function getOrCreateDefaultSequence(actId) {
  const existing = await pool.query(
    'SELECT id FROM sequences WHERE act_id = $1 ORDER BY order_index ASC LIMIT 1',
    [actId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const created = await pool.query(
    'INSERT INTO sequences (act_id, name, order_index) VALUES ($1, $2, 0) RETURNING id',
    [actId, 'Sequence 1']
  );
  return created.rows[0].id;
}

async function assertActOwnership(actId, projectId) {
  const result = await pool.query(
    'SELECT id FROM acts WHERE id = $1 AND project_id = $2',
    [actId, projectId]
  );
  return result.rows.length > 0;
}

// When a scene is placed against a beat, that beat's actual_page should
// reflect where the scene actually lands (spec section 4's "Actual: Page 18"
// example) — this keeps /pacing accurate without a manual step.
async function syncBeatActualPage(beatId, pageCount) {
  if (!beatId || pageCount == null) return;
  await pool.query('UPDATE beats SET actual_page = $1 WHERE id = $2', [pageCount, beatId]);
}

async function createScene(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const body = req.body || {};
    let sequenceId = body.sequence_id;

    if (!sequenceId) {
      if (!body.act_id || !(await assertActOwnership(body.act_id, projectId))) {
        return res.status(400).json({ error: 'Provide a valid sequence_id or act_id' });
      }
      sequenceId = await getOrCreateDefaultSequence(body.act_id);
    }

    const maxSceneNum = await pool.query(
      'SELECT COALESCE(MAX(scene_number), 0) AS max_num FROM scenes WHERE sequence_id = $1',
      [sequenceId]
    );
    const sceneNumber = body.scene_number ?? (Number(maxSceneNum.rows[0].max_num) + 1);

    const columns = ['sequence_id', 'scene_number', ...SCENE_FIELDS];
    const values = [sequenceId, sceneNumber, ...SCENE_FIELDS.map((f) => body[f] ?? null)];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO scenes (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    await syncBeatActualPage(result.rows[0].beat_id, result.rows[0].page_count);
    // Fire-and-forget: indexing shouldn't block the scene-creation response
    // (spec section 30 — heavy work happens off the request path).
    if (result.rows[0].content) {
      embedAndStoreScene(result.rows[0].id, result.rows[0].content).catch((e) => console.error('Embedding failed:', e.message));
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listScenes(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pool.query(
      `SELECT sc.*, sq.act_id FROM scenes sc
       JOIN sequences sq ON sc.sequence_id = sq.id
       JOIN acts a ON sq.act_id = a.id
       WHERE a.project_id = $1
       ORDER BY a.order_index, sq.order_index, sc.scene_number`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function updateScene(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const body = req.body || {};
    const updatable = [...SCENE_FIELDS, 'scene_number'].filter((f) => f in body);
    if (updatable.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const setClause = updatable.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const values = updatable.map((f) => body[f]);

    // Ownership enforced via join back to the project through sequence -> act
    const result = await pool.query(
      `UPDATE scenes SET ${setClause}
       WHERE id = $1 AND sequence_id IN (
         SELECT sq.id FROM sequences sq JOIN acts a ON sq.act_id = a.id WHERE a.project_id = $2
       )
       RETURNING *`,
      [id, projectId, ...values]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scene not found' });
    await syncBeatActualPage(result.rows[0].beat_id, result.rows[0].page_count);
    if ('content' in body) {
      embedAndStoreScene(result.rows[0].id, result.rows[0].content || '').catch((e) => console.error('Embedding failed:', e.message));
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteScene(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await pool.query(
      `DELETE FROM scenes WHERE id = $1 AND sequence_id IN (
         SELECT sq.id FROM sequences sq JOIN acts a ON sq.act_id = a.id WHERE a.project_id = $2
       ) RETURNING id`,
      [id, projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Scene not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createScene, listScenes, updateScene, deleteScene };
