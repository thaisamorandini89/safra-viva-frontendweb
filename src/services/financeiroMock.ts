// ---------------------------------------------------------------------------
// Dados mock de desenvolvimento do módulo Financeiro.
// Usados como fallback enquanto os endpoints do backend não estão disponíveis.
// Centralizados aqui para fácil remoção quando o backend estiver pronto.
// ---------------------------------------------------------------------------
import {
  Lancamento,
  NovoLancamentoPayload,
  CentroCusto,
  Safra,
  SaldoFinanceiro,
  FluxoCaixaItem,
  IndicadorFinanceiro,
  FiltrosLancamento,
  AgruparPor,
} from "../types/financeiro";

export interface PropriedadeRef {
  id_propriedade: number;
  nome_propriedade: string;
}
export interface TalhaoRef {
  id_talhao: number;
  nome_talhao: string;
  area: number;
  id_propriedade: number;
}

export const PROPRIEDADES_MOCK: PropriedadeRef[] = [
  { id_propriedade: 1, nome_propriedade: "Fazenda Santa Maria" },
  { id_propriedade: 2, nome_propriedade: "Fazenda Boa Vista" },
];

export const TALHOES_FIN_MOCK: TalhaoRef[] = [
  { id_talhao: 1, nome_talhao: "Talhão A", area: 600, id_propriedade: 1 },
  { id_talhao: 2, nome_talhao: "Talhão B", area: 600, id_propriedade: 1 },
  { id_talhao: 3, nome_talhao: "Talhão C", area: 800, id_propriedade: 1 },
  { id_talhao: 4, nome_talhao: "Talhão D", area: 500, id_propriedade: 2 },
];

export const SAFRAS_MOCK: Safra[] = [
  {
    id_safra: 1,
    nome: "Safra 2025/26 · Soja",
    cultura: "Soja",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Maria",
    data_inicio: "2025-09-01",
    data_fim: "2026-03-31",
    area_plantada: 1200,
    status: true,
  },
  {
    id_safra: 2,
    nome: "Safra 2025/26 · Milho",
    cultura: "Milho",
    id_propriedade: 1,
    nome_propriedade: "Fazenda Santa Maria",
    data_inicio: "2026-02-01",
    data_fim: "2026-07-31",
    area_plantada: 800,
    status: true,
  },
  {
    id_safra: 3,
    nome: "Safra 2025 · Algodão",
    cultura: "Algodão",
    id_propriedade: 2,
    nome_propriedade: "Fazenda Boa Vista",
    data_inicio: "2025-11-01",
    data_fim: "2026-06-30",
    area_plantada: 500,
    status: true,
  },
];

export const CENTROS_CUSTO_MOCK: CentroCusto[] = [
  {
    id_centro_custo: 1,
    nome: "Lavoura",
    tipo: "OPERACIONAL",
    descricao: "Custos diretos de produção agrícola",
    status: true,
  },
  {
    id_centro_custo: 2,
    nome: "Escritório",
    tipo: "ADMINISTRATIVO",
    descricao: "Despesas administrativas",
    status: true,
  },
];

const safraPorId = new Map(SAFRAS_MOCK.map((s) => [s.id_safra, s]));
const talhaoPorId = new Map(TALHOES_FIN_MOCK.map((t) => [t.id_talhao, t]));
const propPorId = new Map(
  PROPRIEDADES_MOCK.map((p) => [p.id_propriedade, p.nome_propriedade])
);

let seq = 0;
function novo(
  tipo: Lancamento["tipo"],
  categoria: string,
  valor: number,
  data: string,
  opts: Partial<Lancamento> = {}
): Lancamento {
  seq += 1;
  const safra = opts.id_safra ? safraPorId.get(opts.id_safra) : undefined;
  const talhao = opts.id_talhao ? talhaoPorId.get(opts.id_talhao) : undefined;
  const idProp = opts.id_propriedade ?? safra?.id_propriedade ?? talhao?.id_propriedade;
  return {
    id_lancamento: `mock-${String(seq).padStart(3, "0")}`,
    tipo,
    categoria,
    descricao: opts.descricao ?? categoria,
    valor,
    data_lancamento: data,
    forma_pagamento: opts.forma_pagamento ?? "PIX",
    status: opts.status ?? "PAGO",
    conciliado: opts.conciliado ?? false,
    observacao: opts.observacao ?? null,
    id_empresa: 1,
    id_propriedade: idProp ?? null,
    id_talhao: opts.id_talhao ?? null,
    id_safra: opts.id_safra ?? null,
    id_centro_custo: opts.id_centro_custo ?? (tipo === "DESPESA" ? 1 : null),
    nome_propriedade: idProp ? propPorId.get(idProp) ?? null : null,
    nome_talhao: talhao?.nome_talhao ?? null,
    nome_safra: safra?.nome ?? null,
    cultura: safra?.cultura ?? null,
    rateio: opts.rateio,
  };
}

