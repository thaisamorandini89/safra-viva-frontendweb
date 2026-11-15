import { describe, it, expect } from "vitest";
import {
  insumoDaApi,
  movimentacaoDaApi,
  movimentacaoParaApi,
  erroDoBackend,
} from "./insumosAdapter";
import { NovaMovimentacaoPayload } from "../types/insumo";

describe("insumoDaApi", () => {
  const raw = {
    id_insumo: 6,
    nome_produto: "Calcário Dolomítico",
    categoria_nome: "corretivos",
    unidade_medida: "t",
    fabricante_nome: "Calcário Brasil",
    descricao_marca: "",
    estoque_atual: 12.5,
    estoque_minimo: 2,
    valor_unitario: 180,
    status: true,
  };

  it("traduz os campos do backend para o formato das telas", () => {
    expect(insumoDaApi(raw)).toEqual({
      id: "6",
      nome: "Calcário Dolomítico",
      categoria: "Corretivos",
      unidade_medida: "t",
      fabricante: "Calcário Brasil",
      marca: undefined,
      estoque_atual: 12.5,
      estoque_minimo: 2,
      valor_unitario: 180,
      status: "Ativo",
      lotes: [],
    });
  });

  it("usa uma categoria conhecida quando a do backend não existe nas telas", () => {
    expect(insumoDaApi({ ...raw, categoria_nome: "Outra Coisa" }).categoria).toBe(
      "Fertilizantes"
    );
  });

  it("marca como inativo o insumo com status falso", () => {
    expect(insumoDaApi({ ...raw, status: false }).status).toBe("Inativo");
  });
});

describe("movimentacaoDaApi", () => {
  it("traduz uma saída vinculada a uma operação", () => {
    const m = movimentacaoDaApi({
      id_movimentacao: "abc",
      id_insumo: 6,
      nome_produto: "Calcário Dolomítico",
      tipo_movimentacao: "SAIDA",
      quantidade: 2,
      valor_unitario: null,
      data_movimentacao: "2026-11-14 02:10:00",
      id_funcionario: "uuid-1",
      funcionario_nome: "Maria Souza",
      id_talhao: 7,
      codigo_talhao: "TLH-009",
      nome_talhao: "Talhão Sede",
      safra: "2026/2027",
      id_atividade: 3,
      id_atividade_agricola: 12,
      atividade_descricao: "Gradagem",
      destino_finalidade: "Preparo",
      observacao: "ok",
    });

    expect(m).toMatchObject({
      id: "abc",
      id_insumo: "6",
      nome_insumo: "Calcário Dolomítico",
      tipo: "Saída",
      quantidade: 2,
      valor_unitario: undefined,
      data_movimentacao: "2026-11-14",
      id_responsavel: "uuid-1",
      responsavel: "Maria Souza",
      id_talhao: "7",
      codigo_talhao: "TLH-009",
      id_atividade: "12",
      atividade: "Gradagem",
      destino: "Preparo",
      observacao: "ok",
    });
  });

  it("traduz uma entrada sem talhão nem operação", () => {
    const m = movimentacaoDaApi({
      id_movimentacao: "def",
      id_insumo: 6,
      tipo_movimentacao: "ENTRADA",
      quantidade: 10,
      data_movimentacao: "2026-11-10 12:00:00",
      fornecedor_nome: "Agro Insumos",
      numero_nota_fiscal: "NF-1",
      numero_lote: "L-1",
      data_validade: "2027-01-01",
      id_talhao: null,
      codigo_talhao: null,
      nome_talhao: "",
      id_atividade_agricola: null,
      atividade_descricao: "",
    });

    expect(m.tipo).toBe("Entrada");
    expect(m.fornecedor).toBe("Agro Insumos");
    expect(m.nota_fiscal).toBe("NF-1");
    expect(m.data_validade).toBe("2027-01-01");
    expect(m.id_talhao).toBeUndefined();
    expect(m.id_atividade).toBeUndefined();
    expect(m.atividade).toBeUndefined();
  });
});

describe("movimentacaoParaApi", () => {
  const base: NovaMovimentacaoPayload = {
    id_insumo: "6",
    tipo: "Saída",
    quantidade: 2,
    data_movimentacao: "2026-11-14",
    id_responsavel: "uuid-1",
  };

  it("envia a operação e o destino numa saída, sem campos de entrada", () => {
    const p = movimentacaoParaApi({
      ...base,
      id_talhao: "7",
      id_atividade: "12",
      safra: "2026/2027",
      destino: "Preparo",
      id_fornecedor: 3,
      nota_fiscal: "NF-1",
    });

    expect(p).toMatchObject({
      id_insumo: 6,
      tipo_movimentacao: "SAIDA",
      quantidade: 2,
      data_movimentacao: "2026-11-14",
      id_funcionario: "uuid-1",
      id_talhao: 7,
      id_atividade_agricola: 12,
      safra: "2026/2027",
      destino_finalidade: "Preparo",
    });
    expect(p).not.toHaveProperty("id_fornecedor");
    expect(p).not.toHaveProperty("numero_nota_fiscal");
    expect(p).not.toHaveProperty("id_atividade");
  });

  it("envia fornecedor, nota e lote numa entrada, sem campos de saída", () => {
    const p = movimentacaoParaApi({
      ...base,
      tipo: "Entrada",
      id_fornecedor: 3,
      nota_fiscal: "NF-1",
      numero_lote: "L-1",
      data_fabricacao: null,
      data_validade: "2027-01-01",
      id_talhao: "7",
      id_atividade: "12",
    });

    expect(p).toMatchObject({
      tipo_movimentacao: "ENTRADA",
      id_fornecedor: 3,
      numero_nota_fiscal: "NF-1",
      numero_lote: "L-1",
      data_fabricacao: undefined,
      data_validade: "2027-01-01",
    });
    expect(p).not.toHaveProperty("id_talhao");
    expect(p).not.toHaveProperty("id_atividade_agricola");
  });

  it("omite talhão e operação quando a saída não os informa", () => {
    const p = movimentacaoParaApi({ ...base, destino: "Cocho" }) as any;
    expect(p.id_talhao).toBeUndefined();
    expect(p.id_atividade_agricola).toBeUndefined();
  });
});

describe("erroDoBackend", () => {
  it("devolve a mensagem quando o backend recusou a operação", () => {
    const erro = erroDoBackend({
      response: { status: 400, data: { error: "Saldo insuficiente para a saida." } },
    });
    expect(erro?.message).toBe("Saldo insuficiente para a saida.");
  });

  it("acrescenta os detalhes de validação", () => {
    const erro = erroDoBackend({
      response: {
        status: 400,
        data: {
          error: "Dados da movimentação inválidos.",
          details: [{ campo: "id_insumo", mensagem: "Input should be a valid integer" }],
        },
      },
    });
    expect(erro?.message).toBe(
      "Dados da movimentação inválidos. id_insumo: Input should be a valid integer"
    );
  });

  it("devolve null sem resposta do backend (rede ou proxy)", () => {
    expect(erroDoBackend(new Error("Network Error"))).toBeNull();
    expect(erroDoBackend({ response: { status: 500, data: "" } })).toBeNull();
  });
});
