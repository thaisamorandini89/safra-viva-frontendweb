import { Secao, Toggle } from "../ui";
import { useConfig } from "../store";

export default function Integracoes() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();

  const categorias = [...new Set(estado.integracoes.map((i) => i.categoria))];

  const alternar = (id: string, ativa: boolean) => {
    const atualizadas = estado.integracoes.map((i) => (i.id === id ? { ...i, ativa } : i));
    atualizar("integracoes", atualizadas);
    const alvo = estado.integracoes.find((i) => i.id === id);
    registrarLog(`${ativa ? "Ativação" : "Desativação"} da integração ${alvo?.nome}`, "Configurações › Integrações");
    notificar({ tipo: "sucesso", titulo: ativa ? "Integração ativada" : "Integração desativada", descricao: alvo?.nome });
  };

  return (
    <Secao titulo="Integrações" descricao="Conecte o SafraViva a serviços externos (disponibilidade futura)." icone="🔌">
      <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ℹ️ As integrações estão em preparação. A ativação registra a intenção de uso e será concluída quando o conector estiver disponível.
      </div>

      <div className="space-y-5">
        {categorias.map((cat) => (
          <div key={cat}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{cat}</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {estado.integracoes
                .filter((i) => i.categoria === cat)
                .map((i) => (
                  <div key={i.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xl">{i.icone}</span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          {i.nome}
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${i.ativa ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {i.ativa ? "Ativa" : "Inativa"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">{i.descricao}</p>
                      </div>
                    </div>
                    <Toggle ativo={i.ativa} onChange={(v) => alternar(i.id, v)} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Secao>
  );
}
