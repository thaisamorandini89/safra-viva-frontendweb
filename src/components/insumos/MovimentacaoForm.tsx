import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTalhoesCadastrados,
  getAtividadesCadastradas,
  getFuncionarios,
  getFornecedores,
} from "../../services/api";
import { Talhao } from "../../types/talhao";
import { dataLocalISO } from "../../types/atividade";
import {
  Insumo,
  NovaMovimentacaoPayload,
  TipoMovimentacao,
  TIPOS_MOVIMENTACAO,
  CATEGORIA_INSUMO_META,
  LoteInsumo,
  lotesVencidos,
  saldoUtilizavel,
  fmtMoeda,
  fmtQtd,
  fmtData,
  proximaValidade,
} from "../../types/insumo";

import FormSection from "../ui/FormSection";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SectionTitle from "../ui/SectionTitle";
import Button from "../ui/Button";

interface Props {
  insumos: Insumo[];
  insumoInicial?: Insumo | null;
  tipoInicial?: TipoMovimentacao;
  /** Descarte: saída que retira só deste lote, mesmo vencido */
  loteDescarte?: LoteInsumo | null;
  onCancelar: () => void;
  onSalvar: (dados: NovaMovimentacaoPayload) => void;
  salvando?: boolean;
}

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function MovimentacaoForm({
  insumos,
  insumoInicial = null,
  tipoInicial = "Entrada",
  loteDescarte = null,
  onCancelar,
  onSalvar,
  salvando = false,
}: Props) {
  const [tipo, setTipo] = useState<TipoMovimentacao>(tipoInicial);
  const [idInsumo, setIdInsumo] = useState(insumoInicial?.id ?? "");
  const [quantidade, setQuantidade] = useState(
    loteDescarte ? String(loteDescarte.quantidade) : ""
  );
  const [valorUnitario, setValorUnitario] = useState(
    insumoInicial ? String(insumoInicial.valor_unitario) : ""
  );
  const [data, setData] = useState(dataLocalISO());
  const [idResponsavel, setIdResponsavel] = useState("");
  const [idFornecedor, setIdFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [numeroLote, setNumeroLote] = useState("");
  const [dataFabricacao, setDataFabricacao] = useState("");
  const [dataValidade, setDataValidade] = useState("");
  const [idTalhao, setIdTalhao] = useState("");
  const [safra, setSafra] = useState("");
  const [idAtividade, setIdAtividade] = useState("");
  const [destino, setDestino] = useState(loteDescarte ? "Descarte de lote vencido" : "");
  const [observacao, setObservacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const { data: talhoes = [] } = useQuery({
    queryKey: ["talhoes", "cadastrados"],
    queryFn: getTalhoesCadastrados,
  });

  const { data: atividades = [] } = useQuery({
    queryKey: ["atividades", "cadastradas"],
    queryFn: getAtividadesCadastradas,
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: getFuncionarios,
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: getFornecedores,
  });

  const insumo = useMemo(
    () => insumos.find((i) => i.id === idInsumo) ?? null,
    [insumos, idInsumo]
  );

  const opcoesTalhao = useMemo(
    () =>
      (talhoes as Talhao[]).map((t) => ({
        id: t.id,
        rotulo: `${t.codigo} · ${t.nome}`,
        codigo: t.codigo,
        nome: t.nome,
      })),
    [talhoes]
  );

  const safras = useMemo(
    () =>
      Array.from(new Set(atividades.map((a) => a.safra).filter(Boolean) as string[]))
        .sort()
        .reverse(),
    [atividades]
  );

  /** Atividades do talhão selecionado (baixa vinculada à operação) */
  const opcoesAtividade = useMemo(
    () =>
      atividades.filter((a) => (idTalhao ? a.id_talhao === idTalhao : true)).slice(0, 50),
    [atividades, idTalhao]
  );

  const saldoAtual = insumo?.estoque_atual ?? 0;
  const saldoProjetado =
    tipo === "Entrada" ? saldoAtual + num(quantidade) : saldoAtual - num(quantidade);
  const valorTotal = num(quantidade) * num(valorUnitario);
  const vencidos = insumo ? lotesVencidos(insumo) : [];
  // numa saída comum não sai o que está em lote vencido; no descarte, só o saldo do lote
  const disponivel = loteDescarte
    ? loteDescarte.quantidade
    : insumo
    ? saldoUtilizavel(insumo)
    : 0;

  // ---------------------------------------------------------------- validação
  const validar = () => {
    const e: Record<string, string> = {};

    if (!idInsumo) e.insumo = "Selecione o produto movimentado.";
    if (num(quantidade) <= 0) e.quantidade = "Informe uma quantidade maior que zero.";
    // RN003: toda movimentação precisa de data e responsável
    if (!data) e.data = "Informe a data da movimentação.";
    if (!idResponsavel) e.responsavel = "Toda movimentação deve possuir responsável.";

    if (tipo === "Saída") {
      // RN001 e RN002: sem saldo negativo, e lote vencido só sai por descarte
      if (num(quantidade) > disponivel) {
        const saldo = fmtQtd(disponivel, insumo?.unidade_medida);
        e.quantidade = loteDescarte
          ? `Quantidade maior que o saldo do lote. Disponível: ${saldo}.`
          : vencidos.length
          ? `Saldo utilizável insuficiente. Disponível: ${saldo}; o restante está em lote vencido e só sai por descarte.`
          : `Saldo insuficiente. Disponível: ${saldo}.`;
      }
      // RN003: toda saída deve informar o destino
      if (!destino.trim() && !idTalhao)
        e.destino = "Informe o destino ou o talhão de aplicação.";
    }

    if (tipo === "Entrada") {
      if (dataValidade && dataFabricacao && dataValidade < dataFabricacao)
        e.dataValidade = "A validade não pode ser anterior à fabricação.";
    }

    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = () => {
    if (!validar()) return;

    const funcionario = funcionarios.find((f) => f.id_funcionario === idResponsavel);
    const fornecedor = fornecedores.find((f) => String(f.id_fornecedor) === idFornecedor);
    const talhao = opcoesTalhao.find((t) => t.id === idTalhao);
    const atividade = atividades.find((a) => a.id === idAtividade);

    onSalvar({
      id_insumo: idInsumo,
      nome_insumo: insumo?.nome,
      tipo,
      quantidade: num(quantidade),
      valor_unitario: num(valorUnitario) || insumo?.valor_unitario,
      data_movimentacao: data,
      id_responsavel: idResponsavel,
      responsavel: funcionario?.nome_completo,
      ...(tipo === "Entrada"
        ? {
            id_fornecedor: fornecedor?.id_fornecedor,
            fornecedor: fornecedor?.nome_fantasia || fornecedor?.nome_fornecedor,
            nota_fiscal: notaFiscal.trim() || undefined,
            numero_lote: numeroLote.trim() || undefined,
            data_fabricacao: dataFabricacao || null,
            data_validade: dataValidade || null,
          }
        : {
            id_talhao: idTalhao || undefined,
            codigo_talhao: talhao?.codigo,
            nome_talhao: talhao?.nome,
            safra: safra || undefined,
            id_atividade: idAtividade || undefined,
            atividade: atividade?.tipo_atividade,
            destino: destino.trim() || undefined,
            id_lote: loteDescarte?.id,
            numero_lote: loteDescarte?.numero_lote,
          }),
      observacao: observacao.trim() || undefined,
    });
  };

  const Erro = ({ campo }: { campo: string }) =>
    erros[campo] ? <p className="text-xs text-red-600 mt-1">⚠️ {erros[campo]}</p> : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
      {loteDescarte && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          🗑️ Descarte do lote <strong>{loteDescarte.numero_lote}</strong>, vencido em{" "}
          {fmtData(loteDescarte.data_validade)}. A saída retira somente deste lote.
        </div>
      )}

      {/* ---------------------------------------------------- Tipo e identificação */}
      <FormSection title="Movimentação" cols={3}>
        <Field label="Tipo de Movimentação" required>
          <Select
            value={tipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setTipo(e.target.value as TipoMovimentacao)
            }
            disabled={!!loteDescarte}
          >
            {TIPOS_MOVIMENTACAO.map((t) => (
              <option key={t} value={t}>
                {t === "Entrada" ? "⬇️ Entrada" : "⬆️ Saída"}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Produto" required>
          <Select
            value={idInsumo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setIdInsumo(e.target.value);
              const escolhido = insumos.find((i) => i.id === e.target.value);
              if (escolhido) setValorUnitario(String(escolhido.valor_unitario));
            }}
            placeholder="Selecione o produto"
            disabled={!!loteDescarte}
          >
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {CATEGORIA_INSUMO_META[i.categoria].icone} {i.nome} ({i.unidade_medida})
              </option>
            ))}
          </Select>
          <Erro campo="insumo" />
        </Field>

        <Field label="Data da Movimentação" required>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Erro campo="data" />
        </Field>

        <Field label={`Quantidade${insumo ? ` (${insumo.unidade_medida})` : ""}`} required>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0,00"
          />
          <Erro campo="quantidade" />
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
        </Field>

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
      </FormSection>

      {/* --------------------------------------------------------------- Entrada */}
      {tipo === "Entrada" && (
        <FormSection title="Dados da Entrada" cols={3}>
          <Field label="Fornecedor">
            <Select
              value={idFornecedor}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setIdFornecedor(e.target.value)
              }
              placeholder="Selecione o fornecedor"
            >
              {fornecedores
                .filter((f) => f.status !== false)
                .map((f) => (
                  <option key={f.id_fornecedor} value={f.id_fornecedor}>
                    {f.nome_fantasia || f.nome_fornecedor}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Número da Nota Fiscal">
            <Input
              value={notaFiscal}
              onChange={(e) => setNotaFiscal(e.target.value)}
              placeholder="Ex.: NF-45821"
            />
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

      {/* ----------------------------------------------------------------- Saída */}
      {tipo === "Saída" && (
        <FormSection title="Destino e Rastreabilidade" cols={3}>
          <Field label="Talhão de Destino">
            <Select
              value={idTalhao}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setIdTalhao(e.target.value);
                setIdAtividade("");
              }}
              placeholder="Selecione o talhão"
            >
              {opcoesTalhao.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.rotulo}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Safra">
            <Input
              list="safras-movimentacao"
              value={safra}
              onChange={(e) => setSafra(e.target.value)}
              placeholder="Ex.: 2026/2027"
            />
            <datalist id="safras-movimentacao">
              {safras.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>

          <Field label="Atividade Relacionada">
            <Select
              value={idAtividade}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setIdAtividade(e.target.value)
              }
              placeholder="Selecione a atividade"
            >
              {opcoesAtividade.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tipo_atividade} — {fmtData(a.data_inicio)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Destino / Finalidade" className="sm:col-span-2 lg:col-span-3">
            <Input
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ex.: Adubação de cobertura, abastecimento de máquinas, cocho..."
            />
            <Erro campo="destino" />
          </Field>
        </FormSection>
      )}

      {/* --------------------------------------------------- Resumo do movimento */}
      {insumo && (
        <div className="mt-6 rounded-lg bg-green-50/60 border border-green-100 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Saldo atual
              </p>
              <p className="text-lg font-bold text-gray-700">
                {fmtQtd(saldoAtual, insumo.unidade_medida)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Movimentação
              </p>
              <p className="text-lg font-bold text-gray-700">
                {tipo === "Entrada" ? "+" : "−"}
                {fmtQtd(num(quantidade), insumo.unidade_medida)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Saldo projetado
              </p>
              <p
                className={`text-lg font-bold ${
                  saldoProjetado < 0
                    ? "text-red-600"
                    : saldoProjetado <= insumo.estoque_minimo
                    ? "text-amber-600"
                    : "text-green-700"
                }`}
              >
                {fmtQtd(saldoProjetado, insumo.unidade_medida)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                Valor da movimentação
              </p>
              <p className="text-lg font-bold text-green-700">{fmtMoeda(valorTotal)}</p>
            </div>
          </div>

          {saldoProjetado <= insumo.estoque_minimo && saldoProjetado >= 0 && (
            <p className="text-xs text-amber-700 mt-3 text-center">
              ⚠️ O saldo ficará no ou abaixo do estoque mínimo (
              {fmtQtd(insumo.estoque_minimo, insumo.unidade_medida)}).
            </p>
          )}

          {vencidos.length > 0 && (
            <p className="text-xs text-red-600 mt-2 text-center">
              ⛔ Lote(s) vencido(s):{" "}
              {vencidos
                .map((l) => `${l.numero_lote} (${fmtData(l.data_validade)})`)
                .join(", ")}
              {tipo === "Saída" &&
                !loteDescarte &&
                ` — saldo utilizável: ${fmtQtd(disponivel, insumo.unidade_medida)}`}
            </p>
          )}

          {!vencidos.length && proximaValidade(insumo) && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Próxima validade: {fmtData(proximaValidade(insumo))}
            </p>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- Observações */}
      <SectionTitle>Observações</SectionTitle>
      <textarea
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        rows={3}
        placeholder="Condições de recebimento, divergências de nota, recomendações de aplicação..."
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition resize-none"
      />

      {/* --------------------------------------------------------------- Ações */}
      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
        <Button variant="secondary" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : loteDescarte ? "Registrar Descarte" : `Registrar ${tipo}`}
        </Button>
      </div>
    </div>
  );
}
