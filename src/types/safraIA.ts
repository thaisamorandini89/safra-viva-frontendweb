// ---------------------------------------------------------------------------
// Módulo SafraIA (Assistente Inteligente Rural) — tipos de domínio
// ---------------------------------------------------------------------------
// Contratos compartilhados entre a UI do chat e o motor de interpretação de
// consultas (simulação de um backend LLM). O agente adapta respostas e
// permissões conforme a persona do usuário logado.
// ---------------------------------------------------------------------------

import { Insumo, MovimentacaoEstoque } from "./insumo";
import { Talhao } from "./talhao";
import { AtividadeAgricola } from "./atividade";
import { Lancamento, Safra } from "./financeiro";

/** Personas suportadas pelo assistente (níveis de acesso). */
export type SafraIAPersonaId =
  | "produtor"
  | "agronomo"
  | "administrador"
  | "gerente";

export interface SafraIAPersona {
  id: SafraIAPersonaId;
  nome: string;
  icone: string;
  /** Resumo do foco de atuação da persona. */
  foco: string;
  /** Mensagem de boas-vindas exibida ao abrir o chat. */
  saudacao: string;
  /** Perguntas sugeridas iniciais, específicas da persona. */
  sugestoes: string[];
  /** Define se a persona pode consultar análises financeiras sensíveis. */
  verFinanceiro: boolean;
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
  destaques?: SafraIADestaque[];
  alertas?: SafraIAAlerta[];
  tabela?: SafraIATabela;
  /** Perguntas de acompanhamento sugeridas. */
  sugestoes?: string[];
}

/** Contexto da fazenda enviado ao agente para análise. */
export interface SafraIAContexto {
  insumos: Insumo[];
  movimentacoes: MovimentacaoEstoque[];
  talhoes: Talhao[];
  atividades: AtividadeAgricola[];
  lancamentos: Lancamento[];
  safras: Safra[];
}

/** Payload de consulta ao assistente. */
export interface SafraIAConsultaPayload {
  pergunta: string;
  persona: SafraIAPersonaId;
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
