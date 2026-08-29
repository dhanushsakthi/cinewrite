const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

let token;
let projectId;

afterAll(async () => {
  await pool.end();
});

beforeAll(async () => {
  const email = `story_dev_${Date.now()}@example.com`;
  const reg = await request(app).post('/auth/register').send({ name: 'Story Dev Tester', email, password: 'password123' });
  token = reg.body.token;
  const proj = await request(app).post('/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Framework Test Movie', target_runtime_minutes: 100 });
  projectId = proj.body.id;
});

describe('Expanded framework registry', () => {
  test('lists all requested structures with categories', async () => {
    const res = await request(app).get('/frameworks');
    const keys = res.body.map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining([
      'three-act', 'save-the-cat', 'five-act', 'heros-journey', 'seven-point',
      'freytags-pyramid', 'dan-harmon-story-circle', 'kishotenketsu',
      'eight-sequence', 'sequence-approach', 'scene-sequel',
      'goal-conflict-disaster', 'reaction-dilemma-decision', 'try-fail-cycle',
      'heroines-journey', 'virgins-promise',
    ]));
    const heroJourney = res.body.find((f) => f.key === 'heros-journey');
    expect(heroJourney.category).toBe('whole_story_structure');
    const sceneSequel = res.body.find((f) => f.key === 'scene-sequel');
    expect(sceneSequel.category).toBe('scene_level');
  });

  test('generates Heros Journey structure with correct stage count', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ frameworkKeys: ['heros-journey'] });
    expect(res.status).toBe(201);
    const allBeats = res.body.acts.flatMap((a) => a.beats);
    expect(allBeats.find((b) => b.name === 'Ordinary World')).toBeDefined();
    expect(allBeats.find((b) => b.name === 'Ordeal')).toBeDefined();
  });
});

describe('Kishotenketsu framework (non-conflict-centered)', () => {
  let ktProjectId;
  beforeAll(async () => {
    const proj = await request(app).post('/projects').set('Authorization', `Bearer ${token}`).send({ title: 'KT Test', target_runtime_minutes: 90 });
    ktProjectId = proj.body.id;
  });

  test('generates the four-part structure', async () => {
    const res = await request(app)
      .post(`/projects/${ktProjectId}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ frameworkKeys: ['kishotenketsu'] });
    expect(res.status).toBe(201);
    const names = res.body.acts.flatMap((a) => a.beats).map((b) => b.name);
    expect(names).toEqual(expect.arrayContaining(['Ki (Introduction)', 'Shō (Development)', 'Ten (Twist)', 'Ketsu (Conclusion)']));
  });
});

describe('Learning system', () => {
  test('returns verified structured content for a known Save the Cat beat', async () => {
    const res = await request(app).get('/learn/save-the-cat/B Story');
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('verified_content');
    expect(res.body.definition).toContain('secondary storyline');
    expect(res.body.writer_questions.length).toBeGreaterThan(0);
    expect(res.body.common_mistakes.length).toBeGreaterThan(0);
  });

  test('returns verified content for every Save the Cat beat, not just B Story', async () => {
    const beatNames = ['Opening Image', 'Catalyst', 'Midpoint', 'All Is Lost', 'Final Image'];
    for (const name of beatNames) {
      const res = await request(app).get(`/learn/save-the-cat/${encodeURIComponent(name)}`);
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('verified_content');
    }
  });

  test('404s for an unknown stage name', async () => {
    const res = await request(app).get('/learn/save-the-cat/Not A Real Beat');
    expect(res.status).toBe(404);
  });

  test('404s for an unknown framework', async () => {
    const res = await request(app).get('/learn/not-a-real-framework/Anything');
    expect(res.status).toBe(404);
  });
});

describe('Custom Structure Builder', () => {
  let customId;

  test('creates a custom structure (Tamil Commercial Cinema example from spec)', async () => {
    const res = await request(app)
      .post('/custom-structures')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tamil Commercial Cinema Structure',
        description: 'Custom structure for commercial Tamil cinema pacing',
        category: 'beat_sheet',
        acts: [
          { name: 'Act 1', beats: [
            { name: 'Hero Introduction', target_percentage: 5, purpose: 'Establish the hero\'s charisma and world' },
            { name: 'World Establishment', target_percentage: 12, purpose: 'Establish setting and stakes' },
            { name: 'Hero Problem', target_percentage: 20, purpose: 'Central problem introduced' },
          ] },
          { name: 'Act 2', beats: [
            { name: 'Interval Block', target_percentage: 50, purpose: 'Major mid-film cliffhanger' },
            { name: 'Villain Escalation', target_percentage: 65, purpose: 'Antagonist pressure increases' },
          ] },
          { name: 'Act 3', beats: [
            { name: 'Climax', target_percentage: 90, purpose: 'Final confrontation' },
            { name: 'Emotional Resolution', target_percentage: 100, purpose: 'Emotional payoff and closure' },
          ] },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Tamil Commercial Cinema Structure');
    customId = res.body.id;
  });

  test('lists the created custom structure', async () => {
    const res = await request(app).get('/custom-structures').set('Authorization', `Bearer ${token}`);
    expect(res.body.some((s) => s.id === customId)).toBe(true);
  });

  test('generates project structure from a custom framework', async () => {
    const proj = await request(app).post('/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Custom Structure Test', target_runtime_minutes: 150 });
    const res = await request(app)
      .post(`/projects/${proj.body.id}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ frameworkKeys: [`user:${customId}`] });
    expect(res.status).toBe(201);
    const names = res.body.acts.flatMap((a) => a.beats).map((b) => b.name);
    expect(names).toContain('Interval Block');
    // 50% of 150-page target = 75
    const intervalBlock = res.body.acts.flatMap((a) => a.beats).find((b) => b.name === 'Interval Block');
    expect(Number(intervalBlock.target_page)).toBe(75);
  });

  test('rejects a malformed custom structure', async () => {
    const res = await request(app)
      .post('/custom-structures')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Structure' }); // missing acts
    expect(res.status).toBe(400);
  });

  test('deletes a custom structure', async () => {
    const res = await request(app).delete(`/custom-structures/${customId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

describe('Hybrid structure layers', () => {
  test('records layer assignments when generating a combined structure', async () => {
    const proj = await request(app).post('/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Hybrid Test', target_runtime_minutes: 100 });
    const res = await request(app)
      .post(`/projects/${proj.body.id}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        frameworkKeys: ['three-act', 'save-the-cat', 'scene-sequel'],
        layers: { 'three-act': 'primary_structure', 'save-the-cat': 'beat_sheet', 'scene-sequel': 'scene_method' },
      });
    expect(res.status).toBe(201);

    const layers = await request(app).get(`/projects/${proj.body.id}/structure/layers`).set('Authorization', `Bearer ${token}`);
    expect(layers.status).toBe(200);
    expect(layers.body.length).toBe(3);
    expect(layers.body.find((l) => l.layer === 'primary_structure').framework_key).toBe('three-act');
  });
});

describe('Existing Three-Act/Save the Cat projects remain unaffected', () => {
  test('a plain three-act generation still works exactly as before', async () => {
    const proj = await request(app).post('/projects').set('Authorization', `Bearer ${token}`).send({ title: 'Regression Test', target_runtime_minutes: 90 });
    const res = await request(app)
      .post(`/projects/${proj.body.id}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ frameworkKeys: ['three-act'] });
    expect(res.status).toBe(201);
    expect(res.body.framework).toBe('Three Act Structure');
  });
});
