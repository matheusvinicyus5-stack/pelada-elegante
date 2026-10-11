import { createContext, useContext } from "react";
import type { Player, Match } from "@/lib/football";

export type AdminActions = {
  editPlayer: (p: Player) => void;
  addPlayer: () => void;
  deletePlayer: (p: Player) => void;
  editMatch: (m: Match) => void;
  addMatch: () => void;
  deleteMatch: (m: Match) => void;
  openLogin: () => void;
  openPassword: () => void;
  logout: () => Promise<void>;
};

// Keep context identity outside refreshed UI modules and their import cycle.
export const AdminContext = createContext<AdminActions | null>(null);

export function useFootballAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("AdminProvider ausente");
  return value;
}