import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmpresas, getPropriedadesLista, excluirEmpresa } from "../../services/api";
import {
  EmpresaAgricola,
  fmtCNPJ,
  fmtTelefone,
  fmtDataBR,
  isEmpresaAtiva,
} from "../../types/empresaAgricola";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import Button from "../ui/Button";
import Toast, { DadosToast } from "../ui/Toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmpresasDashboard from "./EmpresasDashboard";
import EmpresasLista from "./EmpresasLista";
import EmpresaForm from "../forms/EmpresaForm";

type Aba = "dashboard" | "lista" | "novo";

const ABAS: { id: Aba; icone: string; label: string }[] = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "lista", icone: "📋", label: "Listagem" },
  { id: "novo", icone: "➕", label: "Nova Empresa" },
];

export default function EmpresasModule() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [selecionada, setSelecionada] = useState<EmpresaAgricola | null>(null);
  const [empresaEditando, setEmpresaEditando] = useState<EmpresaAgricola | null>(null);
  const [empresaExcluindo, setEmpresaExcluindo] = useState<EmpresaAgricola | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);
  const queryClient = useQueryClient();

  const {
    data: empresas = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["empresas-agricolas"],
    queryFn: getEmpresas,
  });

  const { data: propriedades = [] } = useQuery({
    queryKey: ["propriedades"],
    queryFn: getPropriedadesLista,
  });

  const { mutate: removerEmpresa } = useMutation({
    mutationFn: ({ id }: { id: number; nome: string }) => excluirEmpresa(id),
    onSuccess: (_data, variaveis) => {
      queryClient.invalidateQueries({ queryKey: ["empresas-agricolas"] });
      setEmpresaExcluindo(null);
      setToast({
        tipo: "sucesso",
        titulo: "Empresa excluída",
        descricao: `${variaveis.nome} foi removida com sucesso.`,
      });
    },
    onError: (erro: any) => {
      const mensagemApi = erro?.response?.data?.error ?? erro?.response?.data?.message;
      setEmpresaExcluindo(null);
      setToast({
        tipo: "erro",
        titulo: "Não foi possível excluir",
        descricao:
          mensagemApi ??
          "Verifique se a empresa não possui propriedades vinculadas e tente novamente.",
      });
    },
  });

  const abrirEmpresa = (e: EmpresaAgricola) => setSelecionada(e);

  const editarEmpresa = (e: EmpresaAgricola) => {
    setEmpresaEditando(e);
    setSelecionada(null);
    setAba("novo");
  };

  // Abre o modal de confirmação de exclusão
  const excluir = (e: EmpresaAgricola) => setEmpresaExcluindo(e);

  // Confirma e dispara a exclusão da empresa selecionada
  const confirmarExclusao = () => {
    if (!empresaExcluindo) return;
    const nome = empresaExcluindo.nome_fantasia || empresaExcluindo.razao_social;
    removerEmpresa({ id: empresaExcluindo.id_empresa, nome });
  };

  const aposSalvar = (nomeEmpresa: string) => {
    const editando = empresaEditando != null;
    queryClient.invalidateQueries({ queryKey: ["empresas-agricolas"] });
    setToast({
      tipo: "sucesso",
      titulo: editando
        ? "Empresa atualizada com sucesso!"
        : "Empresa cadastrada com sucesso!",
      descricao: editando
        ? `As alterações de ${nomeEmpresa} foram salvas.`
        : `${nomeEmpresa} já aparece na sua listagem de empresas.`,
    });
    setEmpresaEditando(null);
    setAba("lista");
  };

  const cabecalho =
    selecionada != null
      ? {
          titulo: selecionada.nome_fantasia || selecionada.razao_social,
          descricao: "Detalhes cadastrais da empresa agrícola",
        }
      : aba === "dashboard"
      ? {
          titulo: "Dashboard de Empresas Agrícolas",
          descricao:
            "Visão consolidada das empresas cadastradas, regimes tributários e propriedades vinculadas",
        }
      : aba === "lista"
      ? {
          titulo: "Gestão de Empresas Agrícolas",
          descricao: "Consulte, filtre e exporte todas as empresas cadastradas",
        }
      : {
          titulo: empresaEditando
            ? "Editar Empresa Agrícola"
            : "Cadastro de Empresa Agrícola",
          descricao: empresaEditando
            ? `Atualize os dados de ${empresaEditando.nome_fantasia || empresaEditando.razao_social}`
            : "Registre uma nova empresa agrícola",
        };

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      {toast && <Toast {...toast} onFechar={() => setToast(null)} />}

      <ConfirmDialog
        aberto={empresaExcluindo != null}
        tipo="perigo"
        titulo="Excluir empresa agrícola"
        mensagem={
          <>
            Tem certeza que deseja excluir a empresa{" "}
            <strong className="text-gray-700">
              {empresaExcluindo?.nome_fantasia || empresaExcluindo?.razao_social}
            </strong>
            ? Essa ação não poderá ser desfeita.
          </>
        }
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setEmpresaExcluindo(null)}
      />

      <TopBar
        breadcrumb="Gestão Agrícola"
        page={
          selecionada
            ? `Empresas › ${selecionada.nome_fantasia || selecionada.razao_social}`
            : "Empresas Agrícolas"
        }
      />

      {/* Abas internas do módulo */}
      {!selecionada && (
        <div className="flex bg-white border-b border-gray-200 px-6 pt-3">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                // Ao sair do formulário, encerra qualquer edição em andamento
                if (a.id !== "novo") setEmpresaEditando(null);
                setAba(a.id);
              }}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${aba === a.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {a.icone}{" "}
              {a.id === "novo" && empresaEditando ? "Editar Empresa" : a.label}
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
              <p className="text-sm">Carregando empresas...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-semibold">
                Não foi possível carregar as empresas agrícolas.
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {selecionada ? (
                <EmpresaDetalhe
                  empresa={selecionada}
                  propriedades={propriedades.filter(
                    (p: any) => Number(p.id_empresa) === selecionada.id_empresa
                  )}
                  onVoltar={() => setSelecionada(null)}
                />
              ) : aba === "dashboard" ? (
                <EmpresasDashboard
                  empresas={empresas}
                  propriedades={propriedades}
                  onVerEmpresa={abrirEmpresa}
                />
              ) : aba === "lista" ? (
                <EmpresasLista
                  empresas={empresas}
                  propriedades={propriedades}
                  onVerEmpresa={abrirEmpresa}
                  onNovo={() => {
                    setEmpresaEditando(null);
                    setAba("novo");
                  }}
                  onEditar={editarEmpresa}
                  onExcluir={excluir}
                />
              ) : (
                <EmpresaForm
                  embedded
                  empresasExistentes={empresas}
                  empresaEdicao={empresaEditando}
                  onSaved={aposSalvar}
                  onCancelar={() => {
                    setEmpresaEditando(null);
                    setAba("lista");
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel de detalhes da empresa
// ---------------------------------------------------------------------------
function EmpresaDetalhe({
  empresa,
  propriedades,
  onVoltar,
}: {
  empresa: EmpresaAgricola;
  propriedades: any[];
  onVoltar: () => void;
}) {
  const ativa = isEmpresaAtiva(empresa);
  const areaTotal = propriedades.reduce((s, p) => s + Number(p.area_total || 0), 0);

  const linha = (rotulo: string, valor?: string | null) => (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {rotulo}
      </p>
      <p className="text-sm text-gray-700 mt-0.5">{valor || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onVoltar}>
          ← Voltar
        </Button>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${
            ativa
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${ativa ? "bg-green-600" : "bg-gray-400"}`} />
          {ativa ? "Ativa" : "Inativa"}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Dados Cadastrais</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {linha("Razão Social", empresa.razao_social)}
          {linha("Nome Fantasia", empresa.nome_fantasia)}
          {linha("CNPJ", fmtCNPJ(empresa.cnpj))}
          {linha("Inscrição Estadual", empresa.inscricao_estadual)}
          {linha("Inscrição Municipal", empresa.inscricao_municipal)}
          {linha("Regime Tributário", empresa.regime_tributario_descricao)}
          {linha("Tipo de Empresa", empresa.tipo_empresa_descricao)}
          {linha("Data de Cadastro", fmtDataBR(empresa.data_cadastro))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Contato</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {linha("Telefone", fmtTelefone(empresa.telefone))}
          {linha("E-mail", empresa.email)}
          {linha("Website", empresa.website)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">
            Propriedades Vinculadas ({propriedades.length})
          </h3>
          <span className="text-xs text-gray-500">
            {areaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha no total
          </span>
        </div>
        {propriedades.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhuma propriedade vinculada a esta empresa.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {propriedades.map((p) => (
              <li key={p.id_propriedade} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {p.nome_propriedade}
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.tipo_solo_descricao ?? "—"} · {p.classe_capacidade_uso_descricao ?? "—"}
                  </p>
                </div>
                <span className="text-sm text-gray-600 tabular-nums">
                  {Number(p.area_total || 0).toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })} ha
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
