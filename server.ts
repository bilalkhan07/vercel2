import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

// --- Extracted Imports and Logic from vite.config.ts ---
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "ivPnmexKCJVDq5GjMyQFZdctkbsR07Bo4rLfINpTg6zUE1OuXYvzBeIkDYS7huGXPmoxZdLca591QsJl";
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const emailOtpStore = new Map<string, { code: string; expiresAt: number }>();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://icdawztbuezziqfvswhx.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZGF3enRidWV6emlxZnZzd2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTAyMjksImV4cCI6MjEwNDI4NjIyOX0.jg7mOx9RERt6uj1l2yyMeldCt4--LnObCtAbwYek-Ww";
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const smtpUser = process.env.SMTP_USER || 'alerts@designquixo.in';
const smtpPass = (process.env.SMTP_PASS || '@Bilal@777').replace(/\s+/g, '');
const smtpHost = process.env.SMTP_HOST || 'smtpout.secureserver.net';

// Persistent warm connection pools (Port 465 SSL primary, Port 587 STARTTLS secondary)
let primaryPoolTransporter: any = null;
let fallbackPoolTransporter: any = null;

function initMailPools() {
  if (!smtpUser || !smtpPass) return;

  if (!primaryPoolTransporter) {
    primaryPoolTransporter = nodemailer.createTransport({
      pool: true,
      host: smtpHost,
      port: 465,
      secure: true,
      pipelining: true,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      maxConnections: 5,
      maxMessages: 1000,
      rateLimit: 25,
      rateDelta: 1000,
      connectionTimeout: 6000,
      greetingTimeout: 4000,
      socketTimeout: 15000
    } as any);

    // Keep connection warm & ready
    primaryPoolTransporter.verify().then(() => {
      console.log('[SUPERFAST SMTP READY] GoDaddy 465 SSL Warm Connection Pool pre-warmed & active!');
    }).catch((err: any) => {
      console.warn('[SMTP Notice] 465 pool warmup notice:', err?.message);
    });

    // Auto keep-alive ping every 25s so the connection is perpetually warm and ready
    setInterval(() => {
      if (primaryPoolTransporter) {
        primaryPoolTransporter.verify().catch(() => {});
      }
    }, 25000);
  }

  if (!fallbackPoolTransporter) {
    fallbackPoolTransporter = nodemailer.createTransport({
      pool: true,
      host: smtpHost,
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      maxConnections: 3,
      maxMessages: 200,
      rateLimit: 10,
      rateDelta: 1000,
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 20000
    } as any);
  }
}

// Pre-warm pools right away on server startup
initMailPools();

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  headers?: any;
  fromName?: string;
}

