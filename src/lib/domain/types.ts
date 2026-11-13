// Família Segura — domain model (local-only, versioned in src/lib/storage/persist.ts).
import { emptyShopping, type ShoppingPlan } from "./shopping";

export type Tri = "sim" | "nao" | "nao_sei";
export const TRI_LABEL: Record<Tri, string> = { sim: "Sim", nao: "Não", nao_sei: "Não sei" };

export const AGE_BANDS = ["0-3", "4-6", "7-9", "10-12", "13-17", "18-59", "60+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
export const AGE_BAND_LABEL: Record<AgeBand, string> = {
  "0-3": "0 a 3 anos",
  "4-6": "4 a 6 anos",
  "7-9": "7 a 9 anos",
  "10-12": "10 a 12 anos",
  "13-17": "13 a 17 anos",
  "18-59": "18 a 59 anos",
  "60+": "60 anos ou mais",
};

export type ABO = "A" | "B" | "AB" | "O" | "nao_sei";
export type Rh = "positivo" | "negativo" | "nao_sei";

interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Marks sample records loaded from "exemplo fictício". */
  fictitious?: boolean;
}

export type Sex = "" | "feminino" | "masculino" | "intersexo" | "prefiro_nao_informar";
export type Pregnancy = "" | "nao_se_aplica" | "gestante" | "amamentando";

export interface Person extends Base {
  photoDataUrl?: string;
  identificationMarks?: string;
  name: string;
  relation: string;
  birthDate: string; // yyyy-mm-dd or ""
  ageBand: AgeBand | ""; // used only when birthDate is unknown
  sex: Sex;
  weightKg: number | null;
  heightCm: number | null;
  abo: ABO;
  rh: Rh;
  /** Required true for any known ABO or Rh: user confirms it comes from a document/exam. */
  bloodDocConfirmed: boolean;
  bloodDocNote: string;
  conditions: string;
  allergies: string;
  disability: string;
  mobility: string;
  dependency: string;
  pregnancy: Pregnancy;
  childNeeds: string;
  /** Only a flag. No treatment names or doses here (those live in M08 with fictitious data). */
  continuousUse: boolean;
  responsibleId: string | null; // Person id
  emergencyContactId: string | null; // Contact id (M04)
  notes: string;
}

export type Species = "cao" | "gato" | "ave" | "roedor" | "reptil" | "peixe" | "outro";
export const SPECIES_LABEL: Record<Species, string> = {
  cao: "Cão",
  gato: "Gato",
  ave: "Ave",
  roedor: "Roedor",
  reptil: "Réptil",
  peixe: "Peixe",
  outro: "Outro",
};
export type AnimalSize = "" | "pequeno" | "medio" | "grande";
export const SIZE_LABEL: Record<Exclude<AnimalSize, "">, string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export interface Animal extends Base {
  name: string;
  species: Species;
  speciesOther: string;
  breed: string;
  sex: "" | "femea" | "macho" | "nao_sei";
  ageText: string;
  weightKg: number | null;
  size: AnimalSize;
  identification: string;
  microchip: string;
  neutered: Tri | "";
  pregnancyLactation: Tri | "";
  conditions: string;
  allergies: string;
  mobility: string;
  behavior: string;
  dietRestriction: string;
  continuousUse: boolean;
  vaccination: string;
  vet: string;
  responsibleId: string | null;
  notes: string;
}

