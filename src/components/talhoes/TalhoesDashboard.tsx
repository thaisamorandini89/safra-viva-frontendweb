import { useMemo, useState } from "react";
import {
  Talhao,
  STATUS_TALHAO,
  STATUS_META,
  StatusTalhao,
  areaOcupada,
  areaDisponivel,
  produtividadeMedia,
  isOcupado,
  fmtHa,
} from "../../types/talhao";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import Gauge from "../ui/Gauge";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";
import LineChart, { SerieLinha } from "../ui/charts/LineChart";
import StatusBadge from "../ui/StatusBadge";

const PALETA_SOLO = ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#ef4444", "#14b8a6"];
const PALETA_CULTURA = ["#16a34a", "#f59e0b", "#0ea5e9", "#a855f7", "#f97316", "#64748b"];

interface Props {
  talhoes: Talhao[];
  onVerTalhao: (t: Talhao) => void;
}

export default function TalhoesDashboard({ talhoes, onVerTalhao }: Props) {
  // Safras disponíveis no histórico, mais recentes primeiro
  const safras = useMemo(() => {
    const set = new Set<string>();
    talhoes.forEach((t) => t.historico?.forEach((h) => set.add(h.safra)));
    return Array.from(set).sort();
  }, [talhoes]);

  const [safraFoco, setSafraFoco] = useState<string>("todas");

  // -------------------------------------------------------------- indicadores
  const kpis = useMemo(() => {
    const areaTotal = talhoes.reduce((s, t) => s + Number(t.area_total || 0), 0);
    const areaUtilizavel = talhoes.reduce(
      (s, t) => s + Number(t.area_utilizavel || t.area_total || 0),
      0
    );
    const plantada = talhoes.reduce((s, t) => s + areaOcupada(t), 0);
    const disponivel = talhoes.reduce((s, t) => s + areaDisponivel(t), 0);
    const ocupados = talhoes.filter(isOcupado).length;

    return {
      total: talhoes.length,
      areaTotal,
      areaUtilizavel,
      plantada,
      disponivel,
      ocupados,
      livres: talhoes.length - ocupados,
      taxaOcupacao: areaUtilizavel ? (plantada / areaUtilizavel) * 100 : 0,
    };
  }, [talhoes]);

  // ------------------------------------------------- distribuição por tipo de solo
  const porTipoSolo = useMemo(() => {
    const mapa = new Map<string, number>();
    talhoes.forEach((t) => {
      const chave = t.tipo_solo || "Não informado";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_SOLO[i % PALETA_SOLO.length],
      }));
  }, [talhoes]);

  // ---------------------------------------------------- ocupação (status) dos talhões
  const porStatus = useMemo(
    () =>
      STATUS_TALHAO.map((s) => ({
        label: s,
        valor: talhoes.filter((t) => t.status === s).length,
        cor: STATUS_META[s as StatusTalhao].hex,
      })).filter((d) => d.valor > 0),
    [talhoes]
  );

  // ------------------------------------------- área plantada por cultura na safra foco
  const porCultura = useMemo(() => {
    const mapa = new Map<string, number>();
    talhoes.forEach((t) =>
      (t.historico ?? [])
        .filter((h) => safraFoco === "todas" || h.safra === safraFoco)
        .forEach((h) =>
          mapa.set(h.cultura, (mapa.get(h.cultura) ?? 0) + Number(h.area_plantada || 0))
        )
    );
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_CULTURA[i % PALETA_CULTURA.length],
      }));
  }, [talhoes, safraFoco]);

  // -------------------------------------------- ocupação por talhão (barras horizontais)
  const ocupacaoPorTalhao = useMemo(
    () =>
      talhoes
        .map((t) => {
          const base = t.area_utilizavel || t.area_total;
          return {
            label: `${t.codigo} · ${t.nome}`,
            valor: areaOcupada(t),
            total: base,
            cor: STATUS_META[t.status]?.hex ?? "#16a34a",
          };
        })
        .sort((a, b) => b.valor / (b.total || 1) - a.valor / (a.total || 1))
        .slice(0, 8),
    [talhoes]
  );

  // ---------------------------------------------- evolução da produtividade por talhão
  const { seriesProdutividade, categoriasSafra } = useMemo(() => {
    const categorias = safras;
    const series: SerieLinha[] = talhoes
      .map((t, i) => ({
        nome: t.codigo,
        cor: PALETA_CULTURA[i % PALETA_CULTURA.length],
        pontos: (t.historico ?? [])
          .filter((h) => h.produtividade != null && h.produtividade > 0)
          .map((h) => ({ x: h.safra, y: Number(h.produtividade) })),
      }))
      .filter((s) => s.pontos.length > 0)
      .slice(0, 6);
    return { seriesProdutividade: series, categoriasSafra: categorias };
  }, [talhoes, safras]);

  // ----------------------------------------------------------- ranking de desempenho
  const ranking = useMemo(
    () =>
      talhoes
        .map((t) => ({ talhao: t, media: produtividadeMedia(t) }))
        .filter((r) => r.media > 0)
        .sort((a, b) => b.media - a.media)
        .slice(0, 5),
    [talhoes]
  );

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------ Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icone="🗂️" titulo="Total de Talhões" valor={String(kpis.total)} tom="green" descricao="cadastrados no sistema" />
        <StatCard icone="🌍" titulo="Área Total Cultivável" valor={fmtHa(kpis.areaUtilizavel, 1)} sufixo="ha" tom="lime" descricao={`${fmtHa(kpis.areaTotal, 1)} ha totais`} />
        <StatCard icone="🌱" titulo="Área Plantada Atual" valor={fmtHa(kpis.plantada, 1)} sufixo="ha" tom="sky" descricao={`${kpis.taxaOcupacao.toFixed(1)}% da área útil`} />
        <StatCard icone="🟩" titulo="Área Disponível" valor={fmtHa(kpis.disponivel, 1)} sufixo="ha" tom="amber" descricao="pronta para novo plantio" />
        <StatCard icone="🚜" titulo="Talhões Ocupados" valor={String(kpis.ocupados)} tom="orange" descricao="em ciclo produtivo" />
        <StatCard icone="⚪" titulo="Talhões Livres" valor={String(kpis.livres)} tom="slate" descricao="aguardando planejamento" />
      </div>

      {/* -------------------------------------------- Ocupação + distribuição de solo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          titulo="Ocupação dos Talhões"
          descricao="Distribuição por status do ciclo agrícola"
        >
          <DonutChart
            dados={porStatus}
            legendaCentro="Talhões"
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard
          titulo="Distribuição por Tipo de Solo"
          descricao="Quantidade de talhões por categoria de solo"
        >
          <DonutChart
            dados={porTipoSolo}
            legendaCentro="Tipos de solo"
            valorCentro={String(porTipoSolo.length)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard
          titulo="Taxa de Ocupação da Área"
          descricao="Área plantada sobre a área utilizável"
        >
          <div className="pt-4">
            <Gauge
              percentual={kpis.taxaOcupacao}
              rotulo="ocupação"
              sublegenda={`${fmtHa(kpis.plantada, 1)} ha de ${fmtHa(kpis.areaUtilizavel, 1)} ha`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-green-700">{fmtHa(kpis.plantada, 0)}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">ha plantados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{fmtHa(kpis.disponivel, 0)}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">ha disponíveis</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ------------------------------------------ Área por cultura + ocupação por talhão */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          titulo="Área Plantada por Cultura"
          descricao="Percentual de áreas ocupadas por safra"
          acoes={
            <select
              value={safraFoco}
              onChange={(e) => setSafraFoco(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="todas">Todas as safras</option>
              {safras.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          }
        >
          <DonutChart
            dados={porCultura}
            pizza={false}
            legendaCentro="hectares"
            valorCentro={fmtHa(
              porCultura.reduce((s, c) => s + c.valor, 0),
              0
            )}
            formatarValor={(v) => `${fmtHa(v, 1)} ha`}
          />
        </ChartCard>

        <ChartCard
          titulo="Ocupação por Talhão"
          descricao="Área plantada sobre a área utilizável de cada talhão"
        >
          <BarChart
            dados={ocupacaoPorTalhao}
            sufixo=" ha"
            mostrarPercentual
            formatarValor={(v) => fmtHa(v, 1)}
          />
        </ChartCard>
      </div>

      {/* ------------------------------------------- Evolução de produtividade + ranking */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          className="xl:col-span-2"
          titulo="Evolução de Produtividade"
          descricao="Produtividade histórica por talhão (sc/ha) — passe o mouse para comparar"
        >
          <LineChart
            series={seriesProdutividade}
            categorias={categoriasSafra}
            sufixo=" sc/ha"
          />
        </ChartCard>

        <ChartCard
          titulo="Ranking de Produtividade"
          descricao="Média histórica das safras colhidas"
        >
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              Nenhuma safra colhida registrada
            </p>
          ) : (
            <ol className="space-y-2">
              {ranking.map((r, i) => (
                <li key={r.talhao.id}>
                  <button
                    type="button"
                    onClick={() => onVerTalhao(r.talhao)}
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
                        {r.talhao.nome}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        {r.talhao.codigo} · {r.talhao.tipo_solo}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm font-bold text-green-700 tabular-nums">
                        {r.media.toFixed(1)}
                      </span>
                      <span className="block text-[10px] text-gray-400">sc/ha</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </ChartCard>
      </div>

      {/* ------------------------------------------------------- Mapa de calor / mosaico */}
      <ChartCard
        titulo="Mosaico de Talhões"
        descricao="Cada bloco é proporcional à área — a cor indica o status atual"
      >
        <div className="flex flex-wrap gap-2">
          {talhoes.map((t) => {
            const base = t.area_utilizavel || t.area_total;
            const maiorArea = Math.max(...talhoes.map((x) => x.area_total), 1);
            const escala = 90 + (t.area_total / maiorArea) * 110;
            const meta = STATUS_META[t.status] ?? STATUS_META["Livre"];
            const pct = base ? (areaOcupada(t) / base) * 100 : 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onVerTalhao(t)}
                title={`${t.nome} — ${fmtHa(t.area_total, 1)} ha`}
                className="relative rounded-lg border border-gray-100 overflow-hidden text-left p-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
                style={{
                  width: escala,
                  height: escala * 0.62,
                  backgroundColor: `${meta.hex}14`,
                }}
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: meta.hex }}
                />
                <span className="block text-[11px] font-bold text-gray-700 truncate pl-1">
                  {t.nome}
                </span>
                <span className="block text-[10px] text-gray-400 pl-1">
                  {fmtHa(t.area_total, 1)} ha
                </span>
                <span className="absolute bottom-2 left-3 right-3">
                  <span className="block h-1.5 rounded-full bg-white/70 overflow-hidden">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: meta.hex }}
                    />
                  </span>
                  <span className="block text-[9px] text-gray-500 mt-0.5">
                    {pct.toFixed(0)}% ocupado
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
          {STATUS_TALHAO.map((s) => (
            <StatusBadge key={s} status={s} tamanho="sm" />
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
