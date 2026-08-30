// ---------------------------------------------------------------------------
// Módulo de Gestão de Talhões — tipos de domínio
// ---------------------------------------------------------------------------

/** RN005 – Status Automático (ciclo agrícola do talhão) */
export const STATUS_TALHAO = [
  "Livre",
  "Planejado",
  "Preparado",
  "Plantado",
  "Em Desenvolvimento",
  "Colheita",
  "Finalizado",
] as const;

export type StatusTalhao = (typeof STATUS_TALHAO)[number];

/** Paleta/estilo de cada status — usado nos badges e nos gráficos */
export const STATUS_META: Record<
  StatusTalhao,
  { badge: string; dot: string; hex: string; icon: string }
> = {
  Livre: {
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    hex: "#9ca3af",
    icon: "⚪",
  },
  Planejado: {
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
    icon: "🗓️",
  },
  Preparado: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    hex: "#f59e0b",
    icon: "🚜",
  },
  Plantado: {
    badge: "bg-lime-50 text-lime-700 border-lime-200",
    dot: "bg-lime-500",
    hex: "#84cc16",
    icon: "🌱",
  },
  "Em Desenvolvimento": {
    badge: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-600",
    hex: "#16a34a",
    icon: "🌿",
  },
  Colheita: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    hex: "#f97316",
    icon: "🌾",
  },
  Finalizado: {
    badge: "bg-slate-100 text-slate-600 border-slate-300",
    dot: "bg-slate-500",
    hex: "#64748b",
    icon: "✅",
  },
};

/** Talhão ocupado = qualquer status diferente de Livre/Finalizado */
export const STATUS_OCUPADOS: StatusTalhao[] = [
  "Planejado",
  "Preparado",
  "Plantado",
  "Em Desenvolvimento",
  "Colheita",
];

export const TOPOGRAFIAS = [
  "Plana",
  "Suave Ondulada",
  "Ondulada",
  "Forte Ondulada",
  "Montanhosa",
] as const;

export type Topografia = (typeof TOPOGRAFIAS)[number];

/** Entidade: HistoricoTalhao */
export interface HistoricoTalhao {
  id: string;
  id_talhao: string;
  safra: string;          // ex.: "2024/2025"
  cultura: string;        // ex.: "Soja"
  area_plantada: number;  // ha
  data_plantio: string;   // ISO yyyy-mm-dd
  data_colheita?: string | null;
  produtividade?: number | null; // sc/ha
}

/** Entidade: Talhão */
export interface Talhao {
  id: string;
  nome: string;
  codigo: string;
  id_propriedade: number;
  nome_propriedade?: string;
  area_total: number;      // ha
  area_utilizavel: number; // ha
  tipo_solo: string;
  topografia?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: StatusTalhao;
  observacoes?: string;
  data_cadastro: string;
  historico?: HistoricoTalhao[];
}

/** Payload de criação/edição */
export interface NovoTalhaoPayload {
  nome: string;
  codigo: string;
  id_propriedade: number;
  area_total: number;
  area_utilizavel: number;
  tipo_solo: string;
  topografia?: string;
  latitude?: number | null;
  longitude?: number | null;
  status: StatusTalhao;
  observacoes?: string;
}

// ---------------------------------------------------------------------------
// Helpers de cálculo (regras de negócio)
// ---------------------------------------------------------------------------

/** Área plantada no ciclo corrente (safras sem data de colheita) */
export function areaOcupada(talhao: Talhao): number {
  return (talhao.historico ?? [])
    .filter((h) => !h.data_colheita)
    .reduce((soma, h) => soma + Number(h.area_plantada || 0), 0);
}

/** RN003 – área ainda livre para plantio dentro do talhão */
export function areaDisponivel(talhao: Talhao): number {
  const base = talhao.area_utilizavel || talhao.area_total;
  return Math.max(0, base - areaOcupada(talhao));
}

/** Percentual de ocupação (0–100) */
export function percentualOcupacao(talhao: Talhao): number {
  const base = talhao.area_utilizavel || talhao.area_total;
  if (!base) return 0;
  return Math.min(100, (areaOcupada(talhao) / base) * 100);
}

/** Produtividade média das safras já colhidas */
export function produtividadeMedia(talhao: Talhao): number {
  const colhidas = (talhao.historico ?? []).filter(
    (h) => h.produtividade != null && h.produtividade > 0
  );
  if (!colhidas.length) return 0;
  return (
    colhidas.reduce((s, h) => s + Number(h.produtividade), 0) / colhidas.length
  );
}

export const isOcupado = (t: Talhao) => STATUS_OCUPADOS.includes(t.status);

/** Formatação pt-BR de hectares */
export const fmtHa = (v: number, casas = 2) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

export const fmtData = (iso?: string | null) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR") : "—";