export const RISK_KEYS = [
  "agua",
  "encosta",
  "arvores",
  "energia",
  "telecom",
  "muros",
  "incendio",
  "quimicos",
  "bloqueios",
] as const;
export type RiskKey = (typeof RISK_KEYS)[number];
export const RISK_QUESTION: Record<RiskKey, string> = {
  agua: "Há rio, córrego, canal ou histórico de alagamento, enchente ou enxurrada perto da moradia?",
  encosta: "Há encosta, barranco ou pedras soltas perto da moradia?",
  arvores: "Há árvores grandes que possam cair sobre a casa, acessos ou veículos?",
  energia: "Há postes, cabos ou redes de energia próximos da moradia ou dos acessos?",
  telecom: "Há torres de telecomunicação próximas?",
  muros: "Há muros altos ou construções que preocupam perto da moradia?",
  incendio: "Há vegetação seca, mata ou histórico de incêndio por perto?",
  quimicos: "Há armazenamento de produtos químicos, gás ou combustível por perto?",
  bloqueios: "Os acessos costumam ficar bloqueados (alagamento, queda de barreira, obras)?",
};
export const RISK_SHORT: Record<RiskKey, string> = {
  agua: "Água / enchente / enxurrada",
  encosta: "Encosta / barranco / pedras",
  arvores: "Árvores",
  energia: "Postes / cabos de energia",
  telecom: "Torres de telecomunicação",
  muros: "Muros / construções",
  incendio: "Incêndio / vegetação",
  quimicos: "Produtos químicos",
  bloqueios: "Bloqueios de acesso",
};

export interface Home {
  address: string;
  reference: string;
  type: "" | "casa" | "apartamento" | "sobrado" | "outro";
  floor: string;
  access: string;
  meetingPoint: string;
  meetingPointAlt: string;
  notes: string;
  risks: Partial<Record<RiskKey, Tri>>;
}

export interface Contact extends Base {
  name: string;
  phone: string;
  relation: string;
  priority: "alta" | "media" | "baixa";
  notes: string;
}

/** The only status that exists: there is no sending backend in this version. */
export type CheckInStatus = "registrado_local_nao_enviado";
export interface CheckIn {
  id: string;
  kind: "ok" | "sos";
  createdAt: string;
  note: string;
  status: CheckInStatus;
}

export const SUPPLY_CATEGORIES = [
  "agua_potavel",
  "agua_limpeza",
  "alimentacao_humana",
  "alimentacao_animal",
  "higiene",
  "limpeza",
] as const;
export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number];
export const SUPPLY_CATEGORY_LABEL: Record<SupplyCategory, string> = {
  agua_potavel: "Água potável",
  agua_limpeza: "Água para limpeza",
  alimentacao_humana: "Alimentação humana",
  alimentacao_animal: "Alimentação animal",
  higiene: "Higiene pessoal",
  limpeza: "Limpeza",
};
export const UNITS = ["L", "mL", "kg", "g", "unidade", "pacote", "lata", "caixa", "rolo"] as const;
export type Unit = (typeof UNITS)[number];

export interface SupplyItem extends Base {
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: Unit;
  target: number | null; // same unit as quantity
  expiry: string;
  location: string;
  notes: string;
}

export interface WaterParams {
  drinkLPerPersonDay: number | null;
  cookLPerPersonDay: number | null;
  hygieneLPerPersonDay: number | null;
  animalTotalLPerDay: number | null;
  peopleMode: "cadastro" | "manual";
  peopleManual: number | null;
}

export type ScenarioDays = 3 | 7 | 14 | 30 | "custom";
export interface Scenario {
  days: ScenarioDays;
  customDays: number | null;
}

export const EQUIPMENT_TYPES = [
  "lanterna",
  "pilhas",
  "radio",
  "carregador",
  "ferramentas",
  "lona",
  "sacos",
  "mochila",
  "protecao",
  "outro",
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];
export const EQUIPMENT_LABEL: Record<EquipmentType, string> = {
  lanterna: "Lanterna",
  pilhas: "Pilhas / baterias",
  radio: "Rádio (pilha ou manivela)",
  carregador: "Carregador / bateria portátil",
  ferramentas: "Ferramentas básicas",
  lona: "Lona",
  sacos: "Sacos resistentes",
  mochila: "Mochila de emergência",
  protecao: "Proteção pessoal (luvas, óculos, capacete)",
  outro: "Outro",
};
export type Condition = "funcionando" | "precisa_revisao" | "nao_funciona" | "nao_verificado";
export const CONDITION_LABEL: Record<Condition, string> = {
  funcionando: "Funcionando",
  precisa_revisao: "Precisa revisão",
  nao_funciona: "Não funciona",
  nao_verificado: "Não verificado",
};

