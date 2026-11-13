import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddButton, DL, EmptyState, Note, PageHeader, Ready, RecordActions, RecordCard, Section, Tag, TestDataWarning } from "@/components/fs/page";
import { CheckField, FieldError, FormErrorSummary, NumberField, SelectField, TextAreaField, TextField } from "@/components/fs/fields";
import { ageLabel, bandForPerson } from "@/lib/domain/age";
import { ABO_OPTIONS, RH_OPTIONS, bloodLabel } from "@/lib/domain/blood";
import { countLinks } from "@/lib/domain/links";
import { hasErrors, validatePerson, type Errs } from "@/lib/domain/validate";
import { AGE_BANDS, AGE_BAND_LABEL, type Person } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/familia")({
  head: () => pageHead("Minha família", "Cadastro das pessoas da família, com idade, necessidades e vínculos."),
  component: FamilyPage,
});

function newPerson(): Person {
  const now = nowIso();
  return {
    id: newId(), createdAt: now, updatedAt: now, name: "", relation: "", birthDate: "", ageBand: "", sex: "",
    weightKg: null, heightCm: null, abo: "nao_sei", rh: "nao_sei", bloodDocConfirmed: false, bloodDocNote: "",
    conditions: "", allergies: "", disability: "", mobility: "", dependency: "", pregnancy: "", childNeeds: "",
    continuousUse: false, responsibleId: null, emergencyContactId: null, notes: "",
  };
}

const STEPS = ["Identificação", "Corpo e sangue", "Saúde e necessidades", "Vínculos"] as const;
type PersonErrs = Errs<Person, "blood">;
type ErrKey = keyof PersonErrs;
const STEP_FIELDS: readonly (readonly ErrKey[])[] = [["name", "birthDate"], ["weightKg", "heightCm", "blood"], [], ["responsibleId"]];

function FamilyPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Person | null>(null);

  if (editing)
    return (
      <Ready>
        <PersonForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(p) => {
            if (upsert("people", { ...p, updatedAt: nowIso() })) setEditing(null);
          }}
        />
      </Ready>
    );

  return (
    <>
      <PageHeader code="M01" title="Minha família" description="Somente pessoas. Remédios, alimentos e suprimentos ficam em outros módulos.">
        <AddButton onClick={() => setEditing(newPerson())}>Adicionar pessoa</AddButton>
      </PageHeader>
      <Ready>
        {data.people.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Nenhuma pessoa cadastrada"
            text="Comece por quem mora com você. Só o nome é obrigatório; o resto pode ser preenchido aos poucos."
            action={<AddButton onClick={() => setEditing(newPerson())}>Adicionar a primeira pessoa</AddButton>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.people.map((p) => {
              const responsible = data.people.find((x) => x.id === p.responsibleId);
              const contact = data.contacts.find((c) => c.id === p.emergencyContactId);
              const band = bandForPerson(p);
              return (
                <RecordCard
                  key={p.id}
                  title={p.name}
                  subtitle={[p.relation, ageLabel(p)].filter(Boolean).join(" · ")}
                  tags={
                    <>
                      {p.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                      {band && <Tag tone="info">Faixa {band}</Tag>}
                      {p.continuousUse && <Tag tone="attention">Uso contínuo</Tag>}
                    </>
                  }
                  actions={
                    <RecordActions name={p.name} onEdit={() => setEditing(p)} onDelete={() => remove("people", p.id)} linkedCount={countLinks(data, "people", p.id)} />
                  }
                >
                  <DL
                    items={[
                      ["Sangue", bloodLabel(p)],
                      ["Mobilidade", p.mobility],
                      ["Deficiência", p.disability],
                      ["Alergias", p.allergies],
                      ["Responsável", responsible?.name ?? (p.responsibleId ? "Removido" : "")],
                      ["Contato de emergência", contact ? `${contact.name} (${contact.phone})` : ""],
                    ]}
                  />
                </RecordCard>
              );
            })}
          </div>
        )}
      </Ready>
    </>
  );
}

