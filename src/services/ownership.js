const { pool } = require('../config/db');

// Every nested-resource route (acts, beats, scenes, characters...) must prove
// the project belongs to the requesting user before touching it — this is the
// "user_id + project_id" isolation the spec requires (section 40), enforced
// once here rather than re-implemented per controller.
async function assertProjectOwnership(projectId, userId) {
  if (!projectId || !userId || projectId === 'undefined' || userId === 'undefined') return false;
  const result = await pool.query(
    'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return result.rows.length > 0;
}

module.exports = { assertProjectOwnership };
