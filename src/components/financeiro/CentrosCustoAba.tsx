import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCentrosCusto,
  criarCentroCusto,
  atualizarCentroCusto,
  excluirCentroCusto,
} from "../../services/api";
import { CentroCusto, CentroCustoPayload, TipoCentroCusto } from "../../types/financeiro";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import ConfirmDialog from "../ui/ConfirmDialog";
import Toast, { DadosToast } from "../ui/Toast";

interface Campos {
  nome: string;
  tipo: TipoCentroCusto;
  descricao: string;
}

const VAZIO: Campos = { nome: "", tipo: "OPERACIONAL", descricao: "" };

const ROTULO_TIPO: Record<TipoCentroCusto, string> = {
  OPERACIONAL: "Operacional",
  ADMINISTRATIVO: "Administrativo",
};

export default function CentrosCustoAba() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ id: number | null; campos: Campos } | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aExcluir, setAExcluir] = useState<CentroCusto | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);

  const {
    data: centros = [],
    isLoading,
    isError,
  } = useQuery<CentroCusto[]>({
    queryKey: ["financeiro-centros-custo"],
    queryFn: () => getCentrosCusto(),
  });

  const atualizarTelas = () =>
    queryClient.invalidateQueries({ queryKey: ["financeiro-centros-custo"] });

  const avisarErro = (titulo: string) => (erro: any) =>
    setToast({ tipo: "erro", titulo, descricao: erro?.message });

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: ({ id, dados }: { id: number | null; dados: CentroCustoPayload }) =>
      id == null ? criarCentroCusto(dados) : atualizarCentroCusto(id, dados),
    onSuccess: (_centro, { id }) => {
      atualizarTelas();
      setToast({
        tipo: "sucesso",
        titulo: id == null ? "Centro de custo cadastrado!" : "Centro de custo atualizado!",
      });
      setForm(null);
    },
    onError: avisarErro("Não foi possível salvar o centro de custo."),
  });

  const { mutate: alternarStatus } = useMutation({
    mutationFn: (c: CentroCusto) =>
      atualizarCentroCusto(c.id_centro_custo, { status: c.status === false }),
    onSuccess: (_centro, c) => {
      atualizarTelas();
      setToast({
        tipo: "sucesso",
        titulo: c.status === false ? "Centro de custo reativado." : "Centro de custo inativado.",
      });
    },
    onError: avisarErro("Não foi possível alterar a situação do centro de custo."),
  });

  const { mutate: excluir } = useMutation({
    mutationFn: (c: CentroCusto) => excluirCentroCusto(c.id_centro_custo),
    onSuccess: () => {
      atualizarTelas();
      setToast({ tipo: "sucesso", titulo: "Centro de custo excluído." });
    },
    onError: avisarErro("Não foi possível excluir o centro de custo."),
    onSettled: () => setAExcluir(null),
  });

  const abrir = (c?: CentroCusto) => {
    setErros({});
    setForm({
      id: c?.id_centro_custo ?? null,
      campos: c ? { nome: c.nome, tipo: c.tipo, descricao: c.descricao ?? "" } : VAZIO,
    });
  };

  const campo = (patch: Partial<Campos>) =>
    setForm((f) => (f ? { ...f, campos: { ...f.campos, ...patch } } : f));

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form) return;
    const c = form.campos;
    if (!c.nome.trim()) {
      setErros({ nome: "Informe o nome do centro de custo." });
      return;
    }
    setErros({});
    salvar({
      id: form.id,
      dados: { nome: c.nome.trim(), tipo: c.tipo, descricao: c.descricao.trim() || null },
    });
  }

  return (
    <div className="space-y-4">
      {form ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
        >
          <SectionTitle>
            {form.id == null ? "Novo Centro de Custo" : "Editar Centro de Custo"}
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Nome" required error={erros.nome}>
              <Input
                value={form.campos.nome}
                error={!!erros.nome}
                placeholder="Ex.: Lavoura"
                onChange={(e) => campo({ nome: e.target.value })}
              />
            </Field>
            <Field label="Tipo" required>
              <Select
                value={form.campos.tipo}
                onChange={(e) => campo({ tipo: e.target.value as TipoCentroCusto })}
              >
                <option value="OPERACIONAL">Operacional</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
              </Select>
            </Field>
            <Field label="Descrição" className="lg:col-span-2">
              <Input
                value={form.campos.descricao}
                placeholder="Para que serve este centro de custo"
                onChange={(e) => campo({ descricao: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando
                ? "Salvando..."
                : form.id == null
                ? "Cadastrar Centro de Custo"
                : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {centros.length} centro(s) de custo cadastrado(s)
          </p>
          <Button onClick={() => abrir()}>➕ Novo Centro de Custo</Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Carregando centros de custo...
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-700">
            Não foi possível carregar os centros de custo.
          </div>
        ) : centros.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhum centro de custo cadastrado. Use “Novo Centro de Custo” para cadastrar o
            primeiro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3">Centro de Custo</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {centros.map((c) => {
                  const ativo = c.status !== false;
                  return (
                    <tr
                      key={c.id_centro_custo}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">{c.nome}</td>
                      <td className="px-4 py-3 text-gray-600">{ROTULO_TIPO[c.tipo] ?? c.tipo}</td>
                      <td className="px-4 py-3 text-gray-500">{c.descricao || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border font-semibold text-xs px-2 py-1 ${
                            ativo
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrir(c)}
                          className="text-gray-400 hover:text-green-700 transition px-1.5"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => alternarStatus(c)}
                          className="text-gray-400 hover:text-amber-600 transition px-1.5"
                          title={ativo ? "Inativar" : "Reativar"}
                        >
                          {ativo ? "⏸️" : "▶️"}
                        </button>
                        <button
                          onClick={() => setAExcluir(c)}
                          className="text-gray-400 hover:text-red-600 transition px-1.5"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        aberto={aExcluir != null}
        titulo="Excluir centro de custo"
        tipo="perigo"
        mensagem={
          <>
            Deseja realmente excluir o centro de custo <strong>{aExcluir?.nome}</strong>? Um
            centro já usado em lançamentos não pode ser excluído, apenas inativado.
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
