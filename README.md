# Bondy Developer Documentation

Official documentation for [Bondy](https://bondy.io) - an open-source, scalable application networking platform.

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
- **Archived versions are built exactly once, ever.** Tagging a commit `docs-<version>` (e.g. `docs-1.0.0-rc`) triggers `.github/workflows/release-docs.yml`, which builds that snapshot with its base path set to `/v<version>/` and publishes the output as a GitHub Release asset. That build is never repeated.
- **Every push to `master`** triggers `.github/workflows/deploy.yml`, which builds only the *current* version fresh, downloads each archived version's already-built package from GitHub Releases (per `docs/versions.json`, no rebuild), combines them into one directory (current at `/`, each archive at `/v<version>/`), and pushes the result to Netlify as a production deploy via the Netlify CLI.
- **`.github/workflows/ci.yml`** runs on every push/PR: build check, broken-link check, spellcheck. It doesn't deploy anything.

### Cutting a new archived version

When a future rewrite needs the same treatment:

1. Update `docs/versions.json`: move the current entry into `archived` (giving it a `tag`), and set a new `current`.
2. Tag the commit you want frozen: `git tag -a docs-<version> -m "..."` and `git push origin docs-<version>`. This triggers `release-docs.yml`, which builds and publishes it once.
3. Push the `versions.json` update to `master`. The next `deploy.yml` run picks up the new archived entry automatically — no further workflow changes needed.

**The `version` field is the URL path, and it must equal the tag minus its `docs-` prefix.** `release-docs.yml` derives the base path a snapshot is built with from the tag name, while `deploy.yml` mounts that snapshot at `/v<version>/` from `versions.json`. If the two disagree the archived version still loads, but every stylesheet and script in it 404s. Use `label` for what the navbar should display when it differs from the path — e.g. the entry below is served at `/v1.0.0-rc.65.1/` and shown as `v1.0.0-rc`:

```json
{ "version": "1.0.0-rc.65.1", "label": "1.0.0-rc", "tag": "docs-1.0.0-rc.65.1" }
```

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
3. **Stop auto-publishing**: Site settings → Build & deploy → Continuous deployment → "Stop auto publishing". This is required — otherwise Netlify's own git-triggered build races with (and can overwrite) the versioned deploy pushed by `deploy.yml`. Once stopped, the CLI's `--dir` flag is what controls what gets published; any build command/publish directory still configured in the dashboard is unused.

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