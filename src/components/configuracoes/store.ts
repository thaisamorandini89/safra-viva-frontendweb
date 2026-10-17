import { createContext, useContext } from "react";
import { DadosToast } from "../ui/Toast";

// ---------------------------------------------------------------------------
// Módulo de Configurações — modelo de dados, padrões e persistência local.
// Enquanto não há backend dedicado, o estado é mantido no localStorage para
// que as configurações sobrevivam a recarregamentos da página.
// ---------------------------------------------------------------------------

export type StatusUsuario = "Ativo" | "Inativo" | "Bloqueado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: string;
  status: StatusUsuario;
}

export interface Perfil {
  id: string;
  nome: string;
  descricao: string;
  padrao: boolean;
  /** modulo -> ações habilitadas */
  permissoes: Record<string, string[]>;
}

export interface EmpresaConfig {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  responsavelLegal: string;
  /** dataURL do logotipo */
  logo: string | null;
}

export interface CadastrosAux {
  tiposSolo: string[];
  culturas: string[];
  categoriasReceita: string[];
  categoriasDespesa: string[];
  funcoes: string[];
}

export interface ParametrosAgricolas {
  safraNomePadrao: string;
  safraInicioPadrao: string;
  safraFimPadrao: string;
  unidadeArea: string;
  unidadeProdutividade: string;
  unidadesAtivas: string[];
}

export interface Integracao {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  icone: string;
  ativa: boolean;
}

export interface Seguranca {
  senhaTamanhoMin: number;
  senhaComplexidade: boolean;
  senhaExpiracaoDias: number;
  senhaHistorico: number;
  mfa: boolean;
  recuperacaoSenha: boolean;
  sessaoTimeoutMin: number;
  logoutAutomatico: boolean;
}

export interface LogAuditoria {
  id: string;
  usuario: string;
  dataHora: string;
  tela: string;
  acao: string;
  ip: string;
}

export interface ItemBackup {
  id: string;
  data: string;
  responsavel: string;
  status: "Concluído" | "Em andamento" | "Falha";
  tipo: "Automático" | "Manual";
}

export interface BackupConfig {
  automaticoDiario: boolean;
  horario: string;
  historico: ItemBackup[];
}

export interface ConfiguracoesEstado {
  empresa: EmpresaConfig;
  usuarios: Usuario[];
  perfis: Perfil[];
  cadastros: CadastrosAux;
  parametros: ParametrosAgricolas;
  notificacoes: Record<string, boolean>;
  integracoes: Integracao[];
  seguranca: Seguranca;
  auditoria: LogAuditoria[];
  backup: BackupConfig;
}

// --------------------------------------------------- catálogo de permissões
export const MODULOS_PERMISSAO: { modulo: string; acoes: string[] }[] = [
  { modulo: "Empresas", acoes: ["Visualizar", "Criar", "Editar", "Excluir"] },
  { modulo: "Propriedades", acoes: ["Visualizar", "Criar", "Editar", "Excluir"] },
  { modulo: "Talhões", acoes: ["Visualizar", "Criar", "Editar", "Excluir"] },
  { modulo: "Funcionários", acoes: ["Visualizar", "Criar", "Editar", "Excluir"] },
  { modulo: "Atividades", acoes: ["Visualizar", "Criar", "Editar", "Finalizar"] },
  { modulo: "Financeiro", acoes: ["Visualizar", "Criar", "Editar", "Aprovar"] },
  { modulo: "Insumos", acoes: ["Visualizar", "Movimentar", "Aprovar Compras"] },
];

/** Normaliza um mapa de permissões para conter todos os módulos do catálogo. */
function montar(mapa: Record<string, string[]>): Record<string, string[]> {
  const res: Record<string, string[]> = {};
  MODULOS_PERMISSAO.forEach((m) => {
    res[m.modulo] = (mapa[m.modulo] ?? []).filter((a) => m.acoes.includes(a));
  });
  return res;
}

const TODAS = montar(
  Object.fromEntries(MODULOS_PERMISSAO.map((m) => [m.modulo, m.acoes]))
);

