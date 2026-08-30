import { useMemo, useState } from "react";
import {
  Insumo,
  MovimentacaoEstoque,
  CATEGORIAS_INSUMOS,
  CATEGORIA_INSUMO_META,
  DIAS_ALERTA_VALIDADE,
  abaixoMinimo,
  diasParaVencer,
  isProximoVencimento,
  isVencido,
  proximaValidade,
  valorEstoque,
  valorMovimentacao,
  fmtMoeda,
  fmtQtd,
  fmtData,
} from "../../types/insumo";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import Gauge from "../ui/Gauge";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";
import InsumoStatusBadge from "./InsumoStatusBadge";

const PALETA_SAFRA = ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#f97316", "#64748b"];

interface Props {
  insumos: Insumo[];
  movimentacoes: MovimentacaoEstoque[];
  onVerInsumo: (i: Insumo) => void;
}

export default function InsumosDashboard({
  insumos,
  movimentacoes,
  onVerInsumo,
}: Props) {
  const safras = useMemo(
    () =>
      Array.from(
        new Set(movimentacoes.map((m) => m.safra).filter(Boolean) as string[])
      )
        .sort()
        .reverse(),
    [movimentacoes]
  );

  const [safraFoco, setSafraFoco] = useState("todas");

  /** Somente saídas representam consumo efetivo */
  const consumo = useMemo(
    () =>
      movimentacoes.filter(
        (m) => m.tipo === "Saída" && (safraFoco === "todas" || m.safra === safraFoco)
      ),
    [movimentacoes, safraFoco]
  );

  const mapaInsumos = useMemo(
    () => new Map(insumos.map((i) => [i.id, i])),
    [insumos]
  );

  // -------------------------------------------------------------- indicadores
  const kpis = useMemo(() => {
    const ativos = insumos.filter((i) => i.status === "Ativo");
    const baixo = insumos.filter(abaixoMinimo).length;
    const vencendo = insumos.filter((i) => isProximoVencimento(i)).length;
    const vencidos = insumos.filter(isVencido).length;
    const valor = insumos.reduce((s, i) => s + valorEstoque(i), 0);
    const comSaldo = insumos.filter((i) => i.estoque_atual > 0).length;

    return {
      total: insumos.length,
      ativos: ativos.length,
      comSaldo,
      baixo,
      vencendo,
      vencidos,
      valor,
      disponibilidade: insumos.length ? (comSaldo / insumos.length) * 100 : 0,
    };
  }, [insumos]);

  // ------------------------------------------------------------ por categoria
  const consumoPorCategoria = useMemo(
    () =>
      CATEGORIAS_INSUMOS.map((c) => ({
        label: c,
        valor: consumo
          .filter((m) => mapaInsumos.get(m.id_insumo)?.categoria === c)
          .reduce((s, m) => s + valorMovimentacao(m), 0),
        cor: CATEGORIA_INSUMO_META[c].hex,
      })).filter((d) => d.valor > 0),
    [consumo, mapaInsumos]
  );

  const estoquePorCategoria = useMemo(
    () =>
      CATEGORIAS_INSUMOS.map((c) => ({
        label: c,
        valor: insumos
          .filter((i) => i.categoria === c)
          .reduce((s, i) => s + valorEstoque(i), 0),
        cor: CATEGORIA_INSUMO_META[c].hex,
      })).filter((d) => d.valor > 0),
    [insumos]
  );

  // --------------------------------------------------------------- por talhão
  const consumoPorTalhao = useMemo(() => {
    const mapa = new Map<string, number>();
    consumo.forEach((m) => {
      const chave = m.codigo_talhao
        ? `${m.codigo_talhao} · ${m.nome_talhao ?? ""}`.trim()
        : "Sem talhão";
      mapa.set(chave, (mapa.get(chave) ?? 0) + valorMovimentacao(m));
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, valor]) => ({ label, valor, cor: "#16a34a" }));
  }, [consumo]);

  // ---------------------------------------------------------------- por safra
  const consumoPorSafra = useMemo(() => {
    const mapa = new Map<string, number>();
    movimentacoes
      .filter((m) => m.tipo === "Saída")
      .forEach((m) => {
        const chave = m.safra ?? "Sem safra";
        mapa.set(chave, (mapa.get(chave) ?? 0) + valorMovimentacao(m));
      });
    return Array.from(mapa.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_SAFRA[i % PALETA_SAFRA.length],
      }));
  }, [movimentacoes]);

  // ------------------------------------------------- top 10 mais consumidos
  const topConsumidos = useMemo(() => {
    const mapa = new Map<string, { quantidade: number; valor: number }>();
    consumo.forEach((m) => {
      const atual = mapa.get(m.id_insumo) ?? { quantidade: 0, valor: 0 };
      mapa.set(m.id_insumo, {
        quantidade: atual.quantidade + Number(m.quantidade || 0),
        valor: atual.valor + valorMovimentacao(m),
      });
    });
    return Array.from(mapa.entries())
      .map(([id, v]) => ({ insumo: mapaInsumos.get(id), ...v }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [consumo, mapaInsumos]);

  // ------------------------------------------------------------------ alertas
  const alertas = useMemo(
    () =>
      insumos
        .filter((i) => abaixoMinimo(i) || isProximoVencimento(i) || isVencido(i))
        .sort((a, b) => valorEstoque(a) - valorEstoque(b))
        .slice(0, 8),
    [insumos]
  );

  const filtroSafra = (
    <select
      value={safraFoco}
      onChange={(e) => setSafraFoco(e.target.value)}
      className="border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      <option value="todas">Todas as safras</option>
      {safras.map((s) => (
        <option key={s} value={s}>
          Safra {s}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------ Indicadores */}
      <div className="flex items-center justify-end">{filtroSafra}</div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icone="📦"
          titulo="Total de Insumos"
          valor={String(kpis.total)}
          tom="slate"
          descricao={`${kpis.ativos} produto(s) ativo(s)`}
        />
        <StatCard
          icone="🏷️"
          titulo="Itens com Saldo"
          valor={String(kpis.comSaldo)}
          tom="sky"
          descricao="produtos disponíveis em estoque"
        />
        <StatCard
          icone="⏰"
          titulo="Próximos do Vencimento"
          valor={String(kpis.vencendo)}
          tom="amber"
          descricao={`validade em até ${DIAS_ALERTA_VALIDADE} dias`}
        />
        <StatCard
          icone="⚠️"
          titulo="Estoque Baixo"
          valor={String(kpis.baixo)}
          tom="orange"
          descricao="no limite mínimo cadastrado"
        />
        <StatCard
          icone="⛔"
          titulo="Produtos Vencidos"
          valor={String(kpis.vencidos)}
          tom="orange"
          descricao="bloqueados para uso (RN002)"
        />
        <StatCard
          icone="💰"
          titulo="Valor em Estoque"
          valor={fmtMoeda(kpis.valor)}
          tom="lime"
          descricao="capital imobilizado em insumos"
        />
      </div>

      {/* ------------------------------ Consumo/estoque por categoria + gauge */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          titulo="Consumo por Categoria"
          descricao="Valor consumido nas saídas de estoque"
        >
          <DonutChart
            dados={consumoPorCategoria}
            legendaCentro="Consumo"
            tamanho={150}
            espessura={26}
            formatarValor={fmtMoeda}
          />
        </ChartCard>

        <ChartCard
          titulo="Estoque por Categoria"
          descricao="Distribuição do capital imobilizado"
        >
          <DonutChart
            dados={estoquePorCategoria}
            legendaCentro="Em estoque"
            tamanho={150}
            espessura={26}
            formatarValor={fmtMoeda}
          />
        </ChartCard>

        <ChartCard
          titulo="Disponibilidade de Estoque"
          descricao="Produtos com saldo sobre o total cadastrado"
        >
          <div className="pt-4">
            <Gauge
              percentual={kpis.disponibilidade}
              rotulo="com saldo"
              sublegenda={`${kpis.comSaldo} de ${kpis.total} produtos`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{kpis.baixo}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                estoque baixo
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{kpis.vencidos}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                vencidos
              </p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ------------------------------------------- Consumo por talhão e safra */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          titulo="Consumo por Talhão"
          descricao="Custo dos insumos aplicados em cada área"
        >
          <BarChart dados={consumoPorTalhao} formatarValor={fmtMoeda} />
        </ChartCard>

        <ChartCard
          titulo="Consumo por Safra"
          descricao="Comparativo entre ciclos produtivos"
        >
          <DonutChart
            dados={consumoPorSafra}
            pizza={false}
            legendaCentro="consumido"
            formatarValor={fmtMoeda}
          />
        </ChartCard>
      </div>

      {/* ---------------------------------------------- Top 10 + alertas RN004 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">
              Top 10 Insumos Mais Consumidos
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ranking por valor consumido no período selecionado
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantidade</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topConsumidos.map((linha, idx) => (
                  <tr
                    key={linha.insumo?.id ?? idx}
                    onClick={() => linha.insumo && onVerInsumo(linha.insumo)}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {linha.insumo
                          ? `${CATEGORIA_INSUMO_META[linha.insumo.categoria].icone} ${
                              linha.insumo.nome
                            }`
                          : "Produto removido"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {linha.insumo?.categoria ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {fmtQtd(linha.quantidade, linha.insumo?.unidade_medida)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-700">
                      {fmtMoeda(linha.valor)}
                    </td>
                  </tr>
                ))}
                {!topConsumidos.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      Nenhum consumo registrado para o filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Alertas de Estoque</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Produtos no estoque mínimo ou com validade crítica
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold text-right">Saldo</th>
                  <th className="px-4 py-3 font-semibold">Validade</th>
                  <th className="px-4 py-3 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alertas.map((i) => {
                  const validade = proximaValidade(i);
                  const dias = diasParaVencer(validade);
                  return (
                    <tr
                      key={i.id}
                      onClick={() => onVerInsumo(i)}
                      className="hover:bg-green-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">
                          {CATEGORIA_INSUMO_META[i.categoria].icone} {i.nome}
                        </div>
                        <div className="text-xs text-gray-400">
                          mínimo: {fmtQtd(i.estoque_minimo, i.unidade_medida)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                        {fmtQtd(i.estoque_atual, i.unidade_medida)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {fmtData(validade)}
                        {dias != null && (
                          <div className="text-xs text-gray-400">
                            {dias < 0 ? `${Math.abs(dias)} dia(s) vencido` : `${dias} dia(s)`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <InsumoStatusBadge
                          insumo={i}
                          vencido={isVencido(i)}
                          proximoVencimento={isProximoVencimento(i)}
                          tamanho="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
                {!alertas.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      Nenhum alerta de estoque no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
