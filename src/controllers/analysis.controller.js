const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');
const { getAIProvider } = require('../services/aiProvider');

// Analytical dimensions from spec section 8 — kept as a fixed list so the
// dashboard (section 9) always has a stable, comparable set of categories
// across drafts rather than whatever the model happens to mention.
const DIMENSIONS = [
  'structure', 'pacing', 'character_arc', 'conflict', 'emotional_progression',
  'theme_integration', 'setup_payoff', 'scene_purpose', 'dialogue',
];

function extractScoreAndText(raw) {
  // Expects the model to lead with "Score: NN" on its own line; falls back
  // to null if it doesn't, rather than guessing — spec section 53 rule 6:
  // "If information is missing, say so."
  const match = raw.match(/score:\s*(\d{1,3})/i);
  const score = match ? Math.min(100, parseInt(match[1], 10)) : null;
  return { score, explanation: raw };
}

async function analyzeDimension(projectId, dimension, context) {
  const provider = getAIProvider();
  const prompt = `Score: <0-100>\n\nThen 2-4 sentences of evidence-based explanation.`;
  const raw = await provider.analyze({
    subject: prompt,
    dimension,
    context,
  });
  return extractScoreAndText(raw);
}

async function buildAnalysisContext(projectId) {
  const project = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  const scenes = await pool.query(
    `SELECT sc.scene_number, sc.heading, sc.content, sc.conflict, sc.emotional_value, sc.page_count
     FROM scenes sc JOIN sequences sq ON sc.sequence_id = sq.id JOIN acts a ON sq.act_id = a.id
     WHERE a.project_id = $1 ORDER BY a.order_index, sq.order_index, sc.scene_number`,
    [projectId]
  );
  const beats = await pool.query(
    `SELECT b.name, b.target_page, b.actual_page FROM beats b JOIN acts a ON b.act_id = a.id
     WHERE a.project_id = $1 ORDER BY b.order_index`,
    [projectId]
  );
  const characters = await pool.query('SELECT name, goal, arc_beginning, arc_ending FROM characters WHERE project_id = $1', [projectId]);

  const p = project.rows[0];
  const lines = [
    `Title: ${p.title}. Genre: ${p.genre || 'unspecified'}. Theme: ${p.theme || 'unspecified'}.`,
    `Central conflict: ${p.central_conflict || 'unspecified'}.`,
    `Beats: ${beats.rows.map((b) => `${b.name}(target p${b.target_page ?? '?'}, actual p${b.actual_page ?? 'unplaced'})`).join(', ') || 'none generated yet'}`,
    `Characters: ${characters.rows.map((c) => c.name).join(', ') || 'none yet'}`,
    `Scenes (${scenes.rows.length}):`,
    ...scenes.rows.map((s) => `  #${s.scene_number} ${s.heading || ''} — conflict: ${s.conflict || 'none noted'}; emotional value: ${s.emotional_value || 'unnoted'}`),
  ];
  return lines.join('\n');
}

// POST /projects/:projectId/analysis/run  { draftLabel? }
// Runs all dimensions and stores results — this is the expensive, deliberate
// action (spec section 30: background-job shaped, though run synchronously
// here since Phase 1's job queue is in-process; a real deployment would
// enqueue this).
async function runAnalysis(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const sceneCount = await pool.query(
      `SELECT COUNT(*) FROM scenes sc JOIN sequences sq ON sc.sequence_id = sq.id JOIN acts a ON sq.act_id = a.id WHERE a.project_id = $1`,
      [projectId]
    );
    if (Number(sceneCount.rows[0].count) === 0) {
      return res.status(400).json({ error: 'Write at least one scene before running analysis.' });
    }

    const draftLabel = req.body?.draftLabel || `Draft ${new Date().toISOString().slice(0, 10)}`;
    const context = await buildAnalysisContext(projectId);

    const results = [];
    for (const dimension of DIMENSIONS) {
      const { score, explanation } = await analyzeDimension(projectId, dimension, context);
      const inserted = await pool.query(
        `INSERT INTO analysis (project_id, category, score, explanation, draft_label)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [projectId, dimension, score, explanation, draftLabel]
      );
      results.push(inserted.rows[0]);
    }

    res.status(201).json({ draftLabel, results });
  } catch (err) {
    next(err);
  }
}

// GET /projects/:projectId/analysis — latest score per dimension (dashboard)
// plus full history for the "Story Evolution Timeline" (spec section 32).
async function getAnalysis(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const history = await pool.query(
      'SELECT * FROM analysis WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );

    const latestByDimension = {};
    for (const row of history.rows) {
      latestByDimension[row.category] = row; // later rows overwrite — history.rows is ASC
    }

    res.json({
      dashboard: DIMENSIONS.map((d) => latestByDimension[d] || { category: d, score: null, explanation: 'Not yet analyzed' }),
      history: history.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { runAnalysis, getAnalysis, DIMENSIONS };
