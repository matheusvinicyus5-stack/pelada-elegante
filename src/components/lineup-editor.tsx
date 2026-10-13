import { useState } from "react";
import { Plus, Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerAvatar, ShieldBadge } from "@/components/football";
import { positionNames, type Player } from "@/lib/football";

type Lineup = { teamA: number[]; teamB: number[]; captainA?: number | undefined; captainB?: number | undefined };
type Props = Lineup & {
  players: Player[];
  onChange: (lineup: Lineup) => void;
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function LineupEditor({ players, teamA, teamB, captainA, captainB, onChange }: Props) {
  const [adding, setAdding] = useState<"A" | "B" | null>(null);
  const [query, setQuery] = useState("");
  const available = players.filter((player) =>
    !teamA.includes(player.id) && !teamB.includes(player.id) && normalize(player.name).includes(normalize(query)),
  ).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  function emit(nextA: number[], nextB: number[], capA = captainA, capB = captainB) {
    onChange({
      teamA: nextA,
      teamB: nextB,
      captainA: capA !== undefined && nextA.includes(capA) ? capA : undefined,
      captainB: capB !== undefined && nextB.includes(capB) ? capB : undefined,
    });
  }

  function add(id: number, team: "A" | "B") {
    emit(
      team === "A" ? [...teamA.filter((value) => value !== id), id] : teamA.filter((value) => value !== id),
      team === "B" ? [...teamB.filter((value) => value !== id), id] : teamB.filter((value) => value !== id),
    );
    setQuery("");
  }

  return <div className="lineup-editor">
    {(["A", "B"] as const).map((team) => {
      const name = team === "A" ? "Time Azul" : "Time Vermelho";
      const ids = team === "A" ? teamA : teamB;
      const captain = team === "A" ? captainA : captainB;
      return <section key={team} className={`lineup-team lineup-team-${team.toLowerCase()}`} aria-label={`Escalação do ${name}`}>
        <div className="lineup-team-heading">
          <ShieldBadge team={team} />
          <h3>{name}<small>{ids.length} {ids.length === 1 ? "jogador" : "jogadores"}</small></h3>
        </div>
        <div className="lineup-selected">
          {ids.length === 0 && <p className="lineup-empty">Nenhum jogador adicionado.</p>}
          {ids.map((id) => {
            const player = players.find((value) => value.id === id);
            if (!player) return null;
            const isCaptain = captain === id;
            return <div className="lineup-player" key={id}>
              <PlayerAvatar player={player} />
              <span><strong>{player.name}{isCaptain && <span className="captain-mark" aria-label="Capitão"> Ⓒ</span>}</strong><small>{positionNames[player.position] ?? player.position}</small></span>
              <Button type="button" variant={isCaptain ? "default" : "ghost"} size="icon" className="captain-toggle" aria-pressed={isCaptain} aria-label={isCaptain ? `Remover faixa de capitão de ${player.name}` : `Definir ${player.name} como capitão do ${name}`} title="Capitão" onClick={() => {
                const next = isCaptain ? undefined : id;
                emit(teamA, teamB, team === "A" ? next : captainA, team === "B" ? next : captainB);
              }}>Ⓒ</Button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remover ${player.name} do ${name}`} title={`Remover ${player.name}`} onClick={() => emit(teamA.filter((value) => value !== id), teamB.filter((value) => value !== id))}><X size={16} /></Button>
            </div>;
          })}
        </div>
        {adding !== team ? <Button type="button" variant="outline" className="lineup-add" onClick={() => { setAdding(team); setQuery(""); }}><Plus size={16} />Adicionar jogador<span className="sr-only"> ao {name}</span></Button> : <div className="lineup-picker">
          <div className="lineup-search">
            <Search size={16} />
            <Input autoFocus aria-label={`Buscar jogador para o ${name}`} placeholder="Buscar jogador..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button type="button" variant="ghost" size="icon" aria-label={`Fechar busca do ${name}`} title="Fechar busca" onClick={() => setAdding(null)}><X size={16} /></Button>
          </div>
          <div className="lineup-options">
            {available.length === 0 && <p className="lineup-empty">{query ? "Nenhum jogador encontrado." : "Todos os jogadores já foram adicionados."}</p>}
            {available.map((player) => <Button type="button" variant="ghost" key={player.id} className="lineup-option" aria-label={`Adicionar ${player.name} ao ${name}`} onClick={() => add(player.id, team)}>
              <PlayerAvatar player={player} /><span>{player.name}</span><Plus size={16} />
            </Button>)}
          </div>
          <Button type="button" variant="outline" className="lineup-add" onClick={() => setAdding(null)}><Check size={16} />Concluir seleção</Button>
        </div>}
      </section>;
    })}
  </div>;
}
