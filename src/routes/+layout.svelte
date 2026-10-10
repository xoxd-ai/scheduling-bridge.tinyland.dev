<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { Menu, X } from '@lucide/svelte';
	import { AppBar, Dialog, Navigation } from '@skeletonlabs/skeleton-svelte';
	import { TinyVectors } from '@tummycrypt/tinyvectors';
	import '../app.css';
	import { theme } from '#lib/theme.svelte.js';
	import ThemeSwitcher from '#lib/components/ThemeSwitcher.svelte';

	let { children } = $props();

	let mobileOpen = $state(false);

	// External references only — this brand site is a single page, so the nav
	// points at the engine and the Tinyland hub rather than page sections.
	const ENGINE_URL = 'https://github.com/Jesssullivan/scheduling-bridge';
	const SITE_REPO_URL = 'https://github.com/tinyland-inc/scheduling-bridge.tinyland.dev';
	const LICENSE_URL = `${SITE_REPO_URL}/blob/main/LICENSE`;
	const SECURITY_URL = `${SITE_REPO_URL}/security/advisories/new`;

	const navLinks: { href: string; label: string; external?: boolean }[] = [
		{ href: ENGINE_URL, label: 'Engine', external: true },
		{ href: 'https://tinyland.dev', label: 'tinyland.dev', external: true },
	];

	onMount(() => {
		theme.init();
	});

	// SEO surface. Static values only — no per-page reactivity.
	// JSON-LD describes the WebSite (this brand surface) and the
	// SoftwareApplication (the scheduling-bridge engine, which lives in its own
	// repo). This site is the brand surface only — it is not the engine.
	const SITE_URL = 'https://scheduling-bridge.tinyland.dev';
	const SITE_TITLE = 'scheduling-bridge.tinyland.dev — Brand site for the scheduling-bridge engine';
	const SITE_DESCRIPTION =
		'Brand site for scheduling-bridge — monadic booking middleware for hostile calendar stacks. Vendor coverage is staged: Acuity in production, Cal.com read-only, GlossGenius and Vagaro planned.';
	const OG_IMAGE = `${SITE_URL}/og-image.png`;

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE_URL}/#website`,
				url: SITE_URL,
				name: 'scheduling-bridge.tinyland.dev',
				description: SITE_DESCRIPTION,
				inLanguage: 'en',
			},
			{
				'@type': 'SoftwareApplication',
				'@id': `${SITE_URL}/#software`,
				name: 'scheduling-bridge',
				description:
					'Monadic booking middleware for hostile calendar stacks. Acuity is the only production browser pack; Cal.com support is read-only; GlossGenius and Vagaro are planned.',
				applicationCategory: 'DeveloperApplication',
				softwareVersion: '0.7.1',
				url: SITE_URL,
				codeRepository: ENGINE_URL,
				author: {
					'@type': 'Person',
					name: 'Jess Sullivan',
				},
			},
		],
	};
</script>

