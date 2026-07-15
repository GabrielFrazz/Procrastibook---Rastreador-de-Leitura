const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/library",
  "/sessions",
  "/goals",
  "/statistics",
  "/lists",
  "/update-password",
] as const;

const AUTH_ENTRY_PATHS = new Set(["/login", "/signup", "/forgot-password"]);

export type AuthRouteDecision =
  | Readonly<{ kind: "allow" }>
  | Readonly<{ kind: "redirect"; destination: string }>;

export type AuthRouteContext = Readonly<{
  pathname: string;
  search?: string;
  isAuthenticated: boolean;
}>;

export function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getAuthRouteDecision({
  pathname,
  search = "",
  isAuthenticated,
}: AuthRouteContext): AuthRouteDecision {
  if (!isAuthenticated && isPrivateRoute(pathname)) {
    const nextPath = `${pathname}${search}`;

    return {
      kind: "redirect",
      destination: `/login?next=${encodeURIComponent(nextPath)}`,
    };
  }

  if (isAuthenticated && AUTH_ENTRY_PATHS.has(pathname)) {
    return { kind: "redirect", destination: "/dashboard" };
  }

  return { kind: "allow" };
}
