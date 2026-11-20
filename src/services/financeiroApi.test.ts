import { describe, it, expect, vi, beforeEach } from "vitest";

// Simula o cliente HTTP: api.ts usa a instância devolvida por axios.create()
const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("axios", () => ({ default: { create: () => ({ ...http, interceptors: { request: { use: () => {} } } }) } }));

import {
  getLancamentos,
  getTodosLancamentos,
  getSafras,
  getCentrosCusto,
  getIndicadores,
  getFluxoCaixa,
  getFinanceiroSaldo,
  criarLancamento,
  atualizarLancamento,
  excluirLancamento,
  conciliarLancamento,
  criarSafra,
  atualizarSafra,
  excluirSafra,
  criarCentroCusto,
  atualizarCentroCusto,
  excluirCentroCusto,
} from "./api";
import {
  LANCAMENTOS_MOCK,
  SAFRAS_MOCK,
  CENTROS_CUSTO_MOCK,
  filtrarLancamentosMock,
  indicadoresMock,
  fluxoCaixaMock,
  saldoMock,
} from "./financeiroMock";
import { NovoLancamentoPayload, SafraPayload } from "../types/financeiro";

/** O backend respondeu recusando a operação */
const recusa = (error: string, details?: unknown[]) => ({
  response: { status: 400, data: { error, details } },
});
/** Não houve resposta: a requisição nem chegou ao backend */
const semRede = new Error("Network Error");
/** O proxy do Vite respondeu no lugar do backend parado */
const proxySemBackend = { response: { status: 500, data: "" } };

const SEM_SERVIDOR = "Não foi possível falar com o servidor. Tente novamente.";

const lancamento: NovoLancamentoPayload = {
  tipo: "DESPESA",
  categoria: "Combustível",
  data_lancamento: "2026-03-01",
  valor: 100,
};
const safra: SafraPayload = {
  nome: "Soja 2026/27",
  cultura: "Soja",
  id_propriedade: 2,
  data_inicio: "2026-09-01",
};

const leituras: [string, () => Promise<unknown>, () => unknown][] = [
  ["getLancamentos", () => getLancamentos(), () => filtrarLancamentosMock()],
  ["getTodosLancamentos", () => getTodosLancamentos(), () => LANCAMENTOS_MOCK],
  ["getSafras", () => getSafras(), () => SAFRAS_MOCK],
  ["getCentrosCusto", () => getCentrosCusto(), () => CENTROS_CUSTO_MOCK],
  ["getIndicadores", () => getIndicadores("safra"), () => indicadoresMock("safra")],
  ["getFluxoCaixa", () => getFluxoCaixa(), () => fluxoCaixaMock()],
  ["getFinanceiroSaldo", () => getFinanceiroSaldo(), () => saldoMock()],
];
const listas = leituras.filter(([nome]) => nome !== "getFinanceiroSaldo");

const escritasSemDemonstracao: [string, () => Promise<unknown>][] = [
  ["criarSafra", () => criarSafra(safra)],
  ["atualizarSafra", () => atualizarSafra(7, { status: false })],
  ["excluirSafra", () => excluirSafra(7)],
  ["criarCentroCusto", () => criarCentroCusto({ nome: "Lavoura", tipo: "OPERACIONAL" })],
  ["atualizarCentroCusto", () => atualizarCentroCusto(3, { nome: "Sede" })],
  ["excluirCentroCusto", () => excluirCentroCusto(3)],
  ["conciliarLancamento", () => conciliarLancamento("abc", true)],
];

function todas(resultado: (f: ReturnType<typeof vi.fn>) => void) {
  Object.values(http).forEach(resultado);
}

