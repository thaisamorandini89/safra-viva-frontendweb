import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSafras,
  getPropriedadesLista,
  criarSafra,
  atualizarSafra,
  excluirSafra,
} from "../../services/api";
import { Safra, SafraPayload, fmtData } from "../../types/financeiro";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import ConfirmDialog from "../ui/ConfirmDialog";
import Toast, { DadosToast } from "../ui/Toast";

interface Campos {
  nome: string;
  cultura: string;
  id_propriedade: string;
  data_inicio: string;
  data_fim: string;
  area_plantada: string;
}

const VAZIO: Campos = {
  nome: "",
  cultura: "",
  id_propriedade: "",
  data_inicio: "",
  data_fim: "",
  area_plantada: "",
};

export default function SafrasAba() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ id: number | null; campos: Campos } | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aExcluir, setAExcluir] = useState<Safra | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);

  const {
    data: safras = [],
    isLoading,
    isError,
  } = useQuery<Safra[]>({
    queryKey: ["financeiro-safras"],
    queryFn: () => getSafras(),
  });
  const { data: propriedadesApi = [] } = useQuery<any[]>({
    queryKey: ["propriedades"],
    queryFn: getPropriedadesLista,
  });

  const propriedades = useMemo(() => {
    const mapa = new Map<number, string>();
    propriedadesApi.forEach((p: any) => {
      const id = Number(p.id_propriedade ?? p.id);
      if (id > 0) mapa.set(id, p.nome_propriedade ?? p.nome ?? `Propriedade ${id}`);
    });
    // Garante a propriedade das safras já listadas (ex.: dados de demonstração)
    safras.forEach((s) => {
      if (!mapa.has(s.id_propriedade))
        mapa.set(s.id_propriedade, s.nome_propriedade ?? `Propriedade ${s.id_propriedade}`);
    });
    return Array.from(mapa, ([id, nome]) => ({ id, nome }));
  }, [propriedadesApi, safras]);

  // O nome da safra aparece nos lançamentos e nos indicadores
  const atualizarTelas = () =>
    ["financeiro-safras", "financeiro-lancamentos", "financeiro-indicadores"].forEach((k) =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );

  const avisarErro = (titulo: string) => (erro: any) =>
    setToast({ tipo: "erro", titulo, descricao: erro?.message });

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: ({ id, dados }: { id: number | null; dados: SafraPayload }) =>
      id == null ? criarSafra(dados) : atualizarSafra(id, dados),
    onSuccess: (_safra, { id }) => {
      atualizarTelas();
      setToast({ tipo: "sucesso", titulo: id == null ? "Safra cadastrada!" : "Safra atualizada!" });
      setForm(null);
    },
    onError: avisarErro("Não foi possível salvar a safra."),
  });

  const { mutate: alternarStatus } = useMutation({
    mutationFn: (s: Safra) => atualizarSafra(s.id_safra, { status: s.status === false }),
    onSuccess: (_safra, s) => {
      atualizarTelas();
      setToast({ tipo: "sucesso", titulo: s.status === false ? "Safra reativada." : "Safra inativada." });
    },
    onError: avisarErro("Não foi possível alterar a situação da safra."),
  });

  const { mutate: excluir } = useMutation({
    mutationFn: (s: Safra) => excluirSafra(s.id_safra),
    onSuccess: () => {
      atualizarTelas();
      setToast({ tipo: "sucesso", titulo: "Safra excluída." });
    },
    onError: avisarErro("Não foi possível excluir a safra."),
    onSettled: () => setAExcluir(null),
  });

  const abrir = (s?: Safra) => {
    setErros({});
    setForm({
      id: s?.id_safra ?? null,
      campos: s
        ? {
            nome: s.nome,
            cultura: s.cultura,
            id_propriedade: String(s.id_propriedade),
            data_inicio: s.data_inicio ?? "",
            data_fim: s.data_fim ?? "",
            area_plantada: s.area_plantada != null ? String(s.area_plantada) : "",
          }
        : VAZIO,
    });
  };

  const campo = (patch: Partial<Campos>) =>
    setForm((f) => (f ? { ...f, campos: { ...f.campos, ...patch } } : f));

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form) return;
    const c = form.campos;
    const e: Record<string, string> = {};
    if (!c.nome.trim()) e.nome = "Informe o nome da safra.";
    if (!c.cultura.trim()) e.cultura = "Informe a cultura.";
    if (!c.id_propriedade) e.id_propriedade = "Selecione a propriedade.";
    if (!c.data_inicio) e.data_inicio = "Informe a data de início.";
    setErros(e);
    if (Object.keys(e).length) return;

    salvar({
      id: form.id,
      dados: {
        nome: c.nome.trim(),
        cultura: c.cultura.trim(),
        id_propriedade: Number(c.id_propriedade),
        data_inicio: c.data_inicio,
        data_fim: c.data_fim || null,
        area_plantada: c.area_plantada === "" ? null : Number(c.area_plantada),
      },
    });
  }

  const nomePropriedade = (s: Safra) =>
    s.nome_propriedade ??
    propriedades.find((p) => p.id === s.id_propriedade)?.nome ??
    `Propriedade ${s.id_propriedade}`;

  return (
    <div className="space-y-4">
      {form ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
        >
          <SectionTitle>{form.id == null ? "Nova Safra" : "Editar Safra"}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Nome" required error={erros.nome}>
              <Input
                value={form.campos.nome}
                error={!!erros.nome}
                placeholder="Ex.: Soja 2026/27"
                onChange={(e) => campo({ nome: e.target.value })}
              />
            </Field>
            <Field label="Cultura" required error={erros.cultura}>
              <Input
                value={form.campos.cultura}
                error={!!erros.cultura}
                placeholder="Ex.: Soja"
                onChange={(e) => campo({ cultura: e.target.value })}
              />
            </Field>
            <Field label="Propriedade" required error={erros.id_propriedade}>
              <Select
                value={form.campos.id_propriedade}
                placeholder="Selecione..."
                error={!!erros.id_propriedade}
                disabled={form.id != null}
                onChange={(e) => campo({ id_propriedade: e.target.value })}
              >
                {propriedades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
              {form.id != null && (
                <p className="mt-1 text-xs text-gray-400">
                  A propriedade não pode ser alterada depois do cadastro.
                </p>
              )}
            </Field>
            <Field label="Data de início" required error={erros.data_inicio}>
              <Input
                type="date"
                value={form.campos.data_inicio}
                error={!!erros.data_inicio}
                onChange={(e) => campo({ data_inicio: e.target.value })}
              />
            </Field>
            <Field label="Data de término">
              <Input
                type="date"
                value={form.campos.data_fim}
                onChange={(e) => campo({ data_fim: e.target.value })}
              />
            </Field>
            <Field label="Área plantada (ha)">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.campos.area_plantada}
                onChange={(e) => campo({ area_plantada: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : form.id == null ? "Cadastrar Safra" : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{safras.length} safra(s) cadastrada(s)</p>
          <Button onClick={() => abrir()}>➕ Nova Safra</Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Carregando safras...</div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-700">
            Não foi possível carregar as safras.
          </div>
        ) : safras.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhuma safra cadastrada. Use “Nova Safra” para cadastrar a primeira.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3">Safra</th>
                  <th className="px-4 py-3">Cultura</th>
                  <th className="px-4 py-3">Propriedade</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3 text-right">Área (ha)</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {safras.map((s) => {
                  const ativa = s.status !== false;
                  return (
                    <tr
                      key={s.id_safra}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">{s.nome}</td>
                      <td className="px-4 py-3 text-gray-600">{s.cultura}</td>
                      <td className="px-4 py-3 text-gray-600">{nomePropriedade(s)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {fmtData(s.data_inicio)} a {fmtData(s.data_fim)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">
                        {s.area_plantada != null
                          ? Number(s.area_plantada).toLocaleString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border font-semibold text-xs px-2 py-1 ${
                            ativa
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrir(s)}
                          className="text-gray-400 hover:text-green-700 transition px-1.5"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => alternarStatus(s)}
                          className="text-gray-400 hover:text-amber-600 transition px-1.5"
                          title={ativa ? "Inativar" : "Reativar"}
                        >
                          {ativa ? "⏸️" : "▶️"}
                        </button>
                        <button
                          onClick={() => setAExcluir(s)}
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
        titulo="Excluir safra"
        tipo="perigo"
        mensagem={
          <>
            Deseja realmente excluir a safra <strong>{aExcluir?.nome}</strong>? Uma safra já
            usada em lançamentos não pode ser excluída, apenas inativada.
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
