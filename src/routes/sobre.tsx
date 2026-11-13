import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Download, Upload, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, Note, PageHeader, Ready, Section, Tag, fmtDate } from "@/components/fs/page";
import { SCHEMA_VERSION } from "@/lib/storage/persist";
import { useStore } from "@/lib/storage/store";
import { PWA_STATUS_LABEL, subscribePwa, warmPages, type PwaState } from "@/lib/pwa";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/sobre")({
  head: () => pageHead("Sobre esta versão", "O que funciona neste aparelho, o que depende de internet e o que ainda está pendente."),
  component: AboutPage,
});

const LOCAL = [
  "Cadastro dos 10 módulos, com edição e exclusão confirmada.",
  "Dados salvos neste navegador (armazenamento local), com versão de formato e proteção contra leitura com falha.",
  "Cálculos aritméticos (idade, faixas, água com seus valores, faltas, lugares nos veículos, dias de estoque).",
  "Check-in “Está tudo bem” / “Socorro” registrado apenas neste aparelho — não enviado.",
  "Cópia de segurança manual: baixar e importar arquivo.",
];
const NEEDS_NET = [
  "Primeiro acesso ao aplicativo (baixar as telas).",
  "Abrir páginas originais dos avisos (links https).",
  "Verificar atualização do aplicativo.",
  "Ligações dependem da rede telefônica do aparelho, não da internet do aplicativo.",
];
const PENDING = [
  "Servidor (backend) e envio real de check-in/SOS para contatos: não existe nesta versão.",
  "Sincronização entre aparelhos: não existe. Cada navegador tem seus próprios dados.",
  "Autenticação, criptografia e acesso controlado: pendentes de validação. Por isso, use apenas dados fictícios.",
  "Mapas, rotas e trânsito: não integrados.",
  "Fontes oficiais automáticas de avisos e notificações: não integradas.",
  "Homologação clínica de conteúdo de saúde, cardápios e metas de reservas: pendente.",
  "Teste do aplicativo nativo (Android/iOS) com esta versão web: não realizado. Esta versão web não altera o aplicativo instalado.",
  "Requisitos funcionais: base integrada criada; não estão concluídos nem homologados.",
];

function AboutPage() {
  return (
    <>
      <PageHeader title="Sobre esta versão" description="Versão web complementar de testes do Família Segura. Não substitui nem atualiza o aplicativo instalado no celular." />
      <Ready>
        <AboutBody />
      </Ready>
    </>
  );
}

function AboutBody() {
  const { data, savedAt, phase, exportText, importText } = useStore();
  const [pwa, setPwa] = useState<PwaState | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const unsub = subscribePwa(setPwa);
    return () => {
      unsub();
    };
  }, []);

  const download = () => {
    const blob = new Blob([exportText()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `familia-segura-copia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const total = data.people.length + data.animals.length + data.contacts.length + data.supplies.length + data.equipment.length + data.vehicles.length + data.destinations.length + data.kit.length + data.treatments.length + data.notices.length + data.checkins.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Funciona neste aparelho" icon={<CheckCircle2 className="text-primary" />} items={LOCAL} />
        <ListCard title="Depende de conexão" icon={<Wifi className="text-info" />} items={NEEDS_NET} />
        <ListCard title="Pendente" icon={<Clock className="text-muted-foreground" />} items={PENDING} />
      </div>

      <Section title="Reabrir sem internet" description="Guardar dados no aparelho é diferente de conseguir abrir o aplicativo sem internet.">
        <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <dt className="font-bold">Situação neste navegador</dt>
          <dd>
            <Tag tone={pwa?.status === "pronto" ? "primary" : pwa?.status === "atualizado" ? "info" : "pending"}>{pwa ? PWA_STATUS_LABEL[pwa.status] : "Verificando…"}</Tag>
            {pwa?.detail && <span className="ml-2 text-sm">{pwa.detail}</span>}
          </dd>
          {pwa && (pwa.status === "pronto" || pwa.status === "atualizado") && (
            <>
              <dt className="font-bold">Telas guardadas</dt>
              <dd>
                {pwa.pagesCached} de 12 {pwa.lastWarm && `(em ${fmtDate(pwa.lastWarm)})`}
                <Button size="sm" variant="outline" className="ml-3" onClick={() => void warmPages()}>
                  Guardar telas de novo
                </Button>
              </dd>
            </>
          )}
        </dl>
        <div className="mt-4 space-y-3">
          {pwa?.status === "atualizado" && (
            <Note tone="info" title="Atualização disponível">
              Uma nova versão foi instalada. <Button size="sm" variant="link" onClick={() => location.reload()}>Recarregar agora</Button>
            </Note>
          )}
          <Note tone="info" title="Como funciona">
            No endereço publicado, depois do primeiro acesso com internet, o navegador guarda uma cópia das telas e do código do aplicativo (nunca os seus dados, que já
            ficam no armazenamento local). Nesta prévia de revisão esse recurso fica desligado de propósito. Mesmo no endereço publicado, confirme abrindo o aplicativo
            em modo avião antes de depender disso.
          </Note>
        </div>
      </Section>

      <Section title="Dados neste navegador">
        <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <dt className="font-bold">Situação</dt>
          <dd>{phase === "ready" ? "Lidos e salvando normalmente" : phase === "blocked" ? "Leitura falhou — salvamento bloqueado" : phase === "memory" ? "Sem armazenamento local" : "Lendo…"}</dd>
          <dt className="font-bold">Formato dos dados</dt>
          <dd>Versão {SCHEMA_VERSION}</dd>
          <dt className="font-bold">Último salvamento</dt>
          <dd>{savedAt ? fmtDate(savedAt) : "Nenhum ainda"}</dd>
          <dt className="font-bold">Registros</dt>
          <dd>{total}</dd>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={download}>
            <Download aria-hidden /> Baixar cópia de segurança
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden /> Importar cópia
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Arquivo de cópia de segurança"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 5_000_000) {
                setMessage("Arquivo grande demais (limite 5 MB). Nada foi alterado.");
                return;
              }
              setPendingImport(await f.text());
            }}
          />
        </div>
        {message && (
          <p className="mt-3 font-bold" role="status">
            {message}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">O arquivo baixado não é criptografado. Guarde-o com cuidado e não envie a terceiros.</p>
        <ConfirmDialog
          open={pendingImport !== null}
          onOpenChange={(o) => !o && setPendingImport(null)}
          title="Substituir os dados deste navegador?"
          description="Os dados atuais serão guardados como cópia de segurança interna e substituídos pelo conteúdo do arquivo."
          confirmLabel="Importar e substituir"
          onConfirm={() => {
            if (pendingImport) setMessage(importText(pendingImport).message);
            setPendingImport(null);
          }}
        />
      </Section>

      <Note tone="attention" title="Versão de testes">
        Use apenas dados fictícios. Os dados ficam sem criptografia neste navegador e qualquer pessoa com acesso a este aparelho pode vê-los.
      </Note>
    </div>
  );
}

function ListCard({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <span aria-hidden className="[&_svg]:size-6">{icon}</span>
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  );
}
