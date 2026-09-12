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

export const getEmpresasAgricolas = () => api.get<EmpresaAgricola[]>('/api/empresas-agricolas');

export const getTiposSolo = () => api.get<TipoSolo[]>('/api/tipos-solo');

export const getClassesUso = () => api.get<ClasseCapacidadeUso[]>('/api/classes-uso');

// Cadastra uma nova propriedade rural
export const criarPropriedade = (dados: NovaPropriedadePayload) =>
  api.post<PropriedadeCriadaResponse>('/api/propriedades', dados);

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
    const { data } = await api.post('/api/talhoes', dados);
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
