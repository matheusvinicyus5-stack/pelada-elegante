import type { Player } from './football';
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
