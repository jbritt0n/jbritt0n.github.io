// functions/api/contact.js
// Cloudflare Pages Function — handles contact form POST requests
// Sends email via Resend (resend.com)
//
// Deploy this file at: functions/api/contact.js
// It will be available at: https://jonathanbrittonart.com/api/contact

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── CORS preflight (not usually needed for same-origin, but just in case)
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://jonathanbrittonart.com',
    'Content-Type': 'application/json',
  };

  // ── Parse form data
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid request body.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { name, email, subject, message } = body;

  // ── Basic validation
  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Name, email, and message are required.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Simple email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Please enter a valid email address.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ── Subject label map (matches the <select> values in contact.html)
  const subjectLabels = {
    inquiry:    'Inquiry about a work',
    commission: 'Commission',
    gallery:    'Gallery / exhibition',
    other:      'Other',
  };
  const subjectLabel = subjectLabels[subject] || subject || 'Contact form';

  // ── Build the email HTML
  const emailHtml = `
    <div style="font-family: Georgia, serif; max-width: 600px; color: #2e2c28; line-height: 1.7;">
      <p style="font-size: 13px; color: #8a8078; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2rem;">
        New message via jonathanbrittonart.com
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #8a8078; width: 100px;">From</td>
          <td style="padding: 8px 0;"><strong>${escHtml(name)}</strong> &lt;${escHtml(email)}&gt;</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8a8078;">Subject</td>
          <td style="padding: 8px 0;">${escHtml(subjectLabel)}</td>
        </tr>
      </table>

      <hr style="border: none; border-top: 1px solid #e8e0d4; margin: 1.5rem 0;">

      <div style="font-size: 16px; white-space: pre-wrap;">${escHtml(message)}</div>

      <hr style="border: none; border-top: 1px solid #e8e0d4; margin: 2rem 0;">

      <p style="font-size: 12px; color: #c4bcb0;">
        Reply directly to this email to respond to ${escHtml(name)}.
      </p>
    </div>
  `;

  // ── Send via Resend
  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // FROM must be a verified domain on your Resend account
        from: 'Jonathan Britton Art <hello@jonathanbrittonart.com>',
        // TO: your inbox (email forwarding will pass this to Gmail)
        to: ['hello@jonathanbrittonart.com'],
        // REPLY-TO: the person who filled in the form
        reply_to: `${name} <${email}>`,
        subject: `[jonathanbrittonart.com] ${subjectLabel} — ${name}`,
        html: emailHtml,
        // Plain text fallback
        text: `New message from ${name} <${email}>\nSubject: ${subjectLabel}\n\n${message}`,
      }),
    });
  } catch (err) {
    console.error('Resend fetch error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Could not reach email service. Please try again.' }),
      { status: 502, headers: corsHeaders }
    );
  }

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error('Resend error response:', resendRes.status, errBody);
    return new Response(
      JSON.stringify({ ok: false, error: 'Failed to send email. Please try again.' }),
      { status: 500, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: corsHeaders }
  );
}

// Handle preflight OPTIONS request
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://jonathanbrittonart.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Escape HTML to prevent injection in the email body
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
