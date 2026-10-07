<script lang="ts">
	/**
	 * /style-guide — M2.5 design system smoke test.
	 *
	 * Gated behind `?guide=1` so it never appears in production navigation
	 * or via accidental crawl. Renders every theme color scale × shade,
	 * representative color-pair utility classes (verifies Skeleton 5's own
	 * `@theme inline` pair tokens resolve under the scheduling-bridge theme),
	 * typography hierarchy, every
	 * Skeleton 5 component required for M2 (AppBar, Avatar, Tabs, Tooltip,
	 * Switch, Toast, Popover, Dialog), and a side-by-side light/dark
	 * comparison region scoped via `data-mode` attributes (does NOT mutate
	 * the page-wide theme).
	 *
	 * NOT a user-facing surface — bundle weight on this page is
	 * intentionally larger than the rest of the site.
	 */
	import { onMount } from 'svelte';
	import {
		AppBar,
		Avatar,
		Dialog,
		Popover,
		Portal,
		Switch,
		Tabs,
		Toast,
		Tooltip,
		createToaster,
	} from '@skeletonlabs/skeleton-svelte';

	const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
	const SCALES = ['primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'surface'] as const;

	type Scale = (typeof SCALES)[number];
	type Shade = (typeof SHADES)[number];

	/**
	 * Source-of-truth OKLCH ramps from src/lib/styles/themes/scheduling-bridge.css.
	 * Duplicated here for display-only annotation (we don't import the
	 * theme CSS as a JS module — Tailwind 4 owns its compilation). If
	 * theme tokens change, refresh this map; the swatches will still
	 * render correct colors regardless via Tailwind's `bg-{scale}-{shade}`
	 * utility classes.
	 */
	const OKLCH: Record<Scale, Record<Shade, string>> = {
		primary: {
			50: 'oklch(0.97 0.02 38)',
			100: 'oklch(0.93 0.04 38)',
			200: 'oklch(0.86 0.08 38)',
			300: 'oklch(0.79 0.11 38)',
			400: 'oklch(0.71 0.14 38)',
			500: 'oklch(0.63 0.16 38)',
			600: 'oklch(0.55 0.14 38)',
			700: 'oklch(0.47 0.12 38)',
			800: 'oklch(0.38 0.1 38)',
			900: 'oklch(0.3 0.07 38)',
			950: 'oklch(0.22 0.05 38)',
		},
		secondary: {
			50: 'oklch(0.96 0.015 195)',
			100: 'oklch(0.91 0.03 195)',
			200: 'oklch(0.83 0.05 195)',
			300: 'oklch(0.74 0.07 195)',
			400: 'oklch(0.62 0.09 195)',
			500: 'oklch(0.46 0.1 195)',
			600: 'oklch(0.4 0.09 195)',
			700: 'oklch(0.34 0.08 195)',
			800: 'oklch(0.28 0.06 195)',
			900: 'oklch(0.22 0.05 195)',
			950: 'oklch(0.16 0.03 195)',
		},
		tertiary: {
			50: 'oklch(0.96 0.02 295)',
			100: 'oklch(0.91 0.04 295)',
			200: 'oklch(0.83 0.07 295)',
			300: 'oklch(0.74 0.1 295)',
			400: 'oklch(0.63 0.12 295)',
			500: 'oklch(0.5 0.13 295)',
			600: 'oklch(0.43 0.12 295)',
			700: 'oklch(0.37 0.1 295)',
			800: 'oklch(0.3 0.08 295)',
			900: 'oklch(0.24 0.06 295)',
			950: 'oklch(0.18 0.04 295)',
		},
		success: {
			50: 'oklch(0.96 0.025 140)',
			100: 'oklch(0.91 0.05 140)',
			200: 'oklch(0.83 0.09 140)',
			300: 'oklch(0.75 0.12 140)',
			400: 'oklch(0.66 0.14 140)',
			500: 'oklch(0.58 0.14 140)',
			600: 'oklch(0.5 0.12 140)',
			700: 'oklch(0.43 0.1 140)',
			800: 'oklch(0.36 0.08 140)',
			900: 'oklch(0.29 0.06 140)',
			950: 'oklch(0.22 0.04 140)',
		},
		warning: {
			50: 'oklch(0.97 0.03 70)',
			100: 'oklch(0.93 0.06 70)',
			200: 'oklch(0.87 0.1 70)',
			300: 'oklch(0.8 0.13 70)',
			400: 'oklch(0.74 0.15 70)',
			500: 'oklch(0.68 0.15 70)',
			600: 'oklch(0.6 0.13 70)',
			700: 'oklch(0.52 0.11 70)',
			800: 'oklch(0.44 0.09 70)',
			900: 'oklch(0.36 0.07 70)',
			950: 'oklch(0.29 0.05 70)',
		},
		error: {
			50: 'oklch(0.96 0.02 28)',
			100: 'oklch(0.91 0.05 28)',
			200: 'oklch(0.83 0.09 28)',
			300: 'oklch(0.74 0.13 28)',
			400: 'oklch(0.65 0.17 28)',
			500: 'oklch(0.56 0.19 28)',
			600: 'oklch(0.49 0.17 28)',
			700: 'oklch(0.42 0.14 28)',
			800: 'oklch(0.35 0.11 28)',
			900: 'oklch(0.28 0.08 28)',
			950: 'oklch(0.22 0.06 28)',
		},
		surface: {
			50: 'oklch(0.97 0.005 60)',
			100: 'oklch(0.93 0.008 60)',
			200: 'oklch(0.86 0.012 60)',
			300: 'oklch(0.75 0.015 60)',
			400: 'oklch(0.65 0.017 60)',
			500: 'oklch(0.56 0.018 60)',
			600: 'oklch(0.46 0.016 60)',
			700: 'oklch(0.36 0.014 60)',
			800: 'oklch(0.27 0.012 60)',
			900: 'oklch(0.2 0.01 60)',
			950: 'oklch(0.14 0.008 60)',
		},
	};

	/**
	 * Static swatch class lookup. Tailwind's JIT compiler scans source for
	 * literal class strings, so we cannot synthesise these via template
	 * concatenation — they must appear verbatim somewhere in the file.
	 * Keep this table aligned with SCALES × SHADES.
	 */
	const SWATCH_CLASSES: Record<Scale, Record<Shade, string>> = {
		primary: {
			50: 'bg-primary-50',
			100: 'bg-primary-100',
			200: 'bg-primary-200',
			300: 'bg-primary-300',
			400: 'bg-primary-400',
			500: 'bg-primary-500',
			600: 'bg-primary-600',
			700: 'bg-primary-700',
			800: 'bg-primary-800',
			900: 'bg-primary-900',
			950: 'bg-primary-950',
		},
		secondary: {
			50: 'bg-secondary-50',
			100: 'bg-secondary-100',
			200: 'bg-secondary-200',
			300: 'bg-secondary-300',
			400: 'bg-secondary-400',
			500: 'bg-secondary-500',
			600: 'bg-secondary-600',
			700: 'bg-secondary-700',
			800: 'bg-secondary-800',
			900: 'bg-secondary-900',
			950: 'bg-secondary-950',
		},
		tertiary: {
			50: 'bg-tertiary-50',
			100: 'bg-tertiary-100',
			200: 'bg-tertiary-200',
			300: 'bg-tertiary-300',
			400: 'bg-tertiary-400',
			500: 'bg-tertiary-500',
			600: 'bg-tertiary-600',
			700: 'bg-tertiary-700',
			800: 'bg-tertiary-800',
			900: 'bg-tertiary-900',
			950: 'bg-tertiary-950',
		},
		success: {
			50: 'bg-success-50',
			100: 'bg-success-100',
			200: 'bg-success-200',
			300: 'bg-success-300',
			400: 'bg-success-400',
			500: 'bg-success-500',
			600: 'bg-success-600',
			700: 'bg-success-700',
			800: 'bg-success-800',
			900: 'bg-success-900',
			950: 'bg-success-950',
		},
		warning: {
			50: 'bg-warning-50',
			100: 'bg-warning-100',
			200: 'bg-warning-200',
			300: 'bg-warning-300',
			400: 'bg-warning-400',
			500: 'bg-warning-500',
			600: 'bg-warning-600',
			700: 'bg-warning-700',
			800: 'bg-warning-800',
			900: 'bg-warning-900',
			950: 'bg-warning-950',
		},
		error: {
			50: 'bg-error-50',
			100: 'bg-error-100',
			200: 'bg-error-200',
			300: 'bg-error-300',
			400: 'bg-error-400',
			500: 'bg-error-500',
			600: 'bg-error-600',
			700: 'bg-error-700',
			800: 'bg-error-800',
			900: 'bg-error-900',
			950: 'bg-error-950',
		},
		surface: {
			50: 'bg-surface-50',
			100: 'bg-surface-100',
			200: 'bg-surface-200',
			300: 'bg-surface-300',
			400: 'bg-surface-400',
			500: 'bg-surface-500',
			600: 'bg-surface-600',
			700: 'bg-surface-700',
			800: 'bg-surface-800',
			900: 'bg-surface-900',
			950: 'bg-surface-950',
		},
	};

	/**
	 * Color-pair smoke list — at least one example per supported property
	 * prefix (bg, text, border, ring) using common pair shades. Verifies
	 * the v4 plugin still emits pair utilities under the scheduling-bridge theme.
	 */
	const PAIR_SAMPLES: { class: string; label: string }[] = [
		{ class: 'bg-surface-100-900 text-primary-500-400', label: 'bg-surface-100-900 text-primary-500-400' },
		{ class: 'bg-secondary-300-700 text-secondary-contrast-300-700', label: 'bg-secondary-300-700' },
		{ class: 'border-tertiary-200-800 border-2 bg-surface-50-950', label: 'border-tertiary-200-800' },
		{ class: 'ring-primary-500-400 ring-2 bg-surface-50-950', label: 'ring-primary-500-400' },
		{ class: 'bg-success-200-800 text-success-contrast-200-800', label: 'bg-success-200-800' },
		{ class: 'bg-warning-300-700 text-warning-contrast-300-700', label: 'bg-warning-300-700' },
		{ class: 'bg-error-100-900 text-error-500-400', label: 'bg-error-100-900 text-error-500-400' },
	];

	/**
	 * Gating runs client-side only. The route is prerendered (adapter-static
	 * emits build/style-guide/index.html), and prerendering forbids
	 * server-side reads of `url.searchParams`. We start in the gated
	 * "closed" state and flip to "open" on mount when the URL contains
	 * `?guide=1`. Crawlers/bots without JS see the gated message — exactly
	 * the desired behaviour.
	 */
	let guideOpen = $state(false);

	onMount(() => {
		guideOpen = new URLSearchParams(window.location.search).get('guide') === '1';
	});

	// Local state for interactive components.
	let switchOn = $state(false);
	let dialogOpen = $state(false);
	let popoverOpen = $state(false);
	let activeTab = $state('overview');
	const toaster = createToaster({ placement: 'bottom-end', overlap: true });

	function fireToast() {
		toaster.create({
			title: 'Toast smoke',
			description: 'createToaster + Toast.Group wired correctly.',
			type: 'info',
			duration: 4000,
		});
	}
</script>

<svelte:head>
	<title>Style guide · scheduling-bridge</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if !guideOpen}
	<section class="container mx-auto px-6 py-16">
		<h1 class="mb-4 text-3xl font-bold">Style guide</h1>
		<p class="text-surface-700-300 max-w-prose">
			This page is for designers and contributors auditing the design system. It is intentionally hidden from the
			production navigation. Append <code class="bg-surface-100-900 rounded px-1">?guide=1</code> to the URL to view the full
			smoke test.
		</p>
		<p class="mt-4">
			<a href="/style-guide?guide=1" class="text-primary-500-400 underline">Open style guide</a>
		</p>
	</section>
{:else}
	<main class="container mx-auto flex flex-col gap-16 px-6 py-12" id="style-guide">
		<header>
			<p class="text-surface-600-400 font-mono text-xs uppercase tracking-wide">M2.5 · TIN-779</p>
			<h1 class="mt-1 text-4xl font-bold tracking-tight">Style guide</h1>
			<p class="text-surface-700-300 mt-3 max-w-prose">
				Smoke test for theme scales, typography, and Skeleton 5 components under the
				<code class="bg-surface-100-900 rounded px-1">scheduling-bridge</code> house theme. Not part of production navigation.
			</p>
		</header>

		<!-- ============== COLOR SCALES ============== -->
		<section aria-labelledby="scales-heading" class="flex flex-col gap-6">
			<h2 id="scales-heading" class="text-2xl font-bold">Color scales</h2>
			<p class="text-surface-700-300 max-w-prose">
				Seven scales × eleven shades. Each swatch is annotated with its OKLCH value (sourced from
				<code class="bg-surface-100-900 rounded px-1">themes/scheduling-bridge.css</code>).
			</p>
			{#each SCALES as scale (scale)}
				<div class="flex flex-col gap-2">
					<h3 class="font-mono text-sm uppercase tracking-wide">{scale}</h3>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-11">
						{#each SHADES as shade (shade)}
							<div class="border-surface-300-700 flex flex-col overflow-hidden rounded border text-xs">
								<div class={`${SWATCH_CLASSES[scale][shade]} h-12`} aria-hidden="true"></div>
								<div class="bg-surface-50-950 flex flex-col px-2 py-1">
									<span class="font-mono text-xs">{shade}</span>
									<span class="text-surface-600-400 break-all font-mono text-[10px] leading-tight">
										{OKLCH[scale][shade]}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</section>

		<!-- ============== COLOR PAIRS ============== -->
		<section aria-labelledby="pairs-heading" class="flex flex-col gap-4">
			<h2 id="pairs-heading" class="text-2xl font-bold">Color-pair utilities</h2>
			<p class="text-surface-700-300 max-w-prose">
				Verifies that Skeleton 5's own <code class="bg-surface-100-900 rounded px-1">@theme inline</code>
				pair tokens emit pair utilities (<code class="bg-surface-100-900 rounded px-1">bg</code>,
				<code class="bg-surface-100-900 rounded px-1">text</code>,
				<code class="bg-surface-100-900 rounded px-1">border</code>,
				<code class="bg-surface-100-900 rounded px-1">ring</code>) for the scheduling-bridge theme.
			</p>
			<div class="grid gap-3 md:grid-cols-2">
				{#each PAIR_SAMPLES as pair (pair.label)}
					<div class={`${pair.class} flex items-center justify-between rounded p-4`}>
						<span class="font-mono text-sm">{pair.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- ============== TYPOGRAPHY ============== -->
		<section aria-labelledby="typo-heading" class="flex flex-col gap-4">
			<h2 id="typo-heading" class="text-2xl font-bold">Typography</h2>
			<div class="prose prose-sm max-w-none">
				<h1 class="text-5xl font-bold">Heading 1 — display</h1>
				<h2 class="text-4xl font-bold">Heading 2</h2>
				<h3 class="text-3xl font-bold">Heading 3</h3>
				<h4 class="text-2xl font-bold">Heading 4</h4>
				<h5 class="text-xl font-bold">Heading 5</h5>
				<h6 class="text-lg font-bold">Heading 6</h6>
				<p class="my-4 max-w-prose">
					A paragraph of prose with an <code class="bg-surface-100-900 rounded px-1">inline code</code> token, an
					<a href="#typo-heading" class="text-primary-500-400 underline">anchor link</a> (tab to focus to verify focus
					ring), and an <em>emphasised</em> phrase. Skeleton's anchor tokens drive hover, active, and focus states from the
					scheduling-bridge theme.
				</p>
				<pre class="bg-surface-100-900 my-4 overflow-x-auto rounded p-4 text-sm"><code
						>{`// pre+code block — representative code sample
const booking = await bridge.schedule({ vendor: "acuity", slot });
console.log(booking.confirmationId);`}</code
					></pre>
				<blockquote class="border-primary-500-400 my-4 border-l-4 pl-4 italic">
					Blockquote — Skeleton 5 typography tokens drive bordered quotes.
				</blockquote>
				<ul class="my-4 list-disc pl-6">
					<li>Unordered list item one</li>
					<li>Unordered list item two</li>
					<li>Unordered list item three</li>
				</ul>
				<ol class="my-4 list-decimal pl-6">
					<li>Ordered list item one</li>
					<li>Ordered list item two</li>
					<li>Ordered list item three</li>
				</ol>
			</div>
		</section>

		<!-- ============== SKELETON 5 COMPONENTS ============== -->
		<section aria-labelledby="components-heading" class="flex flex-col gap-6">
			<h2 id="components-heading" class="text-2xl font-bold">Skeleton 5 components</h2>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">AppBar (mini)</h3>
				<AppBar class="bg-surface-100-900 rounded">
					<AppBar.Toolbar class="px-3 py-2">
						<AppBar.Lead><span class="font-mono text-sm font-bold">scheduling-bridge</span></AppBar.Lead>
						<AppBar.Headline><span class="text-xs">mini variant</span></AppBar.Headline>
						<AppBar.Trail><span class="text-xs">trail</span></AppBar.Trail>
					</AppBar.Toolbar>
				</AppBar>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Avatar (image + fallback)</h3>
				<div class="flex items-center gap-4">
					<Avatar class="bg-surface-200-800 inline-flex size-12 overflow-hidden rounded-full">
						<Avatar.Image
							src="https://github.com/Jesssullivan.png"
							alt="Jess Sullivan avatar"
							class="size-full object-cover"
						/>
						<Avatar.Fallback class="text-sm font-semibold">JS</Avatar.Fallback>
					</Avatar>
					<Avatar class="bg-primary-500 text-primary-contrast-500 inline-flex size-12 overflow-hidden rounded-full">
						<Avatar.Image src="data:image/svg+xml,broken" alt="" class="size-full object-cover" />
						<Avatar.Fallback class="flex size-full items-center justify-center text-sm font-semibold">
							OM
						</Avatar.Fallback>
					</Avatar>
				</div>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Tabs</h3>
				<Tabs
					value={activeTab}
					onValueChange={(d) => {
						activeTab = d.value;
					}}
				>
					<Tabs.List class="border-surface-200-800 flex gap-2 border-b">
						<Tabs.Trigger
							value="overview"
							class="data-[state=active]:border-primary-500 border-b-2 border-transparent px-3 py-2 text-sm"
						>
							Overview
						</Tabs.Trigger>
						<Tabs.Trigger
							value="install"
							class="data-[state=active]:border-primary-500 border-b-2 border-transparent px-3 py-2 text-sm"
						>
							Install
						</Tabs.Trigger>
						<Tabs.Trigger
							value="usage"
							class="data-[state=active]:border-primary-500 border-b-2 border-transparent px-3 py-2 text-sm"
						>
							Usage
						</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="overview" class="py-3 text-sm">
						scheduling-bridge routes bookings through hostile calendar stacks via a monadic DAG.
					</Tabs.Content>
					<Tabs.Content value="install" class="py-3 text-sm">
						<code class="bg-surface-100-900 rounded px-1">docker pull ghcr.io/jesssullivan/scheduling-bridge</code>
					</Tabs.Content>
					<Tabs.Content value="usage" class="py-3 text-sm">See the engine repo for usage details.</Tabs.Content>
				</Tabs>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Tooltip</h3>
				<Tooltip openDelay={150} closeDelay={100}>
					<Tooltip.Trigger
						class="bg-primary-500 text-primary-contrast-500 hover:bg-primary-600 rounded px-3 py-2 text-sm"
						type="button"
					>
						Hover or focus me
					</Tooltip.Trigger>
					<Portal>
						<Tooltip.Positioner class="z-50">
							<Tooltip.Content class="bg-surface-900-50 text-surface-50-950 rounded px-2 py-1 text-xs shadow">
								Tooltip content
							</Tooltip.Content>
						</Tooltip.Positioner>
					</Portal>
				</Tooltip>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Switch</h3>
				<Switch
					checked={switchOn}
					onCheckedChange={(d) => {
						switchOn = d.checked;
					}}
					class="flex items-center gap-3"
				>
					<Switch.Control
						class="bg-surface-300-700 data-[state=checked]:bg-primary-500 relative inline-flex h-6 w-10 items-center rounded-full transition-colors"
					>
						<Switch.Thumb
							class="bg-surface-50 size-5 translate-x-0.5 rounded-full shadow transition-transform data-[state=checked]:translate-x-[1.125rem]"
						/>
						<Switch.HiddenInput />
					</Switch.Control>
					<Switch.Label class="text-sm">Switch is {switchOn ? 'on' : 'off'}</Switch.Label>
				</Switch>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Toast</h3>
				<button
					type="button"
					class="bg-secondary-500 text-secondary-contrast-500 hover:bg-secondary-600 self-start rounded px-3 py-2 text-sm"
					onclick={fireToast}
				>
					Trigger toast
				</button>
				<Portal>
					<Toast.Group {toaster} class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
						{#snippet children(toast)}
							<Toast
								{toast}
								class="bg-surface-900-50 text-surface-50-950 flex flex-col gap-1 rounded px-3 py-2 text-sm shadow-lg"
							>
								<Toast.Title class="font-semibold" />
								<Toast.Description class="text-xs opacity-80" />
								<Toast.CloseTrigger class="self-end text-xs underline">close</Toast.CloseTrigger>
							</Toast>
						{/snippet}
					</Toast.Group>
				</Portal>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Popover</h3>
				<Popover
					open={popoverOpen}
					onOpenChange={(d) => {
						popoverOpen = d.open;
					}}
					closeOnInteractOutside
					closeOnEscape
				>
					<Popover.Trigger
						class="bg-tertiary-500 text-tertiary-contrast-500 hover:bg-tertiary-600 self-start rounded px-3 py-2 text-sm"
					>
						Toggle popover
					</Popover.Trigger>
					<Portal>
						<Popover.Positioner class="z-50">
							<Popover.Content
								class="bg-surface-50-950 border-surface-300-700 max-w-xs rounded border p-3 text-sm shadow-lg"
							>
								<p class="font-semibold">Popover content</p>
								<p class="text-surface-700-300 mt-1 text-xs">
									Same component used by the theme-mode switcher in the AppBar.
								</p>
							</Popover.Content>
						</Popover.Positioner>
					</Portal>
				</Popover>
			</div>

			<div class="border-surface-200-800 flex flex-col gap-2 rounded border p-4">
				<h3 class="font-mono text-sm uppercase">Dialog</h3>
				<Dialog
					open={dialogOpen}
					onOpenChange={(d) => {
						dialogOpen = d.open;
					}}
					closeOnInteractOutside
					closeOnEscape
				>
					<Dialog.Trigger
						class="bg-error-500 text-error-contrast-500 hover:bg-error-600 self-start rounded px-3 py-2 text-sm"
					>
						Open dialog
					</Dialog.Trigger>
					<Dialog.Backdrop class="fixed inset-0 z-40 bg-black/40" />
					<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
						<Dialog.Content
							class="bg-surface-50-950 border-surface-300-700 w-full max-w-md rounded border p-5 shadow-xl"
						>
							<Dialog.Title class="text-lg font-semibold">Dialog smoke</Dialog.Title>
							<Dialog.Description class="text-surface-700-300 mt-2 text-sm">
								Modal with backdrop and open/close trigger. Verifies focus management.
							</Dialog.Description>
							<div class="mt-4 flex justify-end gap-2">
								<Dialog.CloseTrigger class="bg-surface-200-800 hover:bg-surface-300-700 rounded px-3 py-1.5 text-sm">
									Close
								</Dialog.CloseTrigger>
							</div>
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog>
			</div>
		</section>

		<!-- ============== LIGHT/DARK COMPARISON ============== -->
		<section aria-labelledby="modes-heading" class="flex flex-col gap-4">
			<h2 id="modes-heading" class="text-2xl font-bold">Light / dark side-by-side</h2>
			<p class="text-surface-700-300 max-w-prose">
				Both palettes rendered together via scoped <code class="bg-surface-100-900 rounded px-1">data-mode</code>
				wrappers. The page-wide theme is unaffected.
			</p>
			<div class="grid gap-4 md:grid-cols-2">
				{#each ['light', 'dark'] as mode (mode)}
					<div data-mode={mode} class="bg-surface-50-950 text-surface-950-50 rounded p-4">
						<p class="text-surface-600-400 font-mono text-xs uppercase">{mode}</p>
						<h3 class="mt-1 text-lg font-bold">Heading sample</h3>
						<p class="mt-1 text-sm">
							Body copy with <a href="#modes-heading" class="text-primary-500-400 underline">a link</a>.
						</p>
						<div class="mt-3 flex gap-2">
							<span class="bg-primary-500 text-primary-contrast-500 rounded px-2 py-1 text-xs">primary</span>
							<span class="bg-secondary-500 text-secondary-contrast-500 rounded px-2 py-1 text-xs">secondary</span>
							<span class="bg-tertiary-500 text-tertiary-contrast-500 rounded px-2 py-1 text-xs">tertiary</span>
						</div>
						<div class="mt-2 flex gap-2">
							<span class="bg-success-500 text-success-contrast-500 rounded px-2 py-1 text-xs">success</span>
							<span class="bg-warning-500 text-warning-contrast-500 rounded px-2 py-1 text-xs">warning</span>
							<span class="bg-error-500 text-error-contrast-500 rounded px-2 py-1 text-xs">error</span>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</main>
{/if}
