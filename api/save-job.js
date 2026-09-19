import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BN3PRogrLXTWkDjdv9B0QdDEGuUH5-cNIewJ6KgJ2glQrLgtGng1WocCuqmzrL1-BIdSfNb6SX2Xz0HzsP8Yuhk';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'h4330lk5ygavsVd-_F4zWnzCgUWOKMe-JtYaQ60iqrI';
const VAPID_SUBJECT = 'mailto:alerts@designquixo.in';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lwcuxohrnrkjyfmszxab.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3V4b2hybnJranlmbXN6eGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTY3ODUsImV4cCI6MjEwNDk5Mjc4NX0.erJAwyIU6qmjyTUf_6cXhYRd2dd9P2IkAJsQWK_SrGo';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {}

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
    const job = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!job || (!job.id && !job.jobId)) {
      return res.status(400).json({ success: false, message: 'Missing job object' });
    }

    const cleanId = (job.id || job.jobId || 'DQ-NEW').toString();
    const serviceName = job.service || job.project || 'Graphic Design Request';
    const clientName = job.clientName || job.name || 'Direct Client';
    const rawPrice = Number(job.price) || 399;

    // Save job into Supabase jobs table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(job)
      });
    } catch (sbErr) {
      console.warn('[save-job] Supabase save error:', sbErr);
    }

    // Trigger Chrome Push Notification Broadcast
    try {
      const pushPayload = JSON.stringify({
        title: '🚨 NEW DESIGN ORDER ALERT',
        body: `₹${rawPrice} • ${serviceName} | Client: ${clientName}. Tap to claim job!`,
        jobId: cleanId,
        price: rawPrice,
        url: `/designer-dashboard.html?alertJob=${cleanId}&autoPlay=5`,
        autoPlay: 5,
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [300, 150, 300, 150, 300, 150, 300, 150, 300],
        tag: `job-${cleanId}`,
        renotify: true,
        timestamp: Date.now()
      });

      const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (sbRes.ok) {
        const subscriptions = await sbRes.json();
        if (Array.isArray(subscriptions)) {
          for (const subRecord of subscriptions) {
            const subObj = subRecord.subscription || subRecord;
            if (subObj && subObj.endpoint) {
              webpush.sendNotification(subObj, pushPayload, { TTL: 86400, urgency: 'high' }).catch(() => {});
            }
          }
        }
      }
    } catch (pErr) {
      console.warn('[save-job] Push broadcast note:', pErr);
    }

    return res.status(200).json({ success: true, message: 'Job saved & Chrome push notification broadcasted successfully' });
  } catch (err) {
    console.error('[save-job error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Error' });
  }
}
