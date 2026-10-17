import { carregarEstado } from "../configuracoes/store";

// ---------------------------------------------------------------------------
// Módulo de Autenticação — regras e persistência local.
// Não há backend de autenticação disponível; para fins de demonstração a
// validação ocorre contra a base de usuários mantida em Configurações, usando
// uma senha padrão. As senhas reais seriam verificadas no servidor (BCrypt/
// Argon2). Toda a rastreabilidade (tentativas, bloqueio e logs) é mantida no
// localStorage.
// ---------------------------------------------------------------------------

/** Senha de demonstração aceita para qualquer usuário ativo. */
export const SENHA_DEMO = "Safra@2025";

export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_MS = 15 * 60 * 1000; // 15 minutos
export const SESSAO_MS = 30 * 60 * 1000; // 30 minutos de inatividade

const SESSAO_KEY = "safraviva:auth:sessao:v1";
const TENTATIVAS_KEY = "safraviva:auth:tentativas:v1";
const LOGS_KEY = "safraviva:auth:logs:v1";

export interface SessaoUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  perfilNome: string;
  loginEm: string;
}

export interface SessaoPersistida {
  usuario: SessaoUsuario;
  expiraEm: number;
  lembrar: boolean;
}

export interface LogAcesso {
  id: string;
  usuario: string;
  dataHora: string;
  ip: string;
  navegador: string;
  sistemaOperacional: string;
  resultado: "Sucesso" | "Falha";
}

