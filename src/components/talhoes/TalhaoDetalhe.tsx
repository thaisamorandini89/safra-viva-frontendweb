import { useMemo } from "react";
import {
  Talhao,
  areaOcupada,
  areaDisponivel,
  percentualOcupacao,
  produtividadeMedia,
  fmtHa,
  fmtData,
  STATUS_TALHAO,
  STATUS_META,
} from "../../types/talhao";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";
import DonutChart from "../ui/charts/DonutChart";
import LineChart from "../ui/charts/LineChart";
import MapaPropriedade from "../ui/MapaPropriedade";

interface Props {
  talhao: Talhao;
  onVoltar: () => void;
}

export default function TalhaoDetalhe({ talhao, onVoltar }: Props) {
  const base = talhao.area_utilizavel || talhao.area_total;
  const ocupada = areaOcupada(talhao);
  const disponivel = areaDisponivel(talhao);
  const pct = percentualOcupacao(talhao);
  const media = produtividadeMedia(talhao);

  const historico = useMemo(
    () =>
      [...(talhao.historico ?? [])].sort((a, b) =>
        b.data_plantio.localeCompare(a.data_plantio)
      ),
    [talhao]
  );

  const culturasAtivas = useMemo(
    () =>
      Array.from(
        new Set(historico.filter((h) => !h.data_colheita).map((h) => h.cultura))
      ),
    [historico]
  );

  const serieProdutividade = useMemo(() => {
    const colhidas = [...historico]
      .filter((h) => h.produtividade)
      .sort((a, b) => a.safra.localeCompare(b.safra));
    return {
      categorias: colhidas.map((h) => h.safra),
      series: [
        {
          nome: talhao.codigo,
          cor: "#16a34a",
          pontos: colhidas.map((h) => ({ x: h.safra, y: Number(h.produtividade) })),
        },
      ],
    };
  }, [historico, talhao.codigo]);

  const posicao: [number, number] | null =
    talhao.latitude != null && talhao.longitude != null
      ? [Number(talhao.latitude), Number(talhao.longitude)]
      : null;

  const indiceStatus = STATUS_TALHAO.indexOf(talhao.status);

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------- Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: `${STATUS_META[talhao.status].hex}1f` }}
            >
              {STATUS_META[talhao.status].icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-800">{talhao.nome}</h2>
                <StatusBadge status={talhao.status} />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                  {talhao.codigo}
                </span>{" "}
                · {talhao.nome_propriedade ?? `Propriedade #${talhao.id_propriedade}`} ·
                cadastrado em {fmtData(talhao.data_cadastro)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onVoltar}>
              ← Voltar
            </Button>
            <Button>✏️ Editar talhão</Button>
          </div>
        </div>

        {/* Linha do tempo do ciclo agrícola (RN005) */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Ciclo agrícola
          </p>
          <div className="flex items-center">
            {STATUS_TALHAO.map((s, i) => {
              const alcancado = i <= indiceStatus;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] border-2 transition
                        ${alcancado
                          ? "text-white border-transparent"
                          : "bg-white border-gray-200 text-gray-300"}`}
                      style={alcancado ? { backgroundColor: STATUS_META[s].hex } : {}}
                    >
                      {alcancado ? "✓" : i + 1}
                    </span>
                    <span
                      className={`text-[10px] text-center leading-tight w-16 ${
                        i === indiceStatus
                          ? "font-bold text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                  {i < STATUS_TALHAO.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 -mt-4 rounded ${
                        i < indiceStatus ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icone="🌍" titulo="Área Total" valor={fmtHa(talhao.area_total, 1)} sufixo="ha" tom="green" descricao={`${fmtHa(base, 1)} ha utilizáveis`} />
        <StatCard icone="🌱" titulo="Área Ocupada" valor={fmtHa(ocupada, 1)} sufixo="ha" tom="sky" descricao={`${pct.toFixed(1)}% da área útil`} />
        <StatCard icone="🟩" titulo="Área Disponível" valor={fmtHa(disponivel, 1)} sufixo="ha" tom="amber" descricao="livre para plantio" />
        <StatCard icone="📈" titulo="Produtividade Média" valor={media ? media.toFixed(1) : "—"} sufixo={media ? "sc/ha" : ""} tom="lime" descricao={`${historico.filter((h) => h.produtividade).length} safra(s) colhida(s)`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ------------------------------------------------- Informações gerais */}
        <ChartCard titulo="Informações Gerais" descricao="Dados cadastrais e técnicos">
          <dl className="divide-y divide-gray-100 text-sm">
            {[
              ["Nome", talhao.nome],
              ["Código", talhao.codigo],
              ["Propriedade", talhao.nome_propriedade ?? `#${talhao.id_propriedade}`],
              ["Área total", `${fmtHa(talhao.area_total)} ha`],
              ["Área utilizável", `${fmtHa(talhao.area_utilizavel)} ha`],
              ["Tipo de solo", talhao.tipo_solo],
              ["Topografia", talhao.topografia ?? "—"],
              [
                "Localização",
                posicao
                  ? `${posicao[0].toFixed(5)}, ${posicao[1].toFixed(5)}`
                  : "Não informada",
              ],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="flex justify-between gap-3 py-2">
                <dt className="text-gray-500">{rotulo}</dt>
                <dd className="font-semibold text-gray-800 text-right">{valor}</dd>
              </div>
            ))}
          </dl>

          {culturasAtivas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Culturas ativas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {culturasAtivas.map((c) => (
                  <span
                    key={c}
                    className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1"
                  >
                    🌱 {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {talhao.observacoes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Observações
              </p>
              <p className="text-sm text-gray-600">{talhao.observacoes}</p>
            </div>
          )}
        </ChartCard>

        {/* ------------------------------------------------- Ocupação da área */}
        <ChartCard
          titulo="Ocupação da Área"
          descricao="Distribuição entre área plantada e disponível"
        >
          <DonutChart
            dados={[
              { label: "Área ocupada", valor: ocupada, cor: "#16a34a" },
              { label: "Área disponível", valor: disponivel, cor: "#e2e8f0" },
              {
                label: "Área não utilizável",
                valor: Math.max(0, talhao.area_total - base),
                cor: "#cbd5e1",
              },
            ]}
            legendaCentro="ocupado"
            valorCentro={`${pct.toFixed(0)}%`}
            formatarValor={(v) => `${fmtHa(v, 1)} ha`}
            tamanho={180}
          />
        </ChartCard>

        {/* ------------------------------------------------- Localização */}
        <ChartCard titulo="Localização" descricao="Coordenadas geográficas do talhão">
          {posicao ? (
            <div className="h-[260px] rounded-lg overflow-hidden border border-gray-200">
              <MapaPropriedade
                posicao={posicao}
                onSelecionar={() => {}}
                label={talhao.nome}
              />
            </div>
          ) : (
            <div className="h-[260px] rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <span className="text-3xl mb-2">🗺️</span>
              <p className="text-sm">Coordenadas não informadas</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ------------------------------------------- Evolução de produtividade */}
      <ChartCard
        titulo="Evolução de Produtividade"
        descricao="Resultado colhido por safra (sc/ha)"
      >
        <LineChart
          series={serieProdutividade.series}
          categorias={serieProdutividade.categorias}
          sufixo=" sc/ha"
        />
      </ChartCard>

      {/* ------------------------------------------------- Histórico de safras */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Histórico de Safras</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Registro permanente das culturas implantadas neste talhão (RN004)
            </p>
          </div>
          <Button variant="secondary">+ Registrar safra</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold">Safra</th>
                <th className="px-4 py-3 font-semibold">Cultura</th>
                <th className="px-4 py-3 font-semibold text-right">Área Plantada</th>
                <th className="px-4 py-3 font-semibold">Data de Plantio</th>
                <th className="px-4 py-3 font-semibold">Data de Colheita</th>
                <th className="px-4 py-3 font-semibold text-right">Produtividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historico.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-700">{h.safra}</td>
                  <td className="px-4 py-3 text-gray-600">🌱 {h.cultura}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {fmtHa(h.area_plantada, 1)} ha
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtData(h.data_plantio)}</td>
                  <td className="px-4 py-3">
                    {h.data_colheita ? (
                      <span className="text-gray-600">{fmtData(h.data_colheita)}</span>
                    ) : (
                      <span className="text-xs font-semibold text-lime-700 bg-lime-50 border border-lime-200 rounded-full px-2 py-0.5">
                        Em campo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-green-700">
                    {h.produtividade ? `${h.produtividade} sc/ha` : "—"}
                  </td>
                </tr>
              ))}

              {historico.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-sm">Nenhuma safra registrada para este talhão</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
