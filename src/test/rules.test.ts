import { describe, expect, it } from "vitest";

import { bandForAge, bandForPerson } from "@/lib/domain/age";
import { validateBlood } from "@/lib/domain/blood";
import { CHECKIN_STATUS_LABEL, checkInStatusLabel, createCheckIn } from "@/lib/domain/checkin";
import { computeWater } from "@/lib/domain/water";
import { emptyData } from "@/lib/domain/types";
import { STORAGE_KEY, loadData, saveData, type StorageLike } from "@/lib/storage/persist";

function memStorage(initial: Record<string, string> = {}): StorageLike & { map: Map<string, string> } {
  const map = new Map(Object.entries(initial));
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

describe("persistência local", () => {
  it("salva e relê os dados", () => {
    const s = memStorage();
    const d = emptyData();
    d.home.meetingPoint = "Praça";
    expect(saveData(s, d).ok).toBe(true);
    const r = loadData(s);
    expect(r.status).toBe("ok");
    if (r.status === "ok") expect(r.data.home.meetingPoint).toBe("Praça");
  });
  it("conteúdo ilegível bloqueia e não é sobrescrito", () => {
    const s = memStorage({ [STORAGE_KEY]: "{quebrado" });
    expect(loadData(s).status).toBe("corrupt");
    expect(s.map.get(STORAGE_KEY)).toBe("{quebrado");
  });
  it("versão mais nova não é rebaixada", () => {
    const raw = JSON.stringify({ app: "familia-segura", schemaVersion: 99, savedAt: "", data: {} });
    const s = memStorage({ [STORAGE_KEY]: raw });
    expect(loadData(s).status).toBe("newer");
    expect(s.map.get(STORAGE_KEY)).toBe(raw);
  });
});

describe("grupo sanguíneo", () => {
  it("'não sei' é sempre válido", () => {
    expect(validateBlood({ abo: "nao_sei", rh: "nao_sei", bloodDocConfirmed: false, bloodDocNote: "" })).toEqual([]);
  });
  it("grupo conhecido exige confirmação e origem documental", () => {
    expect(validateBlood({ abo: "A", rh: "nao_sei", bloodDocConfirmed: false, bloodDocNote: "" }).length).toBe(2);
    expect(validateBlood({ abo: "nao_sei", rh: "negativo", bloodDocConfirmed: true, bloodDocNote: "" }).length).toBe(1);
    expect(validateBlood({ abo: "O", rh: "positivo", bloodDocConfirmed: true, bloodDocNote: "exame" })).toEqual([]);
  });
});

describe("cálculo de água", () => {
  const params = { drinkLPerPersonDay: 2, cookLPerPersonDay: 1, hygieneLPerPersonDay: null, animalTotalLPerDay: 0.5, peopleMode: "cadastro" as const, peopleManual: null };
  it("usa apenas valores informados e não inventa os ausentes", () => {
    const r = computeWater({ params, registeredPeople: 3, days: 7, supplies: [] });
    expect(r.lines.find((l) => l.key === "beber")?.totalL).toBe(42);
    expect(r.lines.find((l) => l.key === "animais")?.totalL).toBe(3.5);
    expect(r.lines.find((l) => l.key === "higiene")?.totalL).toBeNull();
    expect(r.potableNeedL).toBe(66.5);
    expect(r.assumptions.length).toBeGreaterThan(0);
  });
  it("não soma unidades diferentes de litro", () => {
    const base = { createdAt: "", updatedAt: "", category: "agua_potavel" as const, target: null, expiry: "", location: "", notes: "" };
    const r = computeWater({
      params, registeredPeople: 1, days: 3,
      supplies: [{ ...base, id: "a", name: "Galão", quantity: 10, unit: "L" }, { ...base, id: "b", name: "Copos", quantity: 500, unit: "mL" }],
    });
    expect(r.potableStockL).toBe(10);
    expect(r.notCountedItems.map((s) => s.id)).toEqual(["b"]);
  });
});

describe("check-in sem falso envio", () => {
  it("SOS fica sempre registrado localmente e não enviado", () => {
    const c = createCheckIn("sos", "teste", new Date("2026-01-01T10:00:00Z"), "x");
    expect(c.status).toBe("registrado_local_nao_enviado");
    expect(checkInStatusLabel(c)).toBe("Registrado neste aparelho — não enviado");
    expect(CHECKIN_STATUS_LABEL.toLowerCase()).not.toContain("entregue");
  });
});

describe("faixas etárias", () => {
  it("limites das faixas", () => {
    expect([0, 3, 4, 6, 7, 9, 10, 12, 13, 17, 18, 59, 60].map(bandForAge)).toEqual(
      ["0-3", "0-3", "4-6", "4-6", "7-9", "7-9", "10-12", "10-12", "13-17", "13-17", "18-59", "18-59", "60+"],
    );
  });
  it("usa faixa declarada quando a data é desconhecida", () => {
    expect(bandForPerson({ birthDate: "", ageBand: "60+" })).toBe("60+");
    expect(bandForPerson({ birthDate: "2020-06-15", ageBand: "60+" }, new Date("2026-06-14"))).toBe("4-6");
  });
});
