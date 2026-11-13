/** Local shopping planning. Rates are adjustable editorial estimates, not a complete diet. */
export const SHOP_CATEGORIES = [
  "agua",
  "graos",
  "massas",
  "proteinas",
  "conservas",
  "frutas",
  "leites",
  "preparo",
  "higiene",
  "limpeza",
  "animais",
  "equipamentos",
] as const;
export type ShopCategory = (typeof SHOP_CATEGORIES)[number];
export const SHOP_LABELS: Record<ShopCategory, string> = {
  agua: "Água",
  graos: "Arroz, feijão e grãos",
  massas: "Massas e café da manhã",
  proteinas: "Proteínas",
  conservas: "Legumes e conservas",
  frutas: "Frutas, castanhas e lanches",
  leites: "Leites e alternativas",
  preparo: "Preparo e bebidas",
  higiene: "Higiene pessoal",
  limpeza: "Limpeza da casa",
  animais: "Animais",
  equipamentos: "Equipamentos",
};
export type ShopUnit = "g" | "kg" | "L" | "mL" | "un";
export type ShopBasis =
  "person_day" | "person_month" | "person" | "home_day" | "home" | "confirmed";
export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  unit: ShopUnit;
  basis: ShopBasis;
  rate: number | null;
  group?: string;
  note?: string;
}
export interface ShopPreference {
  selected: boolean;
  target: number | null;
  stock: number | null;
}
export interface ShoppingPlan {
  people: number | null;
  days: number;
  choices: Record<string, ShopPreference>;
  customItems: ShopItem[];
}
export const emptyShopping = (): ShoppingPlan => ({
  people: null,
  days: 3,
  choices: {},
  customItems: [],
});
const variants = (
  category: ShopCategory,
  group: string,
  names: string[],
  unit: ShopUnit,
  basis: ShopBasis,
  rate: number | null,
): ShopItem[] =>
  names.map((name, i) => ({ id: `${group}-${i}`, name, category, unit, basis, rate, group }));
