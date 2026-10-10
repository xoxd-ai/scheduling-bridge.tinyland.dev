<script lang="ts">
	// Thin wrapper around build-time Shiki output. The `html` prop is
	// pre-highlighted at prerender time via
	// `#lib/content/highlight.js`. No client-side Shiki runtime.
	let { html, lang, caption }: { html: string; lang?: string; caption?: string } = $props();
</script>

<figure class="my-4 text-sm">
	{#if lang}
		<div class="mb-2 text-xs uppercase tracking-wide text-surface-500">{lang}</div>
	{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html html}
	{#if caption}
		<figcaption class="mt-2 text-xs italic text-surface-600-400">{caption}</figcaption>
	{/if}
</figure>
