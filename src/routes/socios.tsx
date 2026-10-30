import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PlayerAvatar, PlayerDialog } from "@/components/football";
import { useFootball } from "@/components/football-state";
import { positionNames, type Player } from "@/lib/football";

export const Route = createFileRoute("/socios")({
  head: () => ({
    meta: [
      { title: "Sócios Ouro e Prata — Amigos Fair Play" },
      { name: "description", content: "Quadro de sócios Ouro e Prata da pelada Amigos Fair Play." },
      { property: "og:title", content: "Sócios — Amigos Fair Play" },
      { property: "og:description", content: "Conheça os sócios Ouro e Prata do Amigos Fair Play." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Members,
});

function Members() {
  const { players } = useFootball();
  const [selected, setSelected] = useState<Player | null>(null);
  const tiers = [
    { key: "ouro", title: "🥇 Quadro Ouro" },
    { key: "prata", title: "🥈 Quadro Prata" },
  ] as const;
  return (
    <main className="page-width main-content">
      <h1>Os sócios.</h1>
      <p className="text-muted-foreground">Os membros Ouro e Prata do Amigos Fair Play.</p>
      {tiers.map((t) => {
        const list = players.filter((p) => p.membership === t.key).sort((a, b) => a.name.localeCompare(b.name));
        return (
          <section key={t.key} className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold">
              {t.title} <small className="text-muted-foreground">({list.length})</small>
            </h2>
            {list.length === 0 ? (
              <p className="text-muted-foreground">Nenhum sócio cadastrado ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left"
                  >
                    <PlayerAvatar player={p} />
                    <span>
                      <strong className="block">{p.name}</strong>
                      <small className="text-muted-foreground">{positionNames[p.position] ?? p.position}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <PlayerDialog player={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
