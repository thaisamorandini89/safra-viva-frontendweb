import { describe, it, expect } from "vitest";
import { perfilDemoSafraIA, responderSafraIA, saudacaoInicial, PAPEIS_DEMO } from "./safraIAMock";
import { SafraIAContexto, SafraIAPapelId } from "../types/safraIA";
import { Insumo, MovimentacaoEstoque } from "../types/insumo";
import { Talhao } from "../types/talhao";
import { AtividadeAgricola } from "../types/atividade";
import { Lancamento } from "../types/financeiro";

// ---------------------------------------------------------------------------
// Builders de fixtures mínimas
// ---------------------------------------------------------------------------
const insumo = (over: Partial<Insumo>): Insumo =>
  ({
    id: "i1",
    nome: "Produto",
    categoria: "Fertilizantes",
    unidade_medida: "kg",
    estoque_atual: 100,
    estoque_minimo: 10,
    valor_unitario: 5,
    status: "Ativo",
    ...over,
  } as Insumo);

const talhao = (over: Partial<Talhao>): Talhao =>
  ({
    id: "t1",
    nome: "Talhão",
    codigo: "TLH-1",
    id_propriedade: 1,
    area_total: 100,
    area_utilizavel: 100,
    tipo_solo: "Argiloso",
    status: "Livre",
    data_cadastro: "2026-01-01",
    ...over,
  } as Talhao);

const atividade = (over: Partial<AtividadeAgricola>): AtividadeAgricola =>
  ({
    id: "a1",
    id_empresa: 1,
    id_propriedade: 1,
    id_talhao: "t1",
    id_safra: "s1",
    tipo_atividade: "Adubação",
    data_inicio: "2026-01-01",
    id_responsavel: 1,
    status: "Concluída",
    ...over,
  } as AtividadeAgricola);

const lancamento = (over: Partial<Lancamento>): Lancamento =>
  ({
    id_lancamento: "l1",
    tipo: "RECEITA",
    categoria: "Venda",
    valor: 1000,
    data_lancamento: "2026-03-01",
    status: "PAGO",
    conciliado: false,
    ...over,
  } as Lancamento);

const movimentacao = (over: Partial<MovimentacaoEstoque>): MovimentacaoEstoque =>
  ({
    id: "m1",
    id_insumo: "i1",
    tipo: "Saída",
    quantidade: 10,
    data_movimentacao: "2026-03-10",
    id_responsavel: 1,
    ...over,
  } as MovimentacaoEstoque);

const ctx = (over: Partial<SafraIAContexto>): SafraIAContexto => ({
  insumos: [],
  movimentacoes: [],
  talhoes: [],
  atividades: [],
  lancamentos: [],
  safras: [],
  propriedades: [],
  ...over,
});

const perguntar = (
  pergunta: string,
  contexto: SafraIAContexto,
  papel: SafraIAPapelId = "administrador"
) => responderSafraIA({ pergunta, papel, contexto });

const PASSADO = "2000-01-01";
const FUTURO = "2099-01-01";

