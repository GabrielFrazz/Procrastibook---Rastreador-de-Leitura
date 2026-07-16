export const SIDEBAR_STORAGE_KEY = "procrastibook:sidebar-collapsed";

const NAVIGATION_BASE_URL = "https://procrastibook.local";

function getMatchScore(currentPath: string, candidateHref: string) {
  const currentUrl = new URL(currentPath, NAVIGATION_BASE_URL);
  const candidateUrl = new URL(candidateHref, NAVIGATION_BASE_URL);
  const candidateParameters = Array.from(candidateUrl.searchParams.entries());

  if (candidateParameters.length > 0) {
    const matchesParameters = candidateParameters.every(
      ([name, value]) => currentUrl.searchParams.get(name) === value,
    );

    if (currentUrl.pathname !== candidateUrl.pathname || !matchesParameters) {
      return -1;
    }

    return 300 + candidateParameters.length;
  }

  if (currentUrl.pathname === candidateUrl.pathname) {
    return 200;
  }

  if (currentUrl.pathname.startsWith(`${candidateUrl.pathname}/`)) {
    return 100 + candidateUrl.pathname.length;
  }

  return -1;
}

export function getActiveNavigationHref(
  currentPath: string,
  candidateHrefs: string[],
) {
  let activeHref: string | undefined;
  let activeScore = -1;

  for (const candidateHref of candidateHrefs) {
    const score = getMatchScore(currentPath, candidateHref);

    if (score > activeScore) {
      activeHref = candidateHref;
      activeScore = score;
    }
  }

  return activeHref;
}
