import logo from "@/assets/amigos-fair-play-logo.jpeg.asset.json";
import type { Match, Player } from "./football";

export function matchArtGoals(match: Match, players: Player[], team: "A" | "B") {
  const names = new Map(players.map((p) => [p.id, p.name]));
  const groups = new Map<string, { scorer: string; assist: string | undefined; count: number }>();
  for (const goal of match.goals ?? []) {
    if (goal.team !== team) continue;
    const key = `${goal.scorerId}:${goal.assistId ?? "none"}:${goal.ownGoal ? "og" : ""}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, {
      scorer: `${names.get(goal.scorerId) ?? "Jogador não encontrado"}${goal.ownGoal ? " (contra)" : ""}`,
      assist: goal.assistId === undefined ? undefined : names.get(goal.assistId),
      count: 1,
    });
  }
  return [...groups.values()];
}

function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a logo. Tente gerar a arte novamente."));
    image.src = logo.url;
  });
}

export async function renderMatchArt(canvas: HTMLCanvasElement, match: Match, players: Player[]) {
  await document.fonts.load('700 80px "Barlow Condensed"');
  await document.fonts.load('500 28px "DM Sans"');
  const image = await loadLogo();
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem neste navegador.");
  const ctx = context;
  const style = getComputedStyle(document.documentElement);
  const color = (token: string) => style.getPropertyValue(token).trim();
  const foreground = color("--foreground");
  const muted = color("--muted-foreground");
  function text(value: string, x: number, y: number, size: number, fill = foreground, width = 960, display = false, align: CanvasTextAlign = "left") {
    ctx.font = `${display ? 700 : 500} ${size}px "${display ? "Barlow Condensed" : "DM Sans"}"`;
    while (ctx.measureText(value).width > width && size > 12) {
      size--;
      ctx.font = `${display ? 700 : 500} ${size}px "${display ? "Barlow Condensed" : "DM Sans"}"`;
    }
    ctx.fillStyle = fill;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  }
  function circleLogo(x: number, y: number, size: number) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    ctx.restore();
  }
  function shield(x: number, y: number, team: "A" | "B") {
    ctx.save();
    ctx.beginPath();ctx.moveTo(x - 74, y - 78);ctx.lineTo(x + 74, y - 78);
    ctx.lineTo(x + 74, y + 30);ctx.lineTo(x, y + 90);ctx.lineTo(x - 74, y + 30);ctx.closePath();ctx.clip();
    ctx.fillStyle = color("--team-black"); ctx.fillRect(x - 74, y - 78, 148, 168);
    ctx.fillStyle = color(team === "A" ? "--team-blue" : "--team-red");
    for (let i = 0; i < 5; i += 2) ctx.fillRect(x - 74 + i * 29.6, y - 78, 29.6, 168);
    circleLogo(x, y - 6, 106);
    ctx.restore();
  }
  ctx.fillStyle = color("--background");ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = color("--team-blue");ctx.fillRect(0, 0, 540, 12);
  ctx.fillStyle = color("--team-red");ctx.fillRect(540, 0, 540, 12);
  circleLogo(110, 106, 94);
  text("AMIGOS FAIR PLAY", 180, 104, 44, foreground, 770, true);
  text("FUTEBOL ENTRE AMIGOS", 182, 137, 18, muted);
  text(match.example ? "CONFRONTO DE EXEMPLO" : "RESULTADO FINAL", 64, 200, 24, color("--primary"));
  text("FIM DE JOGO", 60, 290, 92, foreground, 960, true);
  text(match.date, 64, 336, 28, muted);
  shield(250, 450, "A");shield(830, 450, "B");
  text("TIME AZUL", 250, 585, 44, foreground, 400, true, "center");
  text("TIME VERMELHO", 830, 585, 44, foreground, 400, true, "center");
  text(String(match.scoreA), 250, 760, 190, foreground, 390, true, "center");
  text("×", 540, 730, 64, muted, 110, false, "center");
  text(String(match.scoreB), 830, 760, 190, foreground, 390, true, "center");
  ctx.fillStyle = color("--border");ctx.fillRect(64, 800, 952, 2);
  const groups = [matchArtGoals(match, players, "A"), matchArtGoals(match, players, "B")];
  const maxRows = Math.max(...groups.map((rows) => rows.reduce((n, row) => n + (row.assist ? 2 : 1), 0)), 1);
  if (maxRows > 14) throw new Error("Esta partida tem muitos registros para caberem de forma legível em uma única arte.");
  const area = 400;
  const lineHeight = Math.min(54, area / maxRows);
  const fontSize = Math.min(38, Math.max(22, lineHeight - 8));
  groups.forEach((rows, team) => {
    const x = team === 0 ? 64 : 1016;
    const align: CanvasTextAlign = team === 0 ? "left" : "right";
    const width = 446;
    text("GOLS", x, 852, 22, muted, width, false, align);
    let y = 905;
    if (!rows.length) text("Nenhum gol registrado", x, y, 28, muted, width, false, align);
    rows.forEach((row) => {
      text(`${row.scorer}  ⚽${row.count > 1 ? ` ×${row.count}` : ""}`, x, y, fontSize, foreground, width, false, align);
      y += lineHeight;
      if (row.assist) {
        text(`Assist. · ${row.assist}`, x, y - lineHeight * 0.15, Math.max(20, fontSize - 8), muted, width, false, align);
        y += lineHeight * 0.85;
      }
    });
  });
  ctx.fillStyle = color("--border");ctx.fillRect(64, 1280, 952, 2);
  text("DENTRO DE CAMPO, RIVAIS. FORA DELE, AMIGOS.", 540, 1320, 20, muted, 952, false, "center");
}

export function matchArtBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Não foi possível exportar a imagem."));
  }, "image/png"));
}
export async function renderLineupArt(canvas: HTMLCanvasElement, match: Match, players: Player[]) {
  await document.fonts.load('700 80px "Barlow Condensed"');
  await document.fonts.load('500 28px "DM Sans"');
  const image = await loadLogo();
  canvas.width = 1080; canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem neste navegador.");
  const ctx = context;
  const style = getComputedStyle(document.documentElement);
  const color = (t: string) => style.getPropertyValue(t).trim();
  const fg = color("--foreground"), muted = color("--muted-foreground");
  function text(value: string, x: number, y: number, size: number, fill = fg, width = 960, display = false, align: CanvasTextAlign = "left") {
    const font = () => `${display ? 700 : 500} ${size}px "${display ? "Barlow Condensed" : "DM Sans"}"`;
    ctx.font = font();
    while (ctx.measureText(value).width > width && size > 12) { size--; ctx.font = font(); }
    ctx.fillStyle = fill; ctx.textAlign = align; ctx.fillText(value, x, y);
  }
  function circleLogo(x: number, y: number, size: number) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size); ctx.restore();
  }
  function shield(x: number, y: number, team: "A" | "B", s = 0.7) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-74, -78); ctx.lineTo(74, -78); ctx.lineTo(74, 30); ctx.lineTo(0, 90); ctx.lineTo(-74, 30); ctx.closePath(); ctx.clip();
    ctx.fillStyle = color("--team-black"); ctx.fillRect(-74, -78, 148, 168);
    ctx.fillStyle = color(team === "A" ? "--team-blue" : "--team-red");
    for (let i = 0; i < 5; i += 2) ctx.fillRect(-74 + i * 29.6, -78, 29.6, 168);
    ctx.restore();
    circleLogo(x, y - 4 * s, 106 * s);
  }
  ctx.fillStyle = color("--background"); ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = color("--team-blue"); ctx.fillRect(0, 0, 540, 12);
  ctx.fillStyle = color("--team-red"); ctx.fillRect(540, 0, 540, 12);
  circleLogo(110, 106, 94);
  text("AMIGOS FAIR PLAY", 180, 104, 44, fg, 770, true);
  text("FUTEBOL ENTRE AMIGOS", 182, 137, 18, muted);
  text(match.example ? "CONFRONTO DE EXEMPLO" : "ESCALAÇÕES", 64, 225, 20, color("--primary"));
  text("OS TIMES", 60, 330, 110, fg, 960, true);
  text(match.date, 64, 380, 26, muted);
  ctx.fillStyle = color("--border"); ctx.fillRect(540, 430, 2, 800);
  (["A", "B"] as const).forEach((team) => {
    const cx = team === "A" ? 290 : 790;
    const left = cx - 220;
    shield(cx - 150, 480, team);
    text(team === "A" ? "TIME AZUL" : "TIME VERMELHO", cx - 90, 500, 44, fg, 300, true);
    const ids = team === "A" ? match.teamA : match.teamB;
    const captain = team === "A" ? match.captainA : match.captainB;
    const list = ids.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => !!p)
      .sort((a, b) => (a.id === captain ? -1 : b.id === captain ? 1 : 0));
    const top = 580, avail = 640;
    const step = Math.min(64, avail / Math.max(list.length, 1));
    const size = Math.min(30, step - 10);
    if (!list.length) text("Sem escalação registrada", left, top, 22, muted, 440);
    list.forEach((p, i) => {
      const y = top + i * step;
      text(p.name + (p.id === captain ? "  Ⓒ" : ""), left, y, size, p.id === captain ? color("--primary") : fg, 360);
      text(p.position, left + 440, y, Math.max(14, size - 8), muted, 70, false, "right");
    });
  });
  ctx.fillStyle = color("--border"); ctx.fillRect(64, 1270, 952, 2);
  text("DENTRO DE CAMPO, RIVAIS. FORA DELE, AMIGOS.", 540, 1313, 17, muted, 952, false, "center");
}
