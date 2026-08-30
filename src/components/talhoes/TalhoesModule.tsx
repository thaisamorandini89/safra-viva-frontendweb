import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTalhoes, criarTalhao } from "../../services/api";
import { Talhao, NovoTalhaoPayload } from "../../types/talhao";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import TalhoesDashboard from "./TalhoesDashboard";
import TalhoesLista from "./TalhoesLista";
import TalhaoForm from "./TalhaoForm";
import TalhaoDetalhe from "./TalhaoDetalhe";

type Aba = "dashboard" | "lista" | "novo";

const ABAS: { id: Aba; icone: string; label: string }[] = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "lista", icone: "📋", label: "Listagem" },
  { id: "novo", icone: "➕", label: "Novo Talhão" },
];

export default function TalhoesModule() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [selecionado, setSelecionado] = useState<Talhao | null>(null);
  const queryClient = useQueryClient();

  const {
    data: talhoes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["talhoes"],
    queryFn: getTalhoes,
  });

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: (dados: NovoTalhaoPayload) => criarTalhao(dados),
    onSuccess: (novo) => {
      // Atualiza o cache local para refletir o novo talhão imediatamente
      queryClient.setQueryData<Talhao[]>(["talhoes"], (antigos = []) => [
        ...antigos,
        novo,
      ]);
      alert(`✅ Talhão "${novo.nome}" cadastrado com sucesso!`);
      setAba("lista");
    },
    onError: (erro: any) => {
      alert(
        `❌ Não foi possível salvar o talhão.\n\n${
          erro?.response?.data?.message ?? erro?.message ?? "Erro desconhecido."
        }`
      );
    },
  });

  const abrirTalhao = (t: Talhao) => setSelecionado(t);

  const cabecalho =
    selecionado != null
      ? { titulo: selecionado.nome, descricao: "Detalhes e histórico do talhão" }
      : aba === "dashboard"
      ? {
          titulo: "Dashboard de Talhões",
          descricao:
            "Visão consolidada da ocupação, do solo e da produtividade das suas áreas produtivas",
        }
      : aba === "lista"
      ? {
          titulo: "Gestão de Talhões",
          descricao: "Consulte, filtre e exporte todos os talhões cadastrados",
        }
      : {
          titulo: "Cadastro de Talhão",
          descricao: "Registre uma nova área produtiva da propriedade",
        };

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      <TopBar
        breadcrumb="Gestão Agrícola"
        page={selecionado ? `Talhões › ${selecionado.codigo}` : "Talhões"}
      />

      {/* Abas internas do módulo */}
      {!selecionado && (
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
              <p className="text-sm">Carregando talhões...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-semibold">
                Não foi possível carregar os talhões.
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {selecionado ? (
                <TalhaoDetalhe
                  talhao={selecionado}
                  onVoltar={() => setSelecionado(null)}
                />
              ) : aba === "dashboard" ? (
                <TalhoesDashboard talhoes={talhoes} onVerTalhao={abrirTalhao} />
              ) : aba === "lista" ? (
                <TalhoesLista
                  talhoes={talhoes}
                  onVerTalhao={abrirTalhao}
                  onNovo={() => setAba("novo")}
                />
              ) : (
                <TalhaoForm
                  talhoes={talhoes}
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
