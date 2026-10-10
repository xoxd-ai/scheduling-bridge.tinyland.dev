// One exact-version predicate for the in-house pin checks.
//
// Shape: the semver core, an optional prerelease tag and an optional build
// metadata tag, each a single flat character class. Every optional part is
// anchored on a literal (`-` or `+`) that the preceding class cannot consume,
// so the engine has exactly one way to split any input and never backtracks
// exponentially. The previous form, `(?:[-+][0-9A-Za-z.-]+)*`, let a run of
// hyphens be carved into any number of groups; CodeQL flagged it as js/redos.
export const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** True when `version` is one exact semver pin, never a range or a tag. */
export function isExactVersion(version) {
	return EXACT_VERSION.test(String(version));
}