const PERFIS_PADRAO: Perfil[] = [
  {
    id: "administrador",
    nome: "Administrador",
    descricao: "Acesso total ao sistema.",
    padrao: true,
    permissoes: TODAS,
  },
  {
    id: "proprietario",
    nome: "Proprietário",
    descricao: "Visualização gerencial completa.",
    padrao: true,
    permissoes: montar({
      Empresas: ["Visualizar"],
      Propriedades: ["Visualizar"],
      Talhões: ["Visualizar"],
      Funcionários: ["Visualizar"],
      Atividades: ["Visualizar", "Finalizar"],
      Financeiro: ["Visualizar", "Aprovar"],
      Insumos: ["Visualizar"],
    }),
  },
  {
    id: "gerente-agricola",
    nome: "Gerente Agrícola",
    descricao: "Acesso operacional e gerencial.",
    padrao: true,
    permissoes: montar({
      Propriedades: ["Visualizar", "Criar", "Editar"],
      Talhões: ["Visualizar", "Criar", "Editar"],
      Funcionários: ["Visualizar", "Criar", "Editar"],
      Atividades: ["Visualizar", "Criar", "Editar", "Finalizar"],
      Financeiro: ["Visualizar"],
      Insumos: ["Visualizar", "Movimentar"],
    }),
  },
  {
    id: "agronomo",
    nome: "Agrônomo",
    descricao: "Acesso às áreas técnicas.",
    padrao: true,
    permissoes: montar({
      Propriedades: ["Visualizar"],
      Talhões: ["Visualizar", "Criar", "Editar"],
      Atividades: ["Visualizar", "Criar", "Editar", "Finalizar"],
      Insumos: ["Visualizar", "Movimentar"],
    }),
  },
  {
    id: "supervisor-campo",
    nome: "Supervisor de Campo",
    descricao: "Acesso às atividades operacionais.",
    padrao: true,
    permissoes: montar({
      Talhões: ["Visualizar"],
      Atividades: ["Visualizar", "Criar", "Finalizar"],
      Insumos: ["Visualizar", "Movimentar"],
    }),
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Acesso apenas ao módulo financeiro.",
    padrao: true,
    permissoes: montar({
      Financeiro: ["Visualizar", "Criar", "Editar", "Aprovar"],
    }),
  },
  {
    id: "estoquista",
    nome: "Estoquista",
    descricao: "Acesso aos módulos de estoque e insumos.",
    padrao: true,
    permissoes: montar({
      Atividades: ["Visualizar"],
      Insumos: ["Visualizar", "Movimentar", "Aprovar Compras"],
    }),
  },
  {
    id: "operador",
    nome: "Operador",
    descricao: "Acesso restrito às atividades atribuídas.",
    padrao: true,
    permissoes: montar({
      Atividades: ["Visualizar", "Finalizar"],
    }),
  },
];

// ---------------------------------------------------------- notificações
export const GRUPOS_NOTIFICACAO: { grupo: string; icone: string; itens: string[] }[] = [
  {
    grupo: "Operacionais",
    icone: "⚙️",
    itens: ["Atividade atrasada", "Safra próxima do encerramento", "Talhão sem planejamento"],
  },
  {
    grupo: "Estoque",
    icone: "📦",
    itens: ["Estoque baixo", "Produto vencido", "Produto próximo ao vencimento"],
  },
  {
    grupo: "Financeiros",
    icone: "💰",
    itens: ["Contas a vencer", "Contas vencidas", "Despesas acima do orçamento"],
  },
  {
    grupo: "Funcionários",
    icone: "👥",
    itens: ["Férias programadas", "Admissões", "Desligamentos"],
  },
];

export const chaveNotificacao = (grupo: string, item: string) => `${grupo}::${item}`;

function notificacoesPadrao(): Record<string, boolean> {
  const res: Record<string, boolean> = {};
  GRUPOS_NOTIFICACAO.forEach((g) =>
    g.itens.forEach((item) => {
      res[chaveNotificacao(g.grupo, item)] = true;
    })
  );
  return res;
}

