import type { ActivityContext, AgeBand, Species, AnimalSize } from "./types";

export interface Material {
  id: string;
  name: string;
  /** Contains small parts: never suggested when a 0–3 band is in the filter. */
  smallParts?: boolean;
}

export const MATERIALS: Material[] = [
  { id: "livro_pano", name: "Livro de pano ou de páginas grossas" },
  { id: "livros", name: "Livros / gibis impressos" },
  { id: "blocos_grandes", name: "Blocos grandes de montar (peças maiores que a boca da criança)" },
  { id: "papel", name: "Papel" },
  { id: "giz_cera", name: "Giz de cera grosso" },
  { id: "lapis_cor", name: "Lápis de cor", smallParts: true },
  { id: "massinha", name: "Massinha atóxica (com selo do Inmetro)" },
  { id: "dominó", name: "Dominó", smallParts: true },
  { id: "cartas", name: "Baralho de cartas", smallParts: true },
  { id: "quebra_cabeca_grande", name: "Quebra-cabeça de peças grandes" },
  { id: "quebra_cabeca", name: "Quebra-cabeça comum", smallParts: true },
  { id: "passatempos", name: "Revista de passatempos impressa (caça-palavras, cruzadas)" },
  { id: "lapis_caneta", name: "Lápis ou caneta", smallParts: true },
  { id: "cartoes_memoria", name: "Cartões de memória (pares de figuras)", smallParts: true },
];

export interface Activity {
  id: string;
  title: string;
  kind: "familiar" | "individual";
  bands: AgeBand[];
  contexts: ActivityContext[];
  materials: string[];
  instructions: string;
  safety: string;
  accessibility: string;
}

const ALL: AgeBand[] = ["0-3", "4-6", "7-9", "10-12", "13-17", "18-59", "60+"];
const ALL_CTX: ActivityContext[] = ["casa", "abrigo", "pausa_evacuacao"];