<svelte:head>
	<link rel="canonical" href={SITE_URL} />
	<meta name="description" content={SITE_DESCRIPTION} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:title" content={SITE_TITLE} />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:site_name" content="scheduling-bridge.tinyland.dev" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE_TITLE} />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:image" content={OG_IMAGE} />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- static JSON-LD; JSON.stringify on a literal object is safe and the </script> sentinel is split to avoid early termination -->
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</` + `script>`}
</svelte:head>

<div class="relative flex min-h-screen flex-col bg-transparent">
	<!-- TinyVectors warm house-theme background. Browser-only — the component
	     uses window/navigator APIs and Svelte effects that crash under SSR.
	     Fixed full-viewport, behind everything, low opacity. -->
	{#if browser}
		<div
			class="pointer-events-none fixed inset-0 -z-10"
			style="overflow:hidden"
			aria-hidden="true"
			data-testid="vectors-bg"
		>
			<TinyVectors
				theme="custom"
				colors={['#cb6738', '#d99d6a', '#a14a52', '#6b4f3a', '#3d6b8c']}
				opacity={0.1}
				blobCount={5}
				enableScrollPhysics={true}
				enableDeviceMotion={false}
			/>
		</div>
	{/if}
	<a
		href="#main-content"
		class="focus:bg-primary-500 sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
		>Skip to content</a
	>

	<AppBar class="saturn-nav sticky top-0 z-40">
		<AppBar.Toolbar class="grid-cols-[auto_1fr_auto] px-4 py-2">
			<AppBar.Lead>
				<a
					href="/"
					class="hover:text-primary-500 font-mono text-lg font-bold tracking-tight whitespace-nowrap transition-colors inline-flex items-center gap-2"
					aria-label="scheduling-bridge home"
				>
					scheduling-bridge
				</a>
			</AppBar.Lead>
			<AppBar.Headline></AppBar.Headline>
			<AppBar.Trail>
				<nav class="hidden items-center gap-4 text-sm lg:flex" aria-label="Site navigation">
					{#each navLinks as { href, label, external } (href)}
						<a
							{href}
							target={external ? '_blank' : undefined}
							rel={external ? 'noopener' : undefined}
							aria-label={label}
							class="hover:text-primary-500 transition-colors">{label}</a
						>
					{/each}
					<ThemeSwitcher />
				</nav>

				<!-- Mobile drawer -->
				<Dialog
					open={mobileOpen}
					onOpenChange={(d) => {
						mobileOpen = d.open;
					}}
					closeOnInteractOutside
					closeOnEscape
					preventScroll
				>
					<Dialog.Trigger class="hover:bg-surface-200-800 rounded p-2 lg:hidden" aria-label="Open navigation">
						<Menu class="h-5 w-5" />
					</Dialog.Trigger>
					<Dialog.Backdrop class="fixed inset-0 z-40 bg-black/40" />
					<Dialog.Positioner class="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw]">
						<Dialog.Content class="bg-surface-50-950 flex w-full flex-col">
							<div class="border-surface-200-800 flex items-center justify-between border-b px-4 py-3">
								<span class="font-mono text-sm font-semibold">scheduling-bridge</span>
								<Dialog.CloseTrigger class="hover:bg-surface-200-800 rounded p-2" aria-label="Close navigation">
									<X class="h-5 w-5" />
								</Dialog.CloseTrigger>
							</div>
							<Navigation layout="sidebar">
								<Navigation.Content>
									<Navigation.Menu>
										{#each navLinks as { href, label } (href)}
											<Navigation.TriggerAnchor
												{href}
												onclick={() => {
													mobileOpen = false;
												}}
											>
												<Navigation.TriggerText>{label}</Navigation.TriggerText>
											</Navigation.TriggerAnchor>
										{/each}
									</Navigation.Menu>
								</Navigation.Content>
								<Navigation.Footer>
									<div class="flex w-full justify-center py-2">
										<ThemeSwitcher />
									</div>
								</Navigation.Footer>
							</Navigation>
						</Dialog.Content>
					</Dialog.Positioner>
				</Dialog>
			</AppBar.Trail>
		</AppBar.Toolbar>
	</AppBar>

	<div class="flex-1" id="main-content">
		{@render children?.()}
	</div>

	<footer class="border-surface-200-800 bg-surface-100-900/80 mt-16 border-t backdrop-blur-sm">
		<div class="container mx-auto flex flex-col gap-4 px-6 py-8 text-sm md:flex-row md:items-center md:justify-between">
			<p class="text-surface-700-300">A Jess Sullivan FOSS project built with Tinyland release infrastructure.</p>
			<nav class="flex flex-wrap gap-4" aria-label="Footer">
				<a href={ENGINE_URL} target="_blank" rel="noopener" class="hover:text-primary-500 transition-colors">Engine</a>
				<a href={SITE_REPO_URL} target="_blank" rel="noopener" class="hover:text-primary-500 transition-colors"
					>Site source</a
				>
				<a href={LICENSE_URL} target="_blank" rel="noopener" class="hover:text-primary-500 transition-colors">License</a
				>
				<a href={SECURITY_URL} target="_blank" rel="noopener" class="hover:text-primary-500 transition-colors"
					>Security</a
				>
			</nav>
		</div>
	</footer>
</div>
