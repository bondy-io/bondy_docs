# Bondy Developer Documentation

Official documentation for [Bondy Connect](https://bondy.io) - an open-source, scalable application networking platform.

[![CI](https://github.com/bondy-io/bondy_docs/actions/workflows/ci.yml/badge.svg)](https://github.com/bondy-io/bondy_docs/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-CC--BY--SA--4.0-blue.svg)](LICENSE)

## Documentation

Visit [developer.bondy.io](https://developer.bondy.io) to view the live documentation.

## Quick Start

### Prerequisites

- Node.js 20 or higher (use `.nvmrc` with `nvm use`)
- npm (ships with Node.js)
- [`just`](https://just.systems) and [`codespell`](https://github.com/codespell-project/codespell) - only needed for `npm run spellcheck` / `npm run spellfix`

### Setup

1. Clone the repository
```bash
git clone https://github.com/bondy-io/bondy_docs.git
cd bondy_docs
```

2. Install dependencies
```bash
npm install
```
`npm install` fetches `@leapsight/vitepress-template` and `@bondy/site-chrome` directly from their public git repos over HTTPS — no credentials or SSH key needed.

3. Start development server
```bash
npm run docs:dev
```

The site will be available at `http://localhost:5173`

## Available Scripts

### Development
- `npm run docs:dev` - Start development server with hot reload
- `npm run docs:preview` - Preview production build locally

### Building
- `npm run docs:build` - Build for production (includes assets and sitemap)

### Code Quality
- `npm run format` - Format markdown files with Prettier
- `npm run format:check` - Check formatting without making changes
- `npm run lint:md` - Lint markdown files
- `npm run lint:md:fix` - Auto-fix markdown linting issues
- `npm run spellcheck` - Check spelling
- `npm run spellfix` - Auto-fix spelling issues (interactive)
- `npm run check` - Run all checks (format, lint, spell)

### Maintenance
- `npm outdated` - List outdated dependencies

## Project Structure

```
bondy_docs/
├── docs/                      # Documentation content
│   ├── .vitepress/           # VitePress configuration & site-specific theme extras
│   ├── about/                # About pages
│   ├── concepts/             # Conceptual documentation
│   ├── guides/               # How-to guides
│   ├── reference/            # API reference
│   ├── tutorials/            # Tutorials
│   ├── assets/               # Images and assets
│   └── versions.json         # Version picker source of truth (see Versioning & Deployment)
├── .github/workflows/        # CI/CD pipelines (ci.yml, release-docs.yml, deploy.yml)
└── CONTRIBUTING.md           # Contribution guidelines
```

## Versioning & Deployment

The site is versioned: a small dropdown in the navbar lets readers switch between the current docs and older, archived snapshots, so a major content rewrite (like the storage/replication overhaul for Bondy 1.0.0) doesn't strand anyone still reading the previous version.

### How it works

- **`docs/versions.json`** is the single source of truth. It lists the `current` version and every `archived` version (each with the git tag that produced it). `docs/.vitepress/config.mjs` reads this file at build time to populate the navbar version picker and the `bondyVersion` site metadata — nothing about the version list is hardcoded in `config.mjs` itself.
- **The picker reads the version list from the live site.** Each build writes its list to `versions.json` in its output. When a page opens, the picker fetches `/versions.json` from the site root, which is always the current deployment's list. An archived version therefore lists the versions released after it, with no rebuild. If the fetch fails, the picker keeps the list from its own build. Archives built before `@leapsight/vitepress-template` v0.1.22 do not fetch the list: `v1.0.0-rc.65.1` shows only the versions that existed when it was built.
- **A build knows which version it documents from its base path.** A base of `/v<version>/` names that version; any other base is the current version. The picker shows this version on its button and marks it in the menu. This is one more reason the `version` field must equal the tag minus its `docs-` prefix (see below).
- **Each archived version is built once per tag.** Tagging a commit `docs-<version>` (e.g. `docs-1.0`) triggers `.github/workflows/release-docs.yml`, which builds that snapshot with its base path set to `/v<version>/` and publishes the output as a GitHub Release asset. Deploys never rebuild it. To fix a defect in an archived version, rebuild it on purpose — see [Rebuilding an archived version](#rebuilding-an-archived-version).
- **Every push to `main`** triggers `.github/workflows/deploy.yml`, which builds only the *current* version fresh, downloads each archived version's already-built package from GitHub Releases (per `docs/versions.json`, no rebuild), combines them into one directory (current at `/`, each archive at `/v<version>/`), and pushes the result to Netlify as a production deploy via the Netlify CLI.
- **Every push to `develop`** runs the same workflow, but deploys the result as a Netlify preview at `https://develop--<site>.netlify.app` instead of production. Each push replaces the previous preview.
- **`.github/workflows/ci.yml`** runs on every push/PR: build check, broken-link check, spellcheck. It doesn't deploy anything.

### How docs versions follow Bondy Connect

A docs version describes one Bondy Connect `major.minor` release line, such as `1.0` or `1.1`. The version picker then tells a reader which docs match the Bondy they run.

- **`main` documents the latest released Bondy Connect only.** Do not merge docs for an unreleased feature into `main`. The production site would describe behaviour that no released Bondy has.
- **`develop` documents the next Bondy Connect release.** Write docs for unreleased features here, and review them on the `develop` preview.
- **A patch release does not create a docs version.** Fix the docs on `main`. Mark a configuration parameter that a patch release adds or changes with the `since` argument of `@[config](...)`, or with `@[configDeprecated](...)` for a rename.
- **A new minor or major release archives the previous line.** Follow the steps below as part of the Bondy Connect release.
- **Name each docs tag after the Bondy Connect version it describes.** Use `docs-1.0` for the `1.0` line. For a release candidate, use the Bondy Connect tag name, such as `docs-1.1.0-rc.quince`.

### Cutting a new archived version

Do this when Bondy Connect releases a new minor or major version. The example archives `1.0` and makes `1.1` current.

1. On `main`, tag the last commit that documents `1.0`: `git tag -a docs-1.0 -m "Docs for Bondy Connect 1.0"` and `git push origin docs-1.0`. This triggers `release-docs.yml`, which builds and publishes the snapshot once. Wait until the release has the asset `docs-1.0.tar.gz`. Every later deploy downloads it.
2. On `develop`, update `docs/versions.json`: move the current entry into `archived` with `"tag": "docs-1.0"`, and set `current` to `1.1`. Push `develop`.
3. Examine the `develop` preview. It shows `1.1` as current and the `1.0` snapshot at `/v1.0/`. To do the same check locally, run `just verify-versions`.
4. Create the release branch from `develop` (for example `release/1.1.0`) and finish it into `main`. Push `main`. The next `deploy.yml` run picks up the new archived entry automatically — no further workflow changes needed.

Tag before you merge. A tag on a later commit freezes `1.1` content under the `1.0` label.

Do step 2 only after step 1 has published the asset. Before that, each `develop` deploy fails, because `deploy.yml` cannot download `docs-1.0.tar.gz`.

**The `version` field is the URL path, and it must equal the tag minus its `docs-` prefix.** `release-docs.yml` derives the base path a snapshot is built with from the tag name, while `deploy.yml` mounts that snapshot at `/v<version>/` from `versions.json`. If the two disagree the archived version still loads, but every stylesheet and script in it 404s. Use `label` for what the navbar should display when it differs from the path — e.g. the entry below is served at `/v1.0.0-rc.65.1/` and shown as `v1.0.0-rc`:

```json
{ "version": "1.0.0-rc.65.1", "label": "1.0.0-rc", "tag": "docs-1.0.0-rc.65.1" }
```

A mismatch also breaks the picker in that archive: the version its base path names is not in the list, so the picker marks no entry as the one you are reading.

### Rebuilding an archived version

Rebuild an archived version only to fix a defect in it, such as a broken link or an old version picker. Keep the tag name, so the version keeps its URL. The example rebuilds `1.0`.

1. Create a branch from the tag: `git switch -c support/1.0 'docs-1.0^{commit}'`. Commit only the fix. Do not merge content from later versions.
2. Build it with the archive's base path and check the result: `DOCS_BASE=/v1.0/ npm run docs:build`.
3. On GitHub, delete the `docs-1.0` release. Then delete the tag: `git push origin :refs/tags/docs-1.0`. Delete the release first, so that the new build cannot meet an old asset with the same name.
4. Tag the fix and push the tag: `git tag -fa docs-1.0 support/1.0 -m "Docs for Bondy Connect 1.0"` and `git push origin docs-1.0`. GitHub sometimes rejects a tag push with `Internal Server Error`. Run `git ls-remote --tags origin docs-1.0` to see the result, and push again if the tag is not there.
5. Wait until `release-docs.yml` publishes `docs-1.0.tar.gz`. Then deploy `main` again, for example by re-running its last Deploy workflow. Until a deploy succeeds, the site keeps the old snapshot.
6. Delete `.cache/docs-releases/docs-1.0.tar.gz`, so that `just site` downloads the new package.

From step 3 until step 5 finishes, every deploy fails, because `deploy.yml` cannot download `docs-1.0.tar.gz`. Do not push `main` or `develop` during that time.

### Previewing the combined site locally

`npm run docs:dev` only ever serves the current version. To see what actually gets deployed — current version plus every archived version at its own path:

```bash
just preview-site   # builds current, downloads archived releases, serves it all
```

This mirrors `deploy.yml` step for step. Archived packages are cached in `.cache/docs-releases/` and the assembled tree is written to `.site/`; both are gitignored. `just verify-versions` runs the same assembly and just checks each archived version's built-in base path against where it is mounted, without starting a server.

### One-time setup

**GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value | Used by |
|---|---|---|
| `NETLIFY_AUTH_TOKEN` | Netlify personal/team access token | `deploy.yml`'s deploy step |
| `NETLIFY_SITE_ID` | This site's Netlify Site ID | `deploy.yml`'s deploy step |

No secret is needed for installing `@leapsight/vitepress-template` (it's a public repo) or for downloading/publishing GitHub Releases (those use the automatically-provided `GITHUB_TOKEN`).

**Netlify:**

1. Get an **Auth Token**: User settings → Applications → Personal access tokens.
2. Get the **Site ID**: this site → Site settings → General → Site details.
3. **Stop builds**: Project configuration → Developer settings → Continuous deployment → Build settings → Configure → set Build status to "Stopped builds". This is required. Otherwise Netlify's own git-triggered build races with the deploy that `deploy.yml` pushes, and it can publish the current version without the archived versions. With builds stopped, Netlify does not build on a push, but deploys made with the CLI still publish ([Netlify: Stop or activate builds](https://docs.netlify.com/build/configure-builds/stop-or-activate-builds/)). The CLI's `--dir` then controls what is published, and the build command and publish directory in the dashboard are not used.

   Do not use "Lock to stop auto publishing" on the Deploys page for this. A locked site does not publish new deploys, so it can also hold back the deploys from `deploy.yml`.

The repository has no `netlify.toml`. Redirects and headers ship as `docs/public/_redirects` and `docs/public/_headers` inside the deployed directory. The dashboard keeps only what belongs to the site, not the build: the domain, HTTPS, and the token and site ID above.

**Algolia:** search is a single hosted DocSearch crawler/index shared across all versions. Its crawl config lives in Algolia's dashboard, not this repo. Versioned paths must be excluded from the crawl (otherwise archived-version pages pollute current-version search results with no way to tell them apart):

```json
"exclusionPatterns": [
  "https://developer.bondy.io/v*/",
  "https://developer.bondy.io/v*/**"
]
```

This is future-proof — any later `/v<version>/` is excluded automatically. Archived versions remain fully browsable via their own sidebar nav; they're just not searchable through the widget.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Checklist

1. Fork and create a feature branch
2. Make your changes
3. Run quality checks: `npm run check`
4. Test locally: `npm run docs:dev`
5. Submit a pull request

## Technology Stack

- [VitePress](https://vitepress.dev/) - Static site generator
- [Vue 3](https://vuejs.org/) - UI framework
- [Markdown](https://www.markdownguide.org/) - Content format
- [`@leapsight/vitepress-template`](https://github.com/Leapsight/vitepress-template) (imported as `@leapsight/vitepress-template/theme`) - Shared layout, components (Tabs, DataTreeView, ZoomImg, the version picker) and markdown kit reused across Leapsight documentation sites
- Site-specific components and plugins (`docs/.vitepress/theme/`) for the WAMP/config reference macros and other Bondy-specific markup

## License

Content is licensed under [CC-BY-SA-4.0](LICENSE)

## Links

- [Bondy.io](https://bondy.io) - Official website
- [Bondy GitHub](https://github.com/bondy-io/bondy) - Main repository
- [Community Forum](https://discuss.bondy.io) - Discussion forum
- [Community Chat](https://bondy.zulipchat.com) - Real-time chat

## Support

- [GitHub Issues](https://github.com/bondy-io/bondy_docs/issues) - Bug reports and feature requests
- [Community Forum](https://discuss.bondy.io) - General questions and discussion
- [Slack](https://join.slack.com/t/bondy-group/shared_invite/zt-1j1fbpr04-BUesuqeWBbblbqUPsXrP1A) - Community chat

---

Made by the Bondy Team and [Contributors](docs/about/contributors.md)