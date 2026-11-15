import { describe, it, expect } from "vitest";
import {
  AtividadeAgricola,
  dataLocalISO,
  descricaoPendentes,
  isAtrasada,
} from "./atividade";

const atividade = (over: Partial<AtividadeAgricola>): AtividadeAgricola => ({
  id: "1",
  id_propriedade: 1,
  id_talhao: "1",
  tipo_atividade: "Gradagem",
  data_inicio: dataLocalISO(),
  status: "Planejada",
  ...over,
});

describe("dataLocalISO", () => {
  it("usa o dia local mesmo depois das 21h, quando o UTC já virou", () => {
    expect(dataLocalISO(new Date(2026, 10, 14, 23, 30))).toBe("2026-11-14");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    expect(dataLocalISO(new Date(2026, 0, 5, 8, 0))).toBe("2026-01-05");
  });
});

describe("isAtrasada", () => {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  it("não considera atrasada a atividade com prazo no dia local corrente", () => {
    expect(isAtrasada(atividade({}))).toBe(false);
  });

  it("considera atrasada a atividade não concluída com prazo vencido", () => {
    expect(isAtrasada(atividade({ data_inicio: dataLocalISO(ontem) }))).toBe(true);
  });

  it("respeita o valor calculado pelo backend quando ele vem na atividade", () => {
    expect(
      isAtrasada(atividade({ data_inicio: dataLocalISO(ontem), atrasada: false }))
    ).toBe(false);
  });
});

describe("descricaoPendentes", () => {
  it("descreve cada insumo sem baixa com a quantidade pedida e o saldo disponível", () => {
    const a = atividade({
      status: "Concluída",
      insumos: [
        { id_insumo: 1, nome: "Ureia", quantidade: 2, unidade: "kg", baixado: true },
        { id_insumo: 2, nome: "Calcário", quantidade: 100, unidade: "t", baixado: false },
      ],
      baixa_estoque: {
        geradas: 1,
        pendentes: [{ id_insumo: 2, nome: "Calcário", quantidade: 100, disponivel: 2.5 }],
      },
    });

    expect(descricaoPendentes(a)).toBe("Calcário (pede 100 t, disponível 2,5 t)");
  });

  it("fica vazia quando não há pendentes", () => {
    expect(descricaoPendentes(atividade({}))).toBe("");
    expect(
      descricaoPendentes(atividade({ baixa_estoque: { geradas: 2, pendentes: [] } }))
    ).toBe("");
  });
});
