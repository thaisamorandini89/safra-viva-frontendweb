interface GaugeProps {
  /** Percentual de 0 a 100 */
  percentual: number;
  tamanho?: number;
  espessura?: number;
  rotulo?: string;
  sublegenda?: string;
}

/** Medidor semicircular — usado para a taxa de ocupação da área */
export default function Gauge({
  percentual,
  tamanho = 200,
  espessura = 20,
  rotulo,
  sublegenda,
}: GaugeProps) {
  const pct = Math.max(0, Math.min(100, percentual));
  const raio = (tamanho - espessura) / 2;
  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const perimetro = Math.PI * raio; // meia volta

  const cor = pct >= 85 ? "#f97316" : pct >= 50 ? "#16a34a" : "#84cc16";

  const arcoBase = `M ${cx - raio} ${cy} A ${raio} ${raio} 0 0 1 ${cx + raio} ${cy}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={tamanho} height={tamanho / 2 + 10}>
        <path
          d={arcoBase}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={espessura}
          strokeLinecap="round"
        />
        <path
          d={arcoBase}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={perimetro}
          strokeDashoffset={perimetro * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-gray-800"
          fontSize={26}
          fontWeight={700}
        >
          {pct.toFixed(1)}%
        </text>
        {rotulo && (
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={11}
          >
            {rotulo}
          </text>
        )}
      </svg>
      {sublegenda && (
        <p className="text-xs text-gray-500 -mt-1 text-center">{sublegenda}</p>
      )}
    </div>
  );
}
