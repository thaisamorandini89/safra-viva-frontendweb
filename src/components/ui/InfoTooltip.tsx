interface InfoTooltipProps {
  titulo: string;
  descricao: string;
}

/** Ícone de informação (ⓘ) com tooltip explicativo exibido ao passar o mouse. */
export default function InfoTooltip({ titulo, descricao }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <span
        role="img"
        aria-label={titulo}
        className="text-gray-400 text-xs cursor-help select-none hover:text-gray-600 transition-colors"
      >
        ⓘ
      </span>
      <span
        className="pointer-events-none absolute right-0 top-6 z-50 w-64 rounded-lg bg-gray-800 p-3 text-xs text-white shadow-lg opacity-0 invisible translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
      >
        <span className="block font-bold mb-1">{titulo}</span>
        <span className="block text-gray-200 leading-relaxed">{descricao}</span>
      </span>
    </span>
  );
}
