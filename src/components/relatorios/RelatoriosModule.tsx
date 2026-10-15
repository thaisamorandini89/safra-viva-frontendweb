import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAtividades,
  getEmpresas,
  getInsumos,
  getLancamentos,
  getMovimentacoes,
  getPropriedadesLista,
  getSafras,
  getTalhoes,
} from "../../services/api";
import { AtividadeAgricola } from "../../types/atividade";
import { EmpresaAgricola } from "../../types/empresaAgricola";
import { Lancamento, Safra, fmtMoeda } from "../../types/financeiro";
import { Insumo, MovimentacaoEstoque } from "../../types/insumo";
import { areaDisponivel, areaOcupada, Talhao } from "../../types/talhao";
import ChartCard from "../ui/ChartCard";
import BarChart from "../ui/charts/BarChart";
import LineChart from "../ui/charts/LineChart";
import PageHeader from "../ui/PageHeader";
import TopBar from "../layout/TopBar";

type ReportId =
  | "executivo"
  | "atividades"
  | "talhoes"
  | "safras"
  | "financeiro"
  | "estoque"
  | "consumo"
  | "validade"
  | "funcionarios";

interface PropriedadeRelatorio {
  id_propriedade?: number | string;
  id_empresa?: number | string;
  nome_propriedade?: string;
  area_total?: number | string;
  area_agricultavel?: number | string;
}

interface SafraAtividade {
  value: string;
  label: string;
  idPropriedade?: string;
  cultura?: string;
}

interface Filtros {
  empresa: string;
  propriedade: string;
  talhao: string;
  safra: string;
  cultura: string;
  funcionario: string;
  dataInicio: string;
  dataFim: string;
}

interface TabelaRelatorio {
  colunas: string[];
  linhas: Array<Array<string | number | null>>;
}

const OPCOES_RELATORIO: {
  id: ReportId;
  titulo: string;
  grupo: string;
  icone: string;
  descricao: string;
}[] = [
  {
    id: "executivo",
    titulo: "Visão consolidada",
    grupo: "Gerencial",
    icone: "📊",
    descricao: "Empresas, propriedades, áreas e resultado financeiro.",
  },
  {
    id: "atividades",
    titulo: "Atividades agrícolas",
    grupo: "Operacional",
    icone: "🚜",
    descricao: "Operações em campo, responsáveis, status e custo informado.",
  },
  {
    id: "talhoes",
    titulo: "Utilização dos talhões",
    grupo: "Operacional",
    icone: "🗺️",
    descricao: "Área total, ocupada e livre por talhão.",
  },
  {
    id: "safras",
    titulo: "Safras e produtividade",
    grupo: "Agronômico",
    icone: "🌾",
    descricao: "Histórico de culturas, área plantada e produtividade em sc/ha.",
  },
  {
    id: "financeiro",
    titulo: "Demonstrativo financeiro",
    grupo: "Financeiro",
    icone: "💰",
    descricao: "Receitas e despesas detalhadas por lançamento.",
  },
  {
    id: "estoque",
    titulo: "Estoque atual",
    grupo: "Estoque",
    icone: "📦",
    descricao: "Saldo, unidade, valor estimado e nível mínimo dos insumos.",
  },
  {
    id: "consumo",
    titulo: "Consumo de insumos",
    grupo: "Estoque",
    icone: "🧪",
    descricao: "Saídas de estoque rastreadas por talhão, safra e responsável.",
  },
  {
    id: "validade",
    titulo: "Validade de lotes",
    grupo: "Estoque",
    icone: "⏳",
    descricao: "Lotes vencidos ou próximos ao vencimento.",
  },
  {
    id: "funcionarios",
    titulo: "Atividades por funcionário",
    grupo: "Pessoas",
    icone: "👷",
    descricao: "Quantidade de atividades e custos associados por responsável.",
  },
];

const dataLocalISO = (data: Date) =>
  [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
const hoje = dataLocalISO(new Date());
const inicioAno = `${new Date().getFullYear()}-01-01`;
const filtrosIniciais: Filtros = {
  empresa: "",
  propriedade: "",
  talhao: "",
  safra: "",
  cultura: "",
  funcionario: "",
  dataInicio: inicioAno,
  dataFim: hoje,
};
const PAGE_SIZE = 12;
const MS_DIA = 86_400_000;

const idString = (value: number | string | null | undefined) =>
  value == null ? "" : String(value);

const numero = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatarData = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-BR");
};

const filtroPeriodo = (data: string | null | undefined, filtros: Filtros) => {
  if (!data) return false;
  const dia = data.slice(0, 10);
  return (!filtros.dataInicio || dia >= filtros.dataInicio) &&
    (!filtros.dataFim || dia <= filtros.dataFim);
};

const downloadBlob = (blob: Blob, nome: string) => {
  // Edge/IE legados expõem msSaveOrOpenBlob e ignoram o <a download>.
  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (blob: Blob, nome: string) => boolean;
  };
  if (typeof nav.msSaveOrOpenBlob === "function") {
    nav.msSaveOrOpenBlob(blob, nome);
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  // Remover o elemento ou revogar a URL no mesmo tick do clique pode cancelar
  // o download em alguns navegadores; a limpeza é adiada.
  link.click();
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 10_000);
};

const valorCelula = (coluna: string, valor: string | number | null) => {
  if (valor == null || valor === "") return "—";
  if (["Receita", "Despesa", "Lucro Líquido", "Valor em Estoque", "Custo", "Valor Unitário"].includes(coluna)) {
    return fmtMoeda(numero(valor));
  }
  if (["Área Total (ha)", "Área Ocupada (ha)", "Área Livre (ha)", "Área Plantada (ha)", "Área em Colheita (ha)"].includes(coluna)) {
    return `${numero(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`;
  }
  if (coluna === "Produtividade (sc/ha)") {
    return `${numero(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} sc/ha`;
  }
  if (coluna === "Dias até vencer") {
    return numero(valor) < 0 ? `Vencido há ${Math.abs(numero(valor))} dias` : `${valor} dias`;
  }
  return String(valor);
};

