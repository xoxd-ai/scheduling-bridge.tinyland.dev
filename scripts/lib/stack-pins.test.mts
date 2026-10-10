import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// RU1/RU5 house stack, exact pins (site.scaffold #225 is the reference; the
// estate manifest drift check from site.scaffold replaces this once it lands).
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const all: Record<string, string> = { ...manifest.dependencies, ...manifest.devDependencies };

const EXPECTED: Record<string, string> = {
	'@sveltejs/kit': '3.0.1',
	svelte: '5.57.2',
	vite: '8.3.3',
	typescript: '7.0.2',
	effect: '4.0.2',
	'@skeletonlabs/skeleton': '5.0.1',
	'@skeletonlabs/skeleton-svelte': '5.0.1',
	vitest: '5.0.3',
	'@vitest/coverage-v8': '5.0.3',
	'@playwright/test': '1.64.0',
	'svelte-check': '4.7.6',
};

describe('house stack pins (RU1, RU5, RU13)', () => {
	for (const [name, version] of Object.entries(EXPECTED)) {
		it(`${name} is exactly ${version}`, () => {
			expect(all[name]).toBe(version);
		});
	}

	it('keeps TypeScript 7 as `typescript`, with no @typescript/native alias', () => {
		expect(all['@typescript/native']).toBeUndefined();
		expect(all.typescript).toBe('7.0.2');
	});

	it('type-checks through svelte-check --tsgo', () => {
		expect(manifest.scripts.check).toContain('svelte-check --tsgo');
	});

	it('has no svelte.config.js (SvelteKit 3 reads its config from vite.config.ts)', () => {
		expect(fs.existsSync(path.join(ROOT, 'svelte.config.js'))).toBe(false);
	});
});
