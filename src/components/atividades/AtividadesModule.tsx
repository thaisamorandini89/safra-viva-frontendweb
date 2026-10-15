import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAtividades, criarAtividade } from "../../services/api";
import { AtividadeAgricola, NovaAtividadePayload } from "../../types/atividade";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import Toast, { DadosToast } from "../ui/Toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import AtividadesDashboard from "./AtividadesDashboard";
import AtividadesLista from "./AtividadesLista";
import AtividadeForm from "./AtividadeForm";
import AtividadeDetalhe from "./AtividadeDetalhe";

type Aba = "dashboard" | "lista" | "nova";

const ABAS: { id: Aba; icone: string; label: string }[] = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "lista", icone: "📋", label: "Listagem" },
  { id: "nova", icone: "➕", label: "Nova Atividade" },
];

export default function AtividadesModule() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [selecionada, setSelecionada] = useState<AtividadeAgricola | null>(null);
  const [atividadeEditando, setAtividadeEditando] = useState<AtividadeAgricola | null>(null);
  const [atividadeExcluindo, setAtividadeExcluindo] = useState<AtividadeAgricola | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);
  const queryClient = useQueryClient();

  const {
    data: atividades = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["atividades"],
    queryFn: getAtividades,
  });

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: (dados: NovaAtividadePayload) => criarAtividade(dados),
    onSuccess: (nova) => {
      queryClient.setQueryData<AtividadeAgricola[]>(["atividades"], (antigas = []) => [
        ...antigas,
        nova,
      ]);
      setToast({
        tipo: "sucesso",
        titulo: "Atividade registrada com sucesso!",
        descricao: `${nova.tipo_atividade} já aparece na sua listagem de atividades.`,
      });
      setAba("lista");
    },
    onError: (erro: any) => {
      setToast({
        tipo: "erro",
        titulo: "Não foi possível salvar a atividade",
        descricao:
          erro?.response?.data?.message ??
          erro?.message ??
          "Verifique os dados informados e tente novamente.",
      });
    },
  });

  // Recebe o payload do formulário e decide entre criar ou atualizar
  const handleSalvarForm = (dados: NovaAtividadePayload) => {
    if (atividadeEditando) {
      const atualizada: AtividadeAgricola = { ...atividadeEditando, ...dados };
      queryClient.setQueryData<AtividadeAgricola[]>(["atividades"], (antigas = []) =>
        antigas.map((a) => (a.id === atividadeEditando.id ? atualizada : a))
      );
      setToast({
        tipo: "sucesso",
        titulo: "Atividade atualizada com sucesso!",
        descricao: `As alterações de ${atualizada.tipo_atividade} foram salvas.`,
      });
      setAtividadeEditando(null);
      setAba("lista");
    } else {
      salvar(dados);
    }
  };

  const editarAtividade = (a: AtividadeAgricola) => {
    setAtividadeEditando(a);
    setSelecionada(null);
    setAba("nova");
  };

  // Abre o modal de confirmação de exclusão
  const excluir = (a: AtividadeAgricola) => setAtividadeExcluindo(a);

  // Confirma e remove a atividade da listagem
  const confirmarExclusao = () => {
    if (!atividadeExcluindo) return;
    const nome = atividadeExcluindo.tipo_atividade;
    queryClient.setQueryData<AtividadeAgricola[]>(["atividades"], (antigas = []) =>
      antigas.filter((a) => a.id !== atividadeExcluindo.id)
    );
    setToast({
      tipo: "sucesso",
      titulo: "Atividade excluída",
      descricao: `${nome} foi removida com sucesso.`,
    });
    setAtividadeExcluindo(null);
  };

  const cabecalho = selecionada
    ? {
        titulo: selecionada.tipo_atividade,
        descricao: "Detalhes da operação, recursos utilizados e custos",
      }
    : aba === "dashboard"
    ? {
        titulo: "Dashboard de Atividades",
        descricao:
          "Planejamento, execução e acompanhamento das operações realizadas em campo",
      }
    : aba === "lista"
    ? {
        titulo: "Gestão de Atividades",
        descricao: "Consulte, filtre e exporte o histórico operacional das safras",
      }
    : {
        titulo: atividadeEditando ? "Editar Atividade" : "Cadastro de Atividade",
        descricao: atividadeEditando
          ? `Atualize os dados da atividade ${atividadeEditando.tipo_atividade}`
          : "Registre uma nova operação agrícola vinculada a um talhão",
      };

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      {toast && <Toast {...toast} onFechar={() => setToast(null)} />}

      <ConfirmDialog
        aberto={atividadeExcluindo != null}
        tipo="perigo"
        titulo="Excluir atividade"
        mensagem={
          <>
            Tem certeza que deseja excluir a atividade{" "}
            <strong className="text-gray-700">
              {atividadeExcluindo?.tipo_atividade}
            </strong>
            ? Essa ação não poderá ser desfeita.
          </>
        }
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setAtividadeExcluindo(null)}
      />
      <TopBar
        breadcrumb="Gestão Agrícola"
        page={selecionada ? `Atividades › ${selecionada.tipo_atividade}` : "Atividades"}
      />

      {!selecionada && (
        <div className="flex bg-white border-b border-gray-200 px-6 pt-3">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id !== "nova") setAtividadeEditando(null);
                setAba(a.id);
              }}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${aba === a.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {a.icone}{" "}
              {a.id === "nova" && atividadeEditando ? "Editar Atividade" : a.label}
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
              <p className="text-sm">Carregando atividades...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-semibold">
                Não foi possível carregar as atividades.
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {selecionada ? (
                <AtividadeDetalhe
                  atividade={selecionada}
                  onVoltar={() => setSelecionada(null)}
                />
              ) : aba === "dashboard" ? (
                <AtividadesDashboard
                  atividades={atividades}
                  onVerAtividade={setSelecionada}
                />
              ) : aba === "lista" ? (
                <AtividadesLista
                  atividades={atividades}
                  onVerAtividade={setSelecionada}
                  onNova={() => {
                    setAtividadeEditando(null);
                    setAba("nova");
                  }}
                  onEditar={editarAtividade}
                  onExcluir={excluir}
                />
              ) : (
                <AtividadeForm
                  atividades={atividades}
                  salvando={salvando}
                  atividadeEdicao={atividadeEditando}
                  onCancelar={() => {
                    setAtividadeEditando(null);
                    setAba("lista");
                  }}
                  onSalvar={handleSalvarForm}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
