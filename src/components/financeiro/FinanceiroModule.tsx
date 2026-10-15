import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLancamentos,
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
} from "../../services/api";
import { Lancamento, NovoLancamentoPayload } from "../../types/financeiro";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import ConfirmDialog from "../ui/ConfirmDialog";
import Toast, { DadosToast } from "../ui/Toast";
import FinanceiroDashboard from "./FinanceiroDashboard";
import LancamentosLista from "./LancamentosLista";
import LancamentoForm from "./LancamentoForm";
import FluxoCaixa from "./FluxoCaixa";
import FinanceiroRelatorios from "./FinanceiroRelatorios";

type Aba = "dashboard" | "lancamentos" | "fluxo" | "relatorios" | "novo";

const ABAS: { id: Aba; icone: string; label: string }[] = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "lancamentos", icone: "📋", label: "Lançamentos" },
  { id: "fluxo", icone: "🏦", label: "Fluxo de Caixa" },
  { id: "relatorios", icone: "📄", label: "Relatórios" },
  { id: "novo", icone: "➕", label: "Novo Lançamento" },
];

export default function FinanceiroModule() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [aExcluir, setAExcluir] = useState<Lancamento | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);
  const queryClient = useQueryClient();

  // Query base para estados de carregamento/erro do módulo
  const { isLoading, isError } = useQuery({
    queryKey: ["financeiro-lancamentos"],
    queryFn: () => getLancamentos(),
  });

  const invalidarFinanceiro = () => {
    ["financeiro-lancamentos", "financeiro-saldo", "financeiro-indicadores", "financeiro-fluxo-caixa"].forEach(
      (k) => queryClient.invalidateQueries({ queryKey: [k] })
    );
  };

  const emFormulario = aba === "novo" || editando != null;

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: (payload: NovoLancamentoPayload) =>
      editando
        ? atualizarLancamento(editando.id_lancamento, payload)
        : criarLancamento(payload),
    onSuccess: () => {
      invalidarFinanceiro();
      setToast({
        tipo: "sucesso",
        titulo: editando ? "Lançamento atualizado!" : "Lançamento cadastrado!",
      });
      setEditando(null);
      setAba("lancamentos");
    },
    onError: (erro: any) => {
      setToast({
        tipo: "erro",
        titulo: "Não foi possível salvar o lançamento.",
        descricao:
          erro?.response?.data?.error ??
          erro?.response?.data?.message ??
          erro?.message,
      });
    },
  });

  const { mutate: excluir } = useMutation({
    mutationFn: (l: Lancamento) => excluirLancamento(l.id_lancamento),
    onSuccess: () => {
      invalidarFinanceiro();
      setToast({ tipo: "sucesso", titulo: "Lançamento excluído." });
      setAExcluir(null);
    },
    onError: (erro: any) => {
      setToast({
        tipo: "erro",
        titulo: "Não foi possível excluir o lançamento.",
        descricao:
          erro?.response?.data?.error ??
          erro?.response?.data?.message ??
          erro?.message,
      });
      setAExcluir(null);
    },
  });

  const pedirExclusao = (l: Lancamento) => {
    if (l.conciliado) {
      setToast({
        tipo: "erro",
        titulo: "Lançamento conciliado.",
        descricao: "Lançamentos conciliados não podem ser excluídos.",
      });
      return;
    }
    setAExcluir(l);
  };

  const iniciarEdicao = (l: Lancamento) => {
    setEditando(l);
    setAba("novo");
  };

  const cabecalho = emFormulario
    ? {
        titulo: editando ? "Editar Lançamento" : "Novo Lançamento",
        descricao: "Registre receitas e despesas vinculadas à operação agrícola",
      }
    : aba === "dashboard"
    ? {
        titulo: "Dashboard Financeiro",
        descricao: "Visão consolidada de receitas, despesas e rentabilidade",
      }
    : aba === "lancamentos"
    ? {
        titulo: "Lançamentos Financeiros",
        descricao: "Consulte, filtre, edite e exclua os lançamentos",
      }
    : aba === "fluxo"
    ? {
        titulo: "Fluxo de Caixa",
        descricao: "Entradas, saídas e saldo acumulado por período",
      }
    : {
        titulo: "Relatórios e Indicadores",
        descricao: "Rentabilidade por safra, talhão e cultura",
      };

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      <TopBar breadcrumb="Gestão Agrícola" page="Financeiro" />

      {/* Abas internas */}
      <div className="flex bg-white border-b border-gray-200 px-6 pt-3">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setEditando(null);
              setAba(a.id);
            }}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${
                (a.id === "novo" ? emFormulario : aba === a.id && !emFormulario)
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            {a.icone} {a.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto w-full">
          <PageHeader title={cabecalho.titulo} description={cabecalho.descricao} />

          {emFormulario ? (
            <LancamentoForm
              inicial={editando}
              salvando={salvando}
              onCancelar={() => {
                setEditando(null);
                setAba("lancamentos");
              }}
              onSalvar={salvar}
            />
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Carregando dados financeiros...</p>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-semibold">
                Não foi possível carregar os dados financeiros.
              </p>
            </div>
          ) : aba === "dashboard" ? (
            <FinanceiroDashboard />
          ) : aba === "lancamentos" ? (
            <LancamentosLista
              onNovo={() => setAba("novo")}
              onEditar={iniciarEdicao}
              onExcluir={pedirExclusao}
            />
          ) : aba === "fluxo" ? (
            <FluxoCaixa />
          ) : (
            <FinanceiroRelatorios />
          )}
        </div>
      </div>

      <ConfirmDialog
        aberto={aExcluir != null}
        titulo="Excluir lançamento"
        tipo="perigo"
        mensagem={
          <>
            Deseja realmente excluir o lançamento{" "}
            <strong>{aExcluir?.categoria}</strong> de{" "}
            <strong>{aExcluir ? `R$ ${aExcluir.valor.toLocaleString("pt-BR")}` : ""}</strong>?
            Esta ação não pode ser desfeita.
          </>
        }
        textoConfirmar="Excluir"
        onConfirmar={() => aExcluir && excluir(aExcluir)}
        onCancelar={() => setAExcluir(null)}
      />

      {toast && <Toast {...toast} onFechar={() => setToast(null)} />}
    </div>
  );
}
