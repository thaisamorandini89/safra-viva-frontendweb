import {
  AtividadeAgricola,
  CATEGORIA_META,
  categoriaDoTipo,
  custoTotal,
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
  const cat = categoriaDoTipo(a.tipo_atividade);
  const custoInsumos = (a.insumos ?? []).reduce((s, i) => s + Number(i.custo || 0), 0);
  const custoMaquinas = (a.maquinas ?? []).reduce((s, m) => s + Number(m.custo || 0), 0);

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
              {cat}
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

      {a.observacoes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h4 className="text-sm font-bold text-gray-800 mb-2">Observações</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{a.observacoes}</p>
        </div>
      )}
    </div>
  );
}
