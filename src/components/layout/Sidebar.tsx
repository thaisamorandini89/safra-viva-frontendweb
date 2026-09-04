import Logo from "./Logo";

interface NavItem {
  icon: string;
  label: string;
  tab?: number;
}

const navItems: NavItem[] = [
  { icon: "🏠", label: "Início" },
  { icon: "🏢", label: "Empresas Agrícolas", tab: 0 },
  { icon: "🌿", label: "Propriedades", tab: 1 },
  { icon: "🗂️", label: "Talhões", tab: 2 },
  { icon: "🚜", label: "Atividades", tab: 3 },
  { icon: "💰", label: "Financeiro" },
  { icon: "📦", label: "Insumos", tab: 4 },
  { icon: "📊", label: "Relatórios" },
  { icon: "🗺️", label: "Mapa" },
  { icon: "⚙️", label: "Configurações" },
];

interface SidebarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-52 min-h-screen bg-green-900 flex flex-col py-4 shrink-0">
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
            KC
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-none">Karla Klemke</div>
            <div className="text-green-300 text-xs mt-0.5">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}