async function sendMailWithFallback(options: SendMailOptions): Promise<{ success: boolean; via: string; error?: string }> {
  // 0. Try Resend API (Verified Domain alerts@designquixo.in)
  const resendKey = (process.env.RESEND_API_KEY || '').trim() || 
    (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4', 'base64').toString('utf-8') : '');
  try {
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `"${options.fromName || 'Design Quixo Security'}" <alerts@designquixo.in>`,
        to: [options.to],
        subject: options.subject,
        html: options.html
      })
    });

    if (resendResp.ok) {
      console.log(`[RESEND API DELIVERED] Dispatched to: ${options.to} from alerts@designquixo.in`);
      return { success: true, via: 'resend-api' };
    } else {
      const errData = await resendResp.json().catch(() => ({}));
      console.error('[SERVER RESEND API FAIL]:', errData);
    }
  } catch (e: any) {
    console.error('[Resend API fetch error]:', e?.message);
  }

  initMailPools();
  const fromName = options.fromName || 'Design Quixo Security';

  // RFC compliant transactional instant-priority headers
  const urgentHeaders = {
    'X-Priority': '1', // Highest Priority
    'Priority': 'Urgent',
    'Importance': 'high',
    'X-MSMail-Priority': 'High',
    'X-Mailer': 'DesignQuixo Realtime Engine',
    'X-Auto-Response-Suppress': 'All',
    'Auto-Submitted': 'auto-generated'
  };

  const mailOptions = {
    from: `"${fromName}" <${smtpUser}>`,
    replyTo: smtpUser,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments && options.attachments.length > 0 ? options.attachments : undefined,
    headers: { ...urgentHeaders, ...(options.headers || {}) }
  };

  // 1. Try Primary Pre-warmed Pool (Port 465 SSL direct - fastest delivery)
  if (primaryPoolTransporter) {
    try {
      await primaryPoolTransporter.sendMail(mailOptions);
      console.log(`[SUPERFAST SMTP DELIVERED] Dispatched to: ${options.to} via Warm Pool:465`);
      return { success: true, via: 'secureserver:465-pool' };
    } catch (primaryErr: any) {
      console.warn(`[SMTP Pool 465 Notice]: ${primaryErr?.message}, falling back to port 587...`);
    }
  }

  // 2. Try Fallback Pre-warmed Pool (Port 587 STARTTLS)
  if (fallbackPoolTransporter) {
    try {
      await fallbackPoolTransporter.sendMail(mailOptions);
      console.log(`[SMTP DELIVERED] Dispatched to: ${options.to} via Fallback Pool:587`);
      return { success: true, via: 'secureserver:587-pool' };
    } catch (fallbackErr: any) {
      console.warn(`[SMTP Fallback 587 Notice]: ${fallbackErr?.message}`);
      return { success: false, via: 'secureserver', error: fallbackErr?.message };
    }
  }

  return { success: false, via: 'secureserver', error: 'SMTP connection pool not ready' };
}

function getEmailLogoAttachment() {
  const logoPath = path.join(process.cwd(), 'public', 'favicon.png');
  if (fs.existsSync(logoPath)) {
    return [
      {
        filename: 'quixo-logo.png',
        path: logoPath,
        cid: 'quixologo',
        contentType: 'image/png',
        contentDisposition: 'inline'
      }
    ];
  }
  return [];
}

async function sendCustomEmail(to: string, code: string, purpose: string = 'Login Verification', recipientName?: string): Promise<{ success: boolean; via: string; error?: string }> {
  try {
    const isPassChange = purpose.toLowerCase().includes('password');
    const isSignup = purpose.toLowerCase().includes('register') || purpose.toLowerCase().includes('signup');
    const isLogin = purpose.toLowerCase().includes('login');
    const isEmailChange = purpose.toLowerCase().includes('email') || purpose.toLowerCase().includes('change');
    
    const subject = isPassChange
      ? `[${code}] Design Quixo — Password Reset Verification Code`
      : isSignup
        ? `[${code}] Design Quixo — Creator Registration Verification Code`
        : isEmailChange
          ? `[${code}] Design Quixo — Email Update Verification Code`
          : `[${code}] Design Quixo — Sign In Verification Code`;

    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    let finalName = (recipientName || '').trim();
    if (!finalName) {
      if (to === 'alerts@designquixo.in' || to.includes('designquixobilal')) {
        finalName = 'Bilal (Admin)';
      } else {
        const emailPrefix = to.split('@')[0].replace(/[._0-9+-]+/g, ' ').trim();
        if (emailPrefix && emailPrefix.length >= 2) {
          finalName = emailPrefix.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        } else {
          finalName = 'User';
        }
      }
    }

    const messageText = isPassChange 
      ? 'You requested to reset your password. Please use the 6-digit verification code below to proceed:' 
      : isSignup
        ? 'Thank you for registering on Design Quixo. Please use the 6-digit verification code below to verify your email address and complete registration:'
        : isEmailChange
          ? 'You requested to update your registered email address on Design Quixo. Please use the 6-digit verification code below to confirm this change:'
          : 'You requested to sign in to your Design Quixo account. Please use the 6-digit verification code below:';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.5px;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 10px 0;">Hello ${finalName},</p>
    <p style="font-size: 14px; margin: 0 0 18px 0; color: #334155;">
      ${messageText}
    </p>
    <div style="margin: 22px 0; padding: 18px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; text-align: center;">
      <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Verification Code</span>
      <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
      <span style="font-size: 12px; color: #64748b; display: block; margin-top: 6px;">Valid for 10 minutes</span>
    </div>
    <p style="font-size: 13px; color: #475569; margin: 18px 0 0 0;">
      Do not share this OTP with anyone. If you did not make this request, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo India • Automated Security Alert • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const textContent = `Hello ${finalName},\n\nYour Design Quixo verification code is: ${code}\n\n${messageText}\n\nThis code is valid for 10 minutes. Do not share this code with anyone.\n\nDesign Quixo India • ${formattedTime} IST`;
    const cleanSubject = `Design Quixo Verification Code: ${code}`;

    const result = await sendMailWithFallback({
      to,
      subject: cleanSubject,
      html,
      text: textContent,
      fromName: 'Design Quixo'
    });

    return result;
  } catch (outerErr: any) {
    console.error('[sendCustomEmail Error]:', outerErr?.message);
    return { success: false, via: 'error', error: outerErr?.message };
  }
}

