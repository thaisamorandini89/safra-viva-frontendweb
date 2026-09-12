import { useState } from "react";

export interface SerieLinha {
  nome: string;
  cor: string;
  pontos: { x: string; y: number }[];
}

interface LineChartProps {
  series: SerieLinha[];
  /** Eixo X compartilhado (ex.: safras) */
  categorias: string[];
  sufixo?: string;
  altura?: number;
}

/** Gráfico de linhas com área suave — evolução de produtividade por talhão */
export default function LineChart({
  series,
  categorias,
  sufixo = "",
  altura = 240,
}: LineChartProps) {
  const [foco, setFoco] = useState<string | null>(null);
  const [indiceHover, setIndiceHover] = useState<number | null>(null);

  const largura = 640;
  const padEsq = 44;
  const padDir = 16;
  const padTopo = 16;
  const padBase = 30;

  const valores = series.flatMap((s) => s.pontos.map((p) => p.y));
  const maxBruto = Math.max(...valores, 1);
  const max = Math.ceil(maxBruto * 1.15);
  const linhasGrade = 4;

  if (!categorias.length || !series.length)
    return (
      <p className="text-sm text-gray-400 py-10 text-center">
        Sem histórico de produtividade registrado
      </p>
    );

  const passoX =
    categorias.length > 1
      ? (largura - padEsq - padDir) / (categorias.length - 1)
      : 0;

  const px = (i: number) =>
    categorias.length > 1 ? padEsq + i * passoX : largura / 2;
  const py = (v: number) =>
    padTopo + (1 - v / max) * (altura - padTopo - padBase);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        className="w-full"
        style={{ height: altura }}
        onMouseLeave={() => setIndiceHover(null)}
      >
        <defs>
          {series.map((s, si) => (
            <linearGradient
              key={`${s.nome}-${si}`}
              id={`grad-${s.nome.replace(/\W/g, "")}-${si}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.cor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.cor} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grade horizontal + eixo Y */}
        {Array.from({ length: linhasGrade + 1 }).map((_, i) => {
          const valor = (max / linhasGrade) * i;
          const y = py(valor);
          return (
            <g key={i}>
              <line
                x1={padEsq}
                x2={largura - padDir}
                y1={y}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={padEsq - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400"
                fontSize={10}
              >
                {Math.round(valor)}
              </text>
            </g>
          );
        })}

        {/* Guia vertical do hover */}
        {indiceHover != null && (
          <line
            x1={px(indiceHover)}
            x2={px(indiceHover)}
            y1={padTopo}
            y2={altura - padBase}
            stroke="#cbd5e1"
            strokeDasharray="4 4"
          />
        )}

        {/* Séries */}
        {series.map((s, si) => {
          const pts = categorias
            .map((c, i) => {
              const p = s.pontos.find((pp) => pp.x === c);
              return p ? { x: px(i), y: py(p.y), v: p.y } : null;
            })
            .filter(Boolean) as { x: number; y: number; v: number }[];

          if (!pts.length) return null;
          const linha = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
          const area = `${linha} L ${pts[pts.length - 1].x} ${altura - padBase} L ${pts[0].x} ${altura - padBase} Z`;
          const apagado = foco != null && foco !== s.nome;

          return (
            <g key={`${s.nome}-${si}`} opacity={apagado ? 0.15 : 1} className="transition-opacity">
              <path d={area} fill={`url(#grad-${s.nome.replace(/\W/g, "")}-${si})`} />
              <path
                d={linha}
                fill="none"
                stroke={s.cor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={indiceHover === i ? 5.5 : 3.5}
                  fill="#fff"
                  stroke={s.cor}
                  strokeWidth={2.5}
                  className="transition-all"
                />
              ))}
            </g>
          );
        })}

        {/* Eixo X + áreas sensíveis ao mouse */}
        {categorias.map((c, i) => (
          <g key={c}>
            <text
              x={px(i)}
              y={altura - 10}
              textAnchor="middle"
              fontSize={10}
              className="fill-gray-500"
            >
              {c}
            </text>
            <rect
              x={px(i) - passoX / 2}
              y={0}
              width={passoX || largura}
              height={altura - padBase}
              fill="transparent"
              onMouseEnter={() => setIndiceHover(i)}
            />
          </g>
        ))}
      </svg>

      {/* Legenda / tooltip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1">
        {series.map((s) => {
          const ponto =
            indiceHover != null
              ? s.pontos.find((p) => p.x === categorias[indiceHover])
              : undefined;
          return (
            <button
              key={s.nome}
              type="button"
              onMouseEnter={() => setFoco(s.nome)}
              onMouseLeave={() => setFoco(null)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.cor }}
              />
              {s.nome}
              {ponto && (
                <span className="font-semibold text-gray-800 tabular-nums">
                  · {ponto.y.toLocaleString("pt-BR")}
                  {sufixo}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
