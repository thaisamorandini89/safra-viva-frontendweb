import { useEffect, useState } from "react";

export interface DadosToast {
  tipo: "sucesso" | "erro" | "aviso";
  titulo: string;
  descricao?: string;
  /** Tempo em ms até fechar automaticamente */
  duracao?: number;
}

interface ToastProps extends DadosToast {
  onFechar: () => void;
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

  const estilo = {
    sucesso: { borda: "border-green-200", icone: "bg-green-100 text-green-700", titulo: "text-green-800", simbolo: "✅" },
    erro: { borda: "border-red-200", icone: "bg-red-100 text-red-600", titulo: "text-red-700", simbolo: "⚠️" },
    aviso: { borda: "border-amber-200", icone: "bg-amber-100 text-amber-700", titulo: "text-amber-800", simbolo: "⚠️" },
  }[tipo];

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`flex items-start gap-3 w-80 rounded-xl border bg-white shadow-lg p-4 transition-all duration-300 ${
          visivel ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
        } ${estilo.borda}`}
      >
        <div
          className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg ${
            estilo.icone
          }`}
        >
          {estilo.simbolo}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${estilo.titulo}`}>
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
