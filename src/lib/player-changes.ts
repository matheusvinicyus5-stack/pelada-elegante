import type { Player } from "./football";

export type StatKey = "points" | "goals" | "assists" | "yellow" | "red" | "blue" | "attendance";
export const statKeys: StatKey[] = ["points", "goals", "assists", "yellow", "red", "blue", "attendance"];
export type PlayerSnapshot = Record<StatKey, number> & { rank: number };

/** Posição no ranking geral (ordenado por pontos, maior primeiro). */
export function rankOf(players: Player[], id: number): number {
  const sorted = [...players].sort((a, b) => b.points - a.points);
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
