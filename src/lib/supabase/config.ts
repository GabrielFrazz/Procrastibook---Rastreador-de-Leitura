export type SupabasePublicConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

export type SupabasePublicEnvironment = Readonly<{
  url?: string | undefined;
  publishableKey?: string | undefined;
}>;

const PUBLISHABLE_KEY_PLACEHOLDER = "replace-with-local-publishable-key";

function readRequiredValue(value: string | undefined, variableName: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`A variável ${variableName} não foi configurada.`);
  }

  return normalizedValue;
}

function validateSupabaseUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve usar HTTP ou HTTPS.");
  }

  return url.toString().replace(/\/$/, "");
}

export function getSupabasePublicConfig(
  environment: SupabasePublicEnvironment = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
): SupabasePublicConfig {
  const url = validateSupabaseUrl(
    readRequiredValue(environment.url, "NEXT_PUBLIC_SUPABASE_URL"),
  );
  const publishableKey = readRequiredValue(
    environment.publishableKey,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );

  if (publishableKey === PUBLISHABLE_KEY_PLACEHOLDER) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ainda contém o placeholder do .env.example.",
    );
  }

  return { url, publishableKey };
}
