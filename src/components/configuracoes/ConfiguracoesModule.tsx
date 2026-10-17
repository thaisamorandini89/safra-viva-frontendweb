import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import Toast, { DadosToast } from "../ui/Toast";
import {
  ConfigContext,
  ConfiguracoesEstado,
  carregarEstado,
  salvarEstado,
  uid,
} from "./store";
import DashboardConfig from "./sections/DashboardConfig";
import PerfilEmpresa from "./sections/PerfilEmpresa";
import Usuarios from "./sections/Usuarios";
import PerfisPermissoes from "./sections/PerfisPermissoes";
import CadastrosAuxiliares from "./sections/CadastrosAuxiliares";
import ParametrosAgricolas from "./sections/ParametrosAgricolas";
import Notificacoes from "./sections/Notificacoes";
import Integracoes from "./sections/Integracoes";
import Seguranca from "./sections/Seguranca";
import Auditoria from "./sections/Auditoria";
import Backup from "./sections/Backup";

const MENU = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "empresa", icone: "🏢", label: "Perfil da Empresa" },
  { id: "usuarios", icone: "👥", label: "Usuários" },
  { id: "perfis", icone: "🛡️", label: "Perfis e Permissões" },
  { id: "cadastros", icone: "🗃️", label: "Cadastros Auxiliares" },
  { id: "parametros", icone: "🌾", label: "Parâmetros Agrícolas" },
  { id: "notificacoes", icone: "🔔", label: "Notificações" },
  { id: "integracoes", icone: "🔌", label: "Integrações" },
  { id: "seguranca", icone: "🔐", label: "Segurança" },
  { id: "auditoria", icone: "📋", label: "Auditoria" },
  { id: "backup", icone: "💾", label: "Backup" },
];

export default function ConfiguracoesModule() {
  const [estado, setEstado] = useState<ConfiguracoesEstado>(() => carregarEstado());
  const [secao, setSecao] = useState("dashboard");
  const [toast, setToast] = useState<DadosToast | null>(null);

  useEffect(() => {
    salvarEstado(estado);
  }, [estado]);

  const atualizar = useCallback(
    <K extends keyof ConfiguracoesEstado>(chave: K, valor: ConfiguracoesEstado[K]) => {
      setEstado((e) => ({ ...e, [chave]: valor }));
    },
    []
  );

  const notificar = useCallback((dados: DadosToast) => setToast(dados), []);

  const registrarLog = useCallback((acao: string, tela: string) => {
    setEstado((e) => ({
      ...e,
      auditoria: [
        {
          id: uid(),
          usuario: e.empresa.responsavelLegal || "Administrador",
          dataHora: new Date().toISOString(),
          tela,
          acao,
          ip: "192.168.0.10",
        },
        ...e.auditoria,
      ],
    }));
  }, []);

  const ctx = useMemo(
    () => ({ estado, atualizar, notificar, registrarLog }),
    [estado, atualizar, notificar, registrarLog]
  );

  const conteudo = () => {
    switch (secao) {
      case "dashboard": return <DashboardConfig onIr={setSecao} />;
      case "empresa": return <PerfilEmpresa />;
      case "usuarios": return <Usuarios />;
      case "perfis": return <PerfisPermissoes />;
      case "cadastros": return <CadastrosAuxiliares />;
      case "parametros": return <ParametrosAgricolas />;
      case "notificacoes": return <Notificacoes />;
      case "integracoes": return <Integracoes />;
      case "seguranca": return <Seguranca />;
      case "auditoria": return <Auditoria />;
      case "backup": return <Backup />;
      default: return <DashboardConfig onIr={setSecao} />;
    }
  };

  const itemAtual = MENU.find((m) => m.id === secao) ?? MENU[0];

  return (
    <ConfigContext.Provider value={ctx}>
      <div className="flex-1 overflow-auto bg-gray-50">
        {toast && <Toast {...toast} onFechar={() => setToast(null)} />}
        <TopBar breadcrumb="Gestão Agrícola" page={`Configurações › ${itemAtual.label}`} />

        <main className="px-5 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">
            <PageHeader
              title="Configurações"
              description="Administração geral, segurança e personalização da plataforma."
            />

            <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
              {/* Menu interno */}
              <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
                {MENU.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSecao(m.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition lg:w-full ${
                      m.id === secao
                        ? "bg-green-600 text-white"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    <span>{m.icone}</span>
                    <span className="whitespace-nowrap">{m.label}</span>
                  </button>
                ))}
              </nav>

              {/* Conteúdo da seção */}
              <div className="min-w-0">{conteudo()}</div>
            </div>
          </div>
        </main>
      </div>
    </ConfigContext.Provider>
  );
}