// ---------------------------------------------------------------------------
// Classificação de intenção + cálculos
// ---------------------------------------------------------------------------
describe("responderSafraIA — intenções", () => {
  it("áreas disponíveis para plantio", () => {
    const r = perguntar(
      "Quais áreas estão disponíveis para plantio?",
      ctx({ talhoes: [talhao({ area_utilizavel: 80 }), talhao({ id: "t2", area_utilizavel: 20 })] })
    );
    expect(r.intent).toBe("areas-disponiveis");
    expect(r.tabela?.linhas.length).toBe(2);
    expect(r.destaques?.[0].valor).toContain("100");
  });

  it("talhões mais produtivos (com histórico)", () => {
    const r = perguntar(
      "Quais os talhões mais produtivos?",
      ctx({
        talhoes: [
          talhao({ id: "t1", codigo: "TLH-1", nome: "Boa Vista", historico: [{ id: "h1", id_talhao: "t1", safra: "2025", cultura: "Soja", area_plantada: 10, data_plantio: "2025-01-01", data_colheita: "2025-06-01", produtividade: 40 }] }),
          talhao({ id: "t2", codigo: "TLH-2", nome: "Barra Nova", historico: [{ id: "h2", id_talhao: "t2", safra: "2025", cultura: "Milho", area_plantada: 10, data_plantio: "2025-01-01", data_colheita: "2025-06-01", produtividade: 70 }] }),
        ],
      })
    );
    expect(r.intent).toBe("talhoes-produtivos");
    // o mais produtivo (70) deve aparecer primeiro na tabela
    expect(String(r.tabela?.linhas[0][0])).toContain("TLH-2");
    expect(r.destaques?.[0].detalhe).toContain("70");
  });

  it("custo com fertilizantes por mês", () => {
    const r = perguntar(
      "Qual o custo com fertilizantes por mês?",
      ctx({
        insumos: [insumo({ id: "f1", categoria: "Fertilizantes", valor_unitario: 4 })],
        movimentacoes: [movimentacao({ id_insumo: "f1", tipo: "Saída", quantidade: 100, valor_unitario: 4, data_movimentacao: "2026-03-10" })],
      })
    );
    expect(r.intent).toBe("custo-fertilizantes");
    // 100 x 4 = 400
    expect(r.texto).toContain("400");
  });

  it("atividades e atrasos por funcionário", () => {
    const r = perguntar(
      "Quais atividades estão atrasadas?",
      ctx({
        atividades: [
          atividade({ id: "a1", responsavel: "João", status: "Concluída" }),
          atividade({ id: "a2", responsavel: "Maria", status: "Em Andamento", data_fim: PASSADO }),
        ],
      })
    );
    expect(r.intent).toBe("atividades-funcionarios");
    const atrasadas = r.destaques?.find((d) => d.rotulo === "Atrasadas");
    expect(atrasadas?.valor).toBe("1");
  });

  it("estoque mínimo (RN004)", () => {
    const r = perguntar(
      "Quais insumos estão abaixo do estoque mínimo?",
      ctx({ insumos: [insumo({ estoque_atual: 5, estoque_minimo: 10 }), insumo({ id: "i2", estoque_atual: 50, estoque_minimo: 10 })] })
    );
    expect(r.intent).toBe("estoque-alertas");
    expect(r.destaques?.[0].valor).toBe("1");
  });

  it("produtos vencidos (RN002)", () => {
    const r = perguntar(
      "Tenho produtos vencidos no estoque?",
      ctx({
        insumos: [
          insumo({ id: "v1", lotes: [{ id: "l1", id_insumo: "v1", numero_lote: "L1", data_validade: PASSADO, quantidade: 10 }] }),
          insumo({ id: "ok", lotes: [{ id: "l2", id_insumo: "ok", numero_lote: "L2", data_validade: FUTURO, quantidade: 10 }] }),
        ],
      })
    );
    expect(r.intent).toBe("produtos-vencidos");
    const vencidos = r.destaques?.find((d) => d.rotulo === "Vencidos");
    expect(vencidos?.valor).toBe("1");
  });

  it("lucratividade por safra (papel com acesso)", () => {
    const r = perguntar(
      "Qual a lucratividade por safra?",
      ctx({
        lancamentos: [
          lancamento({ tipo: "RECEITA", valor: 1000, nome_safra: "A" }),
          lancamento({ id_lancamento: "l2", tipo: "DESPESA", valor: 400, nome_safra: "A" }),
        ],
      }),
      "administrador"
    );
    expect(r.intent).toBe("lucratividade-safra");
    // resultado = 1000 - 400 = 600
    expect(r.texto).toContain("600");
  });

  it("custo por hectare (papel com acesso)", () => {
    const r = perguntar(
      "Qual o custo por hectare?",
      ctx({
        talhoes: [talhao({ area_utilizavel: 100 })],
        lancamentos: [lancamento({ tipo: "DESPESA", valor: 1000 })],
      }),
      "administrador"
    );
    expect(r.intent).toBe("custo-hectare");
    const custoHa = r.destaques?.find((d) => d.rotulo === "Custo / hectare");
    expect(custoHa?.valor).toContain("10");
  });

  it("pergunta genérica cai no resumo geral", () => {
    const r = perguntar("bom dia", ctx({ talhoes: [talhao({})] }));
    expect(r.intent).toBe("resumo-geral");
    expect(r.destaques && r.destaques.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Controle de acesso por papel
// ---------------------------------------------------------------------------
describe("responderSafraIA — permissões por papel", () => {
  it("Agrônomo não acessa lucratividade (sem módulo Financeiro)", () => {
    const r = perguntar("Qual a lucratividade por safra?", ctx({}), "agronomo");
    expect(r.intent).toBe("acesso-negado");
    expect(r.texto.toLowerCase()).toContain("não tem acesso");
  });

  it("Gerente Agrícola tem acesso financeiro", () => {
    const r = perguntar(
      "Qual a lucratividade por safra?",
      ctx({ lancamentos: [lancamento({ tipo: "RECEITA", valor: 500, nome_safra: "X" })] }),
      "gerente-agricola"
    );
    expect(r.intent).toBe("lucratividade-safra");
    expect(r.papel).toBe("gerente-agricola");
  });

  it("papel desconhecido não recebe dados da fazenda", () => {
    const r = responderSafraIA({
      pergunta: "Como está minha fazenda?",
      papel: "visitante",
      contexto: ctx({ talhoes: [talhao({})], lancamentos: [lancamento({ valor: 10000 })] }),
    });
    expect(r.intent).toBe("acesso-negado");
    expect(r.destaques).toBeUndefined();
  });

  it("operador consulta atividades, mas não recebe nomes ou custos da equipe", () => {
    const r = perguntar(
      "Quais atividades estão atrasadas?",
      ctx({ atividades: [atividade({ responsavel: "Segredo" })] }),
      "operador"
    );
    expect(r.intent).toBe("atividades-funcionarios");
    expect(r.texto).not.toContain("Segredo");
    expect(r.tabela).toBeUndefined();
  });

  it("PAPEIS_DEMO segue os módulos padrão e fallback genérico", () => {
    expect(PAPEIS_DEMO["gerente-agricola"].modulos).toContain("Financeiro");
    expect(PAPEIS_DEMO.agronomo.modulos).not.toContain("Financeiro");
    expect(perfilDemoSafraIA("visitante").papel).toBe("colaborador");
  });

  it("consulta propriedades para quem tem acesso e recusa financeiro e estoquista", () => {
    const contexto = ctx({
      propriedades: [
        { id_propriedade: 1, nome_propriedade: "Sede", status: true, area_total: 100 },
        { id_propriedade: 2, nome_propriedade: "Inativa", status: false, area_total: 50 },
      ],
    });
    const administrador = perguntar("Quantas propriedades eu tenho?", contexto);
    expect(administrador.destaques?.find((item) => item.rotulo === "Propriedades")?.valor).toBe("1");
    expect(perguntar("Quantas propriedades eu tenho?", contexto, "financeiro").intent).toBe("acesso-negado");
    expect(perguntar("Quantas propriedades eu tenho?", contexto, "estoquista").intent).toBe("acesso-negado");
  });
});

// ---------------------------------------------------------------------------
// Saudação inicial por papel
// ---------------------------------------------------------------------------
describe("saudacaoInicial", () => {
  it("usa a saudação e as sugestões do papel", () => {
    const r = saudacaoInicial("agronomo");
    expect(r.texto).toBe(PAPEIS_DEMO.agronomo.saudacao);
    expect(r.sugestoes).toEqual(PAPEIS_DEMO.agronomo.sugestoes);
  });
});
