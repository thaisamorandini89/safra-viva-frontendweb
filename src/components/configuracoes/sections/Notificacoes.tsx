import { Secao, Toggle } from "../ui";
import { useConfig, GRUPOS_NOTIFICACAO, chaveNotificacao } from "../store";

export default function Notificacoes() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();

  const alternar = (grupo: string, item: string, valor: boolean) => {
    const chave = chaveNotificacao(grupo, item);
    atualizar("notificacoes", { ...estado.notificacoes, [chave]: valor });
  };

  const alternarGrupo = (grupo: string, itens: string[], ligar: boolean) => {
    const copia = { ...estado.notificacoes };
    itens.forEach((item) => (copia[chaveNotificacao(grupo, item)] = ligar));
    atualizar("notificacoes", copia);
    registrarLog(`${ligar ? "Ativação" : "Desativação"} das notificações: ${grupo}`, "Configurações › Notificações");
    notificar({ tipo: "sucesso", titulo: "Notificações atualizadas", descricao: grupo });
  };

  return (
    <Secao titulo="Notificações" descricao="Escolha quais alertas o sistema deve emitir." icone="🔔">
      <div className="grid gap-4 md:grid-cols-2">
        {GRUPOS_NOTIFICACAO.map((g) => {
          const todosLigados = g.itens.every((i) => estado.notificacoes[chaveNotificacao(g.grupo, i)]);
          return (
            <div key={g.grupo} className="rounded-lg border border-gray-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <span>{g.icone}</span> {g.grupo}
                </p>
                <button
                  onClick={() => alternarGrupo(g.grupo, g.itens, !todosLigados)}
                  className="text-xs font-semibold text-green-700 hover:text-green-900"
                >
                  {todosLigados ? "Desativar todos" : "Ativar todos"}
                </button>
              </div>
              <div className="space-y-3">
                {g.itens.map((item) => (
                  <Toggle
                    key={item}
                    rotulo={item}
                    ativo={!!estado.notificacoes[chaveNotificacao(g.grupo, item)]}
                    onChange={(v) => alternar(g.grupo, item, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Secao>
  );
}
