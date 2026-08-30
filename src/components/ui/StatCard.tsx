import { ReactNode } from "react";

interface StatCardProps {
  icone: ReactNode;
  titulo: string;
  valor: string;
  sufixo?: string;
  descricao?: string;
  /** Cor de acento em classes tailwind, ex.: "green" | "sky" | "amber" */
  tom?: "green" | "sky" | "amber" | "orange" | "slate" | "lime";
  /** Variação percentual em relação ao período anterior */
  tendencia?: number;
}

const TONS: Record<string, { bg: string; text: string; ring: string }> = {
  green: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-100" },
  sky: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-100" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  lime: { bg: "bg-lime-50", text: "text-lime-700", ring: "ring-lime-100" },
};

export default function StatCard({
  icone,
  titulo,
  valor,
  sufixo,
  descricao,
  tom = "green",
  tendencia,
}: StatCardProps) {
  const t = TONS[tom] ?? TONS.green;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-lg ${t.bg} ${t.text} ring-4 ${t.ring} flex items-center justify-center text-lg`}
        >
          {icone}
        </div>
        {tendencia != null && (
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
              tendencia >= 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {tendencia >= 0 ? "▲" : "▼"} {Math.abs(tendencia).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mt-3">
        {titulo}
      </p>
      <p className="text-2xl font-bold text-gray-800 leading-tight mt-0.5">
        {valor}
        {sufixo && (
          <span className="text-sm font-semibold text-gray-400 ml-1">{sufixo}</span>
        )}
      </p>
      {descricao && <p className="text-xs text-gray-400 mt-1">{descricao}</p>}
    </div>
  );
}
