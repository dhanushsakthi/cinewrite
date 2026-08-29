// AIProvider abstraction (spec section 24/25).
// Route/controller code should only ever talk to this module — never to a
// specific vendor SDK directly — so swapping or adding providers (OpenAI,
// Gemini, a local model) later means writing a new class here, not touching
// every place that calls the AI.

class AnthropicProvider {
  constructor({ apiKey, model }) {
    this.apiKey = apiKey;
    this.model = model || 'claude-sonnet-4-6';
    this.endpoint = 'https://api.anthropic.com/v1/messages';
  }

  async _call({ system, messages, maxTokens = 1000 }) {
    if (!this.apiKey) {
      const err = new Error('ANTHROPIC_API_KEY is not configured in .env file');
      err.status = 400;
      throw err;
    }
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`AI provider error: ${res.status} ${text}`);
      err.status = 502;
      throw err;
    }

    const data = await res.json();
    return data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  }

  // "Ask AI" — free-form question about the current project, given
  // pre-assembled context (see services/pacingEngine.js and, later, the
  // RAG retrieval pipeline for how that context gets built).
  async generate({ prompt, context }) {
    const system = [
      'You are a story development assistant inside a screenwriting tool.',
      'You are a collaborator, never the author: the filmmaker is the final creative authority.',
      'Only use the project context provided below plus the user question — do not invent',
      'facts about the project, and say plainly when the context does not contain an answer.',
      context ? `PROJECT CONTEXT:\n${context}` : '',
    ].filter(Boolean).join('\n\n');

    return this._call({ system, messages: [{ role: 'user', content: prompt }] });
  }

  // Structured analysis (Phase 2 Story Analyzer will call this per-dimension:
  // pacing, structure, character consistency, etc.)
  async analyze({ subject, dimension, context }) {
    const system = [
      `You are analyzing a screenplay's "${dimension}" dimension.`,
      'Return an evidence-based assessment, never a bare score.',
      'Never claim a definite audience reaction — frame findings as potential risks or strengths,',
      'each with a stated reason and, where relevant, a confidence level (low/medium/high).',
    ].join(' ');

    const prompt = `SUBJECT:\n${subject}\n\nCONTEXT:\n${context || '(none provided)'}`;
    return this._call({ system, messages: [{ role: 'user', content: prompt }] });
  }

  async summarize({ text, maxWords = 120 }) {
    const system = `Summarize the following in your own words, under ${maxWords} words. Do not quote long passages verbatim.`;
    return this._call({ system, messages: [{ role: 'user', content: text }] });
  }
}

function getAIProvider() {
  // Single place to switch providers based on config/env later
  // (e.g. process.env.AI_PROVIDER === 'openai' -> new OpenAIProvider(...)).
  return new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
  });
}

module.exports = { getAIProvider };