export const LANCAMENTOS_SEED: Lancamento[] = [
  // Receitas
  novo("RECEITA", "Venda de Soja", 2_400_000, "2026-03-20", { id_safra: 1 }),
  novo("RECEITA", "Venda de Soja", 850_000, "2026-02-10", { id_safra: 1 }),
  novo("RECEITA", "Venda de Milho", 1_100_000, "2026-07-15", { id_safra: 2 }),
  novo("RECEITA", "Venda de Algodão", 1_600_000, "2026-06-05", { id_safra: 3 }),
  novo("RECEITA", "Prestação de Serviços", 120_000, "2026-01-18", {
    id_propriedade: 1,
  }),
  novo("RECEITA", "Outras Receitas", 45_000, "2026-04-02", { id_propriedade: 2 }),
  // Despesas — Soja (safra 1)
  novo("DESPESA", "Sementes", 480_000, "2025-09-12", { id_safra: 1, id_talhao: 1 }),
  novo("DESPESA", "Fertilizantes", 720_000, "2025-10-05", {
    id_safra: 1,
    rateio: [
      { id_talhao: 1, nome_talhao: "Talhão A", percentual: 50 },
      { id_talhao: 2, nome_talhao: "Talhão B", percentual: 50 },
    ],
  }),
  novo("DESPESA", "Defensivos", 360_000, "2025-11-22", { id_safra: 1, id_talhao: 2 }),
  novo("DESPESA", "Combustível", 190_000, "2026-01-08", { id_safra: 1, id_talhao: 1 }),
  // Despesas — Milho (safra 2)
  novo("DESPESA", "Sementes", 210_000, "2026-02-03", { id_safra: 2, id_talhao: 3 }),
  novo("DESPESA", "Fertilizantes", 300_000, "2026-03-10", { id_safra: 2, id_talhao: 3 }),
  novo("DESPESA", "Irrigação", 95_000, "2026-04-20", { id_safra: 2, id_talhao: 3 }),
  // Despesas — Algodão (safra 3)
  novo("DESPESA", "Defensivos", 420_000, "2025-12-15", { id_safra: 3, id_talhao: 4 }),
  novo("DESPESA", "Manutenção de Máquinas", 160_000, "2026-02-28", {
    id_safra: 3,
    id_talhao: 4,
  }),
  novo("DESPESA", "Combustível", 130_000, "2026-05-11", { id_safra: 3, id_talhao: 4 }),
  // Despesas administrativas / financeiras
  novo("DESPESA", "Salários", 240_000, "2026-01-05", {
    id_propriedade: 1,
    id_centro_custo: 2,
  }),
  novo("DESPESA", "Energia Elétrica", 38_000, "2026-02-05", {
    id_propriedade: 1,
    id_centro_custo: 2,
  }),
  novo("DESPESA", "Contabilidade", 24_000, "2026-03-05", {
    id_propriedade: 1,
    id_centro_custo: 2,
  }),
  novo("DESPESA", "Juros", 86_000, "2026-04-05", {
    id_propriedade: 1,
    id_centro_custo: 2,
    status: "PENDENTE",
  }),
  // Um lançamento conciliado (não pode ser excluído)
  novo("RECEITA", "Venda de Gado", 310_000, "2026-05-25", {
    id_propriedade: 2,
    conciliado: true,
  }),
];

// -------------------------------------------- persistência em localStorage
// O store mock é mantido no localStorage para que os lançamentos criados/
// editados/excluídos sobrevivam a reloads da página enquanto não há backend.
const STORAGE_KEY = "safraviva:financeiro:lancamentos:v1";

function carregarPersistidos(): Lancamento[] | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    const dados = raw ? (JSON.parse(raw) as Lancamento[]) : null;
    return Array.isArray(dados) ? dados : null;
  } catch {
    return null;
  }
}

function persistir() {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(LANCAMENTOS_MOCK));
  } catch {
    /* ignora falhas de persistência (ex.: modo privado) */
  }
}

const persistidos = carregarPersistidos();