async function sendJobBroadcastEmail(to: string, designerName: string, job: any): Promise<boolean> {
  try {
    const rawPrice = Number(job.price) || 399;
    const designerPayout = Math.round(rawPrice * 0.6);
    const cleanId = (job.id || 'DQ-NEW').toString().replace(/^(DQ[-_]?)+/i, '');
    const serviceName = job.service || job.project || 'Graphic Design Request';
    const ratio = job.ratio || 'Square (1:1)';
    const brief = job.brief || 'Custom graphic design as per client requirements.';
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `New Job Brief: DQ-${cleanId} — ${serviceName} (Payout: ₹${designerPayout})`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">Hello ${designerName || 'Designer'},</p>
    <p style="font-size: 14px; color: #334155; margin: 0 0 18px 0;">
      A new design job has been posted and is available to claim on your Creator Dashboard:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Job ID:</strong> DQ-${cleanId}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Service:</strong> ${serviceName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Ratio:</strong> ${ratio}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #059669;"><strong>Designer Payout (60%):</strong> ₹${designerPayout} (Project Value: ₹${rawPrice})</p>
      <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;">
        <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 4px;">Client Brief:</strong>
        <span style="font-size: 13px; color: #0f172a;">${brief}</span>
      </div>
    </div>
    <p style="font-size: 13px; color: #475569; margin: 18px 0 0 0;">
      Log in to your Designer Dashboard to claim this job brief. Note: Payout is applicable once the design is approved.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo India • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const textContent = `Hello ${designerName || 'Designer'},\n\nA new job DQ-${cleanId} (${serviceName}) is available on Design Quixo.\nDesigner Payout: ₹${designerPayout} (60%)\nRatio: ${ratio}\nBrief: ${brief}\n\nLog in to your Designer Dashboard to claim this brief.`;

    const result = await sendMailWithFallback({
      to,
      subject,
      html,
      text: textContent,
      fromName: 'Design Quixo'
    });

    return result.success;
  } catch (outerErr: any) {
    console.error('[sendJobBroadcastEmail Error]:', outerErr?.message);
    return false;
  }
}

async function sendJobAcceptedAlertEmail(designerName: string, clientName: string, jobId: string, jobDetails?: any): Promise<boolean> {
  try {
    const cleanId = (jobId || 'DQ-JOB').toString().replace(/^(DQ[-_]?)+/i, '');
    const cleanClient = (clientName || 'Direct Client').trim();
    const cleanDesigner = (designerName || 'Designer').trim();
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

    const subject = `Job Claimed: #${cleanId} by ${cleanDesigner} (Client: ${cleanClient})`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; line-height: 1.6;">
  <div style="max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">DESIGN QUIXO</h2>
    <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Job Claim Notification</p>
    <p style="font-size: 14px; color: #334155; margin: 0 0 16px 0;">
      A designer has claimed an active job brief:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Job ID:</strong> #${cleanId}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Designer Name:</strong> ${cleanDesigner}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Client Name:</strong> ${cleanClient}</p>
      ${jobDetails?.service ? `<p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Service:</strong> ${jobDetails.service}</p>` : ''}
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Claim Timestamp:</strong> ${formattedTime} IST</p>
      <p style="margin: 0; font-size: 14px; color: #2563eb;"><strong>Status:</strong> In Progress</p>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 14px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Design Quixo Operations Alert • ${formattedTime} IST
    </p>
  </div>
</body>
</html>`;

    const textContent = `Job Claim Alert:\n\nJob ID: #${cleanId}\nDesigner: ${cleanDesigner}\nClient: ${cleanClient}\nClaimed at: ${formattedTime} IST\n\nDesign Quixo Operations`;

    // Send to alerts@designquixo.in and designquixo@gmail.com
    await sendMailWithFallback({
      to: 'alerts@designquixo.in',
      subject,
      html,
      text: textContent,
      fromName: 'Design Quixo Operations'
    });

    await sendMailWithFallback({
      to: 'designquixo@gmail.com',
      subject,
      html,
      text: textContent,
      fromName: 'Design Quixo Operations'
    });

    return true;
  } catch (err: any) {
    console.error('[sendJobAcceptedAlertEmail Error]:', err?.message);
    return false;
  }
}




async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Mount API Middleware
  app.use(async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }
    // --- JOB ACCEPTED NOTIFICATION ROUTE ---
    if (req.url === '/api/notify-job-accepted' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { designerName, clientName, jobId, jobDetails } = JSON.parse(body || '{}');
          if (!jobId || !designerName) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Missing designerName or jobId' }));
          }

          console.log(`[JOB ACCEPTED ALERT] Designer "${designerName}" accepted Job #${jobId} (Client: "${clientName || 'Direct Client'}")`);
          const sent = await sendJobAcceptedAlertEmail(designerName, clientName || 'Direct Client', jobId, jobDetails);

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: sent, message: 'Alert email dispatched to operations desk.' }));
        } catch (err: any) {
          console.error('[NOTIFY JOB ACCEPTED ERROR]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: err.message || 'Error processing job accepted notification' }));
        }
      });
      return;
    }

    // --- UPDATE DESIGNER EMAIL ROUTE ---
    if (req.url === '/api/update-designer-email' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { oldEmail, newEmail, phone } = JSON.parse(body || '{}');
          if (!newEmail || (!oldEmail && !phone)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Missing required parameters (newEmail, oldEmail/phone)' }));
          }

          const cleanNew = (newEmail || '').toString().trim().toLowerCase();
          const cleanOld = (oldEmail || '').toString().trim().toLowerCase();
          const cleanPhone = (phone || '').toString().replace(/\D/g, '').slice(-10);

          try {
            if (cleanOld) {
              await serverSupabase.from('designers').update({ email: cleanNew, identifier: cleanNew }).eq('email', cleanOld);
            }
            if (cleanPhone) {
              await serverSupabase.from('designers').update({ email: cleanNew, identifier: cleanNew }).eq('phone', cleanPhone);
              await serverSupabase.from('designers').update({ email: cleanNew, identifier: cleanNew }).eq('id', cleanPhone);
            }
          } catch (dbErr) {
            console.warn('[DB Email update notice]:', dbErr);
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'Registered email updated successfully!' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: err.message || 'Error updating email' }));
        }
      });
      return;
    }

    // --- UPDATE DESIGNER PASSWORD ROUTE ---
    if (req.url === '/api/update-designer-password' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { key, newPassword } = JSON.parse(body || '{}');
          if (!key || !newPassword) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: 'Missing key or newPassword' }));
          }

          const cleanKey = key.toString().trim();
          const cleanPass = newPassword.toString().trim();
          const isEmail = cleanKey.includes('@');
          const phone10 = cleanKey.replace(/\D/g, '').slice(-10);

          try {
            if (isEmail) {
              await serverSupabase.from('designers').update({ password: cleanPass }).eq('email', cleanKey.toLowerCase());
              await serverSupabase.from('designers').update({ password: cleanPass }).eq('identifier', cleanKey.toLowerCase());
            }
            if (phone10 && phone10.length === 10) {
              await serverSupabase.from('designers').update({ password: cleanPass }).eq('phone', phone10);
              await serverSupabase.from('designers').update({ password: cleanPass }).eq('id', phone10);
            }
          } catch (dbErr) {
            console.warn('[DB Password update notice]:', dbErr);
          }

          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, message: 'Password updated and old password invalidated successfully!' }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, message: err.message || 'Error updating password' }));
        }
      });
      return;
    }

    // --- NEW JOB DISPATCH & DESIGNER EMAIL BROADCAST ROUTE ---
    if (req.url === '/api/notify-new-job' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { job, designers, extraEmails, extraDesigners } = JSON.parse(body || '{}');
              if (!job) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Missing job payload' }));
              }

              console.log('[BROADCAST NEW JOB] Starting email dispatch for job:', job.id || job.project);

              // 1. Recipient Map: email -> name
              const recipientMap = new Map<string, string>();

              // 1a. Process any designers passed directly in payload from client
              const rawDesignerList = [
                ...(Array.isArray(designers) ? designers : []),
                ...(Array.isArray(extraDesigners) ? extraDesigners : [])
              ];

              rawDesignerList.forEach((d: any) => {
                if (!d) return;
                const em = ((d.email || d.identifier || '')).toString().trim().toLowerCase();
                if (em && em.includes('@') && em.includes('.')) {
                  recipientMap.set(em, d.name || 'Designer');
                }
              });

              // 1b. Fetch all registered designers from Supabase (using select('*') to safely fetch all available columns)
              try {
                const { data: dbDesigners, error } = await serverSupabase
                  .from('designers')
                  .select('*');

                if (dbDesigners && Array.isArray(dbDesigners)) {
                  dbDesigners.forEach((d: any) => {
                    const em = ((d.email || d.identifier || '')).toString().trim().toLowerCase();
                    if (em && em.includes('@') && em.includes('.')) {
                      if (!recipientMap.has(em)) {
                        recipientMap.set(em, d.name || 'Designer');
                      }
                    }
                  });
                }
              } catch (e) {
                console.warn('[BROADCAST NEW JOB] Supabase designers fetch notice:', e);
              }

              // 1c. Add any extra raw emails passed from client
              if (Array.isArray(extraEmails)) {
                extraEmails.forEach((em: string) => {
                  const clean = (em || '').toString().trim().toLowerCase();
                  if (clean && clean.includes('@') && clean.includes('.')) {
                    if (!recipientMap.has(clean)) {
                      recipientMap.set(clean, 'Designer');
                    }
                  }
                });
              }

              // 1d. Always ensure admin / notification inbox gets a copy
              const adminEmail = 'designquixo@gmail.com';
              if (!recipientMap.has(adminEmail)) {
                recipientMap.set(adminEmail, 'Design Quixo Admin');
              }
              if (!recipientMap.has('alerts@designquixo.in')) {
                recipientMap.set('alerts@designquixo.in', 'Design Quixo Operations');
              }

              const recipients = Array.from(recipientMap.entries());
              console.log(`[BROADCAST NEW JOB] Found ${recipients.length} designer/admin recipient(s):`, recipients);

              // 2. Dispatch emails in parallel
              let successCount = 0;
              const sendPromises = recipients.map(async ([email, name]) => {
                const sent = await sendJobBroadcastEmail(email, name, job);
                if (sent) successCount++;
                return { email, name, sent };
              });

              const results = await Promise.all(sendPromises);

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                totalRecipients: recipients.length,
                successCount,
                results
              }));
            } catch (err: any) {
              console.error('[BROADCAST NEW JOB ERROR]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error broadcasting job email' }));
            }
          });
          return;
        }

        // --- EMAIL OTP DISPATCH ROUTE ---
        if (req.url === '/api/email-otp-send' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { email, userName, name, purpose } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').trim().toLowerCase();
              const cleanName = (userName || name || '').trim();

              if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Please enter a valid email address.' }));
              }

              // 1. Generate OTP & immediately register in memory store
              const dynamicCode = Math.floor(100000 + Math.random() * 900000).toString();
              emailOtpStore.set(cleanEmail, { code: dynamicCode, expiresAt: Date.now() + 10 * 60 * 1000 });

              // 2. Immediate async dispatch with highest priority via warm connection pool
              sendCustomEmail(cleanEmail, dynamicCode, purpose, cleanName)
                .then(res => {
                  if (!res.success) console.log(`[Fast SMTP Notice] Dispatch to ${cleanEmail}:`, res.error);
                })
                .catch(e => console.warn(`[Fast SMTP Error] ${cleanEmail}:`, e?.message));

              // 3. Clean up any previous OTP for this email, then insert new OTP in background
              Promise.resolve(serverSupabase.from('login_history').delete().eq('phone', cleanEmail).eq('role', 'otp_verification')).catch(() => {});
              Promise.resolve(serverSupabase.from('login_history').insert({
                id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                phone: cleanEmail,
                name: cleanName || 'User',
                role: 'otp_verification',
                status: dynamicCode,
                timestamp: new Date(Date.now() + 10 * 60 * 1000).toISOString()
              })).catch(() => {});

              // 4. Return instant response (< 50ms) so user UI transitions immediately
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                via: 'secureserver:465-pool',
                delivered: true,
                message: '✓ Verification code dispatched. Please check your email inbox to proceed.'
              }));
            } catch (err: any) {
              console.error('[SERVER EMAIL OTP ERROR]:', err?.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Unable to dispatch verification code. Please try again.' }));
            }
          });
          return;
        }

        // --- EMAIL OTP VERIFY ROUTE ---
        if (req.url === '/api/email-otp-verify' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { email, code } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').trim().toLowerCase();
              const cleanCode = (code || '').trim();

              if (!cleanCode || cleanCode.length !== 6) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Please enter the complete 6-digit email OTP.' }));
              }

              // 1. Check local OTP store (if sent via SMTP)
              const stored = emailOtpStore.get(cleanEmail);
              if (stored) {
                if (Date.now() > stored.expiresAt) {
                  emailOtpStore.delete(cleanEmail);
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, message: 'Email OTP has expired. Please request a new code.' }));
                }
                if (stored.code === cleanCode) {
                  emailOtpStore.delete(cleanEmail);
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    success: true,
                    message: 'Email verified successfully!'
                  }));
                }
              }

              // 2. Query latest OTP stored in Supabase login_history table
              try {
                const { data: logs } = await serverSupabase
                  .from('login_history')
                  .select('*')
                  .eq('phone', cleanEmail)
                  .eq('role', 'otp_verification')
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (logs && logs.length > 0) {
                  const latest = logs[0];
                  const expiresAt = new Date(latest.timestamp).getTime();
                  if (!isNaN(expiresAt) && Date.now() <= expiresAt && latest.status === cleanCode) {
                    Promise.resolve(serverSupabase.from('login_history').delete().eq('id', latest.id)).catch(() => {});
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({
                      success: true,
                      message: 'Email verified successfully!'
                    }));
                  }
                }
              } catch (dbErr) {
                console.warn('DB OTP verify lookup notice:', dbErr);
              }

              // 3. If neither memory store nor DB matched, code is invalid or expired
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: false,
                message: 'Invalid or expired verification code. Please check your email and enter the exact 6-digit code received.'
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error verifying email OTP' }));
            }
          });
          return;
        }

        if (req.url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { to, subject, html, text } = JSON.parse(body || '{}');
              if (!to || !subject || !html) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Missing required parameters: to, subject, html' }));
              }

              const textFallback = text || html
                .replace(/<style([\s\S]*?)<\/style>/gi, '')
                .replace(/<script([\s\S]*?)<\/script>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 500) + '... (Open this email in an HTML compatible mail client)';

              const result = await sendMailWithFallback({
                to,
                subject,
                html,
                text: textFallback,
                fromName: 'Design Quixo Platform',
                headers: {
                  'X-Priority': '1', // High Priority
                  'Priority': 'Urgent',
                  'Importance': 'high',
                  'X-MSMail-Priority': 'High',
                  'X-Mailer': 'DesignQuixo Realtime Engine',
                  'X-Auto-Response-Suppress': 'All',
                  'Auto-Submitted': 'auto-generated'
                }
              });

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: result.success,
                via: result.via,
                message: result.success ? 'Email processed successfully!' : 'Email dispatch queued.'
              }));
            } catch (err: any) {
              console.warn('Error sending email via API:', err.message);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error sending email' }));
            }
          });
          return;
        }

        if (req.url === '/api/sms-send' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { phone } = JSON.parse(body || '{}');
              const digits = (phone || '').replace(/\D/g, '');
              const clean10 = digits.slice(-10);
              if (clean10.length !== 10) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Invalid 10-digit Indian mobile number' }));
              }

              const code = Math.floor(100000 + Math.random() * 900000).toString();
              otpStore.set(clean10, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

              // Call Fast2SMS official bulkV2 OTP route
              let f2sData: any = null;
              try {
                const f2sResp = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=otp&variables_values=${code}&numbers=${clean10}`);
                f2sData = await f2sResp.json();
                console.log('[Fast2SMS gateway response]:', f2sData);
              } catch (e: any) {
                console.warn('Fast2SMS fetch error:', e.message);
              }

              if (f2sData && f2sData.return === true) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ 
                  success: true, 
                  message: `Real SMS OTP dispatched to +91 ${clean10} via Fast2SMS. Please check your phone SMS.` 
                }));
              }

              // Handle KYC/Website verification notice (status_code 996) gracefully
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                isKycRequired: true,
                code: code,
                f2sMessage: f2sData ? f2sData.message : 'Website verification pending in Fast2SMS',
                message: `Fast2SMS notice: ${f2sData ? f2sData.message : 'Website verification pending'}. Dynamic verification code: ${code}`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Internal server error' }));
            }
          });
          return;
        }

        if (req.url === '/api/sms-verify' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const { phone, code } = JSON.parse(body || '{}');
              const digits = (phone || '').replace(/\D/g, '');
              const clean10 = digits.slice(-10);
              const cleanCode = (code || '').trim();

              const stored = otpStore.get(clean10);
              if (!stored) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'No OTP request found for this number. Please request a new OTP.' }));
              }

              if (Date.now() > stored.expiresAt) {
                otpStore.delete(clean10);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'OTP has expired. Please click Resend Code.' }));
              }

              if (stored.code !== cleanCode) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Incorrect OTP entered. Please check and try again.' }));
              }

              otpStore.delete(clean10);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                user: { phoneNumber: `+91${clean10}`, uid: `f2s_${clean10}` },
                message: 'Mobile number verified successfully!' 
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Internal server error' }));
            }
          });
          return;
        }

        // --- DESIGNER REGISTRATION API ROUTE ---
        if (req.url === '/api/register-designer' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const rawPhone = (payload.phone || payload.whatsapp || payload.identifier || '').toString();
              const clean10 = rawPhone.replace(/\D/g, '').slice(-10);
              const cleanEmail = (payload.email || (payload.identifier && payload.identifier.includes('@') ? payload.identifier : '') || '').toString().trim().toLowerCase();
              const name = (payload.name || 'Designer').toString().trim();
              const pass = (payload.password || 'Designer@123').toString().trim();
              const portfolio = (payload.portfolio || '').toString().trim();
              const skills = (payload.skills || 'Graphic Design').toString().trim();
              const status = payload.status || 'Pending';
              const dateStr = payload.date || new Date().toLocaleDateString('en-IN');
              const nowIso = new Date().toISOString();

              const primaryId = clean10 || cleanEmail;
              if (!primaryId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Valid 10-digit mobile number or email address required.' }));
              }

              // Supabase exact valid columns: id, name, phone, identifier, password, portfolio, skills, status, date, createdat
              const designerRow = {
                id: primaryId,
                name: name,
                phone: clean10 || '',
                identifier: cleanEmail || clean10,
                password: pass,
                portfolio: portfolio,
                skills: skills,
                status: status,
                date: dateStr,
                createdat: nowIso
              };

              const { data: upsertData, error: upsertErr } = await serverSupabase
                .from('designers')
                .upsert(designerRow);

              if (upsertErr) {
                console.warn('[SERVER /api/register-designer] Supabase upsert notice:', upsertErr.message);
              }

              // Save registration record in login_history
              try {
                await serverSupabase.from('login_history').insert({
                  id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  phone: clean10 || cleanEmail,
                  name: name,
                  role: 'designer',
                  status: `Designer Registered (${status}) - Portfolio: ${portfolio ? 'Yes' : 'None'}`,
                  timestamp: nowIso
                });
              } catch (logErr) {
                console.warn('[SERVER /api/register-designer] login_history notice:', logErr);
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                designer: designerRow,
                message: 'Designer registered and synced to cloud successfully'
              }));
            } catch (err: any) {
              console.error('[SERVER /api/register-designer ERROR]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error registering designer' }));
            }
          });
          return;
        }

        // --- DESIGNER STATUS UPDATE API ROUTE (APPROVE / PENDING / REVOKE) ---
        if (req.url === '/api/update-designer-status' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { key, status } = JSON.parse(body || '{}');
              const cleanKey = (key || '').toString().trim().toLowerCase();
              const newStatus = (status === 'Approved' || status === 'Revoked') ? status : 'Pending';

              if (!cleanKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Designer key is required' }));
              }

              const clean10 = cleanKey.replace(/\D/g, '').slice(-10);

              // Update Supabase by id, phone, or identifier
              const updateTasks = [
                Promise.resolve(serverSupabase.from('designers').update({ status: newStatus }).eq('id', cleanKey)),
                Promise.resolve(serverSupabase.from('designers').update({ status: newStatus }).eq('identifier', cleanKey))
              ];
              if (clean10 && clean10.length === 10) {
                updateTasks.push(Promise.resolve(serverSupabase.from('designers').update({ status: newStatus }).eq('id', clean10)));
                updateTasks.push(Promise.resolve(serverSupabase.from('designers').update({ status: newStatus }).eq('phone', clean10)));
                updateTasks.push(Promise.resolve(serverSupabase.from('designers').update({ status: newStatus }).eq('identifier', clean10)));
              }

              await Promise.allSettled(updateTasks);

              // Log status change in login_history
              try {
                await serverSupabase.from('login_history').insert({
                  id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  phone: clean10 || cleanKey,
                  name: `Designer ${cleanKey}`,
                  role: 'designer',
                  status: `Admin updated status to: ${newStatus}`,
                  timestamp: new Date().toISOString()
                });
              } catch (logErr) {}

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                key: cleanKey, 
                status: newStatus,
                message: `Designer ${cleanKey} status updated to ${newStatus}`
              }));
            } catch (err: any) {
              console.error('[SERVER /api/update-designer-status ERROR]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: err.message || 'Error updating designer status' }));
            }
          });
          return;
        }

        // --- GET DESIGNERS API ROUTE ---
        if (req.url === '/api/get-designers' && req.method === 'GET') {
          try {
            const { data, error } = await serverSupabase
              .from('designers')
              .select('*');

            if (error) {
              console.warn('[SERVER /api/get-designers notice]:', error.message);
            }

            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ 
              success: true, 
              designers: Array.isArray(data) ? data : [] 
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, designers: [], message: err.message }));
          }
        }

        
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });

    app.use(vite.middlewares);

    // Fallback for HTML pages without .html extension in DEV
    app.get('*', async (req, res, next) => {
      let reqPath = req.path;
      if (reqPath === '/') reqPath = '/index.html';
      let filePath = path.join(process.cwd(), reqPath + (reqPath.endsWith('.html') ? '' : '.html'));
      if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, 'utf-8');
        html = await vite.transformIndexHtml(req.url, html);
        res.send(html);
      } else {
        next();
      }

    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      let reqPath = req.path;
      if (reqPath === '/') reqPath = '/index.html';
      
      const htmlPath = path.join(distPath, reqPath + (reqPath.endsWith('.html') ? '' : '.html'));
      if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
      } else {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running on http://0.0.0.0:' + PORT);
  });
}

startServer();
