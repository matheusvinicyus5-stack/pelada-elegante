import type { Player } from "./football";

export type StatKey = "points" | "goals" | "assists" | "yellow" | "red" | "blue" | "attendance";
export const statKeys: StatKey[] = ["points", "goals", "assists", "yellow", "red", "blue", "attendance"];
export type PlayerSnapshot = Record<StatKey, number> & { rank: number };

/** Posição no ranking geral (ordenado por pontos, maior primeiro). */
/** Desempate: pontos → frequência → quem já estava na frente antes. */
export function compareRanking(a: Player, b: Player): number {
  return b.points - a.points || b.attendance - a.attendance || (a.previous?.rank ?? 9999) - (b.previous?.rank ?? 9999);
}
export function rankOf(players: Player[], id: number): number {
  const sorted = [...players].sort(compareRanking);
  return sorted.findIndex((p) => p.id === id) + 1;
}

/** Guarda em `previous` os números anteriores de cada atleta cujas estatísticas mudaram. */
export function withPreviousSnapshots(oldPlayers: Player[], newPlayers: Player[]): Player[] {
  return newPlayers.map((p) => {
    const old = oldPlayers.find((o) => o.id === p.id);
    if (!old) return p;
    if (!statKeys.some((k) => old[k] !== p[k])) return { ...p, previous: old.previous };
    const snap = { rank: rankOf(oldPlayers, p.id) } as PlayerSnapshot;
    for (const k of statKeys) snap[k] = old[k];
    return { ...p, previous: snap };
  });
}

/** Ids dos líderes atuais: pontos (coroa), gols (chama) e assistências (cartola). */
export function leaderIds(players: Player[]) {
  const top = (k: "goals" | "assists") => [...players].sort((a, b) => b[k] - a[k] || compareRanking(a, b))[0]?.id;
  return { points: [...players].sort(compareRanking)[0]?.id, goals: top("goals"), assists: top("assists") };
}
