import { SafraIAMensagem as Mensagem, SafraIATom } from "../../types/safraIA";

const TOM_CLASSE: Record<SafraIATom, string> = {
  neutro: "bg-slate-50 text-slate-700 border-slate-200",
  positivo: "bg-green-50 text-green-700 border-green-200",
  atencao: "bg-amber-50 text-amber-700 border-amber-200",
  critico: "bg-red-50 text-red-700 border-red-200",
};

const ALERTA_CLASSE = {
  info: "bg-sky-50 text-sky-800 border-sky-200",
  alerta: "bg-amber-50 text-amber-800 border-amber-200",
  critico: "bg-red-50 text-red-800 border-red-200",
};

const ALERTA_ICONE = { info: "ℹ️", alerta: "⚠️", critico: "⛔" };

interface Props {
  mensagem: Mensagem;
}

export default function SafraIAMensagem({ mensagem }: Props) {
  const ehUsuario = mensagem.remetente === "usuario";
  const r = mensagem.resposta;

  if (ehUsuario) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-green-600 text-white px-3.5 py-2 text-sm shadow-sm">
          {mensagem.texto}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-sm">
        🌱
      </div>
      <div className="max-w-[88%] space-y-2">
        <div className="rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-3.5 py-2 text-sm text-gray-700 shadow-sm">
          {mensagem.carregando ? (
            <span className="inline-flex items-center gap-1 text-gray-400">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </span>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{mensagem.texto}</p>
          )}
        </div>

        {/* Destaques / insights */}
        {r?.destaques && r.destaques.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {r.destaques.map((d, i) => (
              <div
                key={i}
                className={`rounded-lg border px-2.5 py-1.5 ${TOM_CLASSE[d.tom ?? "neutro"]}`}
              >
                <p className="text-[10px] uppercase tracking-wide opacity-70">{d.rotulo}</p>
                <p className="text-sm font-bold leading-tight">{d.valor}</p>
                {d.detalhe && <p className="text-[10px] opacity-70">{d.detalhe}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Alertas */}
        {r?.alertas && r.alertas.length > 0 && (
          <div className="space-y-1.5">
            {r.alertas.map((a, i) => (
              <div
                key={i}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${ALERTA_CLASSE[a.nivel]}`}
              >
                <p className="font-semibold">
                  {ALERTA_ICONE[a.nivel]} {a.titulo}
                </p>
                {a.descricao && <p className="opacity-80 mt-0.5">{a.descricao}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Tabela de dados consolidados */}
        {r?.tabela && r.tabela.linhas.length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
            {r.tabela.titulo && (
              <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
                {r.tabela.titulo}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    {r.tabela.colunas.map((c, i) => (
                      <th key={i} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {r.tabela.linhas.map((linha, i) => (
                    <tr key={i} className="text-gray-600">
                      {linha.map((cel, j) => (
                        <td key={j} className="px-2.5 py-1.5 whitespace-nowrap tabular-nums">
                          {cel}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
