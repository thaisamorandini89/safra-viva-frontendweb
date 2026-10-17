import { ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getEmpresas,
  getPropriedadesLista,
  getTalhoes,
  getAtividades,
  getSafras,
  getLancamentos,
  getInsumos,
  getMovimentacoes,
} from "../../services/api";
import { EmpresaAgricola } from "../../types/empresaAgricola";
import {
  AtividadeAgricola,
  isAtrasada,
  STATUS_ATIVIDADE_META,
  StatusAtividade,
} from "../../types/atividade";
import {
  Talhao,
  areaDisponivel,
  areaOcupada,
  STATUS_META,
  STATUS_TALHAO,
  StatusTalhao,
  fmtHa,
} from "../../types/talhao";
import {
  Insumo,
  MovimentacaoEstoque,
  abaixoMinimo,
  diasParaVencer,
  isProximoVencimento,
  isVencido,
  proximaValidade,
  situacaoEstoque,
  valorEstoque,
} from "../../types/insumo";
import {
  Lancamento,
  Safra,
  chaveMes,
  fmtData,
  fmtMoedaCurta,
  labelMes,
} from "../../types/financeiro";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import ChartCard from "../ui/ChartCard";
import StatusBadge from "../ui/StatusBadge";
import DonutChart from "../ui/charts/DonutChart";
import BarChart from "../ui/charts/BarChart";
import LineChart from "../ui/charts/LineChart";

// ---------------------------------------------------------------------------
// Perfis — a tela inicial é personalizada conforme o perfil do usuário.
// ---------------------------------------------------------------------------
type Perfil = "admin" | "agronomo" | "financeiro" | "proprietario";

const PERFIS: { id: Perfil; label: string; icone: string; descricao: string }[] = [
  { id: "admin", label: "Administrador", icone: "🛡️", descricao: "Visão completa da operação" },
  { id: "agronomo", label: "Agrônomo", icone: "🌱", descricao: "Talhões, culturas e atividades" },
  { id: "financeiro", label: "Financeiro", icone: "💰", descricao: "Fluxo de caixa, receitas e despesas" },
  { id: "proprietario", label: "Proprietário", icone: "📈", descricao: "Indicadores estratégicos e rentabilidade" },
];

/** Seções exibidas por perfil (admin enxerga tudo). */
const SECOES_POR_PERFIL: Record<Exclude<Perfil, "admin">, Set<string>> = {
  agronomo: new Set(["atalhos", "alertas", "atividades", "safras", "talhoes", "insumos", "mapa", "movimentacoes"]),
  financeiro: new Set(["atalhos", "alertas", "financeiro", "movimentacoes"]),
  proprietario: new Set(["alertas", "safras", "financeiro", "talhoes", "mapa"]),
};

const PERFIL_STORAGE_KEY = "safraviva:inicio:perfil";

const ATALHOS: { label: string; icone: string; tab: number; tom: string }[] = [
  { label: "Nova Atividade", icone: "🚜", tab: 3, tom: "text-amber-700 bg-amber-50 ring-amber-100" },
  { label: "Novo Talhão", icone: "🗂️", tab: 2, tom: "text-lime-700 bg-lime-50 ring-lime-100" },
  { label: "Nova Propriedade", icone: "🌿", tab: 1, tom: "text-green-700 bg-green-50 ring-green-100" },
  { label: "Novo Insumo", icone: "📦", tab: 4, tom: "text-sky-700 bg-sky-50 ring-sky-100" },
  { label: "Lançamento Financeiro", icone: "💰", tab: 5, tom: "text-emerald-700 bg-emerald-50 ring-emerald-100" },
  { label: "Nova Empresa", icone: "🏢", tab: 0, tom: "text-slate-700 bg-slate-100 ring-slate-200" },
];

const PALETA_CULTURA = ["#16a34a", "#f59e0b", "#0ea5e9", "#a855f7", "#f97316", "#84cc16", "#14b8a6"];

