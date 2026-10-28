import { describe, it, expect } from "vitest";
import { withPreviousSnapshots, rankOf } from "@/lib/player-changes";
import type { Player } from "@/lib/football";
const p = (id: number, points: number, goals = 0): Player => ({ id, name: `P${id}`, position: "MC", points, goals, assists: 0, yellow: 0, red: 0, blue: 0, attendance: 100 });
describe("player changes", () => {
  it("records previous goals and rank when stats change", () => {
    const old = [p(1, 90), p(2, 80, 25)];
    const next = withPreviousSnapshots(old, [p(1, 90), p(2, 95, 29)]);
    expect(next[1]!.previous).toMatchObject({ goals: 25, points: 80, rank: 2 });
    expect(rankOf(next, 2)).toBe(1);
  });
  it("keeps the old snapshot when nothing changed", () => {
    const old = [{ ...p(1, 90), previous: { rank: 3, points: 80, goals: 0, assists: 0, yellow: 0, red: 0, blue: 0, attendance: 100 } }];
    expect(withPreviousSnapshots(old, [p(1, 90)])[0]!.previous?.rank).toBe(3);
  });
});
