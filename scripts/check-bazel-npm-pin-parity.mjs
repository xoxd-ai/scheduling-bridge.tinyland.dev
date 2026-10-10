// `just bazel-pin-parity`: assert Bazel is the only carrier for every in-house
// package (ruling RU9, 2026-10-08). Adapted from xoxd.ai (no theme carrier here).
//
// Posture (RU9). The org packages come from xoxd-ai/bazel-registry through a
// `bazel_dep(...)` in MODULE.bazel, and the root BUILD.bazel links each one
// with `npm_link_package(name = "node_modules/<pkg>", src = "@<module>//:pkg")`
// (the site.scaffold / xoxd.ai pattern). package.json and pnpm-lock.yaml carry
// no in-house package at all, so pnpm can neither install nor shadow one.
// `just inhouse-link` (run by `just setup` after `pnpm install`) builds those
// link targets and materialises each package's Bazel output into
// node_modules/<pkg> for the pnpm/Vite loop, where its peers resolve from the
// site's own node_modules (one svelte, one vite).
//
// The invariant, all directions:
//
//   1. Every in-house `bazel_dep` in MODULE.bazel is an exact version and has
//      exactly one root npm_link_package of `@<module>//:pkg`, and every
//      in-house link names a bazel_dep; the module name derives from the
//      package name.
//   2. package.json carries no in-house specifier in any dependency section
//      (a semver pin, range or file: link would be a second carrier).
//   3. pnpm-lock.yaml mentions no in-house package. That is the gate against a
//      silent fall-back to npmjs.
//   4. Each materialised node_modules/<pkg>/package.json names the package and
//      the exact version MODULE.bazel pins, so a stale copy cannot pass.
//
// Failures print to stderr as `  - <detail>` bullets and the script exits 1; a
// clean run prints a one-line ok summary and exits 0. Pure node, no Bazel, so
// it runs in `just check`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExactVersion } from './lib/exact-version.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const MODULE_BAZEL = path.join(ROOT, 'MODULE.bazel');
const BUILD_BAZEL = path.join(ROOT, 'BUILD.bazel');
const PNPM_LOCK = path.join(ROOT, 'pnpm-lock.yaml');

const IN_HOUSE_SCOPES = ['@tummycrypt/', '@tinyland/', '@xoxd/'];
const BAZEL_MODULE_PREFIXES = ['tummycrypt_', 'tinyland_', 'xoxd_'];
const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

/** `@tummycrypt/vite-plugin-a11y` becomes `tummycrypt_vite_plugin_a11y`. */
export function npmToBazelModule(packageName) {
	const [scope, name] = packageName.split('/');
	return `${scope.slice(1)}_${name}`.replaceAll('-', '_');
}

export function isInHouse(packageName) {
	return IN_HOUSE_SCOPES.some((scope) => packageName.startsWith(scope));
}

function isInHouseModule(moduleName) {
	return BAZEL_MODULE_PREFIXES.some((prefix) => moduleName.startsWith(prefix));
}

/** In-house npm specifiers declared in package.json, keyed by package name. */
export function readNpmSpecifiers(manifestPath = PACKAGE_JSON) {
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	const specifiers = new Map();
	for (const section of DEPENDENCY_SECTIONS) {
		for (const [name, version] of Object.entries(manifest[section] ?? {})) {
			if (isInHouse(name)) specifiers.set(name, { version: String(version), section });
		}
	}
	return specifiers;
}

/**
 * In-house bazel_dep pins declared in MODULE.bazel, keyed by module name.
 * Commented-out lines are ignored so a parked dep does not fail the gate.
 */
