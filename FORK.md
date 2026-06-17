# About this fork

This repository is a **fork** of [`gitroomhq/postiz-app`](https://github.com/gitroomhq/postiz-app) — the upstream Postiz project. It is maintained by [@JacobPritchett](https://github.com/JacobPritchett) and exists to host a small number of personal changes on top of upstream Postiz.

It is **not** an official Postiz distribution. For the canonical project, documentation, hosted product, and support, go to upstream: <https://github.com/gitroomhq/postiz-app> and <https://postiz.com>.

## License & attribution

Postiz is licensed under the **GNU AGPL-3.0**. This fork inherits and preserves that license unchanged — see [`LICENSE`](./LICENSE). All original copyright and authorship remain with the upstream Postiz authors (Gitroom / Nevo David and contributors). Nothing in this fork relicenses or claims ownership of the upstream work.

If you use or redistribute this fork, the AGPL-3.0 terms continue to apply, including the network-use source-availability requirement.

## Relationship to upstream

| | |
|---|---|
| Upstream (parent) | [`gitroomhq/postiz-app`](https://github.com/gitroomhq/postiz-app) |
| This fork | [`JacobPritchett/postiz-app`](https://github.com/JacobPritchett/postiz-app) |
| Default branch | `main` |

### `main`

The `main` branch of this fork tracks upstream `main`. It carries **no original changes** — it is a mirror of upstream and may at times lag behind it. Treat upstream `main` as the source of truth for the core product.

## What diverges from upstream

The only original work in this fork lives on a dedicated feature branch, kept separate from `main`:

### `at/compose-time-shortening`

Compose-time link handling and a per-network character-limit fix. Diff vs. upstream `main`: ~6 files, ~291 insertions.

- **Compose-time URL shortening** — URLs are pre-shortened when the editor mounts, and a backend shorten is auto-triggered, so the character count reflects the final (shortened) links while composing.
- **Correct X (Twitter) non-Premium `maxLength`** — fixes the character limit applied for non-Premium X accounts.
- **Farcaster embeds cast** — a build-unblocking type cast in the Farcaster provider.
- Adds a fork-specific CI workflow (`.github/workflows/build-fork-arm64.yml`) for building an arm64 image from this fork.

Files touched:

```
.github/workflows/build-fork-arm64.yml
apps/backend/src/api/routes/posts.controller.ts
apps/frontend/src/components/new-launch/editor.tsx
libraries/nestjs-libraries/src/database/prisma/posts/posts.service.ts
libraries/nestjs-libraries/src/integrations/social/farcaster.provider.ts
libraries/nestjs-libraries/src/integrations/social/x.provider.ts
```

### Other branches

Any other branches present in this fork (`sentry-*`, `fix/*`, `flyio-new-files`, `dependabot/*`, `snyk-*`) are **not original work**. They are upstream pull-request branches, automated dependency/security bot branches, or a one-time Fly.io launch scaffold. They are retained only for convenience and do not represent intentional divergence from upstream.

## Keeping in sync with upstream

```bash
# one-time: add the upstream remote
git remote add upstream https://github.com/gitroomhq/postiz-app.git

# sync main with upstream
git fetch upstream
git checkout main
git merge --ff-only upstream/main   # main carries no local commits, so fast-forward is safe
git push origin main
```

Rebase feature branches (e.g. `at/compose-time-shortening`) onto the refreshed `main` as needed.

## Contributing upstream

Bug fixes and features that aren't specific to this fork belong upstream. Please open issues and pull requests against [`gitroomhq/postiz-app`](https://github.com/gitroomhq/postiz-app) rather than here.
