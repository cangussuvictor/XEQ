import { createFileRoute } from "@tanstack/react-router";
import { Kpi } from "../components/Shell";
import { agenda, cancelamentos, checklistLabels, riskScore, SALA_JANELA, TURNOVER_H, type Surgery } from "../lib/data";

export const Route = createFileRoute("/bloco")({
  head: () => ({ meta: [
    { title: "Bloco cirúrgico — Lumen RCM" },
    { name: "description", content: "Risco de cancelamento, ocupação de salas e encaixes no bloco cirúrgico." },
    { property: "og:title", content: "Bloco cirúrgico — Lumen RCM" },
    { property: "og:description", content: "Risco de cancelamento, ocupação de salas e encaixes no bloco cirúrgico." },
  ] }),
  component: Bloco,
});

const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;
const total = SALA_JANELA.fim - SALA_JANELA.inicio;

function gaps(list: Surgery[]) {
  const out: { de: number; ate: number }[] = []; let t = SALA_JANELA.inicio;
  for (const s of [...list].sort((a, b) => a.inicio - b.inicio)) {
    if (s.inicio - t >= 1) out.push({ de: t, ate: s.inicio });
    t = Math.max(t, s.inicio + s.duracao + TURNOVER_H);
  }
  if (SALA_JANELA.fim - t >= 1) out.push({ de: t, ate: SALA_JANELA.fim });
  return out;
}

function Bloco() {
  const salas = [...new Set(agenda.map((s) => s.sala))];
  const usado = agenda.reduce((a, s) => a + s.duracao, 0);
  const ocup = (usado / (salas.length * total)) * 100;
  const livres = salas.flatMap((s) => gaps(agenda.filter((x) => x.sala === s)).map((g) => ({ sala: s, ...g })));
  const encaixes = livres.reduce((a, g) => a + Math.floor((g.ate - g.de) / (1 + TURNOVER_H)), 0);
  const risco = [...agenda].map((s) => ({ s, r: riskScore(s) })).filter((x) => x.r > 0).sort((a, b) => b.r - a.r);
  const maxC = Math.max(...cancelamentos.map((c) => c.qtd));
  return (
    <div>
      <h1 className="text-4xl">Bloco cirúrgico</h1>
      <p className="mt-2 text-muted-foreground">Menos cancelamentos, mais cirurgias por dia.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ocupação das salas" value={`${ocup.toFixed(0)}%`} hint={`${salas.length} salas · ${fmt(SALA_JANELA.inicio)}–${fmt(SALA_JANELA.fim)}`} tone={ocup >= 75 ? "good" : "warn"} />
        <Kpi label="Cirurgias agendadas" value={String(agenda.length)} />
        <Kpi label="Encaixes possíveis" value={`+${encaixes}`} hint="Procedimentos de 1h" tone="good" />
        <Kpi label="Em risco de cancelar" value={String(risco.filter((x) => x.r >= 30).length)} tone="bad" />
      </div>

      <section className="mt-10 rounded-lg border bg-card p-5">
        <h2 className="text-2xl">Mapa do dia</h2>
        <div className="mt-4 space-y-3">
          {salas.map((sala) => (
            <div key={sala} className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-sm font-medium">{sala}</div>
              <div className="relative h-12 flex-1 rounded-md bg-muted">
                {gaps(agenda.filter((x) => x.sala === sala)).map((g) => (
                  <div key={g.de} className="absolute inset-y-1 rounded border-2 border-dashed border-success/60"
                    style={{ left: `${((g.de - SALA_JANELA.inicio) / total) * 100}%`, width: `${((g.ate - g.de) / total) * 100}%` }} title="Janela livre" />
                ))}
                {agenda.filter((x) => x.sala === sala).map((s) => {
                  const r = riskScore(s);
                  return (
                    <div key={s.paciente} title={`${s.procedimento} · ${s.paciente}`}
                      className={`absolute inset-y-1 overflow-hidden rounded px-2 py-1 text-xs ${r >= 30 ? "bg-destructive text-destructive-foreground" : r > 0 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}
                      style={{ left: `${((s.inicio - SALA_JANELA.inicio) / total) * 100}%`, width: `${(s.duracao / total) * 100}%` }}>
                      <div className="truncate font-medium">{s.procedimento}</div>
                      <div className="truncate opacity-80">{fmt(s.inicio)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>■ <span className="text-primary">Pronta</span></span><span>■ <span className="text-warning">Atenção</span></span>
          <span>■ <span className="text-destructive">Alto risco</span></span><span className="text-success">┅ Janela livre para encaixe</span>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-2xl">Pendências pré-operatórias</h2>
          <div className="mt-4 space-y-3">
            {risco.map(({ s, r }) => (
              <div key={s.paciente} className="rounded-md border p-3">
                <div className="flex justify-between gap-2">
                  <div><div className="text-sm font-medium">{s.procedimento}</div><div className="text-xs text-muted-foreground">{s.paciente} · {s.sala} · {fmt(s.inicio)}</div></div>
                  <span className={`h-fit rounded-full px-2 py-1 text-xs font-medium ${r >= 30 ? "bg-destructive/15 text-destructive" : "bg-warning/20 text-accent-foreground"}`}>Risco {r}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(Object.keys(s.checklist) as (keyof Surgery["checklist"])[]).filter((k) => !s.checklist[k]).map((k) => (
                    <span key={k} className="rounded bg-muted px-2 py-0.5 text-xs">Falta: {checklistLabels[k]}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-2xl">Motivos de cancelamento (30 dias)</h2>
          <div className="mt-4 space-y-3">
            {cancelamentos.map((c) => (
              <div key={c.motivo}>
                <div className="flex justify-between text-sm"><span>{c.motivo}</span><span className="font-mono">{c.qtd}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(c.qtd / maxC) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Autorização e exames somam a maioria dos cancelamentos — ambos evitáveis com checklist 72h antes.</p>
        </section>
      </div>
    </div>
  );
}
