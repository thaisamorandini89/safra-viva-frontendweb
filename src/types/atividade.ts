// ---------------------------------------------------------------------------
// Módulo de Atividades Agrícolas — tipos de domínio
// ---------------------------------------------------------------------------

/** Categorias operacionais e seus respectivos tipos (usado apenas para ícones/cores de fallback) */
export const CATEGORIAS_ATIVIDADE = {
  "Preparo de Solo": ["Aração", "Gradagem", "Subsolagem", "Nivelamento"],
  Plantio: ["Plantio Direto", "Plantio Convencional"],
  "Tratos Culturais": ["Adubação", "Calagem", "Gessagem", "Pulverização"],
  Irrigação: ["Irrigação Programada", "Irrigação Emergencial"],
  Colheita: ["Colheita Manual", "Colheita Mecanizada"],
} as const;

export type CategoriaAtividade = keyof typeof CATEGORIAS_ATIVIDADE;

export const CATEGORIAS = Object.keys(CATEGORIAS_ATIVIDADE) as CategoriaAtividade[];

export const TIPOS_ATIVIDADE = CATEGORIAS.flatMap(
  (c) => CATEGORIAS_ATIVIDADE[c] as readonly string[]
);

export const CATEGORIA_META: Record<
  CategoriaAtividade,
  { icone: string; hex: string; chip: string }
> = {
  "Preparo de Solo": { icone: "🚜", hex: "#a16207", chip: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  Plantio: { icone: "🌱", hex: "#84cc16", chip: "bg-lime-50 text-lime-700 border-lime-200" },
  "Tratos Culturais": { icone: "🧪", hex: "#16a34a", chip: "bg-green-50 text-green-700 border-green-200" },
  Irrigação: { icone: "💧", hex: "#0ea5e9", chip: "bg-sky-50 text-sky-700 border-sky-200" },
  Colheita: { icone: "🌾", hex: "#f97316", chip: "bg-orange-50 text-orange-700 border-orange-200" },
};

const CATEGORIA_PADRAO: CategoriaAtividade = "Tratos Culturais";

/** Descobre a categoria a partir do nome da categoria do backend ou do tipo da atividade */
export function categoriaDoTipo(valor?: string | null): CategoriaAtividade {
  if (!valor) return CATEGORIA_PADRAO;
  // 1) casa direto com o nome de uma categoria
  const porNome = CATEGORIAS.find((c) => c.toLowerCase() === valor.toLowerCase());
  if (porNome) return porNome;
  // 2) casa pelo tipo pertencente à categoria
  const porTipo = CATEGORIAS.find((c) =>
    (CATEGORIAS_ATIVIDADE[c] as readonly string[]).some(
      (t) => t.toLowerCase() === valor.toLowerCase()
    )
  );
  return porTipo ?? CATEGORIA_PADRAO;
}

/** Resolve a categoria visual de uma atividade (prioriza o campo categoria do backend) */
export function categoriaVisual(a: AtividadeAgricola): CategoriaAtividade {
  return categoriaDoTipo(a.categoria ?? a.tipo_atividade);
}

export const STATUS_ATIVIDADE = ["Planejada", "Em Andamento", "Concluída"] as const;

export type StatusAtividade = (typeof STATUS_ATIVIDADE)[number];

export const STATUS_ATIVIDADE_META: Record<
  StatusAtividade,
  { badge: string; dot: string; hex: string; icone: string }
> = {
  Planejada: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
    icone: "🗓️",
  },
  "Em Andamento": {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    hex: "#f59e0b",
    icone: "⏳",
  },
  Concluída: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-600",
    hex: "#16a34a",
    icone: "✅",
  },
};

export interface InsumoUtilizado {
  id_insumo?: number;
  nome: string;
  quantidade: number;
  unidade: string;
  custo?: number;
}

export interface MaquinaUtilizada {
  id_maquina?: number;
  nome: string;
  horas?: number;
  custo?: number;
}

/** Entidade: AtividadeAgricola (espelha o retorno do backend, com ids normalizados em string) */
export interface AtividadeAgricola {
  id: string;
  id_empresa?: number | null;
  id_propriedade: number;
  nome_propriedade?: string;
  id_talhao: string;
  codigo_talhao?: string;
  nome_talhao?: string;
  id_safra?: string;
  safra?: string;
  id_categoria_atividade?: number;
  categoria?: string;
  id_tipo_atividade?: number;
  tipo_atividade: string;
  data_inicio: string; // ISO yyyy-mm-dd
  data_fim?: string | null;
  id_responsavel?: string; // UUID do funcionário
  responsavel?: string;
  status: StatusAtividade;
  custo_operacao?: number | null;
  custo_total?: number;
  atrasada?: boolean;
  insumos?: InsumoUtilizado[];
  maquinas?: MaquinaUtilizada[];
  observacoes?: string;
}

/** Payload enviado ao backend ao criar/atualizar uma atividade */
export interface NovaAtividadePayload {
  id_categoria_atividade: number;
  id_tipo_atividade: number;
  id_talhao: number;
  id_propriedade?: number;
  id_empresa?: number;
  safra?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  id_responsavel?: string;
  status: StatusAtividade;
  custo_operacao?: number | null;
  observacoes?: string | null;
  insumos?: { id_insumo: number; quantidade?: number; custo?: number }[];
  maquinas?: { id_maquina: number; horas?: number; custo?: number }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Data local em yyyy-mm-dd; toISOString() usa UTC e adianta o dia a partir das 21h */
export function dataLocalISO(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const hoje = () => dataLocalISO();

/** Atividade atrasada: prazo final vencido e ainda não concluída */
export function isAtrasada(a: AtividadeAgricola): boolean {
  if (a.atrasada != null) return a.atrasada;
  if (a.status === "Concluída") return false;
  const prazo = a.data_fim ?? a.data_inicio;
  return !!prazo && prazo < hoje();
}

/** Custo informado ou somatório de insumos + máquinas */
export function custoTotal(a: AtividadeAgricola): number {
  if (a.custo_total != null) return Number(a.custo_total);
  if (a.custo_operacao != null) return Number(a.custo_operacao);
  const insumos = (a.insumos ?? []).reduce((s, i) => s + Number(i.custo || 0), 0);
  const maquinas = (a.maquinas ?? []).reduce((s, m) => s + Number(m.custo || 0), 0);
  return insumos + maquinas;
}

/** Duração da operação em dias (mínimo 1) */
export function duracaoDias(a: AtividadeAgricola): number {
  if (!a.data_fim) return 1;
  const ms =
    new Date(`${a.data_fim}T00:00:00`).getTime() -
    new Date(`${a.data_inicio}T00:00:00`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export const fmtMoeda = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export const fmtData = (iso?: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—";
