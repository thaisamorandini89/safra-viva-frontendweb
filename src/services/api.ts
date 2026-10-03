import axios from 'axios';
import { Estado, Cidade } from '../types/geo';
import { RegimeTributario } from '../types/regimeTributario';
import { TipoEmpresa } from '../types/tipoEmpresa';
import { EmpresaAgricola } from '../types/empresaAgricola';
import { TipoSolo } from '../types/tipoSolo';
import { ClasseCapacidadeUso } from '../types/classeCapacidadeUso';
import { NovaPropriedadePayload, PropriedadeCriadaResponse } from '../types/propriedade';
import { Talhao, NovoTalhaoPayload, STATUS_TALHAO, StatusTalhao } from '../types/talhao';
import { AtividadeAgricola, NovaAtividadePayload } from '../types/atividade';
import {
  Insumo,
  MovimentacaoEstoque,
  NovoInsumoPayload,
  NovaMovimentacaoPayload,
} from '../types/insumo';
import { TALHOES_MOCK } from './talhoesMock';
import { ATIVIDADES_MOCK } from './atividadesMock';
import { INSUMOS_MOCK_ESTOQUE, MOVIMENTACOES_MOCK } from './insumosMock';
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
} from '../types/financeiro';
import {
  LANCAMENTOS_MOCK,
  filtrarLancamentosMock,
  criarLancamentoMock,
  atualizarLancamentoMock,
  excluirLancamentoMock,
  saldoMock,
  fluxoCaixaMock,
  indicadoresMock,
  CENTROS_CUSTO_MOCK,
  SAFRAS_MOCK,
} from './financeiroMock';

// Deixe vazio para usar o proxy do Vite (localhost:5173 -> localhost:5000)
const api = axios.create({});

export const getEstados = () => api.get<Estado[]>('/api/estados');

export const getCidadesPorEstado = (idEstado: number) => 
  api.get<Cidade[]>(`/api/estados/${idEstado}/cidades`);

// As rotas exatas montadas pelos seus Blueprints do Flask
export const getRegimesTributarios = () => api.get<RegimeTributario[]>('/api/regimes-tributarios');
export const getTiposEmpresas = () => api.get<TipoEmpresa[]>('/api/tipos-empresa');

//export const salvarEmpresa = (dados: any) => api.post('/api/empresas', dados);
export const salvarEmpresa = (dados: any) => api.post('/api/empresas-agricolas', dados);

export const atualizarEmpresa = (id: number, dados: any) =>
  api.put(`/api/empresas-agricolas/${id}`, dados);

export const excluirEmpresa = (id: number) =>
  api.delete(`/api/empresas-agricolas/${id}`);

export const getEmpresasAgricolas = () => api.get<EmpresaAgricola[]>('/api/empresas-agricolas');

/** Lista as empresas agrícolas já normalizadas em array (para React Query) */
export async function getEmpresas(): Promise<EmpresaAgricola[]> {
  const { data } = await api.get<EmpresaAgricola[]>('/api/empresas-agricolas');
  return Array.isArray(data) ? data : [];
}

/** Lista as propriedades cadastradas (usado para cruzar dados no dashboard) */
export async function getPropriedadesLista(): Promise<any[]> {
  try {
    const { data } = await api.get<any[]>('/api/propriedades');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[propriedades] endpoint indisponível.');
    return [];
  }
}

export const getTiposSolo = () => api.get<TipoSolo[]>('/api/tipos-solo');

export const getClassesUso = () => api.get<ClasseCapacidadeUso[]>('/api/classes-uso');

// Cadastra uma nova propriedade rural
export const criarPropriedade = (dados: NovaPropriedadePayload) =>
  api.post<PropriedadeCriadaResponse>('/api/propriedades', dados);

export const atualizarPropriedade = (id: number, dados: any) =>
  api.put(`/api/propriedades/${id}`, dados);

export const excluirPropriedade = (id: number) =>
  api.delete(`/api/propriedades/${id}`);

export const getPropriedades = () => api.get<any[]>('/api/propriedades');

// ---------------------------------------------------------------------------
// Talhões
// ---------------------------------------------------------------------------

/**
 * Busca os talhões no backend. Enquanto o endpoint não existir, devolve a
 * massa de dados de demonstração para que o dashboard continue navegável.
 */
