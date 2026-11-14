// ---------------------------------------------------------------------------
// Módulo SafraIA — motor de interpretação de consultas (mock do backend LLM)
// ---------------------------------------------------------------------------
// Simula um agente de IA: classifica a intenção da pergunta em linguagem
// natural (por correspondência de palavras-chave), consulta o contexto da
// fazenda já carregado no frontend e devolve uma resposta estruturada com
// insights, alertas e dados consolidados — adaptada à persona do usuário.
//
// Quando o endpoint /api/safra-ia/consultar estiver disponível, este módulo
// serve de fallback (mesmo padrão dos demais serviços do projeto).
// ---------------------------------------------------------------------------

import {
  SafraIAAlerta,
  SafraIAConsultaPayload,
  SafraIAContexto,
  SafraIADestaque,
  SafraIAPersona,
  SafraIAPersonaId,
  SafraIAResposta,
  SafraIATabela,
} from "../types/safraIA";
import {
  abaixoMinimo,
  diasParaVencer,
  isProximoVencimento,
  isVencido,
  proximaValidade,
  situacaoEstoque,
  valorEstoque,
} from "../types/insumo";
import { areaDisponivel, produtividadeMedia } from "../types/talhao";
import { custoTotal, isAtrasada } from "../types/atividade";

// ---------------------------------------------------------------------------
// Personas (níveis de acesso)
// ---------------------------------------------------------------------------
export const PERSONAS: Record<SafraIAPersonaId, SafraIAPersona> = {
  produtor: {
    id: "produtor",
    nome: "Produtor Rural",
    icone: "👨‍🌾",
    foco: "Visão geral e tomada de decisão rápida",
    saudacao:
      "Olá! Sou o assistente SafraIA. Posso te dar uma visão geral da fazenda, alertas de estoque e resultados por safra. Como posso ajudar?",
    sugestoes: [
      "Como está minha fazenda hoje?",
      "Quais talhões estão disponíveis para plantio?",
      "Tenho produtos vencidos no estoque?",
      "Qual a lucratividade por safra?",
    ],
    verFinanceiro: true,
  },
  agronomo: {
    id: "agronomo",
    nome: "Agrônomo",
    icone: "🌱",
    foco: "Recomendações técnicas, culturas e manejo",
    saudacao:
      "Olá! Sou o SafraIA. Posso ajudar com produtividade dos talhões, áreas disponíveis, manejo de insumos e alertas de vencimento. O que deseja analisar?",
    sugestoes: [
      "Quais os talhões mais produtivos?",
      "Quais áreas estão disponíveis para plantio?",
      "Há produtos próximos do vencimento?",
      "Qual o custo com fertilizantes por mês?",
    ],
    verFinanceiro: false,
  },
  administrador: {
    id: "administrador",
    nome: "Administrador",
    icone: "🛡️",
    foco: "Análises financeiras, custos operacionais e lucratividade",
    saudacao:
      "Olá! Sou o SafraIA. Posso analisar custos por hectare, lucratividade por safra, gastos com insumos e indicadores de estoque. Por onde começamos?",
    sugestoes: [
      "Qual a lucratividade por safra?",
      "Qual o custo por hectare?",
      "Qual o custo com fertilizantes por mês?",
      "Quais insumos estão abaixo do estoque mínimo?",
    ],
    verFinanceiro: true,
  },
  gerente: {
    id: "gerente",
    nome: "Gerente Operacional",
    icone: "🧭",
    foco: "Gargalos, atividades e eficiência das equipes",
    saudacao:
      "Olá! Sou o SafraIA. Posso mostrar o desempenho das equipes, atividades atrasadas e necessidades de reposição de estoque. O que precisa?",
    sugestoes: [
      "Como está o desempenho das equipes?",
      "Quais atividades estão atrasadas?",
      "Quais insumos precisam de reposição?",
      "Quais talhões estão disponíveis para plantio?",
    ],
    verFinanceiro: false,
  },
};

/** Mapeia o perfil de acesso do usuário logado para uma persona do SafraIA. */
export function resolverPersona(perfilId?: string): SafraIAPersonaId {
  switch ((perfilId ?? "").toLowerCase()) {
    case "administrador":
    case "financeiro":
      return "administrador";
    case "agronomo":
      return "agronomo";
    case "gerente-agricola":
    case "supervisor-campo":
    case "estoquista":
      return "gerente";
    case "proprietario":
    default:
      return "produtor";
  }
}