export function readBazelDeps(modulePath = MODULE_BAZEL) {
	const text = fs.readFileSync(modulePath, 'utf8');
	const deps = new Map();
	const pattern = /^[ \t]*bazel_dep\(\s*name\s*=\s*"([^"]+)"\s*,[^)]*?version\s*=\s*"([^"]+)"/gm;
	for (const match of text.matchAll(pattern)) {
		const [, moduleName, version] = match;
		if (isInHouseModule(moduleName)) deps.set(moduleName, version);
	}
	return deps;
}

/**
 * Root BUILD.bazel npm_link_package entries for in-house packages, keyed by
 * package name, each carrying the Bazel module its `src` names.
 */
export function readLinks(buildPath = BUILD_BAZEL) {
	const text = fs.readFileSync(buildPath, 'utf8');
	const links = new Map();
	const pattern =
		/npm_link_package\(\s*name\s*=\s*"node_modules\/([^"]+)"\s*,\s*src\s*=\s*"@([^/"]+)\/\/:pkg"\s*,?\s*\)/g;
	for (const match of text.matchAll(pattern)) {
		const [, packageName, moduleName] = match;
		if (isInHouse(packageName)) links.set(packageName, { moduleName, count: (links.get(packageName)?.count ?? 0) + 1 });
	}
	return links;
}

/** In-house package names the lockfile mentions anywhere (importer or package key). */
export function readLockMentions(lockPath = PNPM_LOCK) {
	const text = fs.readFileSync(lockPath, 'utf8');
	const mentions = new Set();
	for (const match of text.matchAll(/'?((?:@tummycrypt|@tinyland|@xoxd)\/[a-z0-9._-]+)/g)) {
		mentions.add(match[1]);
	}
	return mentions;
}

function main() {
	const failures = [];
	const bazelDeps = readBazelDeps();
	const links = readLinks();

	// 1. bazel_dep and root npm_link_package pair up, both directions.
	const linkByModule = new Map([...links].map(([packageName, link]) => [link.moduleName, packageName]));
	for (const [moduleName, version] of [...bazelDeps].sort()) {
		if (!isExactVersion(version)) {
			failures.push(`MODULE.bazel bazel_dep "${moduleName}" is "${version}", not an exact version.`);
		}
		if (!linkByModule.has(moduleName)) {
			failures.push(
				`MODULE.bazel bazel_dep "${moduleName}" ${version} has no root npm_link_package of @${moduleName}//:pkg, ` +
					`so nothing links it into the site.`,
			);
		}
	}
	for (const [packageName, { moduleName, count }] of [...links].sort()) {
		if (count !== 1) failures.push(`BUILD.bazel links "${packageName}" ${count} times; exactly one link is admitted.`);
		if (!bazelDeps.has(moduleName)) {
			failures.push(`BUILD.bazel links @${moduleName}//:pkg but MODULE.bazel has no bazel_dep for it.`);
		}
		if (npmToBazelModule(packageName) !== moduleName) {
			failures.push(
				`BUILD.bazel links "${packageName}" from @${moduleName}//:pkg; the module name does not derive ` +
					`from the package name (expected ${npmToBazelModule(packageName)}).`,
			);
		}
	}

	// 2. package.json carries no in-house specifier at all.
	for (const [packageName, { version, section }] of [...readNpmSpecifiers()].sort()) {
		failures.push(
			`package.json ${section}."${packageName}" is "${version}"; in-house packages are linked by Bazel ` +
				`(root npm_link_package) and must not appear in package.json.`,
		);
	}

	// 3. The lockfile never mentions an in-house package.
	for (const packageName of [...readLockMentions()].sort()) {
		failures.push(`pnpm-lock.yaml mentions "${packageName}"; no in-house package may resolve through pnpm.`);
	}

	// 4. The materialised copies are the pinned versions.
	for (const [packageName, { moduleName }] of [...links].sort()) {
		const manifestPath = path.join(ROOT, 'node_modules', packageName, 'package.json');
		if (!fs.existsSync(manifestPath)) {
			failures.push(`node_modules/${packageName} is not materialised; run \`just setup\` (or \`just inhouse-link\`).`);
			continue;
		}
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
		const pinned = bazelDeps.get(moduleName);
		if (manifest.name !== packageName || manifest.version !== pinned) {
			failures.push(
				`node_modules/${packageName} is ${manifest.name}@${manifest.version}; MODULE.bazel pins ${moduleName} ${pinned}. ` +
					'Run `just inhouse-link`.',
			);
		}
	}

	if (failures.length > 0) {
		console.error('bazel-npm-pin-parity: in-house packages are not Bazel-only');
		for (const failure of failures) console.error(`  - ${failure}`);
		console.error('');
		console.error(
			'Fix by pairing each bazel_dep with one root npm_link_package of @<module>//:pkg, keeping in-house ' +
				'packages out of package.json and pnpm-lock.yaml, and running `just setup`.',
		);
		process.exit(1);
	}

	const count = links.size;
	console.log(
		`bazel-npm-pin-parity: ${count} in-house ${count === 1 ? 'package is' : 'packages are'} Bazel-only ` +
			'(bazel_dep, root npm_link_package and the materialised version agree; package.json and the lockfile carry none)',
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main();
}