/** Normaliza o formato do backend (id_talhao, nome_talhao, ...) para o tipo Talhao do frontend */
function mapTalhao(raw: any): Talhao {
  const statusInicial = raw?.status_inicial;
  const status: StatusTalhao = STATUS_TALHAO.includes(statusInicial)
    ? statusInicial
    : 'Livre';

  return {
    id: String(raw?.id_talhao ?? raw?.id ?? ''),
    nome: raw?.nome_talhao ?? raw?.nome ?? '',
    codigo: raw?.codigo_talhao ?? raw?.codigo ?? '',
    id_propriedade: Number(raw?.id_propriedade ?? 0),
    nome_propriedade: raw?.propriedade_nome ?? raw?.nome_propriedade,
    area_total: Number(raw?.area_total ?? 0),
    area_utilizavel: Number(raw?.area_utilizavel ?? 0),
    tipo_solo: raw?.tipo_solo_descricao ?? raw?.tipo_solo ?? '',
    topografia: raw?.topografia,
    latitude: raw?.latitude ?? null,
    longitude: raw?.longitude ?? null,
    status,
    observacoes: raw?.observacoes,
    data_cadastro: raw?.data_cadastro ?? '',
  };
}

export async function getTalhoes(): Promise<Talhao[]> {
  try {
    const { data } = await api.get<unknown[]>('/api/talhoes');
    if (Array.isArray(data) && data.length) return data.map(mapTalhao);
    return TALHOES_MOCK;
  } catch {
    console.warn('[talhoes] endpoint indisponível — usando dados de demonstração.');
    return TALHOES_MOCK;
  }
}

export async function criarTalhao(dados: NovoTalhaoPayload): Promise<Talhao> {
  try {
    // Resolve o id do tipo de solo a partir da descrição selecionada no form
    let idTipoSolo: number | undefined;
    try {
      const { data: tipos } = await getTiposSolo();
      idTipoSolo = tipos.find(
        (t) => t.descricao.trim().toLowerCase() === dados.tipo_solo.trim().toLowerCase()
      )?.id;
    } catch {
      /* segue sem id_tipo_solo; backend validará */
    }

    // Converte para o formato esperado pelo backend
    const payload = {
      nome_talhao: dados.nome,
      codigo_talhao: dados.codigo,
      id_propriedade: dados.id_propriedade,
      area_total: dados.area_total,
      area_utilizavel: dados.area_utilizavel,
      status_inicial: dados.status,
      id_tipo_solo: idTipoSolo,
      topografia: dados.topografia,
      observacoes: dados.observacoes,
      latitude: dados.latitude,
      longitude: dados.longitude,
    };

    const { data } = await api.post('/api/talhoes', payload);
    return mapTalhao(data);
  } catch {
    // Fallback local: gera um talhão "salvo" apenas em memória
    return {
      ...dados,
      id: `local-${Date.now()}`,
      data_cadastro: new Date().toISOString().slice(0, 10),
      historico: [],
    } as Talhao;
  }
}

/**
 * Atualiza um talhão existente (PUT parcial).
 * Converte o payload do frontend para o formato do backend, resolvendo o
 * id do tipo de solo a partir da descrição selecionada.
 */
export async function atualizarTalhao(
  id: string,
  dados: NovoTalhaoPayload
): Promise<Talhao> {
  // Resolve o id do tipo de solo a partir da descrição selecionada no form
  let idTipoSolo: number | undefined;
  try {
    const { data: tipos } = await getTiposSolo();
    idTipoSolo = tipos.find(
      (t) => t.descricao.trim().toLowerCase() === dados.tipo_solo.trim().toLowerCase()
    )?.id;
  } catch {
    /* segue sem id_tipo_solo; backend validará */
  }

  // Converte para o formato esperado pelo backend (mesmos nomes do cadastro)
  const payload = {
    nome_talhao: dados.nome,
    codigo_talhao: dados.codigo,
    id_propriedade: dados.id_propriedade,
    area_total: dados.area_total,
    area_utilizavel: dados.area_utilizavel,
    status_inicial: dados.status,
    id_tipo_solo: idTipoSolo,
    topografia: dados.topografia,
    observacoes: dados.observacoes,
    latitude: dados.latitude,
    longitude: dados.longitude,
  };

  const { data } = await api.put(`/api/talhoes/${id}`, payload);
  // Alguns backends devolvem só uma mensagem no PUT — nesse caso, refletimos
  // localmente os dados enviados para manter a UI consistente.
  const atualizado = mapTalhao(data);
  return {
    ...atualizado,
    id: atualizado.id || id,
    nome: atualizado.nome || dados.nome,
    codigo: atualizado.codigo || dados.codigo,
    id_propriedade: atualizado.id_propriedade || dados.id_propriedade,
    area_total: atualizado.area_total || dados.area_total,
    area_utilizavel: atualizado.area_utilizavel || dados.area_utilizavel,
    tipo_solo: atualizado.tipo_solo || dados.tipo_solo,
    topografia: atualizado.topografia ?? dados.topografia,
    status: atualizado.status || dados.status,
    observacoes: atualizado.observacoes ?? dados.observacoes,
    latitude: atualizado.latitude ?? dados.latitude ?? null,
    longitude: atualizado.longitude ?? dados.longitude ?? null,
  };
}

