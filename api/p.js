// Vercel serverless proxy: browser -> /api/p -> workers.dev (server-side, like curl)
const BASE = 'https://nt-silenthours.egomale82.workers.dev/api/';
const ALLOWED = ['batches', 'details', 'content', 'folder', 'video', 'pdf'];

export default async function handler(req, res) {
  const { e, ...rest } = req.query;
  if (!ALLOWED.includes(e)) return res.status(400).json({ error: 'bad endpoint' });

  const qs = new URLSearchParams(rest).toString();
  try {
    const r = await fetch(BASE + e + (qs ? '?' + qs : ''), {
      headers: { 'User-Agent': 'curl/8.5.0', 'Accept': '*/*' },
    });
    const body = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    // cache only the static-ish lists; never video/pdf links
    res.setHeader('Cache-Control', ['batches', 'details'].includes(e) ? 's-maxage=60, stale-while-revalidate=300' : 'no-store');
    res.send(body);
  } catch (err) {
    res.status(502).json({ error: 'upstream failed', detail: String(err) });
  }
}
