import { z } from "zod";
import { attendanceValue, isSaturday } from "./attendance";
const count = z.number().int().min(0).max(100000);
export const playerSchema = z
  .object({
    id: count,
    number: count.optional(),
    name: z.string().trim().min(1).max(100),
    position: z.enum(["MC", "AT", "G", "ZG", "DF", "LAT"]),
    points: count,
    goals: count,
    assists: count,
    yellow: count,
    red: count,
    blue: count,
    attendance: z.number().min(0).max(100),
    attendanceBase: z.number().min(0).max(100).optional(),
    attendanceRecords: z
      .array(
        z.object({
          date: z.string().refine(isSaturday, "Escolha um sábado válido"),
          status: z.enum(["present", "absent"]),
        }),
      )
      .max(2000)
      .optional(),
    photo: z
      .string()
      .max(2000000)
      .refine(
        (s) =>
          !s ||
          s.startsWith("/__l5e/assets-v1/") ||
          /^https:\/\//.test(s) ||
          /^data:image\/(png|jpeg|webp);base64,/.test(s),
        "Foto inválida",
      )
      .optional(),
  })
  .superRefine((player, ctx) => {
    const records = player.attendanceRecords ?? [];
    if (new Set(records.map((r) => r.date)).size !== records.length)
      ctx.addIssue({ code: "custom", message: "Sábado repetido" });
    if (
      player.attendanceRecords !== undefined &&
      (player.attendanceBase === undefined || attendanceValue(player.attendanceBase, records) !== player.attendance)
    )
      ctx.addIssue({ code: "custom", message: "Frequência não corresponde às presenças" });
  });
export const matchSchema = z.object({
  id: count,
  date: z.string().trim().min(1).max(100),
  short: z.string().trim().min(1).max(20),
  scoreA: count,
  scoreB: count,
  teamA: z.array(count),
  teamB: z.array(count),
  captainA: count.optional(),
  captainB: count.optional(),
  goals: z
    .array(
      z.object({
        scorerId: count,
        assistId: count.optional(),
        ownGoal: z.boolean().optional(),
        team: z.enum(["A", "B"]),
      }),
    )
    .default([]),
  cards: z
    .array(
      z.object({
        playerId: count,
        team: z.enum(["A", "B"]),
        card: z.enum(["yellow", "red", "blue"]),
      }),
    )
    .default([]),
  example: z.boolean().optional(),
});
export const footballSchema = z
  .object({ players: z.array(playerSchema).max(500), matches: z.array(matchSchema).max(1000) })
  .superRefine((data, ctx) => {
    const ids = new Set(data.players.map((p) => p.id));
    if (ids.size !== data.players.length || new Set(data.matches.map((m) => m.id)).size !== data.matches.length)
      ctx.addIssue({ code: "custom", message: "Identificadores repetidos" });
    for (const m of data.matches) {
      const all = [...m.teamA, ...m.teamB];
      if (new Set(all).size !== all.length || all.some((id) => !ids.has(id)))
        ctx.addIssue({ code: "custom", message: "Escalação inválida" });
      if ((m.captainA !== undefined && !m.teamA.includes(m.captainA)) || (m.captainB !== undefined && !m.teamB.includes(m.captainB)))
        ctx.addIssue({ code: "custom", message: "Capitão fora da escalação" });
    }
  });
export type FootballData = z.infer<typeof footballSchema>;
