import { useMemo, useState } from "react";
import {
  Insumo,
  MovimentacaoEstoque,
  valorEstoque,
  valorMovimentacao,
  situacaoEstoque,
  fmtMoeda,
  fmtQtd,
  fmtData,
} from "../../types/insumo";
import Button from "../ui/Button";

interface Props {
  insumos: Insumo[];
  movimentacoes: MovimentacaoEstoque[];
}

type RelatorioId = "estoque" | "talhao" | "safra" | "vencidos";

const RELATORIOS: { id: RelatorioId; titulo: string; descricao: string }[] = [
  {
    id: "estoque",
    titulo: "Estoque Atual",
    descricao: "Produto, quantidade disponível e valor imobilizado",
  },
  {
    id: "talhao",
    titulo: "Consumo por Talhão",
    descricao: "Insumos aplicados em cada área produtiva e seu custo",
  },
  {
    id: "safra",
    titulo: "Consumo por Safra",
    descricao: "Quantidade e valor consumidos em cada ciclo produtivo",
  },
  {
    id: "vencidos",
    titulo: "Produtos Vencidos",
    descricao: "Lotes com validade expirada e saldo remanescente",
  },
];

interface Tabela {
  colunas: string[];
  alinharDireita: number[];
  linhas: (string | number)[][];
  rodape?: string;
}

