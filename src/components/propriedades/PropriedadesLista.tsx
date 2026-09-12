import { useMemo, useState } from "react";
import Button from "../ui/Button";
import { fmtHa } from "./PropriedadesDashboard";

interface Props {
  propriedades: any[];
  onVerPropriedade: (p: any) => void;
  onNovo: () => void;
}

type Coluna = "nome" | "empresa" | "area_total" | "area_agricultavel" | "solo";

export default function PropriedadesLista({
  propriedades,
  onVerPropriedade,
  onNovo,
}: Props) {
  const [busca, setBusca] = useState("");
  const [empresa, setEmpresa] = useState("todas");
  const [solo, setSolo] = useState("todos");
  const [ordem, setOrdem] = useState<{ col: Coluna; asc: boolean }>({
    col: "nome",
    asc: true,
  });

  const empresas = useMemo(() => {
    const set = new Set<string>();
    propriedades.forEach((p) => p.empresa_nome && set.add(p.empresa_nome));
    return Array.from(set).sort();
  }, [propriedades]);

  const solos = useMemo(() => {
    const set = new Set<string>();
    propriedades.forEach((p) => p.tipo_solo_descricao && set.add(p.tipo_solo_descricao));
    return Array.from(set).sort();
  }, [propriedades]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = propriedades.filter((p) => {
      if (
        termo &&
        !`${p.nome_propriedade} ${p.car ?? ""} ${p.empresa_nome ?? ""}`
          .toLowerCase()
          .includes(termo)
      )
        return false;
      if (empresa !== "todas" && p.empresa_nome !== empresa) return false;
      if (solo !== "todos" && p.tipo_solo_descricao !== solo) return false;
      return true;
    });

    const dir = ordem.asc ? 1 : -1;
    return [...lista].sort((a, b) => {
      switch (ordem.col) {
        case "empresa":
          return (a.empresa_nome ?? "").localeCompare(b.empresa_nome ?? "") * dir;
        case "area_total":
          return (Number(a.area_total || 0) - Number(b.area_total || 0)) * dir;
        case "area_agricultavel":
          return (
            (Number(a.area_agricultavel || 0) - Number(b.area_agricultavel || 0)) * dir
          );
        case "solo":
          return (a.tipo_solo_descricao ?? "").localeCompare(
            b.tipo_solo_descricao ?? ""
          ) * dir;
        default:
          return (a.nome_propriedade ?? "").localeCompare(
            b.nome_propriedade ?? "",
            "pt-BR"
          ) * dir;
      }
    });
  }, [propriedades, busca, empresa, solo, ordem]);

  const totais = useMemo(
    () => ({
      area: filtradas.reduce((s, p) => s + Number(p.area_total || 0), 0),
      agricultavel: filtradas.reduce((s, p) => s + Number(p.area_agricultavel || 0), 0),
      preservacao: filtradas.reduce((s, p) => s + Number(p.area_preservacao || 0), 0),
    }),
    [filtradas]
  );

  const alternarOrdem = (col: Coluna) =>
    setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : true }));

  /** Exporta as propriedades filtradas em CSV (abre no Excel) */
  const exportarCSV = () => {
    const cabecalho = [
      "Propriedade",
      "Empresa",
      "CAR",
      "CCIR",
      "NIRF",
      "Área Total (ha)",
      "Área Agricultável (ha)",
      "Área de Preservação (ha)",
      "Tipo de Solo",
      "Classe de Capacidade de Uso",
    ];
    const linhas = filtradas.map((p) => [
      p.nome_propriedade ?? "",
      p.empresa_nome ?? "",
      p.car ?? "",
      p.ccir ?? "",
      p.nirf ?? "",
      fmtHa(Number(p.area_total || 0)),
      fmtHa(Number(p.area_agricultavel || 0)),
      fmtHa(Number(p.area_preservacao || 0)),
      p.tipo_solo_descricao ?? "",
      p.classe_capacidade_uso_descricao ?? "",
    ]);

    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `propriedades-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const limparFiltros = () => {
    setBusca("");
    setEmpresa("todas");
    setSolo("todos");
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="xl:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nome, CAR ou empresa..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todas">Todas as empresas</option>
            {empresas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <select
            value={solo}
            onChange={(e) => setSolo(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os tipos de solo</option>
            {solos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">{filtradas.length}</strong> propriedade(s) ·{" "}
            <strong className="text-gray-700">{fmtHa(totais.area, 1)} ha</strong> de área total ·{" "}
            <span className="text-green-700 font-semibold">{fmtHa(totais.agricultavel, 1)} ha agricultáveis</span> ·{" "}
            <span className="text-sky-600 font-semibold">{fmtHa(totais.preservacao, 1)} ha preservados</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="secondary" onClick={exportarCSV}>
              ⬇️ Exportar relatório
            </Button>
            <Button onClick={onNovo}>+ Nova Propriedade</Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <Cabecalho col="nome">Propriedade</Cabecalho>
                <Cabecalho col="empresa">Empresa</Cabecalho>
                <th className="px-4 py-3 font-semibold">CAR</th>
                <Cabecalho col="area_total" className="text-right">Área Total</Cabecalho>
                <Cabecalho col="area_agricultavel" className="text-right">Agricultável</Cabecalho>
                <Cabecalho col="solo">Tipo de Solo</Cabecalho>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((p) => (
                <tr
                  key={p.id_propriedade}
                  className="hover:bg-green-50/40 transition-colors cursor-pointer"
                  onClick={() => onVerPropriedade(p)}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{p.nome_propriedade}</div>
                    <div className="text-xs text-gray-400">
                      {p.classe_capacidade_uso_sigla
                        ? `Classe ${p.classe_capacidade_uso_sigla} — ${p.classe_capacidade_uso_descricao ?? ""}`
                        : "Classe não informada"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.empresa_nome ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {p.car ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 font-semibold">
                    {fmtHa(Number(p.area_total || 0), 1)} ha
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-700 font-semibold">
                    {fmtHa(Number(p.area_agricultavel || 0), 1)} ha
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.tipo_solo_descricao ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onVerPropriedade(p);
                      }}
                      title="Ver detalhes"
                      className="px-2 py-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-700 transition"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}

              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="text-4xl mb-2">🌿</div>
                    <p className="text-sm font-semibold text-gray-600">
                      Nenhuma propriedade encontrada
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ajuste os filtros ou cadastre uma nova propriedade.
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
