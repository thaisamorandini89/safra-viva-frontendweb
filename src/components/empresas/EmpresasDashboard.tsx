import { useMemo } from "react";
import {
  EmpresaAgricola,
  fmtCNPJ,
  isEmpresaAtiva,
} from "../../types/empresaAgricola";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";

const PALETA_REGIME = ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];
const PALETA_TIPO = ["#16a34a", "#f59e0b", "#0ea5e9", "#a855f7", "#f97316", "#64748b"];

const fmtHa = (v: number, casas = 1) =>
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

interface Props {
  empresas: EmpresaAgricola[];
  propriedades: any[];
  onVerEmpresa: (e: EmpresaAgricola) => void;
}

export default function EmpresasDashboard({ empresas, propriedades, onVerEmpresa }: Props) {
  // -------------------------------------------------------------- indicadores
  const kpis = useMemo(() => {
    const ativas = empresas.filter(isEmpresaAtiva).length;
    const areaTotal = propriedades.reduce(
      (s, p) => s + Number(p.area_total || 0),
      0
    );
    const areaAgricultavel = propriedades.reduce(
      (s, p) => s + Number(p.area_agricultavel || 0),
      0
    );
    return {
      total: empresas.length,
      ativas,
      inativas: empresas.length - ativas,
      propriedades: propriedades.length,
      areaTotal,
      areaAgricultavel,
    };
  }, [empresas, propriedades]);

  // --------------------------------------------------- distribuição por regime
  const porRegime = useMemo(() => {
    const mapa = new Map<string, number>();
    empresas.forEach((e) => {
      const chave = e.regime_tributario_descricao || "Não informado";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_REGIME[i % PALETA_REGIME.length],
      }));
  }, [empresas]);

  // ----------------------------------------------------- distribuição por tipo
  const porTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    empresas.forEach((e) => {
      const chave = e.tipo_empresa_descricao || "Não informado";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_TIPO[i % PALETA_TIPO.length],
      }));
  }, [empresas]);

  // ----------------------------------------- situação (ativa/inativa) das empresas
  const porStatus = useMemo(
    () =>
      [
        { label: "Ativas", valor: kpis.ativas, cor: "#16a34a" },
        { label: "Inativas", valor: kpis.inativas, cor: "#9ca3af" },
      ].filter((d) => d.valor > 0),
    [kpis]
  );

  // ------------------------------------------ nº de propriedades por empresa (mapa)
  const propsPorEmpresa = useMemo(() => {
    const mapa = new Map<number, number>();
    propriedades.forEach((p) => {
      const id = Number(p.id_empresa ?? 0);
      mapa.set(id, (mapa.get(id) ?? 0) + 1);
    });
    return mapa;
  }, [propriedades]);

  // ------------------------------------------------ área total por empresa (barras)
  const areaPorEmpresa = useMemo(() => {
    const mapa = new Map<number, number>();
    propriedades.forEach((p) => {
      const id = Number(p.id_empresa ?? 0);
      mapa.set(id, (mapa.get(id) ?? 0) + Number(p.area_total || 0));
    });
    return empresas
      .map((e, i) => ({
        label: e.nome_fantasia || e.razao_social,
        valor: mapa.get(e.id_empresa) ?? 0,
        cor: PALETA_REGIME[i % PALETA_REGIME.length],
      }))
      .filter((d) => d.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [empresas, propriedades]);

  // ----------------------------------------- ranking por número de propriedades
  const ranking = useMemo(
    () =>
      empresas
        .map((e) => ({ empresa: e, qtd: propsPorEmpresa.get(e.id_empresa) ?? 0 }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5),
    [empresas, propsPorEmpresa]
  );

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------ Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icone="🏢" titulo="Total de Empresas" valor={String(kpis.total)} tom="green" descricao="cadastradas no sistema" />
        <StatCard icone="✅" titulo="Empresas Ativas" valor={String(kpis.ativas)} tom="lime" descricao="em operação" />
        <StatCard icone="⏸️" titulo="Empresas Inativas" valor={String(kpis.inativas)} tom="slate" descricao="sem operação" />
        <StatCard icone="🌿" titulo="Propriedades Vinculadas" valor={String(kpis.propriedades)} tom="sky" descricao="cadastradas às empresas" />
        <StatCard icone="🌍" titulo="Área Total" valor={fmtHa(kpis.areaTotal, 1)} sufixo="ha" tom="amber" descricao={`${fmtHa(kpis.areaAgricultavel, 1)} ha agricultáveis`} />
        <StatCard icone="📑" titulo="Regimes Tributários" valor={String(porRegime.length)} tom="orange" descricao="categorias distintas" />
      </div>

      {/* --------------------------------------------- situação + regime + tipo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          titulo="Situação das Empresas"
          descricao="Empresas ativas e inativas no sistema"
        >
          <DonutChart
            dados={porStatus}
            legendaCentro="Empresas"
            valorCentro={String(kpis.total)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard
          titulo="Distribuição por Regime Tributário"
          descricao="Quantidade de empresas por regime"
        >
          <DonutChart
            dados={porRegime}
            legendaCentro="Regimes"
            valorCentro={String(porRegime.length)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard
          titulo="Distribuição por Tipo de Empresa"
          descricao="Quantidade de empresas por categoria"
        >
          <DonutChart
            dados={porTipo}
            legendaCentro="Tipos"
            valorCentro={String(porTipo.length)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>
      </div>

      {/* --------------------------------------------- área por empresa + ranking */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          className="xl:col-span-2"
          titulo="Área Total por Empresa"
          descricao="Soma das áreas das propriedades vinculadas a cada empresa"
        >
          {areaPorEmpresa.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Nenhuma propriedade vinculada às empresas
            </p>
          ) : (
            <BarChart
              dados={areaPorEmpresa}
              sufixo=" ha"
              formatarValor={(v) => fmtHa(v, 1)}
            />
          )}
        </ChartCard>

        <ChartCard
          titulo="Ranking de Propriedades"
          descricao="Empresas com mais propriedades cadastradas"
        >
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Nenhuma empresa cadastrada
            </p>
          ) : (
            <ol className="space-y-2">
              {ranking.map((r, i) => (
                <li key={r.empresa.id_empresa}>
                  <button
                    type="button"
                    onClick={() => onVerEmpresa(r.empresa)}
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
                        {r.empresa.nome_fantasia || r.empresa.razao_social}
                      </span>
                      <span className="block text-[11px] text-gray-400 truncate">
                        {fmtCNPJ(r.empresa.cnpj)}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm font-bold text-green-700 tabular-nums">
                        {r.qtd}
                      </span>
                      <span className="block text-[10px] text-gray-400">propriedade(s)</span>
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
