const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');

// Snapshots the current scenes+beats state as a versioned draft (spec
// section 31: "Draft 1 -> Draft 2 -> ... -> Final Draft").
async function createVersion(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { label } = req.body || {};
    if (!label) return res.status(400).json({ error: 'label is required (e.g. "Draft 2")' });

    const scenes = await pool.query(
      `SELECT sc.* FROM scenes sc JOIN sequences sq ON sc.sequence_id = sq.id JOIN acts a ON sq.act_id = a.id
       WHERE a.project_id = $1 ORDER BY a.order_index, sq.order_index, sc.scene_number`,
      [projectId]
    );
    const beats = await pool.query(
      `SELECT b.* FROM beats b JOIN acts a ON b.act_id = a.id WHERE a.project_id = $1 ORDER BY b.order_index`,
      [projectId]
    );

    const snapshot = { scenes: scenes.rows, beats: beats.rows, snapshotAt: new Date().toISOString() };

    const result = await pool.query(
      'INSERT INTO screenplay_versions (project_id, label, snapshot) VALUES ($1, $2, $3) RETURNING id, project_id, label, created_at',
      [projectId, label, JSON.stringify(snapshot)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listVersions(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'SELECT id, project_id, label, created_at FROM screenplay_versions WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /projects/:projectId/versions/compare?from=<id>&to=<id>
// Diffs scene counts/pages and lists added/removed/changed scene headings —
// spec section 31: "Compare versions... see changed/deleted/added scenes".
async function compareVersions(req, res, next) {
  try {
    const { projectId } = req.params;
    const { from, to } = req.query;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (!from || !to || from === 'undefined' || to === 'undefined') return res.status(400).json({ error: 'from and to version ids are required' });

    const versions = await pool.query(
      'SELECT id, label, snapshot FROM screenplay_versions WHERE id IN ($1, $2) AND project_id = $3',
      [from, to, projectId]
    );
    if (versions.rows.length !== 2) return res.status(404).json({ error: 'One or both versions not found' });

    const fromVersion = versions.rows.find((v) => v.id === from);
    const toVersion = versions.rows.find((v) => v.id === to);

    const fromScenes = new Map(fromVersion.snapshot.scenes.map((s) => [s.id, s]));
    const toScenes = new Map(toVersion.snapshot.scenes.map((s) => [s.id, s]));

    const added = [...toScenes.values()].filter((s) => !fromScenes.has(s.id));
    const removed = [...fromScenes.values()].filter((s) => !toScenes.has(s.id));
    const changed = [...toScenes.values()].filter((s) => {
      const before = fromScenes.get(s.id);
      return before && before.content !== s.content;
    });

    const totalPages = (snapshot) => snapshot.scenes.reduce((sum, s) => sum + (Number(s.page_count) || 0), 0);

    res.json({
      from: { label: fromVersion.label, totalPages: totalPages(fromVersion.snapshot) },
      to: { label: toVersion.label, totalPages: totalPages(toVersion.snapshot) },
      added: added.map((s) => ({ id: s.id, heading: s.heading, scene_number: s.scene_number })),
      removed: removed.map((s) => ({ id: s.id, heading: s.heading, scene_number: s.scene_number })),
      changed: changed.map((s) => ({ id: s.id, heading: s.heading, scene_number: s.scene_number })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createVersion, listVersions, compareVersions };
