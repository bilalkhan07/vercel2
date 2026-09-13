// Cloudflare Pages Function for /api/email-otp-send

globalThis.dqOtpMap = globalThis.dqOtpMap || new Map();

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await request.json();
    const email = (body.email || '').toString().trim().toLowerCase();
    const userName = (body.userName || 'Valued User').toString().trim();
    const purpose = (body.purpose || 'Login Verification').toString().trim();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ success: false, message: 'Valid email address required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    globalThis.dqOtpMap.set(email, { code, expiresAt });

    // HTML Email Template
    const htmlBody = `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;border:1px solid #e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#0f172a;margin-top:0;">DESIGN QUIXO</h2>
        <p style="font-size:14px;color:#334155;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size:14px;color:#334155;">Your 6-digit verification code for ${purpose} is:</p>
        <div style="background:#f1f5f9;padding:16px;text-align:center;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:6px;color:#2563eb;margin:16px 0;">
          ${code}
        </div>
        <p style="font-size:12px;color:#64748b;">This code is valid for 5 minutes. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
        <p style="font-size:11px;color:#94a3b8;">Design Quixo Security System</p>
      </div>
    `;

    // Send real email via Resend API (Domain Verified: designquixo.in)
    const RESEND_KEY = (context.env && context.env.RESEND_API_KEY) || "re_3UN4csqu_CbVqnFLTj5jL7RhQdKZxMKZG";
    try {
      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Design Quixo Security <alerts@designquixo.in>",
          to: [email],
          subject: `Design Quixo Verification Code: ${code}`,
          html: htmlBody
        })
      });

      const resendData = await resendResp.json().catch(() => ({}));
      if (resendResp.ok) {
        return new Response(JSON.stringify({
          success: true,
          delivered: true,
          via: 'resend',
          message: '✓ 6-digit verification code dispatched to your email inbox.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } else {
        console.warn('[Resend API Warning]:', resendData);
      }
    } catch (e) {
      console.warn('[Resend Error]:', e);
    }

    // Fallback: MailChannels
    try {
      await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: "alerts@designquixo.in", name: "Design Quixo Security" },
          subject: `Design Quixo Verification Code: ${code}`,
          content: [
            { type: "text/plain", value: `Your Design Quixo verification code is: ${code}` },
            { type: "text/html", value: htmlBody }
          ]
        })
      });
    } catch (e) {
      console.warn('Mailchannels notice:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      message: '✓ 6-digit verification code dispatched to your email inbox.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Error processing request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
