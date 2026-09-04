import { Insumo, SITUACAO_ESTOQUE_META, situacaoEstoque } from "../../types/insumo";

export default function InsumoStatusBadge({
  insumo,
  vencido = false,
  proximoVencimento = false,
  tamanho = "md",
}: {
  insumo: Insumo;
  vencido?: boolean;
  proximoVencimento?: boolean;
  tamanho?: "sm" | "md";
}) {
  const situacao = situacaoEstoque(insumo);
  const meta = SITUACAO_ESTOQUE_META[situacao];
  const escala = tamanho === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${meta.badge} ${escala}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {situacao === "Normal" ? "Em estoque" : `Estoque ${situacao}`}
      </span>

      {vencido && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap bg-red-50 text-red-600 border-red-200 ${escala}`}
        >
          ⛔ Vencido
        </span>
      )}

      {!vencido && proximoVencimento && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200 ${escala}`}
        >
          ⏰ A vencer
        </span>
      )}

      {insumo.status === "Inativo" && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap bg-gray-100 text-gray-500 border-gray-200 ${escala}`}
        >
          Inativo
        </span>
      )}
    </span>
  );
}
