import { describe, it, expect } from "vitest";
import { mapAtividade } from "./api";

describe("mapAtividade", () => {
  const raw = {
    id_atividade_agricola: 9,
    id_talhao: 7,
    tipo_atividade: "Adubação",
    data_inicio: "2026-11-10",
    data_fim: "2026-11-12",
    status: "Concluída",
    insumos: [
      { id_insumo: 1, nome: "Ureia", unidade: "kg", quantidade: 2, custo: null, baixado: true, id_movimentacao: "abc" },
      { id_insumo: 2, nome: "Calcário", unidade: "t", quantidade: 100, custo: 50, baixado: false, id_movimentacao: null },
    ],
    baixa_estoque: {
      geradas: 1,
      pendentes: [{ id_insumo: 2, nome: "Calcário", quantidade: 100, disponivel: 2 }],
    },
  };

  it("traduz a situação da baixa de cada insumo", () => {
    expect(mapAtividade(raw).insumos).toEqual([
      { id_insumo: 1, nome: "Ureia", unidade: "kg", quantidade: 2, custo: undefined, baixado: true, id_movimentacao: "abc" },
      { id_insumo: 2, nome: "Calcário", unidade: "t", quantidade: 100, custo: 50, baixado: false, id_movimentacao: null },
    ]);
  });

  it("traduz as saídas geradas e os insumos pendentes", () => {
    expect(mapAtividade(raw).baixa_estoque).toEqual({
      geradas: 1,
      pendentes: [{ id_insumo: 2, nome: "Calcário", quantidade: 100, disponivel: 2 }],
    });
  });

  it("assume nenhuma baixa quando o backend não informa", () => {
    const a = mapAtividade({ id_atividade_agricola: 1, insumos: [{ id_insumo: 1, nome: "Ureia" }] });
    expect(a.baixa_estoque).toEqual({ geradas: 0, pendentes: [] });
    expect(a.insumos?.[0]).toMatchObject({ baixado: false, id_movimentacao: null });
  });
});
