// ---------------------------------------------------------------------------
// Módulo SafraIA (Assistente Inteligente Rural) — tipos de domínio
// ---------------------------------------------------------------------------

import { Insumo, MovimentacaoEstoque } from "./insumo";
import { Talhao } from "./talhao";
import { AtividadeAgricola } from "./atividade";
import { Lancamento, Safra } from "./financeiro";

export type SafraIAPapelId =
  | "administrador"
  | "proprietario"
  | "gerente-agricola"
  | "agronomo"
  | "supervisor-campo"
  | "financeiro"
  | "estoquista"
  | "operador"
  | "colaborador";

export type SafraIAModulo =
  | "Propriedades"
  | "Talhões"
  | "Funcionários"
  | "Atividades"
  | "Financeiro"
  | "Insumos";

export interface SafraIAConsultaDisponivel {
  nome: string;
  descricao: string;
}

export interface SafraIAPerfil {
  papel: SafraIAPapelId;
  nome_papel: string;
  foco: string;
  saudacao: string;
  sugestoes: string[];
  consultas: SafraIAConsultaDisponivel[];
}

export interface SafraIAPapel extends SafraIAPerfil {
  modulos: SafraIAModulo[];
}

/** Tom visual de um destaque/insight retornado pelo agente. */
export type SafraIATom = "neutro" | "positivo" | "atencao" | "critico";

export interface SafraIADestaque {
  rotulo: string;
  valor: string;
  tom?: SafraIATom;
  detalhe?: string;
}

export interface SafraIAAlerta {
  nivel: "info" | "alerta" | "critico";
  titulo: string;
  descricao?: string;
}

export interface SafraIATabela {
  titulo?: string;
  colunas: string[];
  linhas: (string | number)[][];
}

/** Resposta estruturada do agente: texto + insights + alertas + dados. */
export interface SafraIAResposta {
  /** Identificador da intenção reconhecida (para rastreio/telemetria). */
  intent: string;
  /** Resumo em linguagem natural. */
  texto: string;
  papel?: string;
  destaques?: SafraIADestaque[];
  alertas?: SafraIAAlerta[];
  tabela?: SafraIATabela;
  /** Perguntas de acompanhamento sugeridas. */
  sugestoes?: string[];
  /** "backend" = agente real (Gemini + dados do banco); "demonstracao" = motor local. */
  origem?: "backend" | "demonstracao";
}

/** Contexto da fazenda enviado ao agente para análise. */
export interface SafraIAContexto {
  insumos: Insumo[];
  movimentacoes: MovimentacaoEstoque[];
  talhoes: Talhao[];
  atividades: AtividadeAgricola[];
  lancamentos: Lancamento[];
  safras: Safra[];
  propriedades: SafraIAPropriedade[];
}

export interface SafraIAPropriedade {
  id_propriedade: number;
  nome_propriedade: string;
  status?: boolean;
  area_total?: number | string;
  area_agricultavel?: number | string;
  area_preservacao?: number | string;
  area_pastagem?: number | string;
}

/** Payload de consulta ao assistente. */
export interface SafraIAConsultaPayload {
  pergunta: string;
  papel: string;
  contexto: SafraIAContexto;
}

export type SafraIARemetente = "usuario" | "assistente";

/** Mensagem individual do histórico de conversa. */
export interface SafraIAMensagem {
  id: string;
  remetente: SafraIARemetente;
  texto: string;
  /** Conteúdo estruturado (apenas em mensagens do assistente). */
  resposta?: SafraIAResposta;
  hora: string; // ISO
  carregando?: boolean;
}