// ---------------------------------------------------------------------------
// Helpers de formatação
// ---------------------------------------------------------------------------
const brl = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const nf = (v: number, casas = 0) =>
  Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: casas });

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const labelMes = (ym: string) => {
  const [a, m] = ym.split("-");
  return `${MESES[Number(m) - 1] ?? m}/${a}`;
};

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const temTodas = (t: string, termos: string[]) => termos.every((k) => t.includes(k));
const temAlguma = (t: string, termos: string[]) => termos.some((k) => t.includes(k));

// ---------------------------------------------------------------------------
// Classificação de intenção (simulação de NLU)
// ---------------------------------------------------------------------------
export type SafraIAIntent =
  | "resumo-geral"
  | "areas-disponiveis"
  | "talhoes-produtivos"
  | "produtividade-historica"
  | "custo-fertilizantes"
  | "atividades-funcionarios"
  | "estoque-alertas"
  | "produtos-vencidos"
  | "custo-hectare"
  | "lucratividade-safra";

function classificar(perguntaNorm: string): SafraIAIntent {
  const t = perguntaNorm;

  if (temAlguma(t, ["vencid", "validade", "vencimento"])) return "produtos-vencidos";
  if (temAlguma(t, ["estoque minimo", "estoque baixo", "repor", "reposicao", "abaixo do minimo"]) ||
      (t.includes("estoque") && temAlguma(t, ["alerta", "minimo", "baixo", "acabando"])))
    return "estoque-alertas";

  if (t.includes("hectare") || t.includes("por ha")) return "custo-hectare";
  if (temAlguma(t, ["lucr", "rentabil", "margem", "resultado da safra", "lucro"]))
    return "lucratividade-safra";

  if (t.includes("fertilizante")) return "custo-fertilizantes";

  if (temAlguma(t, ["funcionario", "equipe", "responsavel", "colaborador"]) ||
      (t.includes("atividade") && temAlguma(t, ["quem", "atras", "andamento", "desempenho"])) ||
      temAlguma(t, ["atrasad", "desempenho"]))
    return "atividades-funcionarios";

  if (temAlguma(t, ["disponivel", "livre", "disponiveis"]) && temAlguma(t, ["area", "talha", "plantio", "plantar"]))
    return "areas-disponiveis";

  if (temTodas(t, ["produtiv"]) && temAlguma(t, ["histor", "evolu", "ao longo"]))
    return "produtividade-historica";
  if (temAlguma(t, ["produtiv", "mais produz", "melhor talha", "rende"]))
    return "talhoes-produtivos";

  if (temAlguma(t, ["visao geral", "resumo", "como esta", "panorama", "situacao da fazenda", "status"]))
    return "resumo-geral";

  return "resumo-geral";
}

// ---------------------------------------------------------------------------
// Cálculos por intenção (consultam o contexto da fazenda)
// ---------------------------------------------------------------------------
type Fn = (ctx: SafraIAContexto) => SafraIAResposta;

const semDados = (intent: string, texto: string, sugestoes?: string[]): SafraIAResposta => ({
  intent,
  texto,
  sugestoes,
});

/** 1. Áreas disponíveis para plantio (consulta de gestão). */
const areasDisponiveis: Fn = (ctx) => {
  const linhas = ctx.talhoes
    .map((t) => ({
      t,
      disp: areaDisponivel(t),
      base: t.area_utilizavel || t.area_total,
    }))
    .filter((r) => r.disp > 0)
    .sort((a, b) => b.disp - a.disp);

  const totalDisp = linhas.reduce((s, r) => s + r.disp, 0);
  const livres = ctx.talhoes.filter((t) => t.status === "Livre").length;

  if (!ctx.talhoes.length)
    return semDados("areas-disponiveis", "Ainda não há talhões cadastrados para avaliar áreas disponíveis.");

  const tabela: SafraIATabela = {
    titulo: "Talhões com área disponível",
    colunas: ["Talhão", "Status", "Área útil (ha)", "Disponível (ha)"],
    linhas: linhas.slice(0, 8).map((r) => [
      `${r.t.codigo} · ${r.t.nome}`,
      r.t.status,
      nf(r.base, 1),
      nf(r.disp, 1),
    ]),
  };

  return {
    intent: "areas-disponiveis",
    texto: `Há ${nf(totalDisp, 1)} ha disponíveis para plantio em ${linhas.length} talhão(ões)${
      livres ? `, sendo ${livres} totalmente livre(s)` : ""
    }.`,
    destaques: [
      { rotulo: "Área disponível", valor: `${nf(totalDisp, 1)} ha`, tom: "positivo" },
      { rotulo: "Talhões livres", valor: String(livres), tom: "neutro" },
    ],
    tabela,
    sugestoes: ["Quais os talhões mais produtivos?", "Quais áreas já estão ocupadas?"],
  };
};

