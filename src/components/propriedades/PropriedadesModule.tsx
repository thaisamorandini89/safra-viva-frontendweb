import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPropriedadesLista, excluirPropriedade } from "../../services/api";
import { colors } from "../../theme";
import TopBar from "../layout/TopBar";
import PageHeader from "../ui/PageHeader";
import Button from "../ui/Button";
import Toast, { DadosToast } from "../ui/Toast";
import ConfirmDialog from "../ui/ConfirmDialog";
import PropriedadesDashboard, { fmtHa } from "./PropriedadesDashboard";
import PropriedadesLista from "./PropriedadesLista";
import PropriedadeForm from "../forms/PropriedadeForm";

type Aba = "dashboard" | "lista" | "novo";

const ABAS: { id: Aba; icone: string; label: string }[] = [
  { id: "dashboard", icone: "📊", label: "Dashboard" },
  { id: "lista", icone: "📋", label: "Listagem" },
  { id: "novo", icone: "➕", label: "Nova Propriedade" },
];

export default function PropriedadesModule() {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [selecionada, setSelecionada] = useState<any | null>(null);
  const [propriedadeEditando, setPropriedadeEditando] = useState<any | null>(null);
  const [propriedadeExcluindo, setPropriedadeExcluindo] = useState<any | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);
  const queryClient = useQueryClient();

  const {
    data: propriedades = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["propriedades"],
    queryFn: getPropriedadesLista,
  });

  const { mutate: removerPropriedade } = useMutation({
    mutationFn: ({ id }: { id: number; nome: string }) => excluirPropriedade(id),
    onSuccess: (_data, variaveis) => {
      queryClient.invalidateQueries({ queryKey: ["propriedades"] });
      setPropriedadeExcluindo(null);
      setToast({
        tipo: "sucesso",
        titulo: "Propriedade excluída",
        descricao: `${variaveis.nome} foi removida com sucesso.`,
      });
    },
    onError: (erro: any) => {
      const mensagemApi = erro?.response?.data?.error ?? erro?.response?.data?.message;
      setPropriedadeExcluindo(null);
      setToast({
        tipo: "erro",
        titulo: "Não foi possível excluir",
        descricao:
          mensagemApi ??
          "Verifique se a propriedade não possui talhões vinculados e tente novamente.",
      });
    },
  });

  const abrirPropriedade = (p: any) => setSelecionada(p);

  const editarPropriedade = (p: any) => {
    setPropriedadeEditando(p);
    setSelecionada(null);
    setAba("novo");
  };

  // Abre o modal de confirmação de exclusão
  const excluir = (p: any) => setPropriedadeExcluindo(p);

  // Confirma e dispara a exclusão da propriedade selecionada
  const confirmarExclusao = () => {
    if (!propriedadeExcluindo) return;
    removerPropriedade({
      id: Number(propriedadeExcluindo.id_propriedade),
      nome: propriedadeExcluindo.nome_propriedade ?? "A propriedade",
    });
  };

  const aposSalvar = (nomePropriedade: string) => {
    const editando = propriedadeEditando != null;
    queryClient.invalidateQueries({ queryKey: ["propriedades"] });
    setToast({
      tipo: "sucesso",
      titulo: editando
        ? "Propriedade atualizada com sucesso!"
        : "Propriedade cadastrada com sucesso!",
      descricao: editando
        ? `As alterações de ${nomePropriedade} foram salvas.`
        : `${nomePropriedade} já aparece na sua listagem de propriedades.`,
    });
    setPropriedadeEditando(null);
    setAba("lista");
  };

  const cabecalho =
    selecionada != null
      ? {
          titulo: selecionada.nome_propriedade,
          descricao: "Detalhes cadastrais da propriedade rural",
        }
      : aba === "dashboard"
      ? {
          titulo: "Dashboard de Propriedades",
          descricao:
            "Visão consolidada das propriedades rurais, uso do solo e áreas de preservação",
        }
      : aba === "lista"
      ? {
          titulo: "Gestão de Propriedades",
          descricao: "Consulte, filtre e exporte todas as propriedades cadastradas",
        }
      : {
          titulo: propriedadeEditando
            ? "Editar Propriedade"
            : "Cadastro de Propriedade",
          descricao: propriedadeEditando
            ? `Atualize os dados de ${propriedadeEditando.nome_propriedade}`
            : "Registre uma nova propriedade rural",
        };

  return (
    <div className={`flex-1 overflow-auto ${colors.background.app}`}>
      {toast && <Toast {...toast} onFechar={() => setToast(null)} />}

      <ConfirmDialog
        aberto={propriedadeExcluindo != null}
        tipo="perigo"
        titulo="Excluir propriedade"
        mensagem={
          <>
            Tem certeza que deseja excluir a propriedade{" "}
            <strong className="text-gray-700">
              {propriedadeExcluindo?.nome_propriedade}
            </strong>
            ? Essa ação não poderá ser desfeita.
          </>
        }
        textoConfirmar="Excluir"
        textoCancelar="Cancelar"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setPropriedadeExcluindo(null)}
      />

      <TopBar
        breadcrumb="Gestão Agrícola"
        page={
          selecionada
            ? `Propriedades › ${selecionada.nome_propriedade}`
            : "Propriedades"
        }
      />

      {/* Abas internas do módulo */}
      {!selecionada && (
        <div className="flex bg-white border-b border-gray-200 px-6 pt-3">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id !== "novo") setPropriedadeEditando(null);
                setAba(a.id);
              }}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${aba === a.id
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {a.icone}{" "}
              {a.id === "novo" && propriedadeEditando ? "Editar Propriedade" : a.label}
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
              <p className="text-sm">Carregando propriedades...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-700 font-semibold">
                Não foi possível carregar as propriedades.
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {selecionada ? (
                <PropriedadeDetalhe
                  propriedade={selecionada}
                  onVoltar={() => setSelecionada(null)}
                />
              ) : aba === "dashboard" ? (
                <PropriedadesDashboard
                  propriedades={propriedades}
                  onVerPropriedade={abrirPropriedade}
                />
              ) : aba === "lista" ? (
                <PropriedadesLista
                  propriedades={propriedades}
                  onVerPropriedade={abrirPropriedade}
                  onNovo={() => {
                    setPropriedadeEditando(null);
                    setAba("novo");
                  }}
                  onEditar={editarPropriedade}
                  onExcluir={excluir}
                />
              ) : (
                <PropriedadeForm
                  embedded
                  propriedadesExistentes={propriedades}
                  propriedadeEdicao={propriedadeEditando}
                  onSaved={aposSalvar}
                  onCancelar={() => {
                    setPropriedadeEditando(null);
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
// Painel de detalhes da propriedade
// ---------------------------------------------------------------------------
function PropriedadeDetalhe({
  propriedade,
  onVoltar,
}: {
  propriedade: any;
  onVoltar: () => void;
}) {
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
      <Button variant="ghost" onClick={onVoltar}>
        ← Voltar
      </Button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Identificação</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {linha("Propriedade", propriedade.nome_propriedade)}
          {linha("Empresa", propriedade.empresa_nome)}
          {linha("CAR", propriedade.car)}
          {linha("CCIR", propriedade.ccir)}
          {linha("NIRF", propriedade.nirf)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Dados Físicos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {linha("Área Total", `${fmtHa(Number(propriedade.area_total || 0), 1)} ha`)}
          {linha("Área Agricultável", `${fmtHa(Number(propriedade.area_agricultavel || 0), 1)} ha`)}
          {linha("Área de Preservação", `${fmtHa(Number(propriedade.area_preservacao || 0), 1)} ha`)}
          {linha("Área de Pastagem", `${fmtHa(Number(propriedade.area_pastagem || 0), 1)} ha`)}
          {linha("Vegetação Nativa", `${fmtHa(Number(propriedade.area_vegetacao_nativa || 0), 1)} ha`)}
          {linha(
            "Altitude Média",
            propriedade.altitude_media != null
              ? `${fmtHa(Number(propriedade.altitude_media), 0)} m`
              : null
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Solo e Localização</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {linha(
            "Tipo de Solo",
            propriedade.tipo_solo_descricao
              ? `${propriedade.tipo_solo_descricao}`
              : null
          )}
          {linha(
            "Classe de Capacidade de Uso",
            propriedade.classe_capacidade_uso_descricao
              ? `${propriedade.classe_capacidade_uso_sigla ?? ""} — ${propriedade.classe_capacidade_uso_descricao}`
              : null
          )}
          {linha(
            "Coordenadas",
            propriedade.latitude != null && propriedade.longitude != null
              ? `${propriedade.latitude}, ${propriedade.longitude}`
              : null
          )}
        </div>
      </div>

      {propriedade.observacoes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Observações</h3>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {propriedade.observacoes}
          </p>
        </div>
      )}
    </div>
  );
}
