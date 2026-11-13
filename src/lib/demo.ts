import type { AppData, Person, Animal, Contact, SupplyItem, EquipmentItem, Vehicle, Destination, KitItem, Treatment, Notice } from "@/lib/domain/types";

/**
 * Clearly fictitious sample records ("exemplo fictício"), all flagged `fictitious: true`.
 * Built lazily (never at module scope). Names are invented and marked as examples.
 */
export function makeDemoData(newId: () => string): Partial<AppData> {
  const now = new Date().toISOString();
  const base = () => ({ id: newId(), createdAt: now, updatedAt: now, fictitious: true });
  const year = new Date().getFullYear();

  const contact: Contact = { ...base(), name: "Tia Exemplo (fictícia)", phone: "11900000000", relation: "Tia", priority: "alta", notes: "Contato fictício para teste." };
  const adult: Person = {
    ...base(), name: "Adulto Exemplo (fictício)", relation: "Responsável", birthDate: `${year - 38}-03-15`, ageBand: "", sex: "",
    weightKg: null, heightCm: null, abo: "nao_sei", rh: "nao_sei", bloodDocConfirmed: false, bloodDocNote: "",
    conditions: "", allergies: "", disability: "", mobility: "", dependency: "", pregnancy: "", childNeeds: "",
    continuousUse: false, responsibleId: null, emergencyContactId: contact.id, notes: "Perfil fictício.",
  };
  const child: Person = {
    ...adult, ...base(), name: "Criança Exemplo (fictícia)", relation: "Filho(a)", birthDate: `${year - 5}-08-01`,
    responsibleId: adult.id, childNeeds: "Gosta de dormir com um paninho (exemplo).", notes: "Perfil fictício.",
  };
  const elder: Person = {
    ...adult, ...base(), name: "Avó Exemplo (fictícia)", relation: "Avó", birthDate: "", ageBand: "60+",
    mobility: "Usa bengala (exemplo)", continuousUse: true, responsibleId: adult.id, notes: "Perfil fictício.",
  };
  const dog: Animal = {
    ...base(), name: "Cão Exemplo (fictício)", species: "cao", speciesOther: "", breed: "SRD", sex: "macho", ageText: "4 anos",
    weightKg: null, size: "medio", identification: "Coleira azul", microchip: "", neutered: "sim", pregnancyLactation: "nao",
    conditions: "", allergies: "", mobility: "", behavior: "Tem medo de trovão (exemplo)", dietRestriction: "",
    continuousUse: false, vaccination: "Carteira em casa (exemplo)", vet: "", responsibleId: adult.id, notes: "Animal fictício.",
  };
  const supplies: SupplyItem[] = [
    { ...base(), name: "Galão de água", category: "agua_potavel", quantity: 20, unit: "L", target: null, expiry: "", location: "Área de serviço", notes: "Exemplo" },
    { ...base(), name: "Arroz", category: "alimentacao_humana", quantity: 2, unit: "kg", target: 5, expiry: "", location: "Despensa", notes: "Exemplo" },
    { ...base(), name: "Ração", category: "alimentacao_animal", quantity: 1, unit: "kg", target: 3, expiry: "", location: "Despensa", notes: "Exemplo" },
  ];
  const equipment: EquipmentItem[] = [
    { ...base(), name: "Lanterna de mão", type: "lanterna", quantity: 1, condition: "nao_verificado", location: "Gaveta da cozinha", lastCheck: "", nextCheck: "", notes: "Exemplo" },
  ];
  const vehicles: Vehicle[] = [
    { ...base(), name: "Carro Exemplo", working: "sim", seatsHumans: 2, animalSpaces: 1, fuelInfo: "Meio tanque (informado)", accessible: "nao_sei", notes: "Exemplo" },
  ];
  const destinations: Destination[] = [
    { ...base(), name: "Casa da Tia Exemplo", address: "Endereço fictício", phone: "", contactId: contact.id, acceptsPeople: "nao_sei", acceptsAnimals: "nao_sei", confirmedOn: "", isHospital: false, notes: "Exemplo" },
  ];
  const kit: KitItem[] = [
    { ...base(), name: "Gaze (exemplo)", quantity: 1, unit: "pacote", expiry: "", location: "Caixa de cuidados", notes: "" },
  ];
  const treatments: Treatment[] = [
    {
      ...base(), holderType: "pessoa", holderId: elder.id, name: "Tratamento Fictício X", presentation: "Comprimido (fictício)",
      concentrationText: "texto fictício", existingInstructions: "Conforme receita (fictício)", unit: "unidade", stock: 10, expiry: "",
      dailyConsumption: null, dailyConsumptionValidated: false, fictitiousConfirmed: true, notes: "Registro fictício de teste.",
    },
  ];
  const notices: Notice[] = [
    {
      ...base(), title: "Aviso de exemplo (fictício)", source: "Órgão fictício", url: "https://example.org/aviso", area: "Bairro fictício",
      publishedAt: "", timezone: "America/Sao_Paulo", validUntil: "", instructions: "Exemplo de registro manual. Não é um aviso real.",
    },
  ];
  return { contacts: [contact], people: [adult, child, elder], animals: [dog], supplies, equipment, vehicles, destinations, kit, treatments, notices };
}
