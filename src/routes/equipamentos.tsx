import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Flashlight } from "lucide-react";

import { AddButton, DL, EmptyState, FormActions, Note, PageHeader, Ready, RecordActions, RecordCard, Section, Tag, fmtDate } from "@/components/fs/page";
import { FormErrorSummary, NumberField, SelectField, TextAreaField, TextField } from "@/components/fs/fields";
import { isExpired } from "@/lib/domain/supplies";
import { hasErrors, validateEquipment, type Errs } from "@/lib/domain/validate";
import { CONDITION_LABEL, EQUIPMENT_LABEL, EQUIPMENT_TYPES, type Condition, type EquipmentItem, type EquipmentType } from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/equipamentos")({
  head: () => pageHead("Equipamentos", "Checklist e inventário de lanternas, pilhas, rádio, carregadores, ferramentas e proteção."),
  component: EquipmentPage,
});

function newItem(type: EquipmentType = "lanterna"): EquipmentItem {
  const now = nowIso();
  return { id: newId(), createdAt: now, updatedAt: now, name: type === "outro" ? "" : EQUIPMENT_LABEL[type], type, quantity: 1, condition: "nao_verificado", location: "", lastCheck: "", nextCheck: "", notes: "" };
}

const CHECKLIST = EQUIPMENT_TYPES.filter((t) => t !== "outro");

function EquipmentPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<EquipmentItem | null>(null);

  if (editing)
    return (
      <Ready>
        <EquipmentForm initial={editing} onCancel={() => setEditing(null)} onSave={(s) => upsert("equipment", { ...s, updatedAt: nowIso() }) && setEditing(null)} />
      </Ready>
    );

  return (
    <>
      <PageHeader code="M06" title="Equipamentos" description="Itens de apoio. Remédios ficam no M08 e atividades de lazer no M09.">
        <AddButton onClick={() => setEditing(newItem("outro"))}>Adicionar equipamento</AddButton>
      </PageHeader>
      <Ready>
        <div className="space-y-6">
          <Section title="Checklist" description="Marque o que já existe cadastrando o item. Toque em um item que falta para cadastrá-lo.">
            <ul className="grid gap-2 sm:grid-cols-2">
              {CHECKLIST.map((t) => {
                const items = data.equipment.filter((e) => e.type === t);
                const qty = items.reduce((a, e) => a + e.quantity, 0);
                const has = qty > 0;
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => setEditing(newItem(t))}
                      className="flex min-h-12 w-full items-center gap-3 rounded-lg border-2 bg-card px-3 py-2 text-left hover:bg-muted"
                    >
                      {has ? <CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden /> : <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
                      <span className="flex-1 font-bold">{EQUIPMENT_LABEL[t]}</span>
                      <span className="text-sm text-muted-foreground">{has ? `Cadastrado: ${qty}` : "Não cadastrado"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Note tone="danger" title="Segurança">
            Não tente consertar equipamentos elétricos, a gás ou baterias danificadas. Separe o item como “Não funciona” e procure assistência técnica.
            Proteção pessoal serve para se proteger, nunca para confronto.
          </Note>

          <Section title="Inventário">
            {data.equipment.length === 0 ? (
              <EmptyState icon={<Flashlight />} title="Nenhum equipamento cadastrado" text="Use o checklist acima para começar." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.equipment.map((e) => (
                  <RecordCard
                    key={e.id}
                    title={e.name}
                    subtitle={`${EQUIPMENT_LABEL[e.type]} · ${e.quantity} un.`}
                    tags={
                      <>
                        {e.fictitious && <Tag tone="pending">Exemplo fictício</Tag>}
                        <Tag tone={e.condition === "funcionando" ? "primary" : e.condition === "nao_verificado" ? "pending" : "attention"}>{CONDITION_LABEL[e.condition]}</Tag>
                        {isExpired(e.nextCheck) && <Tag tone="attention">Revisão atrasada</Tag>}
                      </>
                    }
                    actions={<RecordActions name={e.name} onEdit={() => setEditing(e)} onDelete={() => remove("equipment", e.id)} />}
                  >
                    <DL items={[["Local", e.location], ["Última verificação", fmtDate(e.lastCheck)], ["Próxima verificação", fmtDate(e.nextCheck)], ["Observações", e.notes]]} />
                  </RecordCard>
                ))}
              </div>
            )}
          </Section>
        </div>
      </Ready>
    </>
  );
}

function EquipmentForm({ initial, onSave, onCancel }: { initial: EquipmentItem; onSave: (s: EquipmentItem) => void; onCancel: () => void }) {
  const { data } = useStore();
  const [s, setS] = useState(initial);
  const [errors, setErrors] = useState<Errs<EquipmentItem>>({});
  const set = <K extends keyof EquipmentItem>(k: K, v: EquipmentItem[K]) => setS((p) => ({ ...p, [k]: v }));
  const isNew = !data.equipment.some((x) => x.id === initial.id);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateEquipment(s);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...s, name: s.name.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M06" title={isNew ? "Novo equipamento" : `Editar: ${initial.name}`} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Nome" value={s.name} onChange={(v) => set("name", v)} error={errors.name} maxLength={80} />
          <SelectField label="Tipo" value={s.type} onChange={(v) => set("type", v)} options={EQUIPMENT_TYPES.map((t) => ({ value: t, label: EQUIPMENT_LABEL[t] }))} />
          <NumberField label="Quantidade" value={s.quantity} onChange={(v) => set("quantity", v ?? 0)} error={errors.quantity} />
          <SelectField label="Condição" value={s.condition} onChange={(v) => set("condition", v as Condition)} options={(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => ({ value: c, label: CONDITION_LABEL[c] }))} />
          <TextField label="Onde está guardado" optional value={s.location} onChange={(v) => set("location", v)} />
          <TextField label="Última verificação" optional type="date" value={s.lastCheck} onChange={(v) => set("lastCheck", v)} error={errors.lastCheck} />
          <TextField label="Próxima verificação" optional type="date" value={s.nextCheck} onChange={(v) => set("nextCheck", v)} error={errors.nextCheck} hint="Ex.: testar lanterna, trocar pilhas vencidas." />
          <TextAreaField label="Observações" optional value={s.notes} onChange={(v) => set("notes", v)} />
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
