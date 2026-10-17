import { useAuth } from "../auth/AuthProvider";
import { iniciais } from "../auth/authStore";

export default function TopBar({ breadcrumb, page }) {
  const { usuario } = useAuth();
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white print:hidden">
      <div className="text-sm text-gray-500">
        <span className="text-gray-400">{breadcrumb}</span>
        <span className="mx-1 text-gray-300">›</span>
        <span className="font-semibold text-gray-700">{page}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>📅 {dataAtual}</span>
        <span className="relative">
          🔔
          <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </span>
        {usuario && (
          <div className="flex items-center gap-2">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-semibold text-gray-700">{usuario.nome}</div>
              <div className="text-xs text-gray-400">{usuario.perfilNome}</div>
            </div>
            <span className="w-8 h-8 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
              {iniciais(usuario.nome)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

