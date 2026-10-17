import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  autenticar,
  gerarCodigoMfa,
  limparSessao,
  ResultadoAuth,
  restaurarSessao,
  registrarLog,
  salvarSessao,
  SessaoUsuario,
  SESSAO_MS,
} from "./authStore";

interface PendenteMfa {
  usuario: SessaoUsuario;
  lembrar: boolean;
  codigo: string;
}

interface AuthContextValue {
  usuario: SessaoUsuario | null;
  expirou: boolean;
  limparExpirou: () => void;
  login: (email: string, senha: string, lembrar: boolean) => ResultadoAuth;
  mfaPendente: boolean;
  codigoMfaDemo: string | null;
  confirmarMfa: (codigo: string) => { ok: boolean; erro?: string };
  cancelarMfa: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const inicial = restaurarSessao();
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(inicial?.usuario ?? null);
  const [expirou, setExpirou] = useState(false);
  const [pendente, setPendente] = useState<PendenteMfa | null>(null);

  const expiraEm = useRef<number>(inicial?.expiraEm ?? 0);
  const lembrar = useRef<boolean>(inicial?.lembrar ?? false);
  const ultimaPersistencia = useRef<number>(0);

  const finalizar = useCallback((u: SessaoUsuario, lembrarAcesso: boolean) => {
    expiraEm.current = Date.now() + SESSAO_MS;
    lembrar.current = lembrarAcesso;
    salvarSessao({ usuario: u, expiraEm: expiraEm.current, lembrar: lembrarAcesso });
    registrarLog(u.email, "Sucesso");
    setExpirou(false);
    setUsuario(u);
  }, []);

  const login = useCallback(
    (email: string, senha: string, lembrarAcesso: boolean): ResultadoAuth => {
      const res = autenticar(email, senha);
      if (!res.ok || !res.usuario) return res;
      if (res.mfa) {
        setPendente({ usuario: res.usuario, lembrar: lembrarAcesso, codigo: gerarCodigoMfa() });
        return res;
      }
      finalizar(res.usuario, lembrarAcesso);
      return res;
    },
    [finalizar]
  );

  const confirmarMfa = useCallback(
    (codigo: string): { ok: boolean; erro?: string } => {
      if (!pendente) return { ok: false, erro: "Nenhuma verificação pendente." };
      if (codigo.trim() !== pendente.codigo) {
        return { ok: false, erro: "Código de verificação inválido." };
      }
      finalizar(pendente.usuario, pendente.lembrar);
      setPendente(null);
      return { ok: true };
    },
    [pendente, finalizar]
  );

  const cancelarMfa = useCallback(() => setPendente(null), []);

  const logout = useCallback(() => {
    if (usuario) registrarLog(usuario.email, "Sucesso");
    limparSessao();
    setPendente(null);
    setUsuario(null);
  }, [usuario]);

  const limparExpirou = useCallback(() => setExpirou(false), []);

  // Controle de sessão: expiração por inatividade + logout automático.
  useEffect(() => {
    if (!usuario) return;

    const registrarAtividade = () => {
      expiraEm.current = Date.now() + SESSAO_MS;
      const agora = Date.now();
      if (agora - ultimaPersistencia.current > 60000) {
        ultimaPersistencia.current = agora;
        salvarSessao({ usuario, expiraEm: expiraEm.current, lembrar: lembrar.current });
      }
    };

    const eventos: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, registrarAtividade, { passive: true }));

    const intervalo = window.setInterval(() => {
      if (Date.now() > expiraEm.current) {
        limparSessao();
        setUsuario(null);
        setExpirou(true);
      }
    }, 15000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, registrarAtividade));
      window.clearInterval(intervalo);
    };
  }, [usuario]);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        expirou,
        limparExpirou,
        login,
        mfaPendente: pendente != null,
        codigoMfaDemo: pendente?.codigo ?? null,
        confirmarMfa,
        cancelarMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
