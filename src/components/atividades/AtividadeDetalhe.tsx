import { useQuery } from "@tanstack/react-query";
import { getMovimentacoesDaAtividade } from "../../services/api";
import { fmtQtd, lotesDaMovimentacao } from "../../types/insumo";
import {
  AtividadeAgricola,
  CATEGORIA_META,
  categoriaVisual,
  custoTotal,
  descricaoPendentes,
  duracaoDias,
  isAtrasada,
  fmtMoeda,
  fmtData,
} from "../../types/atividade";
import Button from "../ui/Button";
import AtividadeStatusBadge from "./AtividadeStatusBadge";

interface Props {
  atividade: AtividadeAgricola;
  onVoltar: () => void;
}

export default function AtividadeDetalhe({ atividade: a, onVoltar }: Props) {
  const cat = categoriaVisual(a);
  const custoInsumos = (a.insumos ?? []).reduce((s, i) => s + Number(i.custo || 0), 0);
  const custoMaquinas = (a.maquinas ?? []).reduce((s, m) => s + Number(m.custo || 0), 0);
  const pendentes = descricaoPendentes(a);

  const { data: saidas = [] } = useQuery({
    queryKey: ["movimentacoes-atividade", a.id],
    queryFn: () => getMovimentacoesDaAtividade(a.id),
  });

  const Info = ({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) => (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{rotulo}</p>
      <p className="text-sm font-semibold text-gray-700 mt-0.5">{valor}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onVoltar}>
          ← Voltar para a lista
        </Button>
        <AtividadeStatusBadge status={a.status} atrasada={isAtrasada(a)} />
      </div>

      {/* --------------------------------------------------------- Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl shrink-0">
            {CATEGORIA_META[cat].icone}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{a.tipo_atividade}</h3>
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CATEGORIA_META[cat].chip}`}
            >
              {a.categoria ?? cat}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-6 pt-5 border-t border-gray-100">
          <Info rotulo="Propriedade" valor={a.nome_propriedade ?? `#${a.id_propriedade}`} />
          <Info
            rotulo="Talhão"
            valor={`${a.codigo_talhao ?? a.id_talhao} · ${a.nome_talhao ?? ""}`}
          />
          <Info rotulo="Safra" valor={a.safra ?? "—"} />
          <Info rotulo="Responsável" valor={a.responsavel ?? "—"} />
          <Info rotulo="Data de Início" valor={fmtData(a.data_inicio)} />
          <Info rotulo="Data de Término" valor={fmtData(a.data_fim)} />
          <Info rotulo="Duração" valor={`${duracaoDias(a)} dia(s)`} />
          <Info
            rotulo="Custo da Operação"
            valor={<span className="text-green-700">{fmtMoeda(custoTotal(a))}</span>}
          />
        </div>
      </div>

      {/* ---------------------------------------------------- Insumos/máquinas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-baseline justify-between">
            <h4 className="text-sm font-bold text-gray-800">📦 Insumos Utilizados</h4>
            <span className="text-xs text-gray-500">{fmtMoeda(custoInsumos)}</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {(a.insumos ?? []).map((i, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3 text-gray-700">{i.nome}</td>
                  <td className="px-5 py-3 text-gray-500 text-right tabular-nums whitespace-nowrap">
                    {i.quantidade.toLocaleString("pt-BR")} {i.unidade}
                  </td>
                  <td className="px-2 py-3 text-right whitespace-nowrap">
                    {a.status === "Concluída" && i.quantidade > 0 && (
                      <span
                        className={`inline-flex rounded-full border text-[10px] font-semibold px-1.5 py-0.5 ${
                          i.baixado
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {i.baixado ? "✅ Baixado do estoque" : "⏳ Sem baixa"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-right tabular-nums font-semibold">
                    {fmtMoeda(i.custo ?? 0)}
                  </td>
                </tr>
              ))}
              {!(a.insumos ?? []).length && (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-400">
                    Nenhum insumo registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-baseline justify-between">
            <h4 className="text-sm font-bold text-gray-800">🚜 Máquinas Utilizadas</h4>
            <span className="text-xs text-gray-500">{fmtMoeda(custoMaquinas)}</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {(a.maquinas ?? []).map((m, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3 text-gray-700">{m.nome}</td>
                  <td className="px-5 py-3 text-gray-500 text-right tabular-nums whitespace-nowrap">
                    {m.horas ? `${m.horas} h` : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-right tabular-nums font-semibold">
                    {fmtMoeda(m.custo ?? 0)}
                  </td>
                </tr>
              ))}
              {!(a.maquinas ?? []).length && (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-400">
                    Nenhuma máquina registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendentes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⏳ Insumos sem baixa por saldo insuficiente: {pendentes}. Registre a entrada no
          estoque e salve a atividade de novo para gerar a saída.
        </div>
      )}

      {/* ------------------------------------------------- Saídas de estoque */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-800">🔄 Saídas de Estoque da Operação</h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Baixas geradas pela conclusão e saídas lançadas à mão vinculadas a esta atividade
          </p>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {saidas.map((m) => {
              const lotes = lotesDaMovimentacao(m, m.unidade_medida);
              return (
                <tr key={m.id}>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {fmtData(m.data_movimentacao)}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {m.nome_insumo ?? "—"}
                    {lotes && <div className="text-xs text-gray-400">Lote {lotes}</div>}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-orange-600 whitespace-nowrap">
                    −{fmtQtd(m.quantidade, m.unidade_medida)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full border text-[10px] font-semibold px-1.5 py-0.5 ${
                        m.origem === "Atividade"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {m.origem === "Atividade" ? "⚙️ Automática" : "✍️ Manual"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!saidas.length && (
              <tr>
                <td className="px-5 py-8 text-center text-sm text-gray-400">
                  Nenhuma saída de estoque vinculada a esta operação.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {a.observacoes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-sm font-bold text-gray-800 mb-2">Observações</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{a.observacoes}</p>
        </div>
      )}
    </div>
  );
}
