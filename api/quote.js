// Vercel Serverless Function: POST /api/quote
// Ports the CompuLife call from server.mjs and adds verbose logging so the
// raw upstream response is visible in the Vercel "Logs" tab.
//
// Required Vercel env vars (Project Settings → Environment Variables):
//   COMPULIFE_DOMAIN    e.g. compulifeapi.com
//   COMPULIFE_AUTH_ID   your CompuLife authorization id
//   REMOTE_IP           the IP CompuLife has whitelisted for you

export default async function handler(req, res) {
  // tag every log line of this invocation so they're easy to find/group
  const rid = `quote-${Math.random().toString(36).slice(2, 8)}`;
  const log = (...a) => console.log(`[${rid}]`, ...a);
  const err = (...a) => console.error(`[${rid}]`, ...a);

  log('▶ /api/quote invoked', { method: req.method });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel auto-parses JSON bodies, but be defensive in case it's a string.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    log('Raw request body:', JSON.stringify(body));

    const originalPayload = body.COMPULIFE;
    if (!originalPayload) {
      err('Missing COMPULIFE in request body');
      return res.status(400).json({ error: 'Bad request', message: 'Missing COMPULIFE data in request body' });
    }

    // Reformat payload (same field order / defaults as the original server.mjs)
    const formattedPayload = {
      BirthMonth: originalPayload.BirthMonth || '1',
      BirthYear: originalPayload.BirthYear || '1990',
      Birthday: originalPayload.Birthday || '1',
      CompRating: originalPayload.CompRating || '4',
      FaceAmount: originalPayload.FaceAmount || '500000',
      Health: originalPayload.Health || 'PP',
      LANGUAGE: originalPayload.LANGUAGE || 'E',
      ModeUsed: originalPayload.ModeUsed || 'M',
      NewCategory: originalPayload.NewCategory || '5',
      REMOTE_IP: process.env.REMOTE_IP || '122.182.211.105',
      Sex: originalPayload.Sex || 'M',
      Smoker: originalPayload.Smoker || 'N',
      SortOverride1: 'M',
      State: originalPayload.State || '5',
      UserLocation: 'json',
      NitocinePouch: originalPayload.NitocinePouch === 'Y',
    };
    log('Formatted CompuLife payload:', JSON.stringify(formattedPayload));

    const COMPULIFE_DOMAIN = process.env.COMPULIFE_DOMAIN || 'compulifeapi.com';
    const COMPULIFE_AUTH_ID = process.env.COMPULIFE_AUTH_ID || '760903F14';
    const REMOTE_IP = process.env.REMOTE_IP || '74.113.157.69';
    log('Env check:', {
      COMPULIFE_DOMAIN,
      COMPULIFE_AUTH_ID_present: !!process.env.COMPULIFE_AUTH_ID,
      REMOTE_IP,
    });

    const compulifeParamValue = encodeURIComponent(JSON.stringify(formattedPayload));
    const apiUrl = `https://${COMPULIFE_DOMAIN}/api/request/?COMPULIFEAUTHORIZATIONID=${COMPULIFE_AUTH_ID}&REMOTE_IP=${REMOTE_IP}&COMPULIFE=${compulifeParamValue}`;
    log('Outgoing CompuLife URL:', apiUrl);

    const started = Date.now();
    const upstream = await fetch(apiUrl, { method: 'GET', headers: { Accept: 'application/json' } });
    log(`CompuLife responded in ${Date.now() - started}ms`, {
      status: upstream.status,
      ok: upstream.ok,
      contentType: upstream.headers.get('content-type'),
    });

    // Always read the body as text first so we can log it even when it isn't JSON.
    const rawText = await upstream.text();
    log('CompuLife RAW response body:', rawText);

    if (!upstream.ok) {
      err(`CompuLife API error (${upstream.status})`);
      return res.status(upstream.status).json({
        error: 'Failed to get quote from CompuLife',
        details: rawText,
        status: upstream.status,
      });
    }

    let data;
    try {
      data = JSON.parse(rawText);
      log('Parsed CompuLife JSON keys:', Object.keys(data || {}));
    } catch (parseErr) {
      err('CompuLife response was not valid JSON:', parseErr.message);
      return res.status(502).json({
        error: 'Upstream returned non-JSON',
        details: rawText,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    err('Server error:', e?.message, e?.stack);
    return res.status(500).json({ error: 'Internal server error', message: e?.message || 'Unknown error' });
  }
}