// ------------------------------------------------------- unidades / listas
export const UNIDADES_DISPONIVEIS = [
  "Hectare (ha)",
  "Alqueire",
  "Tonelada",
  "Saca",
  "Quilograma",
  "Litro",
];

export const UNIDADES_PRODUTIVIDADE = ["Sacas/ha", "Toneladas/ha", "Arrobas/ha"];

// --------------------------------------------------------------- padrões
const hoje = () => new Date().toISOString().slice(0, 10);

export const ESTADO_PADRAO: ConfiguracoesEstado = {
  empresa: {
    razaoSocial: "SafraViva Agronegócios Ltda.",
    nomeFantasia: "SafraViva",
    cnpj: "12.345.678/0001-90",
    endereco: "Rodovia BR-163, km 120 — Sorriso/MT",
    telefone: "(66) 3544-1200",
    email: "contato@safraviva.com.br",
    responsavelLegal: "Karla Klemke",
    logo: null,
  },
  usuarios: [
    { id: "u1", nome: "Karla Klemke", email: "karla@safraviva.com.br", telefone: "(66) 99999-0001", perfil: "administrador", status: "Ativo" },
    { id: "u2", nome: "João Silva", email: "joao.silva@safraviva.com.br", telefone: "(66) 99999-0002", perfil: "agronomo", status: "Ativo" },
    { id: "u3", nome: "Maria Souza", email: "maria.souza@safraviva.com.br", telefone: "(66) 99999-0003", perfil: "financeiro", status: "Ativo" },
    { id: "u4", nome: "Carlos Lima", email: "carlos.lima@safraviva.com.br", telefone: "(66) 99999-0004", perfil: "supervisor-campo", status: "Ativo" },
    { id: "u5", nome: "Ana Pereira", email: "ana.pereira@safraviva.com.br", telefone: "(66) 99999-0005", perfil: "estoquista", status: "Inativo" },
  ],
  perfis: PERFIS_PADRAO,
  cadastros: {
    tiposSolo: ["Arenoso", "Argiloso", "Siltoso", "Franco Argiloso"],
    culturas: ["Soja", "Milho", "Algodão", "Cana-de-Açúcar", "Feijão", "Pastagem"],
    categoriasReceita: ["Venda de Grãos", "Venda de Gado", "Prestação de Serviços"],
    categoriasDespesa: ["Insumos", "Combustível", "Salários", "Manutenção"],
    funcoes: ["Agrônomo", "Tratorista", "Operador de Pulverizador", "Encarregado", "Técnico Agrícola", "Motorista"],
  },
  parametros: {
    safraNomePadrao: "2025/26",
    safraInicioPadrao: "2025-09-01",
    safraFimPadrao: "2026-08-31",
    unidadeArea: "Hectare (ha)",
    unidadeProdutividade: "Sacas/ha",
    unidadesAtivas: ["Hectare (ha)", "Tonelada", "Saca", "Quilograma", "Litro"],
  },
  notificacoes: notificacoesPadrao(),
  integracoes: [
    { id: "clima", nome: "APIs Climáticas", categoria: "Clima", descricao: "Temperatura, chuva, umidade e velocidade do vento.", icone: "🌦️", ativa: false },
    { id: "john-deere", nome: "John Deere", categoria: "Máquinas Agrícolas", descricao: "Telemetria e dados operacionais de máquinas.", icone: "🚜", ativa: false },
    { id: "case-ih", nome: "Case IH", categoria: "Máquinas Agrícolas", descricao: "Integração de frota e implementos.", icone: "🚜", ativa: false },
    { id: "new-holland", nome: "New Holland", categoria: "Máquinas Agrícolas", descricao: "Monitoramento de equipamentos.", icone: "🚜", ativa: false },
    { id: "bancos", nome: "Bancos", categoria: "Financeira", descricao: "Conciliação e extratos bancários.", icone: "🏦", ativa: false },
    { id: "erp", nome: "ERP", categoria: "Financeira", descricao: "Sincronização com o ERP corporativo.", icone: "🧩", ativa: false },
    { id: "contabil", nome: "Sistemas Contábeis", categoria: "Financeira", descricao: "Exportação de dados contábeis.", icone: "📒", ativa: false },
    { id: "nfe", nome: "Emissão de NF-e", categoria: "Fiscal", descricao: "Emissão de notas e documentos fiscais.", icone: "🧾", ativa: false },
  ],
  seguranca: {
    senhaTamanhoMin: 8,
    senhaComplexidade: true,
    senhaExpiracaoDias: 90,
    senhaHistorico: 5,
    mfa: false,
    recuperacaoSenha: true,
    sessaoTimeoutMin: 30,
    logoutAutomatico: true,
  },
  auditoria: [
    { id: "l1", usuario: "Karla Klemke", dataHora: `${hoje()}T08:12:00`, tela: "Login", acao: "Login realizado", ip: "192.168.0.10" },
    { id: "l2", usuario: "João Silva", dataHora: `${hoje()}T08:45:12`, tela: "Atividades", acao: "Inclusão de atividade", ip: "192.168.0.21" },
    { id: "l3", usuario: "Maria Souza", dataHora: `${hoje()}T09:03:40`, tela: "Financeiro", acao: "Aprovação de lançamento", ip: "192.168.0.33" },
    { id: "l4", usuario: "Carlos Lima", dataHora: `${hoje()}T09:30:05`, tela: "Insumos", acao: "Movimentação de estoque", ip: "192.168.0.44" },
    { id: "l5", usuario: "Karla Klemke", dataHora: `${hoje()}T10:00:00`, tela: "Configurações", acao: "Alteração de permissões", ip: "192.168.0.10" },
  ],
  backup: {
    automaticoDiario: true,
    horario: "03:00",
    historico: [
      { id: "b1", data: `${hoje()}T03:00:00`, responsavel: "Sistema", status: "Concluído", tipo: "Automático" },
      { id: "b2", data: `${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T03:00:00`, responsavel: "Sistema", status: "Concluído", tipo: "Automático" },
      { id: "b3", data: `${new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)}T15:22:00`, responsavel: "Karla Klemke", status: "Concluído", tipo: "Manual" },
    ],
  },
};

