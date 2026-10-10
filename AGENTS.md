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
- **Check**: `just check` runs lint, `svelte-kit sync` + `svelte-check --tsgo`
  (TypeScript 7.0.2), the unit tests and the in-house pin parity gate.

## House Stack (RU1/RU5/RU13, estate uplift 2026-10-08)

- Exact pins: `@sveltejs/kit` 3.0.1, `svelte` 5.57.2, `vite` 8.3.3,
  `typescript` 7.0.2, `effect` 4.0.2, Skeleton 5.0.1, `vitest` and
  `@vitest/coverage-v8` 5.0.3, `@playwright/test` 1.64.0, `svelte-check` 4.7.6.
  `scripts/lib/stack-pins.test.mts` fails on drift until site.scaffold's
  estate manifest drift check replaces it.
- SvelteKit 3: there is no `svelte.config.js`; the config is passed to
  `sveltekit({...})` in `vite.config.ts`. `$lib` is gone: import from
  `#lib/...` (package.json `imports`), with a `.js` extension for `.ts`
  modules (TypeScript 7 under `--tsgo` does not extension-resolve subpath
  imports). Use `$app/env`, not the deprecated `$app/environment`.
- TypeScript 7 is the `typescript` package. Tools that still need the TS 6
  in-process API (Kit's sync, svelte-check, typescript-eslint) get
  `@typescript/typescript6` through `patches/` and `.pnpmfile.cjs`, copied
  byte-for-byte from site.scaffold (the shared patch home). Do not edit them
  here; re-copy from site.scaffold. See `patches/README.md`.
- Remote functions (RU3) are the estate pattern for forms and server data.
  This site has neither: it is prerendered everywhere with no forms and no
  runtime server data, so there is nothing to convert.

## Bazel Posture

- Bazel is the **only carrier for the in-house packages** (ruling RU9):
  `@tummycrypt/tinyland-color-utils`, `@tummycrypt/tinyvectors` and
  `@tummycrypt/vite-plugin-a11y` are `bazel_dep`s in `MODULE.bazel`, linked
  by root `npm_link_package` targets in `BUILD.bazel`, and absent from
  `package.json` and `pnpm-lock.yaml`. `just setup` runs `pnpm install` and
  then `just inhouse-link`, which builds those targets and materialises them
  into `node_modules`. `just bazel-pin-parity` (part of `just check`) is the gate.
- The canonical app build remains `pnpm run build` (`just build`).
- Registry order: `xoxd-ai/bazel-registry` pinned to an immutable commit in
  `.bazelrc`, then BCR. After a module bump: `just bazel-lock`, `just setup`,
  `just bazel-pin-parity`.
- RBE profile: `--config=flywheel` (only from runners with cluster reachability).
- Smoke: `just bazel-graph` (`--lockfile_mode=error`) and
  `just bazel-node-modules` run in CI.

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
- Don't fork tinyland-color-utils / tinyvectors / vite plugins per-site, and
  don't add them back to package.json. Pin the Bazel module instead.
- Don't bypass `Justfile` in CI or local — DX/AX must stay homogenous.
- Don't unpin Skeleton or Tailwind v4-compat shim without coordination.
