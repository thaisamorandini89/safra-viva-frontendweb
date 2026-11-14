import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { iniciais } from "../auth/authStore";
import { useNotificacoes } from "./useNotificacoes";

export default function TopBar({ breadcrumb, page }) {
  const { usuario } = useAuth();
  const { itens, total } = useNotificacoes();
  const [aberto, setAberto] = useState(false);

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const badge = total > 9 ? "9+" : String(total);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white print:hidden">
      <div className="text-sm text-gray-500">
        <span className="text-gray-400">{breadcrumb}</span>
        <span className="mx-1 text-gray-300">›</span>
        <span className="font-semibold text-gray-700">{page}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>📅 {dataAtual}</span>

        {/* Notificações */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
            aria-label="Notificações"
          >
            🔔
            {total > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>

          {aberto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
              <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl z-50 flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-800">Notificações</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {total}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  {total === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-gray-400">
                      ✅ Nenhuma notificação no momento.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {itens.map((n) => (
                        <li
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 border-l-4 ${
                            n.severidade === "alta" ? "border-red-400" : "border-amber-400"
                          }`}
                        >
                          <span className="text-base leading-none mt-0.5">{n.icone}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-700 leading-tight">{n.titulo}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.descricao}</p>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">{n.grupo}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-gray-100 px-4 py-2 text-center text-[11px] text-gray-400">
                  Ajuste os alertas em Configurações › Notificações
                </div>
              </div>
            </>
          )}
        </div>

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

