const DEFAULT_AUTH_DESTINATION = "/dashboard";

export function getSafeNextPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return DEFAULT_AUTH_DESTINATION;
  }

  return value;
}
