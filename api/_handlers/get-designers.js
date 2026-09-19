import { getPgPool } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = getPgPool();
    const sqlRes = await pool.query('SELECT * FROM designers ORDER BY created_at DESC');
    const designers = sqlRes.rows || [];

    const knownCore = [
      {
        id: 'uzefbilal786@gmail.com',
        name: 'Uzef Bilal',
        phone: '8602420897',
        email: 'uzefbilal786@gmail.com',
        identifier: 'uzefbilal786@gmail.com',
        password: '7861',
        pin: '7861',
        portfolio: 'https://www.behance.net/bilalkhan829',
        skills: 'Graphic Design, Photoshop, Illustrator',
        status: 'Approved',
        role: 'designer'
      },
      {
        id: '8982325391',
        name: 'Chunouti Agrawal',
        phone: '8982325391',
        email: 'chunouti09@gmail.com',
        identifier: 'chunouti09@gmail.com',
        password: '7861',
        pin: '7861',
        portfolio: 'https://www.behance.net/gallery/248388645/Portfolio',
        skills: 'Photoshop, Illustrator',
        status: 'Approved',
        role: 'designer'
      },
      {
        id: '9893861325',
        name: 'Uzef Khan',
        phone: '9893861325',
        email: 'hr.tasksource.khushboo@gmail.com',
        identifier: 'hr.tasksource.khushboo@gmail.com',
        password: '7861',
        pin: '7861',
        portfolio: 'https://www.behance.net/bilalkhan829',
        skills: 'Illustrator, Vector Art',
        status: 'Approved',
        role: 'designer'
      }
    ];

    knownCore.forEach(core => {
      const exists = designers.some(d =>
        (d.email && d.email.toLowerCase() === core.email.toLowerCase()) ||
        (d.id && d.id.toString() === core.id)
      );
      if (!exists) designers.push(core);
    });

    return res.status(200).json({ success: true, designers });
  } catch (err) {
    console.error('[get-designers PostgreSQL error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error fetching designers' });
  }
}
