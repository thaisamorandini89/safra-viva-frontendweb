import { ReactNode } from "react";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Estilo do botão de confirmação */
  tipo?: "perigo" | "padrao";
  onConfirmar: () => void;
  onCancelar: () => void;
}

/** Modal de confirmação reutilizável (substitui o window.confirm nativo). */
export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  tipo = "padrao",
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  if (!aberto) return null;

  const perigo = tipo === "perigo";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-xl ${
                perigo ? "bg-red-100 text-red-600" : "bg-sky-100 text-sky-600"
              }`}
            >
              {perigo ? "🗑️" : "❓"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800">{titulo}</h3>
              <div className="text-sm text-gray-500 mt-1">{mensagem}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
              perigo
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
