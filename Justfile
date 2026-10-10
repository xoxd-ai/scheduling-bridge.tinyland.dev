# scheduling-bridge.tinyland.dev — SvelteKit static site task runner
# Prerequisites: just, direnv (loads Nix devShell), Nix with flakes
# Quick Start: direnv allow && just setup && just dev
#
# See AGENTS.md.

set dotenv-load := true
set shell := ["bash", "-euo", "pipefail", "-c"]

root := justfile_directory()

# List available commands
_default:
    @just --list --unsorted

# ─────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────

# Install dependencies (frozen lockfile), then link the in-house packages.
# They are Bazel-carried (ruling RU9): package.json and pnpm-lock.yaml carry
# none of them, the root BUILD.bazel links each registry module with
# npm_link_package, and `inhouse-link` materialises those links into
# node_modules after pnpm has finished. pnpm never asks npmjs for them.
setup:
    cd {{ root }} && pnpm install --frozen-lockfile
    just inhouse-link
    @echo "Setup complete. Run 'just dev' to start."

# Build the root npm_link_package targets for the in-house registry modules
# and materialise each into node_modules/<pkg> (run after pnpm install).
inhouse-link:
    cd {{ root }} && node scripts/inhouse-link.mjs

# Start the Vite dev server
dev:
    cd {{ root }} && pnpm run dev

# Start the dev server and open browser
dev-open:
    cd {{ root }} && pnpm run dev -- --open

# ─────────────────────────────────────────────
# Build
# ─────────────────────────────────────────────

# Production static build (adapter-static -> build/)
build:
    cd {{ root }} && pnpm run build

# Clean then build
rebuild: clean build

# Preview the built site
preview: build
    cd {{ root }} && pnpm run preview

# Preview without rebuilding
preview-only:
    cd {{ root }} && pnpm run preview

# Remove build artifacts
clean:
    rm -rf {{ root }}/build {{ root }}/.svelte-kit

# Deep clean including node_modules
clean-all: clean
    rm -rf {{ root }}/node_modules

# ─────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────

# svelte-kit sync + svelte-check --tsgo, i.e. TypeScript 7.0.2 (RU13;
# delegates to package.json `check`)
typecheck:
    cd {{ root }} && pnpm run check

# ESLint flat config across the repo
lint:
    cd {{ root }} && pnpm run lint

# Prettier write
format:
    cd {{ root }} && pnpm run format

# Prettier check (no writes)
format-check:
    cd {{ root }} && pnpm run format:check

# Run Vitest unit tests
test-unit:
    cd {{ root }} && pnpm run test:unit

# Run Playwright E2E tests
test-e2e:
    cd {{ root }} && pnpm run test:e2e

# Run all tests (unit + e2e)
test: test-unit test-e2e

# Run lint + typecheck + unit + the in-house pin parity check (pre-commit gate)
check: lint typecheck test-unit bazel-pin-parity
    @echo "All checks passed."

# Run full CI pipeline locally
ci: check build test-e2e
    @echo "Full CI suite passed."

# Quick CI (skip e2e + build)
ci-quick: check
    @echo "Quick CI suite passed."

# ─────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────

# Sync SvelteKit types
sync:
    cd {{ root }} && pnpm exec svelte-kit sync

# Build with bundle analyzer
analyze:
    cd {{ root }} && BUILD_ANALYZE=true pnpm run build

# Bazel mod graph smoke (registry-resolution proof, refuses a stale lock).
# --lockfile_mode=error is load bearing: Bazel's default `update` mode
# rewrites MODULE.bazel.lock in place and then reports success.
bazel-graph:
    cd {{ root }} && bazelisk mod graph --lockfile_mode=error

# Regenerate MODULE.bazel.lock from MODULE.bazel (commit the result)
bazel-lock:
    cd {{ root }} && bazelisk mod deps --lockfile_mode=update

# Build the npm link tree and the in-house links (the other half of the CI
# Bazel smoke).
bazel-node-modules:
    cd {{ root }} && bazelisk build //:node_modules //:inhouse_packages

# Assert the in-house packages are Bazel-only: each bazel_dep pairs with one
# root npm_link_package, package.json and pnpm-lock.yaml carry none of them,
# and the materialised node_modules copy is the pinned version. Pure node.
bazel-pin-parity:
    cd {{ root }} && node scripts/check-bazel-npm-pin-parity.mjs

# Generate changelog (git-cliff)
changelog:
    git-cliff --output CHANGELOG.md

# Preview changelog without writing
changelog-preview:
    git-cliff --unreleased

# Install git hooks (no-op if scripts/hooks/pre-commit absent)
install-hooks:
    @if [ -f {{ root }}/scripts/hooks/pre-commit ]; then \
      ln -sf ../../scripts/hooks/pre-commit {{ root }}/.git/hooks/pre-commit && echo "Git hooks installed."; \
    else \
      echo "No scripts/hooks/pre-commit yet — skipping."; \
    fi

# Show environment info
info:
    @echo "Site:    scheduling-bridge.tinyland.dev"
    @echo "Repo:    xoxd-ai/scheduling-bridge.tinyland.dev"
    @echo "Node:    $(node --version 2>/dev/null || echo 'not available')"
    @echo "pnpm:    $(pnpm --version 2>/dev/null || echo 'not available')"
    @echo "Just:    $(just --version 2>/dev/null || echo 'not available')"
    @echo "Bazel:   $(if command -v bazelisk >/dev/null 2>&1; then bazelisk --version 2>&1 | head -n1; else echo 'not available'; fi)"
    @echo "Root:    {{ root }}"

# View the GitHub repo (opens in browser)
gh-repo:
    gh repo view xoxd-ai/scheduling-bridge.tinyland.dev --web
