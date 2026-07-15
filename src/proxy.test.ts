import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

describe("proxy matcher", () => {
  it.each([
    "/dashboard",
    "/library/new",
    "/sessions",
    "/goals/2026",
    "/statistics",
    "/lists",
    "/lists/lista-id",
    "/login",
    "/signup",
    "/forgot-password",
    "/auth/callback",
  ])("executa na rota %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });

  it.each(["/", "/sobre", "/_next/static/chunk.js", "/favicon.ico"])(
    "não executa na rota pública %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    },
  );
});
