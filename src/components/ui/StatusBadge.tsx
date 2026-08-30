import { StatusTalhao, STATUS_META } from "../../types/talhao";

export default function StatusBadge({
  status,
  tamanho = "md",
}: {
  status: StatusTalhao;
  tamanho?: "sm" | "md";
}) {
  const meta = STATUS_META[status] ?? STATUS_META.Livre;
  const escala =
    tamanho === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${meta.badge} ${escala}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}
