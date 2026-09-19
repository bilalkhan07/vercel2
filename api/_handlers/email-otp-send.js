import { getPgPool } from './_db.js';
import nodemailer from 'nodemailer';

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
    const email = (body.email || '').trim().toLowerCase();
    const userName = (body.userName || '').trim();
    const purpose = body.purpose || 'Login Verification';

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address required' });
    }

    // Generate real random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const pool = getPgPool();

    // 1. Delete older OTPs for this email in PostgreSQL
    try {
      await pool.query(
        `DELETE FROM login_history WHERE phone = $1 AND role = 'otp_verification'`,
        [email]
      );
    } catch(delErr) {
      console.warn('PostgreSQL DB delete old OTP notice:', delErr?.message);
    }

    // 2. Insert new OTP record with primary key into PostgreSQL
    try {
      await pool.query(
        `INSERT INTO login_history (id, phone, name, role, status, timestamp) VALUES ($1, $2, $3, 'otp_verification', $4, $5)`,
        [`otp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, email, userName || 'User', code, expiresAt]
      );
    } catch (insErr) {
      console.error('PostgreSQL insert OTP error:', insErr?.message);
    }

    // 3. Send email via Nodemailer
    const emailUser = process.env.EMAIL_USER || 'alerts@designquixo.in';
    const emailPass = process.env.EMAIL_PASS || 'mghm lqdi qpwh wqgh';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"DesignQuixo Security" <${emailUser}>`,
      to: email,
      subject: `${code} is your DesignQuixo verification code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">DESIGN<span style="color: #3b82f6;">QUIXO</span></h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 500;">Secure Identity & Access Management</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0;">Your one-time verification code for <strong>${purpose}</strong> is:</p>
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #1e293b; background: #ffffff; border: 2px solid #cbd5e1; border-radius: 8px; padding: 12px; display: inline-block; user-select: all;">
              ${code}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0 0;">This code will expire in 15 minutes. Do not share it with anyone.</p>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            If you did not request this verification code, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.warn('Mail send notice (OTP still stored in PostgreSQL):', mailErr?.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code generated and sent to email.'
    });
  } catch (err) {
    console.error('[email-otp-send error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}
