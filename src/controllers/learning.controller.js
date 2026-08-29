const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');
const { getFramework } = require('../frameworks');
const { getStructuredLearningContent } = require('../frameworks/learningLibrary');
const { getAIProvider } = require('../services/aiProvider');

// GET /learn/:frameworkKey/:stageName
// Spec section 32: "AI explanations should be grounded in the framework
// knowledge. Do not allow the AI to invent screenwriting terminology."
// So: structured content (learningLibrary.js) is authoritative and returned
// as-is when it exists. Only frameworks not yet authored there fall back to
// an AI explanation — and that fallback prompt is grounded with the
// framework's own purpose string from frameworks/index.js, not a blank
// "explain X" prompt, so the AI has real material to work from rather than
// inventing definitions.
async function learnStage(req, res, next) {
  try {
    const { frameworkKey, stageName } = req.params;
    const framework = getFramework(frameworkKey);
    if (!framework) return res.status(404).json({ error: 'Unknown framework' });

    const structured = getStructuredLearningContent(frameworkKey, stageName);
    if (structured) {
      return res.json({ frameworkName: framework.name, stageName, source: 'verified_content', ...structured });
    }

    // Find the stage's own purpose string in the framework definition to
    // ground the fallback explanation instead of prompting from nothing.
    const stageDefinition = framework.acts
      .flatMap((act) => act.beats)
      .find((b) => b.name === stageName);
    if (!stageDefinition) return res.status(404).json({ error: 'Unknown stage for this framework' });

    const provider = getAIProvider();
    const prompt = [
      `Explain the screenwriting concept "${stageName}" from the "${framework.name}" framework.`,
      `Its stated narrative purpose is: "${stageDefinition.purpose}".`,
      'Structure your answer with these exact headers: Definition, Purpose, Typical Function, Writer Questions (3 bullet questions), Common Mistakes (2-3 bullets), Example (a short ORIGINAL, non-copyrighted example).',
      'Do not invent screenwriting terminology beyond what is standard; stay grounded in the stated purpose above.',
    ].join(' ');

    const raw = await provider.generate({ prompt, context: null });
    return res.json({ frameworkName: framework.name, stageName, source: 'ai_generated', explanation: raw });
  } catch (err) {
    next(err);
  }
}

// POST /projects/:projectId/learn/:frameworkKey/:stageName/apply
// Spec section 7/37: "Apply to My Story" — retrieves real project context
// (premise, characters, current beats/scenes) and gives context-aware
// guidance, never a generic answer, and never forcing the suggestion.
async function applyToProject(req, res, next) {
  try {
    const { projectId, frameworkKey, stageName } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const framework = getFramework(frameworkKey);
    if (!framework) return res.status(404).json({ error: 'Unknown framework' });

    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    const characters = await pool.query('SELECT name, goal, flaw, arc_beginning, arc_ending FROM characters WHERE project_id = $1', [projectId]);
    const beats = await pool.query(
      `SELECT b.name, b.actual_page FROM beats b JOIN acts a ON b.act_id = a.id WHERE a.project_id = $1 ORDER BY b.order_index`,
      [projectId]
    );

    const p = project.rows[0];
    const structured = getStructuredLearningContent(frameworkKey, stageName);

    const context = [
      `Title: ${p.title}. Genre: ${p.genre || 'unspecified'}. Theme: ${p.theme || 'unspecified'}.`,
      `Logline: ${p.logline || 'not yet written'}.`,
      `Central conflict: ${p.central_conflict || 'unspecified'}.`,
      `Characters: ${characters.rows.map((c) => `${c.name} (goal: ${c.goal || '?'}, flaw: ${c.flaw || '?'})`).join('; ') || 'none yet'}`,
      `Existing beats: ${beats.rows.map((b) => b.name).join(', ') || 'none yet'}`,
    ].join('\n');

    const provider = getAIProvider();
    const prompt = [
      `The writer wants suggestions for the "${stageName}" stage of the "${framework.name}" framework, applied to their own story below.`,
      structured ? `Ground your suggestion in this definition of the stage: ${structured.definition} Purpose: ${structured.purpose}` : '',
      'Give 2-3 concrete, specific possibilities drawn from the actual characters/premise above — not generic advice.',
      'Never present these as required — frame them as options the writer can take or leave. Do not tell the writer their existing choices are wrong.',
    ].filter(Boolean).join(' ');

    const suggestion = await provider.generate({ prompt, context });
    res.json({ stageName, frameworkName: framework.name, suggestion });
  } catch (err) {
    next(err);
  }
}

module.exports = { learnStage, applyToProject };
