import { useState, type FormEvent } from "react";
import { Copy, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NumberField, SelectField, TextField } from "./fields";
import { Note, Section } from "./page";
import { useStore, newId } from "@/lib/storage/store";
import {
  SHOP_CATALOG,
  SHOP_CATEGORIES,
  SHOP_LABELS,
  preference,
  setSelected,
  shoppingLines,
  shoppingText,
  formatShopQuantity,
  type ShoppingPlan,
  type ShopItem,
  type ShopCategory,
  type ShopUnit,
} from "@/lib/domain/shopping";

export function ShoppingPlanner() {
  const { data, update } = useStore();
  const plan = data.shopping;
  const save = (fn: (p: ShoppingPlan) => ShoppingPlan) =>
    update((d) => ({ ...d, shopping: fn(d.shopping) }));
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [movement, setMovement] = useState<{ item: ShopItem; kind: "buy" | "use" } | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [moveError, setMoveError] = useState("");
  const lines = shoppingLines(plan, data.people.length);
  const items = [...SHOP_CATALOG, ...plan.customItems];
  const valid = (v: number | null) => v === null || (Number.isFinite(v) && v >= 0 && v <= 1e9);
  const edit = (id: string, key: "target" | "stock", v: number | null) => {
    const item = items.find((i) => i.id === id);
    if (valid(v) && (v === null || item?.unit !== "un" || Number.isInteger(v)))
      save((p) => ({ ...p, choices: { ...p.choices, [id]: { ...preference(p, id), [key]: v } } }));
  };
  const copy = async (category?: ShopCategory) => {
    const text = shoppingText(plan, data.people.length, category);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lista copiada. Cole no WhatsApp ou onde preferir.");
    } catch {
      setCopyFallback(text);
    }
  };
  const move = (e: FormEvent) => {
    e.preventDefault();
    if (!movement || amount === null || !valid(amount) || amount <= 0) {
      setMoveError("Informe uma quantidade maior que zero.");
      return;
    }
    if (movement.item.unit === "un" && !Number.isInteger(amount)) {
      setMoveError("Para unidades, informe um número inteiro.");
      return;
    }
    const old = preference(plan, movement.item.id).stock;
    if (movement.kind === "use" && (old === null || amount > old)) {
      setMoveError("Informe primeiro quanto você tem; o uso não pode ultrapassar esse saldo.");
      return;
    }
    if (movement.kind === "buy" && (old ?? 0) + amount > 1e9) {
      setMoveError("Quantidade acima do limite permitido.");
      return;
    }
    if (
      save((p) => {
        const stock = preference(p, movement.item.id).stock ?? 0;
        return {
          ...p,
          choices: {
            ...p.choices,
            [movement.item.id]: {
              ...preference(p, movement.item.id),
              stock: Math.round((stock + (movement.kind === "buy" ? amount : -amount)) * 100) / 100,
            },
          },
        };
      })
    ) {
      setMovement(null);
      setAmount(null);
      toast.success("Quantidade atualizada.");
    }
  };
  return (
    <div className="space-y-6">
      <Section
        title="Sua lista de compras"
        description="Escolha o que gosta e ajuste as quantidades. Estoque é opcional; não pedimos validade ou embalagem."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Pessoas no planejamento"
            value={plan.people}
            onChange={(v) => {
              if (v === null || (Number.isInteger(v) && v >= 1 && v <= 10000))
                save((p) => ({ ...p, people: v }));
            }}
            hint={
              data.people.length
                ? `Em branco: usar ${data.people.length} pessoa(s) do cadastro.`
                : "Informe a quantidade, sem precisar cadastrar cada pessoa."
            }
          />
          <NumberField
            label="Dias de reserva"
            value={plan.days}
            onChange={(v) => {
              if (v !== null && Number.isInteger(v) && v >= 1 && v <= 365)
                save((p) => ({ ...p, days: v }));
            }}
            hint="De 1 a 365 dias."
          />
        </div>
        <div className="mt-4">
          <Note tone="info" title="Sugestões ajustáveis">
            Quantidades de alimentos e produtos são estimativas iniciais, ainda em revisão. A
            seleção não é uma dieta completa. Confira restrições, conservação e preparo. Itens sem
            base adequada pedem apenas a quantidade total.
          </Note>
        </div>
        <TextField
          label="Buscar nas opções"
          value={search}
          onChange={setSearch}
          placeholder="Ex.: arroz, sem lactose, sabonete"
        />
        <p className="mt-3 text-sm">
          {items.length} opções · {lines.length} selecionada(s). Nas alternativas agrupadas, escolha
          uma opção por vez nesta versão.
        </p>
      </Section>
      {SHOP_CATEGORIES.map((cat) => {
        const group = items.filter(
          (i) =>
            i.category === cat &&
            i.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
        );
        if (!group.length) return null;
        return (
          <details
            key={`${cat}-${search ? "busca" : "normal"}`}
            open={!!search}
            className="rounded-xl border bg-card p-4"
          >
            <summary className="min-h-11 cursor-pointer text-lg font-bold">
              {SHOP_LABELS[cat]}{" "}
              <span className="text-sm">
                ({lines.filter((l) => l.item.category === cat).length} selecionados / {group.length}{" "}
                opções)
              </span>
            </summary>
            <div className="mt-3 space-y-3">
              {group.map((item) => {
                const p = preference(plan, item.id);
                const l = lines.find((l) => l.item.id === item.id);
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 font-bold">
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 accent-[var(--primary)]"
                        checked={p.selected}
                        onChange={(e) =>
                          save((current) => setSelected(current, item, e.target.checked))
                        }
                      />
                      {item.name}
                    </label>
                    {p.selected && l && (
                      <div className="mt-2 space-y-3">
                        <p>
                          {l.required === null
                            ? "Informe a quantidade total desejada."
                            : `Necessário: ${formatShopQuantity(l.required, item.unit)}`}
                        </p>
                        <p className="font-bold">
                          {l.missing === null
                            ? "Quantidade a confirmar"
                            : l.missing > 0
                              ? `Comprar: ${formatShopQuantity(l.missing, item.unit)}`
                              : "Sem falta neste item, pelo saldo informado."}
                        </p>
                        {item.note && <p className="text-sm">{item.note}</p>}
                        <details>
                          <summary className="min-h-11 cursor-pointer underline">
                            Ajustar quantidade / informar o que já tenho
                          </summary>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <NumberField
                              label={`Quantidade total: ${item.name}`}
                              suffix={item.unit}
                              value={p.target}
                              onChange={(v) => edit(item.id, "target", v)}
                              hint="Opcional quando há sugestão. Em branco: recalcular pelo planejamento."
                            />
                            <NumberField
                              label={`Já tenho: ${item.name}`}
                              suffix={item.unit}
                              value={p.stock}
                              onChange={(v) => edit(item.id, "stock", v)}
                              hint="Opcional. Em branco: gerar necessidade integral, sem afirmar que seu estoque é zero."
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setMovement({ item, kind: "buy" });
                                setAmount(null);
                                setMoveError("");
                              }}
                            >
                              Comprei: {item.name}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setMovement({ item, kind: "use" });
                                setAmount(null);
                                setMoveError("");
                              }}
                            >
                              Usei: {item.name}
                            </Button>
                            {(p.target !== null || p.stock !== null) && (
                              <Button
                                variant="ghost"
                                onClick={() =>
                                  save((current) => ({
                                    ...current,
                                    choices: {
                                      ...current.choices,
                                      [item.id]: {
                                        ...preference(current, item.id),
                                        target: null,
                                        stock: null,
                                      },
                                    },
                                  }))
                                }
                              >
                                Voltar à sugestão e limpar saldo informado
                              </Button>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {lines.some((l) => l.item.category === cat) && (
              <Button variant="outline" className="mt-4" onClick={() => copy(cat)}>
                <Copy aria-hidden />
                Copiar esta categoria
              </Button>
            )}
          </details>
        );
      })}
      <Button variant="outline" onClick={() => setAdding(!adding)}>
        <Plus aria-hidden />
        Adicionar meu item
      </Button>
      {adding && (
        <CustomItemForm
          onCancel={() => setAdding(false)}
          onAdd={(item, target) => {
            if (
              save((p) => ({
                ...p,
                customItems: [...p.customItems, item],
                choices: { ...p.choices, [item.id]: { selected: true, target, stock: null } },
              }))
            )
              setAdding(false);
          }}
        />
      )}
      <Section title="Lista pronta para copiar">
        {!lines.length ? (
          <p>Marque os itens que deseja para gerar sua lista.</p>
        ) : (
          <>
            {lines.some((l) => l.required === null) && (
              <p role="status" className="mb-3 font-bold">
                Há itens com quantidade a confirmar. Eles ficam identificados no texto.
              </p>
            )}
            <pre className="whitespace-pre-wrap break-words rounded-lg border p-3 font-sans text-base">
              {shoppingText(plan, data.people.length)}
            </pre>
            <Button className="mt-4" onClick={() => copy()}>
              <ShoppingCart aria-hidden />
              Copiar lista para WhatsApp
            </Button>
            <p className="mt-2 text-sm">
              Só itens selecionados e faltantes. Sem nomes, fotos, endereços ou links comerciais.
            </p>
          </>
        )}
        {copyFallback !== null && (
          <div className="mt-4">
            <label className="font-bold" htmlFor="manual-copy">
              Cópia automática indisponível: selecione e copie o texto abaixo.
            </label>
            <textarea
              id="manual-copy"
              className="field-control mt-2 min-h-52"
              readOnly
              value={copyFallback}
              onFocus={(e) => e.target.select()}
            />
            <Button variant="outline" onClick={() => setCopyFallback(null)}>
              Fechar texto
            </Button>
          </div>
        )}
      </Section>
      <Dialog
        open={movement !== null}
        onOpenChange={(open) => {
          if (!open) setMovement(null);
        }}
      >
        <DialogContent>
          {movement && (
            <form onSubmit={move} className="space-y-4">
              <DialogTitle>
                {movement.kind === "buy" ? "Comprei" : "Usei"}: {movement.item.name}
              </DialogTitle>
              <DialogDescription>
                Confirme a quantidade para atualizar o saldo informado neste aparelho.
              </DialogDescription>
              <NumberField
                label="Quantidade do movimento"
                value={amount}
                onChange={setAmount}
                suffix={movement.item.unit}
              />
              {moveError && <p role="alert">{moveError}</p>}
              <div className="flex gap-2">
                <Button type="submit">Confirmar quantidade</Button>
                <Button type="button" variant="outline" onClick={() => setMovement(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: ShopItem, target: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ShopCategory>("graos");
  const [unit, setUnit] = useState<ShopUnit>("g");
  const [target, setTarget] = useState<number | null>(null);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4 rounded-xl border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !name.trim() ||
          target === null ||
          !Number.isFinite(target) ||
          target <= 0 ||
          target > 1e9 ||
          (unit === "un" && !Number.isInteger(target))
        ) {
          setError(
            "Informe um nome e uma quantidade válida maior que zero; unidades devem ser inteiras.",
          );
          return;
        }
        onAdd(
          {
            id: `custom-${newId()}`,
            name: name.trim(),
            category,
            unit,
            basis: "confirmed",
            rate: null,
          },
          target,
        );
      }}
    >
      <h2 className="text-xl">Seu item</h2>
      <TextField label="Nome do item" value={name} onChange={setName} maxLength={100} />
      <SelectField
        label="Categoria do item"
        value={category}
        onChange={setCategory}
        options={SHOP_CATEGORIES.map((value) => ({ value, label: SHOP_LABELS[value] }))}
      />
      <SelectField
        label="Unidade do item"
        value={unit}
        onChange={setUnit}
        options={(["g", "kg", "L", "mL", "un"] as ShopUnit[]).map((value) => ({
          value,
          label: value,
        }))}
      />
      <NumberField
        label="Quantidade desejada no período"
        value={target}
        onChange={setTarget}
        suffix={unit}
      />
      {error && <p role="alert">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">Adicionar à lista</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
