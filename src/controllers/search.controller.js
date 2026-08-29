const { assertProjectOwnership } = require('../services/ownership');
const { semanticSearchScenes } = require('../services/ragService');

// GET /projects/:projectId/search?q=...  (spec section 38)
async function search(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q query parameter is required' });

    const scenes = await semanticSearchScenes(projectId, q, 10);
    res.json({ query: q, results: scenes });
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
