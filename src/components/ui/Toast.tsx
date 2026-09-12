import { useEffect, useState } from "react";

export interface DadosToast {
  tipo: "sucesso" | "erro";
  titulo: string;
  descricao?: string;
}

interface ToastProps extends DadosToast {
  onFechar: () => void;
  /** Tempo em ms até fechar automaticamente */
  duracao?: number;
}

/** Notificação flutuante (canto superior direito) com auto-dispensa e animação de entrada. */
export default function Toast({
  tipo,
  titulo,
  descricao,
  onFechar,
  duracao = 4000,
}: ToastProps) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Dispara a animação de entrada no próximo frame
    const entrada = requestAnimationFrame(() => setVisivel(true));
    const saida = setTimeout(() => {
      setVisivel(false);
      // Aguarda a transição de saída antes de desmontar
      setTimeout(onFechar, 250);
    }, duracao);
    return () => {
      cancelAnimationFrame(entrada);
      clearTimeout(saida);
    };
  }, [duracao, onFechar]);

  const sucesso = tipo === "sucesso";

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`flex items-start gap-3 w-80 rounded-xl border bg-white shadow-lg p-4 transition-all duration-300 ${
          visivel ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
        } ${sucesso ? "border-green-200" : "border-red-200"}`}
      >
        <div
          className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg ${
            sucesso ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {sucesso ? "✅" : "⚠️"}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${sucesso ? "text-green-800" : "text-red-700"}`}>
            {titulo}
          </p>
          {descricao && <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setVisivel(false);
            setTimeout(onFechar, 250);
          }}
          className="text-gray-300 hover:text-gray-500 transition text-sm leading-none"
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
