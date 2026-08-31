/** Matches CI build tags: `{seq}.{yy}.{mm}.{dd}.{hhmm}.{branch}` */
export const BUILD_TAG_RE = /^(\d+)\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{4})\.(.+)$/;

export function parseBuildSeq(buildString: string): number | null {
  const match = parseBuildTag(buildString);
  return match?.seq ?? null;
}

/** Branch suffix from a build tag (`alpha`, `release`, …). */
export function parseBuildBranch(buildString: string): string | null {
  return parseBuildTag(buildString)?.branch ?? null;
}

/** True only for CI builds whose tag ends in `.release`. */
export function isReleaseBranchBuild(buildString: string): boolean {
  return parseBuildBranch(buildString) === "release";
}

export function isNewerBuild(
  candidateTag: string,
  currentBuildString: string
): boolean {
  const candidate = parseBuildSeq(candidateTag);
  const current = parseBuildSeq(currentBuildString);
  if (candidate === null || current === null) {
    return false;
  }
  return candidate > current;
}

function parseBuildTag(
  buildString: string
): { seq: number; branch: string } | null {
  if (buildString === "untracked version") {
    return null;
  }
  const match = BUILD_TAG_RE.exec(buildString.trim());
  if (!match) {
    return null;
  }
  const seq = Number.parseInt(match[1], 10);
  if (!Number.isFinite(seq)) {
    return null;
  }
  return { seq, branch: match[6] };
}
