import pg from 'pg';

const { Pool } = pg;
let pool = null;

function getPgPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
    });
  }
  return pool;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const designer = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const id = designer.id || designer.phone || designer.email || 'DES-' + Date.now();
    const name = designer.name || 'Designer';
    const phone = designer.phone || '';
    const email = designer.email || '';
    const identifier = designer.identifier || email || phone;
    const password = designer.password || designer.pin || '7861';
    const portfolio = designer.portfolio || '';
    const skills = designer.skills || 'Graphic Design';
    const status = designer.status || 'Pending';
    const role = designer.role || 'designer';
    const avatar = designer.avatar || designer.avatarUrl || '';

    const dbPool = getPgPool();
    const sqlQuery = `
      INSERT INTO designers (id, name, phone, email, identifier, password, pin, portfolio, skills, status, role, avatar, avatar_url, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        status = EXCLUDED.status,
        portfolio = EXCLUDED.portfolio,
        skills = EXCLUDED.skills;
    `;
    await dbPool.query(sqlQuery, [
      id, name, phone, email, identifier, password, password,
      portfolio, skills, status, role, avatar, avatar, new Date().toLocaleDateString('en-IN')
    ]);

    return res.status(200).json({ success: true, message: 'Designer registered in Cloud SQL PostgreSQL successfully' });
  } catch (err) {
    console.error('[register-designer error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}
