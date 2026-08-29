const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');

const VALID_STATUSES = ['unresolved', 'partially_resolved', 'resolved', 'unnecessary'];

// POST /projects/:projectId/setups  { scene_id?, description, expected_payoff? }
async function createSetup(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { scene_id, description, expected_payoff } = req.body || {};
    if (!description) return res.status(400).json({ error: 'description is required' });

    const result = await pool.query(
      `INSERT INTO setups (project_id, scene_id, description, expected_payoff, confirmed_by_user)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [projectId, scene_id || null, description, expected_payoff || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listSetups(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      `SELECT s.*, sc.scene_number AS setup_scene_number, po.scene_number AS payoff_scene_number
       FROM setups s
       LEFT JOIN scenes sc ON s.scene_id = sc.id
       LEFT JOIN scenes po ON s.payoff_scene_id = po.id
       WHERE s.project_id = $1 ORDER BY s.created_at ASC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// PUT /projects/:projectId/setups/:id  { payoff_scene_id?, status? }
// Marking a payoff scene is how a setup moves from unresolved -> resolved
// (spec section 15: "Allow the writer to manually confirm AI detections").
async function updateSetup(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { payoff_scene_id, status, description, expected_payoff } = req.body || {};
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const fields = [];
    const values = [];
    if (payoff_scene_id !== undefined) { fields.push(`payoff_scene_id = $${fields.length + 3}`); values.push(payoff_scene_id); }
    if (status !== undefined) { fields.push(`status = $${fields.length + 3}`); values.push(status); }
    if (description !== undefined) { fields.push(`description = $${fields.length + 3}`); values.push(description); }
    if (expected_payoff !== undefined) { fields.push(`expected_payoff = $${fields.length + 3}`); values.push(expected_payoff); }
    if (fields.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const result = await pool.query(
      `UPDATE setups SET ${fields.join(', ')} WHERE id = $1 AND project_id = $2 RETURNING *`,
      [id, projectId, ...values]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setup not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteSetup(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'DELETE FROM setups WHERE id = $1 AND project_id = $2 RETURNING id',
      [id, projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Setup not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createSetup, listSetups, updateSetup, deleteSetup };
