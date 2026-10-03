import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIndicadores, getLancamentos } from "../../services/api";
import {
  AgruparPor,
  IndicadorFinanceiro,
  Lancamento,
  fmtMoeda,
  fmtMoedaCurta,
  fmtPct,
  chaveMes,
  labelMes,
} from "../../types/financeiro";
import ChartCard from "../ui/ChartCard";
import BarChart from "../ui/charts/BarChart";
import LineChart from "../ui/charts/LineChart";

const OPCOES: { id: AgruparPor; label: string }[] = [
  { id: "safra", label: "Por Safra" },
  { id: "talhao", label: "Por Talhão" },
  { id: "cultura", label: "Por Cultura" },
];

export default function FinanceiroRelatorios() {
  const [agruparPor, setAgruparPor] = useState<AgruparPor>("safra");

  const {
    data: indicadores = [],
    isLoading,
    isError,
  } = useQuery<IndicadorFinanceiro[]>({
    queryKey: ["financeiro-indicadores", agruparPor],
    queryFn: () => getIndicadores(agruparPor),
  });

  const { data: lancamentos = [] } = useQuery<Lancamento[]>({
    queryKey: ["financeiro-lancamentos"],
    queryFn: () => getLancamentos(),
  });

  const top10 = useMemo(
    () =>
      lancamentos
        .filter((l) => l.tipo === "DESPESA")
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10)
        .map((l, i) => ({
          label: `${i + 1}. ${l.categoria}${l.nome_safra ? ` · ${l.nome_safra}` : ""}`,
          valor: l.valor,
          cor: "#dc2626",
        })),
    [lancamentos]
  );

  const evolucao = useMemo(() => {
    const mapa = new Map<string, { r: number; d: number }>();
    for (const l of lancamentos) {
      const chave = chaveMes(l.data_lancamento);
      const atual = mapa.get(chave) ?? { r: 0, d: 0 };
      if (l.tipo === "RECEITA") atual.r += l.valor;
      else atual.d += l.valor;
      mapa.set(chave, atual);
    }
    const chaves = Array.from(mapa.keys()).sort();
    return {
      categorias: chaves.map(labelMes),
      series: [
        {
          nome: "Receitas",
          cor: "#16a34a",
          pontos: chaves.map((c) => ({ x: labelMes(c), y: mapa.get(c)!.r })),
        },
        {
          nome: "Despesas",
          cor: "#dc2626",
          pontos: chaves.map((c) => ({ x: labelMes(c), y: mapa.get(c)!.d })),
        },
      ],
    };
  }, [lancamentos]);

  return (
    <div className="space-y-6">
      {/* Seletor de agrupamento */}
      <div className="flex gap-2">
        {OPCOES.map((o) => (
          <button
            key={o.id}
            onClick={() => setAgruparPor(o.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
              agruparPor === o.id
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Tabela de indicadores */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Carregando indicadores...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-700">
            Não foi possível carregar os indicadores.
          </div>
        ) : indicadores.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Sem dados para o agrupamento selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3">
                    {agruparPor === "safra"
                      ? "Safra"
                      : agruparPor === "talhao"
                      ? "Talhão"
                      : "Cultura"}
                  </th>
                  <th className="px-4 py-3 text-right">Receita</th>
                  <th className="px-4 py-3 text-right">Despesa</th>
                  <th className="px-4 py-3 text-right">Lucro Líquido</th>
                  <th className="px-4 py-3 text-right">Margem</th>
                  <th className="px-4 py-3 text-right">ROI</th>
                  <th className="px-4 py-3 text-right">Custo/ha</th>
                </tr>
              </thead>
              <tbody>
                {indicadores.map((i) => (
                  <tr
                    key={i.grupo}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-700">{i.grupo}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">
                      {fmtMoeda(i.receita_total)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600">
                      {fmtMoeda(i.despesa_total)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        i.lucro_liquido >= 0 ? "text-gray-800" : "text-red-600"
                      }`}
                    >
                      {fmtMoeda(i.lucro_liquido)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {fmtPct(i.margem)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {fmtPct(i.roi)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {i.custo_por_hectare == null
                        ? "—"
                        : `${fmtMoedaCurta(i.custo_por_hectare)}/ha`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Indicadores de gestão */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard titulo="Top 10 Maiores Despesas" descricao="Maiores saídas do período">
          {top10.length ? (
            <BarChart dados={top10} formatarValor={fmtMoedaCurta} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">Sem despesas no período</p>
          )}
        </ChartCard>

        <ChartCard
          titulo="Evolução Mensal"
          descricao="Receitas x Despesas ao longo dos meses"
        >
          {evolucao.categorias.length ? (
            <LineChart categorias={evolucao.categorias} series={evolucao.series} />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">Sem dados no período</p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
