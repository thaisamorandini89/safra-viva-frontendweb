import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAtividades,
  getTalhoes,
  getInsumos,
  getLancamentos,
  getSafras,
} from "../../services/api";
import { AtividadeAgricola, isAtrasada } from "../../types/atividade";
import { Talhao } from "../../types/talhao";
import {
  Insumo,
  abaixoMinimo,
  diasParaVencer,
  isProximoVencimento,
  isVencido,
  proximaValidade,
  situacaoEstoque,
} from "../../types/insumo";
import { Lancamento, Safra, fmtMoedaCurta } from "../../types/financeiro";
import { carregarEstado, chaveNotificacao } from "../configuracoes/store";

export interface Notificacao {
  id: string;
  grupo: string;
  item: string;
  titulo: string;
  descricao: string;
  severidade: "alta" | "media";
  icone: string;
}

const hojeISO = () => new Date().toISOString().slice(0, 10);

const diasAte = (iso?: string | null): number | null => {
  if (!iso) return null;
  const ms = new Date(`${iso}T00:00:00`).getTime() - new Date(`${hojeISO()}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
};

/**
 * Calcula as notificações do sistema a partir dos dados operacionais,
 * respeitando os alertas habilitados em Configurações › Notificações.
 */
export function useNotificacoes(): { itens: Notificacao[]; total: number } {
  const atividades = useQuery<AtividadeAgricola[]>({ queryKey: ["atividades"], queryFn: getAtividades }).data ?? [];
  const talhoes = useQuery<Talhao[]>({ queryKey: ["talhoes"], queryFn: getTalhoes }).data ?? [];
  const insumos = useQuery<Insumo[]>({ queryKey: ["insumos"], queryFn: getInsumos }).data ?? [];
  const lancamentos = useQuery<Lancamento[]>({ queryKey: ["financeiro-lancamentos"], queryFn: () => getLancamentos() }).data ?? [];
  const safras = useQuery<Safra[]>({ queryKey: ["financeiro-safras"], queryFn: () => getSafras() }).data ?? [];

  const itens = useMemo<Notificacao[]>(() => {
    const config = carregarEstado().notificacoes;
    const habilitado = (grupo: string, item: string) => config[chaveNotificacao(grupo, item)] !== false;
    const lista: Notificacao[] = [];
    let seq = 0;
    const add = (n: Omit<Notificacao, "id">) => lista.push({ ...n, id: `n${seq++}` });

    // ----------------------------------------------------------- Operacionais
    if (habilitado("Operacionais", "Atividade atrasada")) {
      atividades.filter(isAtrasada).forEach((a) =>
        add({
          grupo: "Operacionais",
          item: "Atividade atrasada",
          titulo: "Atividade atrasada",
          descricao: `${a.tipo_atividade} · ${a.nome_talhao || a.codigo_talhao || "talhão"}`,
          severidade: "alta",
          icone: "🚜",
        })
      );
    }
    if (habilitado("Operacionais", "Safra próxima do encerramento")) {
      safras.forEach((s) => {
        const dias = diasAte(s.data_fim);
        if (dias != null && dias >= 0 && dias <= 30) {
          add({
            grupo: "Operacionais",
            item: "Safra próxima do encerramento",
            titulo: "Safra próxima do encerramento",
            descricao: `${s.nome} encerra em ${dias} dia(s)`,
            severidade: "media",
            icone: "📅",
          });
        }
      });
    }
    if (habilitado("Operacionais", "Talhão sem planejamento")) {
      talhoes.filter((t) => t.status === "Livre").forEach((t) =>
        add({
          grupo: "Operacionais",
          item: "Talhão sem planejamento",
          titulo: "Talhão sem planejamento",
          descricao: t.nome,
          severidade: "media",
          icone: "🗂️",
        })
      );
    }

    // --------------------------------------------------------------- Estoque
    if (habilitado("Estoque", "Estoque baixo")) {
      insumos.filter(abaixoMinimo).forEach((i) =>
        add({
          grupo: "Estoque",
          item: "Estoque baixo",
          titulo: situacaoEstoque(i) === "Zerado" ? "Estoque zerado" : "Estoque baixo",
          descricao: `${i.nome} (${i.estoque_atual} ${i.unidade_medida}, mín. ${i.estoque_minimo})`,
          severidade: situacaoEstoque(i) === "Zerado" ? "alta" : "media",
          icone: "📦",
        })
      );
    }
    if (habilitado("Estoque", "Produto vencido")) {
      insumos.filter(isVencido).forEach((i) =>
        add({
          grupo: "Estoque",
          item: "Produto vencido",
          titulo: "Produto vencido",
          descricao: i.nome,
          severidade: "alta",
          icone: "⛔",
        })
      );
    }
    if (habilitado("Estoque", "Produto próximo ao vencimento")) {
      insumos.filter((i) => isProximoVencimento(i)).forEach((i) => {
        const dias = diasParaVencer(proximaValidade(i));
        add({
          grupo: "Estoque",
          item: "Produto próximo ao vencimento",
          titulo: "Produto próximo ao vencimento",
          descricao: `${i.nome} vence em ${dias} dia(s)`,
          severidade: "media",
          icone: "⏳",
        });
      });
    }

    // ------------------------------------------------------------ Financeiros
    const hoje = hojeISO();
    const pendentes = lancamentos.filter((l) => l.status === "PENDENTE");
    if (habilitado("Financeiros", "Contas vencidas")) {
      pendentes.filter((l) => l.data_lancamento < hoje).forEach((l) =>
        add({
          grupo: "Financeiros",
          item: "Contas vencidas",
          titulo: "Conta vencida",
          descricao: `${l.categoria} · ${fmtMoedaCurta(Number(l.valor || 0))}`,
          severidade: "alta",
          icone: "💰",
        })
      );
    }
    if (habilitado("Financeiros", "Contas a vencer")) {
      pendentes.filter((l) => l.data_lancamento >= hoje).forEach((l) =>
        add({
          grupo: "Financeiros",
          item: "Contas a vencer",
          titulo: "Conta a vencer",
          descricao: `${l.categoria} · ${fmtMoedaCurta(Number(l.valor || 0))}`,
          severidade: "media",
          icone: "💰",
        })
      );
    }

    // ordena: alta severidade primeiro
    return lista.sort((a, b) => (a.severidade === b.severidade ? 0 : a.severidade === "alta" ? -1 : 1));
  }, [atividades, talhoes, insumos, lancamentos, safras]);

  return { itens, total: itens.length };
}
