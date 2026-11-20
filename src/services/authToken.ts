// Token JWT emitido pelo backend. Ausente quando o backend está indisponível
// (modo demonstração): nesse caso as chamadas autenticadas não são enviadas.
const TOKEN_KEY = "safraviva:auth:token:v1";

export function lerToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function salvarToken(token: string, lembrar: boolean) {
  try {
    limparToken();
    (lembrar ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    /* ignora */
  }
}

export function limparToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignora */
  }
}
