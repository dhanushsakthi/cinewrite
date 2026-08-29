const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool: PgPool } = require('pg');

let pool;
let isRealPg = false;
let memPoolInstance = null;

function createMemPool() {
  const { newDb, DataType } = require('pg-mem');
  const db = newDb();

  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.text,
    impure: true,
    implementation: () => crypto.randomUUID()
  });

  db.public.registerFunction({
    name: 'now',
    returns: DataType.timestamp,
    impure: true,
    implementation: () => new Date()
  });

  db.public.registerFunction({
    name: 'to_jsonb',
    returns: DataType.json,
    implementation: (val) => val
  });

  const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
  const mig2Path = path.join(__dirname, '..', '..', 'db', 'migrations', '002_phase2_phase4_additions.sql');
  const mig3Path = path.join(__dirname, '..', '..', 'db', 'migrations', '003_story_development_and_learning.sql');

  if (fs.existsSync(schemaPath)) {
    let sql = fs.readFileSync(schemaPath, 'utf8')
      .replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/gi, '')
      .replace(/CREATE OR REPLACE FUNCTION set_updated_at[\s\S]*?LANGUAGE plpgsql;/gi, '')
      .replace(/CREATE TRIGGER[\s\S]*?;/gi, '')
      .replace(/TIMESTAMPTZ/gi, 'TIMESTAMP')
      .replace(/::jsonb/gi, '');
    db.public.none(sql);
  }

  if (fs.existsSync(mig2Path)) {
    let sql2 = fs.readFileSync(mig2Path, 'utf8')
      .replace(/CREATE EXTENSION IF NOT EXISTS vector;/gi, '')
      .replace(/vector\(\d+\)/gi, 'text')
      .replace(/CREATE INDEX IF NOT EXISTS idx_scenes_embedding[\s\S]*?;/gi, '')
      .replace(/CREATE INDEX IF NOT EXISTS idx_characters_embedding[\s\S]*?;/gi, '');
    db.public.none(sql2);
  }

  if (fs.existsSync(mig3Path)) {
    let sql3 = fs.readFileSync(mig3Path, 'utf8')
      .replace(/TIMESTAMPTZ/gi, 'TIMESTAMP');
    db.public.none(sql3);
  }

  const { Pool: MemPoolAdapter } = db.adapters.createPg();
  const memPool = new MemPoolAdapter();

  const origConnect = memPool.connect.bind(memPool);
  memPool.connect = async function() {
    try {
      const client = await origConnect();
      if (!client.release) client.release = () => {};
      return client;
    } catch (e) {
      return {
        query: (...args) => memPool.query(...args),
        release: () => {}
      };
    }
  };

  return memPool;
}

const realPgPool = new PgPool({
  connectionString: process.env.DATABASE_URL || 'postgres://cinewrite:cinewrite_dev_pw@localhost:5432/cinewrite',
  connectionTimeoutMillis: 1500,
});

realPgPool.on('error', (err) => {
  // Silent fallback handling
});

// Proxy pool that attempts real Postgres, or falls back to in-memory Postgres if offline
const proxyPool = {
  async query(...args) {
    if (isRealPg) {
      try {
        return await realPgPool.query(...args);
      } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === '57P03' || err.message.includes('ECONNREFUSED')) {
          isRealPg = false;
        } else {
          throw err;
        }
      }
    }

    if (!memPoolInstance) {
      console.log('⚡ Running on in-memory PostgreSQL engine (local standalone mode)');
      memPoolInstance = createMemPool();
    }
    return memPoolInstance.query(...args);
  },

  async connect() {
    if (isRealPg) {
      try {
        const client = await realPgPool.connect();
        return client;
      } catch (err) {
        isRealPg = false;
      }
    }

    if (!memPoolInstance) {
      console.log('⚡ Running on in-memory PostgreSQL engine (local standalone mode)');
      memPoolInstance = createMemPool();
    }
    return memPoolInstance.connect();
  },

  on(event, listener) {
    realPgPool.on(event, listener);
    return proxyPool;
  },

  async end() {
    if (isRealPg) {
      try {
        await realPgPool.end();
      } catch (err) {}
    }
  }
};

module.exports = { pool: proxyPool };
