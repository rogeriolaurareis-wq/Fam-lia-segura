import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Megaphone } from "lucide-react";

import { AddButton, DL, EmptyState, FormActions, Note, PageHeader, PendingList, Ready, RecordActions, RecordCard, Section, Tag, fmtDate } from "@/components/fs/page";
import { FormErrorSummary, TextAreaField, TextField } from "@/components/fs/fields";
import { NOTICE_MANUAL_LABEL, isHttpsUrl, isNoticeExpired } from "@/lib/domain/notices";
import { hasErrors, validateNotice, type Errs } from "@/lib/domain/validate";
import type { Notice } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/avisos")({
  head: () => pageHead("Avisos", "Registro manual de avisos de órgãos oficiais, com fonte, área, validade e instruções."),
  component: NoticesPage,
});

function newNotice(): Notice {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now, title: "", source: "", url: "", area: "", publishedAt: "", timezone: "America/Sao_Paulo", validUntil: "", instructions: "" };
}

function NoticesPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Notice | null>(null);

  if (editing)
    return (
      <Ready>
        <NoticeForm initial={editing} onCancel={() => setEditing(null)} onSave={(n) => upsert("notices", { ...n, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );

  const sorted = [...data.notices].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));

  return (
    <>
      <PageHeader code="M10" title="Avisos" description="Copie aqui avisos que você leu em canais oficiais, para consultar depois.">
        <AddButton onClick={() => setEditing(newNotice())}>Registrar aviso</AddButton>
      </PageHeader>
      <Ready>
        <div className="space-y-6">
          <Note tone="attention" title="Sem avisos automáticos">
            Esta versão não recebe alertas em tempo real nem notificações. A ausência de avisos aqui <strong>não</strong> significa ausência de perigo. Acompanhe os
            canais oficiais da Defesa Civil.
          </Note>
          {sorted.length === 0 ? (
            <EmptyState icon={<Megaphone />} title="Nenhum aviso registrado" text="Quando ler um aviso oficial, registre título, órgão, área e validade para consultar sem internet." action={<AddButton onClick={() => setEditing(newNotice())}>Registrar aviso</AddButton>} />
          ) : (
            <div className="grid gap-4">
              {sorted.map((n) => {
                const expired = isNoticeExpired(n.validUntil);
                return (
                  <RecordCard
                    key={n.id}
                    title={n.title}
                    subtitle={`${n.source}${n.area ? ` · ${n.area}` : ""}`}
                    tags={
                      <>
                        {n.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                        <Tag tone="pending">{NOTICE_MANUAL_LABEL}</Tag>
                        {expired && <Tag tone="attention">Vencido</Tag>}
                      </>
                    }
                    actions={<RecordActions name={n.title} onEdit={() => setEditing(n)} onDelete={() => remove("notices", n.id)} />}
                  >
                    <DL
                      items={[
                        ["Publicado em", n.publishedAt ? `${fmtDate(n.publishedAt)} (${n.timezone})` : ""],
                        ["Válido até", n.validUntil ? `${fmtDate(n.validUntil)} (${n.timezone})` : "Não informado"],
                        ["Instruções", n.instructions],
                        [
                          "Fonte",
                          n.url && isHttpsUrl(n.url) ? (
                            <a href={n.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-foreground underline decoration-primary decoration-2">
                              Abrir página original <ExternalLink className="size-4" aria-hidden />
                            </a>
                          ) : (
                            ""
                          ),
                        ],
                      ]}
                    />
                  </RecordCard>
                );
              })}
            </div>
          )}
          <PendingList items={["Fontes oficiais automáticas (Defesa Civil, INMET, Cemaden): não integradas.", "Notificações push e alertas em tempo real: não implementados."]} />
        </div>
      </Ready>
    </>
  );
}

function NoticeForm({ initial, onSave, onCancel }: { initial: Notice; onSave: (n: Notice) => void; onCancel: () => void }) {
  const [n, setN] = useState(initial);
  const [errors, setErrors] = useState<Errs<Notice>>({});
  const set = <K extends keyof Notice>(k: K, v: Notice[K]) => setN((p) => ({ ...p, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateNotice(n);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...n, title: n.title.trim(), url: n.url.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M10" title={initial.title ? `Editar: ${initial.title}` : "Registrar aviso"} description={NOTICE_MANUAL_LABEL} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Título" value={n.title} onChange={(v) => set("title", v)} error={errors.title} maxLength={150} />
          <TextField label="Órgão ou fonte" hint="Ex.: Defesa Civil municipal" value={n.source} onChange={(v) => set("source", v)} error={errors.source} />
          <TextField label="Endereço da página (https)" optional type="url" placeholder="https://" value={n.url} onChange={(v) => set("url", v)} error={errors.url} maxLength={500} />
          <TextField label="Área afetada" optional value={n.area} onChange={(v) => set("area", v)} />
          <TextField label="Data e hora da publicação" type="datetime-local" value={n.publishedAt} onChange={(v) => set("publishedAt", v)} error={errors.publishedAt} />
          <TextField label="Fuso horário da publicação" hint="Ex.: America/Sao_Paulo (Brasília)" value={n.timezone} onChange={(v) => set("timezone", v)} error={errors.timezone} />
          <TextField label="Válido até" optional type="datetime-local" value={n.validUntil} onChange={(v) => set("validUntil", v)} error={errors.validUntil} />
          <div className="sm:col-span-2">
            <TextAreaField label="Instruções do aviso" optional value={n.instructions} onChange={(v) => set("instructions", v)} rows={4} />
          </div>
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