// --------------------------------------------------------- persistência
const STORAGE_KEY = "safraviva:configuracoes:v1";

export function carregarEstado(): ConfiguracoesEstado {
  try {
    if (typeof localStorage === "undefined") return ESTADO_PADRAO;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ESTADO_PADRAO;
    const salvo = JSON.parse(raw) as Partial<ConfiguracoesEstado>;
    // Mescla com os padrões para suportar novos campos adicionados depois.
    return {
      ...ESTADO_PADRAO,
      ...salvo,
      empresa: { ...ESTADO_PADRAO.empresa, ...(salvo.empresa ?? {}) },
      cadastros: { ...ESTADO_PADRAO.cadastros, ...(salvo.cadastros ?? {}) },
      parametros: { ...ESTADO_PADRAO.parametros, ...(salvo.parametros ?? {}) },
      seguranca: { ...ESTADO_PADRAO.seguranca, ...(salvo.seguranca ?? {}) },
      backup: { ...ESTADO_PADRAO.backup, ...(salvo.backup ?? {}) },
      notificacoes: { ...ESTADO_PADRAO.notificacoes, ...(salvo.notificacoes ?? {}) },
    };
  } catch {
    return ESTADO_PADRAO;
  }
}

export function salvarEstado(estado: ConfiguracoesEstado): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    /* ignora falhas de persistência */
  }
}

// --------------------------------------------------------------- contexto
export interface ConfigContextValue {
  estado: ConfiguracoesEstado;
  atualizar: <K extends keyof ConfiguracoesEstado>(chave: K, valor: ConfiguracoesEstado[K]) => void;
  notificar: (dados: DadosToast) => void;
  registrarLog: (acao: string, tela: string) => void;
}

export const ConfigContext = createContext<ConfigContextValue | null>(null);

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig deve ser usado dentro de ConfigContext.Provider");
  return ctx;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtDataHora = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
};