const num = (v: unknown) => Number(v || 0);

interface Props {
  onNavigate?: (tab: number) => void;
}

export default function InicioModule({ onNavigate }: Props) {
  const [perfil, setPerfil] = useState<Perfil>(() => {
    const salvo = typeof localStorage !== "undefined" ? localStorage.getItem(PERFIL_STORAGE_KEY) : null;
    return (PERFIS.some((p) => p.id === salvo) ? salvo : "admin") as Perfil;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PERFIL_STORAGE_KEY, perfil);
    } catch {
      /* ignora indisponibilidade do storage */
    }
  }, [perfil]);

  const ver = (secao: string) =>
    perfil === "admin" || SECOES_POR_PERFIL[perfil].has(secao);

  // --------------------------------------------------------------- dados
  useQuery<EmpresaAgricola[]>({ queryKey: ["empresas"], queryFn: getEmpresas });
  const propriedadesQuery = useQuery<any[]>({ queryKey: ["propriedades"], queryFn: getPropriedadesLista });
  const talhoesQuery = useQuery<Talhao[]>({ queryKey: ["talhoes"], queryFn: getTalhoes });
  const atividadesQuery = useQuery<AtividadeAgricola[]>({ queryKey: ["atividades"], queryFn: getAtividades });
  const safrasQuery = useQuery<Safra[]>({ queryKey: ["financeiro-safras"], queryFn: () => getSafras() });
  const lancamentosQuery = useQuery<Lancamento[]>({ queryKey: ["financeiro-lancamentos"], queryFn: () => getLancamentos() });
  const insumosQuery = useQuery<Insumo[]>({ queryKey: ["insumos"], queryFn: getInsumos });
  const movimentacoesQuery = useQuery<MovimentacaoEstoque[]>({ queryKey: ["insumos-movimentacoes"], queryFn: getMovimentacoes });

  const propriedades = propriedadesQuery.data ?? [];
  const talhoes = talhoesQuery.data ?? [];
  const atividades = atividadesQuery.data ?? [];
  const safras = safrasQuery.data ?? [];
  const lancamentos = lancamentosQuery.data ?? [];
  const insumos = insumosQuery.data ?? [];
  const movimentacoes = movimentacoesQuery.data ?? [];

  const carregando =
    talhoesQuery.isLoading ||
    atividadesQuery.isLoading ||
    lancamentosQuery.isLoading ||
    insumosQuery.isLoading;

  // ----------------------------------------------------------- safra atual
  const safraAtual = useMemo(() => {
    const ativas = safras.filter((s) => s.status !== false);
    const base = ativas.length ? ativas : safras;
    return [...base].sort((a, b) => (b.data_inicio || "").localeCompare(a.data_inicio || ""))[0];
  }, [safras]);

  // --------------------------------------------------------- responsáveis
  const responsaveis = useMemo(() => {
    const set = new Set<string>();
    atividades.forEach((a) => a.responsavel && set.add(a.responsavel));
    movimentacoes.forEach((m) => m.responsavel && set.add(m.responsavel));
    return set;
  }, [atividades, movimentacoes]);

  const equipeMaisAtiva = useMemo(() => {
    const mapa = new Map<string, number>();
    atividades.forEach((a) => {
      if (!a.responsavel) return;
      mapa.set(a.responsavel, (mapa.get(a.responsavel) ?? 0) + 1);
    });
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, total]) => ({ nome, total }));
  }, [atividades]);

  // --------------------------------------------------------------- talhões
  const historicoAtual = useMemo(
    () =>
      talhoes.flatMap((t) =>
        (t.historico ?? [])
          .filter((h) => !h.data_colheita)
          .map((h) => ({ ...h, talhao: t }))
      ),
    [talhoes]
  );

  const areaCultivada = useMemo(
    () => talhoes.reduce((s, t) => s + areaOcupada(t), 0),
    [talhoes]
  );
  const areaDisponivelTotal = useMemo(
    () => talhoes.reduce((s, t) => s + areaDisponivel(t), 0),
    [talhoes]
  );

  const totalPropriedades = useMemo(() => {
    if (propriedades.length) return propriedades.length;
    return new Set(talhoes.map((t) => t.id_propriedade)).size;
  }, [propriedades, talhoes]);

  const distribuicaoCultura = useMemo(() => {
    const mapa = new Map<string, number>();
    historicoAtual.forEach((h) => {
      if (!h.cultura) return;
      mapa.set(h.cultura, (mapa.get(h.cultura) ?? 0) + num(h.area_plantada));
    });
    if (mapa.size === 0) {
      safras.forEach((s) => {
        if (!s.cultura) return;
        mapa.set(s.cultura, (mapa.get(s.cultura) ?? 0) + num(s.area_plantada));
      });
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({ label, valor, cor: PALETA_CULTURA[i % PALETA_CULTURA.length] }));
  }, [historicoAtual, safras]);

  const culturasEmProducao = distribuicaoCultura.length;

  const statusTalhoes = useMemo(() => {
    const mapa = new Map<StatusTalhao, number>();
    talhoes.forEach((t) => mapa.set(t.status, (mapa.get(t.status) ?? 0) + 1));
    return STATUS_TALHAO.map((status) => ({
      label: status,
      valor: mapa.get(status) ?? 0,
      cor: STATUS_META[status].hex,
    })).filter((d) => d.valor > 0);
  }, [talhoes]);

  const culturaPorTalhao = useMemo(() => {
    const mapa = new Map<string, string>();
    historicoAtual.forEach((h) => mapa.set(h.talhao.id, h.cultura));
    return mapa;
  }, [historicoAtual]);

  const talhoesTabela = useMemo(() => [...talhoes].slice(0, 6), [talhoes]);

  // ------------------------------------------------------------ atividades
  const atividadesResumo = useMemo(() => {
    const porStatus = (status: StatusAtividade) =>
      atividades.filter((a) => a.status === status).length;
    return {
      planejadas: porStatus("Planejada"),
      andamento: porStatus("Em Andamento"),
      concluidas: porStatus("Concluída"),
      atrasadas: atividades.filter(isAtrasada).length,
    };
  }, [atividades]);

  const atividadesRecentes = useMemo(
    () => [...atividades].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio)).slice(0, 5),
    [atividades]
  );

  // ------------------------------------------------------------- financeiro
  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const hojeISO = agora.toISOString().slice(0, 10);

  const financeiro = useMemo(() => {
    const mesesComDados = [...new Set(lancamentos.map((l) => chaveMes(l.data_lancamento)))]
      .filter(Boolean)
      .sort()
      .reverse();
    const mesRef = mesesComDados.includes(mesAtual) ? mesAtual : mesesComDados[0] ?? mesAtual;

    const soma = (tipo: Lancamento["tipo"], chave?: string) =>
      lancamentos
        .filter((l) => l.tipo === tipo && (!chave || chaveMes(l.data_lancamento) === chave))
        .reduce((s, l) => s + num(l.valor), 0);

    const receitaMes = soma("RECEITA", mesRef);
    const despesaMes = soma("DESPESA", mesRef);

    return {
      mesRef,
      ehMesAtual: mesRef === mesAtual,
      receitaMes,
      despesaMes,
      resultadoMes: receitaMes - despesaMes,
      receitaTotal: soma("RECEITA"),
      despesaTotal: soma("DESPESA"),
    };
  }, [lancamentos, mesAtual]);

  const serieFinanceira = useMemo(() => {
    const meses: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const receita = new Map<string, number>();
    const despesa = new Map<string, number>();
    lancamentos.forEach((l) => {
      const chave = chaveMes(l.data_lancamento);
      const alvo = l.tipo === "RECEITA" ? receita : despesa;
      alvo.set(chave, (alvo.get(chave) ?? 0) + num(l.valor));
    });
    const emMil = (m: string, mapa: Map<string, number>) => Math.round((mapa.get(m) ?? 0) / 1000);
    return {
      categorias: meses.map(labelMes),
      series: [
        { nome: "Receita", cor: "#16a34a", pontos: meses.map((m) => ({ x: labelMes(m), y: emMil(m, receita) })) },
        { nome: "Despesa", cor: "#dc2626", pontos: meses.map((m) => ({ x: labelMes(m), y: emMil(m, despesa) })) },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentos]);

  const custosPorCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    lancamentos
      .filter((l) => l.tipo === "DESPESA")
      .forEach((l) => mapa.set(l.categoria, (mapa.get(l.categoria) ?? 0) + num(l.valor)));
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, valor]) => ({ label, valor }));
  }, [lancamentos]);

  // --------------------------------------------------------------- insumos
  const insumosResumo = useMemo(() => {
    const baixo = insumos.filter(abaixoMinimo);
    const vencendo = insumos.filter((i) => isProximoVencimento(i));
    const vencidos = insumos.filter(isVencido);
    const valorTotal = insumos.reduce((s, i) => s + valorEstoque(i), 0);
    return { total: insumos.length, baixo, vencendo, vencidos, valorTotal };
  }, [insumos]);

  // ----------------------------------------------------------- alertas
  const alertas = useMemo(() => {
    const operacionais: string[] = [];
    atividades.filter(isAtrasada).forEach((a) =>
      operacionais.push(`Atividade atrasada: ${a.tipo_atividade} · ${a.nome_talhao || a.codigo_talhao || "talhão"}`)
    );
    talhoes.filter((t) => t.status === "Livre").forEach((t) =>
      operacionais.push(`Talhão sem planejamento: ${t.nome}`)
    );
    talhoes.filter((t) => t.status === "Colheita").forEach((t) =>
      operacionais.push(`Safra pronta para colheita: ${t.nome}`)
    );

    const financeiros: string[] = [];
    lancamentos
      .filter((l) => l.status === "PENDENTE")
      .forEach((l) => {
        const vencida = l.data_lancamento < hojeISO;
        financeiros.push(
          `${vencida ? "Conta vencida" : "Conta a pagar"}: ${l.categoria} · ${fmtMoedaCurta(num(l.valor))}`
        );
      });

    const estoque: string[] = [];
    insumosResumo.baixo.forEach((i) =>
      estoque.push(`Estoque mínimo atingido: ${i.nome} (${i.estoque_atual} ${i.unidade_medida})`)
    );
    insumosResumo.vencidos.forEach((i) => estoque.push(`Produto vencido: ${i.nome}`));
    insumosResumo.vencendo.forEach((i) => {
      const dias = diasParaVencer(proximaValidade(i));
      estoque.push(`Vence em ${dias} dias: ${i.nome}`);
    });

    return { operacionais, financeiros, estoque };
  }, [atividades, talhoes, lancamentos, insumosResumo, hojeISO]);

  const totalAlertas =
    alertas.operacionais.length + alertas.financeiros.length + alertas.estoque.length;

  // ------------------------------------------ últimas movimentações do sistema
  const movimentacoesSistema = useMemo(() => {
    const itens: { data: string; usuario: string; acao: string; icone: string }[] = [];
    atividades.forEach((a) =>
      itens.push({
        data: a.data_inicio,
        usuario: a.responsavel || "—",
        acao: `${a.tipo_atividade} · ${a.nome_talhao || a.codigo_talhao || "talhão"}`,
        icone: "🚜",
      })
    );
    movimentacoes.forEach((m) =>
      itens.push({
        data: m.data_movimentacao,
        usuario: m.responsavel || "—",
        acao: `${m.tipo} de ${m.nome_insumo || "insumo"}`,
        icone: m.tipo === "Entrada" ? "📥" : "📤",
      })
    );
    lancamentos.forEach((l) =>
      itens.push({
        data: l.data_lancamento,
        usuario: "Financeiro",
        acao: `${l.tipo === "RECEITA" ? "Receita" : "Despesa"} · ${l.categoria}`,
        icone: l.tipo === "RECEITA" ? "💵" : "🧾",
      })
    );
    return itens
      .filter((i) => i.data)
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 8);
  }, [atividades, movimentacoes, lancamentos]);

  // --------------------------------------------------------------- KPI cards
  const refMesLabel = financeiro.ehMesAtual
    ? "Acumulado no mês"
    : `Referente a ${labelMes(financeiro.mesRef)}`;

  type Kpi = {
    chave: string;
    icone: string;
    titulo: string;
    valor: string;
    sufixo?: string;
    descricao: string;
    tom: "green" | "sky" | "amber" | "orange" | "slate" | "lime";
  };

  const kpisOperacionais: Kpi[] = [
    { chave: "propriedades", icone: "🌿", titulo: "Propriedades", valor: String(totalPropriedades), descricao: "ativas no sistema", tom: "green" },
    { chave: "talhoes", icone: "🗂️", titulo: "Talhões", valor: String(talhoes.length), descricao: "áreas produtivas", tom: "lime" },
    { chave: "area", icone: "🌾", titulo: "Área Cultivada", valor: fmtHa(areaCultivada, 0), sufixo: "ha", descricao: "plantada na safra atual", tom: "orange" },
    { chave: "funcionarios", icone: "👥", titulo: "Funcionários Ativos", valor: String(responsaveis.size), descricao: "com atividades vinculadas", tom: "sky" },
    { chave: "safra", icone: "📅", titulo: "Safra Atual", valor: safraAtual?.nome ?? "—", descricao: safraAtual?.cultura ?? "em andamento", tom: "slate" },
  ];

  const kpisFinanceiros: Kpi[] = [
    { chave: "receita", icone: "⬆️", titulo: "Receita do Mês", valor: fmtMoedaCurta(financeiro.receitaMes), descricao: refMesLabel, tom: "green" },
    { chave: "despesa", icone: "⬇️", titulo: "Despesas do Mês", valor: fmtMoedaCurta(financeiro.despesaMes), descricao: refMesLabel, tom: "orange" },
    { chave: "resultado", icone: "💹", titulo: "Resultado", valor: fmtMoedaCurta(financeiro.resultadoMes), descricao: financeiro.resultadoMes >= 0 ? "lucro operacional" : "prejuízo operacional", tom: financeiro.resultadoMes >= 0 ? "green" : "orange" },
  ];

  const kpis =
    perfil === "financeiro"
      ? [kpisOperacionais[0], ...kpisFinanceiros]
      : perfil === "agronomo"
      ? kpisOperacionais
      : [...kpisOperacionais, ...kpisFinanceiros];

  const perfilAtual = PERFIS.find((p) => p.id === perfil)!;
  const irPara = (tab: number) => onNavigate?.(tab);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <TopBar breadcrumb="Gestão Agrícola" page="Início" />

      <main className="px-5 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <PageHeader
              title="Painel Inicial"
              description="Visão consolidada e em tempo real da sua operação agrícola."
            />
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">Perfil de visualização</label>
              <select
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as Perfil)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                {PERFIS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icone} {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="-mt-2 text-xs text-gray-400">
            {perfilAtual.icone} {perfilAtual.label} · {perfilAtual.descricao}
          </p>

          {carregando ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              <p className="text-sm">Carregando indicadores...</p>
            </div>
          ) : (
            <>
              {/* ------------------------------------------------- KPIs */}
              <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <StatCard
                    key={kpi.chave}
                    icone={kpi.icone}
                    titulo={kpi.titulo}
                    valor={kpi.valor}
                    sufixo={kpi.sufixo}
                    descricao={kpi.descricao}
                    tom={kpi.tom}
                  />
                ))}
              </section>

              {/* ------------------------------------------- Atalhos rápidos */}
              {ver("atalhos") && (
                <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-gray-800">Atalhos rápidos</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {ATALHOS.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => irPara(a.tab)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-3 text-center transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
                      >
                        <span className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ring-4 ${a.tom}`}>
                          {a.icone}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* ------------------------------------------ Central de Alertas */}
              {ver("alertas") && (
                <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800">Central de Alertas</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        totalAlertas ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                      }`}
                    >
                      {totalAlertas ? `${totalAlertas} alertas` : "Tudo em ordem"}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <PainelAlerta titulo="Operacionais" icone="⚙️" tom="sky" itens={alertas.operacionais} />
                    <PainelAlerta titulo="Financeiros" icone="💰" tom="amber" itens={alertas.financeiros} />
                    <PainelAlerta titulo="Estoque" icone="📦" tom="red" itens={alertas.estoque} />
                  </div>
                </section>
              )}

              {/* -------------------------------------------- Painel Atividades */}
              {ver("atividades") && (
                <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800">Painel de Atividades</h2>
                    <button onClick={() => irPara(3)} className="text-xs font-semibold text-green-700 hover:text-green-900">
                      Ver atividades →
                    </button>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MiniKpi label="Planejadas" valor={atividadesResumo.planejadas} tom="sky" />
                    <MiniKpi label="Em andamento" valor={atividadesResumo.andamento} tom="amber" />
                    <MiniKpi label="Concluídas" valor={atividadesResumo.concluidas} tom="green" />
                    <MiniKpi label="Atrasadas" valor={atividadesResumo.atrasadas} tom="red" />
                  </div>
                  <Tabela
                    colunas={["Atividade", "Talhão", "Responsável", "Status"]}
                    vazio="Nenhuma atividade registrada."
                    linhas={atividadesRecentes.map((a) => [
                      a.tipo_atividade,
                      a.nome_talhao || a.codigo_talhao || "—",
                      a.responsavel || "—",
                      <span
                        key={a.id}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_ATIVIDADE_META[a.status].badge}`}
                      >
                        {STATUS_ATIVIDADE_META[a.status].icone} {a.status}
                      </span>,
                    ])}
                  />
                </section>
              )}

              {/* ----------------------------- Painel de Safras + Talhões */}
              {(ver("safras") || ver("talhoes")) && (
                <section className="grid gap-4 lg:grid-cols-2">
                  {ver("safras") && (
                    <ChartCard titulo="Painel de Safras" descricao="Distribuição da área por cultura">
                      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniKpi label="Safras ativas" valor={safras.filter((s) => s.status !== false).length} tom="green" />
                        <MiniKpi label="Área plantada" valor={`${fmtHa(areaCultivada, 0)} ha`} tom="orange" />
                        <MiniKpi label="Área disponível" valor={`${fmtHa(areaDisponivelTotal, 0)} ha`} tom="slate" />
                        <MiniKpi label="Culturas" valor={culturasEmProducao} tom="lime" />
                      </div>
                      <DonutChart
                        dados={distribuicaoCultura}
                        legendaCentro="Culturas"
                        formatarValor={(v) => `${fmtHa(v, 0)} ha`}
                      />
                    </ChartCard>
                  )}

                  {ver("talhoes") && (
                    <ChartCard titulo="Painel de Talhões" descricao="Status atual das áreas produtivas">
                      <DonutChart dados={statusTalhoes} legendaCentro="Talhões" />
                      <div className="mt-4">
                        <Tabela
                          colunas={["Talhão", "Cultura", "Área", "Status"]}
                          vazio="Nenhum talhão cadastrado."
                          linhas={talhoesTabela.map((t) => [
                            t.nome,
                            culturaPorTalhao.get(t.id) || "—",
                            `${fmtHa(num(t.area_total), 0)} ha`,
                            <StatusBadge key={t.id} status={t.status} tamanho="sm" />,
                          ])}
                        />
                      </div>
                    </ChartCard>
                  )}
                </section>
              )}

              {/* -------------------------------------------- Painel Financeiro */}
              {ver("financeiro") && (
                <section className="grid gap-4 lg:grid-cols-2">
                  <ChartCard titulo="Receita x Despesa" descricao="Evolução mensal (valores em R$ mil)">
                    <div className="mb-3 grid grid-cols-3 gap-3">
                      <MiniKpi label="Receita (12m)" valor={fmtMoedaCurta(financeiro.receitaTotal)} tom="green" />
                      <MiniKpi label="Despesa (12m)" valor={fmtMoedaCurta(financeiro.despesaTotal)} tom="orange" />
                      <MiniKpi
                        label="Lucro (12m)"
                        valor={fmtMoedaCurta(financeiro.receitaTotal - financeiro.despesaTotal)}
                        tom={financeiro.receitaTotal - financeiro.despesaTotal >= 0 ? "green" : "red"}
                      />
                    </div>
                    <LineChart series={serieFinanceira.series} categorias={serieFinanceira.categorias} sufixo=" mil" />
                  </ChartCard>

                  <ChartCard titulo="Custos por Categoria" descricao="Maiores despesas acumuladas">
                    <BarChart dados={custosPorCategoria} formatarValor={(v) => fmtMoedaCurta(v)} />
                  </ChartCard>
                </section>
              )}

              {/* ---------------------------------------------- Painel Insumos */}
              {ver("insumos") && (
                <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800">Painel de Insumos</h2>
                    <button onClick={() => irPara(4)} className="text-xs font-semibold text-green-700 hover:text-green-900">
                      Ver estoque →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MiniKpi label="Total de itens" valor={insumosResumo.total} tom="sky" />
                    <MiniKpi label="Estoque baixo" valor={insumosResumo.baixo.length} tom="amber" />
                    <MiniKpi label="Próx. vencimento" valor={insumosResumo.vencendo.length} tom="orange" />
                    <MiniKpi label="Valor em estoque" valor={fmtMoedaCurta(insumosResumo.valorTotal)} tom="green" />
                  </div>
                  {(insumosResumo.baixo.length > 0 || insumosResumo.vencendo.length > 0) && (
                    <ul className="mt-4 space-y-1.5">
                      {[...insumosResumo.baixo.slice(0, 3), ...insumosResumo.vencendo.slice(0, 3)]
                        .slice(0, 5)
                        .map((i) => (
                          <li key={i.id} className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{situacaoEstoque(i) !== "Normal" ? "⚠️" : "⏳"}</span>
                            <span className="font-medium text-gray-700">{i.nome}</span>
                            <span className="text-xs text-gray-400">
                              {situacaoEstoque(i) !== "Normal"
                                ? `${i.estoque_atual} ${i.unidade_medida} (mín. ${i.estoque_minimo})`
                                : `vence em ${diasParaVencer(proximaValidade(i))} dias`}
                            </span>
                          </li>
                        ))}
                    </ul>
                  )}
                </section>
              )}

              {/* ---------------------- Funcionários + Movimentações do sistema */}
              {(ver("movimentacoes") || perfil === "admin") && (
                <section className="grid gap-4 lg:grid-cols-2">
                  {perfil === "admin" && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <h2 className="mb-4 text-sm font-bold text-gray-800">Painel de Funcionários</h2>
                      <div className="mb-4 grid grid-cols-2 gap-3">
                        <MiniKpi label="Ativos" valor={responsaveis.size} tom="green" />
                        <MiniKpi label="Equipe no período" valor={equipeMaisAtiva.length} tom="sky" />
                      </div>
                      <Tabela
                        colunas={["Funcionário", "Atividades"]}
                        vazio="Nenhum responsável vinculado."
                        linhas={equipeMaisAtiva.map((e) => [e.nome, String(e.total)])}
                      />
                    </div>
                  )}

                  {ver("movimentacoes") && (
                    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                      <h2 className="mb-4 text-sm font-bold text-gray-800">Últimas Movimentações</h2>
                      <ul className="space-y-2.5">
                        {movimentacoesSistema.length === 0 && (
                          <li className="text-sm text-gray-400">Nenhuma movimentação recente.</li>
                        )}
                        {movimentacoesSistema.map((m, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm">
                            <span className="text-base">{m.icone}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-gray-700">{m.acao}</p>
                              <p className="text-xs text-gray-400">{m.usuario}</p>
                            </div>
                            <span className="shrink-0 text-xs text-gray-400">{fmtData(m.data)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* ------------------------------------------ Mapa resumido */}
              {ver("mapa") && (
                <section className="overflow-hidden rounded-xl border border-green-100 bg-gradient-to-br from-green-700 to-green-900 p-6 text-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold">🗺️ Mapa da Fazenda</h2>
                      <p className="mt-1 text-sm text-green-100">
                        Visualize propriedades, talhões e áreas cultivadas no mapa.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-6">
                        <div>
                          <p className="text-2xl font-bold">{totalPropriedades}</p>
                          <p className="text-xs text-green-200">Propriedades</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{talhoes.length}</p>
                          <p className="text-xs text-green-200">Talhões</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {fmtHa(areaCultivada, 0)} <span className="text-sm font-semibold">ha</span>
                          </p>
                          <p className="text-xs text-green-200">Área cultivada</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-6xl opacity-80">🧭</div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componentes auxiliares
// ---------------------------------------------------------------------------
const TONS_MINI: Record<string, string> = {
  green: "text-green-700 bg-green-50",
  sky: "text-sky-700 bg-sky-50",
  amber: "text-amber-700 bg-amber-50",
  orange: "text-orange-700 bg-orange-50",
  red: "text-red-600 bg-red-50",
  lime: "text-lime-700 bg-lime-50",
  slate: "text-slate-700 bg-slate-100",
};

function MiniKpi({ label, valor, tom = "green" }: { label: string; valor: number | string; tom?: string }) {
  return (
    <div className={`rounded-lg px-3 py-2.5 ${TONS_MINI[tom] ?? TONS_MINI.green}`}>
      <p className="text-lg font-bold leading-tight">{valor}</p>
      <p className="text-[11px] font-semibold opacity-80">{label}</p>
    </div>
  );
}

const TONS_ALERTA: Record<string, { head: string; dot: string }> = {
  sky: { head: "text-sky-700", dot: "bg-sky-500" },
  amber: { head: "text-amber-700", dot: "bg-amber-500" },
  red: { head: "text-red-600", dot: "bg-red-500" },
};

function PainelAlerta({
  titulo,
  icone,
  tom,
  itens,
}: {
  titulo: string;
  icone: string;
  tom: "sky" | "amber" | "red";
  itens: string[];
}) {
  const t = TONS_ALERTA[tom];
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${t.head}`}>
        <span>{icone}</span>
        {titulo}
        <span className="ml-auto rounded-full bg-gray-100 px-1.5 text-[11px] text-gray-500">{itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <p className="text-xs text-gray-400">Sem alertas.</p>
      ) : (
        <ul className="space-y-1.5">
          {itens.slice(0, 5).map((texto, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
              <span>{texto}</span>
            </li>
          ))}
          {itens.length > 5 && (
            <li className="text-[11px] font-semibold text-gray-400">+{itens.length - 5} outros</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Tabela({
  colunas,
  linhas,
  vazio,
}: {
  colunas: string[];
  linhas: ReactNode[][];
  vazio: string;
}) {
  if (linhas.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">{vazio}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            {colunas.map((c) => (
              <th key={c} className="py-2 pr-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              {linha.map((celula, j) => (
                <td key={j} className="py-2.5 pr-3 text-gray-600">
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
