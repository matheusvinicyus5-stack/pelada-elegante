import { useMemo, useState } from "react";
import { Zap, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFootball } from "@/components/football-state";
import { withPreviousSnapshots } from "@/lib/player-changes";
import { applyQuickRound, normalizeSearch, type QuickEvent } from "@/lib/statistics";

const rules = [
  { value: "g1-win", label: "1º Jogo — Vitória (+3 pts)", points: 3 },
  { value: "g2-win", label: "2º Jogo — Vitória (+2 pts)", points: 2 },
  { value: "g1-draw", label: "1º Jogo — Empate (+1 pt)", points: 1 },
  { value: "g2-draw", label: "2º Jogo — Empate (+1 pt)", points: 1 },
  { value: "custom", label: "Personalizado", points: 0 },
];
const eventLabels: Record<QuickEvent["kind"], string> = { goals: "⚽ Gol", assists: "🎩 Assistência", yellow: "🟨 Amarelo", blue: "🟦 Azul", red: "🟥 Vermelho" };

export function QuickRound() {
  const { players, matches, save } = useFootball();
  const [open, setOpen] = useState(false);
  const [rule, setRule] = useState("g1-win");
  const [custom, setCustom] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [eventPlayer, setEventPlayer] = useState("");
  const [events, setEvents] = useState<QuickEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const points = rule === "custom" ? Math.max(0, Math.min(10, custom)) : rules.find((r) => r.value === rule)!.points;
  const sorted = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [players]);
  const visible = sorted.filter((p) => normalizeSearch(p.name).includes(normalizeSearch(query)));
  const name = (id: number) => players.find((p) => p.id === id)?.name ?? "?";

  function reset() { setSelected([]); setEvents([]); setQuery(""); setEventPlayer(""); }
  async function confirm() {
    setBusy(true);
    try {
      await save({ players: withPreviousSnapshots(players, applyQuickRound(players, points, selected, events)), matches });
      toast.success("Rodada lançada com sucesso!");
      reset(); setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally { setBusy(false); }
  }
  const empty = (selected.length === 0 || points === 0) && events.length === 0;

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Zap size={15} />Lançamento rápido</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="quick-round-dialog">
          <DialogTitle><Zap size={20} /> Lançamento Rápido da Rodada</DialogTitle>
          <DialogDescription>Some pontos ao time de uma vez e lance gols, assistências e cartões de qualquer jogador.</DialogDescription>

          <section className="quick-block">
            <h3>1. Quem pontuou</h3>
            <div className="quick-rule">
              <Select value={rule} onValueChange={setRule}>
                <SelectTrigger aria-label="Tipo de pontuação"><SelectValue /></SelectTrigger>
                <SelectContent>{rules.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
              {rule === "custom" && <input type="number" min={0} max={10} aria-label="Pontos personalizados" value={custom} onChange={(e) => setCustom(Number(e.target.value))} />}
            </div>
            <label className="search-field"><Search size={16} /><input aria-label="Buscar jogador" placeholder="Buscar jogador..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            <div className="quick-actions">
              <Button type="button" size="sm" variant="outline" onClick={() => setSelected([...new Set([...selected, ...visible.map((p) => p.id)])])}>Marcar filtrados</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])}>Limpar seleção</Button>
              <span>{selected.length} marcados</span>
            </div>
            <div className="quick-checklist">
              {visible.map((p) => (
                <label key={p.id} className={selected.includes(p.id) ? "checked" : ""}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))} />
                  {p.name}
                </label>
              ))}
            </div>
          </section>

          <section className="quick-block">
            <h3>2. Gols, assistências e cartões</h3>
            <Select value={eventPlayer} onValueChange={setEventPlayer}>
              <SelectTrigger aria-label="Jogador do lance"><SelectValue placeholder="Escolha o jogador (qualquer time)" /></SelectTrigger>
              <SelectContent>{sorted.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="quick-actions">
              {(Object.keys(eventLabels) as QuickEvent["kind"][]).map((kind) => (
                <Button key={kind} type="button" size="sm" variant="outline" disabled={!eventPlayer} onClick={() => setEvents([...events, { playerId: Number(eventPlayer), kind }])}>+ {eventLabels[kind]}</Button>
              ))}
            </div>
          </section>

          <section className="quick-block quick-summary">
            <h3>3. Resumo</h3>
            {empty ? <p>Nada lançado ainda.</p> : (
              <ul>
                {selected.length > 0 && points > 0 && <li><span><strong>+{points} pts</strong> para {selected.length}: {selected.map(name).join(", ")}</span></li>}
                {events.map((e, i) => (
                  <li key={i}><span>{eventLabels[e.kind]} — {name(e.playerId)}</span>
                    <Button type="button" size="icon" variant="ghost" aria-label="Desfazer lance" onClick={() => setEvents(events.filter((_, j) => j !== i))}><Trash2 size={14} /></Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Button disabled={busy || empty} onClick={confirm}>{busy ? "Salvando…" : "Confirmar e atualizar classificação"}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
