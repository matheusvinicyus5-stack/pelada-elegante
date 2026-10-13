import playerData from "./players.json";
import type { AttendanceRecord } from "./attendance";
export type Player = {
  id: number;
  number?: number | undefined;
  name: string;
  position: string;
  points: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  blue: number;
  attendance: number;
  attendanceBase?: number | undefined;
  attendanceRecords?: AttendanceRecord[] | undefined;
  photo?: string | undefined;
};
export const players: Player[] = playerData;
export const positionNames: Record<string, string> = {
  MC: "Meio-campo",
  AT: "Atacante",
  G: "Goleiro",
  ZG: "Zagueiro",
  DF: "Defensor",
  LAT: "Lateral",
};
export type MatchGoal = {
  scorerId: number;
  assistId?: number | undefined;
  team: "A" | "B";
};

export type MatchCard = {
  playerId: number;
  team: "A" | "B";
  card: "yellow" | "red" | "blue";
};

export type Match = {
  id: number;
  date: string;
  short: string;
  scoreA: number;
  scoreB: number;
  teamA: number[];
  teamB: number[];
  captainA?: number | undefined;
  captainB?: number | undefined;
  goals?: MatchGoal[];
  cards?: MatchCard[];
  example?: boolean | undefined;
};
export const initialMatches: Match[] = [
  {
    id: 1,
    date: "03 de outubro de 2026",
    short: "03 OUT",
    scoreA: 5,
    scoreB: 3,
    teamA: [102, 101, 104, 113],
    teamB: [109, 100, 103, 105],
  },
  {
    id: 2,
    date: "26 de setembro de 2026",
    short: "26 SET",
    scoreA: 2,
    scoreB: 4,
    teamA: [102, 100, 103, 104],
    teamB: [109, 101, 105, 113],
  },
  {
    id: 3,
    date: "19 de setembro de 2026",
    short: "19 SET",
    scoreA: 3,
    scoreB: 3,
    teamA: [109, 103, 104, 113],
    teamB: [102, 100, 101, 105],
  },
];
