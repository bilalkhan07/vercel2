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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lwcuxohrnrkjyfmszxab.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3V4b2hybnJranlmbXN6eGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTY3ODUsImV4cCI6MjEwNDk5Mjc4NX0.erJAwyIU6qmjyTUf_6cXhYRd2dd9P2IkAJsQWK_SrGo';

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { identifier, password } = body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing identifier or password' });
    }

    const cleanIdent = identifier.toString().trim().toLowerCase();
    const cleanPass = password.toString().trim();
    const cleanPhoneDigits = cleanIdent.replace(/\D/g, '').slice(-10);

    // 1. Check Admin Account
    const isAdmin = (
      cleanIdent === 'admin@designquixobilal' ||
      cleanIdent === 'admin@designquixo.com' ||
      cleanIdent === 'admin' ||
      cleanIdent === 'superadmin' ||
      cleanIdent === 'alerts@designquixo.in' ||
      cleanIdent === 'designquixo@gmail.com' ||
      cleanIdent.replace(/\D/g, '').endsWith('8602420897') ||
      cleanIdent === 'mustafazthings@gmail.com'
    );

    if (isAdmin) {
      if (cleanPass === '@Bilal@786' || cleanPass === 'Bilal#0897' || cleanPass === '@Bilal@777' || cleanPass === '7861') {
        const adminEmail = (cleanIdent.includes('@') && !cleanIdent.includes('designquixobilal')) ? cleanIdent : 'mustafazthings@gmail.com';
        return res.status(200).json({
          success: true,
          user: {
            id: 'admin',
            name: 'Bilal Khan (Admin)',
            email: adminEmail,
            phone: '8602420897',
            role: 'admin',
            status: 'Approved',
            displayLabel: adminEmail
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Incorrect password entered. Access denied.' });
      }
    }

    // 2. Query Cloud SQL PostgreSQL first
    let rows = [];
    try {
      const dbPool = getPgPool();
      const sqlQuery = `
        SELECT * FROM designers 
        WHERE LOWER(email) = $1 
           OR LOWER(identifier) = $2 
           OR LOWER(id) = $3 
           OR (phone IS NOT NULL AND RIGHT(REGEXP_REPLACE(phone, '\\D', '', 'g'), 10) = $4)
        LIMIT 1
      `;
      const sqlRes = await dbPool.query(sqlQuery, [cleanIdent, cleanIdent, cleanIdent, cleanPhoneDigits || 'NONE']);
      if (sqlRes && sqlRes.rows && sqlRes.rows.length > 0) {
        rows = sqlRes.rows;
      }
    } catch (dbErr) {
      console.warn('[verify-login-credentials] Cloud SQL query note:', dbErr?.message);
    }

    // 3. Supabase query fallback if Cloud SQL returned no row
    if (!rows || rows.length === 0) {
      const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` };
      try {
        if (cleanIdent.includes('@')) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/designers?email=eq.${encodeURIComponent(cleanIdent)}&select=*`, { headers });
          if (res.ok) rows = await res.json().catch(() => []);
        }
        if ((!rows || rows.length === 0) && cleanPhoneDigits && cleanPhoneDigits.length === 10) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/designers?phone=eq.${encodeURIComponent(cleanPhoneDigits)}&select=*`, { headers });
          if (res.ok) rows = await res.json().catch(() => []);
        }
        if (!rows || rows.length === 0) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/designers?id=eq.${encodeURIComponent(cleanIdent)}&select=*`, { headers });
          if (res.ok) rows = await res.json().catch(() => []);
        }
      } catch (e) {
        console.warn('[verify-login-credentials] Supabase query note:', e);
      }
    }

    if (Array.isArray(rows) && rows.length > 0) {
      const found = rows[0];
      const dPass = (found.password || found.pin || '').toString().trim();
      if (dPass && (dPass === cleanPass || dPass.toLowerCase() === cleanPass.toLowerCase())) {
        const targetEmail = (found.email || (found.identifier && found.identifier.includes('@') ? found.identifier : '') || (cleanIdent.includes('@') ? cleanIdent : '')).trim().toLowerCase();
        return res.status(200).json({
          success: true,
          user: {
            id: found.id || found.phone || found.email,
            name: found.name || 'Verified Designer',
            email: targetEmail || 'mustafazthings@gmail.com',
            phone: found.phone || found.whatsapp || cleanPhoneDigits || '',
            role: found.role || 'designer',
            status: found.status || 'Approved',
            designerData: found,
            displayLabel: targetEmail || found.phone || 'Designer'
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Incorrect password or unregistered account. Please check your details.' });
  } catch (err) {
    console.error('[verify-login-credentials error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}

