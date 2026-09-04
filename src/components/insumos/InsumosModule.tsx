import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInsumos,
  criarInsumo,
  getMovimentacoes,
  criarMovimentacao,
} from "../../services/api";
import {
  Insumo,
  MovimentacaoEstoque,
  NovoInsumoPayload,
  NovaMovimentacaoPayload,
  TipoMovimentacao,
  fmtQtd,
} from "../../types/insumo";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import InsumosDashboard from "./InsumosDashboard";
import InsumosLista from "./InsumosLista";
import InsumoForm from "./InsumoForm";
import InsumoDetalhe from "./InsumoDetalhe";
import MovimentacaoForm from "./MovimentacaoForm";
import MovimentacoesLista from "./MovimentacoesLista";
import InsumosRelatorios from "./InsumosRelatorios";

type Aba = "dashboard" | "lista" | "movimentacoes" | "relatorios" | "novo";

const ABAS: { id: Aba; icone: string; label: string }[] = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "lista", icone: "📦", label: "Estoque" },
  { id: "movimentacoes", icone: "🔄", label: "Movimentações" },
  { id: "relatorios", icone: "📄", label: "Relatórios" },
  { id: "novo", icone: "➕", label: "Novo Insumo" },
];

/** Aplica a movimentação ao saldo do insumo dentro do cache local */
function aplicarMovimentacao(
  insumo: Insumo,
  mov: MovimentacaoEstoque | NovaMovimentacaoPayload
): Insumo {
  const delta =
    mov.tipo === "Entrada" ? Number(mov.quantidade) : -Number(mov.quantidade);

  const lotes = [...(insumo.lotes ?? [])];
  if (mov.tipo === "Entrada" && mov.numero_lote) {
    const existente = lotes.findIndex((l) => l.numero_lote === mov.numero_lote);
    if (existente >= 0) {
      lotes[existente] = {
        ...lotes[existente],
        quantidade: lotes[existente].quantidade + Number(mov.quantidade),
      };
    } else {
      lotes.push({
        id: `local-${Date.now()}`,
        id_insumo: insumo.id,
        numero_lote: mov.numero_lote,
        data_fabricacao: mov.data_fabricacao ?? null,
        data_validade: mov.data_validade ?? null,
        quantidade: Number(mov.quantidade),
      });
    }
  }

  return {
    ...insumo,
    estoque_atual: Math.max(0, insumo.estoque_atual + delta),
    lotes,
  };
}

