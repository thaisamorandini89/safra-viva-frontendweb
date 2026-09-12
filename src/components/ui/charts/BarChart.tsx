import { useState } from "react";

export interface BarraDado {
  label: string;
  valor: number;
  /** Valor de referência (ex.: área total) para a barra "fantasma" ao fundo */
  total?: number;
  cor?: string;
  detalhe?: string;
}

interface BarChartProps {
  dados: BarraDado[];
  /** Sufixo exibido junto ao valor (ex.: " ha") */
  sufixo?: string;
  cor?: string;
  formatarValor?: (v: number) => string;
  /** Exibe o percentual valor/total ao lado */
  mostrarPercentual?: boolean;
  altura?: number;
}

/** Gráfico de barras horizontais — ideal para ranking/ocupação por talhão */
export default function BarChart({
  dados,
  sufixo = "",
  cor = "#16a34a",
  formatarValor,
  mostrarPercentual = false,
}: BarChartProps) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const fmt = formatarValor ?? ((v: number) => v.toLocaleString("pt-BR"));
  const maximo = Math.max(...dados.map((d) => d.total ?? d.valor), 1);

  if (!dados.length)
    return <p className="text-sm text-gray-400 py-8 text-center">Sem dados para exibir</p>;

  return (
    <ul className="space-y-3">
      {dados.map((d, i) => {
        const larguraValor = (d.valor / maximo) * 100;
        const larguraTotal = ((d.total ?? d.valor) / maximo) * 100;
        const pct = d.total ? (d.valor / d.total) * 100 : 0;
        return (
          <li
            key={`${d.label}-${i}`}
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
            className="group"
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600 truncate pr-2">
                {d.label}
              </span>
              <span className="text-xs text-gray-500 tabular-nums shrink-0">
                {fmt(d.valor)}
                {sufixo}
                {mostrarPercentual && d.total ? (
                  <span className="text-gray-400"> · {pct.toFixed(0)}%</span>
                ) : null}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
              {d.total != null && (
                <div
                  className="absolute inset-y-0 left-0 bg-gray-200"
                  style={{ width: `${larguraTotal}%` }}
                />
              )}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${larguraValor}%`,
                  backgroundColor: d.cor ?? cor,
                  opacity: ativo == null || ativo === i ? 1 : 0.45,
                }}
              />
            </div>
            {d.detalhe && (
              <p className="text-[11px] text-gray-400 mt-0.5">{d.detalhe}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
