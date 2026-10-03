import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLancamentos, getSafras } from "../../services/api";
import {
  Lancamento,
  Safra,
  FiltrosLancamento,
  TIPO_LANCAMENTO_META,
  STATUS_LANCAMENTO_META,
  fmtMoeda,
  fmtData,
} from "../../types/financeiro";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface Props {
  onNovo: () => void;
  onEditar: (l: Lancamento) => void;
  onExcluir: (l: Lancamento) => void;
}

export default function LancamentosLista({ onNovo, onEditar, onExcluir }: Props) {
  const [filtros, setFiltros] = useState<FiltrosLancamento>({});

  const { data: safras = [] } = useQuery<Safra[]>({
    queryKey: ["financeiro-safras"],
    queryFn: () => getSafras(),
  });
  const { data: todos = [] } = useQuery<Lancamento[]>({
    queryKey: ["financeiro-lancamentos"],
    queryFn: () => getLancamentos(),
  });
  const {
    data: lista = [],
    isLoading,
    isError,
  } = useQuery<Lancamento[]>({
    queryKey: ["financeiro-lancamentos", filtros],
    queryFn: () => getLancamentos(filtros),
  });

  const propriedades = useMemo(() => {
    const mapa = new Map<number, string>();
    todos.forEach((l) => {
      if (l.id_propriedade)
        mapa.set(l.id_propriedade, l.nome_propriedade ?? `Propriedade ${l.id_propriedade}`);
    });
    return Array.from(mapa, ([id, nome]) => ({ id, nome }));
  }, [todos]);

  const talhoes = useMemo(() => {
    const mapa = new Map<number, string>();
    todos.forEach((l) => {
      if (l.id_talhao) mapa.set(l.id_talhao, l.nome_talhao ?? `Talhão ${l.id_talhao}`);
      l.rateio?.forEach((r) =>
        mapa.set(r.id_talhao, r.nome_talhao ?? `Talhão ${r.id_talhao}`)
      );
    });
    return Array.from(mapa, ([id, nome]) => ({ id, nome }));
  }, [todos]);

  const atualizar = (patch: Partial<FiltrosLancamento>) =>
    setFiltros((f) => ({ ...f, ...patch }));

  const limpar = () => setFiltros({});

  const totalFiltrado = lista.reduce(
    (acc, l) => {
      if (l.tipo === "RECEITA") acc.receita += l.valor;
      else acc.despesa += l.valor;
      return acc;
    },
    { receita: 0, despesa: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <Field label="De">
            <Input
              type="date"
              value={filtros.data_inicio ?? ""}
              onChange={(e) => atualizar({ data_inicio: e.target.value })}
            />
          </Field>
          <Field label="Até">
            <Input
              type="date"
              value={filtros.data_fim ?? ""}
              onChange={(e) => atualizar({ data_fim: e.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Select
              value={filtros.tipo ?? ""}
              placeholder="Todos"
              onChange={(e) =>
                atualizar({ tipo: (e.target.value as FiltrosLancamento["tipo"]) || "" })
              }
            >
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa</option>
            </Select>
          </Field>
          <Field label="Safra">
            <Select
              value={filtros.id_safra ?? ""}
              placeholder="Todas"
              onChange={(e) =>
                atualizar({ id_safra: e.target.value ? Number(e.target.value) : "" })
              }
            >
              {safras.map((s) => (
                <option key={s.id_safra} value={s.id_safra}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Propriedade">
            <Select
              value={filtros.id_propriedade ?? ""}
              placeholder="Todas"
              onChange={(e) =>
                atualizar({
                  id_propriedade: e.target.value ? Number(e.target.value) : "",
                })
              }
            >
              {propriedades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Talhão">
            <Select
              value={filtros.id_talhao ?? ""}
              placeholder="Todos"
              onChange={(e) =>
                atualizar({ id_talhao: e.target.value ? Number(e.target.value) : "" })
              }
            >
              {talhoes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            {lista.length} lançamento(s) ·{" "}
            <span className="text-green-700 font-semibold">
              +{fmtMoeda(totalFiltrado.receita)}
            </span>{" "}
            ·{" "}
            <span className="text-red-600 font-semibold">
              -{fmtMoeda(totalFiltrado.despesa)}
            </span>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={limpar}>
              Limpar filtros
            </Button>
            <Button onClick={onNovo}>➕ Novo Lançamento</Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="w-7 h-7 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Carregando lançamentos...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-red-700">
            Não foi possível carregar os lançamentos.
          </div>
        ) : lista.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Vínculo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((l) => {
                  const tipo = TIPO_LANCAMENTO_META[l.tipo];
                  const status = STATUS_LANCAMENTO_META[l.status];
                  return (
                    <tr
                      key={l.id_lancamento}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {fmtData(l.data_lancamento)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border font-semibold text-xs px-2 py-1 ${tipo.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tipo.dot}`} />
                          {tipo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">{l.categoria}</div>
                        {l.descricao && l.descricao !== l.categoria && (
                          <div className="text-xs text-gray-400">{l.descricao}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {l.nome_safra && <div>🌾 {l.nome_safra}</div>}
                        {l.nome_talhao && <div>🗂️ {l.nome_talhao}</div>}
                        {l.rateio && l.rateio.length > 0 && (
                          <div>🧮 Rateio ({l.rateio.length} talhões)</div>
                        )}
                        {!l.nome_safra && !l.nome_talhao && !l.rateio?.length && (
                          <span>{l.nome_propriedade ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border font-semibold text-xs px-2 py-1 ${status.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        {l.conciliado && (
                          <span className="ml-1 text-xs text-sky-600" title="Conciliado">
                            🔒
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                          l.tipo === "RECEITA" ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {l.tipo === "RECEITA" ? "+" : "-"}
                        {fmtMoeda(l.valor)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onEditar(l)}
                          className="text-gray-400 hover:text-green-700 transition px-1.5"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onExcluir(l)}
                          className="text-gray-400 hover:text-red-600 transition px-1.5"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
