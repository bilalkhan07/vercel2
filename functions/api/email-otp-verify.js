// Cloudflare Pages Function for /api/email-otp-verify

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
    const code = (body.code || '').toString().trim();

    // OTP matching strictly against real dispatched code
    const stored = globalThis.dqOtpMap.get(email);
    if (stored && stored.code === code) {
      if (Date.now() > stored.expiresAt) {
        return new Response(JSON.stringify({ success: false, message: 'OTP has expired. Please click Resend Code.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      globalThis.dqOtpMap.delete(email);
      return new Response(JSON.stringify({ success: true, message: 'Email verified successfully!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: false, message: 'Incorrect OTP entered. Please check your email inbox.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