export const ACTIVITIES: Activity[] = [
  {
    id: "cantigas",
    title: "Cantigas e histórias contadas",
    kind: "familiar",
    bands: ALL,
    contexts: ALL_CTX,
    materials: [],
    instructions: "Escolham juntos uma cantiga ou história conhecida. Cada pessoa canta ou conta um trecho.",
    safety: "Atividade sem materiais. Adequada a todas as idades com um adulto por perto.",
    accessibility: "Pode ser feita sentada ou deitada; use gestos para quem não ouve bem.",
  },
  {
    id: "livro_pano",
    title: "Leitura com livro de pano",
    kind: "individual",
    bands: ["0-3"],
    contexts: ["casa", "abrigo"],
    materials: ["livro_pano"],
    instructions: "Um adulto mostra as figuras, nomeia cores e objetos e deixa o bebê tocar as páginas.",
    safety: "Supervisão de um adulto o tempo todo. Verifique se não há partes soltas.",
    accessibility: "Adapte a distância das figuras para quem enxerga pouco.",
  },
  {
    id: "blocos",
    title: "Torre de blocos grandes",
    kind: "individual",
    bands: ["0-3", "4-6"],
    contexts: ["casa", "abrigo"],
    materials: ["blocos_grandes"],
    instructions: "Empilhe blocos e deixe a criança derrubar e montar de novo. Conte os blocos em voz alta.",
    safety: "Use apenas blocos grandes, sem peças pequenas. Supervisão de adulto.",
    accessibility: "Pode ser feito no chão ou em mesa baixa.",
  },
  {
    id: "desenho",
    title: "Desenho livre",
    kind: "individual",
    bands: ["4-6", "7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ["casa", "abrigo"],
    materials: ["papel", "lapis_cor"],
    instructions: "Proponha um tema simples (minha casa, meu animal) ou deixe desenhar livremente.",
    safety: "Lápis contêm partes pequenas: guarde longe de bebês.",
    accessibility: "Prenda o papel na mesa para quem tem pouca firmeza nas mãos.",
  },
  {
    id: "rabisco_bebe",
    title: "Primeiros rabiscos",
    kind: "individual",
    bands: ["0-3"],
    contexts: ["casa", "abrigo"],
    materials: ["papel", "giz_cera"],
    instructions: "Ofereça papel grande e giz de cera grosso. Deixe rabiscar sem regras.",
    safety: "Supervisão de adulto o tempo todo; recolha o giz ao terminar.",
    accessibility: "Prenda o papel no chão com fita se disponível.",
  },
  {
    id: "massinha",
    title: "Modelar com massinha",
    kind: "individual",
    bands: ["4-6", "7-9", "10-12"],
    contexts: ["casa", "abrigo"],
    materials: ["massinha"],
    instructions: "Modelem animais, letras ou comidas de brincadeira. Guarde a massinha fechada depois.",
    safety: "Use massinha atóxica certificada. Não indicada para quem leva objetos à boca.",
    accessibility: "Bom exercício para as mãos; pode ser feita sentada.",
  },
  {
    id: "mimica",
    title: "Mímica",
    kind: "familiar",
    bands: ["4-6", "7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ALL_CTX,
    materials: [],
    instructions: "Uma pessoa imita um animal, profissão ou objeto sem falar; as outras tentam adivinhar.",
    safety: "Mantenha o espaço livre de obstáculos. Movimentos tranquilos em locais cheios.",
    accessibility: "Permita dicas faladas para quem não enxerga bem.",
  },
  {
    id: "historia_coletiva",
    title: "História coletiva",
    kind: "familiar",
    bands: ["4-6", "7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ALL_CTX,
    materials: [],
    instructions: "Alguém começa uma frase (“Era uma vez…”). Cada pessoa continua com uma frase.",
    safety: "Evite temas assustadores com crianças pequenas em momentos de tensão.",
    accessibility: "Totalmente verbal; pode ser feita com gestos ou desenhos.",
  },
  {
    id: "memoria",
    title: "Jogo da memória",
    kind: "familiar",
    bands: ["4-6", "7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ["casa", "abrigo"],
    materials: ["cartoes_memoria"],
    instructions: "Vire os cartões para baixo. Cada pessoa desvira dois por vez procurando pares.",
    safety: "Cartões pequenos: mantenha longe de bebês.",
    accessibility: "Use cartões grandes e com alto contraste para quem enxerga pouco.",
  },
  {
    id: "domino",
    title: "Dominó",
    kind: "familiar",
    bands: ["7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ["casa", "abrigo"],
    materials: ["dominó"],
    instructions: "Distribua as peças. Cada pessoa encaixa uma peça com o mesmo número na ponta.",
    safety: "Peças pequenas: guarde longe de bebês.",
    accessibility: "Pode ser jogado em dupla, uma pessoa ajudando a outra.",
  },
  {
    id: "quebra_cabeca_grande",
    title: "Quebra-cabeça de peças grandes",
    kind: "individual",
    bands: ["4-6", "7-9"],
    contexts: ["casa", "abrigo"],
    materials: ["quebra_cabeca_grande"],
    instructions: "Comece pelas bordas. Ajude a separar as peças por cor.",
    safety: "Confira se as peças são grandes o bastante para a idade.",
    accessibility: "Pode ser feito em dupla.",
  },
  {
    id: "quebra_cabeca",
    title: "Quebra-cabeça",
    kind: "individual",
    bands: ["10-12", "13-17", "18-59", "60+"],
    contexts: ["casa"],
    materials: ["quebra_cabeca"],
    instructions: "Escolha uma superfície onde o quebra-cabeça possa ficar montado.",
    safety: "Peças pequenas: mantenha longe de bebês.",
    accessibility: "Prefira imagens com cores fortes para quem enxerga pouco.",
  },
  {
    id: "leitura",
    title: "Leitura e passatempos impressos",
    kind: "individual",
    bands: ["7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ALL_CTX,
    materials: ["livros", "passatempos", "lapis_caneta"],
    instructions: "Leia um capítulo ou resolva uma página de passatempos. Pode ler em voz alta para outros.",
    safety: "Leia em local com luz natural sempre que possível para poupar lanternas.",
    accessibility: "Livros com letras grandes ou leitura em voz alta por outra pessoa.",
  },
  {
    id: "cartas",
    title: "Jogos de cartas",
    kind: "familiar",
    bands: ["7-9", "10-12", "13-17", "18-59", "60+"],
    contexts: ["casa", "abrigo", "pausa_evacuacao"],
    materials: ["cartas"],
    instructions: "Escolham um jogo simples que todos conheçam (ex.: mico, buraco, rouba-monte).",
    safety: "Cartas são pequenas: guarde longe de bebês.",
    accessibility: "Um suporte para cartas ou jogar em dupla ajuda quem tem pouca força nas mãos.",
  },
];

export interface AnimalEnrichment {
  id: string;
  title: string;
  species: Species[];
  sizes?: Exclude<AnimalSize, "">[];
  instructions: string;
  limits: string;
}

export const ANIMAL_ENRICHMENT: AnimalEnrichment[] = [
  {
    id: "farejar",
    title: "Brincadeira de farejar",
    species: ["cao"],
    instructions: "Esconda alguns petiscos da ração habitual em um pano dobrado e deixe o cão farejar.",
    limits: "Use a ração do dia, sem alimentos novos. Pare se o animal ficar agitado ou com medo.",
  },
  {
    id: "passeio_curto",
    title: "Passeio curto na guia",
    species: ["cao"],
    sizes: ["medio", "grande"],
    instructions: "Caminhada curta e calma em área segura, sempre com guia.",
    limits: "Somente em locais sem perigo e quando permitido. Nunca solte o animal em abrigos.",
  },
  {
    id: "caixa_papelao",
    title: "Caixa de papelão para esconder",
    species: ["gato"],
    instructions: "Ofereça uma caixa com uma abertura para o gato se esconder e se sentir seguro.",
    limits: "Retire fitas e grampos. Respeite quando o gato quiser ficar quieto.",
  },
  {
    id: "bolinha_papel",
    title: "Bolinha de papel",
    species: ["gato"],
    instructions: "Role uma bolinha de papel amassado para o gato perseguir por alguns minutos.",
    limits: "Recolha a bolinha depois para que não seja engolida.",
  },
  {
    id: "conversa_ave",
    title: "Conversa e companhia",
    species: ["ave"],
    instructions: "Fale com calma perto da gaiola e mantenha a rotina de luz do dia.",
    limits: "Evite barulho e mudanças bruscas. Mantenha a gaiola longe de correntes de ar.",
  },
  {
    id: "rolo_papel",
    title: "Rolo de papelão com feno",
    species: ["roedor"],
    instructions: "Coloque um pouco do feno habitual dentro de um rolo de papelão sem cola.",
    limits: "Somente o alimento que o animal já come. Retire se ficar úmido.",
  },
  {
    id: "rotina_calma",
    title: "Rotina calma e ambiente estável",
    species: ["reptil", "peixe", "outro"],
    instructions: "Mantenha o ambiente estável e evite manuseio desnecessário.",
    limits: "Não improvise aquecimento ou alterações do ambiente sem orientação veterinária.",
  },
];

export const CONTEXT_LABEL: Record<ActivityContext, string> = {
  casa: "Em casa",
  abrigo: "Em abrigo",
  pausa_evacuacao: "Pausa durante saída",
};

/**
 * Activities for the given bands and context. Activities listed for 0–3 never use small-part
 * materials (enforced by tests); when a 0–3 band is present, the UI flags other activities that
 * have small parts so they stay away from babies.
 */
export function filterActivities(bands: AgeBand[], context: ActivityContext): Activity[] {
  return ACTIVITIES.filter(
    (a) => a.contexts.includes(context) && (bands.length === 0 || a.bands.some((b) => bands.includes(b))),
  );
}

function isSmall(materialId: string) {
  return MATERIALS.find((m) => m.id === materialId)?.smallParts === true;
}

export function hasSmallParts(a: Activity) {
  return a.materials.some(isSmall);
}

/** Unique materials across selected activities, and which are still missing. */
export function materialsFor(selectedIds: string[], owned: string[]) {
  const ids = new Set<string>();
  for (const id of selectedIds) ACTIVITIES.find((a) => a.id === id)?.materials.forEach((m) => ids.add(m));
  const all = [...ids].map((id) => MATERIALS.find((m) => m.id === id)!).filter(Boolean);
  return { all, missing: all.filter((m) => !owned.includes(m.id)) };
}

export function enrichmentFor(animals: { species: Species; size: AnimalSize }[]) {
  return ANIMAL_ENRICHMENT.filter((e) =>
    animals.some((a) => e.species.includes(a.species) && (!e.sizes || (a.size !== "" && e.sizes.includes(a.size)))),
  );
}
