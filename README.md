# scheduling-bridge.tinyland.dev

> Brand site for **scheduling-bridge** — monadic booking middleware for hostile calendar stacks.

This repository is the static brand surface only. The engine lives at
[`Jesssullivan/scheduling-bridge`](https://github.com/Jesssullivan/scheduling-bridge)
(v0.7.1, shipped as a ghcr container).

## Vendor coverage

Vendor claims on this site always carry a maturity qualifier —
**production**, **read-only**, or **planned**:

| Vendor      | Maturity                                              |
| ----------- | ----------------------------------------------------- |
| Acuity      | **Production** — the only production browser pack     |
| Cal.com     | **Read-only** — REST support landed upstream          |
| GlossGenius | **Planned** — not started                             |
| Vagaro      | **Planned** — not started                             |

## Status

- **Tier:** Tier 2 — strategic
- **GTM bucket:** FOSS; paired enterprise integration is aspirational, not an existing offering
- **Stage:** brand surface for the scheduling-bridge engine
- **Owner:** Jess Sullivan (sole proprietor)

## Stack

Static SvelteKit, Skeleton 5.0.1 (pinned), Tailwind v4, Bazel + Nix + Just per the
Tinyland house scaffold. No runtime database, no auth at the edge. Federated content
flows in from `tinyland.dev` via signed `PublicPulseSnapshot` JSON (planned).

## Quick start

```bash
direnv allow
just setup
just dev
```

## Federation

This site is a **passive ingestor** of `tinyland.dev` snapshots:

- Posts (mdx) — sync from operator's permaspace
- Products / offers — Schema.org Offer JSON
- Events / scheduling — scheduling-kit-derived JSON
- Pulse — `PublicPulseSnapshot` static JSON

Wire-up happens once the federation contract is finalized at the
authority monolith.

## See also

- Engine: [`Jesssullivan/scheduling-bridge`](https://github.com/Jesssullivan/scheduling-bridge)
- House scaffold: [`tinyland-inc/site.scaffold`](https://github.com/tinyland-inc/site.scaffold)
- Authority monolith: [`tinyland-inc/tinyland.dev`](https://github.com/tinyland-inc/tinyland.dev)
- Internal map of all sister sites: [`tinyland-inc/tinyland.internal`](https://github.com/tinyland-inc/tinyland.internal)
