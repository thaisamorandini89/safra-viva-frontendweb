import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAtividades, criarAtividade } from "../../services/api";
import { AtividadeAgricola, NovaAtividadePayload } from "../../types/atividade";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
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
      alert(`✅ Atividade "${nova.tipo_atividade}" registrada com sucesso!`);
      setAba("lista");
    },
    onError: (erro: any) => {
      alert(
        `❌ Não foi possível salvar a atividade.\n\n${
          erro?.response?.data?.message ?? erro?.message ?? "Erro desconhecido."
        }`
      );
    },
  });

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
        titulo: "Cadastro de Atividade",
        descricao: "Registre uma nova operação agrícola vinculada a um talhão",
      };

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      <TopBar
        breadcrumb="Gestão Agrícola"
        page={selecionada ? `Atividades › ${selecionada.tipo_atividade}` : "Atividades"}
      />

      {!selecionada && (
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
                  onNova={() => setAba("nova")}
                />
              ) : (
                <AtividadeForm
                  atividades={atividades}
                  salvando={salvando}
                  onCancelar={() => setAba("lista")}
                  onSalvar={(dados) => salvar(dados)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
