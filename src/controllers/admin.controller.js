const { pool } = require('../config/db');

// Spec section 55: admin sees counts/usage, never raw screenplay content.
// Phase 1/local scope: no separate admin role model yet — any authenticated
// user can hit this in dev. Add an `is_admin` column + middleware check
// before exposing this beyond localhost.
async function getStats(req, res, next) {
  try {
    const [users, projects, scenes, analysisRuns, failedJobsPlaceholder] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM projects'),
      pool.query('SELECT COUNT(*) FROM scenes'),
      pool.query('SELECT COUNT(*) FROM analysis'),
      Promise.resolve({ rows: [{ count: 0 }] }), // real queue (Phase 6) would report this
    ]);

    res.json({
      users: Number(users.rows[0].count),
      projects: Number(projects.rows[0].count),
      scenes: Number(scenes.rows[0].count),
      analysisRuns: Number(analysisRuns.rows[0].count),
      failedJobs: Number(failedJobsPlaceholder.rows[0].count),
      note: 'Background job/queue stats are placeholders until a real queue (SQS/BullMQ) replaces the in-process stub in services/jobQueue.js.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
