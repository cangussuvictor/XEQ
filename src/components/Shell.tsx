import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
const nav = [
  { to: "/", label: "Visão geral" },
  { to: "/auditoria", label: "Auditoria de contas" },
  { to: "/bloco", label: "Bloco cirúrgico" },
] as const;
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar p-6 text-sidebar-foreground md:flex">
        <div className="font-display text-2xl">XEQ<span className="text-sidebar-primary">.</span></div>
        <p className="mt-1 text-xs opacity-60">Ciclo de receita cirúrgico</p>
        <nav className="mt-10 flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-medium" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs opacity-50">Dados de demonstração</div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <nav className="flex gap-3 border-b bg-sidebar px-4 py-3 text-sm text-sidebar-foreground md:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} activeProps={{ className: "text-sidebar-primary" }}>{n.label}</Link>)}
        </nav>
        <div className="mx-auto max-w-6xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
export function Kpi({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "bad" | "good" | "warn" }) {
  const c = { default: "text-foreground", bad: "text-destructive", good: "text-success", warn: "text-warning" }[tone];
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl ${c}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
