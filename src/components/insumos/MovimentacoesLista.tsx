import { useMemo, useState } from "react";
import {
  Insumo,
  MovimentacaoEstoque,
  TipoMovimentacao,
  TIPOS_MOVIMENTACAO,
  CATEGORIA_INSUMO_META,
  valorMovimentacao,
  fmtMoeda,
  fmtQtd,
  fmtData,
} from "../../types/insumo";
import Button from "../ui/Button";

interface Props {
  insumos: Insumo[];
  movimentacoes: MovimentacaoEstoque[];
  onNovaMovimentacao: (tipo: TipoMovimentacao) => void;
}

export default function MovimentacoesLista({
  insumos,
  movimentacoes,
  onNovaMovimentacao,
}: Props) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | TipoMovimentacao>("todos");
  const [produto, setProduto] = useState("todos");
  const [safra, setSafra] = useState("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const mapaInsumos = useMemo(
    () => new Map(insumos.map((i) => [i.id, i])),
    [insumos]
  );

  const safras = useMemo(
    () =>
      Array.from(
        new Set(movimentacoes.map((m) => m.safra).filter(Boolean) as string[])
      )
        .sort()
        .reverse(),
    [movimentacoes]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return movimentacoes
      .filter((m) => {
        const texto = `${m.nome_insumo ?? ""} ${m.responsavel ?? ""} ${
          m.fornecedor ?? ""
        } ${m.nota_fiscal ?? ""} ${m.destino ?? ""} ${m.nome_talhao ?? ""}`.toLowerCase();
        if (termo && !texto.includes(termo)) return false;
        if (tipo !== "todos" && m.tipo !== tipo) return false;
        if (produto !== "todos" && m.id_insumo !== produto) return false;
        if (safra !== "todas" && m.safra !== safra) return false;
        if (de && m.data_movimentacao < de) return false;
        if (ate && m.data_movimentacao > ate) return false;
        return true;
      })
      .sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao));
  }, [movimentacoes, busca, tipo, produto, safra, de, ate]);

  const totais = useMemo(
    () => ({
      entradas: filtradas
        .filter((m) => m.tipo === "Entrada")
        .reduce((s, m) => s + valorMovimentacao(m), 0),
      saidas: filtradas
        .filter((m) => m.tipo === "Saída")
        .reduce((s, m) => s + valorMovimentacao(m), 0),
    }),
    [filtradas]
  );

  const limparFiltros = () => {
    setBusca("");
    setTipo("todos");
    setProduto("todos");
    setSafra("todas");
    setDe("");
    setAte("");
  };

  /** Exporta o histórico filtrado em CSV (abre no Excel) */
  const exportarCSV = () => {
    const cabecalho = [
      "Data",
      "Tipo",
      "Produto",
      "Quantidade",
      "Unidade",
      "Valor Unitário (R$)",
      "Valor Total (R$)",
      "Responsável",
      "Fornecedor",
      "Nota Fiscal",
      "Lote",
      "Talhão",
      "Safra",
      "Atividade",
      "Destino",
      "Observação",
    ];
    const linhas = filtradas.map((m) => [
      fmtData(m.data_movimentacao),
      m.tipo,
      m.nome_insumo ?? mapaInsumos.get(m.id_insumo)?.nome ?? m.id_insumo,
      m.quantidade,
      mapaInsumos.get(m.id_insumo)?.unidade_medida ?? "",
      Number(m.valor_unitario ?? 0).toFixed(2),
      valorMovimentacao(m).toFixed(2),
      m.responsavel ?? "",
      m.fornecedor ?? "",
      m.nota_fiscal ?? "",
      m.numero_lote ?? "",
      `${m.codigo_talhao ?? ""} ${m.nome_talhao ?? ""}`.trim(),
      m.safra ?? "",
      m.atividade ?? "",
      m.destino ?? "",
      m.observacao ?? "",
    ]);

    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `movimentacoes-estoque-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------- Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="xl:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por produto, responsável, nota fiscal..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Entradas e saídas</option>
            {TIPOS_MOVIMENTACAO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os produtos</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>

          <select
            value={safra}
            onChange={(e) => setSafra(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todas">Todas as safras</option>
            {safras.map((s) => (
              <option key={s} value={s}>
                Safra {s}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">{filtradas.length}</strong> movimentação(ões)
            · <span className="text-green-700 font-semibold">
              {fmtMoeda(totais.entradas)} em entradas
            </span>{" "}
            ·{" "}
            <span className="text-orange-600 font-semibold">
              {fmtMoeda(totais.saidas)} em saídas
            </span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="secondary" onClick={exportarCSV}>
              ⬇️ Exportar relatório
            </Button>
            <Button variant="secondary" onClick={() => onNovaMovimentacao("Entrada")}>
              ⬇️ Registrar Entrada
            </Button>
            <Button onClick={() => onNovaMovimentacao("Saída")}>
              ⬆️ Registrar Saída
            </Button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold text-right">Quantidade</th>
                <th className="px-4 py-3 font-semibold">Origem / Destino</th>
                <th className="px-4 py-3 font-semibold">Responsável</th>
                <th className="px-4 py-3 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((m) => {
                const insumo = mapaInsumos.get(m.id_insumo);
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
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {insumo
                          ? `${CATEGORIA_INSUMO_META[insumo.categoria].icone} ${insumo.nome}`
                          : m.nome_insumo ?? m.id_insumo}
                      </div>
                      {m.numero_lote && (
                        <div className="text-xs text-gray-400">Lote {m.numero_lote}</div>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        entrada ? "text-green-700" : "text-orange-600"
                      }`}
                    >
                      {entrada ? "+" : "−"}
                      {fmtQtd(m.quantidade, insumo?.unidade_medida)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entrada ? (
                        <>
                          <div>{m.fornecedor ?? "—"}</div>
                          {m.nota_fiscal && (
                            <div className="text-xs text-gray-400">{m.nota_fiscal}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>{m.destino ?? m.atividade ?? "—"}</div>
                          <div className="text-xs text-gray-400">
                            {m.codigo_talhao ? `${m.codigo_talhao} · ` : ""}
                            {m.safra ?? ""}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.responsavel ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {fmtMoeda(valorMovimentacao(m))}
                    </td>
                  </tr>
                );
              })}
              {!filtradas.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                    Nenhuma movimentação encontrada para os filtros aplicados.
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
