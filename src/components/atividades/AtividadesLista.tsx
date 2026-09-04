import { useMemo, useState } from "react";
import {
  AtividadeAgricola,
  STATUS_ATIVIDADE,
  StatusAtividade,
  CATEGORIAS,
  CATEGORIA_META,
  CATEGORIAS_ATIVIDADE,
  CategoriaAtividade,
  categoriaDoTipo,
  custoTotal,
  isAtrasada,
  duracaoDias,
  fmtMoeda,
  fmtData,
} from "../../types/atividade";
import Button from "../ui/Button";
import AtividadeStatusBadge from "./AtividadeStatusBadge";

interface Props {
  atividades: AtividadeAgricola[];
  onVerAtividade: (a: AtividadeAgricola) => void;
  onNova: () => void;
}

type Coluna = "tipo" | "talhao" | "responsavel" | "data_inicio" | "custo" | "status";

export default function AtividadesLista({ atividades, onVerAtividade, onNova }: Props) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<"todas" | CategoriaAtividade>("todas");
  const [tipo, setTipo] = useState("todos");
  const [talhao, setTalhao] = useState("todos");
  const [safra, setSafra] = useState("todas");
  const [status, setStatus] = useState<"todos" | StatusAtividade>("todos");
  const [ordem, setOrdem] = useState<{ col: Coluna; asc: boolean }>({
    col: "data_inicio",
    asc: false,
  });

  const talhoes = useMemo(() => {
    const mapa = new Map<string, string>();
    atividades.forEach((a) =>
      mapa.set(a.id_talhao, `${a.codigo_talhao ?? a.id_talhao} · ${a.nome_talhao ?? ""}`.trim())
    );
    return Array.from(mapa.entries());
  }, [atividades]);

  const safras = useMemo(
    () =>
      Array.from(new Set(atividades.map((a) => a.safra).filter(Boolean) as string[]))
        .sort()
        .reverse(),
    [atividades]
  );

  const tiposDisponiveis = useMemo(
    () =>
      categoria === "todas"
        ? CATEGORIAS.flatMap((c) => CATEGORIAS_ATIVIDADE[c] as readonly string[])
        : (CATEGORIAS_ATIVIDADE[categoria] as readonly string[]),
    [categoria]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = atividades.filter((a) => {
      const texto = `${a.tipo_atividade} ${a.responsavel ?? ""} ${a.nome_talhao ?? ""} ${
        a.codigo_talhao ?? ""
      }`.toLowerCase();
      if (termo && !texto.includes(termo)) return false;
      if (categoria !== "todas" && categoriaDoTipo(a.tipo_atividade) !== categoria) return false;
      if (tipo !== "todos" && a.tipo_atividade !== tipo) return false;
      if (talhao !== "todos" && a.id_talhao !== talhao) return false;
      if (safra !== "todas" && a.safra !== safra) return false;
      if (status !== "todos" && a.status !== status) return false;
      return true;
    });

    const dir = ordem.asc ? 1 : -1;
    return [...lista].sort((a, b) => {
      switch (ordem.col) {
        case "talhao":
          return (a.codigo_talhao ?? "").localeCompare(b.codigo_talhao ?? "") * dir;
        case "responsavel":
          return (a.responsavel ?? "").localeCompare(b.responsavel ?? "", "pt-BR") * dir;
        case "custo":
          return (custoTotal(a) - custoTotal(b)) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "data_inicio":
          return a.data_inicio.localeCompare(b.data_inicio) * dir;
        default:
          return a.tipo_atividade.localeCompare(b.tipo_atividade, "pt-BR") * dir;
      }
    });
  }, [atividades, busca, categoria, tipo, talhao, safra, status, ordem]);

  const totais = useMemo(
    () => ({
      custo: filtradas.reduce((s, a) => s + custoTotal(a), 0),
      andamento: filtradas.filter((a) => a.status === "Em Andamento").length,
      atrasadas: filtradas.filter(isAtrasada).length,
    }),
    [filtradas]
  );

  const alternarOrdem = (col: Coluna) =>
    setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : true }));

  const limparFiltros = () => {
    setBusca("");
    setCategoria("todas");
    setTipo("todos");
    setTalhao("todos");
    setSafra("todas");
    setStatus("todos");
  };

  /** Exporta as atividades filtradas em CSV (abre no Excel) */
  const exportarCSV = () => {
    const cabecalho = [
      "Atividade",
      "Categoria",
      "Propriedade",
      "Talhão",
      "Safra",
      "Responsável",
      "Data Início",
      "Data Fim",
      "Status",
      "Custo (R$)",
      "Insumos",
      "Máquinas",
      "Observações",
    ];
    const linhas = filtradas.map((a) => [
      a.tipo_atividade,
      categoriaDoTipo(a.tipo_atividade),
      a.nome_propriedade ?? a.id_propriedade,
      `${a.codigo_talhao ?? a.id_talhao} ${a.nome_talhao ?? ""}`.trim(),
      a.safra ?? "",
      a.responsavel ?? "",
      fmtData(a.data_inicio),
      fmtData(a.data_fim),
      a.status,
      custoTotal(a).toFixed(2),
      (a.insumos ?? []).map((i) => `${i.nome} (${i.quantidade} ${i.unidade})`).join(" | "),
      (a.maquinas ?? []).map((m) => m.nome).join(" | "),
      a.observacoes ?? "",
    ]);

    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atividades-${new Date().toISOString().slice(0, 10)}.csv`;
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
              placeholder="Pesquisar por atividade, talhão ou responsável..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value as any);
              setTipo("todos");
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os tipos</option>
            {tiposDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={talhao}
            onChange={(e) => setTalhao(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os talhões</option>
            {talhoes.map(([id, rotulo]) => (
              <option key={id} value={id}>
                {rotulo}
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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os status</option>
            {STATUS_ATIVIDADE.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">{filtradas.length}</strong> atividade(s) ·{" "}
            <strong className="text-gray-700">{fmtMoeda(totais.custo)}</strong> em custos ·{" "}
            <span className="text-amber-600 font-semibold">{totais.andamento} em andamento</span> ·{" "}
            <span className="text-red-600 font-semibold">{totais.atrasadas} atrasadas</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="secondary" onClick={exportarCSV}>
              ⬇️ Exportar relatório
            </Button>
            <Button onClick={onNova}>+ Nova Atividade</Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <Cabecalho col="tipo">Atividade</Cabecalho>
                <Cabecalho col="talhao">Talhão</Cabecalho>
                <th className="px-4 py-3 font-semibold">Safra</th>
                <Cabecalho col="responsavel">Responsável</Cabecalho>
                <Cabecalho col="data_inicio">Período</Cabecalho>
                <th className="px-4 py-3 font-semibold">Recursos</th>
                <Cabecalho col="custo" className="text-right">Custo</Cabecalho>
                <Cabecalho col="status">Status</Cabecalho>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((a) => {
                const cat = categoriaDoTipo(a.tipo_atividade);
                return (
                  <tr
                    key={a.id}
                    onClick={() => onVerAtividade(a)}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {CATEGORIA_META[cat].icone} {a.tipo_atividade}
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CATEGORIA_META[cat].chip}`}
                      >
                        {cat}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {a.codigo_talhao ?? a.id_talhao}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">{a.nome_talhao}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.safra ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{a.responsavel ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmtData(a.data_inicio)} › {fmtData(a.data_fim)}
                      <div className="text-xs text-gray-400">{duracaoDias(a)} dia(s)</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      📦 {(a.insumos ?? []).length} insumo(s)
                      <div>🚜 {(a.maquinas ?? []).length} máquina(s)</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-700">
                      {fmtMoeda(custoTotal(a))}
                    </td>
                    <td className="px-4 py-3">
                      <AtividadeStatusBadge status={a.status} atrasada={isAtrasada(a)} tamanho="sm" />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerAtividade(a);
                        }}
                        title="Ver detalhes"
                        className="px-2 py-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-700 transition"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filtradas.length && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                    Nenhuma atividade encontrada para os filtros aplicados.
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
