import { defineConfig } from 'vitest/config';

// SvelteKit 3 removed the $lib alias; src/ imports #lib/* through the
// package.json "imports" field, which Vite and Node resolve natively.
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts', 'src/**/*.test.svelte.ts', 'scripts/**/*.test.mts'],
		environment: 'node',
		globals: true,
		// Allow vacuous green on empty test set (M0.4 → M0.6 ramp).
		// Set to false in M3 once content + smoke tests land.
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			thresholds: {
				lines: 50,
				functions: 50,
				branches: 50,
				statements: 50,
			},
			include: ['src/**/*.{ts,svelte.ts}', 'scripts/**/*.mts'],
			exclude: ['**/*.test.ts', '**/*.test.mts', '**/*.test.svelte.ts'],
		},
	},
});
