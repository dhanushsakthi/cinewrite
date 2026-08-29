const { pool } = require('../config/db');

// POST /custom-structures  { name, description, acts: [{ name, beats: [{ name, description, purpose, target_page, target_percentage, emotional_objective, conflict_objective }] }] }
// Spec section 22: user-defined structures are first-class, stored in the
// existing user_frameworks table (not a parallel implementation) so they
// flow through the same generateStructure() pipeline as system frameworks.
async function createCustomStructure(req, res, next) {
  try {
    const { name, description, acts, category } = req.body || {};
    if (!name || !Array.isArray(acts) || acts.length === 0) {
      return res.status(400).json({ error: 'name and a non-empty acts array are required' });
    }
    for (const act of acts) {
      if (!act.name || !Array.isArray(act.beats)) {
        return res.status(400).json({ error: 'Each act needs a name and a beats array' });
      }
    }

    const configuration = { name, description: description || null, acts, category: category || 'beat_sheet' };
    const result = await pool.query(
      'INSERT INTO user_frameworks (user_id, name, configuration, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, JSON.stringify(configuration), category || 'beat_sheet']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listCustomStructures(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM user_frameworks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function deleteCustomStructure(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM user_frameworks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Custom structure not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createCustomStructure, listCustomStructures, deleteCustomStructure };