/** Exclui um talhão pelo id (DELETE /api/talhoes/:id) */
export async function excluirTalhao(id: string): Promise<void> {
  await api.delete(`/api/talhoes/${id}`);
}

// ---------------------------------------------------------------------------
// Atividades Agrícolas
// ---------------------------------------------------------------------------

export async function getAtividades(): Promise<AtividadeAgricola[]> {
  try {
    const { data } = await api.get<AtividadeAgricola[]>('/api/atividades');
    if (Array.isArray(data) && data.length) return data;
    return ATIVIDADES_MOCK;
  } catch {
    console.warn('[atividades] endpoint indisponível — usando dados de demonstração.');
    return ATIVIDADES_MOCK;
  }
}

export async function criarAtividade(
  dados: NovaAtividadePayload
): Promise<AtividadeAgricola> {
  try {
    const { data } = await api.post<AtividadeAgricola>('/api/atividades', dados);
    return data;
  } catch {
    // Fallback local: gera uma atividade "salva" apenas em memória
    return { ...dados, id: `local-${Date.now()}` } as AtividadeAgricola;
  }
}

// ---------------------------------------------------------------------------
// Insumos e movimentações de estoque
// ---------------------------------------------------------------------------

export async function getInsumos(): Promise<Insumo[]> {
  try {
    const { data } = await api.get<Insumo[]>('/api/insumos');
    if (Array.isArray(data) && data.length) return data;
    return INSUMOS_MOCK_ESTOQUE;
  } catch {
    console.warn('[insumos] endpoint indisponível — usando dados de demonstração.');
    return INSUMOS_MOCK_ESTOQUE;
  }
}

export async function criarInsumo(dados: NovoInsumoPayload): Promise<Insumo> {
  try {
    const { data } = await api.post<Insumo>('/api/insumos', dados);
    return data;
  } catch {
    // Fallback local: gera um insumo "salvo" apenas em memória
    return { ...dados, id: `local-${Date.now()}`, lotes: [] } as Insumo;
  }
}

export async function getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
  try {
    const { data } = await api.get<MovimentacaoEstoque[]>('/api/movimentacoes-estoque');
    if (Array.isArray(data) && data.length) return data;
    return MOVIMENTACOES_MOCK;
  } catch {
    console.warn('[insumos] movimentações indisponíveis — usando dados de demonstração.');
    return MOVIMENTACOES_MOCK;
  }
}

export async function criarMovimentacao(
  dados: NovaMovimentacaoPayload
): Promise<MovimentacaoEstoque> {
  try {
    const { data } = await api.post<MovimentacaoEstoque>(
      '/api/movimentacoes-estoque',
      dados
    );
    return data;
  } catch {
    // Fallback local: gera uma movimentação "salva" apenas em memória
    return { ...dados, id: `local-${Date.now()}` } as MovimentacaoEstoque;
  }
}

// ---------------------------------------------------------------------------
// Financeiro — lançamentos, centros de custo, safras e indicadores
// ---------------------------------------------------------------------------

function paramsLancamento(filtros: FiltrosLancamento = {}) {
  const params: Record<string, string | number> = {};
  if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
  if (filtros.data_fim) params.data_fim = filtros.data_fim;
  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.id_safra) params.id_safra = filtros.id_safra;
  if (filtros.id_propriedade) params.id_propriedade = filtros.id_propriedade;
  if (filtros.id_talhao) params.id_talhao = filtros.id_talhao;
  return params;
}

export async function getLancamentos(
  filtros: FiltrosLancamento = {}
): Promise<Lancamento[]> {
  try {
    const { data } = await api.get<Lancamento[]>('/api/lancamentos', {
      params: paramsLancamento(filtros),
    });
    if (Array.isArray(data)) return data;
    return filtrarLancamentosMock(filtros);
  } catch {
    console.warn('[financeiro] lançamentos indisponíveis — usando dados de demonstração.');
    return filtrarLancamentosMock(filtros);
  }
}

