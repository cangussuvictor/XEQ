import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Kpi } from "../components/Shell";
import { brl, cases, glosaRisk, leakage, statusOf, type ItemStatus } from "../lib/data";

export const Route = createFileRoute("/auditoria")({
  head: () => ({ meta: [
    { title: "Auditoria de contas — XEQ" },
    { name: "description", content: "Cruzamento do prontuário com a conta do paciente para captura de cobranças." },
    { property: "og:title", content: "Auditoria de contas — XEQ" },
    { property: "og:description", content: "Cruzamento do prontuário com a conta do paciente para captura de cobranças." },
  ] }),
  component: Auditoria,
});

const badge: Record<ItemStatus, [string, string]> = {
  conferido: ["Conferido", "bg-success/15 text-success"],
  nao_cobrado: ["Não cobrado", "bg-destructive/15 text-destructive"],
  cobrado_sem_registro: ["Sem registro", "bg-warning/20 text-accent-foreground"],
  divergente: ["Divergente", "bg-warning/20 text-accent-foreground"],
};

function Auditoria() {
  const [sel, setSel] = useState(cases[0]!.id);
  const [aprovados, setAprovados] = useState<Set<string>>(new Set());
  const c = cases.find((x) => x.id === sel)!;
  const perda = c.itens.reduce((a, i) => a + leakage(i), 0);
  const glosa = c.itens.reduce((a, i) => a + glosaRisk(i), 0);
  const conf = c.itens.filter((i) => statusOf(i) === "conferido").length;
  return (
    <div>
      <h1 className="text-4xl">Auditoria de contas</h1>
      <p className="mt-2 text-muted-foreground">Tudo que foi usado no prontuário precisa estar na conta do paciente.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-2">
          {cases.map((x) => {
            const p = x.itens.reduce((a, i) => a + leakage(i) + glosaRisk(i), 0);
            return (
              <button key={x.id} onClick={() => setSel(x.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${x.id === sel ? "border-primary bg-secondary" : "bg-card hover:bg-muted"}`}>
                <div className="font-mono text-xs text-muted-foreground">{x.id}</div>
                <div className="mt-1 text-sm font-medium">{x.procedimento}</div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">{x.convenio}</span>
                  {aprovados.has(x.id) ? <span className="text-success">Liberada</span>
                    : p > 0 ? <span className="text-destructive">{brl(p)}</span> : <span className="text-success">OK</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div>
          <div className="rounded-lg border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl">{c.procedimento}</h2>
                <p className="text-sm text-muted-foreground">{c.paciente} · {c.cirurgiao} · {c.convenio} · {new Date(c.data).toLocaleDateString("pt-BR")}</p>
              </div>
              <button onClick={() => setAprovados(new Set(aprovados).add(c.id))} disabled={aprovados.has(c.id)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {aprovados.has(c.id) ? "Conta liberada" : "Ajustar e liberar conta"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Kpi label="Itens conferidos" value={`${conf}/${c.itens.length}`} tone={conf === c.itens.length ? "good" : "default"} />
            <Kpi label="A capturar" value={brl(perda)} tone={perda ? "bad" : "good"} />
            <Kpi label="Risco de glosa" value={brl(glosa)} tone={glosa ? "warn" : "good"} />
          </div>
          <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3">Item</th><th className="p-3">Fonte no prontuário</th><th className="p-3 text-center">Prontuário</th><th className="p-3 text-center">Conta</th><th className="p-3 text-right">Impacto</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {c.itens.map((i) => {
                  const st = statusOf(i); const imp = leakage(i) - glosaRisk(i);
                  return (
                    <tr key={i.item} className="border-t">
                      <td className="p-3"><div className="font-medium">{i.item}</div><div className="text-xs text-muted-foreground">{i.tipo} · {brl(i.valorUnit)}/un</div></td>
                      <td className="p-3 text-muted-foreground">{i.fonte}</td>
                      <td className="p-3 text-center font-mono">{i.prontuario}</td>
                      <td className="p-3 text-center font-mono">{i.conta}</td>
                      <td className={`p-3 text-right font-mono ${imp > 0 ? "text-destructive" : imp < 0 ? "text-warning" : "text-muted-foreground"}`}>{imp === 0 ? "—" : (imp > 0 ? "+" : "−") + brl(Math.abs(imp))}</td>
                      <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[st][1]}`}>{badge[st][0]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