export const LANCAMENTOS_MOCK: Lancamento[] = persistidos ?? [
  ...LANCAMENTOS_SEED,
];

if (!persistidos) persistir();

// --------------------------------------------------------------- utilitários

function dentroDoPeriodo(l: Lancamento, ini?: string, fim?: string) {
  if (ini && l.data_lancamento < ini) return false;
  if (fim && l.data_lancamento > fim) return false;
  return true;
}

export function filtrarLancamentosMock(filtros: FiltrosLancamento = {}): Lancamento[] {
  return LANCAMENTOS_MOCK.filter((l) => {
    if (!dentroDoPeriodo(l, filtros.data_inicio, filtros.data_fim)) return false;
    if (filtros.tipo && l.tipo !== filtros.tipo) return false;
    if (filtros.id_safra && l.id_safra !== filtros.id_safra) return false;
    if (filtros.id_propriedade && l.id_propriedade !== filtros.id_propriedade)
      return false;
    if (filtros.id_talhao) {
      const noRateio = l.rateio?.some((r) => r.id_talhao === filtros.id_talhao);
      if (l.id_talhao !== filtros.id_talhao && !noRateio) return false;
    }
    return true;
  }).sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento));
}

// --------------------------------------------------- store mutável (sessão)

let seqNovo = LANCAMENTOS_MOCK.reduce((max, l) => {
  const m = /^mock-(\d+)$/.exec(l.id_lancamento);
  return m ? Math.max(max, Number(m[1])) : max;
}, 0);

/** Preenche os campos de exibição (nomes de safra/talhão/propriedade/cultura) */
function enriquecer(l: Lancamento): Lancamento {
  const safra = l.id_safra ? safraPorId.get(l.id_safra) : undefined;
  const talhao = l.id_talhao ? talhaoPorId.get(l.id_talhao) : undefined;
  const idProp =
    l.id_propriedade ?? safra?.id_propriedade ?? talhao?.id_propriedade ?? null;
  return {
    ...l,
    id_propriedade: idProp,
    nome_propriedade: idProp ? propPorId.get(idProp) ?? null : null,
    nome_talhao: talhao?.nome_talhao ?? l.nome_talhao ?? null,
    nome_safra: safra?.nome ?? l.nome_safra ?? null,
    cultura: safra?.cultura ?? l.cultura ?? null,
    rateio: l.rateio?.map((r) => ({
      ...r,
      nome_talhao:
        r.nome_talhao ?? talhaoPorId.get(r.id_talhao)?.nome_talhao ?? null,
    })),
  };
}

export function criarLancamentoMock(payload: NovoLancamentoPayload): Lancamento {
  seqNovo += 1;
  const novoL = enriquecer({
    id_lancamento: `mock-${String(seqNovo).padStart(3, "0")}`,
    tipo: payload.tipo,
    categoria: payload.categoria,
    descricao: payload.descricao ?? payload.categoria,
    valor: payload.valor,
    data_lancamento: payload.data_lancamento,
    forma_pagamento: payload.forma_pagamento ?? null,
    status: payload.status ?? "PENDENTE",
    conciliado: false,
    observacao: payload.observacao ?? null,
    id_empresa: payload.id_empresa ?? 1,
    id_propriedade: payload.id_propriedade ?? null,
    id_talhao: payload.id_talhao ?? null,
    id_safra: payload.id_safra ?? null,
    id_centro_custo: payload.id_centro_custo ?? null,
    rateio: payload.rateio,
  });
  LANCAMENTOS_MOCK.unshift(novoL);
  persistir();
  return novoL;
}

export function atualizarLancamentoMock(
  id: string,
  payload: NovoLancamentoPayload
): Lancamento {
  const idx = LANCAMENTOS_MOCK.findIndex((l) => l.id_lancamento === id);
  const existente = idx >= 0 ? LANCAMENTOS_MOCK[idx] : undefined;
  const atualizado = enriquecer({
    ...(existente ?? ({} as Lancamento)),
    ...payload,
    id_lancamento: id,
    conciliado: existente?.conciliado ?? false,
    status: payload.status ?? existente?.status ?? "PENDENTE",
  } as Lancamento);
  if (idx >= 0) LANCAMENTOS_MOCK[idx] = atualizado;
  else LANCAMENTOS_MOCK.unshift(atualizado);
  persistir();
  return atualizado;
}

