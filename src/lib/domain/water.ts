import type { SupplyItem, WaterParams } from "./types";

export interface WaterInput {
  params: WaterParams;
  registeredPeople: number;
  days: number | null;
  supplies: SupplyItem[];
}

export interface PurposeLine {
  key: "beber" | "cozinhar" | "higiene" | "animais";
  label: string;
  /** Value typed by the user, null when not informed. Never defaulted. */
  param: number | null;
  totalL: number | null;
  formula: string;
}

export interface WaterResult {
  people: number | null;
  days: number | null;
  lines: PurposeLine[];
  potableNeedL: number | null; // beber + cozinhar + animais (only when all informed)
  hygieneNeedL: number | null;
  potableStockL: number;
  cleaningStockL: number;
  notCountedItems: SupplyItem[]; // water items in units other than L (not mixed)
  potableGapL: number | null;
  hygieneGapL: number | null;
  missing: string[];
  assumptions: string[];
}

const round = (n: number) => Math.round(n * 100) / 100;

function validNum(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

/** Pure arithmetic over values explicitly informed by the user. No built-in consumption values. */
export function computeWater({ params, registeredPeople, days, supplies }: WaterInput): WaterResult {
  const people =
    params.peopleMode === "manual"
      ? validNum(params.peopleManual)
        ? Math.floor(params.peopleManual)
        : null
      : registeredPeople;
  const d = validNum(days) && days > 0 ? days : null;
  const missing: string[] = [];
  if (people === null) missing.push("número de pessoas");
  if (d === null) missing.push("número de dias do cenário");

  const perPerson = (
    key: PurposeLine["key"],
    label: string,
    param: number | null,
  ): PurposeLine => {
    const ok = validNum(param);
    if (!ok) missing.push(`${label.toLowerCase()} (L por pessoa/dia)`);
    const totalL = ok && people !== null && d !== null ? round(param * people * d) : null;
    return {
      key,
      label,
      param: ok ? param : null,
      totalL,
      formula: `${ok ? param : "?"} L × ${people ?? "?"} pessoa(s) × ${d ?? "?"} dia(s)`,
    };
  };

  const lines: PurposeLine[] = [
    perPerson("beber", "Beber", params.drinkLPerPersonDay),
    perPerson("cozinhar", "Cozinhar", params.cookLPerPersonDay),
    perPerson("higiene", "Higiene", params.hygieneLPerPersonDay),
  ];
  const animalOk = validNum(params.animalTotalLPerDay);
  if (!animalOk) missing.push("total para animais (L/dia)");
  lines.push({
    key: "animais",
    label: "Animais",
    param: animalOk ? params.animalTotalLPerDay : null,
    totalL: animalOk && d !== null ? round(params.animalTotalLPerDay! * d) : null,
    formula: `${animalOk ? params.animalTotalLPerDay : "?"} L/dia (total) × ${d ?? "?"} dia(s)`,
  });

  const get = (k: PurposeLine["key"]) => lines.find((l) => l.key === k)!.totalL;
  const beber = get("beber");
  const cozinhar = get("cozinhar");
  const animais = get("animais");
  const potableNeedL =
    beber !== null && cozinhar !== null && animais !== null ? round(beber + cozinhar + animais) : null;
  const hygieneNeedL = get("higiene");

  const water = supplies.filter((s) => s.category === "agua_potavel" || s.category === "agua_limpeza");
  const inL = water.filter((s) => s.unit === "L");
  const notCountedItems = water.filter((s) => s.unit !== "L");
  const potableStockL = round(
    inL.filter((s) => s.category === "agua_potavel").reduce((a, s) => a + s.quantity, 0),
  );
  const cleaningStockL = round(
    inL.filter((s) => s.category === "agua_limpeza").reduce((a, s) => a + s.quantity, 0),
  );

  return {
    people,
    days: d,
    lines,
    potableNeedL,
    hygieneNeedL,
    potableStockL,
    cleaningStockL,
    notCountedItems,
    potableGapL: potableNeedL === null ? null : round(Math.max(0, potableNeedL - potableStockL)),
    hygieneGapL: hygieneNeedL === null ? null : round(Math.max(0, hygieneNeedL - cleaningStockL)),
    missing,
    assumptions: [
      "Todos os valores de consumo foram digitados por você; o aplicativo não sugere quantidades.",
      "Beber, cozinhar e animais são comparados com o estoque de “Água potável”.",
      "Higiene é comparada com o estoque de “Água para limpeza”.",
      "Somente itens em litros (L) entram na soma; itens em outras unidades aparecem à parte.",
      "Cálculo aritmético simples: não considera clima, saúde, atividade física ou perdas.",
    ],
  };
}

export function scenarioDays(s: { days: 3 | 7 | 14 | 30 | "custom"; customDays: number | null }) {
  if (s.days === "custom") return validNum(s.customDays) && s.customDays > 0 ? s.customDays : null;
  return s.days;
}
