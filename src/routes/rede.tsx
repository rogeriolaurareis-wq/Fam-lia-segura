import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Phone, ShieldPlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddButton, ConfirmDialog, DL, EmptyState, FormActions, Note, PageHeader, Ready, RecordActions, RecordCard, Section, Tag, fmtDate } from "@/components/fs/page";
import { FormErrorSummary, SelectField, TextAreaField, TextField } from "@/components/fs/fields";
import { CheckInDialog, EmergencyNumbers } from "@/components/fs/CheckInDialog";
import { CHECKIN_KIND_LABEL, checkInStatusLabel } from "@/lib/domain/checkin";
import { countLinks } from "@/lib/domain/links";
import { hasErrors, normalizePhone, validateContact, type Errs } from "@/lib/domain/validate";
import type { Contact, Person } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/rede")({
  head: () => pageHead("Rede e check-in", "Contatos de emergência e registro local de “Está tudo bem” e “Socorro”."),
  component: NetworkPage,
});

const PRIORITY_LABEL: Record<Contact["priority"], string> = { alta: "Prioridade alta", media: "Prioridade média", baixa: "Prioridade baixa" };
const PRIORITY_ORDER: Record<Contact["priority"], number> = { alta: 0, media: 1, baixa: 2 };

function newContact(): Contact {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now, name: "", phone: "", relation: "", priority: "media", notes: "" };
}

