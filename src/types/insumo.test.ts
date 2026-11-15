import { describe, it, expect } from "vitest";
import { dataLocalISO } from "./atividade";
import {
  Insumo,
  MovimentacaoEstoque,
  lotesDaMovimentacao,
  lotesVencidos,
  origemDaEntrada,
  saldoUtilizavel,
} from "./insumo";

const dia = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dataLocalISO(d);
};

const insumo = (estoque: number, lotes: [string, string | null, number][]): Insumo => ({
  id: "1",
  nome: "Ureia",
  categoria: "Fertilizantes",
  unidade_medida: "kg",
  estoque_atual: estoque,
  estoque_minimo: 0,
  valor_unitario: 0,
  status: "Ativo",
  lotes: lotes.map(([numero_lote, data_validade, quantidade], n) => ({
    id: String(n),
    id_insumo: "1",
    numero_lote,
    data_validade,
    quantidade,
  })),
});

describe("saldoUtilizavel", () => {
  it("desconta do estoque o saldo dos lotes vencidos", () => {
    expect(saldoUtilizavel(insumo(30, [["LV", dia(-1), 6], ["L1", dia(30), 15]]))).toBe(24);
  });

  it("não trata como vencido o lote que vence hoje nem o lote sem validade", () => {
    const i = insumo(10, [["LH", dia(0), 2], ["LS", null, 3]]);
    expect(lotesVencidos(i)).toEqual([]);
    expect(saldoUtilizavel(i)).toBe(10);
  });

  it("ignora o lote vencido que já não tem saldo", () => {
    expect(saldoUtilizavel(insumo(10, [["LV", dia(-1), 0]]))).toBe(10);
  });

  it("vale o estoque inteiro quando o insumo não tem lotes", () => {
    expect(saldoUtilizavel(insumo(7, []))).toBe(7);
  });
});

describe("lotesDaMovimentacao", () => {
  const mov = (extra: Partial<MovimentacaoEstoque>): MovimentacaoEstoque => ({
    id: "m",
    id_insumo: "1",
    tipo: "Saída",
    quantidade: 5,
    data_movimentacao: "2026-11-15",
    id_responsavel: "",
    ...extra,
  });
  const lote = (numero_lote: string, quantidade: number) => ({ id_lote: numero_lote, numero_lote, quantidade });

  it("mostra só o número quando a movimentação inteira é de um lote", () => {
    expect(lotesDaMovimentacao(mov({ lotes: [lote("L-1", 5)] }), "kg")).toBe("L-1");
  });

  it("mostra a quantidade de cada lote quando são vários ou parte saiu sem lote", () => {
    expect(lotesDaMovimentacao(mov({ lotes: [lote("L-1", 1), lote("L-2", 4)] }), "kg")).toBe(
      "L-1 (1 kg), L-2 (4 kg)"
    );
    expect(lotesDaMovimentacao(mov({ lotes: [lote("L-1", 3)] }), "kg")).toBe("L-1 (3 kg)");
  });

  it("usa o número de lote da entrada quando não há lista de lotes", () => {
    expect(lotesDaMovimentacao(mov({ tipo: "Entrada", numero_lote: "L-9" }))).toBe("L-9");
    expect(lotesDaMovimentacao(mov({}))).toBe("");
  });
});

describe("origemDaEntrada", () => {
  const entrada = (extra: Partial<MovimentacaoEstoque>): MovimentacaoEstoque => ({
    id: "m",
    id_insumo: "1",
    tipo: "Entrada",
    quantidade: 5,
    data_movimentacao: "2026-11-15",
    id_responsavel: "",
    ...extra,
  });

  it("rotula a entrada do cadastro como estoque inicial, com o fornecedor quando houver", () => {
    expect(origemDaEntrada(entrada({ origem: "Cadastro" }))).toBe("Estoque inicial");
    expect(origemDaEntrada(entrada({ origem: "Cadastro", fornecedor: "Agro Ltda." }))).toBe(
      "Estoque inicial · Agro Ltda."
    );
  });

  it("mostra o fornecedor nas demais entradas", () => {
    expect(origemDaEntrada(entrada({ origem: "Manual", fornecedor: "Agro Ltda." }))).toBe(
      "Agro Ltda."
    );
    expect(origemDaEntrada(entrada({}))).toBe("—");
  });
});
