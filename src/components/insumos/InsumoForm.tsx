import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPropriedades } from "../../services/api";
import { FORNECEDORES_MOCK } from "../../services/insumosMock";
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
}

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function InsumoForm({
  insumos,
  onCancelar,
  onSalvar,
  salvando = false,
}: Props) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaInsumo | "">("");
  const [tipo, setTipo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [fabricante, setFabricante] = useState("");
  const [marca, setMarca] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [idPropriedade, setIdPropriedade] = useState("");
  const [estoqueInicial, setEstoqueInicial] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [status, setStatus] = useState<StatusInsumo>("Ativo");
  const [registroMapa, setRegistroMapa] = useState("");
  const [fichaTecnica, setFichaTecnica] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const { data: propriedadesApi = [] } = useQuery({
    queryKey: ["propriedades"],
    queryFn: getPropriedades,
  });

  /** Propriedades do backend + as já referenciadas nos insumos carregados */
  const opcoesPropriedade = useMemo(() => {
    const mapa = new Map<string, string>();
    (propriedadesApi as any[]).forEach((p) => {
      const id = p.id_propriedade ?? p.id;
      if (id != null) mapa.set(String(id), p.nome_propriedade ?? p.nome ?? `#${id}`);
    });
    insumos.forEach((i) => {
      if (i.id_propriedade != null && !mapa.has(String(i.id_propriedade)))
        mapa.set(String(i.id_propriedade), i.nome_propriedade ?? `#${i.id_propriedade}`);
    });
    return Array.from(mapa.entries());
  }, [propriedadesApi, insumos]);

  const fornecedores = useMemo(
    () =>
      Array.from(
        new Set([
          ...FORNECEDORES_MOCK,
          ...(insumos.map((i) => i.fornecedor).filter(Boolean) as string[]),
        ])
      ).sort(),
    [insumos]
  );

  const tiposDisponiveis = categoria
    ? (CATEGORIAS_INSUMO[categoria] as readonly string[])
    : [];

  const valorInicial = num(estoqueInicial) * num(valorUnitario);

  // ---------------------------------------------------------------- validação
  const validar = () => {
    const e: Record<string, string> = {};

    if (!nome.trim()) e.nome = "Informe o nome do produto.";
    if (!categoria) e.categoria = "Selecione a categoria do insumo.";
    if (!unidade) e.unidade = "Selecione a unidade de medida.";
    // RN001: nenhum produto pode apresentar saldo negativo
    if (num(estoqueInicial) < 0) e.estoqueInicial = "O estoque não pode ser negativo.";
    if (num(estoqueMinimo) < 0) e.estoqueMinimo = "O estoque mínimo não pode ser negativo.";
    if (num(valorUnitario) < 0) e.valorUnitario = "O valor unitário não pode ser negativo.";
    if (
      insumos.some(
        (i) => i.nome.trim().toLowerCase() === nome.trim().toLowerCase()
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

    onSalvar({
      nome: nome.trim(),
      categoria: categoria as CategoriaInsumo,
      tipo: tipo || undefined,
      unidade_medida: unidade,
      fabricante: fabricante.trim() || undefined,
      marca: marca.trim() || undefined,
      fornecedor: fornecedor.trim() || undefined,
      estoque_atual: num(estoqueInicial),
      estoque_minimo: num(estoqueMinimo),
      valor_unitario: num(valorUnitario),
      status,
      id_propriedade: idPropriedade ? Number(idPropriedade) : undefined,
      nome_propriedade: nomePropriedade,
      registro_mapa: registroMapa.trim() || undefined,
      ficha_tecnica: fichaTecnica.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
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
          <Input
            value={fabricante}
            onChange={(e) => setFabricante(e.target.value)}
            placeholder="Ex.: Mosaic"
          />
        </Field>

        <Field label="Marca">
          <Input
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ex.: Mosaic Fertilizantes"
          />
        </Field>

        <Field label="Unidade de Medida" required>
          <Select
            value={unidade}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setUnidade(e.target.value)
            }
            placeholder="Selecione a unidade"
          >
            {UNIDADES_MEDIDA.map((u) => (
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
          <Input
            list="fornecedores-disponiveis"
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            placeholder="Ex.: Agro Insumos Ltda."
          />
          <datalist id="fornecedores-disponiveis">
            {fornecedores.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
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
              Estoque inicial
            </p>
            <p className="text-lg font-bold text-gray-700">
              {num(estoqueInicial).toLocaleString("pt-BR")} {unidade}
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
          {salvando ? "Salvando..." : "Salvar Insumo"}
        </Button>
      </div>
    </div>
  );
}
