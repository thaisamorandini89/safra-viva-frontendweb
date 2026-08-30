import { useMemo, useState } from "react";
import {
  Insumo,
  CategoriaInsumo,
  CATEGORIAS_INSUMOS,
  CATEGORIA_INSUMO_META,
  STATUS_INSUMO,
  StatusInsumo,
  SITUACOES_ESTOQUE,
  SituacaoEstoque,
  TipoMovimentacao,
  situacaoEstoque,
  proximaValidade,
  diasParaVencer,
  isVencido,
  isProximoVencimento,
  valorEstoque,
  abaixoMinimo,
  fmtMoeda,
  fmtQtd,
  fmtData,
} from "../../types/insumo";
import Button from "../ui/Button";
import InsumoStatusBadge from "./InsumoStatusBadge";

interface Props {
  insumos: Insumo[];
  onVerInsumo: (i: Insumo) => void;
  onNovo: () => void;
  onMovimentar: (insumo: Insumo, tipo: TipoMovimentacao) => void;
}

type Coluna = "nome" | "categoria" | "estoque" | "minimo" | "validade" | "valor";

export default function InsumosLista({
  insumos,
  onVerInsumo,
  onNovo,
  onMovimentar,
}: Props) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<"todas" | CategoriaInsumo>("todas");
  const [propriedade, setPropriedade] = useState("todas");
  const [fornecedor, setFornecedor] = useState("todos");
  const [status, setStatus] = useState<"todos" | StatusInsumo>("todos");
  const [situacao, setSituacao] = useState<"todas" | SituacaoEstoque>("todas");
  const [validadeAte, setValidadeAte] = useState("");
  const [ordem, setOrdem] = useState<{ col: Coluna; asc: boolean }>({
    col: "nome",
    asc: true,
  });

  const propriedades = useMemo(() => {
    const mapa = new Map<string, string>();
    insumos.forEach((i) => {
      if (i.id_propriedade != null)
        mapa.set(String(i.id_propriedade), i.nome_propriedade ?? `#${i.id_propriedade}`);
    });
    return Array.from(mapa.entries());
  }, [insumos]);

  const fornecedores = useMemo(
    () =>
      Array.from(
        new Set(insumos.map((i) => i.fornecedor).filter(Boolean) as string[])
      ).sort(),
    [insumos]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = insumos.filter((i) => {
      const texto = `${i.nome} ${i.tipo ?? ""} ${i.marca ?? ""} ${
        i.fabricante ?? ""
      } ${i.fornecedor ?? ""}`.toLowerCase();
      if (termo && !texto.includes(termo)) return false;
      if (categoria !== "todas" && i.categoria !== categoria) return false;
      if (propriedade !== "todas" && String(i.id_propriedade) !== propriedade)
        return false;
      if (fornecedor !== "todos" && i.fornecedor !== fornecedor) return false;
      if (status !== "todos" && i.status !== status) return false;
      if (situacao !== "todas" && situacaoEstoque(i) !== situacao) return false;
      if (validadeAte) {
        const validade = proximaValidade(i);
        if (!validade || validade > validadeAte) return false;
      }
      return true;
    });

    const dir = ordem.asc ? 1 : -1;
    return [...lista].sort((a, b) => {
      switch (ordem.col) {
        case "categoria":
          return a.categoria.localeCompare(b.categoria, "pt-BR") * dir;
        case "estoque":
          return (a.estoque_atual - b.estoque_atual) * dir;
        case "minimo":
          return (a.estoque_minimo - b.estoque_minimo) * dir;
        case "valor":
          return (valorEstoque(a) - valorEstoque(b)) * dir;
        case "validade":
          return (
            (proximaValidade(a) ?? "9999-12-31").localeCompare(
              proximaValidade(b) ?? "9999-12-31"
            ) * dir
          );
        default:
          return a.nome.localeCompare(b.nome, "pt-BR") * dir;
      }
    });
  }, [
    insumos,
    busca,
    categoria,
    propriedade,
    fornecedor,
    status,
    situacao,
    validadeAte,
    ordem,
  ]);

  const totais = useMemo(
    () => ({
      valor: filtrados.reduce((s, i) => s + valorEstoque(i), 0),
      baixo: filtrados.filter(abaixoMinimo).length,
      vencidos: filtrados.filter(isVencido).length,
    }),
    [filtrados]
  );

  const alternarOrdem = (col: Coluna) =>
    setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : true }));

  const limparFiltros = () => {
    setBusca("");
    setCategoria("todas");
    setPropriedade("todas");
    setFornecedor("todos");
    setStatus("todos");
    setSituacao("todas");
    setValidadeAte("");
  };

  /** Exporta o estoque filtrado em CSV (abre no Excel) */
  const exportarCSV = () => {
    const cabecalho = [
      "Produto",
      "Categoria",
      "Tipo",
      "Fabricante",
      "Marca",
      "Fornecedor",
      "Propriedade",
      "Unidade",
      "Estoque Atual",
      "Estoque Mínimo",
      "Valor Unitário (R$)",
      "Valor em Estoque (R$)",
      "Próxima Validade",
      "Situação",
      "Status",
    ];
    const linhas = filtrados.map((i) => [
      i.nome,
      i.categoria,
      i.tipo ?? "",
      i.fabricante ?? "",
      i.marca ?? "",
      i.fornecedor ?? "",
      i.nome_propriedade ?? "",
      i.unidade_medida,
      i.estoque_atual,
      i.estoque_minimo,
      Number(i.valor_unitario).toFixed(2),
      valorEstoque(i).toFixed(2),
      fmtData(proximaValidade(i)),
      situacaoEstoque(i),
      i.status,
    ]);

    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estoque-insumos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const Cabecalho = ({
    col,
    children,
    className = "",
  }: {
    col: Coluna;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th className={`px-4 py-3 font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => alternarOrdem(col)}
        className="inline-flex items-center gap-1 hover:text-green-700 transition"
      >
        {children}
        <span className="text-[9px] text-gray-300">
          {ordem.col === col ? (ordem.asc ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </th>
  );

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
              placeholder="Pesquisar por produto, marca ou fabricante..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS_INSUMOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={propriedade}
            onChange={(e) => setPropriedade(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todas">Todas as propriedades</option>
            {propriedades.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>

          <select
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os status</option>
            {STATUS_INSUMO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todas">Todas as situações</option>
            {SITUACOES_ESTOQUE.map((s) => (
              <option key={s} value={s}>
                Estoque {s}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              Validade até
            </span>
            <input
              type="date"
              value={validadeAte}
              onChange={(e) => setValidadeAte(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">{filtrados.length}</strong> produto(s) ·{" "}
            <strong className="text-gray-700">{fmtMoeda(totais.valor)}</strong> em
            estoque ·{" "}
            <span className="text-amber-600 font-semibold">
              {totais.baixo} no mínimo
            </span>{" "}
            · <span className="text-red-600 font-semibold">{totais.vencidos} vencidos</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="secondary" onClick={exportarCSV}>
              ⬇️ Exportar relatório
            </Button>
            <Button onClick={onNovo}>+ Novo Insumo</Button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <Cabecalho col="nome">Produto</Cabecalho>
                <Cabecalho col="categoria">Categoria</Cabecalho>
                <Cabecalho col="estoque" className="text-right">
                  Estoque Atual
                </Cabecalho>
                <th className="px-4 py-3 font-semibold">Unidade</th>
                <Cabecalho col="minimo" className="text-right">
                  Estoque Mínimo
                </Cabecalho>
                <Cabecalho col="validade">Validade</Cabecalho>
                <Cabecalho col="valor" className="text-right">
                  Valor
                </Cabecalho>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((i) => {
                const validade = proximaValidade(i);
                const dias = diasParaVencer(validade);
                const vencido = isVencido(i);
                return (
                  <tr
                    key={i.id}
                    onClick={() => onVerInsumo(i)}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {CATEGORIA_INSUMO_META[i.categoria].icone} {i.nome}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {i.marca ?? i.fabricante ?? "—"}
                        {i.nome_propriedade ? ` · ${i.nome_propriedade}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          CATEGORIA_INSUMO_META[i.categoria].chip
                        }`}
                      >
                        {i.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-700">
                      {fmtQtd(i.estoque_atual)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{i.unidade_medida}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                      {fmtQtd(i.estoque_minimo)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmtData(validade)}
                      {dias != null && (
                        <div
                          className={`text-xs ${
                            dias < 0 ? "text-red-500" : "text-gray-400"
                          }`}
                        >
                          {dias < 0
                            ? `${Math.abs(dias)} dia(s) vencido`
                            : `${dias} dia(s)`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {fmtMoeda(valorEstoque(i))}
                    </td>
                    <td className="px-4 py-3">
                      <InsumoStatusBadge
                        insumo={i}
                        vencido={vencido}
                        proximoVencimento={isProximoVencimento(i)}
                        tamanho="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMovimentar(i, "Entrada");
                        }}
                        title="Registrar entrada"
                        className="px-2 py-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-700 transition"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMovimentar(i, "Saída");
                        }}
                        title="Registrar saída"
                        className="px-2 py-1 rounded hover:bg-orange-100 text-gray-500 hover:text-orange-600 transition"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerInsumo(i);
                        }}
                        title="Consultar movimentações"
                        className="px-2 py-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-700 transition"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filtrados.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                    Nenhum insumo encontrado para os filtros aplicados.
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
