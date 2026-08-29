const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

let token;
let projectId;

// Runs against the real test database (see test/setupEnv.js) — these are
// integration tests, not mocks, matching spec section 52's requirement to
// test authentication, project/scene creation, beat calculations, and
// structure generation for real.

beforeAll(async () => {
  await pool.query("DELETE FROM users WHERE email LIKE '%@example.com'");
});

afterAll(async () => {
  await pool.end();
});

describe('Auth', () => {
  const email = `test_${Date.now()}@example.com`;

  test('rejects registration with a short password', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'T', email, password: 'short' });
    expect(res.status).toBe(400);
  });

  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'Test User', email, password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('rejects duplicate email registration', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'Dup', email, password: 'password123' });
    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

describe('Projects', () => {
  test('requires auth', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(401);
  });

  test('creates a project and auto-computes target_pages from runtime', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Movie', genre: 'Thriller', target_runtime_minutes: 90 });
    expect(res.status).toBe(201);
    expect(res.body.target_pages).toBe(90);
    projectId = res.body.id;
  });

  test('a second user cannot access the first users project (isolation)', async () => {
    const email2 = `test2_${Date.now()}@example.com`;
    const reg = await request(app).post('/auth/register').send({ name: 'Other', email: email2, password: 'password123' });
    const otherToken = reg.body.token;

    const res = await request(app).get(`/projects/${projectId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Structure Engine', () => {
  test('lists available frameworks', async () => {
    const res = await request(app).get('/frameworks');
    expect(res.status).toBe(200);
    expect(res.body.map((f) => f.key)).toEqual(expect.arrayContaining(['three-act', 'save-the-cat']));
  });

  test('generates a combined beat sheet with correct page targets', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ frameworkKeys: ['three-act', 'save-the-cat'] });
    expect(res.status).toBe(201);
    const allBeats = res.body.acts.flatMap((a) => a.beats);
    const catalyst = allBeats.find((b) => b.name === 'Catalyst');
    // 12% of 90-page target = 10.8, rounded to 11
    expect(Number(catalyst.target_page)).toBe(11);
  });

  test('refuses to regenerate structure over existing one', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/structure/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ frameworkKeys: ['three-act'] });
    expect(res.status).toBe(409);
  });
});

describe('Scenes and pacing deviation', () => {
  let actId;
  let beatId;

  beforeAll(async () => {
    const structure = await request(app).get(`/projects/${projectId}/structure`).set('Authorization', `Bearer ${token}`);
    actId = structure.body[0].id;
    beatId = structure.body[0].beats.find((b) => b.name === 'Catalyst').id;
  });

  test('creating a scene against a beat auto-updates the beats actual_page', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/scenes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ act_id: actId, beat_id: beatId, heading: 'INT. TEST - DAY', page_count: 17 });
    expect(res.status).toBe(201);

    const pacing = await request(app).get(`/projects/${projectId}/pacing`).set('Authorization', `Bearer ${token}`);
    const catalyst = pacing.body.beats.find((b) => b.name === 'Catalyst');
    expect(Number(catalyst.actual_page)).toBe(17);
    // target was 11, actual 17 -> deviation +6, matches spec's own worked example shape
    expect(catalyst.status).toBe('potentially_delayed');
  });
});

describe('Setup/Payoff engine', () => {
  test('creates a setup and updates its status on payoff confirmation', async () => {
    const create = await request(app)
      .post(`/projects/${projectId}/setups`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Gun shown in act 1', expected_payoff: 'Gun used in act 3' });
    expect(create.status).toBe(201);
    expect(create.body.status).toBe('unresolved');

    const update = await request(app)
      .put(`/projects/${projectId}/setups/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'resolved' });
    expect(update.status).toBe(200);
    expect(update.body.status).toBe('resolved');
  });

  test('rejects an invalid status value', async () => {
    const create = await request(app)
      .post(`/projects/${projectId}/setups`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Test setup' });

    const update = await request(app)
      .put(`/projects/${projectId}/setups/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'not_a_real_status' });
    expect(update.status).toBe(400);
  });
});

describe('Version control', () => {
  test('snapshots and compares two versions', async () => {
    const v1 = await request(app).post(`/projects/${projectId}/versions`).set('Authorization', `Bearer ${token}`).send({ label: 'Draft 1' });
    expect(v1.status).toBe(201);

    await request(app)
      .post(`/projects/${projectId}/scenes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ act_id: (await request(app).get(`/projects/${projectId}/structure`).set('Authorization', `Bearer ${token}`)).body[0].id, heading: 'INT. NEW SCENE - DAY' });

    const v2 = await request(app).post(`/projects/${projectId}/versions`).set('Authorization', `Bearer ${token}`).send({ label: 'Draft 2' });

    const compare = await request(app)
      .get(`/projects/${projectId}/versions/compare?from=${v1.body.id}&to=${v2.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(compare.status).toBe(200);
    expect(compare.body.added.length).toBe(1);
  });
});
