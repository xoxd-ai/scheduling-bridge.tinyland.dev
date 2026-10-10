import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EXACT_VERSION, isExactVersion } from './exact-version.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const IN_HOUSE = /^@(?:tummycrypt|tinyland|xoxd)\//;
const BAZEL_IN_HOUSE =
	/^[ \t]*bazel_dep\(\s*name\s*=\s*"((?:tummycrypt|tinyland)_[^"]+)"\s*,[^)]*?version\s*=\s*"([^"]+)"/gm;

describe('EXACT_VERSION', () => {
	it('accepts an exact semver pin with optional prerelease and build metadata', () => {
		for (const version of [
			'0.2.4',
			'10.20.30',
			'1.0.0-alpha.1',
			'1.0.0-alpha-beta',
			'1.0.0+build.5',
			'1.0.0-rc.1+sha.abc-1',
		]) {
			expect(isExactVersion(version), version).toBe(true);
		}
	});

	it('rejects ranges, tags and malformed versions', () => {
		for (const version of [
			'^0.2.4',
			'~1.2.3',
			'>=1.2.3',
			'1.2',
			'1.2.x',
			'*',
			'latest',
			'1.2.3+',
			'1.2.3-',
			'1.2.3+a+b',
			' 1.2.3',
			'1.2.3 ',
			'v1.2.3',
		]) {
			expect(isExactVersion(version), version).toBe(false);
		}
	});

	it('answers the CodeQL js/redos input in linear time', () => {
		// The flagged shape: `9.9.9+` followed by many `--` repetitions, in both
		// the matching form and the form that must fail after scanning it all.
		const hyphens = '--'.repeat(5000);
		const started = performance.now();
		expect(isExactVersion(`9.9.9+${hyphens}`)).toBe(true);
		expect(isExactVersion(`9.9.9+${hyphens}!`)).toBe(false);
		expect(isExactVersion(`9.9.9-${hyphens}+${hyphens} `)).toBe(false);
		const elapsed = performance.now() - started;
		expect(elapsed, `${elapsed.toFixed(1)}ms for three 10k-character inputs`).toBeLessThan(250);
	});

	it('has no nested or overlapping quantifier', () => {
		// A regression guard on the source itself: no `(...)*` or `(...)+` around
		// a class that can also match the group's own opening literal.
		expect(EXACT_VERSION.source).not.toMatch(/\)\*|\)\+/);
	});

	it('matches every in-house bazel_dep pin in MODULE.bazel', () => {
		const moduleText = fs.readFileSync(path.join(ROOT, 'MODULE.bazel'), 'utf8');
		const pins: Array<[string, string]> = [];
		for (const match of moduleText.matchAll(BAZEL_IN_HOUSE)) {
			pins.push([match[1], match[2]]);
		}
		expect(pins.length).toBeGreaterThan(0);
		for (const [name, version] of pins) {
			expect(isExactVersion(version), `${name} ${version}`).toBe(true);
		}
	});

	it('finds no in-house specifier in package.json (ruling RU9)', () => {
		// The npm side carries nothing at all: Bazel is the only carrier, and the
		// root BUILD.bazel links each module with npm_link_package.
		const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
		const specifiers: Array<[string, string]> = [];
		for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
			for (const [name, version] of Object.entries(manifest[section] ?? {})) {
				if (IN_HOUSE.test(name)) specifiers.push([name, String(version)]);
			}
		}
		expect(specifiers).toEqual([]);
	});
});
