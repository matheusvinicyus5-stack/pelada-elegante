import { createHmac, timingSafeEqual } from 'node:crypto';

// Fallback de autorização da Direção para ambientes que bloqueiam o cookie da
// sessão (ex.: preview em iframe): token HMAC assinado com SESSION_SECRET e
// vinculado à versão da sessão, então trocar a senha revoga tokens antigos.
function sign(version: number, secret: string) {
  return createHmac('sha256', secret).update(`fairplay-direction:${version}`).digest('hex');
}

export function makeDirectionToken(version: number) {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error('Acesso temporariamente indisponível');
  return `${version}.${sign(version, secret)}`;
}

export function checkDirectionToken(token: string | undefined, version: number) {
  const secret = process.env['SESSION_SECRET'];
  if (!secret || !token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const tokenVersion = Number(token.slice(0, dot));
  if (!Number.isInteger(tokenVersion) || tokenVersion !== version) return false;
  const expected = sign(version, secret);
  const received = token.slice(dot + 1);
  return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
