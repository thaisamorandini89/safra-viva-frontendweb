import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { REQUISITOS_SENHA, SENHA_DEMO, validarSenha } from "./authStore";

type Modo = "login" | "mfa" | "rec-solicitar" | "rec-enviado" | "rec-redefinir";

export default function LoginPage() {
  const { login, expirou, limparExpirou, mfaPendente, codigoMfaDemo, confirmarMfa, cancelarMfa } = useAuth();

  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // MFA
  const [codigo, setCodigo] = useState("");

  // Recuperação
  const [emailRec, setEmailRec] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [infoRec, setInfoRec] = useState("");

  const modoAtivo: Modo = mfaPendente ? "mfa" : modo;

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    limparExpirou();
    setCarregando(true);
    // pequena espera para simular a validação no servidor
    setTimeout(() => {
      const res = login(email, senha, lembrar);
      setCarregando(false);
      if (!res.ok) {
        setErro(res.erro ?? "Não foi possível entrar.");
        return;
      }
      if (res.mfa) {
        setCodigo("");
        setErro("");
      }
      // Em caso de sucesso sem MFA, o AuthProvider troca a tela automaticamente.
    }, 400);
  };

  const validarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const res = confirmarMfa(codigo);
    if (!res.ok) setErro(res.erro ?? "Código inválido.");
  };

  const solicitarRecuperacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRec.trim()) {
      setErro("Informe o e-mail cadastrado.");
      return;
    }
    setErro("");
    setModo("rec-enviado");
  };

  const redefinirSenha = (e: React.FormEvent) => {
    e.preventDefault();
    const erros = validarSenha(novaSenha);
    if (erros.length) {
      setErro("A senha não atende à política: " + erros.join(", ") + ".");
      return;
    }
    if (novaSenha !== confirmaSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    setErro("");
    setNovaSenha("");
    setConfirmaSenha("");
    setModo("login");
    setInfoRec("Senha alterada com sucesso! Faça login com a nova senha.");
  };

  const voltarLogin = () => {
    setErro("");
    setModo("login");
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-400";

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* ---------------------------------------------------- Área esquerda */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-green-700 to-green-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
            <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none">
              <circle cx="20" cy="20" r="18" fill="#166534" />
              <path d="M20 8 C14 14 10 20 14 26 C18 32 26 30 28 24 C30 18 26 12 20 8Z" fill="#4ade80" opacity="0.85" />
              <path d="M20 8 C26 14 30 20 26 26 C22 32 14 30 12 24 C10 18 14 12 20 8Z" fill="#86efac" opacity="0.6" />
              <circle cx="20" cy="22" r="4" fill="#fff" opacity="0.9" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold leading-none tracking-wide">SafraViva</p>
            <p className="mt-1 text-sm text-green-200">Gestão Agrícola & Pecuária</p>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Inteligência para o campo e pecuária
          </h1>
          <p className="mt-3 max-w-md text-sm text-green-100">
            Centralize propriedades, talhões, safras, atividades, insumos e finanças em uma única
            plataforma segura.
          </p>
        </div>

        {/* Ilustração agrícola */}
        <svg viewBox="0 0 500 160" className="pointer-events-none absolute bottom-0 left-0 w-full opacity-90" preserveAspectRatio="none">
          <circle cx="410" cy="48" r="26" fill="#fde68a" opacity="0.9" />
          <path d="M0 110 Q125 70 250 105 T500 95 V160 H0 Z" fill="#15803d" opacity="0.7" />
          <path d="M0 135 Q150 100 300 130 T500 125 V160 H0 Z" fill="#166534" />
          <g stroke="#86efac" strokeWidth="3" opacity="0.8">
            <line x1="60" y1="150" x2="60" y2="120" />
            <line x1="80" y1="150" x2="80" y2="118" />
            <line x1="100" y1="150" x2="100" y2="122" />
          </g>
        </svg>
      </div>

      {/* ----------------------------------------------------- Área direita */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700">
              <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none">
                <circle cx="20" cy="20" r="18" fill="#166534" />
                <path d="M20 8 C14 14 10 20 14 26 C18 32 26 30 28 24 C30 18 26 12 20 8Z" fill="#4ade80" opacity="0.8" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-800">SafraViva</span>
          </div>

          {expirou && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⏱️ Sua sessão expirou por inatividade. Entre novamente para continuar.
            </div>
          )}
          {infoRec && modoAtivo === "login" && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
              ✅ {infoRec}
            </div>
          )}

          {/* ------------------------------------------------- Login */}
          {modoAtivo === "login" && (
            <>
              <h2 className="text-2xl font-bold text-gray-800">Bem-vindo de volta</h2>
              <p className="mt-1 text-sm text-gray-500">Acesse sua conta para continuar.</p>

              <form onSubmit={entrar} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com.br"
                    className={inputCls}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Senha *</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-10`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-600"
                      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {mostrarSenha ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={lembrar}
                      onChange={(e) => setLembrar(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-400"
                    />
                    Lembrar meu acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => { setErro(""); setInfoRec(""); setEmailRec(email); setModo("rec-solicitar"); }}
                    className="text-sm font-semibold text-green-700 hover:text-green-900"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
                >
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
                <p className="font-semibold text-gray-600">Acesso de demonstração</p>
                <p className="mt-0.5">E-mail: <span className="font-mono">karla@safraviva.com.br</span></p>
                <p>Senha: <span className="font-mono">{SENHA_DEMO}</span></p>
              </div>

              <p className="mt-6 text-center text-xs text-gray-400">
                Precisa de ajuda?{" "}
                <a href="mailto:suporte@safraviva.com.br" className="font-semibold text-green-700 hover:text-green-900">
                  Suporte Técnico
                </a>
              </p>
            </>
          )}

          {/* --------------------------------------------------- MFA */}
          {modoAtivo === "mfa" && (
            <>
              <h2 className="text-2xl font-bold text-gray-800">Verificação em duas etapas</h2>
              <p className="mt-1 text-sm text-gray-500">
                Enviamos um código de verificação. Informe-o para concluir o acesso.
              </p>
              {codigoMfaDemo && (
                <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                  🔐 Código enviado (demonstração): <span className="font-mono font-bold">{codigoMfaDemo}</span>
                </div>
              )}
              <form onSubmit={validarCodigo} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Código de verificação</label>
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    className={`${inputCls} text-center text-lg tracking-[0.5em]`}
                  />
                </div>
                {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
                <button type="submit" className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800">
                  Validar código
                </button>
                <button
                  type="button"
                  onClick={() => { cancelarMfa(); setErro(""); }}
                  className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  ← Voltar
                </button>
              </form>
            </>
          )}

          {/* ------------------------------------- Recuperação (solicitar) */}
          {modoAtivo === "rec-solicitar" && (
            <>
              <h2 className="text-2xl font-bold text-gray-800">Recuperar senha</h2>
              <p className="mt-1 text-sm text-gray-500">
                Informe seu e-mail cadastrado e enviaremos um link seguro de redefinição.
              </p>
              <form onSubmit={solicitarRecuperacao} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">E-mail cadastrado</label>
                  <input type="email" value={emailRec} onChange={(e) => setEmailRec(e.target.value)} placeholder="seu@email.com.br" className={inputCls} />
                </div>
                {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
                <button type="submit" className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800">
                  Enviar link
                </button>
                <button type="button" onClick={voltarLogin} className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-700">
                  ← Voltar ao login
                </button>
              </form>
            </>
          )}

          {/* ------------------------------------- Recuperação (enviado) */}
          {modoAtivo === "rec-enviado" && (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">📧</div>
              <h2 className="mt-4 text-2xl font-bold text-gray-800">Link enviado</h2>
              <p className="mt-2 text-sm text-gray-500">
                Um link de recuperação foi enviado para <strong className="text-gray-700">{emailRec}</strong>.
                O link possui prazo de expiração por segurança.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => { setErro(""); setModo("rec-redefinir"); }}
                  className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  Já recebi o link — redefinir senha
                </button>
                <button onClick={voltarLogin} className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-700">
                  ← Voltar ao login
                </button>
              </div>
            </>
          )}

          {/* ------------------------------------- Recuperação (redefinir) */}
          {modoAtivo === "rec-redefinir" && (
            <>
              <h2 className="text-2xl font-bold text-gray-800">Redefinir senha</h2>
              <p className="mt-1 text-sm text-gray-500">Crie uma nova senha segura para sua conta.</p>
              <form onSubmit={redefinirSenha} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Nova senha</label>
                  <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="••••••••" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Confirmar senha</label>
                  <input type="password" value={confirmaSenha} onChange={(e) => setConfirmaSenha(e.target.value)} placeholder="••••••••" className={inputCls} />
                </div>
                <ul className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  <li className="font-semibold text-gray-600">A senha deve conter:</li>
                  {REQUISITOS_SENHA.map((r) => (
                    <li key={r} className="flex items-center gap-1.5">
                      <span>{!validarSenha(novaSenha).includes(r) && novaSenha ? "✅" : "•"}</span>
                      {r}
                    </li>
                  ))}
                </ul>
                {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
                <button type="submit" className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800">
                  Alterar senha
                </button>
                <button type="button" onClick={voltarLogin} className="w-full text-center text-sm font-semibold text-gray-500 hover:text-gray-700">
                  ← Voltar ao login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
