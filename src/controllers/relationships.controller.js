const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');

async function createRelationship(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { character_a_id, character_b_id, relationship_type, notes } = req.body || {};
    if (!character_a_id || !character_b_id || !relationship_type) {
      return res.status(400).json({ error: 'character_a_id, character_b_id and relationship_type are required' });
    }
    const result = await pool.query(
      `INSERT INTO character_relationships (project_id, character_a_id, character_b_id, relationship_type, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, character_a_id, character_b_id, relationship_type, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// Returns node/edge shape ready for a graph UI (spec section 14).
async function getRelationshipGraph(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const nodes = await pool.query('SELECT id, name FROM characters WHERE project_id = $1', [projectId]);
    const edges = await pool.query('SELECT * FROM character_relationships WHERE project_id = $1', [projectId]);
    res.json({ nodes: nodes.rows, edges: edges.rows });
  } catch (err) {
    next(err);
  }
}

async function deleteRelationship(req, res, next) {
  try {
    const { projectId, id } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'DELETE FROM character_relationships WHERE id = $1 AND project_id = $2 RETURNING id',
      [id, projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Relationship not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createRelationship, getRelationshipGraph, deleteRelationship };