/** 2. Talhões mais produtivos (consulta de gestão). */
const talhoesProdutivos: Fn = (ctx) => {
  const comProd = ctx.talhoes
    .map((t) => ({ t, prod: produtividadeMedia(t) }))
    .filter((r) => r.prod > 0)
    .sort((a, b) => b.prod - a.prod);

  if (!comProd.length) {
    const porArea = [...ctx.talhoes]
      .sort((a, b) => (b.area_utilizavel || 0) - (a.area_utilizavel || 0))
      .slice(0, 5);
    return {
      intent: "talhoes-produtivos",
      texto:
        "Ainda não há histórico de produtividade registrado nos talhões. Exibindo os talhões por área útil como referência.",
      tabela: porArea.length
        ? {
            titulo: "Talhões por área útil",
            colunas: ["Talhão", "Cultura/Solo", "Área útil (ha)"],
            linhas: porArea.map((t) => [`${t.codigo} · ${t.nome}`, t.tipo_solo, nf(t.area_utilizavel, 1)]),
          }
        : undefined,
      sugestoes: ["Quais áreas estão disponíveis para plantio?"],
    };
  }

  const melhor = comProd[0];
  return {
    intent: "talhoes-produtivos",
    texto: `O talhão mais produtivo é ${melhor.t.codigo} · ${melhor.t.nome}, com média de ${nf(
      melhor.prod,
      1
    )} por hectare nas safras colhidas.`,
    destaques: [
      { rotulo: "Mais produtivo", valor: `${melhor.t.codigo}`, tom: "positivo", detalhe: `${nf(melhor.prod, 1)}/ha` },
    ],
    tabela: {
      titulo: "Ranking de produtividade",
      colunas: ["Talhão", "Produtividade média/ha"],
      linhas: comProd.slice(0, 8).map((r) => [`${r.t.codigo} · ${r.t.nome}`, nf(r.prod, 1)]),
    },
    sugestoes: ["Qual a evolução histórica da produtividade?", "Quais áreas estão disponíveis para plantio?"],
  };
};

/** 3. Evolução histórica de produtividade (análise de produtividade). */
const produtividadeHistorica: Fn = (ctx) => {
  const linhas: (string | number)[][] = [];
  ctx.talhoes.forEach((t) => {
    (t.historico ?? [])
      .filter((h) => h.produtividade != null && h.produtividade > 0)
      .forEach((h) => {
        linhas.push([`${t.codigo} · ${t.nome}`, h.safra ?? "—", h.cultura ?? "—", nf(Number(h.produtividade), 1)]);
      });
  });

  if (!linhas.length)
    return semDados(
      "produtividade-historica",
      "Ainda não há histórico de colheitas com produtividade registrada para montar a evolução. Registre as colheitas nos talhões para habilitar esta análise.",
      ["Quais os talhões mais produtivos?"]
    );

  return {
    intent: "produtividade-historica",
    texto: `Encontrei ${linhas.length} registro(s) de produtividade por safra. Veja a evolução por talhão abaixo.`,
    tabela: {
      titulo: "Produtividade por safra",
      colunas: ["Talhão", "Safra", "Cultura", "Produtividade/ha"],
      linhas: linhas.slice(0, 12),
    },
    sugestoes: ["Qual a lucratividade por safra?"],
  };
};

