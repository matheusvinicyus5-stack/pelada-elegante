import { useState, type SVGProps } from "react";
import { Link } from "@tanstack/react-router";
import {
  Medal,
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  Users,
  Crown,
  Flame,
  Handshake,
  Shield,
  Activity,
  LockKeyhole,
  LogOut,
  Pencil,
  ArrowUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useFootball } from "./football-state";
import { positionNames, type Player } from "@/lib/football";
import { useFootballAdmin } from "./football-admin-context";
import { AttendanceDisplay } from "./attendance";
import { cn } from "@/lib/utils";
import { PlayerArt } from "./player-art";
import { profileChangeKeys } from "@/lib/statistics";
import { rankOf, leaderIds } from "@/lib/player-changes";
import fairPlayLogo from "@/assets/amigos-fair-play-logo.jpeg.asset.json";

export function SiteHeader() {
  const { active } = useFootball();
  const admin = useFootballAdmin();
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <img src={fairPlayLogo.url} alt="Logo Amigos Fair Play" />
          </span>
          <span>
            AMIGOS <strong>FAIR PLAY</strong>
            <small>FUTEBOL ENTRE AMIGOS</small>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "nav-active" }}>
            <ChartNoAxesColumnIncreasing size={17} />
            Estatísticas
          </Link>
          <Link to="/times" activeProps={{ className: "nav-active" }}>
            <Users size={17} />
            Times
          </Link>
          <Link to="/socios" activeProps={{ className: "nav-active" }}>
            <Medal size={17} />
            Sócios
          </Link>
        </nav>
        <div className="header-admin">
          {active ? (
            <details className="admin-menu">
              <summary>
                <Shield size={16} />
                Direção ativa
              </summary>
              <div>
                <Button variant="ghost" onClick={admin.openPassword}>
                  <LockKeyhole size={15} />
                  Alterar senha
                </Button>
                <Button variant="ghost" onClick={() => void admin.logout()}>
                  <LogOut size={15} />
                  Sair da Direção
                </Button>
              </div>
            </details>
          ) : (
            <Button variant="outline" size="sm" onClick={admin.openLogin}>
              <LockKeyhole size={15} />
              Login da Direção
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="page-width site-footer">
      <span>
        AMIGOS FAIR PLAY <span className="text-muted-foreground">© 2026</span>
      </span>
      <span>
        Dentro de campo, rivais. Fora dele, amigos.
        <Handshake size={15} />
      </span>
    </footer>
  );
}
export function PlayerAvatar({ player, large = false }: { player: Player; large?: boolean }) {
  return (
    <span className={cn("player-avatar", large && "avatar-large", `avatar-${player.id % 4}`)}>
      {player.photo ? (
        <img src={player.photo} alt={player.name} loading="lazy" />
      ) : (
        <span>
          {player.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
    </span>
  );
}
export function Leaders({ onSelect }: { onSelect: (p: Player) => void }) {
  const { players } = useFootball();
  const ids = leaderIds(players);
  const pointsLeader = players.find((p) => p.id === ids.points);
  const goalLeader = players.find((p) => p.id === ids.goals);
  const assistLeader = players.find((p) => p.id === ids.assists);
  if (!pointsLeader || !goalLeader || !assistLeader) return null;
  const items = [
    { title: "SEGUE O LÍDER", p: pointsLeader, value: pointsLeader.points, unit: "pontos", icon: Crown, tone: "gold" },
    { title: "O MATADOR", p: goalLeader, value: goalLeader.goals, unit: "gols", icon: Flame, tone: "coral" },
    {
      title: "O GARÇOM",
      p: assistLeader,
      value: assistLeader.assists,
      unit: "assistências",
      icon: TopHat,
      tone: "mint",
    },
  ];
  return (
    <div className="leaders-grid">
      {items.map(({ title, p, value, unit, icon: Icon, tone }) => (
        <Button key={title} variant="ghost" className={cn("leader-card", tone)} onClick={() => onSelect(p)}>
          <div className="leader-top">
            <span>
              <Icon size={16} />
              {title}
            </span>
            <ArrowUpRight size={17} />
          </div>
          <div className="leader-body">
            <PlayerAvatar player={p} large />
            <div>
              <h3>{p.name}</h3>
              <span className="leader-value">
                {value}
                <small>{unit}</small>
              </span>
            </div>
            <Icon className="leader-watermark" />
          </div>
          <div className="leader-bottom">
            {positionNames[p.position]}
            <span>
              Ver jogador <ArrowUpRight size={12} />
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
}
export function PlayerDialog({ player, onClose }: { player: Player | null; onClose: () => void }) {
  const { active, players } = useFootball();
  const [photoOpen, setPhotoOpen] = useState(false);
  const admin = useFootballAdmin();
  return (
    <Dialog
      open={Boolean(player)}
      onOpenChange={(open) => {
        if (!open) { setPhotoOpen(false); onClose(); }
      }}
    >
      <DialogContent className="player-dialog">
        {player && (
          <>
            <div className="profile-cover">
              <Shield className="profile-shield" />
              <span className="profile-number">#{(player.number ?? player.id).toString().padStart(2, "0")}</span>
              <span className="profile-season">TEMPORADA 2026</span>
            </div>
            <div className="profile-main">
              {player.photo ? <Button variant="ghost" className="profile-photo-button" aria-label={`Ampliar foto de ${player.name}`} title="Ampliar foto" onClick={(event)=>{event.stopPropagation();setPhotoOpen(true);}}><PlayerAvatar player={player} large /></Button> : <PlayerAvatar player={player} large />}
              <DialogTitle className="profile-name">{player.name}</DialogTitle>
              <DialogDescription>{positionNames[player.position]}</DialogDescription>
              <LeaderBadges player={player} players={players} labels />
              <div className="profile-stats">
                {[
                  [player.points, "Pontos"],
                  [player.goals, "Gols"],
                  [player.assists, "Assistências"],
                  [`${player.attendance}%`, "Frequência"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <strong>{v}</strong>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="profile-discipline">
                <span>Disciplina</span>
                <span>
                  <i className="discipline-card yellow" />
                  {player.yellow}
                  <i className="discipline-card red" />
                  {player.red}
                  <i className="discipline-card blue" />
                  {player.blue}
                </span>
              </div>
              <div className="profile-presence">
                <Activity size={16} />
                <span>Presença em campo</span>
                <strong>{player.attendance}%</strong>
              </div>
              <AttendanceDisplay player={player} />
              <PlayerChanges player={player} players={players} />
              <PlayerArt player={player}/>
              {player.photo && <Dialog open={photoOpen} onOpenChange={setPhotoOpen}><DialogContent className="photo-lightbox" aria-describedby={undefined} onClick={event=>event.stopPropagation()}><DialogTitle className="sr-only">Foto de {player.name}</DialogTitle><img src={player.photo} alt={`Foto ampliada de ${player.name}`} onClick={event=>event.stopPropagation()}/><Button variant="secondary" className="photo-close" onClick={()=>setPhotoOpen(false)}><X size={18}/>Fechar foto</Button></DialogContent></Dialog>}
              <>
                {active && (
                  <Button
                    className="w-full mt-6"
                    onClick={() => {
                      onClose();
                      admin.editPlayer(player);
                    }}
                  >
                    <Pencil size={16} />
                    Editar estatísticas
                  </Button>
                )}
              </>
              <Button variant="secondary" className="w-full mt-6" onClick={onClose}>
                Voltar à classificação
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ShieldBadge({ team }: { team: "A" | "B" }) {
  return (
    <span className={cn("team-shield", team === "B" && "team-b")}>
      <img src={fairPlayLogo.url} alt={`Escudo do Time ${team === "A" ? "Azul" : "Vermelho"}`} />
    </span>
  );
}

export function PlayerChanges({ player, players }: { player: Player; players: Player[] }) {
  const prev = player.previous;
  if (!prev) return null;
  const rank = rankOf(players, player.id);
  const rows = (
    [
      ["points", "Pontos"],
      ["goals", "Gols"],
      ["assists", "Assistências"],
      ["yellow", "Amarelos"],
      ["red", "Vermelhos"],
      ["blue", "Azuis"],
    ] as const
  ).filter(([k]) => profileChangeKeys.some(key => key === k) && prev[k] !== player[k]);
  const moved = prev.rank - rank;
  if (!rows.length && !moved) return null;
  const fmt = (k: string, v: number) => (k === "attendance" ? `${v}%` : v);
  return (
    <div className="profile-changes">
      <div className="profile-changes-title">Desde a última atualização</div>
      {moved !== 0 && (
        <div className={cn("change-rank", moved > 0 ? "up" : "down")}>
          <span>
            {moved > 0 ? "▲" : "▼"} {moved > 0 ? "Subiu" : "Caiu"} {Math.abs(moved)}{" "}
            {Math.abs(moved) === 1 ? "posição" : "posições"}
          </span>
          <strong>
            {prev.rank}º → {rank}º
          </strong>
        </div>
      )}
      {rows.map(([k, l]) => {
        const d = player[k] - prev[k];
        return (
          <div key={k} className="change-row">
            <span>{l}</span>
            <span>
              {fmt(k, prev[k])} → <strong>{fmt(k, player[k])}</strong>
              <em className={d > 0 ? "up" : "down"}>
                {d > 0 ? "+" : ""}
                {k === "attendance" ? `${d}%` : d}
              </em>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function TopHat({ size = 24, className, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M7 16V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v11" />
      <path d="M7 12h10" />
      <path d="M3 16c0 2.2 4 4 9 4s9-1.8 9-4c0-.8-1-1.4-2.5-1.8" />
      <path d="M5.5 14.2C4 14.6 3 15.2 3 16" />
    </svg>
  );
}

export function LeaderBadges({ player, players, labels = false }: { player: Player; players: Player[]; labels?: boolean }) {
  const ids = leaderIds(players);
  const items = [
    ids.points === player.id && { key: "gold", Icon: Crown, label: "Segue o Líder" },
    ids.goals === player.id && { key: "coral", Icon: Flame, label: "O Matador" },
    ids.assists === player.id && { key: "mint", Icon: TopHat, label: "O Garçom" },
  ].filter(Boolean) as { key: string; Icon: typeof Crown; label: string }[];
  if (!items.length) return null;
  if (!labels)
    return (
      <span className="leader-icons">
        {items.map(({ key, Icon, label }) => (
          <Icon key={key} size={13} className={`leader-icon ${key}`} aria-label={label} />
        ))}
      </span>
    );
  return (
    <div className="profile-awards">
      {items.map(({ key, Icon, label }) => (
        <div key={key} className={`profile-award ${key}`}>
          <Icon size={15} />
          {label}
        </div>
      ))}
    </div>
  );
}
