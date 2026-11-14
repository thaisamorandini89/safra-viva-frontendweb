import Logo from "./Logo";
import { useAuth } from "../auth/AuthProvider";
import { iniciais } from "../auth/authStore";

interface NavItem {
  icon: string;
  label: string;
  tab?: number;
}

const navItems: NavItem[] = [
  { icon: "🏠", label: "Início", tab: 7 },
  { icon: "🏢", label: "Empresas Agrícolas", tab: 0 },
  { icon: "🌿", label: "Propriedades", tab: 1 },
  { icon: "🗂️", label: "Talhões", tab: 2 },
  { icon: "🚜", label: "Atividades", tab: 3 },
  { icon: "📦", label: "Insumos", tab: 4 },
  { icon: "💰", label: "Financeiro", tab: 5 },
  { icon: "📊", label: "Relatórios", tab: 6 },
  { icon: "🗺️", label: "Mapa", tab: 9 },
  { icon: "⚙️", label: "Configurações", tab: 8 },
];

interface SidebarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { usuario, logout } = useAuth();

  return (
    <aside className="w-52 min-h-screen bg-green-900 flex flex-col py-4 shrink-0 print:hidden">
      <div className="px-4 mb-8">
        <Logo />
      </div>

      <nav className="flex-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.tab !== undefined && onTabChange(item.tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors
              ${item.tab === activeTab
                ? "bg-green-600 text-white"
                : "text-green-200 hover:bg-green-800 hover:text-white"}`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 mt-4 pt-4 border-t border-green-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
            {usuario ? iniciais(usuario.nome) : "–"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-semibold leading-none truncate">
              {usuario?.nome ?? "Visitante"}
            </div>
            <div className="text-green-300 text-xs mt-0.5 truncate">
              {usuario?.perfilNome ?? "—"}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-green-700 px-3 py-2 text-xs font-semibold text-green-200 transition-colors hover:bg-green-800 hover:text-white"
        >
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}