/** 4. Custo com fertilizantes por mês (consulta de gestão / insumos). */
const custoFertilizantes: Fn = (ctx) => {
  const mapaInsumo = new Map(ctx.insumos.map((i) => [i.id, i]));
  const porMes = new Map<string, number>();

  ctx.movimentacoes
    .filter((m) => m.tipo === "Saída")
    .forEach((m) => {
      const insumo = mapaInsumo.get(m.id_insumo);
      if (insumo?.categoria !== "Fertilizantes") return;
      const mes = (m.data_movimentacao || "").slice(0, 7);
      if (!mes) return;
      const valor = Number(m.quantidade || 0) * Number(m.valor_unitario ?? insumo.valor_unitario ?? 0);
      porMes.set(mes, (porMes.get(mes) ?? 0) + valor);
    });

  const linhas = Array.from(porMes.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const total = linhas.reduce((s, [, v]) => s + v, 0);

  if (!linhas.length)
    return semDados(
      "custo-fertilizantes",
      "Não há saídas de fertilizantes registradas para calcular o custo mensal. Registre movimentações de saída no módulo de Insumos.",
      ["Quais insumos estão abaixo do estoque mínimo?"]
    );

  const media = total / linhas.length;
  return {
    intent: "custo-fertilizantes",
    texto: `O consumo de fertilizantes somou ${brl(total)} no período, com média de ${brl(media)}/mês.`,
    destaques: [
      { rotulo: "Total fertilizantes", valor: brl(total), tom: "atencao" },
      { rotulo: "Média mensal", valor: brl(media), tom: "neutro" },
    ],
    tabela: {
      titulo: "Custo de fertilizantes por mês",
      colunas: ["Mês", "Custo"],
      linhas: linhas.map(([mes, v]) => [labelMes(mes), brl(v)]),
    },
    sugestoes: ["Qual o custo por hectare?", "Quais produtos estão próximos do vencimento?"],
  };
};

/** 5. Atividades e desempenho de funcionários (consulta de gestão). */
const atividadesFuncionarios: Fn = (ctx) => {
  if (!ctx.atividades.length)
    return semDados("atividades-funcionarios", "Ainda não há atividades registradas para avaliar o desempenho das equipes.");

  interface Agg {
    total: number;
    concluidas: number;
    atrasadas: number;
    custo: number;
  }
  const porResp = new Map<string, Agg>();
  ctx.atividades.forEach((a) => {
    const nome = a.responsavel ?? `Funcionário #${a.id_responsavel}`;
    const agg = porResp.get(nome) ?? { total: 0, concluidas: 0, atrasadas: 0, custo: 0 };
    agg.total += 1;
    if (a.status === "Concluída") agg.concluidas += 1;
    if (isAtrasada(a)) agg.atrasadas += 1;
    agg.custo += custoTotal(a);
    porResp.set(nome, agg);
  });

  const linhas = Array.from(porResp.entries()).sort((a, b) => b[1].total - a[1].total);
  const atrasadasTotal = ctx.atividades.filter(isAtrasada).length;

  return {
    intent: "atividades-funcionarios",
    texto: `Há ${ctx.atividades.length} atividade(s) distribuídas entre ${porResp.size} responsável(is)${
      atrasadasTotal ? `, com ${atrasadasTotal} atrasada(s) exigindo atenção` : ", nenhuma atrasada"
    }.`,
    destaques: [
      { rotulo: "Atividades", valor: String(ctx.atividades.length), tom: "neutro" },
      {
        rotulo: "Atrasadas",
        valor: String(atrasadasTotal),
        tom: atrasadasTotal ? "critico" : "positivo",
      },
    ],
    alertas: atrasadasTotal
      ? [{ nivel: "alerta", titulo: `${atrasadasTotal} atividade(s) atrasada(s)`, descricao: "Verifique prazos e realocação de equipe." }]
      : undefined,
    tabela: {
      titulo: "Desempenho por responsável",
      colunas: ["Responsável", "Atividades", "Concluídas", "Atrasadas", "Custo"],
      linhas: linhas.map(([nome, a]) => [nome, a.total, a.concluidas, a.atrasadas, brl(a.custo)]),
    },
    sugestoes: ["Quais talhões estão disponíveis para plantio?", "Quais insumos precisam de reposição?"],
  };
};

/** 6. Estoque mínimo / reposição (monitoramento & alertas — RN004). */
const estoqueAlertas: Fn = (ctx) => {
  const criticos = ctx.insumos.filter(abaixoMinimo);
  if (!ctx.insumos.length)
    return semDados("estoque-alertas", "Ainda não há insumos cadastrados para monitorar o estoque.");

  if (!criticos.length)
    return {
      intent: "estoque-alertas",
      texto: "Nenhum insumo está no ou abaixo do estoque mínimo. Estoque saudável! 👍",
      destaques: [{ rotulo: "Itens em alerta", valor: "0", tom: "positivo" }],
      sugestoes: ["Há produtos próximos do vencimento?"],
    };

  return {
    intent: "estoque-alertas",
    texto: `${criticos.length} insumo(s) atingiram o estoque mínimo (RN004) e precisam de reposição.`,
    destaques: [{ rotulo: "Itens em alerta", valor: String(criticos.length), tom: "critico" }],
    alertas: criticos.slice(0, 6).map((i) => ({
      nivel: situacaoEstoque(i) === "Zerado" ? ("critico" as const) : ("alerta" as const),
      titulo: `${i.nome} — ${situacaoEstoque(i)}`,
      descricao: `Saldo ${nf(i.estoque_atual, 2)} ${i.unidade_medida} · mínimo ${nf(
        i.estoque_minimo,
        2
      )} ${i.unidade_medida}`,
    })),
    tabela: {
      titulo: "Insumos para reposição",
      colunas: ["Produto", "Saldo", "Mínimo", "Situação"],
      linhas: criticos.map((i) => [
        i.nome,
        `${nf(i.estoque_atual, 2)} ${i.unidade_medida}`,
        `${nf(i.estoque_minimo, 2)} ${i.unidade_medida}`,
        situacaoEstoque(i),
      ]),
    },
    sugestoes: ["Há produtos próximos do vencimento?", "Qual o custo com fertilizantes por mês?"],
  };
};

/** 7. Produtos vencidos / próximos do vencimento (RN002). */
const produtosVencidos: Fn = (ctx) => {
  if (!ctx.insumos.length)
    return semDados("produtos-vencidos", "Ainda não há insumos cadastrados para checar validade.");

  const vencidos = ctx.insumos.filter(isVencido);
  const proximos = ctx.insumos.filter((i) => isProximoVencimento(i));

  if (!vencidos.length && !proximos.length)
    return {
      intent: "produtos-vencidos",
      texto: "Nenhum produto vencido ou próximo do vencimento no momento. ✅",
      destaques: [
        { rotulo: "Vencidos", valor: "0", tom: "positivo" },
        { rotulo: "Próx. vencimento", valor: "0", tom: "positivo" },
      ],
      sugestoes: ["Quais insumos estão abaixo do estoque mínimo?"],
    };

  const linha = (i: (typeof ctx.insumos)[number]) => {
    const val = proximaValidade(i);
    const dias = diasParaVencer(val);
    const situacao = isVencido(i) ? "Vencido" : "Próx. vencimento";
    return [
      i.nome,
      val ? new Date(`${val}T00:00:00`).toLocaleDateString("pt-BR") : "—",
      dias == null ? "—" : dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d`,
      situacao,
    ] as (string | number)[];
  };

  return {
    intent: "produtos-vencidos",
    texto: `Atenção: ${vencidos.length} produto(s) vencido(s) (bloqueados para uso — RN002) e ${proximos.length} próximo(s) do vencimento.`,
    destaques: [
      { rotulo: "Vencidos", valor: String(vencidos.length), tom: vencidos.length ? "critico" : "positivo" },
      { rotulo: "Próx. vencimento", valor: String(proximos.length), tom: proximos.length ? "atencao" : "positivo" },
    ],
    alertas: vencidos.slice(0, 6).map((i) => ({
      nivel: "critico" as const,
      titulo: `${i.nome} vencido`,
      descricao: "Produto bloqueado para operações (RN002).",
    })),
    tabela: {
      titulo: "Validade dos insumos",
      colunas: ["Produto", "Validade", "Prazo", "Situação"],
      linhas: [...vencidos, ...proximos].map(linha),
    },
    sugestoes: ["Quais insumos precisam de reposição?"],
  };
};

/** 8. Custo por hectare (análise financeira — restrita). */
const custoHectare: Fn = (ctx) => {
  const totalDespesa = ctx.lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce((s, l) => s + Number(l.valor || 0), 0);
  const areaTotal = ctx.talhoes.reduce((s, t) => s + (t.area_utilizavel || t.area_total || 0), 0);

  if (!areaTotal)
    return semDados("custo-hectare", "Não há área útil cadastrada nos talhões para calcular o custo por hectare.");
  if (!totalDespesa)
    return semDados("custo-hectare", "Não há despesas lançadas para calcular o custo por hectare.");

  const custoHa = totalDespesa / areaTotal;
  return {
    intent: "custo-hectare",
    texto: `O custo médio é de ${brl(custoHa)} por hectare, considerando ${brl(
      totalDespesa
    )} em despesas sobre ${nf(areaTotal, 1)} ha úteis.`,
    destaques: [
      { rotulo: "Custo / hectare", valor: brl(custoHa), tom: "atencao" },
      { rotulo: "Despesa total", valor: brl(totalDespesa), tom: "neutro" },
      { rotulo: "Área útil", valor: `${nf(areaTotal, 1)} ha`, tom: "neutro" },
    ],
    sugestoes: ["Qual a lucratividade por safra?", "Qual o custo com fertilizantes por mês?"],
  };
};

/** 9. Lucratividade por safra (análise financeira — restrita). */
const lucratividadeSafra: Fn = (ctx) => {
  interface Agg {
    receita: number;
    despesa: number;
  }
  const porSafra = new Map<string, Agg>();
  ctx.lancamentos.forEach((l) => {
    const chave = l.nome_safra ?? (l.id_safra != null ? `Safra ${l.id_safra}` : "Sem safra");
    const agg = porSafra.get(chave) ?? { receita: 0, despesa: 0 };
    if (l.tipo === "RECEITA") agg.receita += Number(l.valor || 0);
    else agg.despesa += Number(l.valor || 0);
    porSafra.set(chave, agg);
  });

  const linhas = Array.from(porSafra.entries())
    .map(([safra, a]) => ({ safra, ...a, resultado: a.receita - a.despesa }))
    .sort((a, b) => b.resultado - a.resultado);

  if (!linhas.length)
    return semDados("lucratividade-safra", "Não há lançamentos financeiros para calcular a lucratividade por safra.");

  const melhor = linhas[0];
  const resultadoTotal = linhas.reduce((s, r) => s + r.resultado, 0);

  return {
    intent: "lucratividade-safra",
    texto: `O resultado consolidado é de ${brl(resultadoTotal)}. A safra mais lucrativa foi ${
      melhor.safra
    } (${brl(melhor.resultado)}).`,
    destaques: [
      { rotulo: "Resultado total", valor: brl(resultadoTotal), tom: resultadoTotal >= 0 ? "positivo" : "critico" },
      { rotulo: "Melhor safra", valor: melhor.safra, tom: "positivo", detalhe: brl(melhor.resultado) },
    ],
    tabela: {
      titulo: "Resultado por safra",
      colunas: ["Safra", "Receita", "Despesa", "Resultado", "Margem"],
      linhas: linhas.map((r) => [
        r.safra,
        brl(r.receita),
        brl(r.despesa),
        brl(r.resultado),
        r.receita ? `${nf((r.resultado / r.receita) * 100, 1)}%` : "—",
      ]),
    },
    sugestoes: ["Qual o custo por hectare?", "Qual o custo com fertilizantes por mês?"],
  };
};

/** 10. Resumo geral / fallback (visão da fazenda). */
const resumoGeral = (ctx: SafraIAContexto, persona: SafraIAPersona): SafraIAResposta => {
  const areaDisp = ctx.talhoes.reduce((s, t) => s + areaDisponivel(t), 0);
  const emAlerta = ctx.insumos.filter(abaixoMinimo).length;
  const vencidos = ctx.insumos.filter(isVencido).length;
  const atrasadas = ctx.atividades.filter(isAtrasada).length;
  const valorEstoqueTotal = ctx.insumos.reduce((s, i) => s + valorEstoque(i), 0);

  const destaques: SafraIADestaque[] = [
    { rotulo: "Talhões", valor: String(ctx.talhoes.length), tom: "neutro" },
    { rotulo: "Área livre", valor: `${nf(areaDisp, 1)} ha`, tom: "positivo" },
    { rotulo: "Estoque em alerta", valor: String(emAlerta), tom: emAlerta ? "atencao" : "positivo" },
    { rotulo: "Produtos vencidos", valor: String(vencidos), tom: vencidos ? "critico" : "positivo" },
  ];

  if (persona.verFinanceiro) {
    const saldo = ctx.lancamentos.reduce(
      (s, l) => s + (l.tipo === "RECEITA" ? Number(l.valor || 0) : -Number(l.valor || 0)),
      0
    );
    destaques.push({ rotulo: "Resultado financeiro", valor: brl(saldo), tom: saldo >= 0 ? "positivo" : "critico" });
  }
  destaques.push({ rotulo: "Capital em estoque", valor: brl(valorEstoqueTotal), tom: "neutro" });

  const alertas: SafraIAAlerta[] = [];
  if (vencidos) alertas.push({ nivel: "critico" as const, titulo: `${vencidos} produto(s) vencido(s)`, descricao: "Bloqueados para uso (RN002)." });
  if (emAlerta) alertas.push({ nivel: "alerta" as const, titulo: `${emAlerta} insumo(s) no estoque mínimo`, descricao: "Considere reposição (RN004)." });
  if (atrasadas) alertas.push({ nivel: "alerta" as const, titulo: `${atrasadas} atividade(s) atrasada(s)` });

  return {
    intent: "resumo-geral",
    texto: `Aqui está o panorama da fazenda para o perfil ${persona.nome}. ${
      alertas.length ? "Há pontos que pedem atenção (veja os alertas)." : "Tudo sob controle no momento."
    }`,
    destaques,
    alertas: alertas.length ? alertas : undefined,
    sugestoes: persona.sugestoes,
  };
};

// ---------------------------------------------------------------------------
// Orquestrador
// ---------------------------------------------------------------------------
const INTENTS_FINANCEIRAS: SafraIAIntent[] = ["custo-hectare", "lucratividade-safra"];

/** Saudação inicial exibida ao abrir o chat. */
export function saudacaoInicial(personaId: SafraIAPersonaId): SafraIAResposta {
  const persona = PERSONAS[personaId];
  return { intent: "saudacao", texto: persona.saudacao, sugestoes: persona.sugestoes };
}

/** Motor principal: interpreta a pergunta e devolve a resposta estruturada. */
export function responderSafraIA(payload: SafraIAConsultaPayload): SafraIAResposta {
  const persona = PERSONAS[payload.persona] ?? PERSONAS.produtor;
  const intent = classificar(norm(payload.pergunta));

  // Controle de acesso por persona: análises financeiras sensíveis.
  if (INTENTS_FINANCEIRAS.includes(intent) && !persona.verFinanceiro) {
    return {
      intent: "acesso-negado",
      texto: `O perfil ${persona.nome} não tem acesso a detalhes financeiros (custos e lucratividade). Posso ajudar com produtividade, áreas, atividades e estoque.`,
      alertas: [{ nivel: "info", titulo: "Acesso restrito", descricao: "Consulte um Administrador para análises financeiras." }],
      sugestoes: persona.sugestoes,
    };
  }

  switch (intent) {
    case "areas-disponiveis": return areasDisponiveis(payload.contexto);
    case "talhoes-produtivos": return talhoesProdutivos(payload.contexto);
    case "produtividade-historica": return produtividadeHistorica(payload.contexto);
    case "custo-fertilizantes": return custoFertilizantes(payload.contexto);
    case "atividades-funcionarios": return atividadesFuncionarios(payload.contexto);
    case "estoque-alertas": return estoqueAlertas(payload.contexto);
    case "produtos-vencidos": return produtosVencidos(payload.contexto);
    case "custo-hectare": return custoHectare(payload.contexto);
    case "lucratividade-safra": return lucratividadeSafra(payload.contexto);
    case "resumo-geral":
    default:
      return resumoGeral(payload.contexto, persona);
  }
}
