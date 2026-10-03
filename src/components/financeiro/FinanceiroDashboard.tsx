import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getFinanceiroSaldo,
  getIndicadores,
  getLancamentos,
} from "../../services/api";
import {
  Lancamento,
  IndicadorFinanceiro,
  SaldoFinanceiro,
  fmtMoedaCurta,
  chaveMes,
  labelMes,
  PALETA_FINANCEIRO,
} from "../../types/financeiro";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";
import LineChart from "../ui/charts/LineChart";

export default function FinanceiroDashboard() {
  const { data: saldo } = useQuery<SaldoFinanceiro>({
    queryKey: ["financeiro-saldo"],
    queryFn: () => getFinanceiroSaldo(),
  });
  const { data: indSafra = [] } = useQuery<IndicadorFinanceiro[]>({
    queryKey: ["financeiro-indicadores", "safra"],
    queryFn: () => getIndicadores("safra"),
  });
  const { data: indCultura = [] } = useQuery<IndicadorFinanceiro[]>({
    queryKey: ["financeiro-indicadores", "cultura"],
    queryFn: () => getIndicadores("cultura"),
  });
  const { data: lancamentos = [] } = useQuery<Lancamento[]>({
    queryKey: ["financeiro-lancamentos"],
    queryFn: () => getLancamentos(),
  });

  const receita = saldo?.receita_total ?? 0;
  const despesa = saldo?.despesa_total ?? 0;
  const lucro = saldo?.saldo ?? receita - despesa;

  const areaTotal = useMemo(
    () => indSafra.reduce((s, i) => s + (i.area ?? 0), 0),
    [indSafra]
  );
  const custoHa = areaTotal > 0 ? despesa / areaTotal : null;
  const receitaHa = areaTotal > 0 ? receita / areaTotal : null;

  // Receitas x Despesas por mês
  const { categorias, serieReceita, serieDespesa } = useMemo(() => {
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
      serieReceita: chaves.map((c) => ({ x: labelMes(c), y: mapa.get(c)!.r })),
      serieDespesa: chaves.map((c) => ({ x: labelMes(c), y: mapa.get(c)!.d })),
    };
  }, [lancamentos]);

  // Custos por categoria (despesas)
  const custosPorCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of lancamentos.filter((x) => x.tipo === "DESPESA")) {
      mapa.set(l.categoria, (mapa.get(l.categoria) ?? 0) + l.valor);
    }
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_FINANCEIRO[i % PALETA_FINANCEIRO.length],
      }));
  }, [lancamentos]);

  const rentabilidadeCultura = useMemo(
    () =>
      indCultura.map((i) => ({
        label: i.grupo,
        valor: i.lucro_liquido,
        cor: i.lucro_liquido >= 0 ? "#16a34a" : "#dc2626",
        detalhe: `Receita ${fmtMoedaCurta(i.receita_total)} · Margem ${i.margem.toFixed(0)}%`,
      })),
    [indCultura]
  );

  const resultadoSafra = useMemo(
    () =>
      indSafra.map((i) => ({
        label: i.grupo,
        valor: i.lucro_liquido,
        cor: i.lucro_liquido >= 0 ? "#0ea5e9" : "#dc2626",
        detalhe: `ROI ${i.roi.toFixed(0)}%`,
      })),
    [indSafra]
  );

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icone="💰"
          titulo="Receita Total"
          valor={fmtMoedaCurta(receita)}
          descricao="no período"
          tom="green"
        />
        <StatCard
          icone="📉"
          titulo="Despesa Total"
          valor={fmtMoedaCurta(despesa)}
          descricao="no período"
          tom="orange"
        />
        <StatCard
          icone={lucro >= 0 ? "📈" : "⚠️"}
          titulo="Lucro Líquido"
          valor={fmtMoedaCurta(lucro)}
          descricao={lucro >= 0 ? "resultado positivo" : "prejuízo no período"}
          tom={lucro >= 0 ? "lime" : "orange"}
        />
        <StatCard
          icone="🌱"
          titulo="Custo por Hectare"
          valor={custoHa == null ? "—" : fmtMoedaCurta(custoHa)}
          sufixo={custoHa == null ? undefined : "/ha"}
          descricao={areaTotal > 0 ? `${areaTotal.toLocaleString("pt-BR")} ha` : "sem área"}
          tom="slate"
        />
        <StatCard
          icone="🌾"
          titulo="Receita por Hectare"
          valor={receitaHa == null ? "—" : fmtMoedaCurta(receitaHa)}
          sufixo={receitaHa == null ? undefined : "/ha"}
          descricao={areaTotal > 0 ? `${areaTotal.toLocaleString("pt-BR")} ha` : "sem área"}
          tom="sky"
        />
        <StatCard
          icone="🏦"
          titulo="Fluxo de Caixa"
          valor={fmtMoedaCurta(lucro)}
          descricao="saldo acumulado"
          tom={lucro >= 0 ? "green" : "orange"}
        />
      </div>

      {/* Gráfico linha: receitas x despesas */}
      <ChartCard titulo="Receitas x Despesas" descricao="Evolução mensal no período">
        {categorias.length ? (
          <LineChart
            categorias={categorias}
            series={[
              { nome: "Receitas", cor: "#16a34a", pontos: serieReceita },
              { nome: "Despesas", cor: "#dc2626", pontos: serieDespesa },
            ]}
          />
        ) : (
          <EstadoVazio />
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard titulo="Custos por Categoria" descricao="Participação das despesas">
          {custosPorCategoria.length ? (
            <DonutChart
              dados={custosPorCategoria}
              legendaCentro="Despesas"
              valorCentro={fmtMoedaCurta(despesa)}
              formatarValor={fmtMoedaCurta}
            />
          ) : (
            <EstadoVazio />
          )}
        </ChartCard>

        <ChartCard
          titulo="Rentabilidade por Cultura"
          descricao="Lucro líquido por cultura"
        >
          {rentabilidadeCultura.length ? (
            <BarChart dados={rentabilidadeCultura} formatarValor={fmtMoedaCurta} />
          ) : (
            <EstadoVazio />
          )}
        </ChartCard>
      </div>

      <ChartCard titulo="Resultado por Safra" descricao="Lucro líquido por safra">
        {resultadoSafra.length ? (
          <BarChart dados={resultadoSafra} formatarValor={fmtMoedaCurta} />
        ) : (
          <EstadoVazio />
        )}
      </ChartCard>
    </div>
  );
}

function EstadoVazio() {
  return (
    <p className="text-sm text-gray-400 py-10 text-center">
      Sem dados no período selecionado
    </p>
  );
}
