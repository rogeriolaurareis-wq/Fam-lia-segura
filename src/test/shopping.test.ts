import { describe, it, expect } from "vitest";
import {
  emptyShopping,
  SHOP_CATALOG,
  normalizeShopping,
  setSelected,
  shoppingLines,
  shoppingText,
  type ShopItem,
  type ShoppingPlan,
} from "@/lib/domain/shopping";
import { parseEnvelope, SCHEMA_VERSION } from "@/lib/storage/persist";
import { emptyData } from "@/lib/domain/types";
const item = (id: string) => SHOP_CATALOG.find((i) => i.id === id)!;
describe("lista de compras", () => {
  it("calcula selecionados, desconta saldo e exporta em texto sem desmarcados", () => {
    let p: ShoppingPlan = { ...emptyShopping(), people: 4, days: 7 };
    p = setSelected(p, item("arroz-0"), true);
    p = setSelected(p, item("feijao-0"), true);
    p.choices["arroz-0"] = { selected: true, target: null, stock: 3000 };
    const lines = shoppingLines(p, 0);
    expect(lines[0]?.required).toBe(4200);
    expect(lines[0]?.missing).toBe(1200);
    const text = shoppingText(p, 0);
    expect(text).toContain("Arroz branco — 1,2 kg");
    expect(text).toContain("Feijão carioca seco — 1,68 kg");
    expect(text).not.toContain("Castanha");
    expect(text).not.toContain("http");
  });
  it("troca variante sem duplicar leite e preserva preferências da outra opção", () => {
    let p = setSelected({ ...emptyShopping(), people: 2 }, item("leite-0"), true);
    p.choices["leite-0"]!.stock = 100;
    p = setSelected(p, item("leite-3"), true);
    expect(shoppingLines(p, 0).map((l) => l.item.id)).toEqual(["leite-3"]);
    expect(p.choices["leite-0"]!.stock).toBe(100);
  });
  it("não inventa consumo de animais nem mistura pó com líquido", () => {
    let p = setSelected(emptyShopping(), item("animal-0"), true);
    p = setSelected(p, item("leite-5"), true);
    expect(shoppingLines(p, 0).every((l) => l.required === null)).toBe(true);
    expect(item("leite-5").unit).toBe("L");
    expect(shoppingText(p, 0)).toContain("quantidade a confirmar");
  });
  it("estoque desconhecido gera lista integral; saldo conhecido pode zerar falta", () => {
    const p = setSelected({ ...emptyShopping(), people: 1 }, item("escova"), true);
    expect(shoppingLines(p, 0)[0]?.stock).toBeNull();
    p.choices["escova"]!.stock = 2;
    expect(shoppingLines(p, 0)[0]?.missing).toBe(0);
    expect(shoppingText(p, 0)).not.toContain("Escova de dente");
  });
  it("cálculo por casa não multiplica equipamentos pelo período ou pessoas", () => {
    const p = setSelected(
      { ...emptyShopping(), people: 10, days: 30 },
      item("equipamento-0"),
      true,
    );
    expect(shoppingLines(p, 0)[0]?.required).toBe(1);
  });
  it("aceita item particular com quantidade total e categoria", () => {
    const i: ShopItem = {
      id: "custom-x",
      name: "Meu item",
      category: "higiene",
      unit: "un",
      basis: "confirmed",
      rate: null,
    };
    const p = {
      ...emptyShopping(),
      customItems: [i],
      choices: { [i.id]: { selected: true, target: 5, stock: 2 } },
    };
    expect(normalizeShopping(p)).toEqual(p);
    expect(shoppingLines(p, 0)[0]?.missing).toBe(3);
  });
  it("rejeita quantidades corrompidas e preserva importação antiga", () => {
    const old = emptyData();
    const { shopping, ...v1 } = old;
    const r = parseEnvelope(
      JSON.stringify({
        app: "familia-segura",
        schemaVersion: 1,
        data: { ...v1, home: { ...v1.home, meetingPoint: "Praça" } },
      }),
    );
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.data.shopping).toEqual(emptyShopping());
      expect(r.data.home.meetingPoint).toBe("Praça");
      expect(r.migratedFrom).toBe(1);
    }
    const raw = JSON.stringify({
      app: "familia-segura",
      schemaVersion: SCHEMA_VERSION,
      data: { ...old, shopping: { ...shopping, days: -1 } },
    });
    expect(parseEnvelope(raw).status).toBe("corrupt");
  });
});
