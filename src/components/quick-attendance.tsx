import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useFootball } from "@/components/football-state";
import { withPreviousSnapshots, todayInBrazil } from "@/lib/player-changes";
import { normalizeSearch } from "@/lib/statistics";
import { applyQuickAttendance, inMedicalLeave, recentSaturdays, shortDate } from "@/lib/attendance";

export function QuickAttendance() {
  const { players, matches, save } = useFootball();
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [present, setPresent] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const sorted = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [players]);
  const exempt = (id: number) => { const p = players.find((x) => x.id === id); return !!p && (p.membership === "ouro" || !!p.medicalLeave || inMedicalLeave(date, p.medicalLeavePeriods)); };
  const counted = sorted.filter((p) => !exempt(p.id));
  const visible = sorted.filter((p) => normalizeSearch(p.name).includes(normalizeSearch(query)));

  useEffect(() => { if (!open) return; const d = recentSaturdays(todayInBrazil()); setDates(d); setDate(d[d.length - 1] ?? ""); }, [open]);
  useEffect(() => { setPresent(players.filter((p) => p.attendanceRecords?.some((r) => r.date === date && r.status === "present")).map((p) => p.id)); }, [date, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentCount = counted.filter((p) => present.includes(p.id)).length;
  async function confirm() {
    setBusy(true);
    try {
      await save({ players: withPreviousSnapshots(players, applyQuickAttendance(players, date, present)), matches });
      toast.success(`Frequência de ${shortDate(date)} salva!`);
      setOpen(false); setQuery("");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); } finally { setBusy(false); }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><CalendarCheck size={15} />Frequência rápida</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="quick-round-dialog">
          <DialogTitle><CalendarCheck size={20} /> Chamada do sábado</DialogTitle>
          <DialogDescription>Marque quem esteve presente. Quem não for marcado recebe falta nesse sábado.</DialogDescription>
          <section className="quick-block">
            <h3>1. Sábado</h3>
            <div className="quick-actions">
              {dates.map((d) => <Button key={d} type="button" size="sm" variant={d === date ? "default" : "outline"} onClick={() => setDate(d)}>{shortDate(d)}</Button>)}
            </div>
          </section>
          <section className="quick-block">
            <h3>2. Presentes</h3>
            <label className="search-field"><Search size={16} /><input aria-label="Buscar jogador" placeholder="Buscar jogador..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            <div className="quick-actions">
              <Button type="button" size="sm" variant="outline" onClick={() => setPresent(counted.map((p) => p.id))}>Marcar todos</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setPresent([])}>Limpar</Button>
              <span>{presentCount} presentes · {counted.length - presentCount} faltas</span>
            </div>
            <div className="quick-checklist">
              {visible.map((p) => {
                if (exempt(p.id)) return <label key={p.id} className="exempt" title="Isento de frequência">{p.membership === "ouro" ? "🥇" : "🚑"} {p.name}</label>;
                const on = present.includes(p.id);
                return (
                  <label key={p.id} className={on ? "checked" : ""}>
                    <input type="checkbox" checked={on} onChange={(e) => setPresent(e.target.checked ? [...present, p.id] : present.filter((id) => id !== p.id))} />
                    {p.name}
                  </label>
                );
              })}
            </div>
          </section>
          <Button disabled={busy || !date} onClick={confirm}>{busy ? "Salvando…" : "Salvar frequência"}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
