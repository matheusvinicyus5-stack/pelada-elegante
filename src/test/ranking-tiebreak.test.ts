import { describe, it, expect } from "vitest";
import { compareRanking } from "@/lib/player-changes";
const p = (id: number, points: number, attendance: number, rank?: number) => ({ id, name: "x", position: "MC", points, goals: 0, assists: 0, yellow: 0, red: 0, blue: 0, attendance, previous: rank ? { rank, points, goals: 0, assists: 0, yellow: 0, red: 0, blue: 0, attendance } : undefined });
describe("desempate", () => {
  it("maior frequência fica na frente", () => expect([p(1, 10, 60), p(2, 10, 80)].sort(compareRanking)[0]?.id).toBe(2));
  it("mesma frequência: quem já estava na frente", () => expect([p(1, 10, 80, 5), p(2, 10, 80, 3)].sort(compareRanking)[0]?.id).toBe(2));
});
