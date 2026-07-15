import { getSafeNextPath } from "@/features/auth/domain/safe-next-path";
import { createAppUrl } from "@/lib/config/app-url";

export function createAuthCallbackUrl(
  nextPath: string,
  appUrl?: string,
): string {
  const callbackUrl = new URL(createAppUrl("/auth/callback", appUrl));
  callbackUrl.searchParams.set("next", getSafeNextPath(nextPath));
  return callbackUrl.toString();
}