export default function InsumosRelatorios({ insumos, movimentacoes }: Props) {
  const [relatorio, setRelatorio] = useState<RelatorioId>("estoque");

  const mapaInsumos = useMemo(
    () => new Map(insumos.map((i) => [i.id, i])),
    [insumos]
  );

  const saidas = useMemo(
    () => movimentacoes.filter((m) => m.tipo === "Saída"),
    [movimentacoes]
  );

  const tabela: Tabela = useMemo(() => {
    if (relatorio === "estoque") {
      const linhas = [...insumos]
        .sort((a, b) => valorEstoque(b) - valorEstoque(a))
        .map((i) => [
          i.nome,
          i.categoria,
          fmtQtd(i.estoque_atual, i.unidade_medida),
          fmtMoeda(i.valor_unitario),
          fmtMoeda(valorEstoque(i)),
          situacaoEstoque(i),
        ]);
      const total = insumos.reduce((s, i) => s + valorEstoque(i), 0);
      return {
        colunas: [
          "Produto",
          "Categoria",
          "Quantidade",
          "Valor Unitário",
          "Valor em Estoque",
          "Situação",
        ],
        alinharDireita: [2, 3, 4],
        linhas,
        rodape: `${insumos.length} produto(s) · ${fmtMoeda(total)} em estoque`,
      };
    }

    if (relatorio === "talhao") {
      const mapa = new Map<string, { quantidade: number; custo: number; unidade: string }>();
      saidas.forEach((m) => {
        const talhao = m.codigo_talhao
          ? `${m.codigo_talhao} · ${m.nome_talhao ?? ""}`.trim()
          : "Sem talhão";
        const insumo = mapaInsumos.get(m.id_insumo);
        const chave = `${talhao}||${insumo?.nome ?? m.nome_insumo ?? m.id_insumo}`;
        const atual = mapa.get(chave) ?? {
          quantidade: 0,
          custo: 0,
          unidade: insumo?.unidade_medida ?? "",
        };
        mapa.set(chave, {
          quantidade: atual.quantidade + Number(m.quantidade || 0),
          custo: atual.custo + valorMovimentacao(m),
          unidade: atual.unidade,
        });
      });

      const linhas = Array.from(mapa.entries())
        .sort((a, b) => b[1].custo - a[1].custo)
        .map(([chave, v]) => {
          const [talhao, produto] = chave.split("||");
          return [talhao, produto, fmtQtd(v.quantidade, v.unidade), fmtMoeda(v.custo)];
        });
      const total = saidas.reduce((s, m) => s + valorMovimentacao(m), 0);
      return {
        colunas: ["Talhão", "Produto", "Quantidade Utilizada", "Custo"],
        alinharDireita: [2, 3],
        linhas,
        rodape: `${linhas.length} registro(s) · ${fmtMoeda(total)} consumidos`,
      };
    }

    if (relatorio === "safra") {
      const mapa = new Map<string, { quantidade: number; valor: number; unidade: string }>();
      saidas.forEach((m) => {
        const insumo = mapaInsumos.get(m.id_insumo);
        const chave = `${m.safra ?? "Sem safra"}||${
          insumo?.nome ?? m.nome_insumo ?? m.id_insumo
        }`;
        const atual = mapa.get(chave) ?? {
          quantidade: 0,
          valor: 0,
          unidade: insumo?.unidade_medida ?? "",
        };
        mapa.set(chave, {
          quantidade: atual.quantidade + Number(m.quantidade || 0),
          valor: atual.valor + valorMovimentacao(m),
          unidade: atual.unidade,
        });
      });

      const linhas = Array.from(mapa.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([chave, v]) => {
          const [safra, produto] = chave.split("||");
          return [safra, produto, fmtQtd(v.quantidade, v.unidade), fmtMoeda(v.valor)];
        });
      const total = saidas.reduce((s, m) => s + valorMovimentacao(m), 0);
      return {
        colunas: ["Safra", "Produto", "Quantidade", "Valor Consumido"],
        alinharDireita: [2, 3],
        linhas,
        rodape: `${linhas.length} registro(s) · ${fmtMoeda(total)} consumidos`,
      };
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const linhas = insumos.flatMap((i) =>
      (i.lotes ?? [])
        .filter((l) => l.quantidade > 0 && l.data_validade && l.data_validade < hoje)
        .map((l) => [
          i.nome,
          l.numero_lote,
          fmtData(l.data_validade),
          fmtQtd(l.quantidade, i.unidade_medida),
          fmtMoeda(l.quantidade * i.valor_unitario),
        ])
    );
    return {
      colunas: ["Produto", "Lote", "Data de Validade", "Quantidade", "Prejuízo Estimado"],
      alinharDireita: [3, 4],
      linhas,
      rodape: `${linhas.length} lote(s) vencido(s) com saldo em estoque`,
    };
  }, [relatorio, insumos, saidas, mapaInsumos]);

  const exportarCSV = () => {
    const csv = [tabela.colunas, ...tabela.linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${relatorio}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* -------------------------------------------------- Seleção do relatório */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {RELATORIOS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRelatorio(r.id)}
            className={`text-left rounded-xl border p-4 transition-all ${
              relatorio === r.id
                ? "bg-green-50 border-green-300 shadow-sm"
                : "bg-white border-gray-100 hover:border-green-200 hover:shadow-sm"
            }`}
          >
            <p
              className={`text-sm font-bold ${
                relatorio === r.id ? "text-green-700" : "text-gray-800"
              }`}
            >
              {r.titulo}
            </p>
            <p className="text-xs text-gray-400 mt-1">{r.descricao}</p>
          </button>
        ))}
      </div>

      {/* -------------------------------------------------------------- Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              {RELATORIOS.find((r) => r.id === relatorio)?.titulo}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{tabela.rodape}</p>
          </div>
          <Button variant="secondary" onClick={exportarCSV}>
            ⬇️ Exportar relatório
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                {tabela.colunas.map((c, idx) => (
                  <th
                    key={c}
                    className={`px-4 py-3 font-semibold ${
                      tabela.alinharDireita.includes(idx) ? "text-right" : ""
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tabela.linhas.map((linha, idx) => (
                <tr key={idx} className="hover:bg-green-50/40 transition-colors">
                  {linha.map((celula, col) => (
                    <td
                      key={col}
                      className={`px-4 py-3 ${
                        tabela.alinharDireita.includes(col)
                          ? "text-right tabular-nums text-gray-700"
                          : "text-gray-600"
                      } ${col === 0 ? "font-semibold text-gray-800" : ""}`}
                    >
                      {celula}
                    </td>
                  ))}
                </tr>
              ))}
              {!tabela.linhas.length && (
                <tr>
                  <td
                    colSpan={tabela.colunas.length}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    Nenhum dado disponível para este relatório.
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
