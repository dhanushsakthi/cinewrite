const { pool } = require('../config/db');
const { targetPagesFromRuntime } = require('../services/pacingEngine');

const PROJECT_FIELDS = [
  'title', 'genre', 'subgenre', 'theme', 'tone', 'setting', 'time_period',
  'language', 'target_audience', 'rating_target', 'logline', 'premise',
  'central_conflict', 'protagonist', 'antagonist', 'main_goal', 'stakes',
  'internal_conflict', 'external_conflict', 'theme_statement',
  'target_runtime_minutes', 'target_pages',
];

async function createProject(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ error: 'title is required' });

    const targetPages = body.target_pages
      ?? targetPagesFromRuntime(body.target_runtime_minutes);

    const columns = ['user_id', ...PROJECT_FIELDS.filter((f) => f !== 'target_pages'), 'target_pages'];
    const values = [
      req.user.id,
      ...PROJECT_FIELDS.filter((f) => f !== 'target_pages').map((f) => body[f] ?? null),
      targetPages ?? null,
    ];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO projects (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listProjects(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const body = req.body || {};
    const updatable = PROJECT_FIELDS.filter((f) => f in body);
    if (updatable.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const setClause = updatable.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const values = updatable.map((f) => body[f]);

    const result = await pool.query(
      `UPDATE projects SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id, ...values]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };
