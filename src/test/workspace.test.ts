import { describe, expect, it } from "vitest";

describe("workspace de testes", () => {
  it("executa no ambiente de teste", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
