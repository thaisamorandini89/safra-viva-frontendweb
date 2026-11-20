import { describe, it, expect, vi, beforeEach } from "vitest";

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
const token = vi.hoisted(() => ({ valor: null as string | null }));

vi.mock("axios", () => ({
  default: {
    create: () => ({ ...http, interceptors: { request: { use: () => {} } } }),
    isAxiosError: (e: unknown) => Boolean((e as { isAxiosError?: boolean })?.isAxiosError),
  },
}));
vi.mock("./authToken", () => ({ lerToken: () => token.valor }));
vi.mock("./safraIAMock", () => ({
  responderSafraIA: () => ({ intent: "mock", texto: "resposta local" }),
  perfilDemoSafraIA: (papel: string) => ({
    papel,
    nome_papel: papel,
    foco: "foco local",
    saudacao: "saudação local",
    sugestoes: [],
    consultas: [],
  }),
}));

import { consultarSafraIA, getPerfilSafraIA } from "./api";
import { SafraIAConsultaPayload } from "../types/safraIA";

const payload = {
  pergunta: "Quantos hectares livres?",
  papel: "proprietario",
  contexto: { insumos: [], movimentacoes: [], talhoes: [], atividades: [], lancamentos: [], safras: [], propriedades: [] },
} as SafraIAConsultaPayload;

describe("consultarSafraIA", () => {
  beforeEach(() => {
    http.get.mockReset();
    http.post.mockReset();
    token.valor = "jwt";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("getPerfilSafraIA", () => {
    beforeEach(() => {
      http.get.mockReset();
      token.valor = "jwt";
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("sem token usa o papel local do usuário", async () => {
      token.valor = null;
      const perfil = await getPerfilSafraIA("agronomo");
      expect(http.get).not.toHaveBeenCalled();
      expect(perfil.papel).toBe("agronomo");
    });

    it("com token busca o perfil autenticado no backend", async () => {
      http.get.mockResolvedValue({
        data: {
          papel: "administrador",
          nome_papel: "Administrador",
          foco: "Visão ampla",
          saudacao: "Olá",
          sugestoes: ["Quantas propriedades temos?"],
          consultas: [],
        },
      });
      const perfil = await getPerfilSafraIA("agronomo");
      expect(http.get).toHaveBeenCalledWith("/api/safra-ia/perfil");
      expect(perfil.papel).toBe("administrador");
    });

    it("backend indisponível usa o papel local do usuário", async () => {
      http.get.mockRejectedValue({ isAxiosError: true, message: "Network Error" });
      const perfil = await getPerfilSafraIA("gerente-agricola");
      expect(perfil.papel).toBe("gerente-agricola");
    });
  });

  it("sem token usa o modo demonstração sem chamar o backend", async () => {
    token.valor = null;
    const r = await consultarSafraIA(payload);
    expect(http.post).not.toHaveBeenCalled();
    expect(r.origem).toBe("demonstracao");
  });

  it("com token usa o backend e não envia o contexto", async () => {
    http.post.mockResolvedValue({ data: { intent: "area_disponivel", texto: "28 ha livres" } });
    const r = await consultarSafraIA(payload);
    expect(http.post).toHaveBeenCalledWith("/api/safra-ia/consultar", { pergunta: payload.pergunta });
    expect(r).toMatchObject({ texto: "28 ha livres", origem: "backend" });
  });

  it("recusa do backend propaga a mensagem em vez de usar o mock", async () => {
    http.post.mockRejectedValue({ isAxiosError: true, response: { status: 429, data: { error: "Limite de uso do Gemini atingido." } } });
    await expect(consultarSafraIA(payload)).rejects.toThrow("Limite de uso do Gemini atingido.");
  });

  it("backend sem resposta cai no modo demonstração", async () => {
    http.post.mockRejectedValue({ isAxiosError: true, message: "Network Error" });
    const r = await consultarSafraIA(payload);
    expect(r.origem).toBe("demonstracao");
  });

  it("502 do proxy sem corpo do backend cai no modo demonstração", async () => {
    http.post.mockRejectedValue({ isAxiosError: true, response: { status: 502, data: "" } });
    const r = await consultarSafraIA(payload);
    expect(r.origem).toBe("demonstracao");
  });

  it("502 do backend com mensagem (falha do Gemini) é propagado", async () => {
    http.post.mockRejectedValue({ isAxiosError: true, response: { status: 502, data: { error: "Falha ao consultar o Gemini." } } });
    await expect(consultarSafraIA(payload)).rejects.toThrow("Falha ao consultar o Gemini.");
  });
});
