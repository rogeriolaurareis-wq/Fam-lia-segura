import type { AgeBand, Person } from "./types";

/** Full years between birth (yyyy-mm-dd) and today. Returns null for invalid/future dates. */
export function ageFromBirth(birthDate: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const birth = new Date(y, mo - 1, d);
  if (birth.getFullYear() !== y || birth.getMonth() !== mo - 1 || birth.getDate() !== d) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birth > t) return null;
  let age = t.getFullYear() - y;
  if (t.getMonth() < mo - 1 || (t.getMonth() === mo - 1 && t.getDate() < d)) age -= 1;
  return age;
}

export function bandForAge(age: number): AgeBand {
  if (age <= 3) return "0-3";
  if (age <= 6) return "4-6";
  if (age <= 9) return "7-9";
  if (age <= 12) return "10-12";
  if (age <= 17) return "13-17";
  if (age <= 59) return "18-59";
  return "60+";
}

/** Band from birth date when known, otherwise the declared band, otherwise null. */
export function bandForPerson(
  p: Pick<Person, "birthDate" | "ageBand">,
  today: Date = new Date(),
): AgeBand | null {
  const age = p.birthDate ? ageFromBirth(p.birthDate, today) : null;
  if (age !== null) return bandForAge(age);
  return p.ageBand || null;
}

export function ageLabel(p: Pick<Person, "birthDate" | "ageBand">, today: Date = new Date()) {
  const age = p.birthDate ? ageFromBirth(p.birthDate, today) : null;
  if (age !== null) return age === 1 ? "1 ano" : `${age} anos`;
  if (p.ageBand) return `Faixa ${p.ageBand} (data desconhecida)`;
  return "Idade não informada";
}
