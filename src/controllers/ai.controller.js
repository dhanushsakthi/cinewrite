const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');
const { getAIProvider } = require('../services/aiProvider');

// Assembles a compact project context string for the AI (spec section 7/26).
// Phase 1 keeps this simple (project fields + character names + beat names);
// Phase 4's RAG pipeline will replace this with retrieval over embeddings so
// full screenplays don't get stuffed into every prompt (spec section 41).
async function buildProjectContext(projectId) {
  const project = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  const characters = await pool.query('SELECT name, goal, arc_beginning, arc_ending FROM characters WHERE project_id = $1', [projectId]);
  const beats = await pool.query(
    `SELECT b.name, b.target_page, b.actual_page FROM beats b
     JOIN acts a ON b.act_id = a.id WHERE a.project_id = $1 ORDER BY b.order_index`,
    [projectId]
  );

  const p = project.rows[0];
  if (!p) return '';

  const lines = [
    `Title: ${p.title}`,
    p.genre ? `Genre: ${p.genre}` : null,
    p.theme ? `Theme: ${p.theme}` : null,
    p.logline ? `Logline: ${p.logline}` : null,
    p.central_conflict ? `Central conflict: ${p.central_conflict}` : null,
    characters.rows.length
      ? `Characters: ${characters.rows.map((c) => `${c.name} (goal: ${c.goal || 'unspecified'})`).join('; ')}`
      : null,
    beats.rows.length
      ? `Beats: ${beats.rows.map((b) => `${b.name}${b.actual_page ? ` @p${b.actual_page}` : ''}`).join(', ')}`
      : null,
  ].filter(Boolean);

  return lines.join('\n');
}

// POST /projects/:projectId/ai/ask  { question: "..." }
async function askAI(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question is required' });

    const context = await buildProjectContext(projectId);
    const provider = getAIProvider();
    const answer = await provider.generate({ prompt: question, context });

    res.json({ answer, contextUsed: context });
  } catch (err) {
    next(err);
  }
}

module.exports = { askAI };
