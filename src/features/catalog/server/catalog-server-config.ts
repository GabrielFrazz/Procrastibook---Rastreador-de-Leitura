export type CatalogServerConfig = Readonly<{
  googleBooksApiKey: string | undefined;
  openLibraryUserAgent: string;
}>;

function optionalValue(value: string | undefined) {
  const normalized = value?.trim();

  return normalized && !normalized.includes("replace-with")
    ? normalized
    : undefined;
}

export function getCatalogServerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): CatalogServerConfig {
  const configuredUserAgent = optionalValue(
    environment.OPEN_LIBRARY_USER_AGENT,
  );

  if (!configuredUserAgent && environment.NODE_ENV === "production") {
    throw new Error(
      "OPEN_LIBRARY_USER_AGENT must be configured in production.",
    );
  }

  return {
    googleBooksApiKey: optionalValue(environment.GOOGLE_BOOKS_API_KEY),
    openLibraryUserAgent:
      configuredUserAgent ?? "Procrastibook/0.1 (local development)",
  };
}