beforeEach(() => {
  todas((f) => f.mockReset());
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("Financeiro: leituras", () => {
  it.each(listas)("%s: resposta vazia do backend vale como lista vazia", async (_n, chamar) => {
    http.get.mockResolvedValue({ data: [] });
    expect(await chamar()).toEqual([]);
  });

  it("getFinanceiroSaldo: saldo zerado do backend é mantido", async () => {
    const zerado = { receita_total: 0, despesa_total: 0, saldo: 0 };
    http.get.mockResolvedValue({ data: zerado });
    expect(await getFinanceiroSaldo()).toEqual(zerado);
  });

  it.each(leituras)("%s: falha de rede devolve demonstração", async (_n, chamar, demonstracao) => {
    http.get.mockRejectedValue(semRede);
    expect(await chamar()).toEqual(demonstracao());
  });

  it.each(leituras)("%s: proxy sem backend devolve demonstração", async (_n, chamar, demonstracao) => {
    http.get.mockRejectedValue(proxySemBackend);
    expect(await chamar()).toEqual(demonstracao());
  });

  it.each(leituras)("%s: recusa do backend é propagada", async (_n, chamar) => {
    http.get.mockRejectedValue(recusa("Data inválida em 'data_inicio'."));
    await expect(chamar()).rejects.toThrow("Data inválida em 'data_inicio'.");
  });

  it("getSafras: a demonstração respeita a propriedade pedida", async () => {
    http.get.mockRejectedValue(semRede);
    const id = SAFRAS_MOCK[0].id_propriedade;
    const safras = await getSafras(id);
    expect(safras.length).toBeGreaterThan(0);
    expect(safras.every((s) => s.id_propriedade === id)).toBe(true);
  });
});

describe("Financeiro: lançamentos", () => {
  it("recusa ao criar é propagada com os detalhes e nada é salvo em memória", async () => {
    const antes = LANCAMENTOS_MOCK.length;
    http.post.mockRejectedValue(
      recusa("Dados inválidos.", [{ campo: "valor", mensagem: "deve ser maior que zero" }])
    );
    await expect(criarLancamento(lancamento)).rejects.toThrow(
      "Dados inválidos. valor: deve ser maior que zero"
    );
    expect(LANCAMENTOS_MOCK.length).toBe(antes);
  });

  it("recusa ao editar é propagada e nada é salvo em memória", async () => {
    const antes = LANCAMENTOS_MOCK.length;
    http.put.mockRejectedValue(recusa("Lançamento conciliado não pode ser alterado."));
    await expect(atualizarLancamento("abc", lancamento)).rejects.toThrow(
      "Lançamento conciliado não pode ser alterado."
    );
    expect(LANCAMENTOS_MOCK.length).toBe(antes);
  });

  it("recusa ao excluir é propagada", async () => {
    http.delete.mockRejectedValue(recusa("Lançamento conciliado não pode ser excluído."));
    await expect(excluirLancamento("abc")).rejects.toThrow(
      "Lançamento conciliado não pode ser excluído."
    );
  });

  it("sem resposta do backend, cria e exclui na demonstração", async () => {
    const antes = LANCAMENTOS_MOCK.length;
    http.post.mockRejectedValue(semRede);
    http.delete.mockRejectedValue(semRede);

    const criado = await criarLancamento(lancamento);
    expect(criado.id_lancamento).toMatch(/^mock-/);
    expect(LANCAMENTOS_MOCK.length).toBe(antes + 1);

    await excluirLancamento(criado.id_lancamento);
    expect(LANCAMENTOS_MOCK.length).toBe(antes);
  });

  it("resposta do backend ao criar é devolvida como veio", async () => {
    const salvo = { ...lancamento, id_lancamento: "abc", status: "PENDENTE", conciliado: false };
    http.post.mockResolvedValue({ data: salvo });
    expect(await criarLancamento(lancamento)).toEqual(salvo);
    expect(http.post).toHaveBeenCalledWith("/api/lancamentos", lancamento);
  });
});

describe("Financeiro: safra, centro de custo e conciliação", () => {
  it("usam as rotas do backend", async () => {
    todas((f) => f.mockResolvedValue({ data: { ok: true } }));

    expect(await criarSafra(safra)).toEqual({ ok: true });
    expect(http.post).toHaveBeenLastCalledWith("/api/safras", safra);
    await atualizarSafra(7, { status: false });
    expect(http.put).toHaveBeenLastCalledWith("/api/safras/7", { status: false });
    await excluirSafra(7);
    expect(http.delete).toHaveBeenLastCalledWith("/api/safras/7");

    await criarCentroCusto({ nome: "Lavoura", tipo: "OPERACIONAL" });
    expect(http.post).toHaveBeenLastCalledWith("/api/centros-custo", {
      nome: "Lavoura",
      tipo: "OPERACIONAL",
    });
    await atualizarCentroCusto(3, { nome: "Sede" });
    expect(http.put).toHaveBeenLastCalledWith("/api/centros-custo/3", { nome: "Sede" });
    await excluirCentroCusto(3);
    expect(http.delete).toHaveBeenLastCalledWith("/api/centros-custo/3");

    await conciliarLancamento("abc", true);
    expect(http.put).toHaveBeenLastCalledWith("/api/lancamentos/abc/conciliacao", {
      conciliado: true,
    });
  });

  it.each(escritasSemDemonstracao)("%s: recusa do backend é propagada", async (_n, chamar) => {
    todas((f) => f.mockRejectedValue(recusa("A safra está em uso por lançamentos financeiros.")));
    await expect(chamar()).rejects.toThrow("A safra está em uso por lançamentos financeiros.");
  });

  it.each(escritasSemDemonstracao)("%s: sem resposta, falha em vez de salvar em memória", async (_n, chamar) => {
    todas((f) => f.mockRejectedValue(semRede));
    await expect(chamar()).rejects.toThrow(SEM_SERVIDOR);
  });
});
