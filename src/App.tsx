import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import EmpresaForm from "./components/forms/EmpresaForm";
import PropriedadeForm from "./components/forms/PropriedadeForm";
import TalhoesModule from "./components/talhoes/TalhoesModule";

const TABS = [
  { label: "Empresa Agrícola", icon: "🏢" },
  { label: "Propriedade", icon: "🌿" },
  { label: "Talhões", icon: "🗂️" },
];

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <div
      className="flex min-h-screen bg-gray-50"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <Sidebar activeTab={tab} onTabChange={setTab} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab switcher */}
        <div className="flex bg-white border-b border-gray-200 px-6 pt-3">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTab(i)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${tab === i
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 0 && <EmpresaForm />}
        {tab === 1 && <PropriedadeForm />}
        {tab === 2 && <TalhoesModule />}
      </div>
    </div>
  );
}