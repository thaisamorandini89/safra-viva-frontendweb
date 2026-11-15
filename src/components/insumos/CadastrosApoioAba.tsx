import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFornecedores,
  criarFornecedor,
  atualizarFornecedor,
  excluirFornecedor,
  getFabricantes,
  criarFabricante,
  atualizarFabricante,
  excluirFabricante,
  getMarcas,
  criarMarca,
  atualizarMarca,
  excluirMarca,
} from "../../services/api";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Input from "../ui/Input";
import SectionTitle from "../ui/SectionTitle";
import ConfirmDialog from "../ui/ConfirmDialog";
import Toast, { DadosToast } from "../ui/Toast";

type Registro = Record<string, any>;

interface Campo {
  nome: string;
  rotulo: string;
  obrigatorio?: boolean;
  placeholder?: string;
  naLista?: boolean;
}

interface ConfigCadastro {
  chave: string;
  singular: string;
  plural: string;
  genero: "o" | "a";
  campoId: string;
  campoNome: string;
  /** Fornecedor e fabricante podem ser inativados; a marca não tem situação */
  temStatus: boolean;
  campos: Campo[];
  listar: () => Promise<Registro[]>;
  criar: (dados: Registro) => Promise<unknown>;
  atualizar: (id: number, dados: Registro) => Promise<unknown>;
  excluir: (id: number) => Promise<void>;
}

const CADASTROS: ConfigCadastro[] = [
  {
    chave: "fornecedores",
    singular: "fornecedor",
    plural: "Fornecedores",
    genero: "o",
    campoId: "id_fornecedor",
    campoNome: "nome_fornecedor",
    temStatus: true,
    campos: [
      { nome: "nome_fornecedor", rotulo: "Razão social", obrigatorio: true, placeholder: "Ex.: Agro Insumos Ltda", naLista: true },
      { nome: "nome_fantasia", rotulo: "Nome fantasia", placeholder: "Ex.: Agro Insumos", naLista: true },
      { nome: "cnpj", rotulo: "CNPJ", placeholder: "00.000.000/0000-00", naLista: true },
      { nome: "telefone", rotulo: "Telefone", placeholder: "(00) 00000-0000", naLista: true },
      { nome: "email", rotulo: "E-mail", placeholder: "contato@empresa.com.br" },
      { nome: "observacoes", rotulo: "Observações" },
    ],
    listar: getFornecedores,
    criar: criarFornecedor,
    atualizar: atualizarFornecedor,
    excluir: excluirFornecedor,
  },
  {
    chave: "fabricantes",
    singular: "fabricante",
    plural: "Fabricantes",
    genero: "o",
    campoId: "id_fabricante",
    campoNome: "nome_fabricante",
    temStatus: true,
    campos: [
      { nome: "nome_fabricante", rotulo: "Nome", obrigatorio: true, placeholder: "Ex.: Bayer", naLista: true },
      { nome: "cnpj", rotulo: "CNPJ", placeholder: "00.000.000/0000-00", naLista: true },
      { nome: "telefone", rotulo: "Telefone", placeholder: "(00) 0000-0000", naLista: true },
      { nome: "email", rotulo: "E-mail", placeholder: "contato@fabricante.com.br" },
      { nome: "website", rotulo: "Site", placeholder: "https://", naLista: true },
      { nome: "observacoes", rotulo: "Observações" },
    ],
    listar: getFabricantes,
    criar: criarFabricante,
    atualizar: atualizarFabricante,
    excluir: excluirFabricante,
  },
  {
    chave: "marcas",
    singular: "marca",
    plural: "Marcas",
    genero: "a",
    campoId: "id_marca",
    campoNome: "descricao_marca",
    temStatus: false,
    campos: [
      { nome: "descricao_marca", rotulo: "Marca", obrigatorio: true, placeholder: "Ex.: Petrofértil", naLista: true },
    ],
    listar: getMarcas,
    criar: (d) => criarMarca(d.descricao_marca),
    atualizar: (id, d) => atualizarMarca(id, d.descricao_marca),
    excluir: excluirMarca,
  },
];