export interface EquipmentItem extends Base {
  name: string;
  type: EquipmentType;
  quantity: number;
  condition: Condition;
  location: string;
  lastCheck: string;
  nextCheck: string;
  notes: string;
}

export interface ExitPlan {
  situation: "" | "preparacao" | "ordem_oficial" | "pedido_ajuda" | "decisao_familiar";
  officialNote: string;
  hazards: RiskKey[];
  hazardsOther: string;
  notes: string;
}

export interface Vehicle extends Base {
  name: string;
  working: Tri;
  seatsHumans: number;
  animalSpaces: number;
  fuelInfo: string;
  accessible: Tri;
  notes: string;
}

export interface Destination extends Base {
  name: string;
  address: string;
  phone: string;
  contactId: string | null;
  acceptsPeople: Tri;
  acceptsAnimals: Tri;
  confirmedOn: string;
  isHospital: boolean;
  notes: string;
}

export interface KitItem extends Base {
  name: string;
  quantity: number;
  unit: Unit;
  expiry: string;
  location: string;
  notes: string;
}

export interface Treatment extends Base {
  holderType: "pessoa" | "animal";
  holderId: string | null;
  name: string;
  presentation: string;
  concentrationText: string;
  existingInstructions: string;
  unit: Unit;
  stock: number;
  expiry: string;
  dailyConsumption: number | null;
  dailyConsumptionValidated: boolean;
  fictitiousConfirmed: boolean;
  notes: string;
}

export type ActivityContext = "casa" | "abrigo" | "pausa_evacuacao";
export interface EntertainmentPrefs {
  mode: "cadastro" | "manual";
  manualBands: AgeBand[];
  context: ActivityContext;
  selected: string[]; // activity ids
  owned: string[]; // material ids
}

export interface Notice extends Base {
  title: string;
  source: string;
  url: string;
  area: string;
  publishedAt: string; // datetime-local value
  timezone: string;
  validUntil: string; // datetime-local or ""
  instructions: string;
}

export interface AppData {
  shopping: ShoppingPlan;
  people: Person[];
  animals: Animal[];
  home: Home;
  contacts: Contact[];
  checkins: CheckIn[];
  supplies: SupplyItem[];
  water: WaterParams;
  scenario: Scenario;
  equipment: EquipmentItem[];
  exitPlan: ExitPlan;
  vehicles: Vehicle[];
  destinations: Destination[];
  kit: KitItem[];
  treatments: Treatment[];
  entertainment: EntertainmentPrefs;
  notices: Notice[];
}

export type CollectionKey = {
  [K in keyof AppData]: AppData[K] extends Array<{ id: string }> ? K : never;
}[keyof AppData];

export function emptyData(): AppData {
  return {
    shopping: emptyShopping(),
    people: [],
    animals: [],
    home: {
      address: "",
      reference: "",
      type: "",
      floor: "",
      access: "",
      meetingPoint: "",
      meetingPointAlt: "",
      notes: "",
      risks: {},
    },
    contacts: [],
    checkins: [],
    supplies: [],
    water: {
      drinkLPerPersonDay: null,
      cookLPerPersonDay: null,
      hygieneLPerPersonDay: null,
      animalTotalLPerDay: null,
      peopleMode: "cadastro",
      peopleManual: null,
    },
    scenario: { days: 3, customDays: null },
    equipment: [],
    exitPlan: { situation: "", officialNote: "", hazards: [], hazardsOther: "", notes: "" },
    vehicles: [],
    destinations: [],
    kit: [],
    treatments: [],
    entertainment: { mode: "cadastro", manualBands: [], context: "casa", selected: [], owned: [] },
    notices: [],
  };
}
