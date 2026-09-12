import { StatusAtividade, STATUS_ATIVIDADE_META } from "../../types/atividade";

export default function AtividadeStatusBadge({
  status,
  atrasada = false,
  tamanho = "md",
}: {
  status: StatusAtividade;
  atrasada?: boolean;
  tamanho?: "sm" | "md";
}) {
  const meta = STATUS_ATIVIDADE_META[status] ?? STATUS_ATIVIDADE_META.Planejada;
  const escala = tamanho === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${meta.badge} ${escala}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {status}
      </span>
      {atrasada && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap bg-red-50 text-red-600 border-red-200 ${escala}`}
        >
          ⚠️ Atrasada
        </span>
      )}
    </span>
  );
}
