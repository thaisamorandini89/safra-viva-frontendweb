import { describe, it, expect } from "vitest";
import {
  insumoDaApi,
  insumoParaApi,
  movimentacaoDaApi,
  movimentacaoParaApi,
  erroDoBackend,
} from "./insumosAdapter";
import { NovaMovimentacaoPayload, NovoInsumoPayload } from "../types/insumo";

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

  it("traduz os dados complementares do produto e a propriedade", () => {
    const i = insumoDaApi({
      ...raw,
      id_produto: 1,
      subcategoria: "Calcário",
      id_fabricante: 3,
      id_marca: 4,
      descricao_marca: "Calcário Top",
      id_fornecedor: 5,
      fornecedor_nome: "Agro Insumos Ltda.",
      registro_mapa: "MAPA-1",
      ficha_tecnica: "ficha",
      observacoes: "obs",
      id_propriedade: 4,
      nome_propriedade: "Fazenda Alegria",
    });

    expect(i).toMatchObject({
      id_produto: 1,
      tipo: "Calcário",
      id_fabricante: 3,
      id_marca: 4,
      marca: "Calcário Top",
      id_fornecedor: 5,
      fornecedor: "Agro Insumos Ltda.",
      registro_mapa: "MAPA-1",
      ficha_tecnica: "ficha",
      observacoes: "obs",
      id_propriedade: 4,
      nome_propriedade: "Fazenda Alegria",
    });
  });

  it("deixa sem valor os vínculos que o backend devolve nulos ou vazios", () => {
    const i = insumoDaApi({
      ...raw,
      id_fabricante: null,
      fabricante_nome: "",
      id_fornecedor: null,
      fornecedor_nome: "",
      id_propriedade: null,
      nome_propriedade: "",
    });

    expect(i.id_fabricante).toBeUndefined();
    expect(i.fabricante).toBeUndefined();
    expect(i.id_fornecedor).toBeUndefined();
    expect(i.fornecedor).toBeUndefined();
    expect(i.id_propriedade).toBeUndefined();
    expect(i.nome_propriedade).toBeUndefined();
  });

  it("traduz os lotes do insumo", () => {
    const i = insumoDaApi({
      ...raw,
      lotes: [
        { id_lote: 3, numero_lote: "L-1", data_fabricacao: null, data_validade: "2027-01-01", quantidade: 4.5 },
      ],
    });

    expect(i.lotes).toEqual([
      { id: "3", id_insumo: "6", numero_lote: "L-1", data_fabricacao: null, data_validade: "2027-01-01", quantidade: 4.5 },
    ]);
  });
});

describe("insumoParaApi com produto existente", () => {
  const form: NovoInsumoPayload = {
    id_produto: 9,
    nome: "Ureia 45%",
    categoria: "Fertilizantes",
    id_categoria_insumo: 2,
    unidade_medida: "kg",
    estoque_atual: 0,
    estoque_minimo: 5,
    valor_unitario: 4.1,
    status: "Ativo",
  };

  it("na criação envia só o id do produto, sem produto novo", () => {
    expect(insumoParaApi(form)).toEqual({
      id_produto: 9,
      estoque_minimo: 5,
      valor_unitario: 4.1,
      id_propriedade: null,
      status: true,
      estoque_atual: 0,
    });
  });

  it("na edição continua enviando os dados do produto", () => {
    const enviado = insumoParaApi(form, true) as Record<string, unknown>;
    expect(enviado.id_produto).toBeUndefined();
    expect(enviado.produto).toMatchObject({ nome_produto: "Ureia 45%" });
  });
});

