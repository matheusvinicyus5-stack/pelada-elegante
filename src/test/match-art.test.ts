import { describe, expect, it } from "vitest";
import { matchArtGoals } from "@/lib/match-art";
import type { Match, Player } from "@/lib/football";

describe("Match artwork goals", () => {
  const players = [{ id: 1, name: "JP" }, { id: 2, name: "Vinícius" }] as Player[];
  it("groups repeated goals without losing their assist or team", () => {
    const match: Match = { id: 1, date: "10 de outubro de 2026", short: "10 OUT", scoreA: 3, scoreB: 1, teamA: [1], teamB: [2], goals: [
      { scorerId: 1, assistId: 2, team: "A" }, { scorerId: 1, assistId: 2, team: "A" },
      { scorerId: 1, team: "A" }, { scorerId: 2, team: "B" },
    ] };
    expect(matchArtGoals(match, players, "A")).toEqual([
      { scorer: "JP", assist: "Vinícius", count: 2 }, { scorer: "JP", assist: undefined, count: 1 },
    ]);
    expect(matchArtGoals(match, players, "B")).toEqual([{ scorer: "Vinícius", assist: undefined, count: 1 }]);
  });
  it("does not invent events for an empty match", () => {
    expect(matchArtGoals({ id: 1, date: "", short: "", scoreA: 0, scoreB: 0, teamA: [], teamB: [] }, players, "A")).toEqual([]);
  });
});