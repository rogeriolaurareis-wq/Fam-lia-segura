import { ageFromBirth } from "./age";
import { validateBlood } from "./blood";
import { isHttpsUrl } from "./notices";
import { AGE_BANDS } from "./types";
import type { Animal, Contact, Destination, EquipmentItem, KitItem, Notice, Person, SupplyItem, Treatment, Vehicle } from "./types";

/** Error messages keyed by the record's own field names (plus extra keys such as "blood"). */
export type Errs<T, Extra extends string = never> = Partial<Record<Extract<keyof T, string> | Extra, string>>;
/** Generic shape used only by helpers that read any error map. */
export type FieldErrors = Partial<Record<string, string>>;

const num = (n: unknown) => typeof n === "number" && Number.isFinite(n);
const badOptionalNumber = (n: number | null, min: number, max: number) => n !== null && (!num(n) || n <= min || n > max);
const badQuantity = (n: number) => !num(n) || n < 0 || n > 1_000_000;

function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00`);
  return Number.isFinite(d.getTime());
}

export function validatePerson(p: Person, today: Date = new Date()): Errs<Person, "blood"> {
  const e: Errs<Person, "blood"> = {};
  if (!p.name.trim()) e.name = "Informe o nome ou apelido.";
  else if (p.name.trim().length > 80) e.name = "Use no máximo 80 caracteres.";
  if (p.ageBand && !AGE_BANDS.includes(p.ageBand)) e.ageBand = "Escolha uma faixa de idade válida.";
  if (p.photoDataUrl && (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.photoDataUrl) || p.photoDataUrl.length > 400_000)) e.photoDataUrl = "Foto inválida ou muito grande.";
  if ((p.identificationMarks?.length ?? 0) > 1000) e.identificationMarks = "Use até 1000 caracteres para os sinais de identificação.";
  if (p.birthDate) {
    const age = ageFromBirth(p.birthDate, today);
    if (age === null) e.birthDate = "Data de nascimento inválida ou no futuro.";
    else if (age > 125) e.birthDate = "Confira o ano de nascimento.";
  }
  if (badOptionalNumber(p.weightKg, 0, 400)) e.weightKg = "Peso deve ser um número entre 0 e 400 kg.";
  if (badOptionalNumber(p.heightCm, 20, 260)) e.heightCm = "Altura deve ser um número entre 20 e 260 cm.";
  const blood = validateBlood(p);
  if (blood.length) e.blood = blood.join(" ");
  if (p.responsibleId && p.responsibleId === p.id) e.responsibleId = "A pessoa não pode ser responsável por si mesma.";
  return e;
}

export function validateAnimal(a: Animal): Errs<Animal> {
  const e: Errs<Animal> = {};
  if (!a.name.trim()) e.name = "Informe o nome do animal.";
  if (a.species === "outro" && !a.speciesOther.trim()) e.speciesOther = "Descreva a espécie.";
  if (badOptionalNumber(a.weightKg, 0, 2000)) e.weightKg = "Peso deve ser um número maior que 0.";
  if (a.microchip && !/^[0-9A-Za-z-]{6,20}$/.test(a.microchip.trim())) e.microchip = "Use de 6 a 20 letras ou números.";
  return e;
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function validateContact(c: Contact): Errs<Contact> {
  const e: Errs<Contact> = {};
  if (!c.name.trim()) e.name = "Informe o nome do contato.";
  const digits = normalizePhone(c.phone).replace("+", "");
  if (!c.phone.trim()) e.phone = "Informe o telefone.";
  else if (!/^\+?[\d\s().-]+$/.test(c.phone.trim()) || digits.length < 3 || digits.length > 15)
    e.phone = "Telefone inválido: use apenas números (com DDD), de 3 a 15 dígitos.";
  return e;
}

export function validateSupply(s: SupplyItem): Errs<SupplyItem> {
  const e: Errs<SupplyItem> = {};
  if (!s.name.trim()) e.name = "Informe o nome do item.";
  if (badQuantity(s.quantity)) e.quantity = "Quantidade deve ser um número igual ou maior que 0.";
  if (s.target !== null && badQuantity(s.target)) e.target = "Meta deve ser um número igual ou maior que 0.";
  if (s.expiry && !validDate(s.expiry)) e.expiry = "Data de validade inválida.";
  return e;
}

export function validateEquipment(s: EquipmentItem): Errs<EquipmentItem> {
  const e: Errs<EquipmentItem> = {};
  if (!s.name.trim()) e.name = "Informe o nome do item.";
  if (badQuantity(s.quantity) || !Number.isInteger(s.quantity)) e.quantity = "Quantidade deve ser um número inteiro igual ou maior que 0.";
  if (s.lastCheck && !validDate(s.lastCheck)) e.lastCheck = "Data inválida.";
  if (s.nextCheck && !validDate(s.nextCheck)) e.nextCheck = "Data inválida.";
  return e;
}

export function validateVehicle(v: Vehicle): Errs<Vehicle> {
  const e: Errs<Vehicle> = {};
  if (!v.name.trim()) e.name = "Informe uma identificação do veículo.";
  if (!num(v.seatsHumans) || !Number.isInteger(v.seatsHumans) || v.seatsHumans < 0 || v.seatsHumans > 100)
    e.seatsHumans = "Lugares para pessoas: número inteiro entre 0 e 100.";
  if (!num(v.animalSpaces) || !Number.isInteger(v.animalSpaces) || v.animalSpaces < 0 || v.animalSpaces > 100)
    e.animalSpaces = "Espaços para animais: número inteiro entre 0 e 100.";
  return e;
}

export function validateDestination(d: Destination): Errs<Destination> {
  const e: Errs<Destination> = {};
  if (!d.name.trim()) e.name = "Informe o nome do destino.";
  if (d.confirmedOn && !validDate(d.confirmedOn)) e.confirmedOn = "Data inválida.";
  return e;
}

export function validateKit(k: KitItem): Errs<KitItem> {
  const e: Errs<KitItem> = {};
  if (!k.name.trim()) e.name = "Informe o material.";
  if (badQuantity(k.quantity)) e.quantity = "Quantidade deve ser um número igual ou maior que 0.";
  if (k.expiry && !validDate(k.expiry)) e.expiry = "Data inválida.";
  return e;
}

export function validateTreatment(t: Treatment): Errs<Treatment> {
  const e: Errs<Treatment> = {};
  if (!t.fictitiousConfirmed) e.fictitiousConfirmed = "Nesta prévia só é permitido registro fictício. Confirme que os dados são fictícios.";
  if (!t.name.trim()) e.name = "Informe um nome (fictício) para o registro.";
  if (badQuantity(t.stock)) e.stock = "Estoque deve ser um número igual ou maior que 0.";
  if (t.dailyConsumption !== null && (!num(t.dailyConsumption) || t.dailyConsumption <= 0))
    e.dailyConsumption = "Consumo diário deve ser um número maior que 0, ou deixe em branco.";
  if (t.dailyConsumptionValidated && t.dailyConsumption === null)
    e.dailyConsumption = "Para marcar como validado, informe o consumo diário já prescrito.";
  if (t.expiry && !validDate(t.expiry)) e.expiry = "Data inválida.";
  return e;
}

export function validateNotice(n: Notice): Errs<Notice> {
  const e: Errs<Notice> = {};
  if (!n.title.trim()) e.title = "Informe o título do aviso.";
  if (!n.source.trim()) e.source = "Informe o órgão ou fonte.";
  if (n.url.trim() && !isHttpsUrl(n.url.trim())) e.url = "O endereço precisa começar com https://";
  if (!n.publishedAt) e.publishedAt = "Informe data e hora da publicação.";
  if (!n.timezone.trim()) e.timezone = "Informe o fuso horário da publicação.";
  if (n.validUntil && n.publishedAt && new Date(n.validUntil) < new Date(n.publishedAt))
    e.validUntil = "A validade não pode ser anterior à publicação.";
  return e;
}

export function hasErrors(e: object) {
  return Object.values(e).some((v) => typeof v === "string" && v.length > 0);
}
