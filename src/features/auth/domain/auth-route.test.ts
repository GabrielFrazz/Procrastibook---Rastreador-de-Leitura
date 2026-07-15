import { describe, expect, it } from "vitest";

import {
  getAuthRouteDecision,
  isPrivateRoute,
} from "@/features/auth/domain/auth-route";

describe("isPrivateRoute", () => {
  it.each([
    "/dashboard",
    "/library/new",
    "/library/obra-id",
    "/sessions",
    "/goals",
    "/statistics",
    "/lists",
    "/lists/lista-id",
    "/update-password",
  ])("reconhece %s como rota privada", (pathname) => {
    expect(isPrivateRoute(pathname)).toBe(true);
  });

  it.each(["/", "/login", "/libraryish", "/auth/callback"])(
    "não classifica %s como rota privada",
    (pathname) => {
      expect(isPrivateRoute(pathname)).toBe(false);
    },
  );
});

describe("getAuthRouteDecision", () => {
  it("envia visitante anônimo para o login preservando o destino interno", () => {
    expect(
      getAuthRouteDecision({
        pathname: "/library/new",
        search: "?type=BOOK",
        isAuthenticated: false,
      }),
    ).toEqual({
      kind: "redirect",
      destination: "/login?next=%2Flibrary%2Fnew%3Ftype%3DBOOK",
    });
  });

  it("permite que visitante anônimo acesse uma rota pública", () => {
    expect(
      getAuthRouteDecision({ pathname: "/login", isAuthenticated: false }),
    ).toEqual({ kind: "allow" });
  });

  it("envia usuário autenticado para o dashboard ao abrir uma entrada de autenticação", () => {
    expect(
      getAuthRouteDecision({ pathname: "/signup", isAuthenticated: true }),
    ).toEqual({ kind: "redirect", destination: "/dashboard" });
  });

  it("mantém o callback acessível durante a troca PKCE", () => {
    expect(
      getAuthRouteDecision({
        pathname: "/auth/callback",
        isAuthenticated: true,
      }),
    ).toEqual({ kind: "allow" });
  });

  it("permite que usuário autenticado acesse uma rota privada", () => {
    expect(
      getAuthRouteDecision({ pathname: "/goals", isAuthenticated: true }),
    ).toEqual({ kind: "allow" });
  });
});
