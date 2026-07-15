export function isGoogleAuthEnabled(
  value = process.env.GOOGLE_AUTH_ENABLED,
): boolean {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue || normalizedValue === "false") {
    return false;
  }

  if (normalizedValue === "true") {
    return true;
  }

  throw new Error("GOOGLE_AUTH_ENABLED deve ser true ou false.");
}
