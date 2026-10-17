import { useState } from "react";
import ConfirmDialog from "../../ui/ConfirmDialog";
import Field from "../../ui/Field";
import Input from "../../ui/Input";
import { Secao } from "../ui";
import { useConfig, Perfil, MODULOS_PERMISSAO, uid } from "../store";

export default function PerfisPermissoes() {
  const { estado, atualizar, notificar, registrarLog } = useConfig();
  const [selecionadoId, setSelecionadoId] = useState(estado.perfis[0]?.id ?? "");
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [descNovo, setDescNovo] = useState("");
  const [excluindo, setExcluindo] = useState<Perfil | null>(null);

  const selecionado = estado.perfis.find((p) => p.id === selecionadoId) ?? estado.perfis[0];
  const somenteLeitura = selecionado?.id === "administrador";

  const setPerfis = (lista: Perfil[]) => atualizar("perfis", lista);

  const temPermissao = (modulo: string, acao: string) =>
    selecionado?.permissoes[modulo]?.includes(acao) ?? false;

  const alternar = (modulo: string, acao: string) => {
    if (!selecionado || somenteLeitura) return;
    const atuais = selecionado.permissoes[modulo] ?? [];
    const novas = atuais.includes(acao)
      ? atuais.filter((a) => a !== acao)
      : [...atuais, acao];
    const atualizado: Perfil = {
      ...selecionado,
      permissoes: { ...selecionado.permissoes, [modulo]: novas },
    };
    setPerfis(estado.perfis.map((p) => (p.id === selecionado.id ? atualizado : p)));
  };

  const salvarPermissoes = () => {
    registrarLog(`Alteração de permissões do perfil ${selecionado?.nome}`, "Configurações › Perfis e Permissões");
    notificar({ tipo: "sucesso", titulo: "Permissões salvas", descricao: selecionado?.nome });
  };

  const criarPerfil = () => {
    if (!nomeNovo.trim()) return;
    const base: Record<string, string[]> = {};
    MODULOS_PERMISSAO.forEach((m) => (base[m.modulo] = []));
    const novo: Perfil = {
      id: uid(),
      nome: nomeNovo.trim(),
      descricao: descNovo.trim() || "Perfil personalizado.",
      padrao: false,
      permissoes: base,
    };
    setPerfis([...estado.perfis, novo]);
    registrarLog(`Criação do perfil ${novo.nome}`, "Configurações › Perfis e Permissões");
    notificar({ tipo: "sucesso", titulo: "Perfil criado", descricao: novo.nome });
    setSelecionadoId(novo.id);
    setCriando(false);
    setNomeNovo("");
    setDescNovo("");
  };

  const confirmarExclusao = () => {
    if (!excluindo) return;
    const restantes = estado.perfis.filter((p) => p.id !== excluindo.id);
    setPerfis(restantes);
    registrarLog(`Exclusão do perfil ${excluindo.nome}`, "Configurações › Perfis e Permissões");
    notificar({ tipo: "sucesso", titulo: "Perfil removido", descricao: excluindo.nome });
    if (selecionadoId === excluindo.id) setSelecionadoId(restantes[0]?.id ?? "");
    setExcluindo(null);
  };

  return (
    <Secao
      titulo="Perfis e Permissões"
      descricao="Defina o que cada perfil de acesso pode fazer em cada módulo."
      icone="🛡️"
      acoes={
        <button
          onClick={() => setCriando(true)}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          + Novo perfil
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Lista de perfis */}
        <div className="space-y-1.5">
          {estado.perfis.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelecionadoId(p.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                p.id === selecionadoId
                  ? "border-green-300 bg-green-50"
                  : "border-gray-100 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{p.nome}</span>
                {p.padrao && <span className="text-[10px] font-semibold uppercase text-gray-400">padrão</span>}
              </span>
              <span className="mt-0.5 block text-xs text-gray-400">{p.descricao}</span>
            </button>
          ))}
        </div>

        {/* Matriz de permissões */}
        <div>
          {selecionado && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{selecionado.nome}</h4>
                  <p className="text-xs text-gray-400">{selecionado.descricao}</p>
                </div>
                {!selecionado.padrao && (
                  <button onClick={() => setExcluindo(selecionado)} className="text-xs font-semibold text-red-600 hover:text-red-700">
                    Excluir perfil
                  </button>
                )}
              </div>

              {somenteLeitura && (
                <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                  O perfil Administrador possui acesso total e não pode ser alterado.
                </p>
              )}

              <div className="space-y-3">
                {MODULOS_PERMISSAO.map((m) => (
                  <div key={m.modulo} className="rounded-lg border border-gray-100 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{m.modulo}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.acoes.map((acao) => {
                        const ativo = temPermissao(m.modulo, acao);
                        return (
                          <button
                            key={acao}
                            onClick={() => alternar(m.modulo, acao)}
                            disabled={somenteLeitura}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                              ativo
                                ? "border-green-300 bg-green-600 text-white"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {ativo ? "✓ " : ""}{acao}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!somenteLeitura && (
                <div className="mt-4 flex justify-end">
                  <button onClick={salvarPermissoes} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
                    Salvar permissões
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal novo perfil */}
      {criando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCriando(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-gray-800">Novo perfil</h3>
            <div className="space-y-4">
              <Field label="Nome do perfil" required>
                <Input value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} placeholder="Ex.: Consultor Técnico" />
              </Field>
              <Field label="Descrição">
                <Input value={descNovo} onChange={(e) => setDescNovo(e.target.value)} placeholder="Breve descrição do acesso" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCriando(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={criarPerfil} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
                Criar perfil
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        aberto={excluindo != null}
        tipo="perigo"
        titulo="Excluir perfil"
        mensagem={<>Deseja remover o perfil <strong className="text-gray-700">{excluindo?.nome}</strong>?</>}
        textoConfirmar="Excluir"
        onConfirmar={confirmarExclusao}
        onCancelar={() => setExcluindo(null)}
      />
    </Secao>
  );
}
