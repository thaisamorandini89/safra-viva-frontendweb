// ---------------------------------------------------------------------------
// Módulo de Gestão de Insumos — tipos de domínio
// ---------------------------------------------------------------------------

/** Categorias de insumos e os produtos típicos de cada uma */
export const CATEGORIAS_INSUMO = {
  Fertilizantes: [
    "NPK",
    "Ureia",
    "MAP",
    "Superfosfato Simples",
    "Cloreto de Potássio",
  ],
  "Defensivos Agrícolas": [
    "Herbicida",
    "Fungicida",
    "Inseticida",
    "Acaricida",
    "Regulador de Crescimento",
  ],
  Sementes: ["Soja", "Milho", "Algodão", "Feijão", "Café", "Pastagens"],
  Corretivos: ["Calcário", "Gesso Agrícola"],
  Combustíveis: ["Diesel S10", "Diesel Comum", "Gasolina"],
  "Medicamentos Veterinários": ["Vacinas", "Vermífugos", "Antibióticos"],
  "Suplementação Animal": ["Sal Mineral", "Proteinados", "Ração"],
} as const;

export type CategoriaInsumo = keyof typeof CATEGORIAS_INSUMO;

export const CATEGORIAS_INSUMOS = Object.keys(
  CATEGORIAS_INSUMO
) as CategoriaInsumo[];

export const CATEGORIA_INSUMO_META: Record<
  CategoriaInsumo,
  { icone: string; hex: string; chip: string }
> = {
  Fertilizantes: {
    icone: "🧪",
    hex: "#16a34a",
    chip: "bg-green-50 text-green-700 border-green-200",
  },
  "Defensivos Agrícolas": {
    icone: "🛡️",
    hex: "#f97316",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
  },
  Sementes: {
    icone: "🌱",
    hex: "#84cc16",
    chip: "bg-lime-50 text-lime-700 border-lime-200",
  },
  Corretivos: {
    icone: "⛰️",
    hex: "#a16207",
    chip: "bg-yellow-50 text-yellow-800 border-yellow-200",
  },
  Combustíveis: {
    icone: "⛽",
    hex: "#0ea5e9",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "Medicamentos Veterinários": {
    icone: "💉",
    hex: "#a855f7",
    chip: "bg-purple-50 text-purple-700 border-purple-200",
  },
  "Suplementação Animal": {
    icone: "🐄",
    hex: "#64748b",
    chip: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

/** Descobre a categoria a partir do tipo do produto */
export function categoriaDoProduto(tipo: string): CategoriaInsumo {
  const achada = CATEGORIAS_INSUMOS.find((c) =>
    (CATEGORIAS_INSUMO[c] as readonly string[]).includes(tipo)
  );
  return achada ?? "Fertilizantes";
}

export const UNIDADES_MEDIDA = [
  "kg",
  "t",
  "g",
  "L",
  "mL",
  "m³",
  "sc",
  "un",
  "dose",
] as const;

export const STATUS_INSUMO = ["Ativo", "Inativo"] as const;

export type StatusInsumo = (typeof STATUS_INSUMO)[number];

export const TIPOS_MOVIMENTACAO = ["Entrada", "Saída"] as const;

export type TipoMovimentacao = (typeof TIPOS_MOVIMENTACAO)[number];

/** Situação do saldo em relação ao estoque mínimo (RN004) */
export const SITUACOES_ESTOQUE = ["Normal", "Baixo", "Zerado"] as const;

export type SituacaoEstoque = (typeof SITUACOES_ESTOQUE)[number];

export const SITUACAO_ESTOQUE_META: Record<
  SituacaoEstoque,
  { badge: string; dot: string; hex: string; icone: string }
> = {
  Normal: {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-600",
    hex: "#16a34a",
    icone: "✅",
  },
  Baixo: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    hex: "#f59e0b",
    icone: "⚠️",
  },
  Zerado: {
    badge: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
    hex: "#dc2626",
    icone: "⛔",
  },
};

/** Entidade: LoteInsumo */
export interface LoteInsumo {
  id: string;
  id_insumo: string;
  numero_lote: string;
  data_fabricacao?: string | null;
  data_validade?: string | null;
  quantidade: number;
}

/** Entidade: MovimentacaoEstoque */
export interface MovimentacaoEstoque {
  id: string;
  id_insumo: string;
  nome_insumo?: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  valor_unitario?: number;
  data_movimentacao: string; // ISO yyyy-mm-dd
  id_responsavel: number;
  responsavel?: string;
  /** Entrada */
  fornecedor?: string;
  nota_fiscal?: string;
  numero_lote?: string;
  data_fabricacao?: string | null;
  data_validade?: string | null;
  /** Saída — rastreabilidade (RN005) */
  id_talhao?: string;
  codigo_talhao?: string;
  nome_talhao?: string;
  safra?: string;
  id_atividade?: string;
  atividade?: string;
  destino?: string;
  observacao?: string;
}

/** Entidade: Insumo */
export interface Insumo {
  id: string;
  nome: string;
  categoria: CategoriaInsumo;
  tipo?: string;
  unidade_medida: string;
  fabricante?: string;
  marca?: string;
  fornecedor?: string;
  estoque_atual: number;
  estoque_minimo: number;
  valor_unitario: number;
  status: StatusInsumo;
  id_propriedade?: number;
  nome_propriedade?: string;
  registro_mapa?: string;
  ficha_tecnica?: string;
  observacoes?: string;
  lotes?: LoteInsumo[];
}

/** Payload de criação do insumo */
export interface NovoInsumoPayload {
  nome: string;
  categoria: CategoriaInsumo;
  tipo?: string;
  unidade_medida: string;
  fabricante?: string;
  marca?: string;
  fornecedor?: string;
  estoque_atual: number;
  estoque_minimo: number;
  valor_unitario: number;
  status: StatusInsumo;
  id_propriedade?: number;
  nome_propriedade?: string;
  registro_mapa?: string;
  ficha_tecnica?: string;
  observacoes?: string;
}

/** Payload de criação da movimentação */
export interface NovaMovimentacaoPayload {
  id_insumo: string;
  nome_insumo?: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  valor_unitario?: number;
  data_movimentacao: string;
  id_responsavel: number;
  responsavel?: string;
  fornecedor?: string;
  nota_fiscal?: string;
  numero_lote?: string;
  data_fabricacao?: string | null;
  data_validade?: string | null;
  id_talhao?: string;
  codigo_talhao?: string;
  nome_talhao?: string;
  safra?: string;
  id_atividade?: string;
  atividade?: string;
  destino?: string;
  observacao?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Janela padrão (em dias) para considerar um produto "próximo do vencimento" */
export const DIAS_ALERTA_VALIDADE = 60;

const hoje = () => new Date().toISOString().slice(0, 10);

/** Valor financeiro parado em estoque */
export const valorEstoque = (i: Insumo) =>
  Number(i.estoque_atual || 0) * Number(i.valor_unitario || 0);

/** RN004 — situação do saldo frente ao estoque mínimo */
export function situacaoEstoque(i: Insumo): SituacaoEstoque {
  if (Number(i.estoque_atual) <= 0) return "Zerado";
  if (Number(i.estoque_atual) <= Number(i.estoque_minimo)) return "Baixo";
  return "Normal";
}

export const abaixoMinimo = (i: Insumo) => situacaoEstoque(i) !== "Normal";

/** Menor data de validade entre os lotes que ainda possuem saldo */
export function proximaValidade(i: Insumo): string | null {
  const datas = (i.lotes ?? [])
    .filter((l) => l.quantidade > 0 && l.data_validade)
    .map((l) => l.data_validade as string)
    .sort();
  return datas[0] ?? null;
}

export function diasParaVencer(iso?: string | null): number | null {
  if (!iso) return null;
  const ms =
    new Date(`${iso}T00:00:00`).getTime() - new Date(`${hoje()}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** RN002 — produto vencido não pode ser utilizado em operações */
export function isVencido(i: Insumo): boolean {
  const dias = diasParaVencer(proximaValidade(i));
  return dias != null && dias < 0;
}

export function isProximoVencimento(
  i: Insumo,
  janela = DIAS_ALERTA_VALIDADE
): boolean {
  const dias = diasParaVencer(proximaValidade(i));
  return dias != null && dias >= 0 && dias <= janela;
}

/** Lotes vencidos com saldo remanescente */
export const lotesVencidos = (i: Insumo): LoteInsumo[] =>
  (i.lotes ?? []).filter(
    (l) => l.quantidade > 0 && l.data_validade && l.data_validade < hoje()
  );

/** Valor da movimentação (quantidade × valor unitário) */
export const valorMovimentacao = (m: MovimentacaoEstoque) =>
  Number(m.quantidade || 0) * Number(m.valor_unitario || 0);

export const fmtMoeda = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export const fmtQtd = (v: number, unidade?: string) =>
  `${Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${
    unidade ? ` ${unidade}` : ""
  }`;

export const fmtData = (iso?: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—";