function PersonForm({ initial, onSave, onCancel }: { initial: Person; onSave: (p: Person) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [p, setP] = useState<Person>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<PersonErrs>({});
  const set = <K extends keyof Person>(k: K, v: Person[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const isNew = !data.people.some((x) => x.id === initial.id);
  const others = useMemo(() => data.people.filter((x) => x.id !== p.id), [data.people, p.id]);

  const stepErrors = (all: PersonErrs, s: number): PersonErrs => {
    const out: PersonErrs = {};
    for (const k of STEP_FIELDS[s] ?? []) {
      const msg = all[k];
      if (msg) out[k] = msg;
    }
    return out;
  };

  const go = (next: number) => {
    const all = validatePerson(p);
    const e = stepErrors(all, step);
    setErrors(e);
    if (next > step && hasErrors(e)) return;
    setStep(next);
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const all = validatePerson(p);
    setErrors(all);
    if (hasErrors(all)) {
      const first = [0, 1, 2, 3].find((s) => hasErrors(stepErrors(all, s)));
      if (first !== undefined) setStep(first);
      return;
    }
    onSave({ ...p, name: p.name.trim(), ageBand: p.birthDate ? "" : p.ageBand });
  };

  const bloodKnown = p.abo !== "nao_sei" || p.rh !== "nao_sei";

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M01" title={isNew ? "Nova pessoa" : `Editar: ${initial.name}`} description="Preencha em etapas. Só o nome é obrigatório — você pode salvar a qualquer momento." />
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => go(i)}
              aria-current={i === step ? "step" : undefined}
              className={`w-full rounded-lg border-2 px-3 py-2 text-left text-sm font-bold ${i === step ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-muted"}`}
            >
              <span className="block text-xs font-normal text-muted-foreground">Etapa {i + 1}</span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      <FormErrorSummary errors={errors} />

      <Section title={STEPS[step]}>
        <div className="grid gap-5 sm:grid-cols-2">
          {step === 0 && (
            <>
              <TextField label="Nome ou apelido" value={p.name} onChange={(v) => set("name", v)} error={errors.name} maxLength={80} />
              <TextField label="Vínculo" optional hint="Ex.: mãe, filho, avó, amigo que mora junto" value={p.relation} onChange={(v) => set("relation", v)} maxLength={60} />
              <TextField
                label="Data de nascimento"
                optional
                type="date"
                value={p.birthDate}
                onChange={(v) => set("birthDate", v)}
                error={errors.birthDate}
                hint={p.birthDate ? `Idade calculada: ${ageLabel(p)}` : "A idade é calculada automaticamente."}
              />
              <SelectField
                label="Faixa de idade (se não souber a data)"
                optional
                value={p.ageBand}
                onChange={(v) => set("ageBand", v)}
                placeholder="Selecione"
                options={AGE_BANDS.map((b) => ({ value: b, label: AGE_BAND_LABEL[b] }))}
                hint={p.birthDate ? "Ignorada: a data de nascimento foi informada." : undefined}
              />
              <SelectField
                label="Sexo"
                optional
                value={p.sex}
                onChange={(v) => set("sex", v)}
                placeholder="Não informar"
                options={[
                  { value: "feminino", label: "Feminino" },
                  { value: "masculino", label: "Masculino" },
                  { value: "intersexo", label: "Intersexo" },
                  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
                ]}
              />
            </>
          )}
          {step === 1 && (
            <>
              <div className="sm:col-span-2">
                <TestDataWarning />
              </div>
              <NumberField label="Peso" optional suffix="kg" value={p.weightKg} onChange={(v) => set("weightKg", v)} error={errors.weightKg} />
              <NumberField label="Altura" optional suffix="cm" value={p.heightCm} onChange={(v) => set("heightCm", v)} error={errors.heightCm} />
              <SelectField label="Grupo sanguíneo (ABO)" value={p.abo} onChange={(v) => set("abo", v)} options={ABO_OPTIONS} hint="Se não tiver certeza, deixe “Não sei”." />
              <SelectField label="Fator Rh" value={p.rh} onChange={(v) => set("rh", v)} options={RH_OPTIONS} />
              {bloodKnown && (
                <div className="space-y-3 rounded-xl border-2 border-info/30 bg-info-soft p-4 sm:col-span-2">
                  <CheckField
                    label="Confirmo que este grupo sanguíneo vem de documento ou exame"
                    hint="O aplicativo nunca deduz o grupo sanguíneo a partir de parentes ou outros dados."
                    checked={p.bloodDocConfirmed}
                    onChange={(v) => set("bloodDocConfirmed", v)}
                  />
                  <TextField label="Origem documental" hint="Ex.: carteira de doador, exame laboratorial" value={p.bloodDocNote} onChange={(v) => set("bloodDocNote", v)} maxLength={120} />
                </div>
              )}
              {errors.blood && (
                <div className="sm:col-span-2">
                  <FieldError>{errors.blood}</FieldError>
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="sm:col-span-2">
                <TestDataWarning />
              </div>
              <TextAreaField label="Condições pessoais ou de saúde" optional value={p.conditions} onChange={(v) => set("conditions", v)} />
              <TextAreaField label="Alergias" optional value={p.allergies} onChange={(v) => set("allergies", v)} />
              <TextAreaField label="Deficiência" optional value={p.disability} onChange={(v) => set("disability", v)} />
              <TextAreaField label="Mobilidade" optional hint="Ex.: usa cadeira de rodas, anda devagar" value={p.mobility} onChange={(v) => set("mobility", v)} />
              <TextAreaField label="Dependência de cuidados" optional value={p.dependency} onChange={(v) => set("dependency", v)} />
              <SelectField
                label="Gestação ou amamentação"
                optional
                value={p.pregnancy}
                onChange={(v) => set("pregnancy", v)}
                placeholder="Não informar"
                options={[
                  { value: "nao_se_aplica", label: "Não se aplica" },
                  { value: "gestante", label: "Gestante" },
                  { value: "amamentando", label: "Amamentando" },
                ]}
              />
              <TextAreaField label="Necessidades infantis" optional hint="Ex.: fraldas, objeto de apego, rotina de sono" value={p.childNeeds} onChange={(v) => set("childNeeds", v)} />
              <div className="sm:col-span-2">
                <CheckField
                  label="Faz uso contínuo de algum tratamento"
                  hint="Apenas sinalização. Não registre nomes de remédios ou doses aqui."
                  checked={p.continuousUse}
                  onChange={(v) => set("continuousUse", v)}
                />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <SelectField
                label="Responsável humano"
                optional
                value={p.responsibleId ?? ""}
                onChange={(v) => set("responsibleId", v || null)}
                placeholder="Nenhum"
                options={others.map((o) => ({ value: o.id, label: o.name }))}
                error={errors.responsibleId}
                hint={others.length === 0 ? "Cadastre outra pessoa para poder vincular." : undefined}
              />
              <SelectField
                label="Contato de emergência (da sua rede)"
                optional
                value={p.emergencyContactId ?? ""}
                onChange={(v) => set("emergencyContactId", v || null)}
                placeholder="Nenhum"
                options={data.contacts.map((c) => ({ value: c.id, label: `${c.name} — ${c.phone}` }))}
                hint={data.contacts.length === 0 ? "Nenhum contato na Rede (M04) ainda." : undefined}
              />
              {data.contacts.length === 0 && (
                <p className="text-sm sm:col-span-2">
                  <Link to="/rede" className="font-bold text-foreground underline decoration-primary decoration-2">Cadastrar contatos na Rede</Link> (salve esta pessoa antes para não perder o que digitou).
                </p>
              )}
              <div className="sm:col-span-2">
                <TextAreaField label="Observações" optional value={p.notes} onChange={(v) => set("notes", v)} />
              </div>
            </>
          )}
        </div>
      </Section>

      {initial.fictitious && <Note tone="info">Este é um perfil de exemplo fictício.</Note>}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => go(step - 1)} disabled={step === 0}>
          <ArrowLeft aria-hidden /> Voltar
        </Button>
        {step < STEPS.length - 1 && (
          <Button type="button" variant="info" onClick={() => go(step + 1)}>
            Próxima etapa <ArrowRight aria-hidden />
          </Button>
        )}
        <Button type="submit">Salvar</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
