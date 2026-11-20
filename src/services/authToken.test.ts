import { describe, it, expect, beforeEach, vi } from "vitest";
import { lerToken, salvarToken, limparToken } from "./authToken";

function storageFake() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("authToken", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageFake());
    vi.stubGlobal("sessionStorage", storageFake());
  });

  it("guarda na sessão por padrão e lê de volta", () => {
    salvarToken("abc", false);
    expect(sessionStorage.getItem("safraviva:auth:token:v1")).toBe("abc");
    expect(lerToken()).toBe("abc");
  });

  it("lembrar acesso usa localStorage e não duplica", () => {
    salvarToken("a", false);
    salvarToken("b", true);
    expect(sessionStorage.getItem("safraviva:auth:token:v1")).toBeNull();
    expect(lerToken()).toBe("b");
  });

  it("limpar remove o token", () => {
    salvarToken("x", true);
    limparToken();
    expect(lerToken()).toBeNull();
  });
});
