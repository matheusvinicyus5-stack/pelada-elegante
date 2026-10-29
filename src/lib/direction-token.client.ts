// Token da Direção guardado no navegador como alternativa ao cookie de sessão,
// que alguns previews em iframe bloqueiam. Limpo ao sair do Modo Direção.
const KEY = 'fairplay-direction-token';

export function getDirectionToken() {
  if (typeof window === 'undefined') return undefined;
  return window.sessionStorage.getItem(KEY) ?? undefined;
}

export function setDirectionToken(token: string) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, token);
}

export function clearDirectionToken() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}
