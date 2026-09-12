import { useMemo, useState } from "react";
import {
  Talhao,
  STATUS_TALHAO,
  StatusTalhao,
  areaOcupada,
  areaDisponivel,
  percentualOcupacao,
  fmtHa,
} from "../../types/talhao";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";

interface Props {
  talhoes: Talhao[];
  onVerTalhao: (t: Talhao) => void;
  onNovo: () => void;
  onEditar: (t: Talhao) => void;
  onExcluir: (t: Talhao) => void;
}

type Coluna = "nome" | "codigo" | "area_total" | "ocupacao" | "status";

export default function TalhoesLista({ talhoes, onVerTalhao, onNovo, onEditar, onExcluir }: Props) {
  const [busca, setBusca] = useState("");
  const [propriedade, setPropriedade] = useState("todas");
  const [safra, setSafra] = useState("todas");
  const [status, setStatus] = useState<"todos" | StatusTalhao>("todos");
  const [ordem, setOrdem] = useState<{ col: Coluna; asc: boolean }>({
    col: "nome",
    asc: true,
  });

  const propriedades = useMemo(() => {
    const mapa = new Map<number, string>();
    talhoes.forEach((t) =>
      mapa.set(t.id_propriedade, t.nome_propriedade ?? `Propriedade ${t.id_propriedade}`)
    );
    return Array.from(mapa.entries());
  }, [talhoes]);

  const safras = useMemo(() => {
    const set = new Set<string>();
    talhoes.forEach((t) => t.historico?.forEach((h) => set.add(h.safra)));
    return Array.from(set).sort().reverse();
  }, [talhoes]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = talhoes.filter((t) => {
      if (termo && !`${t.nome} ${t.codigo}`.toLowerCase().includes(termo)) return false;
      if (propriedade !== "todas" && String(t.id_propriedade) !== propriedade) return false;
      if (status !== "todos" && t.status !== status) return false;
      if (safra !== "todas" && !(t.historico ?? []).some((h) => h.safra === safra))
        return false;
      return true;
    });

    const dir = ordem.asc ? 1 : -1;
    return [...lista].sort((a, b) => {
      switch (ordem.col) {
        case "area_total":
          return (a.area_total - b.area_total) * dir;
        case "ocupacao":
          return (percentualOcupacao(a) - percentualOcupacao(b)) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "codigo":
          return a.codigo.localeCompare(b.codigo) * dir;
        default:
          return a.nome.localeCompare(b.nome, "pt-BR") * dir;
      }
    });
  }, [talhoes, busca, propriedade, safra, status, ordem]);

  const totais = useMemo(
    () => ({
      area: filtrados.reduce((s, t) => s + t.area_total, 0),
      ocupada: filtrados.reduce((s, t) => s + areaOcupada(t), 0),
      disponivel: filtrados.reduce((s, t) => s + areaDisponivel(t), 0),
    }),
    [filtrados]
  );

  const alternarOrdem = (col: Coluna) =>
    setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : true }));

  /** Exporta os talhões filtrados em CSV (abre no Excel) */
  const exportarCSV = () => {
    const cabecalho = [
      "Nome",
      "Código",
      "Propriedade",
      "Área Total (ha)",
      "Área Utilizável (ha)",
      "Área Utilizada (ha)",
      "Área Disponível (ha)",
      "Tipo de Solo",
      "Topografia",
      "Status",
    ];
    const linhas = filtrados.map((t) => [
      t.nome,
      t.codigo,
      t.nome_propriedade ?? t.id_propriedade,
      fmtHa(t.area_total),
      fmtHa(t.area_utilizavel),
      fmtHa(areaOcupada(t)),
      fmtHa(areaDisponivel(t)),
      t.tipo_solo,
      t.topografia ?? "",
      t.status,
    ]);

    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `talhoes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const limparFiltros = () => {
    setBusca("");
    setPropriedade("todas");
    setSafra("todas");
    setStatus("todos");
  };

  const Cabecalho = ({ col, children, className = "" }: { col: Coluna; children: React.ReactNode; className?: string }) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nome ou código do talhão..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

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
            {STATUS_TALHAO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">{filtrados.length}</strong> talhão(ões) ·{" "}
            <strong className="text-gray-700">{fmtHa(totais.area, 1)} ha</strong> de área total ·{" "}
            <span className="text-green-700 font-semibold">{fmtHa(totais.ocupada, 1)} ha ocupados</span> ·{" "}
            <span className="text-amber-600 font-semibold">{fmtHa(totais.disponivel, 1)} ha livres</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="secondary" onClick={exportarCSV}>
              ⬇️ Exportar relatório
            </Button>
            <Button onClick={onNovo}>+ Novo Talhão</Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <Cabecalho col="nome">Nome</Cabecalho>
                <Cabecalho col="codigo">Código</Cabecalho>
                <th className="px-4 py-3 font-semibold">Propriedade</th>
                <Cabecalho col="area_total" className="text-right">Área Total</Cabecalho>
                <Cabecalho col="ocupacao">Área Utilizada</Cabecalho>
                <th className="px-4 py-3 font-semibold">Tipo de Solo</th>
                <Cabecalho col="status">Status</Cabecalho>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((t) => {
                const pct = percentualOcupacao(t);
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                    onClick={() => onVerTalhao(t)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{t.nome}</div>
                      <div className="text-xs text-gray-400">
                        {t.topografia ?? "Topografia não informada"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {t.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.nome_propriedade ?? `#${t.id_propriedade}`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 font-semibold">
                      {fmtHa(t.area_total, 1)} ha
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct >= 90 ? "#f97316" : "#16a34a",
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-20 text-right">
                          {fmtHa(areaOcupada(t), 1)} ha
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.tipo_solo}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerTalhao(t);
                        }}
                        title="Ver detalhes"
                        className="px-2 py-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-700 transition"
                      >
                        👁️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(t);
                        }}
                        title="Editar"
                        className="px-2 py-1 rounded hover:bg-sky-100 text-gray-500 hover:text-sky-700 transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExcluir(t);
                        }}
                        title="Excluir"
                        className="px-2 py-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="text-4xl mb-2">🌾</div>
                    <p className="text-sm font-semibold text-gray-600">
                      Nenhum talhão encontrado
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ajuste os filtros ou cadastre um novo talhão.
                    </p>
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
