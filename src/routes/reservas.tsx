import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Backpack } from "lucide-react";
import { toast } from "sonner";

import { ShoppingPlanner } from "@/components/fs/ShoppingPlanner";
import { Button } from "@/components/ui/button";
import {
  AddButton,
  DL,
  EmptyState,
  FormActions,
  Note,
  PageHeader,
  PendingList,
  Ready,
  RecordActions,
  RecordCard,
  Section,
  Tag,
  fmtDate,
} from "@/components/fs/page";
import {
  FieldError,
  FormErrorSummary,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/fs/fields";
import { computeShortages, expiresWithin, isExpired } from "@/lib/domain/supplies";
import { computeWater, scenarioDays } from "@/lib/domain/water";
import { hasErrors, validateSupply, type Errs } from "@/lib/domain/validate";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_CATEGORY_LABEL,
  UNITS,
  type ScenarioDays,
  type SupplyCategory,
  type SupplyItem,
  type WaterParams,
} from "@/lib/domain/types";
import { newId, nowIso, useStore } from "@/lib/storage/store";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reservas")({
  head: () =>
    pageHead(
      "Reservas",
      "Inventário de água, alimentação, higiene e limpeza, com planejamento de água baseado nos seus próprios valores.",
    ),
  component: SuppliesPage,
});

function newSupply(): SupplyItem {
  const now = nowIso();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    name: "",
    category: "agua_potavel",
    quantity: 0,
    unit: "L",
    target: null,
    expiry: "",
    location: "",
    notes: "",
  };
}