describe("insumoParaApi", () => {
  const form: NovoInsumoPayload = {
    nome: "Ureia 45%",
    categoria: "Fertilizantes",
    id_categoria_insumo: 2,
    tipo: "Ureia",
    unidade_medida: "kg",
    id_fabricante: 3,
    fabricante: "Petrobras",
    id_marca: 4,
    marca: "Petrofértil",
    id_fornecedor: 5,
    fornecedor: "Agro Insumos Ltda.",
    estoque_atual: 100,
    estoque_minimo: 20,
    valor_unitario: 4.1,
    status: "Ativo",
    id_propriedade: 4,
    nome_propriedade: "Fazenda Alegria",
    registro_mapa: "MAPA-1",
  };

  it("monta o produto aninhado e os dados de estoque na criação", () => {
    expect(insumoParaApi(form)).toEqual({
      produto: {
        nome_produto: "Ureia 45%",
        id_categoria_insumo: 2,
        subcategoria: "Ureia",
        unidade_medida: "kg",
        id_fabricante: 3,
        id_marca: 4,
        id_fornecedor: 5,
        registro_mapa: "MAPA-1",
        ficha_tecnica: null,
        observacoes: null,
      },
      estoque_atual: 100,
      estoque_minimo: 20,
      valor_unitario: 4.1,
      id_propriedade: 4,
      status: true,
    });
  });

  it("envia os dados da entrada do estoque inicial na criação", () => {
    const p = insumoParaApi({
      ...form,
      entrada_inicial: {
        id_responsavel: "uuid-1",
        numero_lote: "L-1",
        data_fabricacao: null,
        data_validade: "2027-01-01",
      },
    });

    expect(p).toMatchObject({
      estoque_atual: 100,
      entrada_inicial: {
        id_funcionario: "uuid-1",
        numero_lote: "L-1",
        data_fabricacao: undefined,
        data_validade: "2027-01-01",
      },
    });
  });

  it("não envia a entrada inicial sem estoque inicial nem na edição", () => {
    const entrada_inicial = { id_responsavel: "uuid-1", numero_lote: "L-1" };

    expect(insumoParaApi({ ...form, estoque_atual: 0, entrada_inicial })).not.toHaveProperty(
      "entrada_inicial"
    );
    expect(insumoParaApi({ ...form, entrada_inicial }, true)).not.toHaveProperty(
      "entrada_inicial"
    );
    expect(insumoParaApi(form)).not.toHaveProperty("entrada_inicial");
  });

  it("não envia o saldo na edição", () => {
    const p = insumoParaApi({ ...form, status: "Inativo" }, true);
    expect(p).not.toHaveProperty("estoque_atual");
    expect(p).toMatchObject({ estoque_minimo: 20, status: false });
  });

  it("envia nulo para limpar vínculos e campos opcionais não informados", () => {
    const p = insumoParaApi(
      { nome: "X", categoria: "Sementes", unidade_medida: "sc", estoque_atual: 0, estoque_minimo: 0, valor_unitario: 0, status: "Ativo" },
      true
    );
    expect(p.produto).toMatchObject({
      subcategoria: null,
      id_fabricante: null,
      id_marca: null,
      id_fornecedor: null,
    });
    expect(p.id_propriedade).toBeNull();
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

  it("traduz os lotes afetados pela movimentação", () => {
    const m = movimentacaoDaApi({
      id_movimentacao: "ghi",
      id_insumo: 6,
      tipo_movimentacao: "SAIDA",
      quantidade: 5,
      lotes: [
        { id_lote: 1, numero_lote: "L-1", data_validade: "2027-01-01", quantidade: 1 },
        { id_lote: 2, numero_lote: "L-2", data_validade: null, quantidade: 4 },
      ],
    });

    expect(m.lotes).toEqual([
      { id_lote: "1", numero_lote: "L-1", data_validade: "2027-01-01", quantidade: 1 },
      { id_lote: "2", numero_lote: "L-2", data_validade: null, quantidade: 4 },
    ]);
    expect(movimentacaoDaApi({ id_movimentacao: "jkl" }).lotes).toEqual([]);
  });

  it("identifica a entrada do estoque inicial do cadastro", () => {
    const m = movimentacaoDaApi({
      id_movimentacao: "pqr",
      tipo_movimentacao: "ENTRADA",
      origem: "CADASTRO",
    });
    expect(m).toMatchObject({ tipo: "Entrada", origem: "Cadastro" });
  });

  it("identifica a saída gerada pela conclusão de uma atividade", () => {
    const base = { id_movimentacao: "mno", tipo_movimentacao: "SAIDA", unidade_medida: "kg" };
    expect(movimentacaoDaApi({ ...base, origem: "ATIVIDADE" })).toMatchObject({
      origem: "Atividade",
      unidade_medida: "kg",
    });
    expect(movimentacaoDaApi({ ...base, origem: "MANUAL" }).origem).toBe("Manual");
    expect(movimentacaoDaApi(base).origem).toBe("Manual");
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

  it("envia o lote do descarte numa saída e nunca numa entrada", () => {
    const descarte = movimentacaoParaApi({ ...base, id_lote: "9", numero_lote: "L-9" });
    expect(descarte).toMatchObject({ id_lote: 9 });
    expect(descarte).not.toHaveProperty("numero_lote");

    expect(movimentacaoParaApi({ ...base, tipo: "Entrada", id_lote: "9" })).not.toHaveProperty(
      "id_lote"
    );
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
