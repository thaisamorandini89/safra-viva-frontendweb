import { ReactNode } from "react";

export default function ChartCard({
  titulo,
  descricao,
  acoes,
  children,
  className = "",
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 min-w-0 overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">{titulo}</h3>
          {descricao && (
            <p className="text-xs text-gray-400 mt-0.5">{descricao}</p>
          )}
        </div>
        {acoes}
      </div>
      {children}
    </div>
  );
}
