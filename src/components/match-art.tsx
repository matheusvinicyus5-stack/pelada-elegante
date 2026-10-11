import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { matchArtBlob, renderMatchArt } from "@/lib/match-art";
import type { Match, Player } from "@/lib/football";

export function MatchArt({ match, players }: { match: Match; players: Player[] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);setError("");
    // Dialog content mounts after the open state commits.
    const frame = requestAnimationFrame(() => {
      if (!canvas.current) return;
      renderMatchArt(canvas.current, match, players)
        .then(() => { if (!cancelled) setReady(true); })
        .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Não foi possível gerar a arte."); });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [open, match, players]);
  async function download() {
    if (!canvas.current || !ready) return;
    setBusy(true);setError("");
    try {
      const blob = await matchArtBlob(canvas.current);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;anchor.download = `amigos-fair-play-placar-${match.id}.png`;
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível baixar a arte."); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}><ImageDown size={16}/>Gerar arte do placar</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="match-art-dialog">
        <DialogTitle>Arte do placar</DialogTitle>
        <DialogDescription>Feed do Instagram · 1080 × 1350</DialogDescription>
        <div className="match-art-preview" aria-busy={!ready && !error}>
          <canvas ref={canvas} width={1080} height={1350} aria-label={`Arte do placar: Time Azul ${match.scoreA} × ${match.scoreB} Time Vermelho`} className={ready ? "" : "invisible"}/>
          {!ready && !error && <div className="match-art-loading"><LoaderCircle className="animate-spin" size={24}/><span>Preparando arte…</span></div>}
        </div>
        {error && <p role="alert" className="direction-error">{error}</p>}
        <Button onClick={() => void download()} disabled={!ready || busy}><Download size={16}/>{busy ? "Baixando…" : "Baixar imagem"}</Button>
      </DialogContent>
    </Dialog>
  </>;
}