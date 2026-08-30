import { useMemo } from "react";
import {
  Insumo,
  MovimentacaoEstoque,
  TipoMovimentacao,
  CATEGORIA_INSUMO_META,
  diasParaVencer,
  isProximoVencimento,
  isVencido,
  proximaValidade,
  valorEstoque,
  valorMovimentacao,
  fmtMoeda,
  fmtQtd,
  fmtData,
} from "../../types/insumo";
import Button from "../ui/Button";
import InsumoStatusBadge from "./InsumoStatusBadge";

interface Props {
  insumo: Insumo;
  movimentacoes: MovimentacaoEstoque[];
  onVoltar: () => void;
  onMovimentar: (insumo: Insumo, tipo: TipoMovimentacao) => void;
}

export default function InsumoDetalhe({
  insumo: i,
  movimentacoes,
  onVoltar,
  onMovimentar,
}: Props) {
  const historico = useMemo(
    () =>
      movimentacoes
        .filter((m) => m.id_insumo === i.id)
        .sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao)),
    [movimentacoes, i.id]
  );

  const totais = useMemo(
    () => ({
      entradas: historico
        .filter((m) => m.tipo === "Entrada")
        .reduce((s, m) => s + Number(m.quantidade || 0), 0),
      saidas: historico
        .filter((m) => m.tipo === "Saída")
        .reduce((s, m) => s + Number(m.quantidade || 0), 0),
      consumo: historico
        .filter((m) => m.tipo === "Saída")
        .reduce((s, m) => s + valorMovimentacao(m), 0),
    }),
    [historico]
  );

  const validade = proximaValidade(i);
  const dias = diasParaVencer(validade);

  const Info = ({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) => (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{rotulo}</p>
      <p className="text-sm font-semibold text-gray-700 mt-0.5">{valor}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onVoltar}>
          ← Voltar para a lista
        </Button>
        <div className="flex items-center gap-3">
          <InsumoStatusBadge
            insumo={i}
            vencido={isVencido(i)}
            proximoVencimento={isProximoVencimento(i)}
          />
          <Button variant="secondary" onClick={() => onMovimentar(i, "Entrada")}>
            ⬇️ Registrar Entrada
          </Button>
          <Button onClick={() => onMovimentar(i, "Saída")}>⬆️ Registrar Saída</Button>
        </div>
      </div>

      {/* ----------------------------------------------------------- Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl shrink-0">
            {CATEGORIA_INSUMO_META[i.categoria].icone}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{i.nome}</h3>
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                CATEGORIA_INSUMO_META[i.categoria].chip
              }`}
            >
              {i.categoria}
              {i.tipo ? ` · ${i.tipo}` : ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-6 pt-5 border-t border-gray-100">
          <Info rotulo="Estoque atual" valor={fmtQtd(i.estoque_atual, i.unidade_medida)} />
          <Info
            rotulo="Estoque mínimo"
            valor={fmtQtd(i.estoque_minimo, i.unidade_medida)}
          />
          <Info rotulo="Valor unitário" valor={fmtMoeda(i.valor_unitario)} />
          <Info rotulo="Valor em estoque" valor={fmtMoeda(valorEstoque(i))} />
          <Info rotulo="Fabricante" valor={i.fabricante ?? "—"} />
          <Info rotulo="Marca" valor={i.marca ?? "—"} />
          <Info rotulo="Fornecedor" valor={i.fornecedor ?? "—"} />
          <Info rotulo="Propriedade" valor={i.nome_propriedade ?? "—"} />
          <Info
            rotulo="Próxima validade"
            valor={
              validade
                ? `${fmtData(validade)}${
                    dias != null
                      ? dias < 0
                        ? ` (${Math.abs(dias)} dia(s) vencido)`
                        : ` (${dias} dia(s))`
                      : ""
                  }`
                : "—"
            }
          />
          <Info rotulo="Registro MAPA" valor={i.registro_mapa ?? "—"} />
          <Info rotulo="Status" valor={i.status} />
          <Info
            rotulo="Consumo acumulado"
            valor={`${fmtQtd(totais.saidas, i.unidade_medida)} · ${fmtMoeda(
              totais.consumo
            )}`}
          />
        </div>

        {(i.ficha_tecnica || i.observacoes) && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
            {i.ficha_tecnica && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Ficha técnica
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{i.ficha_tecnica}</p>
              </div>
            )}
            {i.observacoes && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Observações
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{i.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- Lotes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Lotes</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Controle de validade por lote recebido
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold">Lote</th>
                <th className="px-4 py-3 font-semibold">Fabricação</th>
                <th className="px-4 py-3 font-semibold">Validade</th>
                <th className="px-4 py-3 font-semibold text-right">Quantidade</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(i.lotes ?? []).map((l) => {
                const diasLote = diasParaVencer(l.data_validade);
                const vencido = diasLote != null && diasLote < 0;
                return (
                  <tr key={l.id} className="hover:bg-green-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {l.numero_lote}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {fmtData(l.data_fabricacao)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtData(l.data_validade)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {fmtQtd(l.quantidade, i.unidade_medida)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-semibold px-1.5 py-0.5 ${
                          vencido
                            ? "bg-red-50 text-red-600 border-red-200"
                            : diasLote != null && diasLote <= 60
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {vencido
                          ? "⛔ Vencido"
                          : diasLote != null && diasLote <= 60
                          ? "⏰ A vencer"
                          : "✅ Válido"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!(i.lotes ?? []).length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                    Nenhum lote registrado para este produto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------ Histórico */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              Histórico de Movimentações
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Rastreabilidade completa das entradas e saídas do produto
            </p>
          </div>
          <p className="text-xs text-gray-500">
            <span className="text-green-700 font-semibold">
              +{fmtQtd(totais.entradas, i.unidade_medida)}
            </span>{" "}
            ·{" "}
            <span className="text-orange-600 font-semibold">
              −{fmtQtd(totais.saidas, i.unidade_medida)}
            </span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold text-right">Quantidade</th>
                <th className="px-4 py-3 font-semibold">Origem / Destino</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historico.map((m) => {
                const entrada = m.tipo === "Entrada";
                return (
                  <tr key={m.id} className="hover:bg-green-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmtData(m.data_movimentacao)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border text-[10px] font-semibold px-1.5 py-0.5 ${
                          entrada
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}
                      >
                        {entrada ? "⬇️ Entrada" : "⬆️ Saída"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        entrada ? "text-green-700" : "text-orange-600"
                      }`}
                    >
                      {entrada ? "+" : "−"}
                      {fmtQtd(m.quantidade, i.unidade_medida)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entrada
                        ? m.fornecedor ?? "—"
                        : `${m.destino ?? m.atividade ?? "—"}${
                            m.codigo_talhao ? ` · ${m.codigo_talhao}` : ""
                          }`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.responsavel ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {fmtMoeda(valorMovimentacao(m))}
                    </td>
                  </tr>
                );
              })}
              {!historico.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    Nenhuma movimentação registrada para este produto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
