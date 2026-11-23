import { createFileRoute, Link } from "@tanstack/react-router";
import { Kpi } from "../components/Shell";
import { agenda, brl, cancelamentos, cases, glosaRisk, leakage, riskScore } from "../lib/data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Visão geral — Lumen RCM" },
    { name: "description", content: "Receita recuperada, risco de glosa e eficiência do bloco cirúrgico." },
    { property: "og:title", content: "Visão geral — Lumen RCM" },
    { property: "og:description", content: "Receita recuperada, risco de glosa e eficiência do bloco cirúrgico." },
  ] }),
  component: Index,
});

function Index() {
  const itens = cases.flatMap((c) => c.itens);
  const perda = itens.reduce((a, i) => a + leakage(i), 0);
  const glosa = itens.reduce((a, i) => a + glosaRisk(i), 0);
  const altoRisco = agenda.filter((s) => riskScore(s) >= 30).length;
  const totalCanc = cancelamentos.reduce((a, c) => a + c.qtd, 0);
  return (
    <div>
      <p className="text-sm text-muted-foreground">Segunda, 23 de novembro</p>
      <h1 className="mt-1 text-4xl">Cada item usado, cobrado. Cada sala, ocupada.</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita não capturada" value={brl(perda)} hint={`${cases.length} contas auditadas`} tone="bad" />
        <Kpi label="Risco de glosa" value={brl(glosa)} hint="Cobrado sem registro" tone="warn" />
        <Kpi label="Cirurgias hoje" value={String(agenda.length)} hint={`${altoRisco} com risco de cancelamento`} />
        <Kpi label="Cancelamentos (30d)" value={String(totalCanc)} hint="Taxa 8,4% · meta 4%" tone="bad" />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link to="/auditoria" className="group rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
          <h2 className="text-2xl">Auditoria de contas</h2>
          <p className="mt-2 text-sm text-muted-foreground">Cruzamento da folha de sala, ficha anestésica, prescrição e descrição cirúrgica com a conta do paciente.</p>
          <span className="mt-4 inline-block text-sm font-medium text-primary group-hover:underline">Abrir auditoria →</span>
        </Link>
        <Link to="/bloco" className="group rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
          <h2 className="text-2xl">Bloco cirúrgico</h2>
          <p className="mt-2 text-sm text-muted-foreground">Checklist pré-operatório com risco de cancelamento e janelas livres para encaixe de cirurgias.</p>
          <span className="mt-4 inline-block text-sm font-medium text-primary group-hover:underline">Abrir mapa do bloco →</span>
        </Link>
      </div>
    </div>
  );
}
