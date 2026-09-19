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

  try {
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=*&order=createdAt.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (sbRes.ok) {
      const jobs = await sbRes.json();
      return res.status(200).json(Array.isArray(jobs) ? jobs : []);
    }

    return res.status(200).json([]);
  } catch (err) {
    console.error('[get-jobs error]:', err);
    return res.status(200).json([]);
  }
}