export async function criarLancamento(
  dados: NovoLancamentoPayload
): Promise<Lancamento> {
  try {
    const { data } = await api.post<Lancamento>('/api/lancamentos', dados);
    return data;
  } catch {
    // Backend indisponível → grava no store mock da sessão
    return criarLancamentoMock(dados);
  }
}

export async function atualizarLancamento(
  id: string,
  dados: NovoLancamentoPayload
): Promise<Lancamento> {
  try {
    const { data } = await api.put<Lancamento>(`/api/lancamentos/${id}`, dados);
    return data;
  } catch {
    return atualizarLancamentoMock(id, dados);
  }
}

export async function excluirLancamento(id: string): Promise<void> {
  try {
    await api.delete(`/api/lancamentos/${id}`);
  } catch (e: any) {
    // Erro de regra do backend (ex.: lançamento conciliado) → propaga
    if (e?.response) throw e;
    // Backend indisponível → exclui do store mock (pode lançar se conciliado)
    excluirLancamentoMock(id);
  }
}

export async function getCentrosCusto(): Promise<CentroCusto[]> {
  try {
    const { data } = await api.get<CentroCusto[]>('/api/centros-custo');
    if (Array.isArray(data) && data.length) return data;
    return CENTROS_CUSTO_MOCK;
  } catch {
    console.warn('[financeiro] centros de custo indisponíveis — usando dados de demonstração.');
    return CENTROS_CUSTO_MOCK;
  }
}

export async function criarCentroCusto(
  dados: Omit<CentroCusto, 'id_centro_custo'>
): Promise<CentroCusto> {
  try {
    const { data } = await api.post<CentroCusto>('/api/centros-custo', dados);
    return data;
  } catch {
    return { ...dados, id_centro_custo: Date.now() } as CentroCusto;
  }
}

export async function getSafras(idPropriedade?: number): Promise<Safra[]> {
  try {
    const { data } = await api.get<Safra[]>('/api/safras', {
      params: idPropriedade ? { id_propriedade: idPropriedade } : {},
    });
    if (Array.isArray(data) && data.length) return data;
    return idPropriedade
      ? SAFRAS_MOCK.filter((s) => s.id_propriedade === idPropriedade)
      : SAFRAS_MOCK;
  } catch {
    console.warn('[financeiro] safras indisponíveis — usando dados de demonstração.');
    return idPropriedade
      ? SAFRAS_MOCK.filter((s) => s.id_propriedade === idPropriedade)
      : SAFRAS_MOCK;
  }
}

export async function getFinanceiroSaldo(
  filtros: FiltrosLancamento = {}
): Promise<SaldoFinanceiro> {
  try {
    const { data } = await api.get<SaldoFinanceiro>('/api/financeiro/saldo', {
      params: paramsLancamento(filtros),
    });
    if (data && typeof data.saldo === 'number') return data;
    return saldoMock(filtros);
  } catch {
    console.warn('[financeiro] saldo indisponível — usando dados de demonstração.');
    return saldoMock(filtros);
  }
}

export async function getFluxoCaixa(
  dataInicio?: string,
  dataFim?: string
): Promise<FluxoCaixaItem[]> {
  try {
    const { data } = await api.get<FluxoCaixaItem[]>('/api/financeiro/fluxo-caixa', {
      params: {
        ...(dataInicio ? { data_inicio: dataInicio } : {}),
        ...(dataFim ? { data_fim: dataFim } : {}),
      },
    });
    if (Array.isArray(data)) return data;
    return fluxoCaixaMock(dataInicio, dataFim);
  } catch {
    console.warn('[financeiro] fluxo de caixa indisponível — usando dados de demonstração.');
    return fluxoCaixaMock(dataInicio, dataFim);
  }
}

export async function getIndicadores(
  agruparPor: AgruparPor
): Promise<IndicadorFinanceiro[]> {
  try {
    const { data } = await api.get<IndicadorFinanceiro[]>('/api/financeiro/indicadores', {
      params: { agrupar_por: agruparPor },
    });
    if (Array.isArray(data) && data.length) return data;
    return indicadoresMock(agruparPor);
  } catch {
    console.warn('[financeiro] indicadores indisponíveis — usando dados de demonstração.');
    return indicadoresMock(agruparPor);
  }
}

/** Lista todos os lançamentos mock (usado por telas que agregam no cliente) */
export async function getTodosLancamentos(): Promise<Lancamento[]> {
  try {
    const { data } = await api.get<Lancamento[]>('/api/lancamentos');
    if (Array.isArray(data) && data.length) return data;
    return LANCAMENTOS_MOCK;
  } catch {
    return LANCAMENTOS_MOCK;
  }
}
