// ---------------------------------------------------------------------------
// Módulo SafraIA — motor de interpretação de consultas (mock do backend LLM)
// ---------------------------------------------------------------------------
// Simula um agente de IA e limita o contexto demonstrativo aos módulos do papel
// autenticado.
//
// Quando o endpoint /api/safra-ia/consultar estiver disponível, este módulo
// serve de fallback (mesmo padrão dos demais serviços do projeto).
// ---------------------------------------------------------------------------

import {
  SafraIAAlerta,
  SafraIAConsultaPayload,
  SafraIAContexto,
  SafraIADestaque,
  SafraIAModulo,
  SafraIAPapel,
  SafraIAPapelId,
  SafraIAPerfil,
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
// Papéis e módulos seguem os perfis padrão de Configurações.
// ---------------------------------------------------------------------------
export const PAPEIS_DEMO: Record<SafraIAPapelId, SafraIAPapel> = {
  administrador: {
    papel: "administrador",
    nome_papel: "Administrador",
    foco: "Visão ampla da fazenda, operações e resultados",
    saudacao: "Olá! Sou o SafraIA. Posso ajudar a analisar propriedades, operação, estoque e resultados da fazenda.",
    sugestoes: ["Quantas propriedades temos?", "Como está o fluxo financeiro?", "Quais atividades estão atrasadas?", "Como está o estoque?"],
    modulos: ["Propriedades", "Talhões", "Funcionários", "Atividades", "Financeiro", "Insumos"],
    consultas: [],
  },
  proprietario: {
    papel: "proprietario",
    nome_papel: "Proprietário",
    foco: "Visão gerencial da fazenda e seus resultados",
    saudacao: "Olá! Posso ajudar com a visão geral, os custos e os resultados da sua fazenda.",
    sugestoes: ["Quantas propriedades temos?", "Qual a lucratividade por safra?", "Qual o custo por hectare?", "Como está a equipe?"],
    modulos: ["Propriedades", "Talhões", "Funcionários", "Atividades", "Financeiro", "Insumos"],
    consultas: [],
  },
  "gerente-agricola": {
    papel: "gerente-agricola",
    nome_papel: "Gerente Agrícola",
    foco: "Gestão das operações e desempenho financeiro",
    saudacao: "Olá! Posso ajudar a acompanhar a operação, a equipe e os resultados financeiros da fazenda.",
    sugestoes: ["Quais atividades estão atrasadas?", "Qual o custo por hectare?", "Como está o estoque?", "Como está o fluxo financeiro?"],
    modulos: ["Propriedades", "Talhões", "Funcionários", "Atividades", "Financeiro", "Insumos"],
    consultas: [],
  },
  agronomo: {
    papel: "agronomo",
    nome_papel: "Agrônomo",
    foco: "Áreas técnicas, atividades e manejo de insumos",
    saudacao: "Olá! Posso ajudar com talhões, atividades agrícolas e manejo de insumos.",
    sugestoes: ["Quais os talhões mais produtivos?", "Quais áreas estão disponíveis para plantio?", "Há produtos próximos do vencimento?", "Quais atividades estão atrasadas?"],
    modulos: ["Propriedades", "Talhões", "Atividades", "Insumos"],
    consultas: [],
  },
  "supervisor-campo": {
    papel: "supervisor-campo",
    nome_papel: "Supervisor de Campo",
    foco: "Atividades de campo, talhões e insumos",
    saudacao: "Olá! Posso ajudar a acompanhar atividades, talhões e necessidades de insumos.",
    sugestoes: ["Quais atividades estão atrasadas?", "Quais áreas estão disponíveis para plantio?", "Como está o estoque?", "Quais atividades estão em andamento?"],
    modulos: ["Talhões", "Atividades", "Insumos"],
    consultas: [],
  },
  financeiro: {
    papel: "financeiro",
    nome_papel: "Financeiro",
    foco: "Fluxo financeiro, custos e resultados",
    saudacao: "Olá! Posso ajudar a analisar despesas, custos e resultados financeiros da fazenda.",
    sugestoes: ["Como está o fluxo financeiro?", "Qual a lucratividade por safra?", "Qual o custo por hectare?", "Qual o custo com fertilizantes por mês?"],
    modulos: ["Financeiro"],
    consultas: [],
  },
  estoquista: {
    papel: "estoquista",
    nome_papel: "Estoquista",
    foco: "Estoque, insumos e movimentações",
    saudacao: "Olá! Posso ajudar a acompanhar o estoque, as movimentações e as atividades relacionadas.",
    sugestoes: ["Quais insumos estão abaixo do estoque mínimo?", "Tenho produtos vencidos?", "Quais atividades estão atrasadas?", "Quais insumos precisam de reposição?"],
    modulos: ["Atividades", "Insumos"],
    consultas: [],
  },
  operador: {
    papel: "operador",
    nome_papel: "Operador",
    foco: "Atividades agrícolas",
    saudacao: "Olá! Posso ajudar a consultar informações sobre atividades agrícolas.",
    sugestoes: ["Quais atividades estão atrasadas?", "Quais atividades estão em andamento?", "Como está a situação das atividades?"],
    modulos: ["Atividades"],
    consultas: [],
  },
  colaborador: {
    papel: "colaborador",
    nome_papel: "Colaborador",
    foco: "Orientações gerais de gestão rural",
    saudacao: "Olá! Posso ajudar com orientações gerais de gestão rural.",
    sugestoes: ["Como organizar as atividades da fazenda?", "Como planejar o manejo da lavoura?"],
    modulos: [],
    consultas: [],
  },
};

const CONSULTAS_POR_MODULO: Record<SafraIAModulo, SafraIAPerfil["consultas"]> = {
  Propriedades: [{ nome: "resumo_propriedades", descricao: "Propriedades e áreas da empresa." }],
  Talhões: [{ nome: "area_disponivel", descricao: "Talhões e áreas disponíveis." }, { nome: "safras", descricao: "Safras e culturas cadastradas." }],
  "Funcionários": [{ nome: "equipe", descricao: "Funcionários ativos por propriedade." }],
  Atividades: [{ nome: "atividades", descricao: "Atividades agrícolas e atrasos." }, { nome: "maquinas", descricao: "Uso de máquinas nas atividades." }, { nome: "consumo_insumos", descricao: "Insumos aplicados nas atividades." }],
  Financeiro: [{ nome: "custos", descricao: "Despesas e custos financeiros." }, { nome: "fluxo_mensal", descricao: "Receitas, despesas e saldo por mês." }, { nome: "custo_por_hectare", descricao: "Custos de safra por hectare." }],
  Insumos: [{ nome: "estoque", descricao: "Situação do estoque." }, { nome: "movimentacoes_estoque", descricao: "Entradas e saídas de estoque." }, { nome: "fornecedores", descricao: "Fornecedores com entradas na empresa." }],
};

/** Perfil local para demonstração e fallback quando o backend não está disponível. */
export function papelDemoSafraIA(perfilId?: string): SafraIAPapel {
  const normalizado = (perfilId ?? "").trim().toLowerCase();
  return Object.values(PAPEIS_DEMO).find((papel) => papel.papel === normalizado) ?? PAPEIS_DEMO.colaborador;
}

export function perfilDemoSafraIA(perfilId?: string): SafraIAPerfil {
  const papel = papelDemoSafraIA(perfilId);
  return {
    papel: papel.papel,
    nome_papel: papel.nome_papel,
    foco: papel.foco,
    saudacao: papel.saudacao,
    sugestoes: papel.sugestoes,
    consultas: [...new Map(papel.modulos.flatMap((modulo) => CONSULTAS_POR_MODULO[modulo]).map((consulta) => [consulta.nome, consulta])).values()],
  };
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
  | "resumo-propriedades"
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

  if (t.includes("propriedad")) return "resumo-propriedades";
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

const resumoPropriedades: Fn = (ctx) => {
  const propriedades = ctx.propriedades.filter((propriedade) => propriedade.status !== false);
  if (!propriedades.length) {
    return semDados("resumo-propriedades", "Não há propriedades cadastradas para consultar.");
  }
  const areaTotal = propriedades.reduce((total, propriedade) => total + Number(propriedade.area_total || 0), 0);
  return {
    intent: "resumo-propriedades",
    texto: `A empresa tem ${propriedades.length} propriedade(s) ativa(s), com ${nf(areaTotal, 1)} ha de área total cadastrada.`,
    destaques: [
      { rotulo: "Propriedades", valor: String(propriedades.length), tom: "neutro" },
      { rotulo: "Área total", valor: `${nf(areaTotal, 1)} ha`, tom: "positivo" },
    ],
    tabela: {
      titulo: "Propriedades ativas",
      colunas: ["Propriedade", "Área total", "Área agricultável"],
      linhas: propriedades.map((propriedade) => [
        propriedade.nome_propriedade,
        `${nf(Number(propriedade.area_total || 0), 1)} ha`,
        `${nf(Number(propriedade.area_agricultavel || 0), 1)} ha`,
      ]),
    },
  };
};

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
const resumoGeral = (ctx: SafraIAContexto, papel: SafraIAPapel): SafraIAResposta => {
  const temModulo = (modulo: SafraIAModulo) => papel.modulos.includes(modulo);
  const destaques: SafraIADestaque[] = [];
  const alertas: SafraIAAlerta[] = [];

  if (temModulo("Talhões")) {
    const areaDisp = ctx.talhoes.reduce((s, t) => s + areaDisponivel(t), 0);
    destaques.push(
      { rotulo: "Talhões", valor: String(ctx.talhoes.length), tom: "neutro" },
      { rotulo: "Área livre", valor: `${nf(areaDisp, 1)} ha`, tom: "positivo" }
    );
  }
  if (temModulo("Insumos")) {
    const emAlerta = ctx.insumos.filter(abaixoMinimo).length;
    const vencidos = ctx.insumos.filter(isVencido).length;
    const valorEstoqueTotal = ctx.insumos.reduce((s, i) => s + valorEstoque(i), 0);
    destaques.push(
      { rotulo: "Estoque em alerta", valor: String(emAlerta), tom: emAlerta ? "atencao" : "positivo" },
      { rotulo: "Produtos vencidos", valor: String(vencidos), tom: vencidos ? "critico" : "positivo" },
      { rotulo: "Capital em estoque", valor: brl(valorEstoqueTotal), tom: "neutro" }
    );
    if (vencidos) alertas.push({ nivel: "critico", titulo: `${vencidos} produto(s) vencido(s)`, descricao: "Bloqueados para uso (RN002)." });
    if (emAlerta) alertas.push({ nivel: "alerta", titulo: `${emAlerta} insumo(s) no estoque mínimo`, descricao: "Considere reposição (RN004)." });
  }
  if (temModulo("Atividades")) {
    const atrasadas = ctx.atividades.filter(isAtrasada).length;
    if (atrasadas) alertas.push({ nivel: "alerta", titulo: `${atrasadas} atividade(s) atrasada(s)` });
    destaques.push({ rotulo: "Atividades atrasadas", valor: String(atrasadas), tom: atrasadas ? "critico" : "positivo" });
  }
  if (temModulo("Financeiro")) {
    const saldo = ctx.lancamentos.reduce(
      (s, l) => s + (l.tipo === "RECEITA" ? Number(l.valor || 0) : -Number(l.valor || 0)),
      0
    );
    destaques.push({ rotulo: "Resultado financeiro", valor: brl(saldo), tom: saldo >= 0 ? "positivo" : "critico" });
  }

  return {
    intent: "resumo-geral",
    texto: `Aqui está o panorama da fazenda para ${papel.nome_papel}. ${
      alertas.length ? "Há pontos que pedem atenção (veja os alertas)." : "Não encontrei alertas nos módulos disponíveis."
    }`,
    destaques,
    alertas: alertas.length ? alertas : undefined,
    sugestoes: papel.sugestoes,
  };
};

// ---------------------------------------------------------------------------
// Orquestrador
// ---------------------------------------------------------------------------
const MODULO_POR_INTENT: Partial<Record<SafraIAIntent, SafraIAModulo>> = {
  "resumo-propriedades": "Propriedades",
  "areas-disponiveis": "Talhões",
  "talhoes-produtivos": "Talhões",
  "produtividade-historica": "Talhões",
  "custo-fertilizantes": "Financeiro",
  "estoque-alertas": "Insumos",
  "produtos-vencidos": "Insumos",
  "custo-hectare": "Financeiro",
  "lucratividade-safra": "Financeiro",
};

/** Saudação inicial exibida ao abrir o chat. */
export function saudacaoInicial(papelId: string): SafraIAResposta {
  const papel = papelDemoSafraIA(papelId);
  return { intent: "saudacao", texto: papel.saudacao, sugestoes: papel.sugestoes, papel: papel.papel };
}

/** Motor principal: interpreta a pergunta e devolve a resposta estruturada. */
export function responderSafraIA(payload: SafraIAConsultaPayload): SafraIAResposta {
  const papel = papelDemoSafraIA(payload.papel);
  const pergunta = norm(payload.pergunta);
  const intent = classificar(pergunta);
  const modulo = intent === "atividades-funcionarios" &&
    temAlguma(pergunta, ["funcionario", "equipe", "responsavel", "colaborador", "desempenho"])
    ? "Funcionários"
    : MODULO_POR_INTENT[intent] ?? (intent === "atividades-funcionarios" ? "Atividades" : undefined);

  if (intent === "resumo-geral" ? papel.modulos.length === 0 : !modulo || !papel.modulos.includes(modulo)) {
    return {
      intent: "acesso-negado",
      texto: `O papel ${papel.nome_papel} não tem acesso a essa informação pelos módulos disponíveis.`,
      alertas: [{ nivel: "info", titulo: "Acesso restrito", descricao: "Consulte um Administrador para análises financeiras." }],
      sugestoes: papel.sugestoes,
      papel: papel.papel,
    };
  }

  let resposta: SafraIAResposta;
  switch (intent) {
    case "resumo-propriedades": resposta = resumoPropriedades(payload.contexto); break;
    case "areas-disponiveis": resposta = areasDisponiveis(payload.contexto); break;
    case "talhoes-produtivos": resposta = talhoesProdutivos(payload.contexto); break;
    case "produtividade-historica": resposta = produtividadeHistorica(payload.contexto); break;
    case "custo-fertilizantes": resposta = custoFertilizantes(payload.contexto); break;
    case "atividades-funcionarios":
      resposta = atividadesFuncionarios(payload.contexto);
      if (!papel.modulos.includes("Funcionários")) {
        const total = payload.contexto.atividades.length;
        const atrasadas = payload.contexto.atividades.filter(isAtrasada).length;
        resposta = {
          ...resposta,
          texto: `Há ${total} atividade(s) registradas, com ${atrasadas} atrasada(s).`,
          tabela: undefined,
        };
      }
      break;
    case "estoque-alertas": resposta = estoqueAlertas(payload.contexto); break;
    case "produtos-vencidos": resposta = produtosVencidos(payload.contexto); break;
    case "custo-hectare": resposta = custoHectare(payload.contexto); break;
    case "lucratividade-safra": resposta = lucratividadeSafra(payload.contexto); break;
    case "resumo-geral":
    default:
      resposta = resumoGeral(payload.contexto, papel);
  }
  return { ...resposta, papel: papel.papel };
}
