import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, FlaskConical, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Note, Ready, Section, Tag, fmtDate } from "@/components/fs/page";
import { CheckInButtons } from "@/components/fs/CheckInDialog";
import { CHECKIN_KIND_LABEL, CHECKIN_STATUS_LABEL } from "@/lib/domain/checkin";
import { fillItems, nextSteps } from "@/lib/domain/progress";
import { isExpired } from "@/lib/domain/supplies";
import { NAV } from "@/lib/nav";
import { useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead("Painel", "Resumo da preparação da família para emergências: pessoas, animais, reservas e próximos passos."),
  component: Dashboard,
});

function Dashboard() {
  return (
    <Ready>
      <DashboardBody />
    </Ready>
  );
}

function DashboardBody() {
  const { data, loadDemo, phase } = useStore();
  const items = fillItems(data);
  const done = items.filter((i) => i.done).length;
  const steps = nextSteps(data);
  const isEmpty = data.people.length + data.animals.length + data.supplies.length + data.contacts.length === 0;
  const lastCheckin = data.checkins[0];

  type To = (typeof NAV)[number]["to"];
  const DESC: Partial<Record<To, string>> = {
    "/familia": "Pessoas e responsáveis",
    "/animais": "Identificação e cuidados",
    "/moradia": "Moradia e riscos observados",
    "/rede": "Contatos de confiança e check-in",
    "/reservas": "Água, alimentos e higiene",
    "/equipamentos": "Kits e manutenção",
    "/saida": "Rotas, encontro e transporte",
    "/saude": "Cuidados e informações de saúde",
    "/entretenimento": "Atividades para os dias difíceis",
    "/avisos": "Avisos e alertas registrados",
  };
  const COUNT: Partial<Record<To, string>> = {
    "/familia": `${data.people.length} pessoa(s)`,
    "/animais": `${data.animals.length} animal(is)`,
    "/rede": `${data.contacts.length} contato(s)`,
    "/reservas": `${data.supplies.length} item(ns)`,
    "/equipamentos": `${data.equipment.length} equipamento(s)`,
  };
  const expired = data.supplies.some((s) => isExpired(s.expiry));

  return (
    <div className="space-y-6">
      <section className="space-y-4 text-center">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Cuidar começa com preparação.</h1>
          <p className="mt-1 text-lg">Seu plano familiar, sempre à mão. Tudo fica guardado neste aparelho.</p>
        </div>
        <CheckInButtons hero />
        <p className="mx-auto flex w-fit items-center gap-2 rounded-full border-2 border-dashed border-attention bg-card px-4 py-1.5 text-sm font-bold">
          <FlaskConical className="size-4 text-attention" aria-hidden /> Versão de testes · Sem envio de SOS · Use dados fictícios
        </p>
        {isEmpty && phase === "ready" && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/familia">
                Começar pela família <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" onClick={loadDemo}>
              <Sparkles aria-hidden /> Carregar exemplo fictício
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="organize">
        <h2 id="organize" className="mb-3 text-2xl font-bold">Organize seu plano</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {NAV.filter((n) => n.code).map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.to}>
                <Link to={n.to} className="flex h-full min-h-24 items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-soft transition-colors hover:border-primary hover:bg-elevated">
                  <Icon className="size-10 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
                  <span className="min-w-0 flex-1 border-l border-border pl-3">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-bold leading-tight">{n.label}</span>
                      <span className="text-xs">{n.code}</span>
                    </span>
                    <span className="block text-sm">{DESC[n.to]}</span>
                    {COUNT[n.to] && <span className="mt-1 inline-block rounded-full border border-input px-2 text-sm">{COUNT[n.to]}</span>}
                    {n.to === "/reservas" && expired && (
                      <span className="mt-1 ml-1 inline-flex items-center gap-1 rounded-full border border-attention px-2 text-sm font-bold">
                        <TriangleAlert className="size-3.5 text-attention" aria-hidden /> há vencidos
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Section title={`Próximos passos (${steps.length} pendência(s))`} className="lg:col-span-3">
          {steps.length === 0 ? (
            <p className="text-muted-foreground">Nenhum passo pendente identificado a partir do cadastro. Revise as informações periodicamente.</p>
          ) : (
            <ol className="space-y-2">
              {steps.slice(0, 8).map((s, i) => (
                <li key={s.text}>
                  <Link to={s.to} className="flex min-h-11 items-center gap-3 rounded-lg border bg-background px-3 py-2 hover:bg-muted">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-bold text-foreground">{i + 1}</span>
                    <span className="flex-1">{s.text}</span>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ol>
          )}
          {steps.length > 8 && <p className="mt-2 text-sm text-muted-foreground">E mais {steps.length - 8} passo(s).</p>}
        </Section>

        <Section title="Grau de preenchimento" className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            {done} de {items.length} partes preenchidas.
          </p>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done} aria-label="Grau de preenchimento do cadastro">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-1.5">
            {items.map((i) => (
              <li key={i.label} className="flex items-center gap-2">
                {i.done ? <CheckCircle2 className="size-5 text-primary" aria-hidden /> : <Circle className="size-5 text-muted-foreground" aria-hidden />}
                <span>{i.label}</span>
                <span className="sr-only">{i.done ? "(preenchido)" : "(não preenchido)"}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Note tone="info" title="Preencher não é estar seguro">
              Este número mostra só quanto do cadastro foi preenchido. Ele não mede segurança nem garante proteção.
            </Note>
          </div>
        </Section>
      </div>

      <Section title="Último check-in">
        {lastCheckin ? (
          <p className="flex flex-wrap items-center gap-2">
            <Tag tone={lastCheckin.kind === "sos" ? "danger" : "primary"}>{CHECKIN_KIND_LABEL[lastCheckin.kind]}</Tag>
            <span>{fmtDate(lastCheckin.createdAt)}</span>
            <span className="text-sm text-muted-foreground">{CHECKIN_STATUS_LABEL}</span>
          </p>
        ) : (
          <p className="text-muted-foreground">Nenhum check-in registrado. Os botões de check-in ficam no topo do painel e em todas as telas.</p>
        )}
      </Section>

    </div>
  );
}
