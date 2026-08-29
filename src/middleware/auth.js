const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cinewrite_prod_jwt_secret_9f8e7d6c5b4a';

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };

    // Ensure user exists in DB (auto-provision if DB was reset, e.g. pg-mem restart)
    try {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [payload.sub]);
      if (userCheck.rows.length === 0) {
        const userName = payload.email ? payload.email.split('@')[0] : 'User';
        const userEmail = payload.email || `${payload.sub}@local.dev`;
        await pool.query(
          'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
          [payload.sub, userName, userEmail, 'auto_provisioned']
        );
      }
    } catch (dbErr) {
      console.warn('Auto-provisioning user check warning:', dbErr.message);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };

