// ---------------------------------------------------------------------------
// Módulo Financeiro — tipos de domínio
// ---------------------------------------------------------------------------

export type TipoLancamento = "RECEITA" | "DESPESA";
export type FormaPagamento =
  | "DINHEIRO"
  | "PIX"
  | "BOLETO"
  | "CARTAO"
  | "TRANSFERENCIA";
export type StatusLancamento = "PENDENTE" | "PAGO";
export type TipoCentroCusto = "OPERACIONAL" | "ADMINISTRATIVO";
export type AgruparPor = "safra" | "talhao" | "cultura";

/** Parcela de rateio de uma despesa entre talhões */
export interface RateioItem {
  id_talhao: number;
  nome_talhao?: string | null;
  percentual: number;
}

export interface Lancamento {
  id_lancamento: string;
  tipo: TipoLancamento;
  categoria: string;
  descricao?: string | null;
  valor: number;
  data_lancamento: string; // ISO yyyy-mm-dd
  forma_pagamento?: FormaPagamento | null;
  status: StatusLancamento;
  conciliado: boolean;
  observacao?: string | null;
  id_empresa?: number | null;
  id_propriedade?: number | null;
  id_talhao?: number | null;
  id_safra?: number | null;
  id_centro_custo?: number | null;
  // Campos de exibição (preenchidos pelo backend/mock)
  nome_propriedade?: string | null;
  nome_talhao?: string | null;
  nome_safra?: string | null;
  cultura?: string | null;
  rateio?: RateioItem[];
}

export interface NovoLancamentoPayload {
  tipo: TipoLancamento;
  categoria: string;
  data_lancamento: string;
  valor: number;
  descricao?: string | null;
  forma_pagamento?: FormaPagamento | null;
  status?: StatusLancamento;
  observacao?: string | null;
  id_empresa?: number | null;
  id_propriedade?: number | null;
  id_talhao?: number | null;
  id_safra?: number | null;
  id_centro_custo?: number | null;
  rateio?: RateioItem[];
}

export interface CentroCusto {
  id_centro_custo: number;
  nome: string;
  tipo: TipoCentroCusto;
  descricao?: string | null;
  status?: boolean;
}

export interface Safra {
  id_safra: number;
  nome: string;
  cultura: string;
  id_propriedade: number;
  nome_propriedade?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  area_plantada?: number | null;
  status?: boolean;
}

export interface SaldoFinanceiro {
  receita_total: number;
  despesa_total: number;
  saldo: number;
}

export interface FluxoCaixaItem {
  data: string;
  descricao: string;
  entrada: number;
  saida: number;
  saldo: number;
}

export interface IndicadorFinanceiro {
  grupo: string;
  receita_total: number;
  despesa_total: number;
  lucro_liquido: number;
  /** Margem líquida em % */
  margem: number;
  /** Retorno sobre investimento em % */
  roi: number;
  area?: number | null;
  custo_por_hectare?: number | null;
  receita_por_hectare?: number | null;
  lucro_por_hectare?: number | null;
}

export interface FiltrosLancamento {
  data_inicio?: string;
  data_fim?: string;
  tipo?: TipoLancamento | "";
  id_safra?: number | "";
  id_propriedade?: number | "";
  id_talhao?: number | "";
}

// --------------------------------------------------------------- constantes

export const CATEGORIAS_RECEITA = [
  "Venda de Soja",
  "Venda de Milho",
  "Venda de Algodão",
  "Venda de Gado",
  "Venda de Leite",
  "Prestação de Serviços",
  "Outras Receitas",
] as const;

export const CATEGORIAS_DESPESA = [
  "Combustível",
  "Fertilizantes",
  "Defensivos",
  "Sementes",
  "Manutenção de Máquinas",
  "Energia Elétrica",
  "Irrigação",
  "Salários",
  "Encargos",
  "Terceirizações",
  "Treinamentos",
  "Escritório",
  "Internet",
  "Contabilidade",
  "Consultorias",
  "Juros",
  "Financiamentos",
  "Taxas Bancárias",
] as const;

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; label: string }[] = [
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "PIX", label: "PIX" },
  { valor: "BOLETO", label: "Boleto" },
  { valor: "CARTAO", label: "Cartão" },
  { valor: "TRANSFERENCIA", label: "Transferência Bancária" },
];

export const TIPO_LANCAMENTO_META: Record<
  TipoLancamento,
  { label: string; icone: string; hex: string; badge: string; dot: string }
> = {
  RECEITA: {
    label: "Receita",
    icone: "⬆️",
    hex: "#16a34a",
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  DESPESA: {
    label: "Despesa",
    icone: "⬇️",
    hex: "#dc2626",
    badge: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
};

export const STATUS_LANCAMENTO_META: Record<
  StatusLancamento,
  { label: string; badge: string; dot: string }
> = {
  PENDENTE: {
    label: "Pendente",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PAGO: {
    label: "Pago",
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
};

// Paleta usada nos gráficos de categorias/safras
export const PALETA_FINANCEIRO = [
  "#16a34a",
  "#0ea5e9",
  "#f59e0b",
  "#a855f7",
  "#f97316",
  "#dc2626",
  "#64748b",
  "#84cc16",
  "#14b8a6",
  "#e11d48",
];

// ----------------------------------------------------------------- helpers

export const fmtMoeda = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

export const fmtMoedaCurta = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export const fmtData = (iso?: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—";

export const fmtPct = (v?: number | null) =>
  v == null ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export const labelFormaPagamento = (fp?: FormaPagamento | null) =>
  FORMAS_PAGAMENTO.find((f) => f.valor === fp)?.label ?? "—";

/** Rótulo de mês (yyyy-mm) a partir de uma data ISO */
export const chaveMes = (iso: string) => (iso || "").slice(0, 7);

export const labelMes = (chave: string) => {
  const [ano, mes] = chave.split("-");
  if (!ano || !mes) return chave;
  const data = new Date(Number(ano), Number(mes) - 1, 1);
  return data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
};
