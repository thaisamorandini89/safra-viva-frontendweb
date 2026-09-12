import { useMemo, useState } from "react";
import {
  AtividadeAgricola,
  STATUS_ATIVIDADE,
  STATUS_ATIVIDADE_META,
  CATEGORIAS,
  CATEGORIA_META,
  categoriaDoTipo,
  custoTotal,
  isAtrasada,
  fmtMoeda,
  fmtData,
} from "../../types/atividade";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import Gauge from "../ui/Gauge";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";
import AtividadeStatusBadge from "./AtividadeStatusBadge";

const PALETA_SAFRA = ["#16a34a", "#0ea5e9", "#f59e0b", "#a855f7", "#f97316", "#64748b"];

interface Props {
  atividades: AtividadeAgricola[];
  onVerAtividade: (a: AtividadeAgricola) => void;
}

export default function AtividadesDashboard({ atividades, onVerAtividade }: Props) {
  const safras = useMemo(
    () =>
      Array.from(new Set(atividades.map((a) => a.safra).filter(Boolean) as string[]))
        .sort()
        .reverse(),
    [atividades]
  );

  const [safraFoco, setSafraFoco] = useState("todas");

  const base = useMemo(
    () =>
      safraFoco === "todas"
        ? atividades
        : atividades.filter((a) => a.safra === safraFoco),
    [atividades, safraFoco]
  );

  // -------------------------------------------------------------- indicadores
  const kpis = useMemo(() => {
    const planejadas = base.filter((a) => a.status === "Planejada").length;
    const andamento = base.filter((a) => a.status === "Em Andamento").length;
    const concluidas = base.filter((a) => a.status === "Concluída").length;
    const atrasadas = base.filter(isAtrasada).length;
    const custo = base.reduce((s, a) => s + custoTotal(a), 0);

    return {
      total: base.length,
      planejadas,
      andamento,
      concluidas,
      atrasadas,
      custo,
      conclusao: base.length ? (concluidas / base.length) * 100 : 0,
    };
  }, [base]);

  // ------------------------------------------------------------ por categoria
  const porCategoria = useMemo(
    () =>
      CATEGORIAS.map((c) => ({
        label: c,
        valor: base.filter((a) => categoriaDoTipo(a.tipo_atividade) === c).length,
        cor: CATEGORIA_META[c].hex,
      })).filter((d) => d.valor > 0),
    [base]
  );

  // ----------------------------------------------------------------- por tipo
  const porTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    base.forEach((a) =>
      mapa.set(a.tipo_atividade, (mapa.get(a.tipo_atividade) ?? 0) + 1)
    );
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, valor]) => ({
        label,
        valor,
        cor: CATEGORIA_META[categoriaDoTipo(label)].hex,
        detalhe: categoriaDoTipo(label),
      }));
  }, [base]);

  // --------------------------------------------------------------- por talhão
  const porTalhao = useMemo(() => {
    const mapa = new Map<string, number>();
    base.forEach((a) => {
      const chave = `${a.codigo_talhao ?? a.id_talhao} · ${a.nome_talhao ?? ""}`.trim();
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, valor]) => ({ label, valor, cor: "#16a34a" }));
  }, [base]);

  // ---------------------------------------------------------------- por safra
  const porSafra = useMemo(() => {
    const mapa = new Map<string, number>();
    atividades.forEach((a) => {
      const chave = a.safra ?? "Sem safra";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    });
    return Array.from(mapa.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, valor], i) => ({
        label,
        valor,
        cor: PALETA_SAFRA[i % PALETA_SAFRA.length],
      }));
  }, [atividades]);

  // --------------------------------------------- custos operacionais por tipo
  const custosPorTipo = useMemo(() => {
    const mapa = new Map<string, number>();
    base.forEach((a) =>
      mapa.set(a.tipo_atividade, (mapa.get(a.tipo_atividade) ?? 0) + custoTotal(a))
    );
    return Array.from(mapa.entries())
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, valor]) => ({
        label,
        valor,
        cor: CATEGORIA_META[categoriaDoTipo(label)].hex,
      }));
  }, [base]);

  // ------------------------------------------------------- últimas atividades
  const ultimas = useMemo(
    () => [...base].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio)).slice(0, 6),
    [base]
  );

  const porStatus = useMemo(
    () =>
      STATUS_ATIVIDADE.map((s) => ({
        label: s,
        valor: base.filter((a) => a.status === s).length,
        cor: STATUS_ATIVIDADE_META[s].hex,
      })).filter((d) => d.valor > 0),
    [base]
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
        <StatCard icone="📋" titulo="Total de Atividades" valor={String(kpis.total)} tom="slate" descricao="no período selecionado" />
        <StatCard icone="🗓️" titulo="Planejadas" valor={String(kpis.planejadas)} tom="sky" descricao="aguardando execução" />
        <StatCard icone="⏳" titulo="Em Andamento" valor={String(kpis.andamento)} tom="amber" descricao="operações em campo" />
        <StatCard icone="✅" titulo="Concluídas" valor={String(kpis.concluidas)} tom="green" descricao={`${kpis.conclusao.toFixed(1)}% do total`} />
        <StatCard icone="⚠️" titulo="Atrasadas" valor={String(kpis.atrasadas)} tom="orange" descricao="prazo final vencido" />
        <StatCard icone="💰" titulo="Custo Operacional" valor={fmtMoeda(kpis.custo)} tom="lime" descricao="insumos, máquinas e serviços" />
      </div>

      {/* ------------------------------------------- Status + categoria + execução */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard titulo="Situação das Atividades" descricao="Distribuição por status operacional">
          <DonutChart
            dados={porStatus}
            legendaCentro="Atividades"
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard titulo="Atividades por Categoria" descricao="Preparo, plantio, tratos, irrigação e colheita">
          <DonutChart
            dados={porCategoria}
            legendaCentro="Categorias"
            valorCentro={String(porCategoria.length)}
            tamanho={150}
            espessura={26}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard titulo="Taxa de Execução" descricao="Atividades concluídas sobre o total planejado">
          <div className="pt-4">
            <Gauge
              percentual={kpis.conclusao}
              rotulo="concluídas"
              sublegenda={`${kpis.concluidas} de ${kpis.total} atividades`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{kpis.andamento}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">em andamento</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{kpis.atrasadas}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide">atrasadas</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ------------------------------------------------- Por tipo + por talhão */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard titulo="Atividades por Tipo" descricao="Operações mais executadas no período">
          <BarChart dados={porTipo} formatarValor={(v) => `${v}`} />
        </ChartCard>

        <ChartCard titulo="Atividades por Talhão" descricao="Intensidade operacional por área produtiva">
          <BarChart dados={porTalhao} formatarValor={(v) => `${v}`} />
        </ChartCard>
      </div>

      {/* --------------------------------------------- Por safra + custos por tipo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard titulo="Atividades por Safra" descricao="Volume operacional em cada ciclo agrícola">
          <DonutChart
            dados={porSafra}
            pizza={false}
            legendaCentro="atividades"
            valorCentro={String(atividades.length)}
            formatarValor={(v) => `${v}`}
          />
        </ChartCard>

        <ChartCard titulo="Custos Operacionais por Atividade" descricao="Somatório de insumos, máquinas e serviços">
          <BarChart dados={custosPorTipo} formatarValor={fmtMoeda} />
        </ChartCard>
      </div>

      {/* ------------------------------------------------------ Últimas atividades */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Últimas Atividades</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Registros mais recentes do histórico operacional
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold">Atividade</th>
                <th className="px-4 py-3 font-semibold">Talhão</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold">Período</th>
                <th className="px-4 py-3 font-semibold text-right">Custo</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ultimas.map((a) => {
                const cat = categoriaDoTipo(a.tipo_atividade);
                return (
                  <tr
                    key={a.id}
                    onClick={() => onVerAtividade(a)}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {CATEGORIA_META[cat].icone} {a.tipo_atividade}
                      </div>
                      <div className="text-xs text-gray-400">{cat}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {a.codigo_talhao ?? a.id_talhao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.responsavel ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmtData(a.data_inicio)} › {fmtData(a.data_fim)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-700">
                      {fmtMoeda(custoTotal(a))}
                    </td>
                    <td className="px-4 py-3">
                      <AtividadeStatusBadge status={a.status} atrasada={isAtrasada(a)} tamanho="sm" />
                    </td>
                  </tr>
                );
              })}
              {!ultimas.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Nenhuma atividade registrada para o filtro selecionado.
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
