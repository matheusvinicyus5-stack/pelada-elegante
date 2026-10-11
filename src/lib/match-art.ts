import logo from "@/assets/amigos-fair-play-logo.jpeg.asset.json";
import type { Match, Player } from "./football";

export function matchArtGoals(match: Match, players: Player[], team: "A" | "B") {
  const names = new Map(players.map((p) => [p.id, p.name]));
  const groups = new Map<string, { scorer: string; assist: string | undefined; count: number }>();
  for (const goal of match.goals ?? []) {
    if (goal.team !== team) continue;
    const key = `${goal.scorerId}:${goal.assistId ?? "none"}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, {
      scorer: names.get(goal.scorerId) ?? "Jogador não encontrado",
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
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem neste navegador.");
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
  text(match.example ? "CONFRONTO DE EXEMPLO" : "RESULTADO FINAL", 64, 225, 20, color("--primary"));
  text("FIM DE JOGO", 60, 345, 116, foreground, 960, true);
  text(match.date, 64, 398, 26, muted);
  shield(250, 534, "A");shield(830, 534, "B");
  text("TIME AZUL", 250, 669, 42, foreground, 400, true, "center");
  text("TIME VERMELHO", 830, 669, 42, foreground, 400, true, "center");
  text(String(match.scoreA), 340, 884, 220, foreground, 390, true, "center");
  text("×", 540, 848, 64, muted, 110, false, "center");
  text(String(match.scoreB), 740, 884, 220, foreground, 390, true, "center");
  ctx.fillStyle = color("--border");ctx.fillRect(64, 926, 952, 2);
  const groups = [matchArtGoals(match, players, "A"), matchArtGoals(match, players, "B")];
  const maxRows = Math.max(...groups.map((rows) => rows.reduce((n, row) => n + (row.assist ? 2 : 1), 0)), 1);
  if (maxRows > 14) throw new Error("Esta partida tem muitos registros para caberem de forma legível em uma única arte.");
  const lineHeight = Math.min(39, 238 / maxRows);
  const fontSize = Math.min(25, lineHeight - 3);
  groups.forEach((rows, team) => {
    const x = team === 0 ? 64 : 580;
    text("GOLS", x, 973, 16, muted);
    let y = 1015;
    if (!rows.length) text("Nenhum gol registrado", x, y, 20, muted, 436);
    rows.forEach((row) => {
      text(`${row.scorer}  ⚽${row.count > 1 ? ` ×${row.count}` : ""}`, x, y, fontSize, foreground, 436);
      y += lineHeight;
      if (row.assist) {
        text(`Assistência · ${row.assist}`, x, y, Math.max(14, fontSize - 4), muted, 436);
        y += lineHeight;
      }
    });
  });
  ctx.fillStyle = color("--border");ctx.fillRect(64, 1270, 952, 2);
  text("DENTRO DE CAMPO, RIVAIS. FORA DELE, AMIGOS.", 540, 1313, 17, muted, 952, false, "center");
}

export function matchArtBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("Não foi possível exportar a imagem."));
  }, "image/png"));
}