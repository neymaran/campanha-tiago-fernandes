import { Readable } from 'node:stream';

// Proxy para baixar anexos do Firebase Storage pelo próprio domínio (evita bloqueio de CORS no navegador).
export default async function handler(req, res) {
  const { url } = req.query;
  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).send('URL inválida');
  }
  if (target.protocol !== 'https:' || target.hostname !== 'firebasestorage.googleapis.com') {
    return res.status(400).send('Host não permitido');
  }
  const upstream = await fetch(target);
  if (!upstream.ok || !upstream.body) {
    return res.status(upstream.status || 502).send('Falha ao baixar o arquivo');
  }
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, no-store');
  Readable.fromWeb(upstream.body).pipe(res);
}