export default function RelatoriosModule() {
  const [relatorio, setRelatorio] = useState<ReportId>("executivo");
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(filtrosIniciais);
  const [pagina, setPagina] = useState(1);
  const [erroFiltros, setErroFiltros] = useState("");
  const [erroExportacao, setErroExportacao] = useState("");
  const [statusExportacao, setStatusExportacao] = useState("");

  // Pré-carrega as bibliotecas de exportação para que o clique dispare o
  // download de imediato, sem esperar o import dinâmico (o que poderia fazer o
  // navegador descartar a ativação do usuário e bloquear o download).
  useEffect(() => {
    import("exceljs").catch(() => undefined);
    import("jspdf").catch(() => undefined);
    import("jspdf-autotable").catch(() => undefined);
  }, []);

  const empresasQuery = useQuery<EmpresaAgricola[]>({
    queryKey: ["empresas"],
    queryFn: getEmpresas,
  });
  const propriedadesQuery = useQuery<PropriedadeRelatorio[]>({
    queryKey: ["propriedades"],
    queryFn: getPropriedadesLista,
  });
  const talhoesQuery = useQuery<Talhao[]>({
    queryKey: ["talhoes"],
    queryFn: getTalhoes,
  });
  const atividadesQuery = useQuery<AtividadeAgricola[]>({
    queryKey: ["atividades"],
    queryFn: getAtividades,
  });
  const safrasQuery = useQuery<Safra[]>({
    queryKey: ["financeiro-safras"],
    queryFn: () => getSafras(),
  });
  const lancamentosQuery = useQuery<Lancamento[]>({
    queryKey: ["financeiro-lancamentos"],
    queryFn: () => getLancamentos(),
  });
  const insumosQuery = useQuery<Insumo[]>({
    queryKey: ["insumos"],
    queryFn: getInsumos,
  });
  const movimentacoesQuery = useQuery<MovimentacaoEstoque[]>({
    queryKey: ["insumos-movimentacoes"],
    queryFn: getMovimentacoes,
  });

  const empresas = empresasQuery.data ?? [];
  const propriedades = propriedadesQuery.data ?? [];
  const talhoes = talhoesQuery.data ?? [];
  const atividades = atividadesQuery.data ?? [];
  const safras = safrasQuery.data ?? [];
  const lancamentos = lancamentosQuery.data ?? [];
  const insumos = insumosQuery.data ?? [];
  const movimentacoes = movimentacoesQuery.data ?? [];

  const safrasAtividade = useMemo<SafraAtividade[]>(() => {
    const mapa = new Map<string, SafraAtividade>();
    for (const safra of safras) {
      const value = idString(safra.id_safra);
      mapa.set(value, {
        value,
        label: safra.nome,
        idPropriedade: idString(safra.id_propriedade),
        cultura: safra.cultura,
      });
    }
    for (const atividade of atividades) {
      if (!atividade.id_safra || mapa.has(atividade.id_safra)) continue;
      mapa.set(atividade.id_safra, {
        value: atividade.id_safra,
        label: atividade.safra || atividade.id_safra,
        idPropriedade: idString(atividade.id_propriedade),
      });
    }
    for (const lancamento of lancamentos) {
      const value = idString(lancamento.id_safra);
      if (!value || mapa.has(value)) continue;
      mapa.set(value, {
        value,
        label: lancamento.nome_safra || value,
        idPropriedade: idString(lancamento.id_propriedade),
        cultura: lancamento.cultura ?? undefined,
      });
    }
    return [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [atividades, lancamentos, safras]);

  const opcoesTalhao = useMemo(() => {
    const mapa = new Map<
      string,
      { label: string; idPropriedade?: string }
    >();
    talhoes.forEach((talhao) =>
      mapa.set(talhao.id, {
        label: talhao.nome,
        idPropriedade: idString(talhao.id_propriedade),
      })
    );
    atividades.forEach((atividade) => {
      if (atividade.id_talhao) {
        mapa.set(
          atividade.id_talhao,
          {
            label:
              atividade.nome_talhao ||
              atividade.codigo_talhao ||
              atividade.id_talhao,
            idPropriedade: idString(atividade.id_propriedade),
          }
        );
      }
    });
    movimentacoes.forEach((movimento) => {
      if (movimento.id_talhao) {
        mapa.set(
          movimento.id_talhao,
          {
            label:
              movimento.nome_talhao ||
              movimento.codigo_talhao ||
              movimento.id_talhao,
            idPropriedade: idString(
              insumos.find((insumo) => insumo.id === movimento.id_insumo)
                ?.id_propriedade
            ),
          }
        );
      }
    });
    return [...mapa.entries()].map(([value, option]) => ({
      value,
      label: option.label,
      idPropriedade: option.idPropriedade,
    }));
  }, [atividades, insumos, movimentacoes, talhoes]);

  const opcoesCultura = useMemo(() => {
    const culturas = new Set<string>();
    safrasAtividade.forEach((safra) => safra.cultura && culturas.add(safra.cultura));
    talhoes.forEach((talhao) =>
      talhao.historico?.forEach((item) => item.cultura && culturas.add(item.cultura))
    );
    lancamentos.forEach((lancamento) => lancamento.cultura && culturas.add(lancamento.cultura));
    return [...culturas].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [lancamentos, safrasAtividade, talhoes]);

  const opcoesFuncionario = useMemo(() => {
    const nomes = new Set<string>();
    atividades.forEach((atividade) => atividade.responsavel && nomes.add(atividade.responsavel));
    movimentacoes.forEach((movimento) => movimento.responsavel && nomes.add(movimento.responsavel));
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [atividades, movimentacoes]);

  const talhoesFiltrados = talhoes.filter((talhao) => {
    const historicos = talhao.historico ?? [];
    const vinculoSafraOuCultura =
      (!filtrosAplicados.safra && !filtrosAplicados.cultura) ||
      historicos.some((historico) => {
        const safraAssociada = safrasAtividade.find(
          (safra) =>
            safra.value === filtrosAplicados.safra ||
            safra.label === filtrosAplicados.safra
        );
        return (
          (!filtrosAplicados.safra ||
            historico.safra === filtrosAplicados.safra ||
            historico.safra === safraAssociada?.label) &&
          (!filtrosAplicados.cultura ||
            historico.cultura === filtrosAplicados.cultura)
        );
      });
    return vinculoSafraOuCultura &&
      (!filtrosAplicados.propriedade ||
      idString(talhao.id_propriedade) === filtrosAplicados.propriedade) &&
      (!filtrosAplicados.talhao || talhao.id === filtrosAplicados.talhao);
  });
  const atividadesFiltradas = atividades.filter((atividade) => {
    return (!filtrosAplicados.empresa ||
      idString(atividade.id_empresa) === filtrosAplicados.empresa) &&
      (!filtrosAplicados.propriedade ||
        idString(atividade.id_propriedade) === filtrosAplicados.propriedade) &&
      (!filtrosAplicados.talhao || atividade.id_talhao === filtrosAplicados.talhao) &&
      (!filtrosAplicados.safra || atividade.id_safra === filtrosAplicados.safra) &&
      (!filtrosAplicados.cultura ||
        safrasAtividade.find((safra) => safra.value === atividade.id_safra)?.cultura ===
          filtrosAplicados.cultura) &&
      (!filtrosAplicados.funcionario ||
        atividade.responsavel === filtrosAplicados.funcionario) &&
      filtroPeriodo(atividade.data_inicio, filtrosAplicados);
  });
  const lancamentosFiltrados = lancamentos.filter((lancamento) => {
    const culturaOk = !filtrosAplicados.cultura ||
      lancamento.cultura === filtrosAplicados.cultura ||
      (!lancamento.cultura && !filtrosAplicados.safra);
    return (!filtrosAplicados.empresa ||
      idString(lancamento.id_empresa) === filtrosAplicados.empresa) &&
      (!filtrosAplicados.propriedade ||
        idString(lancamento.id_propriedade) === filtrosAplicados.propriedade) &&
      (!filtrosAplicados.talhao ||
        idString(lancamento.id_talhao) === filtrosAplicados.talhao) &&
      (!filtrosAplicados.safra ||
        idString(lancamento.id_safra) === filtrosAplicados.safra) &&
      culturaOk &&
      filtroPeriodo(lancamento.data_lancamento, filtrosAplicados);
  });
  const movimentacoesFiltradas = movimentacoes.filter((movimento) => {
    const item = insumos.find((insumo) => insumo.id === movimento.id_insumo);
    const empresaDaPropriedade = propriedades.find(
      (propriedade) =>
        idString(propriedade.id_propriedade) === idString(item?.id_propriedade)
    )?.id_empresa;
    const culturaSafra = safrasAtividade.find((safra) => safra.value === movimento.safra);
    return (!filtrosAplicados.empresa ||
      idString(empresaDaPropriedade) === filtrosAplicados.empresa) &&
      (!filtrosAplicados.propriedade ||
      idString(item?.id_propriedade) === filtrosAplicados.propriedade) &&
      (!filtrosAplicados.talhao ||
        movimento.id_talhao === filtrosAplicados.talhao) &&
      (!filtrosAplicados.safra ||
        movimento.safra === filtrosAplicados.safra ||
        culturaSafra?.label === filtrosAplicados.safra) &&
      (!filtrosAplicados.cultura ||
        culturaSafra?.cultura === filtrosAplicados.cultura) &&
      (!filtrosAplicados.funcionario ||
        movimento.responsavel === filtrosAplicados.funcionario) &&
      filtroPeriodo(movimento.data_movimentacao, filtrosAplicados);
  });

  const propriedadesParaRelatorio = useMemo(() => {
    const referencias = new Map<
      string,
      { id: string; nome: string; idEmpresa?: string }
    >();
    const incluir = (
      id: number | string | null | undefined,
      nome?: string | null,
      idEmpresa?: number | string | null
    ) => {
      const chave = idString(id);
      if (!chave) return;
      const existente = referencias.get(chave);
      referencias.set(chave, {
        id: chave,
        nome: nome || existente?.nome || `Propriedade ${chave}`,
        idEmpresa: idString(idEmpresa) || existente?.idEmpresa,
      });
    };
    propriedades.forEach((propriedade) =>
      incluir(
        propriedade.id_propriedade,
        propriedade.nome_propriedade,
        propriedade.id_empresa
      )
    );
    talhoes.forEach((talhao) =>
      incluir(talhao.id_propriedade, talhao.nome_propriedade)
    );
    atividades.forEach((atividade) =>
      incluir(
        atividade.id_propriedade,
        atividade.nome_propriedade,
        atividade.id_empresa
      )
    );
    lancamentos.forEach((lancamento) =>
      incluir(
        lancamento.id_propriedade,
        lancamento.nome_propriedade,
        lancamento.id_empresa
      )
    );
    insumos.forEach((insumo) =>
      incluir(insumo.id_propriedade, insumo.nome_propriedade)
    );
    return [...referencias.values()];
  }, [atividades, insumos, lancamentos, propriedades, talhoes]);
  const propriedadesVisiveis = propriedadesParaRelatorio.filter(
    (propriedade) =>
      (!filtrosAplicados.empresa ||
        propriedade.idEmpresa === filtrosAplicados.empresa) &&
      (!filtrosAplicados.propriedade ||
        propriedade.id === filtrosAplicados.propriedade)
  );
  const insumosFiltrados = insumos.filter((insumo) =>
    (!filtrosAplicados.propriedade ||
      idString(insumo.id_propriedade) === filtrosAplicados.propriedade) &&
    (!filtrosAplicados.empresa ||
      idString(propriedades.find((p) =>
        idString(p.id_propriedade) === idString(insumo.id_propriedade)
      )?.id_empresa) === filtrosAplicados.empresa)
  );
  const safrasFiltradas = safrasAtividade.filter((safra) =>
    (!filtrosAplicados.propriedade ||
      !safra.idPropriedade ||
      safra.idPropriedade === filtrosAplicados.propriedade) &&
    (!filtrosAplicados.safra || safra.value === filtrosAplicados.safra) &&
    (!filtrosAplicados.cultura || safra.cultura === filtrosAplicados.cultura)
  );

  const historicosFiltrados = talhoesFiltrados.flatMap((talhao) =>
    (talhao.historico ?? [])
      .filter((historico) =>
        (!filtrosAplicados.safra ||
          historico.safra === filtrosAplicados.safra ||
          `${historico.safra} · ${historico.cultura}` === filtrosAplicados.safra) &&
        (!filtrosAplicados.cultura ||
          historico.cultura === filtrosAplicados.cultura) &&
        (!historico.data_plantio ||
          filtroPeriodo(historico.data_plantio, filtrosAplicados))
      )
      .map((historico) => ({ talhao, historico }))
  );
  const evolucaoFinanceira = useMemo(() => {
    const meses = new Map<string, { receita: number; despesa: number }>();
    lancamentosFiltrados.forEach((lancamento) => {
      const mes = lancamento.data_lancamento.slice(0, 7);
      const valores = meses.get(mes) ?? { receita: 0, despesa: 0 };
      if (lancamento.tipo === "RECEITA") valores.receita += numero(lancamento.valor);
      else valores.despesa += numero(lancamento.valor);
      meses.set(mes, valores);
    });
    const chaves = [...meses.keys()].sort();
    return {
      categorias: chaves.map((chave) => {
        const [ano, mes] = chave.split("-");
        return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString(
          "pt-BR",
          { month: "short", year: "2-digit" }
        );
      }),
      series: [
        {
          nome: "Receitas",
          cor: "#16a34a",
          pontos: chaves.map((chave, index) => ({
            x: new Date(
              Number(chave.slice(0, 4)),
              Number(chave.slice(5, 7)) - 1,
              1
            ).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
            y: meses.get(chave)?.receita ?? 0,
            index,
          })),
        },
        {
          nome: "Despesas",
          cor: "#dc2626",
          pontos: chaves.map((chave) => ({
            x: new Date(
              Number(chave.slice(0, 4)),
              Number(chave.slice(5, 7)) - 1,
              1
            ).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
            y: meses.get(chave)?.despesa ?? 0,
          })),
        },
      ],
    };
  }, [lancamentosFiltrados]);

  const tabela = useMemo<TabelaRelatorio>(() => {
    switch (relatorio) {
      case "executivo": {
        const propriedadesComTalhoes = propriedadesVisiveis.map((propriedade) => {
          const idPropriedade = propriedade.id;
          const talhoesDaPropriedade = talhoesFiltrados.filter(
            (talhao) => idString(talhao.id_propriedade) === idPropriedade
          );
          const lancamentosDaPropriedade = lancamentosFiltrados.filter(
            (lancamento) => idString(lancamento.id_propriedade) === idPropriedade
          );
          const receita = lancamentosDaPropriedade
            .filter((lancamento) => lancamento.tipo === "RECEITA")
            .reduce((soma, lancamento) => soma + numero(lancamento.valor), 0);
          const despesa = lancamentosDaPropriedade
            .filter((lancamento) => lancamento.tipo === "DESPESA")
            .reduce((soma, lancamento) => soma + numero(lancamento.valor), 0);
          return [
            propriedade.nome,
            talhoesDaPropriedade.length,
            talhoesDaPropriedade.reduce(
              (soma, talhao) => soma + numero(talhao.area_total),
              0
            ),
            receita,
            despesa,
            receita - despesa,
          ];
        });
        return {
          colunas: [
            "Propriedade",
            "Talhões",
            "Área Total (ha)",
            "Receita",
            "Despesa",
            "Lucro Líquido",
          ],
          linhas: propriedadesComTalhoes,
        };
      }
      case "atividades":
        return {
          colunas: [
            "Data",
            "Atividade",
            "Talhão",
            "Safra",
            "Funcionário",
            "Equipamentos",
            "Status",
            "Custo",
          ],
          linhas: [...atividadesFiltradas]
            .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))
            .map((atividade) => [
            formatarData(atividade.data_inicio),
            atividade.tipo_atividade,
            atividade.nome_talhao || atividade.codigo_talhao || atividade.id_talhao,
            atividade.safra || atividade.id_safra,
            atividade.responsavel || "—",
            atividade.maquinas?.map((maquina) => maquina.nome).join(", ") || "—",
            atividade.status,
            atividade.custo_operacao ?? null,
            ]),
        };
      case "talhoes":
        return {
          colunas: [
            "Talhão",
            "Propriedade",
            "Área Total (ha)",
            "Área Ocupada (ha)",
            "Área Livre (ha)",
            "Área em Colheita (ha)",
            "Cultura Atual",
            "Status",
          ],
          linhas: talhoesFiltrados.map((talhao) => {
            const ocupada = areaOcupada(talhao);
            const historicoAtual = (talhao.historico ?? []).find(
              (item) => !item.data_colheita
            );
            const base = numero(talhao.area_utilizavel || talhao.area_total);
            return [
              talhao.nome,
              talhao.nome_propriedade || "—",
              numero(talhao.area_total),
              ocupada,
              Math.max(0, base - ocupada),
              talhao.status === "Colheita" ? ocupada || null : 0,
              historicoAtual?.cultura || "—",
              talhao.status,
            ];
          }),
        };
      case "safras":
        return {
          colunas: [
            "Safra",
            "Cultura",
            "Talhão",
            "Propriedade",
            "Área Plantada (ha)",
            "Produtividade (sc/ha)",
            "Data de Plantio",
            "Data de Colheita",
          ],
          linhas: historicosFiltrados.map(({ talhao, historico }) => [
            historico.safra,
            historico.cultura,
            talhao.nome,
            talhao.nome_propriedade || "—",
            numero(historico.area_plantada),
            historico.produtividade ?? null,
            formatarData(historico.data_plantio),
            formatarData(historico.data_colheita),
          ]),
        };
      case "financeiro":
        return {
          colunas: [
            "Data",
            "Tipo",
            "Categoria",
            "Descrição",
            "Propriedade",
            "Talhão",
            "Safra",
            "Receita",
            "Despesa",
            "Lucro Líquido",
            "Status",
          ],
          linhas: [...lancamentosFiltrados]
            .sort((a, b) =>
              b.data_lancamento.localeCompare(a.data_lancamento)
            )
            .map((lancamento) => [
            formatarData(lancamento.data_lancamento),
            lancamento.tipo,
            lancamento.categoria,
            lancamento.descricao || "—",
            lancamento.nome_propriedade || "—",
            lancamento.nome_talhao || "—",
            lancamento.nome_safra || "—",
            lancamento.tipo === "RECEITA" ? numero(lancamento.valor) : 0,
            lancamento.tipo === "DESPESA" ? numero(lancamento.valor) : 0,
            lancamento.tipo === "RECEITA"
              ? numero(lancamento.valor)
              : -numero(lancamento.valor),
            lancamento.status,
            ]),
        };
      case "estoque":
        return {
          colunas: [
            "Insumo",
            "Categoria",
            "Propriedade",
            "Saldo",
            "Unidade",
            "Estoque Mínimo",
            "Valor em Estoque",
            "Situação",
          ],
          linhas: insumosFiltrados.map((insumo) => [
            insumo.nome,
            insumo.categoria,
            insumo.nome_propriedade || "—",
            numero(insumo.estoque_atual),
            insumo.unidade_medida,
            numero(insumo.estoque_minimo),
            numero(insumo.estoque_atual) * numero(insumo.valor_unitario),
            insumo.estoque_atual <= 0
              ? "Zerado"
              : insumo.estoque_atual < insumo.estoque_minimo
              ? "Baixo"
              : "Normal",
          ]),
        };
      case "consumo":
        return {
          colunas: [
            "Data",
            "Insumo",
            "Talhão",
            "Safra",
            "Funcionário",
            "Quantidade",
            "Unidade",
            "Valor Unitário",
          ],
          linhas: [...movimentacoesFiltradas]
            .sort((a, b) =>
              b.data_movimentacao.localeCompare(a.data_movimentacao)
            )
            .filter((movimento) => movimento.tipo === "Saída")
            .map((movimento) => [
              formatarData(movimento.data_movimentacao),
              movimento.nome_insumo || insumos.find(
                (insumo) => insumo.id === movimento.id_insumo
              )?.nome || "—",
              movimento.nome_talhao || movimento.codigo_talhao || "—",
              movimento.safra || "—",
              movimento.responsavel || "—",
              numero(movimento.quantidade),
              insumos.find((insumo) => insumo.id === movimento.id_insumo)?.unidade_medida || "—",
              movimento.valor_unitario ?? null,
            ]),
        };
      case "validade": {
        const limite = new Date(`${filtrosAplicados.dataFim || hoje}T00:00:00`);
        const fimJanela = new Date(limite);
        fimJanela.setDate(fimJanela.getDate() + 90);
        const dataLimite = [
          fimJanela.getFullYear(),
          String(fimJanela.getMonth() + 1).padStart(2, "0"),
          String(fimJanela.getDate()).padStart(2, "0"),
        ].join("-");
        const lotes = insumosFiltrados.flatMap((insumo) =>
          (insumo.lotes ?? [])
            .filter((lote) =>
              (!filtrosAplicados.dataInicio ||
                (lote.data_validade ?? "") >= filtrosAplicados.dataInicio) &&
              !!lote.data_validade &&
              lote.data_validade <= dataLimite
            )
            .map((lote) => {
              const validade = lote.data_validade
                ? new Date(`${lote.data_validade}T00:00:00`)
                : null;
              const dias = validade
                ? Math.ceil((validade.getTime() - limite.getTime()) / MS_DIA)
                : null;
              return { insumo, lote, dias };
            })
        );
        return {
          colunas: [
            "Insumo",
            "Lote",
            "Propriedade",
            "Quantidade",
            "Validade",
            "Dias até vencer",
          ],
          linhas: lotes
            .filter(({ dias }) => dias != null && dias <= 90)
            .sort((a, b) => (a.dias ?? Infinity) - (b.dias ?? Infinity))
            .map(({ insumo, lote, dias }) => [
              insumo.nome,
              lote.numero_lote,
              insumo.nome_propriedade || "—",
              numero(lote.quantidade),
              formatarData(lote.data_validade),
              dias,
            ]),
        };
      }
      case "funcionarios": {
        const grupos = new Map<string, { atividades: number; custo: number }>();
        atividadesFiltradas.forEach((atividade) => {
          const nome = atividade.responsavel || "Não informado";
          const atual = grupos.get(nome) ?? { atividades: 0, custo: 0 };
          atual.atividades += 1;
          atual.custo += numero(atividade.custo_operacao);
          grupos.set(nome, atual);
        });
        return {
          colunas: ["Funcionário", "Atividades", "Custo das Atividades"],
          linhas: [...grupos.entries()]
            .sort((a, b) => b[1].atividades - a[1].atividades)
            .map(([nome, dados]) => [nome, dados.atividades, dados.custo]),
        };
      }
    }
  }, [
    atividadesFiltradas,
    filtrosAplicados.dataFim,
    filtrosAplicados.dataInicio,
    insumos,
    insumosFiltrados,
    lancamentosFiltrados,
    movimentacoesFiltradas,
    propriedadesVisiveis,
    relatorio,
    talhoesFiltrados,
    historicosFiltrados,
  ]);

  const totalReceitas = lancamentosFiltrados
    .filter((lancamento) => lancamento.tipo === "RECEITA")
    .reduce((soma, lancamento) => soma + numero(lancamento.valor), 0);
  const totalDespesas = lancamentosFiltrados
    .filter((lancamento) => lancamento.tipo === "DESPESA")
    .reduce((soma, lancamento) => soma + numero(lancamento.valor), 0);
  const areaTotal = talhoesFiltrados.reduce(
    (soma, talhao) => soma + numero(talhao.area_total),
    0
  );
  const valorEstoque = insumosFiltrados.reduce(
    (soma, insumo) => soma + numero(insumo.estoque_atual) * numero(insumo.valor_unitario),
    0
  );
  const kpis = useMemo(() => {
    switch (relatorio) {
      case "executivo":
        return [
          { titulo: "Propriedades", valor: propriedadesVisiveis.length.toLocaleString("pt-BR"), detalhe: "no escopo filtrado", cor: "green" },
          { titulo: "Talhões", valor: talhoesFiltrados.length.toLocaleString("pt-BR"), detalhe: `${areaTotal.toLocaleString("pt-BR")} ha totais`, cor: "sky" },
          { titulo: "Receitas", valor: fmtMoeda(totalReceitas), detalhe: "no período selecionado", cor: "green" },
          { titulo: "Resultado líquido", valor: fmtMoeda(totalReceitas - totalDespesas), detalhe: `${fmtMoeda(totalDespesas)} em despesas`, cor: totalReceitas >= totalDespesas ? "lime" : "orange" },
        ];
      case "atividades":
      case "funcionarios":
        return [
          { titulo: "Atividades", valor: atividadesFiltradas.length.toLocaleString("pt-BR"), detalhe: "no período selecionado", cor: "green" },
          { titulo: "Concluídas", valor: atividadesFiltradas.filter((a) => a.status === "Concluída").length.toLocaleString("pt-BR"), detalhe: "status concluído", cor: "lime" },
          { titulo: "Em andamento", valor: atividadesFiltradas.filter((a) => a.status === "Em Andamento").length.toLocaleString("pt-BR"), detalhe: "status em andamento", cor: "sky" },
          { titulo: "Custo informado", valor: fmtMoeda(atividadesFiltradas.reduce((s, a) => s + numero(a.custo_operacao), 0)), detalhe: "sem custos não informados", cor: "orange" },
        ];
      case "talhoes": {
        const areasColheita = talhoesFiltrados
          .filter((talhao) => talhao.status === "Colheita")
          .map((talhao) => areaOcupada(talhao))
          .filter((area) => area > 0);
        return [
          { titulo: "Talhões", valor: talhoesFiltrados.length.toLocaleString("pt-BR"), detalhe: "no escopo filtrado", cor: "green" },
          { titulo: "Área total", valor: `${areaTotal.toLocaleString("pt-BR")} ha`, detalhe: "área cadastrada", cor: "sky" },
          { titulo: "Área ocupada", valor: `${talhoesFiltrados.reduce((s, t) => s + areaOcupada(t), 0).toLocaleString("pt-BR")} ha`, detalhe: "históricos sem data de colheita", cor: "lime" },
          { titulo: "Área livre", valor: `${talhoesFiltrados.reduce((s, t) => s + areaDisponivel(t), 0).toLocaleString("pt-BR")} ha`, detalhe: "estimada pela área utilizável", cor: "orange" },
          { titulo: "Área em colheita", valor: areasColheita.length ? `${areasColheita.reduce((s, area) => s + area, 0).toLocaleString("pt-BR")} ha` : "—", detalhe: `${talhoesFiltrados.filter((t) => t.status === "Colheita").length} talhão(ões); área exige histórico`, cor: "orange" },
        ];
      }
      case "safras":
        return [
          { titulo: "Talhões", valor: talhoesFiltrados.length.toLocaleString("pt-BR"), detalhe: "no escopo filtrado", cor: "green" },
          { titulo: "Área total", valor: `${areaTotal.toLocaleString("pt-BR")} ha`, detalhe: "área cadastrada", cor: "sky" },
          { titulo: "Área ocupada", valor: `${talhoesFiltrados.reduce((s, t) => s + areaOcupada(t), 0).toLocaleString("pt-BR")} ha`, detalhe: "históricos sem data de colheita", cor: "lime" },
          { titulo: "Safras registradas", valor: safrasFiltradas.length.toLocaleString("pt-BR"), detalhe: "culturas relacionadas", cor: "orange" },
        ];
      case "financeiro":
        return [
          { titulo: "Receita", valor: fmtMoeda(totalReceitas), detalhe: "lançamentos no período", cor: "green" },
          { titulo: "Despesa", valor: fmtMoeda(totalDespesas), detalhe: "lançamentos no período", cor: "orange" },
          { titulo: "Lucro líquido", valor: fmtMoeda(totalReceitas - totalDespesas), detalhe: "receitas menos despesas", cor: totalReceitas >= totalDespesas ? "lime" : "orange" },
          { titulo: "Lançamentos", valor: lancamentosFiltrados.length.toLocaleString("pt-BR"), detalhe: "receitas e despesas", cor: "sky" },
        ];
      case "estoque":
        return [
          { titulo: "Produtos", valor: insumosFiltrados.length.toLocaleString("pt-BR"), detalhe: "itens cadastrados", cor: "green" },
          { titulo: "Valor estimado", valor: fmtMoeda(valorEstoque), detalhe: "saldo × valor unitário", cor: "sky" },
          { titulo: "Estoque baixo", valor: insumosFiltrados.filter((i) => i.estoque_atual > 0 && i.estoque_atual < i.estoque_minimo).length.toLocaleString("pt-BR"), detalhe: "abaixo do mínimo", cor: "orange" },
          { titulo: "Estoque zerado", valor: insumosFiltrados.filter((i) => i.estoque_atual <= 0).length.toLocaleString("pt-BR"), detalhe: "sem saldo disponível", cor: "lime" },
        ];
      case "consumo":
        return [
          { titulo: "Saídas", valor: movimentacoesFiltradas.filter((m) => m.tipo === "Saída").length.toLocaleString("pt-BR"), detalhe: "movimentações no período", cor: "green" },
          { titulo: "Itens rastreados", valor: new Set(movimentacoesFiltradas.filter((m) => m.tipo === "Saída").map((m) => m.id_insumo)).size.toLocaleString("pt-BR"), detalhe: "produtos distintos", cor: "sky" },
          { titulo: "Talhões atendidos", valor: new Set(movimentacoesFiltradas.filter((m) => m.tipo === "Saída").map((m) => m.id_talhao).filter(Boolean)).size.toLocaleString("pt-BR"), detalhe: "com talhão informado", cor: "lime" },
          { titulo: "Responsáveis", valor: new Set(movimentacoesFiltradas.filter((m) => m.tipo === "Saída").map((m) => m.responsavel).filter(Boolean)).size.toLocaleString("pt-BR"), detalhe: "com responsável informado", cor: "orange" },
        ];
      case "validade": {
        const linhas = tabela.linhas;
        const vencidos = linhas.filter((linha) => numero(linha[5] as number) < 0).length;
        return [
          { titulo: "Lotes no relatório", valor: linhas.length.toLocaleString("pt-BR"), detalhe: "validade no período selecionado", cor: "green" },
          { titulo: "Vencidos", valor: vencidos.toLocaleString("pt-BR"), detalhe: "validade anterior ao fim do período", cor: "orange" },
          { titulo: "Próximos a vencer", valor: (linhas.length - vencidos).toLocaleString("pt-BR"), detalhe: "até 90 dias após o período", cor: "sky" },
          { titulo: "Valor estimado", valor: fmtMoeda(valorEstoque), detalhe: "valor atual do estoque", cor: "lime" },
        ];
      }
    }
  }, [
    atividadesFiltradas,
    areaTotal,
    lancamentosFiltrados,
    movimentacoesFiltradas,
    propriedadesVisiveis.length,
    relatorio,
    safrasFiltradas.length,
    tabela.linhas,
    talhoesFiltrados,
    totalDespesas,
    totalReceitas,
    valorEstoque,
    insumosFiltrados,
  ]);

  const linhasPagina = tabela.linhas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);
  const paginas = Math.max(1, Math.ceil(tabela.linhas.length / PAGE_SIZE));
  const relatorioAtual = OPCOES_RELATORIO.find((opcao) => opcao.id === relatorio)!;
  const carregando = [
    empresasQuery,
    propriedadesQuery,
    talhoesQuery,
    atividadesQuery,
    safrasQuery,
    lancamentosQuery,
    insumosQuery,
    movimentacoesQuery,
  ].some((query) => query.isLoading);
  const erroCarregamento = [
    empresasQuery,
    propriedadesQuery,
    talhoesQuery,
    atividadesQuery,
    safrasQuery,
    lancamentosQuery,
    insumosQuery,
    movimentacoesQuery,
  ].some((query) => query.isError);

  const atualizarFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros((atual) => {
      const proximo = { ...atual, [campo]: valor };
      if (campo === "empresa") proximo.propriedade = "";
      if (campo === "empresa" || campo === "propriedade") proximo.talhao = "";
      return proximo;
    });
  };

  const gerarRelatorio = () => {
    if (
      filtros.dataInicio &&
      filtros.dataFim &&
      filtros.dataInicio > filtros.dataFim
    ) {
      setErroFiltros("A data inicial deve ser anterior ou igual à data final.");
      return;
    }
    setErroFiltros("");
    setFiltrosAplicados({ ...filtros });
    setPagina(1);
    setErroExportacao("");
    setStatusExportacao("");
  };

  const nomeArquivo = `safraviva-${relatorio}-${hoje}`;
  const exportarCsv = () => {
    setStatusExportacao("");
    setErroExportacao("");
    try {
      const escapeCsv = (valor: string | number | null) =>
        `"${String(valor ?? "").replaceAll('"', '""')}"`;
      const csv = [
        tabela.colunas.map(escapeCsv).join(";"),
        ...tabela.linhas.map((linha) => linha.map(escapeCsv).join(";")),
      ].join("\r\n");
      downloadBlob(
        new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
        `${nomeArquivo}.csv`
      );
      setErroExportacao("");
      setStatusExportacao("Arquivo CSV preparado para download.");
    } catch (error) {
      console.error("Falha ao exportar relatório para CSV.", error);
      setErroExportacao("Não foi possível gerar o arquivo CSV.");
      setStatusExportacao("");
    }
  };

  const exportarExcel = async () => {
    setStatusExportacao("");
    setErroExportacao("");
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SafraViva";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Dados", {
        views: [{ state: "frozen", ySplit: 1 }],
      });
      const financeiro = relatorio === "financeiro";
      worksheet.addTable({
        name: "RelatorioSafraViva",
        ref: "A1",
        headerRow: true,
        totalsRow: financeiro,
        style: { theme: "TableStyleMedium4", showRowStripes: true },
        columns: tabela.colunas.map((name, index) => ({
          name,
          filterButton: true,
          ...(financeiro && index === 0 ? { totalsRowLabel: "TOTAL" } : {}),
          ...(financeiro && [7, 8, 9].includes(index)
            ? { totalsRowFunction: "sum" as const }
            : {}),
        })),
        rows: tabela.linhas.map((linha) => linha.map((valor) => valor ?? "")),
      });
      tabela.colunas.forEach((coluna, index) => {
        const valores = tabela.linhas.slice(0, 100).map((linha) =>
          String(linha[index] ?? "").length
        );
        worksheet.getColumn(index + 1).width = Math.min(
          36,
          Math.max(coluna.length + 2, ...valores, 12)
        );
      });
      const colunasMoeda = tabela.colunas
        .map((coluna, index) =>
          ["Receita", "Despesa", "Lucro Líquido", "Valor em Estoque", "Custo"].includes(coluna)
            ? index + 1
            : -1
        )
        .filter((index) => index > 0);
      colunasMoeda.forEach((column) => {
        worksheet.getColumn(column).numFmt = '"R$" #,##0.00';
      });

      const resumo = workbook.addWorksheet("Resumo");
      resumo.addRows([
        ["Relatório", relatorioAtual.titulo],
        ["Emitido em", new Date().toLocaleString("pt-BR")],
        ["Empresa", empresas.find((e) => idString(e.id_empresa) === filtrosAplicados.empresa)?.nome_fantasia || "Todas"],
        ["Propriedade", propriedades.find((p) => idString(p.id_propriedade) === filtrosAplicados.propriedade)?.nome_propriedade || "Todas"],
        ["Período", `${formatarData(filtrosAplicados.dataInicio)} a ${formatarData(filtrosAplicados.dataFim)}`],
        ["Registros", tabela.linhas.length],
      ]);
      resumo.columns = [{ width: 22 }, { width: 48 }];
      resumo.getRow(1).font = { bold: true, color: { argb: "FF166534" } };
      resumo.getColumn(1).font = { bold: true };
      const conteudo = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([new Uint8Array(conteudo)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${nomeArquivo}.xlsx`
      );
      setErroExportacao("");
      setStatusExportacao("Arquivo Excel preparado para download.");
    } catch (error) {
      console.error("Falha ao exportar relatório para Excel.", error);
      setErroExportacao("Não foi possível gerar o arquivo Excel.");
      setStatusExportacao("");
    }
  };

  const exportarPdf = async () => {
    setStatusExportacao("");
    setErroExportacao("");
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const pdf = new jsPDF({ orientation: "landscape", format: "a4" });
      pdf.setFontSize(17);
      pdf.setTextColor(22, 101, 52);
      pdf.text(`SafraViva · ${relatorioAtual.titulo}`, 14, 17);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Período: ${formatarData(filtrosAplicados.dataInicio)} a ${formatarData(filtrosAplicados.dataFim)} · Emitido em ${new Date().toLocaleString("pt-BR")}`,
        14,
        24
      );
      autoTable(pdf, {
        startY: 31,
        head: [tabela.colunas],
        body: tabela.linhas.map((linha) =>
          linha.map((valor, index) => valorCelula(tabela.colunas[index], valor))
        ),
        styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
        headStyles: { fillColor: [22, 101, 52] },
        alternateRowStyles: { fillColor: [245, 248, 246] },
        margin: { left: 14, right: 14 },
        didDrawPage: () => {
          const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          pdf.text(`Página ${pageNumber}`, pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 8);
        },
      });
      pdf.save(`${nomeArquivo}.pdf`);
      setErroExportacao("");
      setStatusExportacao("Arquivo PDF preparado para download.");
    } catch (error) {
      console.error("Falha ao exportar relatório para PDF.", error);
      setErroExportacao("Não foi possível gerar o arquivo PDF.");
      setStatusExportacao("");
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <TopBar breadcrumb="Gestão Agrícola" page="Relatórios" />
      <main className="px-5 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">
          <PageHeader
            title="Central de Relatórios"
            description="Indicadores operacionais, agronômicos, financeiros e de estoque da sua operação."
          />

          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm print:hidden" aria-label="Filtros do relatório">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Filtros do relatório</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Funcionário filtra atividades e consumo quando há responsável vinculado; estoque e áreas são posições atuais. Em validade, também são incluídos lotes que vencem até 90 dias após a data final.
                </p>
              </div>
              <button
                onClick={() => {
                  setFiltros({ ...filtrosIniciais });
                  setFiltrosAplicados({ ...filtrosIniciais });
                  setPagina(1);
                }}
                className="text-xs font-semibold text-green-700 hover:text-green-900"
              >
                Limpar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <FiltroSelect
                label="Empresa Agrícola"
                value={filtros.empresa}
                onChange={(value) => atualizarFiltro("empresa", value)}
                opcoes={empresas.map((empresa) => ({
                  value: idString(empresa.id_empresa),
                  label: empresa.nome_fantasia || empresa.razao_social,
                }))}
              />
              <FiltroSelect
                label="Propriedade"
                value={filtros.propriedade}
                onChange={(value) => atualizarFiltro("propriedade", value)}
                opcoes={propriedadesParaRelatorio.map((propriedade) => ({
                  value: propriedade.id,
                  label: propriedade.nome,
                })).filter((propriedade) => {
                  const entidade = propriedadesParaRelatorio.find(
                    (item) => item.id === propriedade.value
                  );
                  return !filtros.empresa ||
                    entidade?.idEmpresa === filtros.empresa;
                })}
              />
              <FiltroSelect
                label="Talhão"
                value={filtros.talhao}
                onChange={(value) => atualizarFiltro("talhao", value)}
                opcoes={opcoesTalhao
                  .filter((option) =>
                    !filtros.propriedade ||
                    !option.idPropriedade ||
                    option.idPropriedade === filtros.propriedade
                  )
                  .map(({ value, label }) => ({ value, label }))}
              />
              <FiltroSelect
                label="Safra"
                value={filtros.safra}
                onChange={(value) => atualizarFiltro("safra", value)}
                opcoes={safrasAtividade
                  .filter((safra) =>
                    !filtros.propriedade ||
                    !safra.idPropriedade ||
                    safra.idPropriedade === filtros.propriedade
                  )
                  .map(({ value, label }) => ({ value, label }))}
              />
              <FiltroSelect
                label="Cultura"
                value={filtros.cultura}
                onChange={(value) => atualizarFiltro("cultura", value)}
                opcoes={opcoesCultura.map((cultura) => ({ value: cultura, label: cultura }))}
              />
              <FiltroSelect
                label="Funcionário"
                value={filtros.funcionario}
                onChange={(value) => atualizarFiltro("funcionario", value)}
                opcoes={opcoesFuncionario.map((nome) => ({ value: nome, label: nome }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <FiltroData
                  label="Data inicial"
                  value={filtros.dataInicio}
                  onChange={(value) => atualizarFiltro("dataInicio", value)}
                />
                <FiltroData
                  label="Data final"
                  value={filtros.dataFim}
                  onChange={(value) => atualizarFiltro("dataFim", value)}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={gerarRelatorio}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
              >
                Gerar relatório
              </button>
            </div>
            {erroFiltros && (
              <p role="alert" className="mt-2 text-right text-xs text-red-700">
                {erroFiltros}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm print:hidden">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-800">Relatórios disponíveis</h2>
              <span className="text-xs text-gray-400">{relatorioAtual.grupo}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {OPCOES_RELATORIO.map((opcao) => (
                <button
                  key={opcao.id}
                  onClick={() => {
                    setRelatorio(opcao.id);
                    setPagina(1);
                    setErroExportacao("");
                    setStatusExportacao("");
                  }}
                  aria-pressed={relatorio === opcao.id}
                  title={opcao.descricao}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                    relatorio === opcao.id
                      ? "border-green-600 bg-green-50 text-green-800"
                      : "border-gray-200 bg-white text-gray-600 hover:border-green-300"
                  }`}
                >
                  <span className="mr-1.5">{opcao.icone}</span>
                  <span className="text-xs font-semibold">{opcao.titulo}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">{relatorioAtual.descricao}</p>
          </section>

          {erroCarregamento && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Não foi possível carregar todos os dados. Verifique a conexão com o sistema e tente novamente.
            </div>
          )}

          {relatorio === "funcionarios" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              O sistema ainda não possui cadastro de funcionários nem apontamento de horas. Este relatório usa apenas os responsáveis vinculados às atividades e seus custos informados; não calcula folha, jornada ou produtividade individual.
            </div>
          )}
          {relatorio === "safras" && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              A produtividade é exibida em sacas por hectare quando existe histórico de talhão; o sistema ainda não registra produção total em toneladas.
            </div>
          )}

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.titulo} {...kpi} />
            ))}
          </section>

          {relatorio === "executivo" && (
            <ChartCard
              titulo="Receita x despesa"
              descricao="Evolução mensal dentro do período selecionado"
            >
              {evolucaoFinanceira.categorias.length ? (
                <LineChart
                  categorias={evolucaoFinanceira.categorias}
                  series={evolucaoFinanceira.series}
                  sufixo=" R$"
                  altura={220}
                />
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">
                  Sem lançamentos financeiros no período.
                </p>
              )}
            </ChartCard>
          )}
          {relatorio === "talhoes" && (
            <ChartCard
              titulo="Área ocupada por talhão"
              descricao="Comparação da ocupação atual com a área total"
            >
              <BarChart
                dados={talhoesFiltrados.map((talhao) => ({
                  label: talhao.nome,
                  valor: areaOcupada(talhao),
                  total: numero(talhao.area_utilizavel || talhao.area_total),
                  cor: "#16a34a",
                }))}
                sufixo=" ha"
                mostrarPercentual
              />
            </ChartCard>
          )}
          {relatorio === "safras" && (
            <ChartCard
              titulo="Produtividade por talhão e cultura"
              descricao="Sacas por hectare registradas no histórico"
            >
              <BarChart
                dados={historicosFiltrados
                  .filter(({ historico }) => numero(historico.produtividade) > 0)
                  .map(({ talhao, historico }) => ({
                    label: `${talhao.nome} · ${historico.cultura} · ${historico.safra}`,
                    valor: numero(historico.produtividade),
                    cor: "#0ea5e9",
                  }))}
                sufixo=" sc/ha"
              />
            </ChartCard>
          )}

          {relatorio === "financeiro" && (
            <ChartCard
              titulo="Resumo financeiro do período"
              descricao="Comparação entre receitas e despesas conforme os lançamentos filtrados"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ResumoFinanceiro rotulo="Receitas" valor={totalReceitas} cor="bg-green-600" />
                <ResumoFinanceiro rotulo="Despesas" valor={totalDespesas} cor="bg-red-500" />
                <ResumoFinanceiro rotulo="Resultado líquido" valor={totalReceitas - totalDespesas} cor="bg-sky-600" />
              </div>
            </ChartCard>
          )}

          <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800">{relatorioAtual.titulo}</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {tabela.linhas.length.toLocaleString("pt-BR")} registro(s) · período de{" "}
                  {formatarData(filtrosAplicados.dataInicio)} a{" "}
                  {formatarData(filtrosAplicados.dataFim)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <button onClick={exportarCsv} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  CSV
                </button>
                <button onClick={exportarExcel} className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50">
                  Excel
                </button>
                <button onClick={exportarPdf} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                  PDF
                </button>
                <button onClick={() => window.print()} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  Imprimir
                </button>
              </div>
            </div>
            {erroExportacao && (
              <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
                {erroExportacao}
              </p>
            )}
            {statusExportacao && (
            <p role="status" className="border-b border-green-100 bg-green-50 px-4 py-2 text-xs text-green-800">
              {statusExportacao}
            </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    {tabela.colunas.map((coluna) => (
                      <th key={coluna} className="whitespace-nowrap px-4 py-3 font-semibold">
                        {coluna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {carregando ? (
                    <tr>
                      <td colSpan={tabela.colunas.length} className="px-4 py-14 text-center text-sm text-gray-400">
                        Carregando dados dos módulos...
                      </td>
                    </tr>
                  ) : linhasPagina.length === 0 ? (
                    <tr>
                      <td colSpan={tabela.colunas.length} className="px-4 py-14 text-center text-sm text-gray-400">
                        Nenhum registro encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    linhasPagina.map((linha, indice) => (
                      <tr key={`${pagina}-${indice}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                        {linha.map((valor, index) => (
                          <td key={`${index}-${String(valor)}`} className="max-w-[320px] px-4 py-3 text-gray-700">
                            <span className="block truncate" title={String(valor ?? "")}>
                              {valorCelula(tabela.colunas[index], valor)}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
              <span>
                {tabela.linhas.length
                  ? `${(pagina - 1) * PAGE_SIZE + 1}–${Math.min(pagina * PAGE_SIZE, tabela.linhas.length)} de ${tabela.linhas.length}`
                  : "0 registros"}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                  className="rounded-md border border-gray-200 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={pagina >= paginas}
                  onClick={() => setPagina((atual) => Math.min(paginas, atual + 1))}
                  className="rounded-md border border-gray-200 px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FiltroSelect({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  opcoes: { value: string; label: string }[];
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[11px] font-semibold text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
      >
        <option value="">Todas</option>
        {opcoes.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FiltroData({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block truncate text-[11px] font-semibold text-gray-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-1.5 text-[11px] text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

function KpiCard({
  titulo,
  valor,
  detalhe,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  cor: string;
}) {
  const cores: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    sky: "bg-sky-50 text-sky-700",
    lime: "bg-lime-50 text-lime-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <article className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{titulo}</p>
      <p className="mt-2 truncate text-2xl font-bold text-gray-800" title={valor}>{valor}</p>
      <p className={`mt-2 inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${cores[cor] ?? cores.green}`}>
        {detalhe}
      </p>
    </article>
  );
}

function ResumoFinanceiro({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
      <span className={`h-9 w-1.5 rounded-full ${cor}`} />
      <div>
        <p className="text-xs text-gray-500">{rotulo}</p>
        <p className="text-base font-bold text-gray-800">{fmtMoeda(valor)}</p>
      </div>
    </div>
  );
}
