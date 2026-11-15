import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTalhoesCadastrados,
  getCategoriasAtividade,
  getTiposAtividade,
  getFuncionarios,
  getMaquinas,
  getInsumosCadastrados,
  getStatusAtividadeOpcoes,
} from "../../services/api";
import { Talhao } from "../../types/talhao";
import {
  AtividadeAgricola,
  NovaAtividadePayload,
  InsumoUtilizado,
  MaquinaUtilizada,
  STATUS_ATIVIDADE,
  StatusAtividade,
  fmtMoeda,
} from "../../types/atividade";
import { fmtQtd, saldoUtilizavel } from "../../types/insumo";

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

  const [idCategoria, setIdCategoria] = useState("");
  const [idTipo, setIdTipo] = useState("");
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

  // ----------------------------------------------------------------- queries
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-atividade"],
    queryFn: getCategoriasAtividade,
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ["tipos-atividade", idCategoria],
    queryFn: () => getTiposAtividade(idCategoria ? Number(idCategoria) : undefined),
    enabled: !!idCategoria,
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: getFuncionarios,
  });

  const { data: catalogoMaquinas = [] } = useQuery({
    queryKey: ["maquinas"],
    queryFn: getMaquinas,
  });

  const { data: catalogoInsumos = [] } = useQuery({
    queryKey: ["insumos", "cadastrados"],
    queryFn: getInsumosCadastrados,
  });

  const { data: talhoes = [] } = useQuery({
    queryKey: ["talhoes", "cadastrados"],
    queryFn: getTalhoesCadastrados,
  });

  const { data: statusOpcoes = STATUS_ATIVIDADE as unknown as string[] } = useQuery({
    queryKey: ["status-atividade"],
    queryFn: getStatusAtividadeOpcoes,
  });

  // Pré-preenche o formulário quando em modo de edição
  useEffect(() => {
    if (!atividadeEdicao) return;
    setIdCategoria(
      atividadeEdicao.id_categoria_atividade
        ? String(atividadeEdicao.id_categoria_atividade)
        : ""
    );
    setIdTipo(
      atividadeEdicao.id_tipo_atividade ? String(atividadeEdicao.id_tipo_atividade) : ""
    );
    setIdTalhao(atividadeEdicao.id_talhao ?? "");
    setSafra(atividadeEdicao.safra ?? "");
    setIdResponsavel(atividadeEdicao.id_responsavel ?? "");
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

  /** Talhões do backend + os já referenciados nas atividades carregadas */
  const opcoesTalhao = useMemo(() => {
    const mapa = new Map<string, { rotulo: string; idPropriedade: number }>();
    talhoes.forEach((t: Talhao) =>
      mapa.set(t.id, {
        rotulo: `${t.codigo} · ${t.nome}`,
        idPropriedade: t.id_propriedade,
      })
    );
    atividades.forEach((a) => {
      if (!mapa.has(a.id_talhao))
        mapa.set(a.id_talhao, {
          rotulo: `${a.codigo_talhao ?? a.id_talhao} · ${a.nome_talhao ?? ""}`.trim(),
          idPropriedade: a.id_propriedade,
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

  // itens inativos saem dos combos, exceto o que já está selecionado na edição
  const ativo = (status: unknown) => status !== false && status !== "Inativo";
  const categoriasVisiveis = categorias.filter(
    (c) => ativo(c.status) || String(c.id_categoria_atividade) === idCategoria
  );
  const tiposVisiveis = tipos.filter(
    (t) => ativo(t.status) || String(t.id_atividade) === idTipo
  );
  const funcionariosVisiveis = funcionarios.filter(
    (f) => ativo(f.status) || f.id_funcionario === idResponsavel
  );

  const custoInsumos = insumos.reduce((s, i) => s + Number(i.custo || 0), 0);
  const custoMaquinas = maquinas.reduce((s, m) => s + Number(m.custo || 0), 0);
  const custoCalculado = custoInsumos + custoMaquinas;
  const custoFinal = custo !== "" ? num(custo) : custoCalculado;

  /** Saldo que a baixa pode usar; o que esta atividade já baixou volta ao estoque ao salvar */
  const saldoDisponivel = (idInsumo?: number) => {
    const cadastrado = catalogoInsumos.find((c) => c.id === String(idInsumo));
    if (!cadastrado) return null;
    const jaBaixado = (atividadeEdicao?.insumos ?? [])
      .filter((i) => i.baixado && i.id_insumo === idInsumo)
      .reduce((s, i) => s + Number(i.quantidade || 0), 0);
    return saldoUtilizavel(cadastrado) + jaBaixado;
  };

  // ------------------------------------------------------------------ insumos
  const addInsumo = () =>
    setInsumos((l) => [...l, { id_insumo: undefined, nome: "", quantidade: 0, unidade: "", custo: 0 }]);

  const selecionarInsumo = (i: number, idInsumo: string) =>
    setInsumos((l) =>
      l.map((item, idx) => {
        if (idx !== i) return item;
        const cat = catalogoInsumos.find((c) => c.id === idInsumo);
        return {
          ...item,
          id_insumo: idInsumo ? Number(idInsumo) : undefined,
          nome: cat?.nome ?? "",
          unidade: cat?.unidade_medida ?? item.unidade,
        };
      })
    );

  const setInsumoCampo = (i: number, campo: "quantidade" | "custo", valor: string) =>
    setInsumos((l) =>
      l.map((item, idx) => (idx !== i ? item : { ...item, [campo]: num(valor) }))
    );

  const removerInsumo = (i: number) =>
    setInsumos((l) => l.filter((_, idx) => idx !== i));

  // ----------------------------------------------------------------- máquinas
  const addMaquina = () =>
    setMaquinas((l) => [...l, { id_maquina: undefined, nome: "", horas: 0, custo: 0 }]);

  const selecionarMaquina = (i: number, idMaquina: string) =>
    setMaquinas((l) =>
      l.map((item, idx) => {
        if (idx !== i) return item;
        const cat = catalogoMaquinas.find((c: any) => String(c.id_maquina) === idMaquina);
        return {
          ...item,
          id_maquina: idMaquina ? Number(idMaquina) : undefined,
          nome: cat?.nome ?? "",
        };
      })
    );

  const setMaquinaCampo = (i: number, campo: "horas" | "custo", valor: string) =>
    setMaquinas((l) =>
      l.map((item, idx) => (idx !== i ? item : { ...item, [campo]: num(valor) }))
    );

  const removerMaquina = (i: number) =>
    setMaquinas((l) => l.filter((_, idx) => idx !== i));

  // ---------------------------------------------------------------- validação
  const validar = () => {
    const e: Record<string, string> = {};

    if (!idCategoria) e.categoria = "Selecione a categoria da operação.";
    if (!idTipo) e.tipo = "Selecione o tipo de atividade.";
    if (!idTalhao) e.talhao = "Toda atividade deve estar vinculada a um talhão.";
    if (!idResponsavel) e.responsavel = "Toda atividade deve possuir um responsável.";
    if (!dataInicio) e.dataInicio = "Informe a data de início.";
    if (dataFim && dataInicio && dataFim < dataInicio)
      e.dataFim = "A data de término não pode ser anterior à data de início.";
    if (status === "Concluída" && !dataFim)
      e.dataFim = "Atividades concluídas precisam de data de término.";
    if (insumos.some((i) => !i.id_insumo))
      e.insumos = "Selecione o insumo em todos os itens adicionados.";
    if (maquinas.some((m) => !m.id_maquina))
      e.maquinas = "Selecione a máquina em todos os itens adicionados.";

    if (idTalhao && idTipo && dataInicio) {
      const duplicada = atividades.some(
        (a) =>
          a.id !== atividadeEdicao?.id &&
          a.id_talhao === idTalhao &&
          String(a.id_tipo_atividade) === idTipo &&
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

    onSalvar({
      id_categoria_atividade: Number(idCategoria),
      id_tipo_atividade: Number(idTipo),
      id_talhao: Number(idTalhao),
      safra: safra || null,
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      id_responsavel: idResponsavel || undefined,
      status,
      custo_operacao: custo !== "" ? custoFinal : null,
      observacoes: observacoes.trim() || null,
      insumos: insumos
        .filter((i) => i.id_insumo)
        .map((i) => ({
          id_insumo: i.id_insumo as number,
          quantidade: i.quantidade || undefined,
          custo: i.custo || undefined,
        })),
      maquinas: maquinas
        .filter((m) => m.id_maquina)
        .map((m) => ({
          id_maquina: m.id_maquina as number,
          horas: m.horas || undefined,
          custo: m.custo || undefined,
        })),
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
            value={idCategoria}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setIdCategoria(e.target.value);
              setIdTipo("");
            }}
            placeholder="Selecione a categoria"
          >
            {categoriasVisiveis.map((c) => (
              <option key={c.id_categoria_atividade} value={c.id_categoria_atividade}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Erro campo="categoria" />
        </Field>

        <Field label="Tipo de Atividade" required>
          <Select
            value={idTipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIdTipo(e.target.value)}
            placeholder={idCategoria ? "Selecione o tipo" : "Selecione a categoria primeiro"}
            disabled={!idCategoria}
          >
            {tiposVisiveis.map((t) => (
              <option key={t.id_atividade} value={t.id_atividade}>
                {t.descricao}
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
            {statusOpcoes.map((s) => (
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
            {funcionariosVisiveis.map((f) => (
              <option key={f.id_funcionario} value={f.id_funcionario}>
                {f.nome_completo}
                {f.cargo ? ` — ${f.cargo}` : ""}
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
      <p className="text-xs text-gray-500 mb-3">
        {status === "Concluída"
          ? "📦 Ao salvar como Concluída, cada insumo com quantidade gera uma saída de estoque na data de término. Insumo sem saldo suficiente fica sem baixa."
          : "📦 A saída de estoque dos insumos é gerada quando a atividade for salva como Concluída."}
      </p>
      <div className="space-y-3">
        {insumos.map((item, i) => {
          const disponivel = saldoDisponivel(item.id_insumo);
          const acima = disponivel != null && Number(item.quantidade || 0) > disponivel;
          return (
          <div
            key={i}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-gray-50 border border-gray-100 rounded-lg p-3"
          >
            <Field label="Insumo" className="sm:col-span-5">
              <Select
                value={item.id_insumo ? String(item.id_insumo) : ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  selecionarInsumo(i, e.target.value)
                }
                placeholder="Selecione o insumo"
              >
                {catalogoInsumos
                  .filter((c) => ativo(c.status) || c.id === String(item.id_insumo))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Quantidade" className="sm:col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.quantidade || ""}
                onChange={(e) => setInsumoCampo(i, "quantidade", e.target.value)}
              />
            </Field>
            <Field label="Unidade" className="sm:col-span-2">
              <Input value={item.unidade} readOnly placeholder="—" />
            </Field>
            <Field label="Custo (R$)" className="sm:col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.custo || ""}
                onChange={(e) => setInsumoCampo(i, "custo", e.target.value)}
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
            {disponivel != null && (
              <p
                className={`sm:col-span-12 text-xs ${
                  acima ? "text-amber-700 font-semibold" : "text-gray-400"
                }`}
              >
                {acima
                  ? `⚠️ Quantidade acima do saldo disponível (${fmtQtd(disponivel, item.unidade)}). Se a atividade for concluída assim, este insumo fica sem baixa no estoque.`
                  : `Saldo disponível: ${fmtQtd(disponivel, item.unidade)}`}
              </p>
            )}
          </div>
          );
        })}
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
              <Select
                value={item.id_maquina ? String(item.id_maquina) : ""}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  selecionarMaquina(i, e.target.value)
                }
                placeholder="Selecione a máquina"
              >
                {catalogoMaquinas
                  .filter((c) => ativo(c.status) || c.id_maquina === item.id_maquina)
                  .map((c) => (
                    <option key={c.id_maquina} value={c.id_maquina}>
                      {c.nome}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Horas" className="sm:col-span-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={item.horas || ""}
                onChange={(e) => setMaquinaCampo(i, "horas", e.target.value)}
              />
            </Field>
            <Field label="Custo (R$)" className="sm:col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.custo || ""}
                onChange={(e) => setMaquinaCampo(i, "custo", e.target.value)}
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
