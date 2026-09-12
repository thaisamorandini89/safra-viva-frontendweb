import { useMemo } from "react";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import Gauge from "../ui/Gauge";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";

const PALETA_SOLO = ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];
const PALETA_CLASSE = ["#16a34a", "#f59e0b", "#0ea5e9", "#a855f7", "#f97316", "#64748b"];

export const fmtHa = (v: number, casas = 1) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

interface Props {
  propriedades: any[];
  onVerPropriedade: (p: any) => void;
}

export default function PropriedadesDashboard({ propriedades, onVerPropriedade }: Props) {
  // -------------------------------------------------------------- indicadores
  const kpis = useMemo(() => {
    const areaTotal = propriedades.reduce((s, p) => s + Number(p.area_total || 0), 0);
    const agricultavel = propriedades.reduce((s, p) => s + Number(p.area_agricultavel || 0), 0);
    const preservacao = propriedades.reduce((s, p) => s + Number(p.area_preservacao || 0), 0);
    const pastagem = propriedades.reduce((s, p) => s + Number(p.area_pastagem || 0), 0);
    const empresas = new Set(propriedades.map((p) => Number(p.id_empresa ?? 0))).size;

    return {
      total: propriedades.length,
      areaTotal,
      agricultavel,
      preservacao,
      pastagem,
      empresas,
      percPreservacao: areaTotal ? (preservacao / areaTotal) * 100 : 0,
    };
  }, [propriedades]);

  // ------------------------------------------------------ distribuição por solo
  const porSolo = useMemo(() => {
    const mapa = new Map<string, number>();
    propriedades.forEach((p) => {
      const chave = p.tipo_solo_descricao || "Não informado";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_SOLO[i % PALETA_SOLO.length],
      }));
  }, [propriedades]);

  // -------------------------------------------- distribuição por classe de uso
  const porClasse = useMemo(() => {
    const mapa = new Map<string, number>();
    propriedades.forEach((p) => {
      const chave = p.classe_capacidade_uso_descricao || "Não informado";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_CLASSE[i % PALETA_CLASSE.length],
      }));
  }, [propriedades]);

  // --------------------------------------------------------- uso da área total
  const usoDaArea = useMemo(() => {
    const vegetacao = propriedades.reduce(
      (s, p) => s + Number(p.area_vegetacao_nativa || 0),
      0
    );
    const outras = Math.max(
      0,
      kpis.areaTotal - kpis.agricultavel - kpis.preservacao - kpis.pastagem - vegetacao
    );
    return [
      { label: "Agricultável", valor: kpis.agricultavel, cor: "#16a34a" },
      { label: "Preservação (APP + Reserva)", valor: kpis.preservacao, cor: "#0ea5e9" },
      { label: "Pastagem", valor: kpis.pastagem, cor: "#f59e0b" },
      { label: "Vegetação Nativa", valor: vegetacao, cor: "#14b8a6" },
      { label: "Outras áreas", valor: outras, cor: "#9ca3af" },
    ].filter((d) => d.valor > 0);
  }, [propriedades, kpis]);

  // --------------------------------------------- área total por propriedade
  const areaPorPropriedade = useMemo(
    () =>
      propriedades
        .map((p, i) => ({
          label: p.nome_propriedade ?? `Propriedade ${p.id_propriedade}`,
          valor: Number(p.area_total || 0),
          cor: PALETA_SOLO[i % PALETA_SOLO.length],
        }))
        .filter((d) => d.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8),
    [propriedades]
  );

  // ------------------------------------------------- ranking por área agricultável
  const ranking = useMemo(
    () =>
      [...propriedades]
        .map((p) => ({ propriedade: p, area: Number(p.area_agricultavel || 0) }))
        .sort((a, b) => b.area - a.area)
        .slice(0, 5),
    [propriedades]
  );

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------ Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icone="🌿" titulo="Total de Propriedades" valor={String(kpis.total)} tom="green" descricao="cadastradas no sistema" />
        <StatCard icone="🌍" titulo="Área Total" valor={fmtHa(kpis.areaTotal, 1)} sufixo="ha" tom="lime" descricao="somando todas as propriedades" />
        <StatCard icone="🌱" titulo="Área Agricultável" valor={fmtHa(kpis.agricultavel, 1)} sufixo="ha" tom="sky" descricao={`${kpis.areaTotal ? ((kpis.agricultavel / kpis.areaTotal) * 100).toFixed(1) : 0}% da área total`} />
        <StatCard icone="🛡️" titulo="Área de Preservação" valor={fmtHa(kpis.preservacao, 1)} sufixo="ha" tom="amber" descricao="APP + Reserva Legal" />
        <StatCard icone="🐄" titulo="Área de Pastagem" valor={fmtHa(kpis.pastagem, 1)} sufixo="ha" tom="orange" descricao="destinada à pecuária" />
        <StatCard icone="🏢" titulo="Empresas Vinculadas" valor={String(kpis.empresas)} tom="slate" descricao="com propriedades cadastradas" />
      </div>

      {/* --------------------------------------------- uso da área + solo + classe */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          titulo="Uso da Área Total"
          descricao="Como a área das propriedades está distribuída"
        >
          <DonutChart
            dados={usoDaArea}
            legendaCentro="hectares"
            valorCentro={fmtHa(kpis.areaTotal, 0)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${fmtHa(v, 1)} ha`}
          />
        </ChartCard>

        <ChartCard
          titulo="Distribuição por Tipo de Solo"
          descricao="Quantidade de propriedades por tipo de solo predominante"
        >
          <DonutChart
            dados={porSolo}
            legendaCentro="Tipos de solo"
            valorCentro={String(porSolo.length)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard
          titulo="Percentual de Preservação"
          descricao="APP + Reserva Legal sobre a área total"
        >
          <div className="pt-4">
            <Gauge
              percentual={kpis.percPreservacao}
              rotulo="preservado"
              sublegenda={`${fmtHa(kpis.preservacao, 1)} ha de ${fmtHa(kpis.areaTotal, 1)} ha`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-green-700">{fmtHa(kpis.preservacao, 0)}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">ha preservados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-sky-600">{fmtHa(kpis.agricultavel, 0)}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">ha agricultáveis</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ------------------------------------------ área por propriedade + ranking */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          className="xl:col-span-2"
          titulo="Área Total por Propriedade"
          descricao="Comparativo de tamanho entre as propriedades cadastradas"
        >
          {areaPorPropriedade.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Nenhuma propriedade cadastrada
            </p>
          ) : (
            <BarChart
              dados={areaPorPropriedade}
              sufixo=" ha"
              formatarValor={(v) => fmtHa(v, 1)}
            />
          )}
        </ChartCard>

        <ChartCard
          titulo="Ranking por Área Agricultável"
          descricao="Propriedades com maior área produtiva"
        >
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Nenhuma propriedade cadastrada
            </p>
          ) : (
            <ol className="space-y-2">
              {ranking.map((r, i) => (
                <li key={r.propriedade.id_propriedade}>
                  <button
                    type="button"
                    onClick={() => onVerPropriedade(r.propriedade)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition text-left"
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                        ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {i + 1}º
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-gray-700 truncate">
                        {r.propriedade.nome_propriedade}
                      </span>
                      <span className="block text-[11px] text-gray-400 truncate">
                        {r.propriedade.empresa_nome ?? "—"}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm font-bold text-green-700 tabular-nums">
                        {fmtHa(r.area, 1)}
                      </span>
                      <span className="block text-[10px] text-gray-400">ha agricultáveis</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