function NetworkPage() {
  const { data, upsert, remove, update } = useStore();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [kind, setKind] = useState<"ok" | "sos" | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  if (editing)
    return (
      <Ready>
        <ContactForm initial={editing} onCancel={() => setEditing(null)} onSave={(c) => upsert("contacts", { ...c, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );

  const contacts = [...data.contacts].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return (
    <>
      <PageHeader code="M04" title="Rede e check-in" description="Pessoas para quem ligar e um registro local de como vocês estão." />
      <Ready>
        <div className="space-y-6">
          <Section title="Check-in" description="Registra no histórico deste aparelho, com data e hora.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="safe" size="lg" onClick={() => setKind("ok")}>
                <CheckCircle2 aria-hidden /> ESTÁ TUDO BEM
              </Button>
              <Button variant="sos" size="lg" onClick={() => setKind("sos")}>
                <ShieldPlus aria-hidden /> SOCORRO
              </Button>
            </div>
            <div className="mt-4">
              <Note tone="attention" title="Nada é enviado">
                Esta versão não tem serviço de envio. Mesmo com internet, o check-in é <strong>registrado neste aparelho — não enviado</strong>. Contatos e
                autoridades não são avisados.
              </Note>
            </div>
            <CheckInDialog kind={kind ?? "ok"} open={kind !== null} onOpenChange={(o) => !o && setKind(null)} />

            <h3 className="mt-6 text-lg font-semibold">Histórico local</h3>
            {data.checkins.length === 0 ? (
              <p className="mt-1 text-muted-foreground">Nenhum check-in registrado ainda.</p>
            ) : (
              <>
                <ul className="mt-2 divide-y rounded-xl border">
                  {data.checkins.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                      <Tag tone={c.kind === "sos" ? "danger" : "primary"}>{CHECKIN_KIND_LABEL[c.kind]}</Tag>
                      <span className="font-bold">{fmtDate(c.createdAt)}</span>
                      <span className="text-sm text-muted-foreground">{checkInStatusLabel(c)}</span>
                      {c.note && <span className="w-full text-sm">“{c.note}”</span>}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setClearOpen(true)}>
                  <Trash2 aria-hidden /> Apagar histórico
                </Button>
                <ConfirmDialog
                  open={clearOpen}
                  onOpenChange={setClearOpen}
                  title="Apagar todo o histórico de check-in?"
                  description="Os registros serão removidos deste aparelho. Isso não pode ser desfeito."
                  confirmLabel="Apagar histórico"
                  onConfirm={() => update((d) => ({ ...d, checkins: [] }))}
                />
              </>
            )}
          </Section>

          <Section title="Vínculos das pessoas" description="Defina aqui a relação, o responsável e o contato de emergência de cada pessoa da sua casa.">
            {data.people.length ? data.people.map(p => <PersonLinks key={p.id} person={p} people={data.people} contacts={data.contacts} onSave={next => upsert("people", { ...next, updatedAt: nowIso() })} />) : <p>Cadastre primeiro as pessoas em Minha família.</p>}
          </Section>

          <Section title="Contatos" actions={<AddButton onClick={() => setEditing(newContact())}>Adicionar contato</AddButton>}>
            {contacts.length === 0 ? (
              <EmptyState icon={<Phone />} title="Nenhum contato" text="Cadastre pessoas de confiança para ligar em uma emergência." action={<AddButton onClick={() => setEditing(newContact())}>Adicionar contato</AddButton>} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {contacts.map((c) => (
                  <RecordCard
                    key={c.id}
                    title={c.name}
                    subtitle={c.relation}
                    tags={
                      <>
                        {c.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                        <Tag tone={c.priority === "alta" ? "info" : "neutral"}>{PRIORITY_LABEL[c.priority]}</Tag>
                      </>
                    }
                    actions={
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="info" size="sm">
                          <a href={`tel:${normalizePhone(c.phone)}`} aria-label={`Abrir discador para ${c.name}`}>
                            <Phone aria-hidden /> Ligar {c.phone}
                          </a>
                        </Button>
                        <RecordActions name={c.name} onEdit={() => setEditing(c)} onDelete={() => remove("contacts", c.id)} linkedCount={countLinks(data, "contacts", c.id)} />
                      </div>
                    }
                  >
                    <DL items={[["Observações", c.notes]]} />
                  </RecordCard>
                ))}
              </div>
            )}
            <p className="mt-4 text-sm text-muted-foreground">“Ligar” só abre o discador do aparelho. Isso não confirma que a chamada foi feita ou atendida.</p>
          </Section>

          <Section title="Serviços públicos de emergência">
            <EmergencyNumbers />
          </Section>
        </div>
      </Ready>
    </>
  );
}

function ContactForm({ initial, onSave, onCancel }: { initial: Contact; onSave: (c: Contact) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [c, setC] = useState(initial);
  const [errors, setErrors] = useState<Errs<Contact>>({});
  const set = <K extends keyof Contact>(k: K, v: Contact[K]) => setC((p) => ({ ...p, [k]: v }));
  const isNew = !data.contacts.some((x) => x.id === initial.id);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateContact(c);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...c, name: c.name.trim(), phone: c.phone.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M04" title={isNew ? "Novo contato" : `Editar: ${initial.name}`} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Nome" value={c.name} onChange={(v) => set("name", v)} error={errors.name} maxLength={80} />
          <TextField label="Telefone com DDD" type="tel" inputMode="tel" value={c.phone} onChange={(v) => set("phone", v)} error={errors.phone} maxLength={25} />
          <TextField label="Relação" optional hint="Ex.: vizinha, tio, síndico" value={c.relation} onChange={(v) => set("relation", v)} />
          <SelectField
            label="Prioridade"
            value={c.priority}
            onChange={(v) => set("priority", v)}
            options={[
              { value: "alta", label: "Alta" },
              { value: "media", label: "Média" },
              { value: "baixa", label: "Baixa" },
            ]}
          />
          <div className="sm:col-span-2">
            <TextAreaField label="Observações" optional value={c.notes} onChange={(v) => set("notes", v)} />
          </div>
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function PersonLinks({ person, people, contacts, onSave }: { person: Person; people: Person[]; contacts: Contact[]; onSave: (p: Person) => boolean }) {
  const [p, setP] = useState(person);
  const [saved, setSaved] = useState(false);
  const change = (changes: Partial<Person>) => { setP(prev => ({ ...prev, ...changes })); setSaved(false); };
  return <form className="mb-4 space-y-4 rounded-xl border p-4" onSubmit={e => { e.preventDefault(); setSaved(onSave(p)); }}>
    <h3 className="text-lg font-bold">{person.name}</h3>
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label={`Vínculo de ${person.name}`} optional hint="Ex.: mãe, filho, avó, amigo" value={p.relation} onChange={relation => change({ relation })} />
      <SelectField label={`Responsável por ${person.name}`} optional value={p.responsibleId ?? ""} placeholder="Nenhum" options={people.filter(o => o.id !== p.id).map(o => ({ value: o.id, label: o.name }))} onChange={v => change({ responsibleId: v || null })} />
      <SelectField label={`Contato de emergência de ${person.name}`} optional value={p.emergencyContactId ?? ""} placeholder="Nenhum" options={contacts.map(c => ({ value: c.id, label: `${c.name} — ${c.phone}` }))} onChange={v => change({ emergencyContactId: v || null })} />
    </div>
    <Button type="submit">Salvar vínculos de {person.name}</Button>
    {saved && <p role="status">Vínculos salvos neste aparelho.</p>}
  </form>;
}