const formatarCnpj = (v?: string | null) =>
  v && v.length === 14
    ? `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
    : v || "—";

function SecaoCadastro({ config }: { config: ConfigCadastro }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{ id: number | null; campos: Registro } | null>(null);
  const [erro, setErro] = useState("");
  const [aExcluir, setAExcluir] = useState<Registro | null>(null);
  const [toast, setToast] = useState<DadosToast | null>(null);

  const { data: itens = [], isLoading } = useQuery<Registro[]>({
    queryKey: [config.chave],
    queryFn: config.listar,
  });

  const nomeDe = (r: Registro) => r[config.campoNome];
  const artigo = config.genero;
  const novoRotulo = `${artigo === "o" ? "Novo" : "Nova"} ${config.singular}`;

  // os insumos mostram o nome do fabricante, da marca e do fornecedor
  const atualizarTelas = () =>
    [config.chave, "insumos"].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

  const avisarErro = (titulo: string) => (e: any) =>
    setToast({ tipo: "erro", titulo, descricao: e?.message });

  const { mutate: salvar, isPending: salvando } = useMutation({
    mutationFn: ({ id, dados }: { id: number | null; dados: Registro }) =>
      id == null ? config.criar(dados) : config.atualizar(id, dados),
    onSuccess: (_r, { id }) => {
      atualizarTelas();
      setToast({
        tipo: "sucesso",
        titulo: `${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${
          id == null ? "cadastrad" : "atualizad"
        }${artigo}!`,
      });
      setForm(null);
    },
    onError: avisarErro(`Não foi possível salvar ${artigo} ${config.singular}.`),
  });

  const { mutate: alternarStatus } = useMutation({
    mutationFn: (r: Registro) => config.atualizar(r[config.campoId], { status: r.status === false }),
    onSuccess: (_r, r) => {
      atualizarTelas();
      setToast({
        tipo: "sucesso",
        titulo: `${nomeDe(r)} ${r.status === false ? "reativad" : "inativad"}${artigo}.`,
      });
    },
    onError: avisarErro(`Não foi possível alterar a situação d${artigo} ${config.singular}.`),
  });

  const { mutate: excluir } = useMutation({
    mutationFn: (r: Registro) => config.excluir(r[config.campoId]),
    onSuccess: (_r, r) => {
      atualizarTelas();
      setToast({ tipo: "sucesso", titulo: `${nomeDe(r)} excluíd${artigo}.` });
    },
    onError: avisarErro(`Não foi possível excluir ${artigo} ${config.singular}.`),
    onSettled: () => setAExcluir(null),
  });

  const abrir = (r?: Registro) => {
    setErro("");
    setForm({
      id: r ? r[config.campoId] : null,
      campos: Object.fromEntries(config.campos.map((c) => [c.nome, r?.[c.nome] ?? ""])),
    });
  };

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form) return;
    const faltando = config.campos.find((c) => c.obrigatorio && !String(form.campos[c.nome]).trim());
    if (faltando) {
      setErro(`Informe ${faltando.rotulo.toLowerCase()}.`);
      return;
    }
    setErro("");
    const dados = Object.fromEntries(
      config.campos.map((c) => [c.nome, String(form.campos[c.nome] ?? "").trim()])
    );
    salvar({ id: form.id, dados });
  }

  const colunas = config.campos.filter((c) => c.naLista);

  return (
    <div className="space-y-4">
      {form ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
        >
          <SectionTitle>
            {form.id == null ? novoRotulo : `Editar ${config.singular}`}
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.campos.map((c, i) => (
              <Field
                key={c.nome}
                label={c.rotulo}
                required={c.obrigatorio}
                error={i === 0 ? erro : undefined}
              >
                <Input
                  value={form.campos[c.nome]}
                  placeholder={c.placeholder}
                  error={i === 0 && !!erro}
                  onChange={(e) =>
                    setForm((f) =>
                      f ? { ...f, campos: { ...f.campos, [c.nome]: e.target.value } } : f
                    )
                  }
                />
              </Field>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : form.id == null ? "Cadastrar" : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {itens.length} {config.plural.toLowerCase()} cadastrad{artigo}s
          </p>
          <Button onClick={() => abrir()}>➕ {novoRotulo}</Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhum{artigo === "a" ? "a" : ""} {config.singular} cadastrad{artigo}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50">
                  {colunas.map((c) => (
                    <th key={c.nome} className="px-4 py-3">
                      {c.rotulo}
                    </th>
                  ))}
                  {config.temStatus && <th className="px-4 py-3">Situação</th>}
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((r) => {
                  const ativo = r.status !== false;
                  return (
                    <tr
                      key={r[config.campoId]}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                    >
                      {colunas.map((c, i) => (
                        <td
                          key={c.nome}
                          className={`px-4 py-3 ${i === 0 ? "font-medium text-gray-700" : "text-gray-600"}`}
                        >
                          {c.nome === "cnpj" ? formatarCnpj(r.cnpj) : r[c.nome] || "—"}
                        </td>
                      ))}
                      {config.temStatus && (
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border font-semibold text-xs px-2 py-1 ${
                              ativo
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            {ativo ? `Ativ${artigo}` : `Inativ${artigo}`}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrir(r)}
                          className="text-gray-400 hover:text-green-700 transition px-1.5"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {config.temStatus && (
                          <button
                            onClick={() => alternarStatus(r)}
                            className="text-gray-400 hover:text-amber-600 transition px-1.5"
                            title={ativo ? "Inativar" : "Reativar"}
                          >
                            {ativo ? "⏸️" : "▶️"}
                          </button>
                        )}
                        <button
                          onClick={() => setAExcluir(r)}
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
        titulo={`Excluir ${config.singular}`}
        tipo="perigo"
        mensagem={
          <>
            Deseja realmente excluir {artigo} {config.singular}{" "}
            <strong>{aExcluir ? nomeDe(aExcluir) : ""}</strong>?{" "}
            {config.temStatus
              ? `Se já estiver em uso, ${artigo} ${config.singular} não pode ser excluíd${artigo}, apenas inativad${artigo}.`
              : `Se já estiver em uso por produtos, ela não pode ser excluída.`}
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

export default function CadastrosApoioAba() {
  const [ativo, setAtivo] = useState(CADASTROS[0].chave);
  const config = CADASTROS.find((c) => c.chave === ativo)!;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {CADASTROS.map((c) => (
          <button
            key={c.chave}
            onClick={() => setAtivo(c.chave)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              ativo === c.chave
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
            }`}
          >
            {c.plural}
          </button>
        ))}
      </div>
      <SecaoCadastro key={config.chave} config={config} />
    </div>
  );
}
