import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Users,
  Check,
  Plus,
  Pencil,
  Trash2,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerAvatar, PlayerDialog, ShieldBadge } from "@/components/football";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { positionNames, type Player, type Match } from "@/lib/football";
import { useFootballAdmin } from "@/components/football-admin";
import { useFootball } from "@/components/football-state";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/times")({
  head: () => ({
    meta: [
      { title: "Times e confrontos de sábado — Amigos Fair Play" },
      {
        name: "description",
        content: "Confira os confrontos de sábado e os jogadores de cada time do Amigos Fair Play.",
      },
      { property: "og:title", content: "Times — Amigos Fair Play" },
      { property: "og:description", content: "Time A x Time B: escalações e histórico da nossa pelada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Teams,
});
function Teams() {
  const { players, matches, active: direction, save } = useFootball();
  const admin = useFootballAdmin();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Player | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Match | null>(null);
  const [search, setSearch] = useState("");
  const match = matches[active] ?? matches[0];
  if (!match)
    return (
      <main className="page-width main-content">
        <h1>Times</h1>
        <p>Nenhum confronto registrado.</p>
        {direction && (
          <Button className="mt-6" onClick={admin.addMatch}>
            <Plus size={16} />
            Adicionar confronto
          </Button>
        )}
      </main>
    );
  function edit() {
    if (!match) return;
    setDraft({ ...match, teamA: [...match.teamA], teamB: [...match.teamB] });
    setEditing(true);
  }
  function move(id: number, team: "A" | "B") {
    if (!draft) return;
    const a = draft.teamA.filter((p) => p !== id);
    const b = draft.teamB.filter((p) => p !== id);
    if (team === "A" && !draft.teamA.includes(id)) a.push(id);
    if (team === "B" && !draft.teamB.includes(id)) b.push(id);
    setDraft({ ...draft, teamA: a, teamB: b });
  }
  return (
    <main className="page-width main-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> TODO SÁBADO, UMA NOVA HISTÓRIA
          </div>
          <h1>
            Os times. <span>O nosso jogo.</span>
          </h1>
          <p>Os encontros, os confrontos e quem esteve em campo.</p>
        </div>
        {direction && (
          <div className="admin-toolbar">
            <Button size="sm" onClick={admin.addMatch}>
              <Plus size={16} />
              Adicionar confronto
            </Button>
            <Button size="sm" variant="outline" onClick={edit}>
              <Users size={16} />
              Organizar times
            </Button>
          </div>
        )}
      </div>
      <div className="teams-date-bar">
        <div>
          <CalendarDays size={19} />
          <strong>Sábado, {match.date}</strong>
          {match.example && <span className="example-badge">CONFRONTO DE EXEMPLO</span>}
        </div>
        <div className="flex gap-2">
          {direction && (
            <>
              <Button
                size="icon"
                variant="outline"
                aria-label="Editar confronto"
                title="Editar confronto"
                onClick={() => admin.editMatch(match)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Excluir confronto"
                title="Excluir confronto"
                onClick={() => admin.deleteMatch(match)}
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
          <Button
            size="icon"
            variant="outline"
            aria-label="Sábado anterior"
            disabled={active >= matches.length - 1}
            onClick={() => setActive(active + 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Próximo sábado"
            disabled={active === 0}
            onClick={() => setActive(active - 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <section className="match-result" aria-label="Resultado e eventos da partida">
        <div className="match-result-header">
        <div className="result-team">
          <ShieldBadge team="A" />
          <h2>Time A</h2>
        </div>
        <strong className="result-score" aria-label={`${match.scoreA} gols do Time A`}>{match.scoreA}</strong>
        <div className="result-status">
          <span>Encerrado</span>
          <span>{match.short}</span>
        </div>
        <strong className="result-score" aria-label={`${match.scoreB} gols do Time B`}>{match.scoreB}</strong>
        <div className="result-team result-team-b">
          <ShieldBadge team="B" />
          <h2>Time B</h2>
        </div>
        </div>
        <div className="result-events">
          {(["goals", "yellow", "red"] as const).map((kind) => {
            const hasEvents = kind === "goals" ? (match.goals ?? []).length > 0 : (match.cards ?? []).some((card) => card.card === kind);
            if (!hasEvents) return null;
            return <div className="result-event-row" key={kind}>
              {(["A", "B"] as const).map((team) => {
                const roster = kind === "goals"
                  ? [...new Set((match.goals ?? []).filter((goal) => goal.team === team).map((goal) => goal.scorerId))]
                  : [...new Set((match.cards ?? []).filter((card) => card.team === team && card.card === kind).map((card) => card.playerId))];
                return <div key={team} className={cn("result-event-names", team === "B" && "result-event-names-b")}>
                  {roster.map((id) => {
                    const name = players.find((player) => player.id === id)?.name ?? "Jogador não encontrado";
                    const goals = (match.goals ?? []).filter((goal) => goal.team === team && goal.scorerId === id);
                    const count = kind === "goals" ? goals.length : (match.cards ?? []).filter((card) => card.team === team && card.card === kind && card.playerId === id).length;
                    const assists = [...new Set(goals.flatMap((goal) => goal.assistId === undefined ? [] : [goal.assistId]))].map((assistId) => players.find((player) => player.id === assistId)?.name).filter(Boolean);
                    return <div key={id}><span>{name}{count > 1 ? ` (${count})` : ""}</span>{kind === "goals" && assists.length > 0 && <small>Assistência: {assists.join(", ")}</small>}</div>;
                  })}
                </div>;
              })}
              <span className="result-event-icon" role="img" aria-label={kind === "goals" ? "Gols" : kind === "yellow" ? "Cartões amarelos" : "Cartões vermelhos"}>
                {kind === "goals" ? <CircleDot size={19} /> : <i className={cn("discipline-card", kind)} />}
              </span>
            </div>;
          })}
          {(match.goals ?? []).length === 0 && (match.cards ?? []).length === 0 && <p className="result-no-events">Nenhum evento registrado.</p>}
        </div>
      </section>
      <div className="teams-grid">
        {(["A", "B"] as const).map((team) => (
          <section className="team-roster" key={team}>
            <div className="section-heading">
              <h2>
                <span className={cn("tiny-dot", team === "B" && "coral-dot")} />
                Time {team}
                <span className="count-badge">{(team === "A" ? match.teamA : match.teamB).length} jogadores</span>
              </h2>
              <span className="section-caption">ESCALAÇÃO</span>
            </div>
            {(team === "A" ? match.teamA : match.teamB).map((id) => {
              const p = players.find((p) => p.id === id);
              if (!p) return null;
              return (
                <Button className="roster-player" variant="ghost" key={id} onClick={() => setSelected(p)}>
                  <span className="jersey-number">{p.number}</span>
                  <PlayerAvatar player={p} />
                  <span className="roster-name">
                    <strong>{p.name}</strong>
                    <small>{positionNames[p.position] ?? p.position}</small>
                  </span>
                  <span className="position-badge">{p.position}</span>
                  <ChevronRight size={15} />
                </Button>
              );
            })}
          </section>
        ))}
      </div>
      <section className="match-history">
        <div className="section-heading">
          <h2>Outros sábados</h2>
          <span className="section-caption">HISTÓRICO DE CONFRONTOS</span>
        </div>
        <div className="history-grid">
          {matches.map((m, i) => (
            <Button
              key={m.id}
              variant="ghost"
              onClick={() => setActive(i)}
              className={cn("history-match", i === active && "history-active")}
            >
              <CalendarDays size={17} />
              <span>
                {m.date}
                <small>Sábado{m.example ? " · Exemplo" : ""}</small>
              </span>
              <strong>
                {m.scoreA}
                <small> × </small>
                {m.scoreB}
              </strong>
              <ChevronRight size={15} />
            </Button>
          ))}
        </div>
      </section>
      <PlayerDialog player={selected} onClose={() => setSelected(null)} />
      <Dialog open={editing && direction} onOpenChange={setEditing}>
        <DialogContent className="organize-dialog">
          <DialogTitle>Organizar os times</DialogTitle>
          <DialogDescription>{match.date} · Escalação da partida.</DialogDescription>
          <label className="search-field">
            <Users size={16} />
            <input
              aria-label="Buscar atleta para escalar"
              placeholder="Buscar atleta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="organize-list">
            {players
              .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
              .map((p) => (
                <div key={p.id}>
                  <PlayerAvatar player={p} />
                  <span>{p.name}</span>
                  <Button
                    size="sm"
                    variant={draft?.teamA.includes(p.id) ? "default" : "outline"}
                    onClick={() => move(p.id, "A")}
                  >
                    A{draft?.teamA.includes(p.id) && <Check size={12} />}
                  </Button>
                  <Button
                    size="sm"
                    variant={draft?.teamB.includes(p.id) ? "default" : "outline"}
                    className={cn(draft?.teamB.includes(p.id) && "team-b-button")}
                    onClick={() => move(p.id, "B")}
                  >
                    B{draft?.teamB.includes(p.id) && <Check size={12} />}
                  </Button>
                </div>
              ))}
          </div>
          {error && (
            <p role="alert" className="direction-error">
              {error}
            </p>
          )}
          <Button
            disabled={busy}
            onClick={async () => {
              if (!draft) return;
              setBusy(true);
              setError("");
              try {
                await save({ players, matches: matches.map((m, i) => (m.id === draft.id ? draft : m)) });
                setEditing(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Não foi possível salvar");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Check />
            Aplicar escalação
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