export function excluirLancamentoMock(id: string): void {
  const idx = LANCAMENTOS_MOCK.findIndex((l) => l.id_lancamento === id);
  if (idx < 0) return;
  if (LANCAMENTOS_MOCK[idx].conciliado) {
    throw new Error("Lançamentos conciliados não podem ser excluídos.");
  }
  LANCAMENTOS_MOCK.splice(idx, 1);
  persistir();
}

export function saldoMock(filtros: FiltrosLancamento = {}): SaldoFinanceiro {
  const lista = filtrarLancamentosMock(filtros);
  const receita_total = lista
    .filter((l) => l.tipo === "RECEITA")
    .reduce((s, l) => s + l.valor, 0);
  const despesa_total = lista
    .filter((l) => l.tipo === "DESPESA")
    .reduce((s, l) => s + l.valor, 0);
  return { receita_total, despesa_total, saldo: receita_total - despesa_total };
}

export function fluxoCaixaMock(
  dataInicio?: string,
  dataFim?: string
): FluxoCaixaItem[] {
  const lista = LANCAMENTOS_MOCK.filter((l) =>
    dentroDoPeriodo(l, dataInicio, dataFim)
  ).sort((a, b) => a.data_lancamento.localeCompare(b.data_lancamento));

  let saldo = 0;
  return lista.map((l) => {
    const entrada = l.tipo === "RECEITA" ? l.valor : 0;
    const saida = l.tipo === "DESPESA" ? l.valor : 0;
    saldo += entrada - saida;
    return {
      data: l.data_lancamento,
      descricao: l.descricao ?? l.categoria,
      entrada,
      saida,
      saldo,
    };
  });
}

/** Distribui o valor de uma despesa por talhão, respeitando o rateio */
function valoresPorTalhao(l: Lancamento): { id_talhao: number; valor: number }[] {
  if (l.rateio && l.rateio.length) {
    return l.rateio.map((r) => ({
      id_talhao: r.id_talhao,
      valor: (l.valor * r.percentual) / 100,
    }));
  }
  if (l.id_talhao) return [{ id_talhao: l.id_talhao, valor: l.valor }];
  return [];
}

export function indicadoresMock(agruparPor: AgruparPor): IndicadorFinanceiro[] {
  const grupos = new Map<
    string,
    { receita: number; despesa: number; area: number | null }
  >();

  const garante = (chave: string, area: number | null) => {
    if (!grupos.has(chave)) grupos.set(chave, { receita: 0, despesa: 0, area });
    return grupos.get(chave)!;
  };

  if (agruparPor === "talhao") {
    for (const l of LANCAMENTOS_MOCK) {
      const partes = valoresPorTalhao(l);
      if (!partes.length) continue;
      for (const p of partes) {
        const t = talhaoPorId.get(p.id_talhao);
        const chave = t?.nome_talhao ?? `Talhão ${p.id_talhao}`;
        const g = garante(chave, t?.area ?? null);
        if (l.tipo === "RECEITA") g.receita += p.valor;
        else g.despesa += p.valor;
      }
    }
  } else {
    for (const l of LANCAMENTOS_MOCK) {
      let chave: string | null = null;
      let area: number | null = null;
      if (agruparPor === "safra") {
        if (!l.id_safra) continue;
        const s = safraPorId.get(l.id_safra);
        chave = s?.nome ?? `Safra ${l.id_safra}`;
        area = s?.area_plantada ?? null;
      } else {
        if (!l.cultura) continue;
        chave = l.cultura;
        area = SAFRAS_MOCK.filter((s) => s.cultura === l.cultura).reduce(
          (soma, s) => soma + (s.area_plantada ?? 0),
          0
        );
      }
      if (!chave) continue;
      const g = garante(chave, area);
      if (l.tipo === "RECEITA") g.receita += l.valor;
      else g.despesa += l.valor;
    }
  }

  return Array.from(grupos.entries())
    .map(([grupo, g]) => {
      const lucro = g.receita - g.despesa;
      const area = g.area && g.area > 0 ? g.area : null;
      return {
        grupo,
        receita_total: g.receita,
        despesa_total: g.despesa,
        lucro_liquido: lucro,
        margem: g.receita > 0 ? (lucro / g.receita) * 100 : 0,
        roi: g.despesa > 0 ? (lucro / g.despesa) * 100 : 0,
        area,
        custo_por_hectare: area ? g.despesa / area : null,
        receita_por_hectare: area ? g.receita / area : null,
        lucro_por_hectare: area ? lucro / area : null,
      } as IndicadorFinanceiro;
    })
    .sort((a, b) => b.lucro_liquido - a.lucro_liquido);
}
