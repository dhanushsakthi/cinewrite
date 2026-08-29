// Embedding service for RAG (spec sections 19, 26, 27, 38).
//
// Anthropic's API does not serve embeddings directly — Anthropic's own docs
// recommend Voyage AI for this. This module is written against that
// assumption but is provider-swappable (same pattern as aiProvider.js), and
// falls back to a deterministic local embedding when no API key is set so
// semantic search still works end-to-end in dev/offline environments
// without paying for or requiring an external key.

const DIMENSIONS = 1536;

// Deterministic, dependency-free fallback: hashes n-grams of the text into a
// fixed-size vector. This is NOT a real semantic embedding — similar meaning
// won't reliably cluster — but it lets the retrieval pipeline (indexing,
// cosine search, RAG context assembly) be built and tested end-to-end before
// a real embedding API key is available. Swap to VoyageProvider in
// production.
function localHashEmbed(text) {
  const vec = new Array(DIMENSIONS).fill(0);
  const normalized = (text || '').toLowerCase();
  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram = normalized.slice(i, i + 3);
    let hash = 0;
    for (let c = 0; c < trigram.length; c++) hash = (hash * 31 + trigram.charCodeAt(c)) >>> 0;
    vec[hash % DIMENSIONS] += 1;
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

class VoyageProvider {
  constructor({ apiKey, model = 'voyage-3' }) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embed(text) {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ input: text, model: this.model }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Embedding provider error: ${res.status} ${errText}`);
    }
    const data = await res.json();
    return data.data[0].embedding;
  }
}

function getEmbeddingProvider() {
  if (process.env.VOYAGE_API_KEY) {
    return new VoyageProvider({ apiKey: process.env.VOYAGE_API_KEY });
  }
  // Fallback so the rest of the pipeline is fully testable without a key.
  return { embed: async (text) => localHashEmbed(text) };
}

module.exports = { getEmbeddingProvider, DIMENSIONS };