export const SHOP_CATALOG: ShopItem[] = [
  {
    id: "agua",
    name: "Água: reserva emergencial básica",
    category: "agua",
    unit: "L",
    basis: "person_day",
    rate: 3.8,
    note: "Referência CDC para reserva curta de bebida e saneamento básico; não cobre todo o consumo doméstico. Ajuste às necessidades.",
  },
  ...variants(
    "graos",
    "arroz",
    ["Arroz branco", "Arroz integral", "Arroz parboilizado"],
    "g",
    "person_day",
    150,
  ),
  ...variants(
    "graos",
    "feijao",
    [
      "Feijão carioca seco",
      "Feijão preto seco",
      "Feijão branco seco",
      "Lentilha seca",
      "Grão-de-bico seco",
      "Ervilha seca",
    ],
    "g",
    "person_day",
    60,
  ),
  ...variants(
    "massas",
    "massa",
    ["Macarrão tradicional", "Macarrão integral", "Macarrão sem glúten"],
    "g",
    "person_day",
    100,
  ),
  ...variants(
    "massas",
    "cereal",
    ["Aveia", "Farinha de mandioca", "Farinha de milho", "Flocos de milho"],
    "g",
    "person_day",
    50,
  ),
  ...variants(
    "massas",
    "biscoito",
    ["Torradas", "Biscoito salgado", "Biscoito integral", "Biscoito sem glúten"],
    "g",
    "person_day",
    50,
  ),
  ...variants(
    "proteinas",
    "proteina",
    ["Carne em conserva", "Atum em conserva", "Sardinha em conserva", "Proteína de soja seca"],
    "g",
    "person_day",
    null,
  ),
  ...variants(
    "proteinas",
    "legume-pronto",
    [
      "Feijão pronto de longa duração",
      "Lentilha pronta de longa duração",
      "Grão-de-bico em conserva",
    ],
    "g",
    "person_day",
    null,
  ),
  ...variants(
    "conservas",
    "conserva",
    ["Milho em lata", "Ervilha em lata", "Seleta de legumes", "Cenoura em conserva"],
    "g",
    "person_day",
    80,
  ),
  ...variants(
    "conservas",
    "molho",
    ["Molho de tomate", "Extrato de tomate"],
    "g",
    "person_day",
    null,
  ),
  ...variants(
    "frutas",
    "fruta",
    ["Uva-passa", "Damasco seco", "Banana desidratada", "Ameixa seca", "Frutas em conserva"],
    "g",
    "person_day",
    null,
  ),
  ...variants(
    "frutas",
    "castanha",
    [
      "Castanha-de-caju",
      "Castanha-do-pará",
      "Amendoim",
      "Amêndoas",
      "Nozes",
      "Sementes de girassol",
    ],
    "g",
    "person_day",
    30,
  ),
  ...variants(
    "frutas",
    "pasta",
    ["Pasta de amendoim", "Pasta de castanhas"],
    "g",
    "person_day",
    null,
  ),
  ...variants("frutas", "barra", ["Barra de cereal", "Barra de frutas"], "un", "person_day", 1),
  ...variants(
    "leites",
    "leite",
    [
      "Leite em pó integral",
      "Leite em pó desnatado",
      "Leite em pó light",
      "Leite em pó sem lactose",
      "Leite em pó desnatado sem lactose",
      "Leite UHT integral",
      "Leite UHT sem lactose",
      "Bebida vegetal de longa duração",
    ],
    "g",
    "person_day",
    30,
  ),
  ...variants("preparo", "oleo", ["Óleo vegetal", "Azeite"], "mL", "person_day", 25),
  ...["Sal", "Açúcar", "Café", "Chá", "Temperos secos", "Alimentação infantil habitual"].map(
    (name, i): ShopItem => ({
      id: `preparo-${i}`,
      name,
      category: "preparo",
      unit: "g",
      basis: "confirmed",
      rate: null,
    }),
  ),
  {
    id: "sabao",
    name: "Sabonete",
    category: "higiene",
    unit: "g",
    basis: "person_month",
    rate: 250,
    note: "Referência humanitária UNHCR: 250 g por pessoa/mês; ajuste livre.",
  },
  {
    id: "escova",
    name: "Escova de dente",
    category: "higiene",
    unit: "un",
    basis: "person",
    rate: 1,
  },
  {
    id: "pasta",
    name: "Pasta de dente",
    category: "higiene",
    unit: "g",
    basis: "person_day",
    rate: 1,
  },
  { id: "toalha", name: "Toalha", category: "higiene", unit: "un", basis: "person", rate: 1 },
  ...[
    "Papel higiênico",
    "Fio dental",
    "Shampoo",
    "Condicionador",
    "Absorventes",
    "Fraldas infantis",
    "Fraldas geriátricas",
    "Lenços umedecidos",
    "Creme de barreira",
  ].map((name, i): ShopItem => ({
    id: `higiene-${i}`,
    name,
    category: "higiene",
    unit: "un",
    basis: "confirmed",
    rate: null,
  })),
  {
    id: "sabao-roupa",
    name: "Sabão para roupas",
    category: "limpeza",
    unit: "g",
    basis: "person_month",
    rate: 200,
    note: "Referência humanitária UNHCR: 200 g por pessoa/mês; concentração varia por produto.",
  },
  {
    id: "detergente",
    name: "Detergente de louça",
    category: "limpeza",
    unit: "mL",
    basis: "person_day",
    rate: 10,
  },
  ...["Limpador multiuso", "Desinfetante", "Sacos de lixo"].map((name, i): ShopItem => ({
    id: `limpeza-consumo-${i}`,
    name,
    category: "limpeza",
    unit: "un",
    basis: "confirmed",
    rate: null,
  })),
  ...["Esponja", "Pano de limpeza", "Par de luvas de limpeza", "Balde", "Vassoura", "Rodo"].map(
    (name, i): ShopItem => ({
      id: `limpeza-${i}`,
      name,
      category: "limpeza",
      unit: "un",
      basis: "home",
      rate: 1,
    }),
  ),
  ...[
    "Ração habitual",
    "Água para os animais",
    "Areia sanitária",
    "Sacos para fezes",
    "Tapetes higiênicos",
    "Comedouro",
    "Bebedouro",
    "Guia ou peitoral",
    "Coleira com identificação",
    "Caixa de transporte",
    "Manta para animal",
  ].map((name, i): ShopItem => ({
    id: `animal-${i}`,
    name,
    category: "animais",
    unit: i === 0 ? "kg" : i === 1 ? "L" : "un",
    basis: "confirmed",
    rate: null,
  })),
  ...[
    "Lanterna",
    "Rádio portátil",
    "Bateria externa",
    "Abridor manual de latas",
    "Mochila",
    "Apito",
    "Capa de chuva",
    "Manta ou cobertor",
    "Ferramentas básicas",
    "Recipiente próprio para água",
  ].map((name, i): ShopItem => ({
    id: `equipamento-${i}`,
    name,
    category: "equipamentos",
    unit: "un",
    basis: i === 4 || i === 5 || i === 6 || i === 7 ? "person" : "home",
    rate: 1,
  })),
  {
    id: "pilhas",
    name: "Pilhas compatíveis com os equipamentos",
    category: "equipamentos",
    unit: "un",
    basis: "confirmed",
    rate: null,
  },
];
// UHT and vegetable drinks use litres, without converting powder into liquid.
for (const item of SHOP_CATALOG)
  if (["leite-5", "leite-6", "leite-7"].includes(item.id)) {
    item.unit = "L";
    item.rate = null;
    item.basis = "confirmed";
  }
