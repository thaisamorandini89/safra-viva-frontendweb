import { lazy, Suspense, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import InicioModule from "./components/inicio/InicioModule";
import EmpresasModule from "./components/empresas/EmpresasModule";
import PropriedadesModule from "./components/propriedades/PropriedadesModule";
import TalhoesModule from "./components/talhoes/TalhoesModule";
import AtividadesModule from "./components/atividades/AtividadesModule";
import InsumosModule from "./components/insumos/InsumosModule";
import FinanceiroModule from "./components/financeiro/FinanceiroModule";
import { useAuth } from "./components/auth/AuthProvider";
import LoginPage from "./components/auth/LoginPage";

const RelatoriosModule = lazy(
  () => import("./components/relatorios/RelatoriosModule")
);
const ConfiguracoesModule = lazy(
  () => import("./components/configuracoes/ConfiguracoesModule")
);
const MapaModule = lazy(() => import("./components/mapa/MapaModule"));

const TABS = [
  { label: "Empresa Agrícola", icon: "🏢" },
  { label: "Propriedade", icon: "🌿" },
  { label: "Talhões", icon: "🗂️" },
  { label: "Atividades", icon: "🚜" },
  { label: "Insumos", icon: "📦" },
  { label: "Financeiro", icon: "💰" },
  { label: "Relatórios", icon: "📊" },
];

const INICIO_TAB = 7;
const CONFIG_TAB = 8;
const MAPA_TAB = 9;
const SEM_BARRA = [INICIO_TAB, CONFIG_TAB, MAPA_TAB];

export default function App() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState(INICIO_TAB);

  if (!usuario) return <LoginPage />;

  return (
    <div
      className="flex min-h-screen bg-gray-50"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <Sidebar activeTab={tab} onTabChange={setTab} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab switcher (ocultado na tela inicial e em configurações) */}
        {!SEM_BARRA.includes(tab) && (
          <div className="flex overflow-x-auto bg-white border-b border-gray-200 px-6 pt-3 print:hidden">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={`shrink-0 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                  ${tab === i
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === INICIO_TAB && <InicioModule onNavigate={setTab} />}
        {tab === 0 && <EmpresasModule />}
        {tab === 1 && <PropriedadesModule />}
        {tab === 2 && <TalhoesModule />}
        {tab === 3 && <AtividadesModule />}
        {tab === 4 && <InsumosModule />}
        {tab === 5 && <FinanceiroModule />}
        {tab === 6 && (
          <Suspense
            fallback={
              <div className="flex-1 p-10 text-center text-sm text-gray-400">
                Carregando relatórios...
              </div>
            }
          >
            <RelatoriosModule />
          </Suspense>
        )}
        {tab === CONFIG_TAB && (
          <Suspense
            fallback={
              <div className="flex-1 p-10 text-center text-sm text-gray-400">
                Carregando configurações...
              </div>
            }
          >
            <ConfiguracoesModule />
          </Suspense>
        )}
        {tab === MAPA_TAB && (
          <Suspense
            fallback={
              <div className="flex-1 p-10 text-center text-sm text-gray-400">
                Carregando mapa...
              </div>
            }
          >
            <MapaModule />
          </Suspense>
        )}
      </div>
    </div>
  );
}