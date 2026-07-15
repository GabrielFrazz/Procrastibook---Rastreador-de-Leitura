export function getAppUrl(value = process.env.NEXT_PUBLIC_APP_URL) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error("A variável NEXT_PUBLIC_APP_URL não foi configurada.");
  }

  let url: URL;

  try {
    url = new URL(normalizedValue);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL deve ser uma URL válida.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL deve usar HTTP ou HTTPS.");
  }

  if (url.username || url.password) {
    throw new Error("NEXT_PUBLIC_APP_URL não deve conter credenciais.");
  }

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/$/, "");

  return url.toString().replace(/\/$/, "");
}

export function createAppUrl(pathname: string, appUrl = getAppUrl()) {
  return new URL(pathname, `${appUrl}/`).toString();
}
