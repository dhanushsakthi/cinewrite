const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');

const CHAR_FIELDS = [
  'name', 'age', 'background', 'personality', 'goal', 'motivation', 'fear',
  'desire', 'flaw', 'strength', 'secret', 'internal_conflict', 'external_conflict',
  'arc_beginning', 'arc_midpoint', 'arc_ending',
];

async function createCharacter(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ error: 'name is required' });

    const columns = ['project_id', ...CHAR_FIELDS];
    const values = [projectId, ...CHAR_FIELDS.map((f) => body[f] ?? null)];
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
      `INSERT INTO characters (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listCharacters(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'SELECT * FROM characters WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function updateCharacter(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const body = req.body || {};
    const updatable = CHAR_FIELDS.filter((f) => f in body);
    if (updatable.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const setClause = updatable.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const values = updatable.map((f) => body[f]);

    const result = await pool.query(
      `UPDATE characters SET ${setClause} WHERE id = $1 AND project_id = $2 RETURNING *`,
      [id, projectId, ...values]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Character not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteCharacter(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'DELETE FROM characters WHERE id = $1 AND project_id = $2 RETURNING id',
      [id, projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Character not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createCharacter, listCharacters, updateCharacter, deleteCharacter };
