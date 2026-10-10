import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { accessibilityPlugin } from '@tummycrypt/vite-plugin-a11y';
import { defineConfig } from 'vite';

// Skeleton is exact-pinned at 5.0.1 (see package.json and AGENTS.md). Two
// plugins that the Skeleton 4 pin carried are deliberately gone and must not
// come back:
//
//   skeletonTailwindV4Compat(), a local transform that rewrote Skeleton's
//   `@variant sm|md|lg|xl|2xl|dark` and `@apply variant-*` into stable
//   Tailwind v4 equivalents. Skeleton 5 emits `@variant` on purpose and its
//   own globals.css says so in a comment, so rewriting `@variant dark` into
//   `.dark &` would detach every Skeleton dark rule from this site's
//   data-mode switcher. The shim also never fired: Tailwind resolves
//   `@import '@skeletonlabs/skeleton'` through its own resolver, so the
//   Skeleton stylesheets never reach a Vite transform hook.
//
//   skeletonColorUtilities(), which generated colour-pair utilities into a
//   `virtual:skeleton-colors` module. Nothing in this repo ever imported that
//   module, and Skeleton declares every pair token itself in
//   @skeletonlabs/skeleton/src/base/theme.css, so the plugin contributed no
//   CSS while scanning every component on every build.
export default defineConfig({
	// Bazel convenience symlinks (bazel-bin, bazel-out, ...) are not sources.
	server: { watch: { ignored: ['**/bazel-*', '**/bazel-*/**'] } },
	plugins: [
		tailwindcss(),
		accessibilityPlugin({
			wcagLevel: 'AA',
			failOnError: false,
		}),
		// SvelteKit 3 reads its configuration from the sveltekit() plugin;
		// svelte.config.js is no longer supported. Static site: adapter-static,
		// prerendered everywhere (src/routes/+layout.ts), no server, no forms.
		sveltekit({
			extensions: ['.svelte'],
			preprocess: [vitePreprocess()],
			compilerOptions: {
				runes: true,
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				precompress: true,
				strict: false,
			}),
			paths: {
				base: '',
			},
			prerender: {
				handleHttpError: 'warn',
				handleMissingId: 'warn',
			},
		}),
	],
	build: {
		reportCompressedSize: true,
		chunkSizeWarningLimit: 250,
		cssCodeSplit: true,
	},
});
