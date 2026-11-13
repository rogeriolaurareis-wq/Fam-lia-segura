import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BriefcaseMedical, ClipboardList } from "lucide-react";

import { AddButton, DL, EmptyState, FormActions, Note, PageHeader, PendingList, Ready, RecordActions, RecordCard, Section, Tag, fmtDate } from "@/components/fs/page";
import { CheckField, FormErrorSummary, NumberField, SelectField, TextAreaField, TextField } from "@/components/fs/fields";
import { expiresWithin, isExpired } from "@/lib/domain/supplies";
import { projectStockDays } from "@/lib/domain/treatment";
import { hasErrors, validateKit, validateTreatment, type Errs } from "@/lib/domain/validate";
import { UNITS, type KitItem, type Treatment } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/saude")({
  head: () => pageHead("Saúde e cuidados", "Kit de materiais de cuidados e registro fictício de tratamentos já prescritos (versão de testes)."),
  component: HealthPage,
});

function newKit(): KitItem {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now, name: "", quantity: 1, unit: "unidade", expiry: "", location: "", notes: "" };
}
function newTreatment(): Treatment {
  const now = nowIso();
  return {
    id: newId(), createdAt: now, updatedAt: now, holderType: "pessoa", holderId: null, name: "", presentation: "", concentrationText: "",
    existingInstructions: "", unit: "unidade", stock: 0, expiry: "", dailyConsumption: null, dailyConsumptionValidated: false, fictitiousConfirmed: false, notes: "",
  };
}

type Editing = { kind: "kit"; item: KitItem } | { kind: "treatment"; item: Treatment } | null;

function HealthPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<Editing>(null);

  if (editing?.kind === "kit")
    return (
      <Ready>
        <KitForm initial={editing.item} onCancel={() => setEditing(null)} onSave={(k) => upsert("kit", { ...k, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );
  if (editing?.kind === "treatment")
    return (
      <Ready>
        <TreatmentForm initial={editing.item} onCancel={() => setEditing(null)} onSave={(t) => upsert("treatments", { ...t, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );

  const holderName = (t: Treatment) => {
    if (!t.holderId) return "Titular não definido ou removido";
    const list = t.holderType === "pessoa" ? data.people : data.animals;
    return list.find((x) => x.id === t.holderId)?.name ?? "Titular removido";
  };

  return (
    <>
      <PageHeader code="M08" title="Saúde e cuidados" description="Materiais de cuidados e um registro de tratamentos já prescritos — nesta prévia, somente com dados fictícios." />
      <Ready>
        <div className="space-y-6">
          <Note tone="attention" title="Este aplicativo não prescreve nem orienta tratamento">
            Não calcula doses, não converte remédios e não compara espécies. Siga sempre a receita e a orientação do profissional de saúde ou veterinário.
          </Note>

          <Section title="Kit de materiais" actions={<AddButton onClick={() => setEditing({ kind: "kit", item: newKit() })}>Adicionar material</AddButton>}>
            {data.kit.length === 0 ? (
              <EmptyState icon={<BriefcaseMedical />} title="Kit vazio" text="Registre materiais como gaze, esparadrapo, luvas descartáveis e termômetro." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.kit.map((k) => (
                  <RecordCard
                    key={k.id}
                    title={k.name}
                    subtitle={`${k.quantity} ${k.unit}`}
                    tags={
                      <>
                        {k.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                        {isExpired(k.expiry) && <Tag tone="attention">Vencido</Tag>}
                      </>
                    }
                    actions={<RecordActions name={k.name} onEdit={() => setEditing({ kind: "kit", item: k })} onDelete={() => remove("kit", k.id)} />}
                  >
                    <DL items={[["Validade", fmtDate(k.expiry)], ["Local", k.location], ["Observações", k.notes]]} />
                  </RecordCard>
                ))}
              </div>
            )}
          </Section>

          <Section title="Tratamentos já prescritos (fictício)" actions={<AddButton onClick={() => setEditing({ kind: "treatment", item: newTreatment() })}>Adicionar registro fictício</AddButton>}>
            {data.treatments.length === 0 ? (
              <EmptyState icon={<ClipboardList />} title="Nenhum registro" text="Nesta versão de testes, use apenas dados inventados para experimentar a tela." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.treatments.map((t) => {
                  const days = projectStockDays(t);
                  return (
                    <RecordCard
                      key={t.id}
                      title={t.name}
                      subtitle={`${t.holderType === "pessoa" ? "Pessoa" : "Animal"}: ${holderName(t)}`}
                      tags={
                        <>
                          <Tag tone="pending">Fictício</Tag>
                          {isExpired(t.expiry) && <Tag tone="attention">Vencido</Tag>}
                          {expiresWithin(t.expiry, 30) && <Tag tone="attention">Vence em até 30 dias</Tag>}
                        </>
                      }
                      actions={<RecordActions name={t.name} onEdit={() => setEditing({ kind: "treatment", item: t })} onDelete={() => remove("treatments", t.id)} />}
                    >
                      <DL
                        items={[
                          ["Apresentação", t.presentation],
                          ["Concentração (texto)", t.concentrationText],
                          ["Orientação existente", t.existingInstructions],
                          ["Estoque", `${t.stock} ${t.unit}`],
                          ["Validade", fmtDate(t.expiry)],
                          ["Projeção aritmética", days === null ? "Sem consumo diário validado" : `${days} dia(s) de estoque (${t.stock} ÷ ${t.dailyConsumption} ${t.unit}/dia)`],
                        ]}
                      />
                    </RecordCard>
                  );
                })}
              </div>
            )}
          </Section>

          <PendingList
            items={[
              "Conteúdo clínico revisado por profissionais: pendente. Nenhuma biblioteca de remédios ou orientações foi incluída.",
              "Registro de dados reais de saúde: bloqueado até haver criptografia e acesso controlado validados.",
            ]}
          />
        </div>
      </Ready>
    </>
  );
}

function KitForm({ initial, onSave, onCancel }: { initial: KitItem; onSave: (k: KitItem) => void; onCancel: () => void }) {
  const [k, setK] = useState(initial);
  const [errors, setErrors] = useState<Errs<KitItem>>({});
  const set = <K extends keyof KitItem>(key: K, v: KitItem[K]) => setK((p) => ({ ...p, [key]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateKit(k);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...k, name: k.name.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M08" title={initial.name ? `Editar: ${initial.name}` : "Novo material do kit"} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Material" hint="Ex.: gaze, luvas descartáveis, termômetro" value={k.name} onChange={(v) => set("name", v)} error={errors.name} />
          <NumberField label="Quantidade" value={k.quantity} onChange={(v) => set("quantity", v ?? 0)} error={errors.quantity} />
          <SelectField label="Unidade" value={k.unit} onChange={(v) => set("unit", v)} options={UNITS.map((u) => ({ value: u, label: u }))} />
          <TextField label="Validade" optional type="date" value={k.expiry} onChange={(v) => set("expiry", v)} error={errors.expiry} />
          <TextField label="Local" optional value={k.location} onChange={(v) => set("location", v)} />
          <TextAreaField label="Observações" optional value={k.notes} onChange={(v) => set("notes", v)} />
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function TreatmentForm({ initial, onSave, onCancel }: { initial: Treatment; onSave: (t: Treatment) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [t, setT] = useState(initial);
  const [errors, setErrors] = useState<Errs<Treatment>>({});
  const set = <K extends keyof Treatment>(key: K, v: Treatment[K]) => setT((p) => ({ ...p, [key]: v }));
  const holders = t.holderType === "pessoa" ? data.people : data.animals;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateTreatment(t);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...t, name: t.name.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M08" title={initial.name ? `Editar: ${initial.name}` : "Novo registro fictício de tratamento"} />
      <FormErrorSummary errors={errors} />
      <Note tone="attention" title="Somente dados fictícios">
        Não digite nomes reais de remédios, doses reais ou dados de pessoas reais. Este registro serve para testar a tela.
      </Note>
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <CheckField label="Confirmo que este registro é fictício" checked={t.fictitiousConfirmed} onChange={(v) => set("fictitiousConfirmed", v)} error={errors.fictitiousConfirmed} />
          </div>
          <SelectField label="Titular" value={t.holderType} onChange={(v) => setT((p) => ({ ...p, holderType: v, holderId: null }))} options={[{ value: "pessoa", label: "Pessoa" }, { value: "animal", label: "Animal" }]} />
          <SelectField label={t.holderType === "pessoa" ? "Pessoa" : "Animal"} optional value={t.holderId ?? ""} onChange={(v) => set("holderId", v || null)} placeholder="Selecione" options={holders.map((h) => ({ value: h.id, label: h.name }))} />
          <TextField label="Nome do registro (fictício)" value={t.name} onChange={(v) => set("name", v)} error={errors.name} />
          <TextField label="Apresentação" optional hint="Ex.: comprimido, gotas (fictício)" value={t.presentation} onChange={(v) => set("presentation", v)} />
          <TextField label="Concentração (texto, como na embalagem)" optional value={t.concentrationText} onChange={(v) => set("concentrationText", v)} />
          <TextAreaField label="Orientação já existente (copiada da receita)" optional value={t.existingInstructions} onChange={(v) => set("existingInstructions", v)} />
          <NumberField label="Estoque" value={t.stock} onChange={(v) => set("stock", v ?? 0)} error={errors.stock} />
          <SelectField label="Unidade" value={t.unit} onChange={(v) => set("unit", v)} options={UNITS.map((u) => ({ value: u, label: u }))} />
          <TextField label="Validade" optional type="date" value={t.expiry} onChange={(v) => set("expiry", v)} error={errors.expiry} />
          <NumberField label="Consumo diário já prescrito" optional suffix={`${t.unit}/dia`} value={t.dailyConsumption} onChange={(v) => set("dailyConsumption", v)} error={errors.dailyConsumption} />
          <div className="sm:col-span-2">
            <CheckField
              label="O consumo diário foi copiado de uma prescrição existente"
              hint="Só com esta confirmação o aplicativo faz a conta de quantos dias o estoque dura (estoque ÷ consumo). Nenhuma dose é sugerida."
              checked={t.dailyConsumptionValidated}
              onChange={(v) => set("dailyConsumptionValidated", v)}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField label="Observações" optional value={t.notes} onChange={(v) => set("notes", v)} />
          </div>
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
