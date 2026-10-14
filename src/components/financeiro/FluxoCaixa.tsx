import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFluxoCaixa } from "../../services/api";
import { FluxoCaixaItem, fmtMoeda, fmtData } from "../../types/financeiro";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function FluxoCaixa() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [periodo, setPeriodo] = useState<{ ini?: string; fim?: string }>({});

  const {
    data: itens = [],
    isLoading,
    isError,
  } = useQuery<FluxoCaixaItem[]>({
    queryKey: ["financeiro-fluxo-caixa", periodo],
    queryFn: () => getFluxoCaixa(periodo.ini, periodo.fim),
  });

  const aplicar = () =>
    setPeriodo({ ini: dataInicio || undefined, fim: dataFim || undefined });
  const limpar = () => {
    setDataInicio("");
    setDataFim("");
    setPeriodo({});
  };

  const totalEntrada = itens.reduce((s, i) => s + i.entrada, 0);
  const totalSaida = itens.reduce((s, i) => s + i.saida, 0);
  const saldoFinal = itens.length ? itens[itens.length - 1].saldo : 0;

  return (
    <div className="space-y-4">
      {/* Filtro por período */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="De">
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </Field>
          <Field label="Até">
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </Field>
          <Button onClick={aplicar}>Aplicar</Button>
          <Button variant="ghost" onClick={limpar}>
            Limpar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
            Total de Entradas
          </p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {fmtMoeda(totalEntrada)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
            Total de Saídas
          </p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmtMoeda(totalSaida)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
            Saldo do Período
          </p>
          <p
            className={`text-xl font-bold mt-1 ${
              saldoFinal >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {fmtMoeda(saldoFinal)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Carregando fluxo de caixa...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-700">
            Não foi possível carregar o fluxo de caixa.
          </div>
        ) : itens.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhum movimento no período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Entrada</th>
                  <th className="px-4 py-3 text-right">Saída</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {fmtData(i.data)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{i.descricao}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">
                      {i.entrada ? fmtMoeda(i.entrada) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600">
                      {i.saida ? fmtMoeda(i.saida) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        i.saldo >= 0 ? "text-gray-800" : "text-red-600"
                      }`}
                    >
                      {fmtMoeda(i.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
