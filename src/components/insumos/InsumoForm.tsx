import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPropriedadesLista,
  getCategoriasInsumo,
  getFabricantes,
  getMarcas,
  getFornecedores,
  getFuncionarios,
} from "../../services/api";
import {
  Insumo,
  NovoInsumoPayload,
  CategoriaInsumo,
  CATEGORIAS_INSUMO,
  CATEGORIAS_INSUMOS,
  CATEGORIA_INSUMO_META,
  UNIDADES_MEDIDA,
  STATUS_INSUMO,
  StatusInsumo,
  fmtMoeda,
} from "../../types/insumo";

import FormSection from "../ui/FormSection";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import Button from "../ui/Button";

interface Props {
  insumos: Insumo[];
  onCancelar: () => void;
  onSalvar: (dados: NovoInsumoPayload) => void;
  salvando?: boolean;
  /** Quando informado, o formulário entra em modo de edição pré-preenchido */
  insumoEdicao?: Insumo | null;
}

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function InsumoForm({
  insumos,
  onCancelar,
  onSalvar,
  salvando = false,
  insumoEdicao = null,
}: Props) {
  const modoEdicao = insumoEdicao != null;
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaInsumo | "">("");
  const [tipo, setTipo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [idFabricante, setIdFabricante] = useState("");
  const [idMarca, setIdMarca] = useState("");
  const [idFornecedor, setIdFornecedor] = useState("");
  const [idPropriedade, setIdPropriedade] = useState("");
  const [estoqueInicial, setEstoqueInicial] = useState("");
  const [idResponsavel, setIdResponsavel] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [dataFabricacao, setDataFabricacao] = useState("");
  const [dataValidade, setDataValidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [status, setStatus] = useState<StatusInsumo>("Ativo");
  const [registroMapa, setRegistroMapa] = useState("");
  const [fichaTecnica, setFichaTecnica] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const { data: propriedadesApi = [] } = useQuery<any[]>({
    queryKey: ["propriedades"],
    queryFn: getPropriedadesLista,
  });

  const { data: categoriasApi = [] } = useQuery({
    queryKey: ["categorias-insumo"],
    queryFn: getCategoriasInsumo,
  });

  const { data: fabricantes = [] } = useQuery({
    queryKey: ["fabricantes"],
    queryFn: getFabricantes,
  });

  const { data: marcas = [] } = useQuery({
    queryKey: ["marcas"],
    queryFn: getMarcas,
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: getFornecedores,
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: getFuncionarios,
  });

  useEffect(() => {
    if (!insumoEdicao) return;
    const idTexto = (id?: number) => (id != null ? String(id) : "");
    setNome(insumoEdicao.nome);
    setCategoria(insumoEdicao.categoria);
    setTipo(insumoEdicao.tipo ?? "");
    setUnidade(insumoEdicao.unidade_medida);
    setIdFabricante(idTexto(insumoEdicao.id_fabricante));
    setIdMarca(idTexto(insumoEdicao.id_marca));
    setIdFornecedor(idTexto(insumoEdicao.id_fornecedor));
    setIdPropriedade(idTexto(insumoEdicao.id_propriedade));
    setEstoqueMinimo(String(insumoEdicao.estoque_minimo ?? ""));
    setValorUnitario(String(insumoEdicao.valor_unitario ?? ""));
    setStatus(insumoEdicao.status);
    setRegistroMapa(insumoEdicao.registro_mapa ?? "");
    setFichaTecnica(insumoEdicao.ficha_tecnica ?? "");
    setObservacoes(insumoEdicao.observacoes ?? "");
    setErros({});
  }, [insumoEdicao]);

  /** Propriedades do backend + as já referenciadas nos insumos carregados */
  const opcoesPropriedade = useMemo(() => {
    const mapa = new Map<string, string>();
    (Array.isArray(propriedadesApi) ? propriedadesApi : []).forEach((p) => {
      const id = p.id_propriedade ?? p.id;
      if (id != null) mapa.set(String(id), p.nome_propriedade ?? p.nome ?? `#${id}`);
    });
    insumos.forEach((i) => {
      if (i.id_propriedade != null && !mapa.has(String(i.id_propriedade)))
        mapa.set(String(i.id_propriedade), i.nome_propriedade ?? `#${i.id_propriedade}`);
    });
    return Array.from(mapa.entries());
  }, [propriedadesApi, insumos]);

  // itens inativos saem dos combos, exceto o já selecionado numa edição
  const fabricantesVisiveis = fabricantes.filter(
    (f) => f.status !== false || String(f.id_fabricante) === idFabricante
  );
  const fornecedoresVisiveis = fornecedores.filter(
    (f) => f.status !== false || String(f.id_fornecedor) === idFornecedor
  );

  const idCategoria = categoriasApi.find(
    (c) => c.nome_categoria.trim().toLowerCase() === categoria.toLowerCase()
  )?.id_categoria_insumo;

  // o tipo e a unidade já gravados continuam disponíveis mesmo fora das listas fixas
  const tiposDaCategoria: readonly string[] = categoria ? CATEGORIAS_INSUMO[categoria] : [];
  const tiposDisponiveis =
    tipo && !tiposDaCategoria.includes(tipo) ? [...tiposDaCategoria, tipo] : tiposDaCategoria;
  const unidadesDisponiveis: readonly string[] =
    unidade && !(UNIDADES_MEDIDA as readonly string[]).includes(unidade)
      ? [...UNIDADES_MEDIDA, unidade]
      : UNIDADES_MEDIDA;

  const estoqueResumo = modoEdicao ? insumoEdicao?.estoque_atual ?? 0 : num(estoqueInicial);
  const valorInicial = estoqueResumo * num(valorUnitario);
  // o estoque inicial é registrado como uma entrada, que pede responsável e aceita lote
  const temEstoqueInicial = !modoEdicao && num(estoqueInicial) > 0;

  // ---------------------------------------------------------------- validação
  const validar = () => {
    const e: Record<string, string> = {};

    if (!nome.trim()) e.nome = "Informe o nome do produto.";
    if (!categoria) e.categoria = "Selecione a categoria do insumo.";
    else if (categoriasApi.length && idCategoria == null)
      e.categoria = "Esta categoria não existe no cadastro do sistema.";
    if (!unidade) e.unidade = "Selecione a unidade de medida.";
    // RN001: nenhum produto pode apresentar saldo negativo
    if (num(estoqueInicial) < 0) e.estoqueInicial = "O estoque não pode ser negativo.";
    if (num(estoqueMinimo) < 0) e.estoqueMinimo = "O estoque mínimo não pode ser negativo.";
    if (num(valorUnitario) < 0) e.valorUnitario = "O valor unitário não pode ser negativo.";
    if (temEstoqueInicial) {
      if (!idResponsavel) e.responsavel = "Toda movimentação deve possuir responsável.";
      if (dataValidade && dataFabricacao && dataValidade < dataFabricacao)
        e.dataValidade = "A validade não pode ser anterior à fabricação.";
    }
    if (
      insumos.some(
        (i) =>
          i.id !== insumoEdicao?.id &&
          i.nome.trim().toLowerCase() === nome.trim().toLowerCase()
      )
    )
      e.nome = "Já existe um insumo cadastrado com esse nome.";

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;

    const nomePropriedade = opcoesPropriedade.find(
      ([id]) => id === idPropriedade
    )?.[1];
    const fabricante = fabricantes.find((f) => String(f.id_fabricante) === idFabricante);
    const marca = marcas.find((m) => String(m.id_marca) === idMarca);
    const fornecedor = fornecedores.find((f) => String(f.id_fornecedor) === idFornecedor);

    onSalvar({
      nome: nome.trim(),
      categoria: categoria as CategoriaInsumo,
      id_categoria_insumo: idCategoria,
      tipo: tipo || undefined,
      unidade_medida: unidade,
      id_fabricante: fabricante?.id_fabricante,
      fabricante: fabricante?.nome_fabricante,
      id_marca: marca?.id_marca,
      marca: marca?.descricao_marca,
      id_fornecedor: fornecedor?.id_fornecedor,
      fornecedor: fornecedor?.nome_fantasia || fornecedor?.nome_fornecedor,
      estoque_atual: estoqueResumo,
      estoque_minimo: num(estoqueMinimo),
      valor_unitario: num(valorUnitario),
      status,
      id_propriedade: idPropriedade ? Number(idPropriedade) : undefined,
      nome_propriedade: nomePropriedade,
      registro_mapa: registroMapa.trim() || undefined,
      ficha_tecnica: fichaTecnica.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      entrada_inicial: temEstoqueInicial
        ? {
            id_responsavel: idResponsavel,
            numero_lote: numeroLote.trim() || undefined,
            data_fabricacao: dataFabricacao || null,
            data_validade: dataValidade || null,
          }
        : undefined,
    });
  };

  const Erro = ({ campo }: { campo: string }) =>
    erros[campo] ? <p className="text-xs text-red-600 mt-1">⚠️ {erros[campo]}</p> : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
      {/* -------------------------------------------------- Informações básicas */}
      <FormSection title="Informações Básicas" cols={3}>
        <Field label="Nome do Produto" required>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Ureia 45%"
          />
          <Erro campo="nome" />
        </Field>

        <Field label="Categoria" required>
          <Select
            value={categoria}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setCategoria(e.target.value as CategoriaInsumo);
              setTipo("");
            }}
            placeholder="Selecione a categoria"
          >
            {CATEGORIAS_INSUMOS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_INSUMO_META[c].icone} {c}
              </option>
            ))}
          </Select>
          <Erro campo="categoria" />
        </Field>

        <Field label="Tipo / Produto">
          <Select
            value={tipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipo(e.target.value)}
            placeholder={categoria ? "Selecione o tipo" : "Selecione a categoria primeiro"}
            disabled={!categoria}
          >
            {tiposDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fabricante">
          <Select
            value={idFabricante}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setIdFabricante(e.target.value)
            }
            placeholder="Selecione o fabricante"
          >
            {fabricantesVisiveis.map((f) => (
              <option key={f.id_fabricante} value={f.id_fabricante}>
                {f.nome_fabricante}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Marca">
          <Select
            value={idMarca}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setIdMarca(e.target.value)
            }
            placeholder="Selecione a marca"
          >
            {marcas.map((m) => (
              <option key={m.id_marca} value={m.id_marca}>
                {m.descricao_marca}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Unidade de Medida" required>
          <Select
            value={unidade}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setUnidade(e.target.value)
            }
            placeholder="Selecione a unidade"
          >
            {unidadesDisponiveis.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
          <Erro campo="unidade" />
        </Field>
      </FormSection>

      {/* --------------------------------------------------- Controle de estoque */}
      <FormSection title="Controle de Estoque" cols={3}>
        {!modoEdicao && (
          <Field label="Estoque Inicial">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={estoqueInicial}
              onChange={(e) => setEstoqueInicial(e.target.value)}
              placeholder="0,00"
            />
            <Erro campo="estoqueInicial" />
          </Field>
        )}

        <Field label="Estoque Mínimo">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            placeholder="0,00"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Dispara alerta quando o saldo atingir esse limite.
          </p>
          <Erro campo="estoqueMinimo" />
        </Field>

        <Field label="Valor Unitário (R$)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={valorUnitario}
            onChange={(e) => setValorUnitario(e.target.value)}
            placeholder="0,00"
          />
          <Erro campo="valorUnitario" />
        </Field>
      </FormSection>

      {/* ------------------------------------------ Entrada do estoque inicial */}
      {temEstoqueInicial && (
        <FormSection title="Entrada do Estoque Inicial" cols={3}>
          <p className="text-xs text-gray-500 sm:col-span-2 lg:col-span-3">
            O estoque inicial é registrado como uma entrada no histórico do insumo. Informe
            o lote e a validade para ele entrar nos alertas de vencimento.
          </p>

          <Field label="Responsável" required>
            <Select
              value={idResponsavel}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setIdResponsavel(e.target.value)
              }
              placeholder="Selecione o responsável"
            >
              {funcionarios
                .filter((f) => f.status !== false)
                .map((f) => (
                  <option key={f.id_funcionario} value={f.id_funcionario}>
                    {f.nome_completo}
                    {f.cargo ? ` — ${f.cargo}` : ""}
                  </option>
                ))}
            </Select>
            <Erro campo="responsavel" />
          </Field>

          <Field label="Número do Lote">
            <Input
              value={numeroLote}
              onChange={(e) => setNumeroLote(e.target.value)}
              placeholder="Ex.: UR-2026-014"
            />
          </Field>

          <Field label="Data de Fabricação">
            <Input
              type="date"
              value={dataFabricacao}
              onChange={(e) => setDataFabricacao(e.target.value)}
            />
          </Field>

          <Field label="Data de Validade">
            <Input
              type="date"
              value={dataValidade}
              onChange={(e) => setDataValidade(e.target.value)}
            />
            <Erro campo="dataValidade" />
          </Field>
        </FormSection>
      )}

      {/* -------------------------------------------------- Vínculos e situação */}
      <FormSection title="Vínculos" cols={3}>
        <Field label="Propriedade">
          <Select
            value={idPropriedade}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setIdPropriedade(e.target.value)
            }
            placeholder="Selecione a propriedade"
          >
            {opcoesPropriedade.map(([id, nomeProp]) => (
              <option key={id} value={id}>
                {nomeProp}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fornecedor">
          <Select
            value={idFornecedor}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setIdFornecedor(e.target.value)
            }
            placeholder="Selecione o fornecedor"
          >
            {fornecedoresVisiveis.map((f) => (
              <option key={f.id_fornecedor} value={f.id_fornecedor}>
                {f.nome_fantasia || f.nome_fornecedor}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" required>
          <Select
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatus(e.target.value as StatusInsumo)
            }
          >
            {STATUS_INSUMO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      {/* --------------------------------------------- Informações complementares */}
      <FormSection title="Informações Complementares" cols={2}>
        <Field label="Registro MAPA">
          <Input
            value={registroMapa}
            onChange={(e) => setRegistroMapa(e.target.value)}
            placeholder="Ex.: MAPA 04519 (quando aplicável)"
          />
        </Field>

        <Field label="Ficha Técnica">
          <Input
            value={fichaTecnica}
            onChange={(e) => setFichaTecnica(e.target.value)}
            placeholder="Classe toxicológica, composição, EPI exigido..."
          />
        </Field>
      </FormSection>

      {/* ------------------------------------------------- Resumo do lançamento */}
      <div className="mt-6 rounded-lg bg-green-50/60 border border-green-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              {modoEdicao ? "Estoque atual" : "Estoque inicial"}
            </p>
            <p className="text-lg font-bold text-gray-700">
              {estoqueResumo.toLocaleString("pt-BR")} {unidade}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Valor unitário
            </p>
            <p className="text-lg font-bold text-gray-700">
              {fmtMoeda(num(valorUnitario))}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Valor em estoque
            </p>
            <p className="text-lg font-bold text-green-700">{fmtMoeda(valorInicial)}</p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- Observações */}
      <SectionTitle>Observações</SectionTitle>
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={3}
        placeholder="Condições de armazenamento, restrições de uso, recomendações técnicas..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
      />

      {/* --------------------------------------------------------------- Ações */}
      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Salvar Insumo"}
        </Button>
      </div>
    </div>
  );
}
