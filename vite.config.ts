import { sveltekit } from '@sveltejs/kit/vite';
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
	plugins: [
		tailwindcss(),
		accessibilityPlugin({
			wcagLevel: 'AA',
			failOnError: false,
		}),
		sveltekit(),
	],
	build: {
		reportCompressedSize: true,
		chunkSizeWarningLimit: 250,
		cssCodeSplit: true,
	},
});
