const MAX_FIELD_LENGTH = 4000;

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanField(value) {
  return String(value || '').trim().slice(0, MAX_FIELD_LENGTH);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>';

  if (!apiKey || !toEmail) {
    return json(res, 500, { error: 'Contact delivery is not configured.' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Invalid request body.' });
  }

  const name = cleanField(body.name);
  const email = cleanField(body.email);
  const message = cleanField(body.message);

  if (!name || !email || !message) {
    return json(res, 400, { error: 'Name, email, and message are required.' });
  }

  if (!isEmail(email)) {
    return json(res, 400, { error: 'Enter a valid email address.' });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const submittedAt = new Date().toISOString();

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'portfolio-contact-form/1.0',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: [email],
      subject: `[Portfolio Contact] ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Submitted: ${submittedAt}`,
        '',
        message,
      ].join('\n'),
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#101014">
          <h2 style="margin:0 0 16px">Portfolio inquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
          <p style="margin:0">${safeMessage}</p>
        </div>
      `,
      tags: [{ name: 'source', value: 'portfolio_contact' }],
    }),
  });

  let payload = null;
  try {
    payload = await resendResponse.json();
  } catch {
    payload = null;
  }

  if (!resendResponse.ok) {
    return json(res, resendResponse.status, {
      error: payload?.message || payload?.error || 'Email delivery failed.',
    });
  }

  return json(res, 200, { ok: true, id: payload?.id || null });
}
