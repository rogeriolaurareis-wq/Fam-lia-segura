import { computeCapacity } from "./exit";
import { isNoticeExpired } from "./notices";
import { shoppingLines } from "./shopping";
import { RISK_KEYS, type AppData } from "./types";
import type { NavItem } from "@/lib/nav";

export interface Step {
  text: string;
  to: NavItem["to"];
}

/** Concrete next steps derived only from what is (not) registered. Never states "safe". */
export function nextSteps(d: AppData, today: Date = new Date()): Step[] {
  const s: Step[] = [];
  if (d.people.length === 0)
    s.push({ text: "Cadastre as pessoas que moram com você.", to: "/familia" });
  if (d.contacts.length === 0)
    s.push({ text: "Adicione pelo menos um contato de emergência.", to: "/rede" });
  const noContact = d.people.filter((p) => !p.emergencyContactId).length;
  if (d.people.length > 0 && d.contacts.length > 0 && noContact > 0)
    s.push({ text: `Vincule um contato de emergência a ${noContact} pessoa(s).`, to: "/familia" });
  if (!d.home.meetingPoint.trim())
    s.push({ text: "Defina um ponto de encontro da família.", to: "/moradia" });
  const unanswered = RISK_KEYS.filter((k) => !d.home.risks[k]).length;
  if (unanswered > 0)
    s.push({
      text: `Responda ${unanswered} pergunta(s) sobre o entorno da moradia.`,
      to: "/moradia",
    });
  const lines = shoppingLines(d.shopping, d.people.length);
  if (!lines.length) s.push({ text: "Escolha os itens da sua lista de compras.", to: "/reservas" });
  if (lines.some((l) => l.required === null))
    s.push({ text: "Confirme as quantidades pendentes na lista de compras.", to: "/reservas" });
  if (!d.equipment.some((e) => e.type === "lanterna" && e.quantity > 0))
    s.push({
      text: "Cadastre uma lanterna (ou registre que precisa de uma).",
      to: "/equipamentos",
    });
  const review = d.equipment.filter((e) => e.condition !== "funcionando").length;
  if (review)
    s.push({
      text: `Verifique ${review} equipamento(s) não verificados ou com problema.`,
      to: "/equipamentos",
    });
  const cap = computeCapacity(d.vehicles, d.people.length, d.animals.length);
  if (d.vehicles.length > 0 && (cap.missingSeats > 0 || cap.missingAnimalSpaces > 0))
    s.push({
      text: "Os lugares declarados nos veículos não cobrem toda a família. Planeje alternativas.",
      to: "/saida",
    });
  if (d.destinations.length === 0)
    s.push({ text: "Cadastre ao menos um destino para onde ir, se precisar sair.", to: "/saida" });
  const unconfirmed = d.destinations.filter(
    (x) => x.acceptsPeople !== "sim" || (d.animals.length > 0 && x.acceptsAnimals !== "sim"),
  ).length;
  if (unconfirmed)
    s.push({ text: `Confirme o acolhimento em ${unconfirmed} destino(s).`, to: "/saida" });
  const animalsNoResp = d.animals.filter((a) => !a.responsibleId).length;
  if (animalsNoResp)
    s.push({ text: `Defina um responsável para ${animalsNoResp} animal(is).`, to: "/animais" });
  const expiredNotices = d.notices.filter((n) => isNoticeExpired(n.validUntil, today)).length;
  if (expiredNotices)
    s.push({
      text: `${expiredNotices} aviso(s) registrado(s) já venceram. Revise ou exclua.`,
      to: "/avisos",
    });
  return s;
}

export interface FillItem {
  label: string;
  done: boolean;
}

/** Fill degree of the registration. It does NOT measure safety. */
export function fillItems(d: AppData): FillItem[] {
  const selected = shoppingLines(d.shopping, d.people.length);
  return [
    { label: "Pessoas cadastradas", done: d.people.length > 0 },
    { label: "Contato de emergência", done: d.contacts.length > 0 },
    { label: "Ponto de encontro", done: !!d.home.meetingPoint.trim() },
    { label: "Perguntas da moradia respondidas", done: RISK_KEYS.every((k) => !!d.home.risks[k]) },
    {
      label: "Pessoas e período do planejamento",
      done: (d.shopping.people ?? d.people.length) > 0 && d.shopping.days > 0,
    },
    { label: "Preferências de compras", done: selected.length > 0 },
    { label: "Equipamentos cadastrados", done: d.equipment.length > 0 },
    { label: "Destino de saída", done: d.destinations.length > 0 },
  ];
}
