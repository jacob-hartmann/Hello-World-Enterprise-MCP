# Releasing `hello-world-enterprise-mcp`

This repo uses **git tags** to drive releases and publishes to npm under the package name **`hello-world-enterprise-mcp`**.

## Release notes

### CI (recommended)

The GitHub Actions workflow creates a GitHub Release with **auto-generated release notes**:

- `.github/workflows/release.yml` uses `softprops/action-gh-release` with `generate_release_notes: true`.
- GitHub generates notes from commits / merged PRs since the last release.

You can edit the resulting GitHub Release in the UI after it's created (to add highlights, breaking changes, etc.).

### Manual (optional)

If you're creating a GitHub Release manually, you can generate notes with the GitHub CLI:

```bash
gh release create v0.1.0 --generate-notes
```

Or create it as a draft and edit:

```bash
gh release create v0.1.0 --draft --generate-notes
```

## Changelog

This repo maintains a human-curated `CHANGELOG.md` for users who prefer a stable, version-by-version summary.

Before tagging a release, update:

- `CHANGELOG.md` (move items from `[Unreleased]` into the new version section)

## Versioning + tags

- **Source of truth**: `package.json` `version`
- **Tag format**: `v${version}` (example: `v0.1.0`)
- The GitHub release workflow verifies the tag matches `package.json`:
  - Tag must equal `v$(node -p "require('./package.json').version")`

## Prerelease (RC) release

Use RCs for testing without moving the npm `latest` tag.

### Commands (RC)

```bash
git switch main
git pull --ff-only

# bump version, create commit + tag (creates tag v0.1.0-rc.N)
pnpm version 0.1.0-rc.1 -m "chore(release): v%s"

# push commit + tag
git push origin main
git push origin v0.1.0-rc.1
```

### Publishing behavior

- **CI** publishes prereleases with `--tag rc` (so they do not become `latest`).
- Manual local publish should also use `--tag rc`.

## Stable release

Stable releases should publish as `latest`.

### Commands (stable)

```bash
git switch main
git pull --ff-only

pnpm version 0.1.0 -m "chore(release): v%s"

git push origin main
git push origin v0.1.0
```

## Manual publish to npm (local machine)

Use this if you want to publish once manually before fully trusting CI.

### 1) Build + validate locally

```bash
pnpm install
pnpm run check
pnpm run build
```

### 2) Preview the tarball contents (no upload)

`pnpm pack` does not support `--dry-run`. Use npm:

```bash
npm pack --dry-run
```

### 3) Login + publish

```bash
npm adduser
npm whoami
```

Prerelease:

```bash
npm publish --tag rc --access public
```

Stable:

```bash
npm publish --access public
```

## Automated release via CI (GitHub Actions)

When you push a git tag (e.g., `v0.1.0`), the GitHub Actions workflow:

1. Verifies the tag matches `package.json`
2. Runs tests and builds
3. Publishes to npm (trusted publishing)
4. Creates a GitHub Release with auto-generated notes

### Trusted Publishing (no NPM_TOKEN needed)

This repo uses **npm's trusted publishing** via OIDC. No NPM_TOKEN secret is required in GitHub.

### First-time setup

If this is a new package, ensure:

1. **npm package exists** (publish v0.0.1 manually first if needed)
2. **npm trusted publishing** is configured at <https://www.npmjs.com/settings/jacob-hartmann/packages>
   - Provider: GitHub Actions
   - Package: `hello-world-enterprise-mcp`
   - Owner: `jacob-hartmann`
   - Repository: `hello-world-enterprise-mcp`
   - Workflow: `release.yml`
   - Environment: (leave blank)

## Post-release checklist

After a successful release:

1. Verify the npm package page shows the new version
2. Update GitHub Release notes if needed (add highlights, migration notes, etc.)
3. Announce the release (Twitter, Discord, etc.) if desired
