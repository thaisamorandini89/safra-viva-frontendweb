import { describe, it, expect } from "vitest";
import { AtividadeAgricola, dataLocalISO, isAtrasada } from "./atividade";

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
