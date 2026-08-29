const { pool } = require('../config/db');
const { assertProjectOwnership } = require('../services/ownership');
const { searchTMDB, getOMDbDetails, searchGoogleBooks } = require('../services/researchProviders');

// POST /projects/:projectId/research  { source: "tmdb"|"omdb"|"google_books", query }
// Stores results with source + retrieval date (spec section 45) so the AI
// layer can distinguish verified external data from its own interpretation.
async function runResearch(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const { source, query } = req.body || {};
    if (!source || !query) return res.status(400).json({ error: 'source and query are required' });

    let results;
    if (source === 'tmdb') {
      if (!process.env.TMDB_API_KEY) return res.status(503).json({ error: 'TMDB_API_KEY not configured' });
      results = await searchTMDB(query, process.env.TMDB_API_KEY);
    } else if (source === 'omdb') {
      if (!process.env.OMDB_API_KEY) return res.status(503).json({ error: 'OMDB_API_KEY not configured' });
      const single = await getOMDbDetails(query, process.env.OMDB_API_KEY);
      results = single ? [single] : [];
    } else if (source === 'google_books') {
      results = await searchGoogleBooks(query);
    } else {
      return res.status(400).json({ error: 'source must be one of: tmdb, omdb, google_books' });
    }

    const stored = [];
    for (const r of results) {
      const inserted = await pool.query(
        `INSERT INTO research (project_id, source, external_id, content, confidence)
         VALUES ($1, $2, $3, $4, 'verified_external') RETURNING *`,
        [projectId, r.source, r.externalId || null, JSON.stringify(r)]
      );
      stored.push(inserted.rows[0]);
    }

    res.status(201).json(stored);
  } catch (err) {
    next(err);
  }
}

async function listResearch(req, res, next) {
  try {
    const { projectId } = req.params;
    if (!(await assertProjectOwnership(projectId, req.user.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const result = await pool.query(
      'SELECT * FROM research WHERE project_id = $1 ORDER BY retrieved_at DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { runResearch, listResearch };