export interface ResultadoAuth {
  ok: boolean;
  erro?: string;
  usuario?: SessaoUsuario;
  mfa?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// --------------------------------------------------------- política de senha
export const REQUISITOS_SENHA = [
  "Mínimo de 8 caracteres",
  "1 letra maiúscula",
  "1 letra minúscula",
  "1 número",
  "1 caractere especial",
];

export function validarSenha(senha: string): string[] {
  const erros: string[] = [];
  if (senha.length < 8) erros.push("Mínimo de 8 caracteres");
  if (!/[A-Z]/.test(senha)) erros.push("1 letra maiúscula");
  if (!/[a-z]/.test(senha)) erros.push("1 letra minúscula");
  if (!/[0-9]/.test(senha)) erros.push("1 número");
  if (!/[^A-Za-z0-9]/.test(senha)) erros.push("1 caractere especial");
  return erros;
}

// ------------------------------------------------------- ambiente de acesso
export function detectarAmbiente(): { navegador: string; sistemaOperacional: string } {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let navegador = "Desconhecido";
  if (/Edg\//.test(ua)) navegador = "Microsoft Edge";
  else if (/OPR\//.test(ua)) navegador = "Opera";
  else if (/Chrome\//.test(ua)) navegador = "Google Chrome";
  else if (/Firefox\//.test(ua)) navegador = "Mozilla Firefox";
  else if (/Safari\//.test(ua)) navegador = "Safari";

  let sistemaOperacional = "Desconhecido";
  if (/Windows/.test(ua)) sistemaOperacional = "Windows";
  else if (/Android/.test(ua)) sistemaOperacional = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) sistemaOperacional = "iOS";
  else if (/Mac OS X/.test(ua)) sistemaOperacional = "macOS";
  else if (/Linux/.test(ua)) sistemaOperacional = "Linux";

  return { navegador, sistemaOperacional };
}

// ------------------------------------------------------------ tentativas
interface TentativaInfo {
  contador: number;
  bloqueadoAte: number | null;
}

function lerTentativas(): Record<string, TentativaInfo> {
  try {
    const raw = localStorage.getItem(TENTATIVAS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TentativaInfo>) : {};
  } catch {
    return {};
  }
}

function salvarTentativas(dados: Record<string, TentativaInfo>) {
  try {
    localStorage.setItem(TENTATIVAS_KEY, JSON.stringify(dados));
  } catch {
    /* ignora */
  }
}

const chaveEmail = (email: string) => email.trim().toLowerCase();

/** Retorna os milissegundos restantes de bloqueio, ou null se não bloqueado. */
export function bloqueioRestanteMs(email: string): number | null {
  const dados = lerTentativas();
  const info = dados[chaveEmail(email)];
  if (!info?.bloqueadoAte) return null;
  const restante = info.bloqueadoAte - Date.now();
  if (restante <= 0) {
    delete dados[chaveEmail(email)];
    salvarTentativas(dados);
    return null;
  }
  return restante;
}

function registrarFalha(email: string): number {
  const dados = lerTentativas();
  const chave = chaveEmail(email);
  const info = dados[chave] ?? { contador: 0, bloqueadoAte: null };
  info.contador += 1;
  if (info.contador >= MAX_TENTATIVAS) {
    info.bloqueadoAte = Date.now() + BLOQUEIO_MS;
    info.contador = 0;
  }
  dados[chave] = info;
  salvarTentativas(dados);
  return info.bloqueadoAte ? 0 : MAX_TENTATIVAS - info.contador;
}

function limparTentativas(email: string) {
  const dados = lerTentativas();
  delete dados[chaveEmail(email)];
  salvarTentativas(dados);
}

// --------------------------------------------------------------- logs
export function lerLogs(): LogAcesso[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? (JSON.parse(raw) as LogAcesso[]) : [];
  } catch {
    return [];
  }
}

export function registrarLog(usuario: string, resultado: "Sucesso" | "Falha") {
  const { navegador, sistemaOperacional } = detectarAmbiente();
  const log: LogAcesso = {
    id: uid(),
    usuario,
    dataHora: new Date().toISOString(),
    ip: "192.168.0.10",
    navegador,
    sistemaOperacional,
    resultado,
  };
  try {
    const logs = [log, ...lerLogs()].slice(0, 200);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch {
    /* ignora */
  }
}

// --------------------------------------------------------------- sessão
export function salvarSessao(sessao: SessaoPersistida) {
  const valor = JSON.stringify(sessao);
  try {
    if (sessao.lembrar) {
      localStorage.setItem(SESSAO_KEY, valor);
      sessionStorage.removeItem(SESSAO_KEY);
    } else {
      sessionStorage.setItem(SESSAO_KEY, valor);
      localStorage.removeItem(SESSAO_KEY);
    }
  } catch {
    /* ignora */
  }
}

export function limparSessao() {
  try {
    localStorage.removeItem(SESSAO_KEY);
    sessionStorage.removeItem(SESSAO_KEY);
  } catch {
    /* ignora */
  }
}

export function restaurarSessao(): SessaoPersistida | null {
  try {
    const raw = localStorage.getItem(SESSAO_KEY) ?? sessionStorage.getItem(SESSAO_KEY);
    if (!raw) return null;
    const sessao = JSON.parse(raw) as SessaoPersistida;
    if (!sessao?.usuario || Date.now() > sessao.expiraEm) {
      limparSessao();
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

// ------------------------------------------------------- MFA (opcional)
export function mfaHabilitado(): boolean {
  try {
    return carregarEstado().seguranca.mfa === true;
  } catch {
    return false;
  }
}

export function gerarCodigoMfa(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// --------------------------------------------------------- autenticação
export function autenticar(email: string, senha: string): ResultadoAuth {
  const emailLimpo = email.trim();
  if (!emailLimpo || !senha) {
    return { ok: false, erro: "Informe e-mail e senha." };
  }

  const bloqueio = bloqueioRestanteMs(emailLimpo);
  if (bloqueio != null) {
    const minutos = Math.ceil(bloqueio / 60000);
    return {
      ok: false,
      erro: `Conta temporariamente bloqueada após várias tentativas. Tente novamente em ${minutos} minuto(s).`,
    };
  }

  const estado = carregarEstado();
  const usuario = estado.usuarios.find(
    (u) => u.email.trim().toLowerCase() === emailLimpo.toLowerCase()
  );
  const perfilNome = (id: string) =>
    estado.perfis.find((p) => p.id === id)?.nome ?? id;

  const credenciaisOk = usuario != null && senha === SENHA_DEMO;

  if (!credenciaisOk) {
    const restantes = registrarFalha(emailLimpo);
    registrarLog(emailLimpo, "Falha");
    if (restantes <= 0) {
      return {
        ok: false,
        erro: "Usuário ou senha inválidos. Conta bloqueada por 15 minutos após múltiplas tentativas.",
      };
    }
    return {
      ok: false,
      erro: `Usuário ou senha inválidos. Tentativa(s) restante(s): ${restantes}.`,
    };
  }

  if (usuario!.status !== "Ativo") {
    registrarLog(usuario!.email, "Falha");
    return {
      ok: false,
      erro: "Usuário inativo ou bloqueado. Procure o administrador do sistema.",
    };
  }

  limparTentativas(emailLimpo);
  const sessao: SessaoUsuario = {
    id: usuario!.id,
    nome: usuario!.nome,
    email: usuario!.email,
    perfil: usuario!.perfil,
    perfilNome: perfilNome(usuario!.perfil),
    loginEm: new Date().toISOString(),
  };

  return { ok: true, usuario: sessao, mfa: mfaHabilitado() };
}

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
