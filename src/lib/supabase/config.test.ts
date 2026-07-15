import { describe, expect, it } from "vitest";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

describe("getSupabasePublicConfig", () => {
  it("normaliza uma configuração válida", () => {
    expect(
      getSupabasePublicConfig({
        url: " http://127.0.0.1:54321/ ",
        publishableKey: " local-publishable-key ",
      }),
    ).toEqual({
      url: "http://127.0.0.1:54321",
      publishableKey: "local-publishable-key",
    });
  });

  it("rejeita uma URL ausente", () => {
    expect(() =>
      getSupabasePublicConfig({ publishableKey: "public-key" }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("rejeita protocolos não HTTP", () => {
    expect(() =>
      getSupabasePublicConfig({
        url: "file:///supabase",
        publishableKey: "public-key",
      }),
    ).toThrow("HTTP ou HTTPS");
  });

  it("rejeita o placeholder do arquivo de exemplo", () => {
    expect(() =>
      getSupabasePublicConfig({
        url: "http://127.0.0.1:54321",
        publishableKey: "replace-with-local-publishable-key",
      }),
    ).toThrow("placeholder");
  });
});
