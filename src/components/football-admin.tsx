import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, type ReactNode, type FormEvent } from "react";
import { LockKeyhole, LogOut, Plus, Pencil, Trash2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlayerAvatar } from "@/components/football";
import { useFootball } from "@/components/football-state";
import { enterDirection, exitDirection, changeDirectionPassword } from "@/lib/football.functions";
import { AttendanceEditor } from "@/components/attendance";
import type { Player, Match } from "@/lib/football";
import { AdminContext, type AdminActions } from "./football-admin-context";
import { LineupEditor } from "./lineup-editor";

const blank: Player = {
  id: 0,
  number: 0,
  name: "",
  position: "MC",
  points: 0,
  goals: 0,
  assists: 0,
  yellow: 0,
  red: 0,
  blue: 0,
  attendance: 0,
  photo: "",
};
const fields = [
  ["number", "Camisa"],
  ["points", "Pontos"],
  ["goals", "Gols"],
  ["assists", "Assistências"],
  ["yellow", "Amarelos"],
  ["red", "Vermelhos"],
  ["blue", "Azuis"],
] as const;
const fullMonthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const shortMonthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function dateToInput(value: string) {
  const parts = value.match(/^(\d{1,2}) de ([a-zA-ZÀ-ÿ]+) de (\d{4})$/);
  if (!parts?.[2]) return "";

  const month = fullMonthNames.indexOf(parts[2].toLowerCase()) + 1;
  if (month < 1) return "";

  return `${parts[3]}-${String(month).padStart(2, "0")}-${String(Number(parts[1])).padStart(2, "0")}`;
}

function formatMatchDate(value: string) {
  if (!value) return { date: "", short: "" };

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return { date: "", short: "" };
  }

  return {
    date: `${String(day).padStart(2, "0")} de ${fullMonthNames[month - 1]} de ${year}`,
    short: `${String(day).padStart(2, "0")} ${shortMonthNames[month - 1]}`,
  };
}
function cropImageToSquare(src: string, x: number, y: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const outputSize = 512;
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - side) * (x / 100);
      const sourceY = (image.naturalHeight - side) * (y / 100);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Não foi possível preparar o corte da foto."));
        return;
      }

      canvas.width = outputSize;
      canvas.height = outputSize;
      context.drawImage(image, sourceX, sourceY, side, side, 0, 0, outputSize, outputSize);

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };

    image.onerror = () => reject(new Error("Não foi possível abrir a foto."));
    image.src = src;
  });
}

