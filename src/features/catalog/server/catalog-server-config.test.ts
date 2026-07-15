import { describe, expect, it } from "vitest";

import { getCatalogServerConfig } from "@/features/catalog/server/catalog-server-config";

describe("getCatalogServerConfig", () => {
  it("ignora placeholders e usa identificação local fora de produção", () => {
    expect(
      getCatalogServerConfig({
        GOOGLE_BOOKS_API_KEY: "replace-with-google-books-api-key",
        NODE_ENV: "development",
        OPEN_LIBRARY_USER_AGENT:
          "Procrastibook/0.1 (contact: replace-with-email)",
      }),
    ).toEqual({
      googleBooksApiKey: undefined,
      openLibraryUserAgent: "Procrastibook/0.1 (local development)",
    });
  });

  it("mantém somente valores reais configurados no servidor", () => {
    expect(
      getCatalogServerConfig({
        GOOGLE_BOOKS_API_KEY: " server-key ",
        NODE_ENV: "production",
        OPEN_LIBRARY_USER_AGENT:
          " Procrastibook/1.0 (contact: admin@example.com) ",
      }),
    ).toEqual({
      googleBooksApiKey: "server-key",
      openLibraryUserAgent: "Procrastibook/1.0 (contact: admin@example.com)",
    });
  });

  it("bloqueia produção sem identificação da Open Library", () => {
    expect(() =>
      getCatalogServerConfig({ NODE_ENV: "production" }),
    ).toThrowError("OPEN_LIBRARY_USER_AGENT must be configured in production.");
  });
});
