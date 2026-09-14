export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { job, extraEmails } = body;

    if (!job) {
      return new Response(JSON.stringify({ error: "Missing job payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanId = (job.id || 'DQ-NEW').toString().replace(/^(DQ[-_]?)+/i, '');
    const serviceName = job.service || job.project || 'Graphic Design Request';
    const clientName = job.clientName || job.name || 'Direct Client';
    const clientPhone = job.whatsapp || job.phone || 'N/A';
    const rawPrice = Number(job.price) || 399;
    const designerPayout = Math.round(rawPrice * 0.60);
    const ratio = job.ratio || 'Square (1:1)';
    const brief = job.brief || job.description || 'Custom design requirement';
    const formattedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const RESEND_KEY = (context.env && context.env.RESEND_API_KEY) || 
      (typeof atob !== 'undefined' ? atob('cmVfNVFRaU1uZTdfOGsyYmNLQkhxcEtYb1hnOEJReHBmRTd4') : '');

    // Admin email
    const adminHtml = `<h2>New Design Brief Submitted</h2><p>Job #${cleanId} - ${serviceName}</p><p>Client: ${clientName} (+91 ${clientPhone})</p><p>Price: ₹${rawPrice} (Payout: ₹${designerPayout})</p><p>Brief: ${brief}</p>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Design Quixo Operations <alerts@designquixo.in>",
        to: ["designquixo@gmail.com", "alerts@designquixo.in"],
        subject: `New Design Brief: #${cleanId} — ${serviceName} (Client: ${clientName})`,
        html: adminHtml,
        text: `New Design Brief #${cleanId} for ${serviceName}. Client: ${clientName} (+91 ${clientPhone}). Details: ${brief}`
      }),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Alerts dispatched" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