const fmtL = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("pt-BR")} L`);

function SuppliesPage() {
  const { data, upsert, remove } = useStore();
  const [editing, setEditing] = useState<SupplyItem | null>(null);
  if (editing)
    return (
      <Ready>
        <SupplyForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(s) => {
            if (upsert("supplies", { ...s, updatedAt: nowIso() })) setEditing(null);
          }}
        />
      </Ready>
    );
  return (
    <>
      <PageHeader
        code="M05"
        title="Lista de compras"
        description="Escolha os itens, veja as quantidades e copie para o WhatsApp."
      />
      <Ready>
        <ShoppingPlanner />
        {data.supplies.length > 0 && (
          <details className="mt-6 rounded-xl border bg-card p-4">
            <summary className="min-h-11 cursor-pointer font-bold">
              Inventário anterior preservado ({data.supplies.length} itens)
            </summary>
            <p className="mb-4">
              Os registros antigos continuam aqui. Eles não são descontados automaticamente da nova
              lista: confirme o saldo na opção “Já tenho” do item correspondente para evitar
              misturar unidades ou produtos.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {data.supplies.map((s) => (
                <RecordCard
                  key={s.id}
                  title={s.name}
                  subtitle={`${s.quantity.toLocaleString("pt-BR")} ${s.unit}`}
                  actions={
                    <RecordActions
                      name={s.name}
                      onEdit={() => setEditing(s)}
                      onDelete={() => remove("supplies", s.id)}
                    />
                  }
                >
                  <DL
                    items={[
                      ["Local", s.location],
                      ["Observações", s.notes],
                    ]}
                  />
                </RecordCard>
              ))}
            </div>
          </details>
        )}
        <details className="mt-6 rounded-xl border bg-card p-4">
          <summary className="min-h-11 cursor-pointer font-bold">
            Cálculo de água com parâmetros próprios (opcional)
          </summary>
          <ScenarioAndWater />
        </details>
      </Ready>
    </>
  );
}

function ScenarioAndWater() {
  const { data, update } = useStore();
  const [w, setW] = useState<WaterParams>(data.water);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setW(data.water);
  }, [data.water, dirty]);
  const setP = <K extends keyof WaterParams>(k: K, v: WaterParams[K]) => {
    setW((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };
  const days = scenarioDays(data.scenario);
  const invalid = (n: number | null) => n !== null && (!Number.isFinite(n) || n < 0 || n > 1000);
  const fieldErr = (n: number | null) =>
    invalid(n) ? "Informe um número entre 0 e 1000, ou deixe em branco." : undefined;
  const anyInvalid =
    [w.drinkLPerPersonDay, w.cookLPerPersonDay, w.hygieneLPerPersonDay, w.animalTotalLPerDay].some(
      invalid,
    ) ||
    (w.peopleMode === "manual" &&
      w.peopleManual !== null &&
      (!Number.isInteger(w.peopleManual) || w.peopleManual < 0));
  const result = computeWater({
    params: data.water,
    registeredPeople: data.people.length,
    days,
    supplies: data.supplies,
  });

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (anyInvalid) return;
    if (update((d) => ({ ...d, water: w }))) {
      setDirty(false);
      toast.success("Parâmetros de água salvos.");
    }
  };

  const setScenario = (v: ScenarioDays) =>
    update((d) => ({ ...d, scenario: { ...d.scenario, days: v } }));

  return (
    <Section
      title="Cenário e planejamento de água"
      description="Escolha por quantos dias quer planejar e informe os seus próprios valores de consumo."
    >
      <fieldset>
        <legend className="mb-2 font-bold">Cenário</legend>
        <div className="flex flex-wrap gap-2">
          {([3, 7, 14, 30, "custom"] as ScenarioDays[]).map((v) => (
            <Button
              key={String(v)}
              type="button"
              variant={data.scenario.days === v ? "info" : "outline"}
              aria-pressed={data.scenario.days === v}
              onClick={() => setScenario(v)}
            >
              {v === "custom" ? "Personalizado" : `${v} dias`}
            </Button>
          ))}
        </div>
        {data.scenario.days === "custom" && (
          <div className="mt-3 max-w-xs">
            <NumberField
              label="Número de dias"
              value={data.scenario.customDays}
              onChange={(v) =>
                update((d) => ({
                  ...d,
                  scenario: {
                    ...d.scenario,
                    customDays:
                      v !== null && Number.isFinite(v) && v > 0 && v <= 365 ? Math.floor(v) : null,
                  },
                }))
              }
              hint="De 1 a 365."
            />
          </div>
        )}
      </fieldset>

      <form onSubmit={save} noValidate className="mt-6 space-y-5">
        <Note tone="info" title="Valores informados por você">
          O aplicativo não sugere quantidades de consumo. Use valores da sua realidade ou de
          orientação oficial que você consultou. Campos vazios ficam fora do cálculo.
        </Note>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            label="Água para beber"
            suffix="L por pessoa/dia"
            value={w.drinkLPerPersonDay}
            onChange={(v) => setP("drinkLPerPersonDay", v)}
            error={fieldErr(w.drinkLPerPersonDay)}
          />
          <NumberField
            label="Água para cozinhar"
            suffix="L por pessoa/dia"
            value={w.cookLPerPersonDay}
            onChange={(v) => setP("cookLPerPersonDay", v)}
            error={fieldErr(w.cookLPerPersonDay)}
          />
          <NumberField
            label="Água para higiene"
            suffix="L por pessoa/dia"
            value={w.hygieneLPerPersonDay}
            onChange={(v) => setP("hygieneLPerPersonDay", v)}
            error={fieldErr(w.hygieneLPerPersonDay)}
          />
          <NumberField
            label="Água para todos os animais"
            suffix="L/dia (total)"
            value={w.animalTotalLPerDay}
            onChange={(v) => setP("animalTotalLPerDay", v)}
            error={fieldErr(w.animalTotalLPerDay)}
          />
          <SelectField
            label="Número de pessoas"
            value={w.peopleMode}
            onChange={(v) => setP("peopleMode", v)}
            options={[
              { value: "cadastro", label: `Usar cadastro da família (${data.people.length})` },
              { value: "manual", label: "Informar manualmente" },
            ]}
          />
          {w.peopleMode === "manual" && (
            <NumberField
              label="Pessoas (manual)"
              value={w.peopleManual}
              onChange={(v) => setP("peopleManual", v)}
            />
          )}
        </div>
        {anyInvalid && <FieldError>Revise os valores destacados.</FieldError>}
        <div className="flex items-center gap-3">
          <Button type="submit">Salvar parâmetros</Button>
          {dirty && (
            <span className="text-sm text-muted-foreground">
              Alterações não salvas — o resultado abaixo usa os valores salvos.
            </span>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <caption className="mb-2 text-left font-bold">
            Resultado aritmético · {result.people ?? "?"} pessoa(s) · {result.days ?? "?"} dia(s)
          </caption>
          <thead>
            <tr className="border-b-2">
              <th className="py-2 pr-3">Finalidade</th>
              <th className="py-2 pr-3">Conta</th>
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((l) => (
              <tr key={l.key} className="border-b">
                <td className="py-2 pr-3 font-bold">{l.label}</td>
                <td className="py-2 pr-3 text-sm text-muted-foreground">{l.formula}</td>
                <td className="py-2">
                  {l.totalL === null ? <Tag tone="pending">Informe o valor</Tag> : fmtL(l.totalL)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="font-bold">Água potável (beber + cozinhar + animais)</p>
          <p>Necessário: {fmtL(result.potableNeedL)}</p>
          <p>Em estoque: {fmtL(result.potableStockL)}</p>
          <p>
            {result.potableGapL === null ? (
              "Faltam dados para comparar."
            ) : result.potableGapL > 0 ? (
              <strong>Faltam {fmtL(result.potableGapL)}</strong>
            ) : (
              "O estoque cobre a conta informada."
            )}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="font-bold">Higiene</p>
          <p>Necessário: {fmtL(result.hygieneNeedL)}</p>
          <p>Em estoque (água para limpeza): {fmtL(result.cleaningStockL)}</p>
          <p>
            {result.hygieneGapL === null ? (
              "Faltam dados para comparar."
            ) : result.hygieneGapL > 0 ? (
              <strong>Faltam {fmtL(result.hygieneGapL)}</strong>
            ) : (
              "O estoque cobre a conta informada."
            )}
          </p>
        </div>
      </div>
      {result.notCountedItems.length > 0 && (
        <p className="mt-3 text-sm text-foreground">
          Não somados por estarem em outra unidade:{" "}
          {result.notCountedItems.map((s) => `${s.name} (${s.quantity} ${s.unit})`).join(", ")}.
        </p>
      )}
      {result.missing.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">Faltam: {result.missing.join(", ")}.</p>
      )}
      <details className="mt-4 rounded-xl border bg-muted p-4">
        <summary className="cursor-pointer font-bold">Premissas deste cálculo</summary>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
          <li>Cobrir a conta não significa que a família está segura ou preparada.</li>
        </ul>
      </details>
    </Section>
  );
}

function SupplyForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SupplyItem;
  onSave: (s: SupplyItem) => void;
  onCancel: () => void;
}) {
  const { data } = useStore();
  const [s, setS] = useState(initial);
  const [errors, setErrors] = useState<Errs<SupplyItem>>({});
  const set = <K extends keyof SupplyItem>(k: K, v: SupplyItem[K]) =>
    setS((p) => ({ ...p, [k]: v }));
  const isNew = !data.supplies.some((x) => x.id === initial.id);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateSupply(s);
    setErrors(errs);
    if (!hasErrors(errs)) onSave({ ...s, name: s.name.trim() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <PageHeader code="M05" title={isNew ? "Novo item de reserva" : `Editar: ${initial.name}`} />
      <FormErrorSummary errors={errors} />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Item"
            value={s.name}
            onChange={(v) => set("name", v)}
            error={errors.name}
            maxLength={80}
          />
          <SelectField
            label="Categoria"
            value={s.category}
            onChange={(v) => set("category", v as SupplyCategory)}
            options={SUPPLY_CATEGORIES.map((c) => ({ value: c, label: SUPPLY_CATEGORY_LABEL[c] }))}
          />
          <NumberField
            label="Quantidade"
            value={s.quantity}
            onChange={(v) => set("quantity", v ?? 0)}
            error={errors.quantity}
          />
          <SelectField
            label="Unidade"
            value={s.unit}
            onChange={(v) => set("unit", v)}
            options={UNITS.map((u) => ({ value: u, label: u }))}
            hint="Para a água entrar no cálculo, use litros (L)."
          />
          <NumberField
            label="Meta"
            optional
            value={s.target}
            onChange={(v) => set("target", v)}
            error={errors.target}
            hint={`Na mesma unidade (${s.unit}). Definida por você.`}
          />
          <TextField
            label="Local onde está guardado"
            optional
            value={s.location}
            onChange={(v) => set("location", v)}
          />
          <TextAreaField
            label="Observações"
            optional
            value={s.notes}
            onChange={(v) => set("notes", v)}
          />
        </div>
      </Section>
      <FormActions onCancel={onCancel} />
    </form>
  );
}
