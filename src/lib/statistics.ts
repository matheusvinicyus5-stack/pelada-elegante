import type { Match, Player } from './football';
import { rankOf } from './player-changes';
export function normalizeSearch(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR'); }
export function rankingMovement(players: Player[], player: Player) {
  if (!player.previous?.rank) return null;
  const delta = player.previous.rank - rankOf(players, player.id);
  if (!delta) return null;
  return { delta, label: `${delta > 0 ? 'Subiu' : 'Caiu'} ${Math.abs(delta)} ${Math.abs(delta) === 1 ? 'posição' : 'posições'}` };
}
export const profileChangeKeys = ['points', 'goals', 'assists', 'yellow', 'red', 'blue'] as const;
function cell(value: string | number) {
  const text = String(value);
  // Neutralize spreadsheet formulas without changing displayed names.
  return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`;
}
export function statisticsCsv(visible: Player[], all: Player[]) {
 const header = ['Ranking', 'Jogador', 'Posição em campo', 'Pontos', 'Gols', 'Assistências', 'Cartões amarelos', 'Cartões vermelhos', 'Cartões azuis', 'Frequência (%)'];
 return '\uFEFF' + [header, ...visible.map(p => [rankOf(all,p.id),p.name,p.position,p.points,p.goals,p.assists,p.yellow,p.red,p.blue,p.attendance])].map(row => row.map(cell).join(';')).join('\r\n');
}

export type FormResult = 'V' | 'E' | 'D' | 'N';
/** Last 5 registered matches (oldest → newest); matches are stored newest first. */
export function recentForm(matches: Match[], playerId: number) {
  return matches.slice(0, 5).reverse().map(m => {
    const team = m.teamA.includes(playerId) ? 'A' : m.teamB.includes(playerId) ? 'B' : null;
    const result: FormResult = !team ? 'N' : m.scoreA === m.scoreB ? 'E' : (m.scoreA > m.scoreB) === (team === 'A') ? 'V' : 'D';
    return { match: m, result };
  });
}

export type QuickEvent = { playerId: number; kind: 'goals' | 'assists' | 'yellow' | 'red' | 'blue' };
/** Adds round points to the selected players and one unit per event, for winners and losers alike. */
export function applyQuickRound(players: Player[], points: number, scorers: number[], events: QuickEvent[]) {
  const ids = new Set(scorers);
  return players.map(p => {
    const next = { ...p, points: p.points + (ids.has(p.id) ? points : 0) };
    for (const e of events) if (e.playerId === p.id) next[e.kind] += 1;
    return next;
  });
}
