# Claude — scheduling-bridge.tinyland.dev sister site

This is a sister site spawned from `tinyland-inc/site.scaffold`. Read
`AGENTS.md` first for the authoritative operating contract.

Quick reminders:

- Use `just <recipe>` for every operation — do not invoke pnpm/vite/bazelisk
  directly unless extending the Justfile.
- Sites are static. No runtime DB, no auth at the edge — federate via
  `tinyland.dev` snapshots.
- Skeleton 5.0.1 pinned exact (RP1, TIN-5694). Tailwind v4 with no
  compatibility shim; the Skeleton 4 `skeletonTailwindV4Compat()` plugin and
  `@tummycrypt/vite-plugin-skeleton-colors` are deleted and stay deleted.
- SvelteKit 3.0.1 / TypeScript 7.0.2 (`svelte-check --tsgo`): no
  `svelte.config.js`, `#lib/...` instead of `$lib`. See AGENTS.md.
- In-house packages come only from Bazel (`bazel_dep` + `npm_link_package`);
  `just setup` links them. Never add them to package.json.
- Bazel registry: `xoxd-ai/bazel-registry` (pinned commit) first, then BCR.
- See parent: https://github.com/xoxd-ai/scheduling-bridge.tinyland.dev
