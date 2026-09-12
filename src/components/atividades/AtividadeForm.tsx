import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTalhoes } from "../../services/api";
import { Talhao } from "../../types/talhao";
import { FUNCIONARIOS_MOCK, MAQUINAS_MOCK, INSUMOS_MOCK } from "../../services/atividadesMock";
import {
  AtividadeAgricola,
  NovaAtividadePayload,
  InsumoUtilizado,
  MaquinaUtilizada,
  CATEGORIAS,
  CATEGORIAS_ATIVIDADE,
  CategoriaAtividade,
  CATEGORIA_META,
  STATUS_ATIVIDADE,
  StatusAtividade,
  categoriaDoTipo,
  fmtMoeda,
} from "../../types/atividade";

import FormSection from "../ui/FormSection";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import Button from "../ui/Button";

interface Props {
  atividades: AtividadeAgricola[];
  onCancelar: () => void;
  onSalvar: (dados: NovaAtividadePayload) => void;
  salvando?: boolean;
  /** Quando informada, o formulário entra em modo de edição pré-preenchido */
  atividadeEdicao?: AtividadeAgricola | null;
}

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function AtividadeForm({
  atividades,
  onCancelar,
  onSalvar,
  salvando = false,
  atividadeEdicao = null,
}: Props) {
  const modoEdicao = atividadeEdicao != null;
  const [categoria, setCategoria] = useState<CategoriaAtividade | "">("");
  const [tipo, setTipo] = useState("");
  const [idTalhao, setIdTalhao] = useState("");
  const [safra, setSafra] = useState("");
  const [idResponsavel, setIdResponsavel] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState<StatusAtividade>("Planejada");
  const [custo, setCusto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [insumos, setInsumos] = useState<InsumoUtilizado[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaUtilizada[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Pré-preenche o formulário quando em modo de edição
  useEffect(() => {
    if (!atividadeEdicao) return;
    setCategoria(categoriaDoTipo(atividadeEdicao.tipo_atividade));
    setTipo(atividadeEdicao.tipo_atividade ?? "");
    setIdTalhao(atividadeEdicao.id_talhao ?? "");
    setSafra(atividadeEdicao.safra ?? "");
    setIdResponsavel(
      atividadeEdicao.id_responsavel ? String(atividadeEdicao.id_responsavel) : ""
    );
    setDataInicio(atividadeEdicao.data_inicio ?? "");
    setDataFim(atividadeEdicao.data_fim ?? "");
    setStatus(atividadeEdicao.status ?? "Planejada");
    setCusto(
      atividadeEdicao.custo_operacao != null ? String(atividadeEdicao.custo_operacao) : ""
    );
    setObservacoes(atividadeEdicao.observacoes ?? "");
    setInsumos(atividadeEdicao.insumos ?? []);
    setMaquinas(atividadeEdicao.maquinas ?? []);
    setErros({});
  }, [atividadeEdicao]);

  const { data: talhoes = [] } = useQuery({
    queryKey: ["talhoes"],
    queryFn: getTalhoes,
  });

  /** Talhões do backend + os já referenciados nas atividades carregadas */
  const opcoesTalhao = useMemo(() => {
    const mapa = new Map<string, { rotulo: string; idPropriedade: number; propriedade?: string }>();
    talhoes.forEach((t: Talhao) =>
      mapa.set(t.id, {
        rotulo: `${t.codigo} · ${t.nome}`,
        idPropriedade: t.id_propriedade,
        propriedade: t.nome_propriedade,
      })
    );
    atividades.forEach((a) => {
      if (!mapa.has(a.id_talhao))
        mapa.set(a.id_talhao, {
          rotulo: `${a.codigo_talhao ?? a.id_talhao} · ${a.nome_talhao ?? ""}`.trim(),
          idPropriedade: a.id_propriedade,
          propriedade: a.nome_propriedade,
        });
    });
    return Array.from(mapa.entries());
  }, [talhoes, atividades]);

  const safras = useMemo(
    () =>
      Array.from(new Set(atividades.map((a) => a.safra).filter(Boolean) as string[]))
        .sort()
        .reverse(),
    [atividades]
  );

  const tiposDisponiveis = categoria
    ? (CATEGORIAS_ATIVIDADE[categoria] as readonly string[])
    : [];

  const custoInsumos = insumos.reduce((s, i) => s + Number(i.custo || 0), 0);
  const custoMaquinas = maquinas.reduce((s, m) => s + Number(m.custo || 0), 0);
  const custoCalculado = custoInsumos + custoMaquinas;
  const custoFinal = custo !== "" ? num(custo) : custoCalculado;

  // ------------------------------------------------------------------ insumos
  const addInsumo = () =>
    setInsumos((l) => [...l, { nome: "", quantidade: 0, unidade: "kg", custo: 0 }]);

  const setInsumo = (i: number, campo: keyof InsumoUtilizado, valor: string) =>
    setInsumos((l) =>
      l.map((item, idx) =>
        idx !== i
          ? item
          : {
              ...item,
              [campo]:
                campo === "quantidade" || campo === "custo" ? num(valor) : valor,
            }
      )
    );

  const removerInsumo = (i: number) =>
    setInsumos((l) => l.filter((_, idx) => idx !== i));

  // ----------------------------------------------------------------- máquinas
  const addMaquina = () => setMaquinas((l) => [...l, { nome: "", horas: 0, custo: 0 }]);

  const setMaquina = (i: number, campo: keyof MaquinaUtilizada, valor: string) =>
    setMaquinas((l) =>
      l.map((item, idx) =>
        idx !== i
          ? item
          : { ...item, [campo]: campo === "nome" ? valor : num(valor) }
      )
    );

  const removerMaquina = (i: number) =>
    setMaquinas((l) => l.filter((_, idx) => idx !== i));

  // ---------------------------------------------------------------- validação
  const validar = () => {
    const e: Record<string, string> = {};

    if (!categoria) e.categoria = "Selecione a categoria da operação.";
    if (!tipo) e.tipo = "Selecione o tipo de atividade.";
    // Critério de aceite: toda atividade deve estar vinculada a um talhão
    if (!idTalhao) e.talhao = "Toda atividade deve estar vinculada a um talhão.";
    // Critério de aceite: toda atividade deve possuir responsável
    if (!idResponsavel) e.responsavel = "Toda atividade deve possuir um responsável.";
    if (!dataInicio) e.dataInicio = "Informe a data de início.";
    if (dataFim && dataInicio && dataFim < dataInicio)
      e.dataFim = "A data de término não pode ser anterior à data de início.";
    if (status === "Concluída" && !dataFim)
      e.dataFim = "Atividades concluídas precisam de data de término.";
    if (insumos.some((i) => !i.nome.trim()))
      e.insumos = "Informe o nome de todos os insumos adicionados.";
    if (maquinas.some((m) => !m.nome.trim()))
      e.maquinas = "Informe o nome de todas as máquinas adicionadas.";

    // Não permite atividades iguais: mesmo talhão, tipo e data de início
    if (idTalhao && tipo && dataInicio) {
      const duplicada = atividades.some(
        (a) =>
          a.id !== atividadeEdicao?.id &&
          a.id_talhao === idTalhao &&
          a.tipo_atividade === tipo &&
          a.data_inicio === dataInicio
      );
      if (duplicada) {
        e.duplicada =
          "Já existe uma atividade deste tipo para o mesmo talhão e data de início. Altere o tipo, o talhão ou a data.";
      }
    }

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;

    const talhaoInfo = opcoesTalhao.find(([id]) => id === idTalhao)?.[1];
    const funcionario = FUNCIONARIOS_MOCK.find((f) => f.id === Number(idResponsavel));

    onSalvar({
      id_empresa: 1,
      id_propriedade: talhaoInfo?.idPropriedade ?? 0,
      id_talhao: idTalhao,
      id_safra: safra || "sem-safra",
      safra: safra || undefined,
      tipo_atividade: tipo,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      id_responsavel: Number(idResponsavel),
      responsavel: funcionario?.nome,
      status,
      custo_operacao: custoFinal || undefined,
      insumos: insumos.length ? insumos : undefined,
      maquinas: maquinas.length ? maquinas : undefined,
      observacoes: observacoes.trim() || undefined,
    });
  };

  const Erro = ({ campo }: { campo: string }) =>
    erros[campo] ? <p className="text-xs text-red-600 mt-1">⚠️ {erros[campo]}</p> : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
      {erros.duplicada && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <span aria-hidden>⚠️</span>
            {erros.duplicada}
          </p>
        </div>
      )}

      {/* -------------------------------------------------- Operação executada */}
      <FormSection title="Operação" cols={3}>
        <Field label="Categoria" required>
          <Select
            value={categoria}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setCategoria(e.target.value as CategoriaAtividade);
              setTipo("");
            }}
            placeholder="Selecione a categoria"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_META[c].icone} {c}
              </option>
            ))}
          </Select>
          <Erro campo="categoria" />
        </Field>

        <Field label="Tipo de Atividade" required>
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
          <Erro campo="tipo" />
        </Field>

        <Field label="Status" required>
          <Select
            value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setStatus(e.target.value as StatusAtividade)
            }
          >
            {STATUS_ATIVIDADE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Talhão" required>
          <Select
            value={idTalhao}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIdTalhao(e.target.value)}
            placeholder="Selecione o talhão"
          >
            {opcoesTalhao.map(([id, info]) => (
              <option key={id} value={id}>
                {info.rotulo}
              </option>
            ))}
          </Select>
          <Erro campo="talhao" />
        </Field>

        <Field label="Safra">
          <Input
            list="safras-disponiveis"
            value={safra}
            onChange={(e) => setSafra(e.target.value)}
            placeholder="Ex.: 2025/2026"
          />
          <datalist id="safras-disponiveis">
            {safras.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>

        <Field label="Responsável" required>
          <Select
            value={idResponsavel}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setIdResponsavel(e.target.value)
            }
            placeholder="Selecione o responsável"
          >
            {FUNCIONARIOS_MOCK.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} — {f.cargo}
              </option>
            ))}
          </Select>
          <Erro campo="responsavel" />
        </Field>
      </FormSection>

      {/* ------------------------------------------------------------- Período */}
      <FormSection title="Programação" cols={3}>
        <Field label="Data de Início" required>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <Erro campo="dataInicio" />
        </Field>

        <Field label="Data de Término">
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <Erro campo="dataFim" />
        </Field>

        <Field label="Custo da Operação (R$)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            placeholder={custoCalculado ? String(custoCalculado) : "0,00"}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Se vazio, usa a soma de insumos e máquinas.
          </p>
        </Field>
      </FormSection>

      {/* -------------------------------------------------------------- Insumos */}
      <SectionTitle>Insumos Utilizados</SectionTitle>
      <div className="space-y-3">
        {insumos.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-gray-50 border border-gray-100 rounded-lg p-3"
          >
            <Field label="Insumo" className="sm:col-span-5">
              <Input
                list="insumos-disponiveis"
                value={item.nome}
                onChange={(e) => setInsumo(i, "nome", e.target.value)}
                placeholder="Ex.: Ureia 45%"
              />
            </Field>
            <Field label="Quantidade" className="sm:col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.quantidade || ""}
                onChange={(e) => setInsumo(i, "quantidade", e.target.value)}
              />
            </Field>
            <Field label="Unidade" className="sm:col-span-2">
              <Input
                value={item.unidade}
                onChange={(e) => setInsumo(i, "unidade", e.target.value)}
                placeholder="kg, L, t..."
              />
            </Field>
            <Field label="Custo (R$)" className="sm:col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.custo || ""}
                onChange={(e) => setInsumo(i, "custo", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={() => removerInsumo(i)}
                title="Remover insumo"
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        <datalist id="insumos-disponiveis">
          {INSUMOS_MOCK.map((i) => (
            <option key={i.nome} value={i.nome} />
          ))}
        </datalist>
        <Erro campo="insumos" />
        <Button variant="secondary" onClick={addInsumo}>
          + Adicionar insumo
        </Button>
      </div>

      {/* ------------------------------------------------------------- Máquinas */}
      <SectionTitle>Máquinas e Implementos</SectionTitle>
      <div className="space-y-3">
        {maquinas.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-gray-50 border border-gray-100 rounded-lg p-3"
          >
            <Field label="Máquina / Implemento" className="sm:col-span-7">
              <Input
                list="maquinas-disponiveis"
                value={item.nome}
                onChange={(e) => setMaquina(i, "nome", e.target.value)}
                placeholder="Ex.: Trator John Deere 6110J"
              />
            </Field>
            <Field label="Horas" className="sm:col-span-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={item.horas || ""}
                onChange={(e) => setMaquina(i, "horas", e.target.value)}
              />
            </Field>
            <Field label="Custo (R$)" className="sm:col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.custo || ""}
                onChange={(e) => setMaquina(i, "custo", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-1">
              <button
                type="button"
                onClick={() => removerMaquina(i)}
                title="Remover máquina"
                className="w-full px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        <datalist id="maquinas-disponiveis">
          {MAQUINAS_MOCK.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <Erro campo="maquinas" />
        <Button variant="secondary" onClick={addMaquina}>
          + Adicionar máquina
        </Button>
      </div>

      {/* -------------------------------------------------- Resumo de custos */}
      <div className="mt-6 rounded-lg bg-green-50/60 border border-green-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Insumos</p>
            <p className="text-lg font-bold text-gray-700">{fmtMoeda(custoInsumos)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Máquinas</p>
            <p className="text-lg font-bold text-gray-700">{fmtMoeda(custoMaquinas)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Custo total</p>
            <p className="text-lg font-bold text-green-700">{fmtMoeda(custoFinal)}</p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- Observações */}
      <SectionTitle>Observações</SectionTitle>
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={3}
        placeholder="Condições climáticas, ocorrências de campo, recomendações técnicas..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
      />

      {/* -------------------------------------------------------------- Ações */}
      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando
            ? "Salvando..."
            : modoEdicao
            ? "Salvar alterações"
            : "Salvar Atividade"}
        </Button>
      </div>
    </div>
  );
}