export function FootballAdminProvider({ children }: { children: ReactNode }) {
  const { players, matches, active, setActive, save } = useFootball();
  const [photoDraft, setPhotoDraft] = useState<{ src: string; x: number; y: number } | null>(null);
  const cropDrag = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const login = useServerFn(enterDirection);
  const logout = useServerFn(exitDirection);
  const change = useServerFn(changeDirectionPassword);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [matchStep, setMatchStep] = useState(1);
  const [deleting, setDeleting] = useState<{ type: "player" | "match"; id: number; name: string } | null>(null);
  async function run(action: () => Promise<void>) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  async function enter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password"));
    await run(async () => {
      const result = await login({ data: { password } });
      form.reset();
      if (!result.ok) throw new Error("Senha incorreta");
      setActive(true);
      setLoginOpen(false);
    });
  }
  const [loginOpen, setLoginOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const actions: AdminActions = {
    editPlayer: (p) => {
      if (active) {
        setError("");
        setPlayer({ ...p });
      }
    },
    addPlayer: () => {
      if (active) {
        setError("");
        setPlayer({ ...blank, id: Math.max(0, ...players.map((p) => p.id)) + 1 });
      }
    },
    deletePlayer: (p) => {
      if (active) {
        setError("");
        setDeleting({ type: "player", id: p.id, name: p.name });
      }
    },
    editMatch: (m) => {
      if (active) {
        setError("");
        setMatchStep(1);
        setMatch({
          ...m,
          teamA: [...m.teamA],
          teamB: [...m.teamB],
          goals: [...(m.goals ?? [])],
          cards: [...(m.cards ?? [])],
        });
      }
    },
    addMatch: () => {
      if (active) {
        setError("");
        setMatchStep(1);
        setMatch({
          id: Math.max(0, ...matches.map((m) => m.id)) + 1,
          date: "",
          short: "",
          scoreA: 0,
          scoreB: 0,
          teamA: [],
          teamB: [],
          goals: [],
          cards: [],
          example: false,
        });
      }
    },
    deleteMatch: (m) => {
      if (active) {
        setError("");
        setDeleting({ type: "match", id: m.id, name: m.date });
      }
    },
    openLogin: () => {
      setError("");
      setLoginOpen(true);
    },
    openPassword: () => {
      setError("");
      setMessage("");
      setPasswordOpen(true);
    },
    logout: () =>
      run(async () => {
        await logout();
        setActive(false);
        setPlayer(null);
        setMatch(null);
        setDeleting(null);
        setPasswordOpen(false);
        setMessage("");
      }),
  };
  return (
    <AdminContext.Provider value={actions}>
      {children}
      <Dialog open={loginOpen && !active} onOpenChange={setLoginOpen}>
        <DialogContent className="admin-login-dialog">
          <DialogTitle>
            <LockKeyhole size={20} /> Acesso da Direção
          </DialogTitle>
          <DialogDescription>Login administrativo</DialogDescription>
          <form className="password-form" onSubmit={enter}>
            <label>
              Senha
              <Input name="password" type="password" autoComplete="current-password" required maxLength={128} />
            </label>
            {error && (
              <p role="alert" className="direction-error">
                {error}
              </p>
            )}
            <Button disabled={busy} type="submit">
              {busy ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={passwordOpen && active} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>Acesso da Direção</DialogDescription>
          <form
            className="password-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              run(async () => {
                if (f.get("password") !== f.get("confirm")) throw new Error("As novas senhas não coincidem");
                await change({ data: { current: String(f.get("current")), password: String(f.get("password")) } });
                form.reset();
                setMessage("Senha alterada. Os outros acessos foram encerrados.");
              });
            }}
          >
            <label>
              Senha atual
              <Input required type="password" name="current" autoComplete="current-password" maxLength={128} />
            </label>
            <label>
              Nova senha
              <Input
                required
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
              />
              <small>Mínimo de 8 caracteres.</small>
            </label>
            <label>
              Confirmar nova senha
              <Input
                required
                type="password"
                name="confirm"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
              />
            </label>
            <Button disabled={busy}>
              <LockKeyhole size={16} />
              Alterar senha
            </Button>
            {error && (
              <p role="alert" className="direction-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="direction-success">
                {message}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(player)}
        onOpenChange={(open) => {
          if (!open) setPlayer(null);
        }}
      >
        <DialogContent className="direction-dialog">
          <DialogTitle>{players.some((p) => p.id === player?.id) ? "Editar jogador" : "Adicionar jogador"}</DialogTitle>
          <DialogDescription>Dados e estatísticas do atleta.</DialogDescription>
          {player && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await save({
                    players: players.some((p) => p.id === player.id)
                      ? withPreviousSnapshots(players, players.map((p) => (p.id === player.id ? player : p)))
                      : [...players, player],
                    matches,
                  });
                  setPlayer(null);
                  setMessage("Jogador salvo.");
                });
              }}
            >
              <div className="direction-form-grid">
                <label className="col-span-2">
                  Nome
                  <Input
                    required
                    maxLength={100}
                    value={player.name}
                    onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                  />
                </label>
                <label className="col-span-2">
                  Posição
                  <select value={player.position} onChange={(e) => setPlayer({ ...player, position: e.target.value })}>
                    <option value="MC">Meio-campo</option>
                    <option value="AT">Atacante</option>
                    <option value="G">Goleiro</option>
                    <option value="ZG">Zagueiro</option>
                    <option value="DF">Defensor</option>
                    <option value="LAT">Lateral</option>
                  </select>
                </label>
                {fields.map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <Input
                      required
                      type="number"
                      min={0}
                      max={100000}
                      value={player[key] ?? 0}
                      onChange={(e) => setPlayer({ ...player, [key]: Number(e.target.value) })}
                    />
                  </label>
                ))}
                <AttendanceEditor key={player.id} player={player} onChange={setPlayer} />
                <label className="col-span-2">
                  Foto
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 1400000) {
                        setError("Use uma foto de até 1,4 MB");
                        return;
                      }

                      setError("");
                      const reader = new FileReader();

                      reader.onload = () => {
                        if (typeof reader.result === "string") {
                          setPhotoDraft({ src: reader.result, x: 50, y: 25 });
                        }
                      };

                      reader.onerror = () => setError("Não foi possível ler a foto.");
                      reader.readAsDataURL(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {photoDraft && (
                  <div className="col-span-2">
                    <p className="mb-2 text-sm">Arraste a foto para ajustar o enquadramento:</p>

                    <div
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        cropDrag.current = {
                          pointerX: e.clientX,
                          pointerY: e.clientY,
                          x: photoDraft.x,
                          y: photoDraft.y,
                        };
                      }}
                      onPointerMove={(e) => {
                        const drag = cropDrag.current;
                        if (!drag) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        setPhotoDraft({
                          ...photoDraft,
                          x: Math.max(0, Math.min(100, drag.x - ((e.clientX - drag.pointerX) / rect.width) * 100)),
                          y: Math.max(0, Math.min(100, drag.y - ((e.clientY - drag.pointerY) / rect.height) * 100)),
                        });
                      }}
                      onPointerUp={() => {
                        cropDrag.current = null;
                      }}
                      onPointerCancel={() => {
                        cropDrag.current = null;
                      }}
                      style={{
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        overflow: "hidden",
                        touchAction: "none",
                        cursor: "grab",
                        border: "2px solid var(--border)",
                      }}
                    >
                      <img
                        src={photoDraft.src}
                        alt="Prévia do corte da foto"
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: `${photoDraft.x}% ${photoDraft.y}%`,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      />
                    </div>

                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!player) return;
                          try {
                            const photo = await cropImageToSquare(photoDraft.src, photoDraft.x, photoDraft.y);
                            setPlayer({ ...player, photo });
                            setPhotoDraft(null);
                          } catch {
                            setError("Não foi possível aplicar o corte da foto.");
                          }
                        }}
                      >
                        Aplicar corte
                      </Button>

                      <Button type="button" variant="ghost" onClick={() => setPhotoDraft(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {player.photo && (
                  <div className="col-span-2 flex items-center gap-3">
                    <PlayerAvatar player={player} />
                    <Button type="button" variant="ghost" onClick={() => setPlayer({ ...player, photo: "" })}>
                      Remover foto
                    </Button>
                  </div>
                )}
              </div>
              {error && (
                <p role="alert" className="direction-error">
                  {error}
                </p>
              )}
              <Button disabled={busy || Boolean(photoDraft)} className="w-full mt-4">
                <Save size={16} />
                {busy ? "Salvando…" : "Salvar jogador"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(match)}
        onOpenChange={(open) => {
          if (!open) setMatch(null);
        }}
      >
        <DialogContent className="direction-dialog">
          <DialogTitle>Confronto de sábado</DialogTitle>
          <DialogDescription>Data, placar e escalação dos dois times.</DialogDescription>
          {match && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await save({
                    players,
                    matches: matches.some((m) => m.id === match.id)
                      ? matches.map((m) => (m.id === match.id ? match : m))
                      : [match, ...matches],
                  });
                  setMatch(null);
                  setMessage("Confronto salvo.");
                });
              }}
            >
              <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
                {["Data", "Times", "Eventos", "Revisão"].map((label, index) => (
                  <Button
                    key={label}
                    type="button"
                    variant={matchStep === index + 1 ? "default" : "outline"}
                    onClick={() => setMatchStep(index + 1)}
                  >
                    {index + 1}. {label}
                  </Button>
                ))}
              </div>

              {matchStep === 1 && (
                <div className="direction-form-grid">
                  <label>
                    Data do jogo
                    <Input
                      type="date"
                      required
                      value={dateToInput(match.date)}
                      onChange={(e) => {
                        const formatted = formatMatchDate(e.target.value);
                        setMatch({ ...match, date: formatted.date, short: formatted.short });
                      }}
                    />
                  </label>

                  <label>
                    Data curta (automática)
                    <Input value={match.short} readOnly placeholder="Escolha a data do jogo" />
                  </label>
                </div>
              )}

              {matchStep === 4 && (
  <div className="my-4 space-y-4">
    <section className="space-y-4 rounded-xl border p-4">
      <h3 className="text-lg font-semibold">Revisão do confronto</h3>

      <p>
        <strong>Data:</strong> {match.date || "Data não definida"}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          Gols Time Azul
          <Input
            type="number"
            min={0}
            required
            value={match.scoreA}
            onChange={(e) =>
              setMatch({ ...match, scoreA: Number(e.target.value) })
            }
          />
        </label>

        <label>
          Gols Time Vermelho
          <Input
            type="number"
            min={0}
            required
            value={match.scoreB}
            onChange={(e) =>
              setMatch({ ...match, scoreB: Number(e.target.value) })
            }
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section>
          <h4 className="font-semibold">Time Azul</h4>
          <ul className="list-inside list-disc">
            {match.teamA.length === 0 && <li>Nenhum jogador escalado</li>}
            {match.teamA.map((id) => {
              const player = players.find((item) => item.id === id);
              return player ? <li key={id}>{player.name}{match.captainA === id && <span className="captain-mark"> Ⓒ Capitão</span>}</li> : null;
            })}
          </ul>
        </section>

        <section>
          <h4 className="font-semibold">Time Vermelho</h4>
          <ul className="list-inside list-disc">
            {match.teamB.length === 0 && <li>Nenhum jogador escalado</li>}
            {match.teamB.map((id) => {
              const player = players.find((item) => item.id === id);
              return player ? <li key={id}>{player.name}{match.captainB === id && <span className="captain-mark"> Ⓒ Capitão</span>}</li> : null;
            })}
          </ul>
        </section>
      </div>

      <section>
        <h4 className="font-semibold">Gols e assistências</h4>
        {(match.goals ?? []).length === 0 ? (
          <p>Nenhum gol registrado nos eventos.</p>
        ) : (
          <ul className="list-inside list-disc">
            {(match.goals ?? []).map((goal, index) => {
              const scorer = players.find(
                (player) => player.id === goal.scorerId,
              );
              const assister = goal.assistId
                ? players.find((player) => player.id === goal.assistId)
                : undefined;

              return (
                <li key={`review-goal-${index}`}>
                  Time {goal.team === "A" ? "Azul" : "Vermelho"}: {scorer?.name ?? "Atleta não encontrado"}{goal.ownGoal ? " (contra)" : ""}
                  {assister ? ` · assistência: ${assister.name}` : ""}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h4 className="font-semibold">Cartões</h4>
        {(match.cards ?? []).length === 0 ? (
          <p>Nenhum cartão registrado.</p>
        ) : (
          <ul className="list-inside list-disc">
            {(match.cards ?? []).map((card, index) => {
              const player = players.find(
                (item) => item.id === card.playerId,
              );
              const cardName =
                card.card === "yellow" ? "Amarelo" : card.card === "red" ? "Vermelho" : "Azul";

              return (
                <li key={`review-card-${index}`}>
                  Time {card.team === "A" ? "Azul" : "Vermelho"}: {player?.name ?? "Atleta não encontrado"} ·{" "}
                  {cardName}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  </div>
)}
              {matchStep === 3 && (
                <div className="my-4 space-y-4">
                  <section className="space-y-3">
                    <h3 className="font-semibold">Gols e assistências</h3>
                    {(match.goals ?? []).map((goal, index) => {
                      const own = goal.team === "A" ? match.teamA : match.teamB;
                      const rival = goal.team === "A" ? match.teamB : match.teamA;
                      const roster = goal.ownGoal ? rival : own;
                      const assistOptions = own.filter((id) => id !== goal.scorerId);

                      return (
                        <div key={`gol-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="self-center space-y-1">
                            <strong className="block">Gol do Time {goal.team === "A" ? "Azul" : "Vermelho"}</strong>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={!!goal.ownGoal}
                                disabled={!rival.length}
                                onChange={(e) => {
                                  const ownGoal = e.target.checked;
                                  const scorerId = (ownGoal ? rival : own)[0];
                                  if (scorerId === undefined) return;
                                  setMatch({
                                    ...match,
                                    goals: (match.goals ?? []).map((item, itemIndex) => {
                                      if (itemIndex !== index) return item;
                                      const updated = { ...item, scorerId };
                                      delete updated.assistId;
                                      if (ownGoal) updated.ownGoal = true;
                                      else delete updated.ownGoal;
                                      return updated;
                                    }),
                                  });
                                }}
                              />
                              Gol contra (feito por adversário)
                            </label>
                          </div>
                          <label>
                            {goal.ownGoal ? "Quem fez contra" : "Autor do gol"}
                            <select
                              className="w-full rounded-md border bg-background p-2"
                              value={goal.scorerId}
                              onChange={(e) => {
                                const scorerId = Number(e.target.value);
                                setMatch({
                                  ...match,
                                  goals: (match.goals ?? []).map((item, itemIndex) => {
                                    if (itemIndex !== index) return item;
                                    const updated = { ...item, scorerId };
                                    if (updated.assistId === scorerId) delete updated.assistId;
                                    return updated;
                                  }),
                                });
                              }}
                            >
                              {roster.map((id) => {
                                const player = players.find((item) => item.id === id);
                                return player ? (
                                  <option key={id} value={id}>
                                    {player.name}
                                  </option>
                                ) : null;
                              })}
                            </select>
                          </label>

                          {goal.ownGoal ? <span /> : <label>
                            Assistência
                            <select
                              className="w-full rounded-md border bg-background p-2"
                              value={goal.assistId ?? ""}
                              onChange={(e) => {
                                const assistId = e.target.value ? Number(e.target.value) : undefined;
                                setMatch({
                                  ...match,
                                  goals: (match.goals ?? []).map((item, itemIndex) => {
                                    if (itemIndex !== index) return item;
                                    const updated = { ...item };
                                    if (assistId === undefined) delete updated.assistId;
                                    else updated.assistId = assistId;
                                    return updated;
                                  }),
                                });
                              }}
                            >
                              <option value="">Sem assistência</option>
                              {assistOptions.map((id) => {
                                const player = players.find((item) => item.id === id);
                                return player ? (
                                  <option key={id} value={id}>
                                    {player.name}
                                  </option>
                                ) : null;
                              })}
                            </select>
                          </label>}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setMatch({
                                ...match,
                                goals: (match.goals ?? []).filter((_, itemIndex) => itemIndex !== index),
                              })
                            }
                          >
                            Remover gol
                          </Button>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!match.teamA.length}
                        onClick={() => {
                          const scorerId = match.teamA[0];
                          if (scorerId === undefined) return;
                          setMatch({
                            ...match,
                            goals: [...(match.goals ?? []), { team: "A", scorerId }],
                          });
                        }}
                      >
                        Adicionar gol · Time Azul
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={!match.teamB.length}
                        onClick={() => {
                          const scorerId = match.teamB[0];
                          if (scorerId === undefined) return;
                          setMatch({
                            ...match,
                            goals: [...(match.goals ?? []), { team: "B", scorerId }],
                          });
                        }}
                      >
                        Adicionar gol · Time Vermelho
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold">Cartões</h3>

                    {(match.cards ?? []).map((card, index) => {
                      const roster = card.team === "A" ? match.teamA : match.teamB;

                      return (
                        <div key={`cartao-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <strong className="self-center">Time {card.team === "A" ? "Azul" : "Vermelho"}</strong>

                          <label>
                            Jogador
                            <select
                              className="w-full rounded-md border bg-background p-2"
                              value={card.playerId}
                              onChange={(e) => {
                                const playerId = Number(e.target.value);
                                setMatch({
                                  ...match,
                                  cards: (match.cards ?? []).map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, playerId } : item,
                                  ),
                                });
                              }}
                            >
                              {roster.map((id) => {
                                const player = players.find((item) => item.id === id);
                                return player ? (
                                  <option key={id} value={id}>
                                    {player.name}
                                  </option>
                                ) : null;
                              })}
                            </select>
                          </label>

                          <label>
                            Cartão
                            <select
                              className="w-full rounded-md border bg-background p-2"
                              value={card.card}
                              onChange={(e) => {
                                const cardType = e.target.value as "yellow" | "red" | "blue";
                                setMatch({
                                  ...match,
                                  cards: (match.cards ?? []).map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, card: cardType } : item,
                                  ),
                                });
                              }}
                            >
                              <option value="yellow">Amarelo</option>
                              <option value="red">Vermelho</option>
                              <option value="blue">Azul</option>
                            </select>
                          </label>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setMatch({
                                ...match,
                                cards: (match.cards ?? []).filter((_, itemIndex) => itemIndex !== index),
                              })
                            }
                          >
                            Remover cartão
                          </Button>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!match.teamA.length}
                        onClick={() => {
                          const playerId = match.teamA[0];
                          if (playerId === undefined) return;
                          setMatch({
                            ...match,
                            cards: [...(match.cards ?? []), { team: "A", playerId, card: "yellow" }],
                          });
                        }}
                      >
                        Adicionar cartão · Time Azul
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={!match.teamB.length}
                        onClick={() => {
                          const playerId = match.teamB[0];
                          if (playerId === undefined) return;
                          setMatch({
                            ...match,
                            cards: [...(match.cards ?? []), { team: "B", playerId, card: "yellow" }],
                          });
                        }}
                      >
                        Adicionar cartão · Time Vermelho
                      </Button>
                    </div>
                  </section>
                </div>
              )}
              {matchStep === 2 && (
                <LineupEditor players={players} teamA={match.teamA} teamB={match.teamB} captainA={match.captainA} captainB={match.captainB} onChange={(lineup) => setMatch({ ...match, ...lineup })} />
              )}
              {error && (
                <p role="alert" className="direction-error">
                  {error}
                </p>
              )}
              {matchStep === 4 && (
  <Button type="submit" disabled={busy} className="w-full mt-4">
    <Save size={16} />
    Salvar confronto
  </Button>
)}
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Excluir {deleting?.name}?</DialogTitle>
          <DialogDescription>
            {deleting?.type === "player"
              ? "O jogador também será removido das escalações."
              : "O confronto será removido do histórico."}
          </DialogDescription>
          {error && <p role="alert">{error}</p>}
          <Button
            disabled={busy}
            variant="destructive"
            onClick={() =>
              run(async () => {
                if (!deleting) return;
                await save({
                  players: deleting.type === "player" ? players.filter((p) => p.id !== deleting.id) : players,
                  matches:
                    deleting.type === "match"
                      ? matches.filter((m) => m.id !== deleting.id)
                      : matches.map((m) => ({
                          ...m,
                          teamA: m.teamA.filter((id) => id !== deleting.id),
                          teamB: m.teamB.filter((id) => id !== deleting.id),
                        })),
                });
                setDeleting(null);
                setMessage("Registro excluído.");
              })
            }
          >
            Confirmar exclusão
          </Button>
        </DialogContent>
      </Dialog>{" "}
    </AdminContext.Provider>
  );
}
