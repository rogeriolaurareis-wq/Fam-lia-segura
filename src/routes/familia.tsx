import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AddButton, DL, EmptyState, Note, PageHeader, Ready, RecordActions, RecordCard, Section, Tag, TestDataWarning } from "@/components/fs/page";
import { CheckField, FieldError, FormErrorSummary, NumberField, SelectField, TextAreaField, TextField } from "@/components/fs/fields";
import { bandForPerson } from "@/lib/domain/age";
import { ABO_OPTIONS, RH_OPTIONS, bloodLabel } from "@/lib/domain/blood";
import { countLinks } from "@/lib/domain/links";
import { hasErrors, validatePerson, type Errs } from "@/lib/domain/validate";
import { AGE_BANDS, AGE_BAND_LABEL, type Person } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { PersonPhoto } from "@/components/fs/PersonPhoto";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/familia")({
  head: () => pageHead("Minha família", "Cadastro das pessoas da família, com faixa etária e características de identificação."),
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

const STEPS = ["Identificação", "Corpo e sangue", "Saúde e necessidades", "Foto e identificação"] as const;
type PersonErrs = Errs<Person, "blood">;
type ErrKey = keyof PersonErrs;
const STEP_FIELDS: readonly (readonly ErrKey[])[] = [["name", "ageBand"], ["weightKg", "heightCm"], [], ["photoDataUrl", "identificationMarks"]];

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
              const band = bandForPerson(p);
              return (
                <RecordCard
                  key={p.id}
                  title={p.name}
                  subtitle={band ? AGE_BAND_LABEL[band] : "Faixa etária não informada"}
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
                  {p.photoDataUrl && <img src={p.photoDataUrl} alt={`Foto de ${p.name}`} className="mb-4 size-28 rounded-xl object-cover" />}
                  <DL
                    items={[
                      ["Sangue", bloodLabel(p)],
                      ["Mobilidade", p.mobility],
                      ["Deficiência", p.disability],
                      ["Alergias", p.allergies],
                      ["Sinais de identificação", p.identificationMarks ?? ""],
                      ["Observações", p.notes],
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

export function PersonForm({ initial, onSave, onCancel }: { initial: Person; onSave: (p: Person) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [p, setP] = useState<Person>({ ...initial, ageBand: bandForPerson(initial) ?? "", birthDate: "" });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<PersonErrs>({});
  const set = <K extends keyof Person>(k: K, v: Person[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const isNew = !data.people.some((x) => x.id === initial.id);
  const forSave = (): Person => ({ ...p, birthDate: "", name: p.name.trim(),
    ...(p.bloodDocConfirmed ? { bloodDocNote: p.bloodDocNote.trim() || "Confirmado pelo usuário em documento ou exame" } :
      { abo: "nao_sei", rh: "nao_sei", bloodDocNote: "" }) });

  const stepErrors = (all: PersonErrs, s: number): PersonErrs => {
    const out: PersonErrs = {};
    for (const k of STEP_FIELDS[s] ?? []) {
      const msg = all[k];
      if (msg) out[k] = msg;
    }
    return out;
  };

  const go = (next: number) => {
    const all = validatePerson(forSave());
    const e = stepErrors(all, step);
    setErrors(e);
    if (next > step && hasErrors(e)) return;
    setStep(next);
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (photoBusy) return;
    const all = validatePerson(forSave());
    setErrors(all);
    if (hasErrors(all)) {
      const first = [0, 1, 2, 3].find((s) => hasErrors(stepErrors(all, s)));
      if (first !== undefined) setStep(first);
      return;
    }
    onSave(forSave());
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
              <SelectField label="Faixa de idade" optional value={p.ageBand} onChange={(v) => set("ageBand", v)} placeholder="Não informar" options={AGE_BANDS.map((b) => ({ value: b, label: AGE_BAND_LABEL[b] }))} />
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
              <SelectField optional label="Grupo sanguíneo (ABO)" value={p.abo} onChange={(v) => setP(prev => ({ ...prev, abo: v, bloodDocConfirmed: false }))} options={ABO_OPTIONS} hint="Se não tiver certeza, deixe “Não sei”." />
              <SelectField optional label="Fator Rh" value={p.rh} onChange={(v) => setP(prev => ({ ...prev, rh: v, bloodDocConfirmed: false }))} options={RH_OPTIONS} />
              {bloodKnown && (
                <div className="space-y-3 rounded-xl border-2 border-info/30 bg-info-soft p-4 sm:col-span-2">
                  <CheckField
                    label="Confirmo que este grupo sanguíneo vem de documento ou exame"
                    hint="O aplicativo nunca deduz o grupo sanguíneo a partir de parentes ou outros dados."
                    checked={p.bloodDocConfirmed}
                    onChange={(v) => set("bloodDocConfirmed", v)}
                  />
                  <TextField optional label="Origem documental" hint="Ex.: carteira de doador, exame laboratorial" value={p.bloodDocNote} onChange={(v) => set("bloodDocNote", v)} maxLength={120} />
                </div>
              )}
              {bloodKnown && !p.bloodDocConfirmed && <p className="sm:col-span-2 text-sm text-muted-foreground">Pode continuar sem confirmar. Ao salvar, o sangue ficará como “Não sei” até você ter certeza e marcar a confirmação.</p>}
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
              <div className="sm:col-span-2"><PersonPhoto onBusyChange={setPhotoBusy} value={p.photoDataUrl ?? ""} onChange={(v) => set("photoDataUrl", v)} /></div>
              <div className="sm:col-span-2"><TextAreaField label="Sinais de identificação" optional hint="Ex.: tatuagem no braço esquerdo, pinta no rosto ou cicatriz. Descreva a localização." value={p.identificationMarks ?? ""} onChange={(v) => set("identificationMarks", v)} /></div>
              <div className="sm:col-span-2"><TextAreaField label="Observações" optional value={p.notes} onChange={(v) => set("notes", v)} /></div>
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
        <Button type="submit" disabled={photoBusy}>{photoBusy ? "Preparando foto…" : "Salvar"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
