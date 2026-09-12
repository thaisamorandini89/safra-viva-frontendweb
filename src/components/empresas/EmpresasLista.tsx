import { useMemo, useState } from "react";
import {
  EmpresaAgricola,
  fmtCNPJ,
  fmtTelefone,
  fmtDataBR,
  isEmpresaAtiva,
} from "../../types/empresaAgricola";
import Button from "../ui/Button";

interface Props {
  empresas: EmpresaAgricola[];
  propriedades: any[];
  onVerEmpresa: (e: EmpresaAgricola) => void;
  onNovo: () => void;
  onEditar: (e: EmpresaAgricola) => void;
  onExcluir: (e: EmpresaAgricola) => void;
}

type Coluna = "razao_social" | "cnpj" | "regime" | "tipo" | "propriedades" | "status";

export default function EmpresasLista({
  empresas,
  propriedades,
  onVerEmpresa,
  onNovo,
  onEditar,
  onExcluir,
}: Props) {
  const [busca, setBusca] = useState("");
  const [regime, setRegime] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState<"todos" | "ativas" | "inativas">("todos");
  const [ordem, setOrdem] = useState<{ col: Coluna; asc: boolean }>({
    col: "razao_social",
    asc: true,
  });

  const propsPorEmpresa = useMemo(() => {
    const mapa = new Map<number, number>();
    propriedades.forEach((p) => {
      const id = Number(p.id_empresa ?? 0);
      mapa.set(id, (mapa.get(id) ?? 0) + 1);
    });
    return mapa;
  }, [propriedades]);

  const regimes = useMemo(() => {
    const set = new Set<string>();
    empresas.forEach((e) => e.regime_tributario_descricao && set.add(e.regime_tributario_descricao));
    return Array.from(set).sort();
  }, [empresas]);

  const tipos = useMemo(() => {
    const set = new Set<string>();
    empresas.forEach((e) => e.tipo_empresa_descricao && set.add(e.tipo_empresa_descricao));
    return Array.from(set).sort();
  }, [empresas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const lista = empresas.filter((e) => {
      if (
        termo &&
        !`${e.razao_social} ${e.nome_fantasia ?? ""} ${e.cnpj}`
          .toLowerCase()
          .includes(termo)
      )
        return false;
      if (regime !== "todos" && e.regime_tributario_descricao !== regime) return false;
      if (tipo !== "todos" && e.tipo_empresa_descricao !== tipo) return false;
      if (status === "ativas" && !isEmpresaAtiva(e)) return false;
      if (status === "inativas" && isEmpresaAtiva(e)) return false;
      return true;
    });

    const dir = ordem.asc ? 1 : -1;
    return [...lista].sort((a, b) => {
      switch (ordem.col) {
        case "cnpj":
          return a.cnpj.localeCompare(b.cnpj) * dir;
        case "regime":
          return (a.regime_tributario_descricao ?? "").localeCompare(
            b.regime_tributario_descricao ?? ""
          ) * dir;
        case "tipo":
          return (a.tipo_empresa_descricao ?? "").localeCompare(
            b.tipo_empresa_descricao ?? ""
          ) * dir;
        case "propriedades":
          return (
            (propsPorEmpresa.get(a.id_empresa) ?? 0) -
            (propsPorEmpresa.get(b.id_empresa) ?? 0)
          ) * dir;
        case "status":
          return (Number(isEmpresaAtiva(a)) - Number(isEmpresaAtiva(b))) * dir;
        default:
          return a.razao_social.localeCompare(b.razao_social, "pt-BR") * dir;
      }
    });
  }, [empresas, busca, regime, tipo, status, ordem, propsPorEmpresa]);

  const totais = useMemo(
    () => ({
      ativas: filtradas.filter(isEmpresaAtiva).length,
      inativas: filtradas.filter((e) => !isEmpresaAtiva(e)).length,
    }),
    [filtradas]
  );

  const alternarOrdem = (col: Coluna) =>
    setOrdem((o) => ({ col, asc: o.col === col ? !o.asc : true }));

  /** Exporta as empresas filtradas em CSV (abre no Excel) */
  const exportarCSV = () => {
    const cabecalho = [
      "Razão Social",
      "Nome Fantasia",
      "CNPJ",
      "Inscrição Estadual",
      "Regime Tributário",
      "Tipo de Empresa",
      "Telefone",
      "E-mail",
      "Website",
      "Propriedades",
      "Situação",
      "Cadastro",
    ];
    const linhas = filtradas.map((e) => [
      e.razao_social,
      e.nome_fantasia ?? "",
      fmtCNPJ(e.cnpj),
      e.inscricao_estadual ?? "",
      e.regime_tributario_descricao ?? "",
      e.tipo_empresa_descricao ?? "",
      fmtTelefone(e.telefone),
      e.email ?? "",
      e.website ?? "",
      String(propsPorEmpresa.get(e.id_empresa) ?? 0),
      isEmpresaAtiva(e) ? "Ativa" : "Inativa",
      fmtDataBR(e.data_cadastro),
    ]);

    const csv = [cabecalho, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `empresas-agricolas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const limparFiltros = () => {
    setBusca("");
    setRegime("todos");
    setTipo("todos");
    setStatus("todos");
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por razão social, fantasia ou CNPJ..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          <select
            value={regime}
            onChange={(e) => setRegime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os regimes</option>
            {regimes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="todos">Todas as situações</option>
            <option value="ativas">Somente ativas</option>
            <option value="inativas">Somente inativas</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">{filtradas.length}</strong> empresa(s) ·{" "}
            <span className="text-green-700 font-semibold">{totais.ativas} ativa(s)</span> ·{" "}
            <span className="text-gray-500 font-semibold">{totais.inativas} inativa(s)</span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="secondary" onClick={exportarCSV}>
              ⬇️ Exportar relatório
            </Button>
            <Button onClick={onNovo}>+ Nova Empresa</Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <Cabecalho col="razao_social">Empresa</Cabecalho>
                <Cabecalho col="cnpj">CNPJ</Cabecalho>
                <Cabecalho col="regime">Regime</Cabecalho>
                <Cabecalho col="tipo">Tipo</Cabecalho>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <Cabecalho col="propriedades" className="text-right">Propriedades</Cabecalho>
                <Cabecalho col="status">Situação</Cabecalho>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.map((e) => {
                const qtd = propsPorEmpresa.get(e.id_empresa) ?? 0;
                const ativa = isEmpresaAtiva(e);
                return (
                  <tr
                    key={e.id_empresa}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                    onClick={() => onVerEmpresa(e)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">
                        {e.nome_fantasia || e.razao_social}
                      </div>
                      <div className="text-xs text-gray-400">{e.razao_social}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {fmtCNPJ(e.cnpj)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.regime_tributario_descricao ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.tipo_empresa_descricao ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-xs">{fmtTelefone(e.telefone)}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">
                        {e.email ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 font-semibold">
                      {qtd}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${
                          ativa
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ativa ? "bg-green-600" : "bg-gray-400"
                          }`}
                        />
                        {ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onVerEmpresa(e);
                        }}
                        title="Ver detalhes"
                        className="px-2 py-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-700 transition"
                      >
                        👁️
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEditar(e);
                        }}
                        title="Editar"
                        className="px-2 py-1 rounded hover:bg-sky-100 text-gray-500 hover:text-sky-700 transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onExcluir(e);
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

              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="text-4xl mb-2">🏢</div>
                    <p className="text-sm font-semibold text-gray-600">
                      Nenhuma empresa encontrada
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ajuste os filtros ou cadastre uma nova empresa agrícola.
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
