# Agent Notes — scheduling-bridge.tinyland.dev

This file is the working contract for coding agents and LLMs operating in any
sister site spawned from this scaffold.

## Repo Role

This repo is **a static brand/project site under the Tinyland enterprise** —
one of many static, federated consumer surfaces of the `tinyland.dev` authority
monolith. It is **not** an application backend. It does not own user data,
auth, payments, or business logic. Those flow in via federated ActivityPub /
gRPC / signed JSON snapshots from `tinyland.dev`.

## Authoritative Entrypoints

- **DX/AX**: `Justfile` is the single source of truth for every operation.
  Always invoke through `just <recipe>`. Do not call `pnpm` / `vite` /
  `bazelisk` directly outside the Justfile unless adding a new recipe.
- **Shell**: `nix develop` (auto-loaded by `direnv`) — never assume host
  toolchain. CI runs `nix develop --command just <recipe>`.
- **Build**: `just build` produces a static `build/` (adapter-static).
- **Check**: `just check` runs sync + svelte-check.

## Bazel Posture

- Bazel exists for **module-graph integrity proofs** and future RBE pipeline
  acceleration. The canonical app build remains `pnpm run build`.
- Registry order: `tinyland-inc/bazel-registry` first, then BCR.
- RBE profile: `--config=flywheel` (only from runners with cluster reachability).
- Smoke: `bazelisk mod graph` and `bazelisk build //:node_modules` run in CI.

## Theme & Skeleton

- **Skeleton 5.0.1** (pinned exact, both `@skeletonlabs/skeleton` and
  `@skeletonlabs/skeleton-svelte`; estate ruling RP1, TIN-5694). Do not
  downgrade, range-pin, or take a prerelease.
- Tailwind v4 with no compatibility shim. The Skeleton 4 era
  `skeletonTailwindV4Compat()` plugin and `@tummycrypt/vite-plugin-skeleton-colors`
  (npm dep and `bazel_dep`) are deleted and stay deleted: Skeleton 5 emits
  `@variant` on purpose and declares every colour-pair token itself.
- The theme's root background uses the Skeleton 5 names
  `--color-root-bg-light` / `--color-root-bg-dark`. `src/app.css` carries the
  `@source` fences (non-page trees out; skeleton-svelte dist in).
- Theme cascade lives in `src/app.css`. Per-site brand themes go under
  `src/lib/styles/themes/`.

## Federation

- This site is a **passive ingestor** of `tinyland.dev` snapshots:
  - Posts (mdx) — sync from operator's permaspace
  - Products / offers — Schema.org Offer JSON
  - Events / scheduling — scheduling-kit-derived JSON
  - Pulse — `PublicPulseSnapshot` static JSON
- The scaffold ships placeholders. Federation wire-up happens per-site.

## Per-Site Customization Checklist

After `gh repo create --template tinyland-inc/site.scaffold`:

1. `direnv allow`
2. `scripts/rebrand.sh <site.example.com>` — rewrites name strings, env vars,
   bazel cache name, etc.
3. Update `MODULE.bazel` `module(name = ...)` to underscored site name.
4. Update `README.md` / `AGENTS.md` with the per-site brand purpose.
5. Replace `src/routes/+page.svelte` with the brand landing page.
6. Set the GH repo description and homepage URL via `gh repo edit`.
7. Push first commit; verify CI green (secrets-scan, build-and-test, bazel-graph).

## What Not To Do

- Don't add runtime database / API server to a sister site. Keep it static.
- Don't fork tinyland-color-utils / tinyvectors / vite plugins per-site.
  Pin via the BCR.
- Don't bypass `Justfile` in CI or local — DX/AX must stay homogenous.
- Don't unpin Skeleton or Tailwind v4-compat shim without coordination.