export default function InsumosModule() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [selecionado, setSelecionado] = useState<Insumo | null>(null);
  const [movimentando, setMovimentando] = useState<{
    insumo: Insumo | null;
    tipo: TipoMovimentacao;
  } | null>(null);
  const queryClient = useQueryClient();

  const {
    data: insumos = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["insumos"],
    queryFn: getInsumos,
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["movimentacoes-estoque"],
    queryFn: getMovimentacoes,
  });

  const { mutate: salvarInsumo, isPending: salvandoInsumo } = useMutation({
    mutationFn: (dados: NovoInsumoPayload) => criarInsumo(dados),
    onSuccess: (novo) => {
      // Atualiza o cache local para refletir o novo insumo imediatamente
      queryClient.setQueryData<Insumo[]>(["insumos"], (antigos = []) => [
        ...antigos,
        novo,
      ]);
      alert(`✅ Insumo "${novo.nome}" cadastrado com sucesso!`);
      setAba("lista");
    },
    onError: (erro: any) => {
      alert(
        `❌ Não foi possível salvar o insumo.\n\n${
          erro?.response?.data?.message ?? erro?.message ?? "Erro desconhecido."
        }`
      );
    },
  });

  const { mutate: salvarMovimentacao, isPending: salvandoMovimentacao } = useMutation({
    mutationFn: (dados: NovaMovimentacaoPayload) => criarMovimentacao(dados),
    onSuccess: (nova) => {
      queryClient.setQueryData<MovimentacaoEstoque[]>(
        ["movimentacoes-estoque"],
        (antigas = []) => [nova, ...antigas]
      );
      // Reflete o novo saldo do produto sem esperar o refetch
      queryClient.setQueryData<Insumo[]>(["insumos"], (antigos = []) =>
        antigos.map((i) => (i.id === nova.id_insumo ? aplicarMovimentacao(i, nova) : i))
      );
      setSelecionado((atual) =>
        atual && atual.id === nova.id_insumo ? aplicarMovimentacao(atual, nova) : atual
      );

      const insumo = insumos.find((i) => i.id === nova.id_insumo);
      alert(
        `✅ ${nova.tipo} de ${fmtQtd(nova.quantidade, insumo?.unidade_medida)} de "${
          insumo?.nome ?? nova.nome_insumo ?? "produto"
        }" registrada com sucesso!`
      );
      setMovimentando(null);
      setAba("movimentacoes");
    },
    onError: (erro: any) => {
      alert(
        `❌ Não foi possível registrar a movimentação.\n\n${
          erro?.response?.data?.message ?? erro?.message ?? "Erro desconhecido."
        }`
      );
    },
  });

  const abrirMovimentacao = (insumo: Insumo | null, tipo: TipoMovimentacao) => {
    setSelecionado(null);
    setMovimentando({ insumo, tipo });
  };

  const cabecalho = movimentando
    ? {
        titulo: `Registrar ${movimentando.tipo} de Estoque`,
        descricao:
          movimentando.tipo === "Entrada"
            ? "Informe fornecedor, nota fiscal e lote do produto recebido"
            : "Registre o consumo vinculando talhão, safra e atividade",
      }
    : selecionado
    ? { titulo: selecionado.nome, descricao: "Lotes, saldos e histórico de movimentações" }
    : aba === "dashboard"
    ? {
        titulo: "Dashboard de Insumos",
        descricao:
          "Estoques, alertas de reposição, validade e custos dos insumos agrícolas",
      }
    : aba === "lista"
    ? {
        titulo: "Gestão de Estoque",
        descricao: "Consulte, filtre e exporte todos os insumos cadastrados",
      }
    : aba === "movimentacoes"
    ? {
        titulo: "Movimentações de Estoque",
        descricao: "Histórico completo de entradas e saídas com rastreabilidade",
      }
    : aba === "relatorios"
    ? {
        titulo: "Relatórios de Insumos",
        descricao: "Estoque atual, consumo por talhão e safra e produtos vencidos",
      }
    : {
        titulo: "Cadastro de Insumo",
        descricao: "Registre um novo produto no estoque da fazenda",
      };

  const emFoco = movimentando != null || selecionado != null;

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      <TopBar
        breadcrumb="Gestão Agrícola"
        page={selecionado ? `Insumos › ${selecionado.nome}` : "Insumos"}
      />

      {/* Abas internas do módulo */}
      {!emFoco && (
        <div className="flex bg-white border-b border-gray-200 px-6 pt-3">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${aba === a.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {a.icone} {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-6 py-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto w-full">
          <PageHeader title={cabecalho.titulo} description={cabecalho.descricao} />

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Carregando insumos...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-semibold">
                Não foi possível carregar os insumos.
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {movimentando ? (
                <MovimentacaoForm
                  insumos={insumos}
                  insumoInicial={movimentando.insumo}
                  tipoInicial={movimentando.tipo}
                  onCancelar={() => setMovimentando(null)}
                  onSalvar={salvarMovimentacao}
                  salvando={salvandoMovimentacao}
                />
              ) : selecionado ? (
                <InsumoDetalhe
                  insumo={selecionado}
                  movimentacoes={movimentacoes}
                  onVoltar={() => setSelecionado(null)}
                  onMovimentar={abrirMovimentacao}
                />
              ) : aba === "dashboard" ? (
                <InsumosDashboard
                  insumos={insumos}
                  movimentacoes={movimentacoes}
                  onVerInsumo={setSelecionado}
                />
              ) : aba === "lista" ? (
                <InsumosLista
                  insumos={insumos}
                  onVerInsumo={setSelecionado}
                  onNovo={() => setAba("novo")}
                  onMovimentar={abrirMovimentacao}
                />
              ) : aba === "movimentacoes" ? (
                <MovimentacoesLista
                  insumos={insumos}
                  movimentacoes={movimentacoes}
                  onNovaMovimentacao={(tipo) => abrirMovimentacao(null, tipo)}
                />
              ) : aba === "relatorios" ? (
                <InsumosRelatorios insumos={insumos} movimentacoes={movimentacoes} />
              ) : (
                <InsumoForm
                  insumos={insumos}
                  onCancelar={() => setAba("lista")}
                  onSalvar={salvarInsumo}
                  salvando={salvandoInsumo}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
