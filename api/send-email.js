// Vercel Serverless Function: POST /api/send-email
// Ports the Brevo email send from server.mjs with verbose logging.
//
// Required Vercel env var:
//   BREVO_API_KEY   (also accepts VITE_BREVO_API_KEY as a fallback)

export default async function handler(req, res) {
  const rid = `email-${Math.random().toString(36).slice(2, 8)}`;
  const log = (...a) => console.log(`[${rid}]`, ...a);
  const err = (...a) => console.error(`[${rid}]`, ...a);

  log('▶ /api/send-email invoked', { method: req.method });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    log('Raw request body:', JSON.stringify(body));

    const { name, email, companyName, product, termLength, coverageAmount, phone } = body;

    if (!name || !email || !companyName) {
      err('Missing required fields', { name: !!name, email: !!email, companyName: !!companyName });
      return res.status(400).json({ error: 'Bad request', message: 'Missing required fields' });
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
    log('Brevo key present:', !!BREVO_API_KEY);
    if (!BREVO_API_KEY) {
      err('Brevo API key is missing');
      return res.status(500).json({ error: 'Server configuration error', message: 'Email service not configured' });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0a855c;">Quote Request</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Customer Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Customer Phone:</strong> ${phone}</p>` : ''}
          <p><strong>Term Length:</strong> ${termLength} years</p>
          <p><strong>Coverage Amount:</strong> $${coverageAmount}</p>
          <p><strong>Insurance Company:</strong> ${companyName}</p>
          ${product ? `<p><strong>Product:</strong> ${product}</p>` : ''}
        </div>
      </div>`;

    const emailData = {
      sender: { name: 'Lifestein Quote Tool', email: 'mattmims@insurems.com' },
      to: [
        { email: 'mattmims@lifestein.com', name: 'Matt Mims' },
        { email: 'teamtejas7@gmail.com', name: 'Team' },
      ],
      subject: `Quote Request - ${companyName}`,
      htmlContent,
    };
    log('Sending to Brevo:', JSON.stringify({ to: emailData.to, subject: emailData.subject }));

    const started = Date.now();
    const upstream = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify(emailData),
    });
    const rawText = await upstream.text();
    log(`Brevo responded in ${Date.now() - started}ms`, { status: upstream.status, ok: upstream.ok });
    log('Brevo RAW response body:', rawText);

    if (!upstream.ok) {
      err(`Brevo error (${upstream.status})`);
      return res.status(502).json({ error: 'Failed to send email', details: rawText });
    }

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (e) {
    err('Server error:', e?.message, e?.stack);
    return res.status(500).json({ error: 'Failed to send email', message: e?.message || 'Unknown error' });
  }
}
