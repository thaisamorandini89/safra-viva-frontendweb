import { useState } from "react";

export interface FatiaPizza {
  label: string;
  valor: number;
  cor: string;
}

interface DonutChartProps {
  dados: FatiaPizza[];
  /** Rótulo exibido no centro (ex.: "Talhões") */
  legendaCentro?: string;
  /** Valor exibido no centro. Se omitido, usa a soma dos valores. */
  valorCentro?: string;
  tamanho?: number;
  espessura?: number;
  /** Formata o valor exibido na legenda */
  formatarValor?: (v: number) => string;
  /** Renderiza como pizza cheia em vez de rosca */
  pizza?: boolean;
}

const TAU = Math.PI * 2;

function coordenada(cx: number, cy: number, raio: number, angulo: number) {
  return [cx + raio * Math.cos(angulo), cy + raio * Math.sin(angulo)];
}

/** Desenha um setor de anel (ou de pizza quando raioInterno = 0) */
function arco(
  cx: number,
  cy: number,
  raioExterno: number,
  raioInterno: number,
  inicio: number,
  fim: number
) {
  const grande = fim - inicio > Math.PI ? 1 : 0;
  const [x1, y1] = coordenada(cx, cy, raioExterno, inicio);
  const [x2, y2] = coordenada(cx, cy, raioExterno, fim);

  if (raioInterno <= 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${raioExterno} ${raioExterno} 0 ${grande} 1 ${x2} ${y2} Z`;
  }

  const [x3, y3] = coordenada(cx, cy, raioInterno, fim);
  const [x4, y4] = coordenada(cx, cy, raioInterno, inicio);
  return [
    `M ${x1} ${y1}`,
    `A ${raioExterno} ${raioExterno} 0 ${grande} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${raioInterno} ${raioInterno} 0 ${grande} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

export default function DonutChart({
  dados,
  legendaCentro = "Total",
  valorCentro,
  tamanho = 200,
  espessura = 34,
  formatarValor,
  pizza = false,
}: DonutChartProps) {
  const [ativo, setAtivo] = useState<number | null>(null);

  const visiveis = dados.filter((d) => d.valor > 0);
  const total = visiveis.reduce((s, d) => s + d.valor, 0);

  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const raioExterno = tamanho / 2 - 6;
  const raioInterno = pizza ? 0 : raioExterno - espessura;

  const fmt = formatarValor ?? ((v: number) => String(v));

  if (!total) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ height: tamanho }}
      >
        Sem dados para exibir
      </div>
    );
  }

  let anguloAtual = -Math.PI / 2; // começa no topo
  const fatias = visiveis.map((d, i) => {
    const fatia = (d.valor / total) * TAU;
    const inicio = anguloAtual;
    const fim = anguloAtual + fatia;
    anguloAtual = fim;
    return { ...d, inicio, fim, indice: i, percentual: (d.valor / total) * 100 };
  });

  const destaque = ativo != null ? fatias[ativo] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 w-full min-w-0">
      <div
        className="relative shrink-0 mx-auto sm:mx-0"
        style={{ width: tamanho, height: tamanho }}
      >
        <svg width={tamanho} height={tamanho} className="overflow-visible">
          {fatias.map((f) => {
            const emDestaque = ativo === f.indice;
            const meio = (f.inicio + f.fim) / 2;
            const deslocamento = emDestaque ? 6 : 0;
            const dx = Math.cos(meio) * deslocamento;
            const dy = Math.sin(meio) * deslocamento;
            return (
              <path
                key={f.label}
                d={arco(cx, cy, raioExterno, raioInterno, f.inicio, f.fim)}
                fill={f.cor}
                transform={`translate(${dx} ${dy})`}
                className="transition-all duration-200 cursor-pointer"
                opacity={ativo == null || emDestaque ? 1 : 0.35}
                stroke="#fff"
                strokeWidth={2}
                onMouseEnter={() => setAtivo(f.indice)}
                onMouseLeave={() => setAtivo(null)}
              />
            );
          })}
        </svg>

        {!pizza && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-[22%]">
            <span className="text-xl font-bold text-gray-800 leading-none">
              {destaque
                ? `${destaque.percentual.toFixed(1)}%`
                : valorCentro ?? fmt(total)}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-gray-400 mt-1 text-center leading-tight line-clamp-2">
              {destaque ? destaque.label : legendaCentro}
            </span>
          </div>
        )}
      </div>

      <ul className="flex-1 w-full min-w-0 space-y-1">
        {fatias.map((f) => (
          <li
            key={f.label}
            onMouseEnter={() => setAtivo(f.indice)}
            onMouseLeave={() => setAtivo(null)}
            className={`flex items-center gap-2 text-sm rounded-md px-1.5 py-1 cursor-pointer transition min-w-0
              ${ativo === f.indice ? "bg-gray-50" : ""}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: f.cor }}
            />
            <span className="text-gray-600 truncate flex-1 min-w-0" title={f.label}>
              {f.label}
            </span>
            <span className="font-semibold text-gray-800 tabular-nums shrink-0 text-right">
              {fmt(f.valor)}
            </span>
            <span className="text-xs text-gray-400 tabular-nums shrink-0 w-11 text-right">
              {f.percentual.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
