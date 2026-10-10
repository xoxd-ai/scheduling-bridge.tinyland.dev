// `just inhouse-link`: build every in-house package through Bazel and
// materialise it into node_modules/<pkg> for the pnpm/Vite loop (ruling RU9).
// Adapted from xoxd.ai (no theme carrier here).
//
// The root BUILD.bazel links each registry module with
// `npm_link_package(name = "node_modules/<pkg>", src = "@<module>//:pkg")`.
// This script builds those link targets, asks Bazel where each module's
// `:pkg` output directory landed, and copies it (dereferencing symlinks) into
// node_modules/<pkg>. package.json and pnpm-lock.yaml carry no in-house
// package, so run this AFTER `pnpm install` (`just setup` does): pnpm never
// installs, prunes or shadows these directories. It then asserts each copied
// package.json carries the name and the exact version MODULE.bazel pins, so a
// stale Bazel output cannot masquerade as the pin.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBazelDeps, readLinks } from './check-bazel-npm-pin-parity.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function bazel(args) {
	return execFileSync('bazelisk', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

// One cquery for every label: each cquery re-runs analysis, which costs
// minutes on a loaded host, so never ask once per package. Keys are
// `<apparent repo>//<package>:<name>`; values are the first output path,
// relative to the workspace root.
const STARLARK_EXPR =
	'target.label.repo_name + "//" + target.label.package + ":" + target.label.name + "\\t" + target.files.to_list()[0].path';

function labelKey(label) {
	const match = /^@{0,2}([^/]*)\/\/([^:]*):(.+)$/.exec(label);
	if (!match) throw new Error(`inhouse-link: cannot parse label ${label}`);
	return `${match[1].replace(/[+~]$/, '')}//${match[2]}:${match[3]}`;
}

function outputDirs(labels) {
	const out = bazel([
		'cquery',
		'--noshow_progress',
		'--ui_event_filters=-info',
		'--output=starlark',
		`--starlark:expr=${STARLARK_EXPR}`,
		labels.join(' + '),
	]);
	const dirs = new Map();
	for (const line of out.split('\n').filter(Boolean)) {
		const [key, file] = line.split('\t');
		dirs.set(labelKey(key), file);
	}
	return dirs;
}

// Copy a tree, resolving every symlink at any depth into a regular file. On
// Node 22.22+, cpSync(..., { dereference: true }) still copies NESTED symlinks
// as symlinks (U1 finding, site.scaffold copyTreeDereferenced), which would
// leave node_modules pointing into Bazel's read-only output tree.
function copyTreeDereferenced(source, target) {
	const stat = fs.statSync(source);
	if (stat.isDirectory()) {
		fs.mkdirSync(target, { recursive: true });
		for (const entry of fs.readdirSync(source)) {
			copyTreeDereferenced(path.join(source, entry), path.join(target, entry));
		}
		return;
	}
	fs.copyFileSync(source, target);
	// Bazel outputs are read-only; keep the copy writable so the next link can replace it.
	fs.chmodSync(target, (stat.mode & 0o777) | 0o200);
}

function materialise(source, target) {
	fs.rmSync(target, { recursive: true, force: true });
	fs.mkdirSync(path.dirname(target), { recursive: true });
	copyTreeDereferenced(source, target);
}

function main() {
	const links = readLinks();
	const bazelDeps = readBazelDeps();
	if (links.size === 0) {
		console.error('inhouse-link: the root BUILD.bazel links no in-house package');
		process.exit(1);
	}
	if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
		console.error('inhouse-link: node_modules is missing; run `pnpm install --frozen-lockfile` first');
		process.exit(1);
	}
	const packages = [...links].sort(([a], [b]) => a.localeCompare(b));
	// The module `:pkg` directories are what get copied below, so they are built
	// as top-level targets too: on a disk or remote cache hit Bazel materialises
	// only top-level outputs (--remote_download_outputs=toplevel), which left an
	// intermediate `:pkg` directory empty on disk (xoxd.ai finding).
	bazel([
		'build',
		'--noshow_progress',
		'--noshow_loading_progress',
		...packages.map(([packageName]) => `//:node_modules/${packageName}`),
		...packages.map(([, { moduleName }]) => `@${moduleName}//:pkg`),
	]);
	const failures = [];
	const dirs = outputDirs(packages.map(([, { moduleName }]) => `@${moduleName}//:pkg`));
	for (const [packageName, { moduleName }] of packages) {
		const label = `@${moduleName}//:pkg`;
		const relative = dirs.get(labelKey(label));
		if (!relative) {
			failures.push(`${label} produced no output directory`);
			continue;
		}
		const target = path.join(ROOT, 'node_modules', packageName);
		materialise(path.join(ROOT, relative), target);
		const manifest = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
		const pinned = bazelDeps.get(moduleName);
		if (manifest.name !== packageName) failures.push(`${label} built "${manifest.name}", expected "${packageName}"`);
		if (manifest.version !== pinned) {
			failures.push(`${label} built ${manifest.name}@${manifest.version}, MODULE.bazel pins ${pinned}`);
		}
	}
	if (failures.length > 0) {
		console.error('inhouse-link: the Bazel-built packages do not match the pins');
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exit(1);
	}
	console.log(`inhouse-link: ${links.size} in-house packages linked from Bazel into node_modules`);
}

main();
