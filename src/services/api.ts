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
  ProdutoCadastrado,
} from '../types/insumo';
import { TALHOES_MOCK } from './talhoesMock';
import { ATIVIDADES_MOCK } from './atividadesMock';
import { INSUMOS_MOCK_ESTOQUE, MOVIMENTACOES_MOCK } from './insumosMock';
import {
  insumoDaApi,
  produtoDaApi,
  insumoParaApi,
  movimentacaoDaApi,
  movimentacaoParaApi,
  erroDoBackend,
} from './insumosAdapter';
import {
  SafraIAConsultaPayload,
  SafraIAResposta,
} from '../types/safraIA';
import { responderSafraIA } from './safraIAMock';
import {
  Lancamento,
  NovoLancamentoPayload,
  CentroCusto,
  CentroCustoPayload,
  Safra,
  SafraPayload,
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

/** Talhões cadastrados, sem dados de demonstração; propaga a falha da API */
export async function getTalhoesCadastrados(): Promise<Talhao[]> {
  const { data } = await api.get<unknown[]>('/api/talhoes');
  return Array.isArray(data) ? data.map(mapTalhao) : [];
}

export async function getTalhoes(): Promise<Talhao[]> {
  try {
    const cadastrados = await getTalhoesCadastrados();
    return cadastrados.length ? cadastrados : TALHOES_MOCK;
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
// Atividades Agrícolas — catálogos de apoio
// ---------------------------------------------------------------------------

export interface CategoriaAtividadeAPI {
  id_categoria_atividade: number;
  nome: string;
  status?: boolean;
}

export interface TipoAtividadeAPI {
  id_atividade: number;
  descricao: string;
  id_categoria_atividade: number;
  categoria_nome?: string;
  status?: boolean;
}

export interface MaquinaAPI {
  id_maquina: number;
  nome: string;
  tipo?: string | null;
  observacoes?: string | null;
  status?: boolean;
}

export interface FuncionarioAPI {
  id_funcionario: string;
  nome_completo: string;
  cargo?: string | null;
  status?: boolean;
}

export interface FornecedorAPI {
  id_fornecedor: number;
  nome_fornecedor: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  observacoes?: string | null;
  status?: boolean;
}

export type FornecedorPayload = Partial<Omit<FornecedorAPI, 'id_fornecedor'>>;

export interface AtividadeIndicadores {
  total: number;
  custo_total: number;
  em_andamento: number;
  planejadas: number;
  concluidas: number;
  atrasadas: number;
}

/** Lista as categorias de atividade cadastradas */
export async function getCategoriasAtividade(): Promise<CategoriaAtividadeAPI[]> {
  try {
    const { data } = await api.get<CategoriaAtividadeAPI[]>('/api/categorias-atividade');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[categorias-atividade] endpoint indisponível.');
    return [];
  }
}

export async function criarCategoriaAtividade(nome: string): Promise<CategoriaAtividadeAPI> {
  const { data } = await api.post('/api/categorias-atividade', { nome });
  return data as CategoriaAtividadeAPI;
}

/** Lista os tipos de atividade, opcionalmente filtrando por categoria */
export async function getTiposAtividade(idCategoria?: number): Promise<TipoAtividadeAPI[]> {
  try {
    const { data } = await api.get<TipoAtividadeAPI[]>('/api/tipos-atividade', {
      params: idCategoria ? { id_categoria_atividade: idCategoria } : {},
    });
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[tipos-atividade] endpoint indisponível.');
    return [];
  }
}

export async function criarTipoAtividade(
  descricao: string,
  idCategoria: number
): Promise<TipoAtividadeAPI> {
  const { data } = await api.post('/api/tipos-atividade', {
    descricao,
    id_categoria_atividade: idCategoria,
  });
  return data as TipoAtividadeAPI;
}

/** Lista as máquinas/implementos do catálogo */
export async function getMaquinas(): Promise<MaquinaAPI[]> {
  try {
    const { data } = await api.get<MaquinaAPI[]>('/api/maquinas');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[maquinas] endpoint indisponível.');
    return [];
  }
}

export async function criarMaquina(nome: string, tipo?: string): Promise<MaquinaAPI> {
  const { data } = await api.post('/api/maquinas', { nome, tipo });
  return data as MaquinaAPI;
}

/** Lista os funcionários (responsáveis) ativos */
export async function getFuncionarios(): Promise<FuncionarioAPI[]> {
  try {
    const { data } = await api.get<FuncionarioAPI[]>('/api/funcionarios');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[funcionarios] endpoint indisponível.');
    return [];
  }
}

/** Lista os fornecedores cadastrados */
export async function getFornecedores(): Promise<FornecedorAPI[]> {
  try {
    const { data } = await api.get<FornecedorAPI[]>('/api/fornecedores');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[fornecedores] endpoint indisponível.');
    return [];
  }
}

/** Opções de status aceitas pela atividade (para o combo do formulário) */
export async function getStatusAtividadeOpcoes(): Promise<string[]> {
  try {
    const { data } = await api.get<string[]>('/api/atividades/status-opcoes');
    return Array.isArray(data) && data.length ? data : ['Planejada', 'Em Andamento', 'Concluída'];
  } catch {
    return ['Planejada', 'Em Andamento', 'Concluída'];
  }
}

// ---------------------------------------------------------------------------
// Atividades Agrícolas — operação
// ---------------------------------------------------------------------------

/** Normaliza o retorno do backend para o tipo AtividadeAgricola do frontend */
export function mapAtividade(raw: any): AtividadeAgricola {
  return {
    id: String(raw?.id_atividade_agricola ?? raw?.id ?? ''),
    id_empresa: raw?.id_empresa ?? null,
    id_propriedade: Number(raw?.id_propriedade ?? 0),
    nome_propriedade: raw?.nome_propriedade,
    id_talhao: String(raw?.id_talhao ?? ''),
    codigo_talhao: raw?.codigo_talhao,
    nome_talhao: raw?.nome_talhao,
    safra: raw?.safra,
    id_categoria_atividade: raw?.id_categoria_atividade,
    categoria: raw?.categoria,
    id_tipo_atividade: raw?.id_tipo_atividade,
    tipo_atividade: raw?.tipo_atividade ?? '',
    data_inicio: raw?.data_inicio ?? '',
    data_fim: raw?.data_fim ?? null,
    id_responsavel: raw?.id_responsavel ?? raw?.id_funcionario ?? undefined,
    responsavel: raw?.responsavel,
    status: raw?.status ?? 'Planejada',
    custo_operacao: raw?.custo_operacao ?? null,
    custo_total: raw?.custo_total,
    atrasada: raw?.atrasada,
    insumos: Array.isArray(raw?.insumos)
      ? raw.insumos.map((i: any) => ({
          id_insumo: i?.id_insumo,
          nome: i?.nome ?? '',
          quantidade: Number(i?.quantidade ?? 0),
          unidade: i?.unidade ?? '',
          custo: i?.custo != null ? Number(i.custo) : undefined,
          baixado: i?.baixado === true,
          id_movimentacao: i?.id_movimentacao ?? null,
        }))
      : [],
    maquinas: Array.isArray(raw?.maquinas)
      ? raw.maquinas.map((m: any) => ({
          id_maquina: m?.id_maquina,
          nome: m?.nome ?? '',
          horas: m?.horas != null ? Number(m.horas) : undefined,
          custo: m?.custo != null ? Number(m.custo) : undefined,
        }))
      : [],
    observacoes: raw?.observacoes,
    baixa_estoque: {
      geradas: Number(raw?.baixa_estoque?.geradas ?? 0),
      pendentes: Array.isArray(raw?.baixa_estoque?.pendentes)
        ? raw.baixa_estoque.pendentes.map((p: any) => ({
            id_insumo: p?.id_insumo,
            nome: p?.nome ?? '',
            quantidade: Number(p?.quantidade ?? 0),
            disponivel: Number(p?.disponivel ?? 0),
          }))
        : [],
    },
  };
}

/** Atividades cadastradas, sem dados de demonstração; propaga a falha da API */
export async function getAtividadesCadastradas(): Promise<AtividadeAgricola[]> {
  const { data } = await api.get<any[]>('/api/atividades');
  return Array.isArray(data) ? data.map(mapAtividade) : [];
}

export async function getAtividades(): Promise<AtividadeAgricola[]> {
  try {
    return await getAtividadesCadastradas();
  } catch {
    console.warn('[atividades] endpoint indisponível — usando dados de demonstração.');
    return ATIVIDADES_MOCK;
  }
}

export async function getAtividade(id: string): Promise<AtividadeAgricola> {
  const { data } = await api.get(`/api/atividades/${id}`);
  return mapAtividade(data);
}

export async function getAtividadeIndicadores(): Promise<AtividadeIndicadores | null> {
  try {
    const { data } = await api.get<AtividadeIndicadores>('/api/atividades/indicadores');
    return data ?? null;
  } catch {
    return null;
  }
}

export async function criarAtividade(
  dados: NovaAtividadePayload
): Promise<AtividadeAgricola> {
  const { data } = await api.post('/api/atividades', dados);
  return mapAtividade(data);
}

export async function atualizarAtividade(
  id: string,
  dados: NovaAtividadePayload
): Promise<AtividadeAgricola> {
  const { data } = await api.put(`/api/atividades/${id}`, dados);
  return mapAtividade(data);
}

export async function excluirAtividade(id: string): Promise<void> {
  await api.delete(`/api/atividades/${id}`);
}

// ---------------------------------------------------------------------------
// Insumos e movimentações de estoque
// ---------------------------------------------------------------------------

export interface CategoriaInsumoAPI {
  id_categoria_insumo: number;
  nome_categoria: string;
  status?: boolean;
}

export interface FabricanteAPI {
  id_fabricante: number;
  nome_fabricante: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  website?: string | null;
  observacoes?: string | null;
  status?: boolean;
}

export type FabricantePayload = Partial<Omit<FabricanteAPI, 'id_fabricante'>>;

export interface MarcaAPI {
  id_marca: number;
  descricao_marca: string;
}

export async function getCategoriasInsumo(): Promise<CategoriaInsumoAPI[]> {
  try {
    const { data } = await api.get<CategoriaInsumoAPI[]>('/api/categorias-insumo');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[categorias-insumo] endpoint indisponível.');
    return [];
  }
}

export async function getFabricantes(): Promise<FabricanteAPI[]> {
  try {
    const { data } = await api.get<FabricanteAPI[]>('/api/fabricantes');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[fabricantes] endpoint indisponível.');
    return [];
  }
}

export async function getMarcas(): Promise<MarcaAPI[]> {
  try {
    const { data } = await api.get<MarcaAPI[]>('/api/marcas');
    return Array.isArray(data) ? data : [];
  } catch {
    console.warn('[marcas] endpoint indisponível.');
    return [];
  }
}

/** Produtos do cadastro, para o insumo usar um produto existente */
export async function getProdutos(): Promise<ProdutoCadastrado[]> {
  try {
    const { data } = await api.get<unknown[]>('/api/produtos');
    return Array.isArray(data) ? data.map(produtoDaApi) : [];
  } catch {
    console.warn('[produtos] endpoint indisponível.');
    return [];
  }
}

export function criarFornecedor(dados: FornecedorPayload): Promise<unknown> {
  return escreverSemDemonstracao(() => api.post('/api/fornecedores', dados));
}

export function atualizarFornecedor(id: number, dados: FornecedorPayload): Promise<unknown> {
  return escreverSemDemonstracao(() => api.put(`/api/fornecedores/${id}`, dados));
}

export async function excluirFornecedor(id: number): Promise<void> {
  await escreverSemDemonstracao(() => api.delete(`/api/fornecedores/${id}`));
}

export function criarFabricante(dados: FabricantePayload): Promise<unknown> {
  return escreverSemDemonstracao(() => api.post('/api/fabricantes', dados));
}

export function atualizarFabricante(id: number, dados: FabricantePayload): Promise<unknown> {
  return escreverSemDemonstracao(() => api.put(`/api/fabricantes/${id}`, dados));
}

export async function excluirFabricante(id: number): Promise<void> {
  await escreverSemDemonstracao(() => api.delete(`/api/fabricantes/${id}`));
}

export function criarMarca(descricao_marca: string): Promise<unknown> {
  return escreverSemDemonstracao(() => api.post('/api/marcas', { descricao_marca }));
}

export function atualizarMarca(id: number, descricao_marca: string): Promise<unknown> {
  return escreverSemDemonstracao(() => api.put(`/api/marcas/${id}`, { descricao_marca }));
}

export async function excluirMarca(id: number): Promise<void> {
  await escreverSemDemonstracao(() => api.delete(`/api/marcas/${id}`));
}

/** Insumos cadastrados, sem dados de demonstração; propaga a falha da API */
export async function getInsumosCadastrados(): Promise<Insumo[]> {
  const { data } = await api.get<unknown[]>('/api/insumos');
  return Array.isArray(data) ? data.map(insumoDaApi) : [];
}

export async function getInsumos(): Promise<Insumo[]> {
  try {
    const cadastrados = await getInsumosCadastrados();
    return cadastrados.length ? cadastrados : INSUMOS_MOCK_ESTOQUE;
  } catch {
    console.warn('[insumos] endpoint indisponível — usando dados de demonstração.');
    return INSUMOS_MOCK_ESTOQUE;
  }
}

export async function criarInsumo(dados: NovoInsumoPayload): Promise<Insumo> {
  try {
    const { data } = await api.post('/api/insumos', insumoParaApi(dados));
    return insumoDaApi(data);
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
    // Fallback local: gera um insumo "salvo" apenas em memória
    return { ...dados, id: `local-${Date.now()}`, lotes: [] } as Insumo;
  }
}

export async function atualizarInsumo(
  id: string,
  dados: NovoInsumoPayload
): Promise<Insumo> {
  try {
    const { data } = await api.put(`/api/insumos/${id}`, insumoParaApi(dados, true));
    return insumoDaApi(data);
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
    // Fallback local: reflete a edição apenas em memória
    return { ...dados, id } as Insumo;
  }
}

export async function excluirInsumo(id: string): Promise<void> {
  try {
    await api.delete(`/api/insumos/${id}`);
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
  }
}

export async function getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
  try {
    const { data } = await api.get<unknown[]>('/api/movimentacoes');
    if (Array.isArray(data) && data.length) return data.map(movimentacaoDaApi);
    return MOVIMENTACOES_MOCK;
  } catch {
    console.warn('[insumos] movimentações indisponíveis — usando dados de demonstração.');
    return MOVIMENTACOES_MOCK;
  }
}

/** Saídas de estoque vinculadas a uma atividade, automáticas e manuais */
export async function getMovimentacoesDaAtividade(
  idAtividade: string
): Promise<MovimentacaoEstoque[]> {
  const { data } = await api.get<unknown[]>('/api/movimentacoes', {
    params: { id_atividade_agricola: idAtividade },
  });
  return Array.isArray(data) ? data.map(movimentacaoDaApi) : [];
}

export async function criarMovimentacao(
  dados: NovaMovimentacaoPayload
): Promise<MovimentacaoEstoque> {
  try {
    const { data } = await api.post('/api/movimentacoes', movimentacaoParaApi(dados));
    return movimentacaoDaApi(data);
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
    // Fallback local: gera uma movimentação "salva" apenas em memória
    return { ...dados, id: `local-${Date.now()}` } as MovimentacaoEstoque;
  }
}

// ---------------------------------------------------------------------------
// SafraIA — assistente inteligente rural
// ---------------------------------------------------------------------------

/**
 * Envia a pergunta do usuário ao agente SafraIA. Quando o backend LLM
 * (/api/safra-ia/consultar) não responder, usa o motor de interpretação
 * local (mock) analisando o contexto da fazenda já carregado no frontend.
 */
export async function consultarSafraIA(
  payload: SafraIAConsultaPayload
): Promise<SafraIAResposta> {
  try {
    const { data } = await api.post<SafraIAResposta>('/api/safra-ia/consultar', {
      pergunta: payload.pergunta,
      persona: payload.persona,
    });
    if (data && typeof data.texto === 'string') return data;
    return responderSafraIA(payload);
  } catch {
    console.warn('[safra-ia] endpoint indisponível — usando interpretação local.');
    return responderSafraIA(payload);
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

/**
 * Regra única de demonstração do Financeiro: se o backend respondeu, vale a
 * resposta, mesmo vazia; se recusou, o erro é propagado com a mensagem dele;
 * só quando não há resposta (rede ou proxy) entram os dados de demonstração.
 * `buscar` devolve null quando a resposta não tem o formato esperado.
 */
async function realOuDemonstracao<T>(
  rotulo: string,
  buscar: () => Promise<T | null>,
  demonstracao: () => T
): Promise<T> {
  try {
    const real = await buscar();
    if (real != null) return real;
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
  }
  console.warn(`[financeiro] ${rotulo}: backend sem resposta — usando dados de demonstração.`);
  return demonstracao();
}

/** Escrita sem modo de demonstração: propaga a recusa do backend com a mensagem dele */
async function escreverSemDemonstracao<T>(chamada: () => Promise<{ data: T }>): Promise<T> {
  try {
    return (await chamada()).data;
  } catch (e) {
    throw (
      erroDoBackend(e) ??
      new Error('Não foi possível falar com o servidor. Tente novamente.')
    );
  }
}

export function getLancamentos(filtros: FiltrosLancamento = {}): Promise<Lancamento[]> {
  return realOuDemonstracao(
    'lançamentos',
    async () => {
      const { data } = await api.get<Lancamento[]>('/api/lancamentos', {
        params: paramsLancamento(filtros),
      });
      return Array.isArray(data) ? data : null;
    },
    () => filtrarLancamentosMock(filtros)
  );
}

export async function criarLancamento(
  dados: NovoLancamentoPayload
): Promise<Lancamento> {
  try {
    const { data } = await api.post<Lancamento>('/api/lancamentos', dados);
    return data;
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
    // Backend sem resposta → grava no store de demonstração da sessão
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
  } catch (e) {
    const erro = erroDoBackend(e);
    if (erro) throw erro;
    return atualizarLancamentoMock(id, dados);
  }
}

export async function excluirLancamento(id: string): Promise<void> {
  try {
    await api.delete(`/api/lancamentos/${id}`);
  } catch (e) {
    // Recusa do backend (ex.: lançamento conciliado) → propaga
    const erro = erroDoBackend(e);
    if (erro) throw erro;
    // Backend sem resposta → exclui do store de demonstração
    excluirLancamentoMock(id);
  }
}

/** Marca ou desmarca a conciliação; o backend só concilia lançamento pago */
export function conciliarLancamento(id: string, conciliado: boolean): Promise<Lancamento> {
  return escreverSemDemonstracao(() =>
    api.put<Lancamento>(`/api/lancamentos/${id}/conciliacao`, { conciliado })
  );
}

export function getCentrosCusto(): Promise<CentroCusto[]> {
  return realOuDemonstracao(
    'centros de custo',
    async () => {
      const { data } = await api.get<CentroCusto[]>('/api/centros-custo');
      return Array.isArray(data) ? data : null;
    },
    () => CENTROS_CUSTO_MOCK
  );
}

export function criarCentroCusto(dados: CentroCustoPayload): Promise<CentroCusto> {
  return escreverSemDemonstracao(() => api.post<CentroCusto>('/api/centros-custo', dados));
}

export function atualizarCentroCusto(
  id: number,
  dados: Partial<CentroCustoPayload>
): Promise<CentroCusto> {
  return escreverSemDemonstracao(() => api.put<CentroCusto>(`/api/centros-custo/${id}`, dados));
}

export async function excluirCentroCusto(id: number): Promise<void> {
  await escreverSemDemonstracao(() => api.delete(`/api/centros-custo/${id}`));
}

export function getSafras(idPropriedade?: number): Promise<Safra[]> {
  return realOuDemonstracao(
    'safras',
    async () => {
      const { data } = await api.get<Safra[]>('/api/safras', {
        params: idPropriedade ? { id_propriedade: idPropriedade } : {},
      });
      return Array.isArray(data) ? data : null;
    },
    () =>
      idPropriedade
        ? SAFRAS_MOCK.filter((s) => s.id_propriedade === idPropriedade)
        : SAFRAS_MOCK
  );
}

export function criarSafra(dados: SafraPayload): Promise<Safra> {
  return escreverSemDemonstracao(() => api.post<Safra>('/api/safras', dados));
}

/** A propriedade da safra não muda na edição (o backend recusa a troca) */
export function atualizarSafra(id: number, dados: Partial<SafraPayload>): Promise<Safra> {
  return escreverSemDemonstracao(() => api.put<Safra>(`/api/safras/${id}`, dados));
}

export async function excluirSafra(id: number): Promise<void> {
  await escreverSemDemonstracao(() => api.delete(`/api/safras/${id}`));
}

export function getFinanceiroSaldo(
  filtros: FiltrosLancamento = {}
): Promise<SaldoFinanceiro> {
  return realOuDemonstracao(
    'saldo',
    async () => {
      const { data } = await api.get<SaldoFinanceiro>('/api/financeiro/saldo', {
        params: paramsLancamento(filtros),
      });
      return data && typeof data.saldo === 'number' ? data : null;
    },
    () => saldoMock(filtros)
  );
}

export function getFluxoCaixa(
  dataInicio?: string,
  dataFim?: string
): Promise<FluxoCaixaItem[]> {
  return realOuDemonstracao(
    'fluxo de caixa',
    async () => {
      const { data } = await api.get<FluxoCaixaItem[]>('/api/financeiro/fluxo-caixa', {
        params: {
          ...(dataInicio ? { data_inicio: dataInicio } : {}),
          ...(dataFim ? { data_fim: dataFim } : {}),
        },
      });
      return Array.isArray(data) ? data : null;
    },
    () => fluxoCaixaMock(dataInicio, dataFim)
  );
}

export function getIndicadores(agruparPor: AgruparPor): Promise<IndicadorFinanceiro[]> {
  return realOuDemonstracao(
    'indicadores',
    async () => {
      const { data } = await api.get<IndicadorFinanceiro[]>('/api/financeiro/indicadores', {
        params: { agrupar_por: agruparPor },
      });
      return Array.isArray(data) ? data : null;
    },
    () => indicadoresMock(agruparPor)
  );
}

/** Lista todos os lançamentos (usado por telas que agregam no cliente) */
export function getTodosLancamentos(): Promise<Lancamento[]> {
  return realOuDemonstracao(
    'lançamentos',
    async () => {
      const { data } = await api.get<Lancamento[]>('/api/lancamentos');
      return Array.isArray(data) ? data : null;
    },
    () => LANCAMENTOS_MOCK
  );
}