export const CATALOG_REVISION = "2026-11-13-draft-1";
export function preference(plan: ShoppingPlan, id: string): ShopPreference {
  return plan.choices[id] ?? { selected: false, target: null, stock: null };
}
const nonnegative = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e9;
export function normalizeShopping(input: unknown): ShoppingPlan {
  if (input === undefined) return emptyShopping();
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("plano de compras inválido");
  const p = input as ShoppingPlan;
  if (p.people !== null && (!Number.isInteger(p.people) || p.people < 1 || p.people > 10000))
    throw new Error("número de pessoas inválido");
  if (!Number.isInteger(p.days) || p.days < 1 || p.days > 365)
    throw new Error("período de compras inválido");
  if (!p.choices || typeof p.choices !== "object" || Array.isArray(p.choices))
    throw new Error("preferências inválidas");
  for (const v of Object.values(p.choices))
    if (
      !v ||
      typeof v !== "object" ||
      typeof v.selected !== "boolean" ||
      (v.target !== null && !nonnegative(v.target)) ||
      (v.stock !== null && !nonnegative(v.stock))
    )
      throw new Error("quantidade de compras inválida");
  if (!Array.isArray(p.customItems) || p.customItems.length > 500)
    throw new Error("itens personalizados inválidos");
  const ids = new Set(SHOP_CATALOG.map((i) => i.id));
  for (const i of p.customItems) {
    if (
      !i ||
      typeof i.id !== "string" ||
      ids.has(i.id) ||
      !i.id.startsWith("custom-") ||
      typeof i.name !== "string" ||
      !i.name.trim() ||
      i.name.length > 100 ||
      !SHOP_CATEGORIES.includes(i.category) ||
      !["g", "kg", "L", "mL", "un"].includes(i.unit) ||
      i.basis !== "confirmed" ||
      i.rate !== null
    )
      throw new Error("item personalizado inválido");
    ids.add(i.id);
  }
  return p;
}
export function setSelected(plan: ShoppingPlan, item: ShopItem, selected: boolean): ShoppingPlan {
  const choices = { ...plan.choices };
  // One variant per group in this first implementation: quantities cannot silently multiply.
  if (selected && item.group)
    for (const peer of SHOP_CATALOG)
      if (peer.group === item.group && peer.id !== item.id)
        choices[peer.id] = { ...preference(plan, peer.id), selected: false };
  choices[item.id] = { ...preference(plan, item.id), selected };
  return { ...plan, choices };
}
export interface ShopLine {
  item: ShopItem;
  required: number | null;
  stock: number | null;
  missing: number | null;
  manual: boolean;
}
export function shoppingLines(plan: ShoppingPlan, registeredPeople: number): ShopLine[] {
  const count = plan.people ?? (registeredPeople > 0 ? registeredPeople : null);
  return [...SHOP_CATALOG, ...plan.customItems]
    .filter((i) => preference(plan, i.id).selected)
    .map((item) => {
      const p = preference(plan, item.id);
      const factor =
        item.basis === "person_day"
          ? count === null
            ? null
            : count * plan.days
          : item.basis === "person_month"
            ? count === null
              ? null
              : (count * plan.days) / 30
            : item.basis === "person"
              ? count
              : item.basis === "home_day"
                ? plan.days
                : item.basis === "home"
                  ? 1
                  : null;
      const raw = p.target ?? (factor !== null && item.rate !== null ? factor * item.rate : null);
      const required =
        raw === null
          ? null
          : item.unit === "un"
            ? Math.ceil(raw)
            : Math.ceil((raw - 1e-9) * 100) / 100;
      return {
        item,
        required,
        stock: p.stock,
        missing:
          required === null
            ? null
            : Math.max(0, Math.round((required - (p.stock ?? 0)) * 100) / 100),
        manual: p.target !== null,
      };
    });
}
export function formatShopQuantity(n: number, unit: ShopUnit): string {
  if (unit === "g" && n >= 1000)
    return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`;
  if (unit === "mL" && n >= 1000)
    return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} L`;
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unit === "un" ? "unidades" : unit}`;
}
export function shoppingText(
  plan: ShoppingPlan,
  registeredPeople: number,
  category?: ShopCategory,
): string {
  const lines = shoppingLines(plan, registeredPeople).filter(
    (l) => !category || l.item.category === category,
  );
  const parts = ["LISTA DE COMPRAS", `Planejamento: ${plan.days} dias`];
  for (const cat of SHOP_CATEGORIES) {
    const group = lines.filter(
      (l) => l.item.category === cat && (l.missing === null || l.missing > 0),
    );
    if (!group.length) continue;
    parts.push("", SHOP_LABELS[cat].toLocaleUpperCase("pt-BR"));
    for (const l of group)
      parts.push(
        `${l.item.name} — ${l.missing === null ? "quantidade a confirmar" : formatShopQuantity(l.missing, l.item.unit)}`,
      );
  }
  if (parts.length === 2) parts.push("Nenhum item faltante entre os selecionados.");
  return parts.join("\n");
}
