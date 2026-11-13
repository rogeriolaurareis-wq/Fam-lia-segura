import type { ABO, Rh } from "./types";

export const ABO_OPTIONS: { value: ABO; label: string }[] = [
  { value: "nao_sei", label: "Não sei" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
];
export const RH_OPTIONS: { value: Rh; label: string }[] = [
  { value: "nao_sei", label: "Não sei" },
  { value: "positivo", label: "Positivo (+)" },
  { value: "negativo", label: "Negativo (−)" },
];

export interface BloodInput {
  abo: ABO;
  rh: Rh;
  bloodDocConfirmed: boolean;
  bloodDocNote: string;
}

/**
 * Rules: "não sei" is always valid. Any known ABO or Rh requires the user to confirm it comes
 * from a document/exam and to name that origin. The app never infers a blood type from
 * relatives or any other data.
 */
export function validateBlood(b: BloodInput): string[] {
  const errors: string[] = [];
  const validAbo: ABO[] = ["A", "B", "AB", "O", "nao_sei"];
  const validRh: Rh[] = ["positivo", "negativo", "nao_sei"];
  if (!validAbo.includes(b.abo)) errors.push("Grupo ABO inválido.");
  if (!validRh.includes(b.rh)) errors.push("Fator Rh inválido.");
  const known = b.abo !== "nao_sei" || b.rh !== "nao_sei";
  if (known) {
    if (!b.bloodDocConfirmed)
      errors.push(
        "Para registrar grupo sanguíneo conhecido, confirme que a informação vem de documento ou exame.",
      );
    if (!b.bloodDocNote.trim())
      errors.push("Informe a origem documental (ex.: carteira de doador, exame laboratorial).");
  }
  return errors;
}

export function bloodLabel(b: Pick<BloodInput, "abo" | "rh">): string {
  if (b.abo === "nao_sei" && b.rh === "nao_sei") return "Não sei";
  const abo = b.abo === "nao_sei" ? "ABO não sei" : b.abo;
  const rh = b.rh === "nao_sei" ? "Rh não sei" : b.rh === "positivo" ? "+" : "−";
  return b.abo !== "nao_sei" && b.rh !== "nao_sei" ? `${abo}${rh}` : `${abo} / ${rh}`;
}
