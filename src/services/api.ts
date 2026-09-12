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
