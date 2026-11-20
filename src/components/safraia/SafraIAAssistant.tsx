import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getInsumos,
  getMovimentacoes,
  getTalhoes,
  getAtividades,
  getPropriedadesLista,
  getLancamentos,
  getSafras,
  consultarSafraIA,
  getPerfilSafraIA,
} from "../../services/api";
import { useAuth } from "../auth/AuthProvider";
import { perfilDemoSafraIA } from "../../services/safraIAMock";
import { SafraIAContexto, SafraIAMensagem as Mensagem } from "../../types/safraIA";
import SafraIAMensagem from "./SafraIAMensagem";

let seq = 0;
const uid = () => `msg-${Date.now()}-${seq++}`;

export default function SafraIAAssistant() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const fimRef = useRef<HTMLDivElement>(null);

  const papel = usuario?.perfil ?? "colaborador";
  const perfilFallback = useMemo(() => perfilDemoSafraIA(papel), [papel]);
  const { data: perfilBackend } = useQuery({
    queryKey: ["safra-ia-perfil", papel],
    queryFn: () => getPerfilSafraIA(papel),
    enabled: Boolean(usuario),
  });
  const perfil = perfilBackend ?? perfilFallback;

  // --------------------------------------------------- dados da fazenda
  const { data: insumos = [] } = useQuery({ queryKey: ["insumos"], queryFn: getInsumos });
  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["insumos-movimentacoes"],
    queryFn: getMovimentacoes,
  });
  const { data: talhoes = [] } = useQuery({ queryKey: ["talhoes"], queryFn: getTalhoes });
  const { data: atividades = [] } = useQuery({ queryKey: ["atividades"], queryFn: getAtividades });
  const { data: propriedades = [] } = useQuery({
    queryKey: ["propriedades"],
    queryFn: getPropriedadesLista,
  });
  const { data: lancamentos = [] } = useQuery({
    queryKey: ["financeiro-lancamentos"],
    queryFn: () => getLancamentos(),
  });
  const { data: safras = [] } = useQuery({
    queryKey: ["financeiro-safras"],
    queryFn: () => getSafras(),
  });

  const contexto: SafraIAContexto = useMemo(
    () => ({ insumos, movimentacoes, talhoes, atividades, lancamentos, safras, propriedades }),
    [insumos, movimentacoes, talhoes, atividades, lancamentos, safras, propriedades]
  );

  // Atualiza a saudação se o perfil do backend chegar depois da abertura do chat.
  useEffect(() => {
    if (!aberto) return;
    setMensagens((atuais) => {
      const resposta = {
        intent: "saudacao",
        texto: perfil.saudacao,
        sugestoes: perfil.sugestoes,
        papel: perfil.papel,
      };
      if (!atuais.length) {
        return [{ id: uid(), remetente: "assistente", texto: resposta.texto, resposta, hora: new Date().toISOString() }];
      }
      if (atuais[0].resposta?.intent === "saudacao") {
        return atuais.map((mensagem, indice) => indice === 0
          ? { ...mensagem, texto: resposta.texto, resposta }
          : mensagem);
      }
      return atuais;
    });
  }, [aberto, perfil]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto]);

  const sugestoesAtuais = useMemo(() => {
    const ultimaAssistente = [...mensagens].reverse().find((m) => m.remetente === "assistente" && !m.carregando);
    return ultimaAssistente?.resposta?.sugestoes ?? perfil.sugestoes;
  }, [mensagens, perfil.sugestoes]);

  // --------------------------------------------------- envio de mensagem
  async function enviar(pergunta: string) {
    const texto = pergunta.trim();
    if (!texto || enviando) return;

    const idCarregando = uid();
    setMensagens((atuais) => [
      ...atuais,
      { id: uid(), remetente: "usuario", texto, hora: new Date().toISOString() },
      { id: idCarregando, remetente: "assistente", texto: "", hora: new Date().toISOString(), carregando: true },
    ]);
    setInput("");
    setEnviando(true);

    try {
      const resposta = await consultarSafraIA({ pergunta: texto, papel, contexto });
      setMensagens((atuais) =>
        atuais.map((m) =>
          m.id === idCarregando
            ? { ...m, texto: resposta.texto, resposta, carregando: false }
            : m
        )
      );
    } catch (erro) {
      const detalhe = erro instanceof Error && erro.message ? erro.message : "Tente novamente.";
      setMensagens((atuais) =>
        atuais.map((m) =>
          m.id === idCarregando
            ? { ...m, texto: `Não consegui processar sua pergunta agora. ${detalhe}`, carregando: false }
            : m
        )
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!usuario) return null;

  return (
    <>
      {/* Botão flutuante — presente em todas as telas */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          aria-label="Abrir Assistente SafraIA"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white pl-4 pr-5 py-3 shadow-lg shadow-green-600/30 transition-all hover:scale-105 print:hidden"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm font-semibold hidden sm:inline">Assistente SafraIA</span>
        </button>
      )}

      {/* Drawer de chat */}
      {aberto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent"
            onClick={() => setAberto(false)}
          />
          <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-gray-50 shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out] print:hidden">
            {/* Cabeçalho */}
            <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-lg">
                  💬
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">Assistente SafraIA</p>
                  <p className="text-[11px] text-green-100 leading-tight">
                    {perfil.nome_papel} · {perfil.foco}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {mensagens.map((m) => (
                <SafraIAMensagem key={m.id} mensagem={m} />
              ))}
              <div ref={fimRef} />
            </div>

            {/* Sugestões rápidas */}
            {sugestoesAtuais.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {sugestoesAtuais.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    disabled={enviando}
                    className="text-[11px] rounded-full border border-green-200 bg-green-50 text-green-700 px-2.5 py-1 hover:bg-green-100 transition disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Entrada de texto */}
            <div className="border-t border-gray-200 bg-white p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar(input);
                    }
                  }}
                  rows={1}
                  placeholder="Pergunte sobre estoque, talhões, custos..."
                  className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent max-h-28"
                />
                <button
                  type="submit"
                  disabled={enviando || !input.trim()}
                  aria-label="Enviar"
                  className="shrink-0 w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition disabled:opacity-50"
                >
                  {enviando ? "…" : "➤"}
                </button>
              </form>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                SafraIA pode cometer erros. Confira informações críticas.
              </p>
            </div>
          </div>

          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
    </>
  );
}
