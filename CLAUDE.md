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
- Bazel registry: `tinyland-inc/bazel-registry` first, then BCR.
- See parent: https://github.com/tinyland-inc/scheduling-bridge.tinyland.dev
