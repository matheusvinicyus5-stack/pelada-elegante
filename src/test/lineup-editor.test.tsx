import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LineupEditor } from "@/components/lineup-editor";
import type { Player } from "@/lib/football";

vi.mock("@/components/football", () => ({ PlayerAvatar: () => <span />, ShieldBadge: () => <span /> }));
const players: Player[] = ["João", "Matheus"].map((name, index) => ({ id: index + 1, name, position: "MC", points: 0, goals: 0, assists: 0, yellow: 0, red: 0, blue: 0, attendance: 0 }));
function Editor() {
  const [lineup, setLineup] = useState({ teamA: [] as number[], teamB: [] as number[] });
  return <LineupEditor players={players} {...lineup} onChange={setLineup} />;
}
describe("Lineup editor", () => {
  it("searches, adds, excludes already selected players and allows removal and reassignment", () => {
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar jogador ao Time Azul" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Buscar jogador para o Time Azul" }), { target: { value: "joao" } });
    expect(screen.queryByRole("button", { name: "Adicionar Matheus ao Time Azul" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar João ao Time Azul" }));
    expect(within(screen.getByRole("region", { name: "Escalação do Time Azul" })).getByText("1 jogador")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar jogador ao Time Vermelho" }));
    expect(screen.queryByRole("button", { name: "Adicionar João ao Time Vermelho" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remover João do Time Azul" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar João ao Time Vermelho" }));
    expect(screen.getByRole("button", { name: "Remover João do Time Vermelho" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Escalação do Time Azul" })).getByText("0 jogadores")).toBeInTheDocument();
  });
});