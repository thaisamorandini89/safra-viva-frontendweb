import { describe, it, expect, vi, beforeEach } from "vitest";

// Simula o cliente HTTP: api.ts usa a instância devolvida por axios.create()
const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("axios", () => ({ default: { create: () => http } }));

import {
  getProdutos,
  criarFornecedor,
  atualizarFornecedor,
  excluirFornecedor,
  criarFabricante,
  atualizarFabricante,
  excluirFabricante,
  criarMarca,
  atualizarMarca,
  excluirMarca,
} from "./api";

const recusa = (error: string) => ({ response: { status: 400, data: { error } } });
const semRede = new Error("Network Error");

const escritas: [string, () => Promise<unknown>][] = [
  ["criarFornecedor", () => criarFornecedor({ nome_fornecedor: "Agro" })],
  ["atualizarFornecedor", () => atualizarFornecedor(1, { status: false })],
  ["excluirFornecedor", () => excluirFornecedor(1)],
  ["criarFabricante", () => criarFabricante({ nome_fabricante: "Bayer" })],
  ["atualizarFabricante", () => atualizarFabricante(2, { website: "x" })],
  ["excluirFabricante", () => excluirFabricante(2)],
  ["criarMarca", () => criarMarca("Petrofértil")],
  ["atualizarMarca", () => atualizarMarca(3, "Nova")],
  ["excluirMarca", () => excluirMarca(3)],
];

beforeEach(() => {
  Object.values(http).forEach((f) => f.mockReset());
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("Cadastros de apoio", () => {
  it("usam as rotas do backend", async () => {
    Object.values(http).forEach((f) => f.mockResolvedValue({ data: {} }));

    await criarFornecedor({ nome_fornecedor: "Agro" });
    expect(http.post).toHaveBeenLastCalledWith("/api/fornecedores", { nome_fornecedor: "Agro" });
    await atualizarFornecedor(1, { status: false });
    expect(http.put).toHaveBeenLastCalledWith("/api/fornecedores/1", { status: false });
    await excluirFornecedor(1);
    expect(http.delete).toHaveBeenLastCalledWith("/api/fornecedores/1");

    await criarFabricante({ nome_fabricante: "Bayer" });
    expect(http.post).toHaveBeenLastCalledWith("/api/fabricantes", { nome_fabricante: "Bayer" });
    await atualizarFabricante(2, { website: "x" });
    expect(http.put).toHaveBeenLastCalledWith("/api/fabricantes/2", { website: "x" });
    await excluirFabricante(2);
    expect(http.delete).toHaveBeenLastCalledWith("/api/fabricantes/2");

    await criarMarca("Petrofértil");
    expect(http.post).toHaveBeenLastCalledWith("/api/marcas", { descricao_marca: "Petrofértil" });
    await atualizarMarca(3, "Nova");
    expect(http.put).toHaveBeenLastCalledWith("/api/marcas/3", { descricao_marca: "Nova" });
    await excluirMarca(3);
    expect(http.delete).toHaveBeenLastCalledWith("/api/marcas/3");
  });

  it.each(escritas)("%s: recusa do backend é propagada", async (_n, chamar) => {
    Object.values(http).forEach((f) => f.mockRejectedValue(recusa("O fornecedor está em uso.")));
    await expect(chamar()).rejects.toThrow("O fornecedor está em uso.");
  });

  it.each(escritas)("%s: sem resposta, falha em vez de salvar em memória", async (_n, chamar) => {
    Object.values(http).forEach((f) => f.mockRejectedValue(semRede));
    await expect(chamar()).rejects.toThrow("Não foi possível falar com o servidor.");
  });

  it("getProdutos traduz os produtos do backend", async () => {
    http.get.mockResolvedValue({
      data: [
        {
          id_produto: 4,
          nome_produto: "Ureia 45%",
          categoria_nome: "fertilizantes",
          subcategoria: "Ureia",
          unidade_medida: "kg",
          id_fabricante: 3,
          id_marca: null,
          id_fornecedor: 5,
          registro_mapa: "",
          status: false,
        },
      ],
    });
    expect(await getProdutos()).toEqual([
      {
        id_produto: 4,
        nome: "Ureia 45%",
        categoria: "Fertilizantes",
        tipo: "Ureia",
        unidade_medida: "kg",
        id_fabricante: 3,
        id_marca: undefined,
        id_fornecedor: 5,
        registro_mapa: undefined,
        ficha_tecnica: undefined,
        observacoes: undefined,
        ativo: false,
      },
    ]);
    expect(http.get).toHaveBeenCalledWith("/api/produtos");
  });

  it("getProdutos sem resposta devolve lista vazia", async () => {
    http.get.mockRejectedValue(semRede);
    expect(await getProdutos()).toEqual([]);
  });
});
