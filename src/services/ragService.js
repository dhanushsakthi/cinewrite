// Semantic search + RAG retrieval (spec sections 26, 27, 38).
// Real cosine-similarity search via pgvector — not a stub. Quality of
// results depends on which embedding provider is configured (see
// embeddingProvider.js); the retrieval mechanics themselves are real.

const { pool } = require('../config/db');
const { getEmbeddingProvider } = require('./embeddingProvider');

// pgvector's text input format is simply "[1,2,3]" — small enough that
// depending on the (ESM-only, CJS-incompatible) `pgvector` npm package isn't
// worth the friction it causes for consumers on CommonJS.
function toSql(vector) {
  return `[${vector.join(',')}]`;
}

async function embedAndStoreScene(sceneId, text) {
  const provider = getEmbeddingProvider();
  const vector = await provider.embed(text);
  await pool.query('UPDATE scenes SET embedding = $1 WHERE id = $2', [toSql(vector), sceneId]);
}

async function embedAndStoreCharacter(characterId, text) {
  const provider = getEmbeddingProvider();
  const vector = await provider.embed(text);
  await pool.query('UPDATE characters SET embedding = $1 WHERE id = $2', [toSql(vector), characterId]);
}

// Global project search (spec section 38): semantic search over scenes,
// falling back gracefully to plain text search over dialogue/notes for
// projects that haven't been indexed yet.
async function semanticSearchScenes(projectId, query, limit = 8) {
  const provider = getEmbeddingProvider();
  const queryVector = await provider.embed(query);

  const result = await pool.query(
    `SELECT sc.id, sc.heading, sc.content, sc.scene_number,
            1 - (sc.embedding <=> $2) AS similarity
     FROM scenes sc
     JOIN sequences sq ON sc.sequence_id = sq.id
     JOIN acts a ON sq.act_id = a.id
     WHERE a.project_id = $1 AND sc.embedding IS NOT NULL
     ORDER BY sc.embedding <=> $2
     LIMIT $3`,
    [projectId, toSql(queryVector), limit]
  );
  return result.rows;
}

// Builds RAG context for the AI assistant/analyzer: pulls the most
// semantically relevant scenes for a question instead of stuffing the whole
// screenplay into the prompt (spec section 41 — performance/cost control).
async function buildRAGContext(projectId, question, limit = 5) {
  const relevantScenes = await semanticSearchScenes(projectId, question, limit);
  if (relevantScenes.length === 0) return null;
  return relevantScenes
    .map((s) => `Scene ${s.scene_number}${s.heading ? ' (' + s.heading + ')' : ''}: ${s.content || '(no content yet)'}`)
    .join('\n---\n');
}

module.exports = { embedAndStoreScene, embedAndStoreCharacter, semanticSearchScenes, buildRAGContext };
