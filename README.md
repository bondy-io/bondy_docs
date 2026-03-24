# Bondy Developer Documentation

Official documentation for [Bondy](https://bondy.io) - an open-source, scalable application networking platform.

[![CI](https://github.com/bondy-io/bondy_docs/actions/workflows/ci.yml/badge.svg)](https://github.com/bondy-io/bondy_docs/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-CC--BY--SA--4.0-blue.svg)](LICENSE)

## Documentation

Visit [developer.bondy.io](https://developer.bondy.io) to view the live documentation.

## Quick Start

### Prerequisites

- Node.js 20 or higher (use `.nvmrc` with `nvm use`)
- Yarn package manager

### Setup

1. Clone the repository
```bash
git clone https://github.com/bondy-io/bondy_docs.git
cd bondy_docs
```

2. Install dependencies
```bash
yarn install
```

3. Start development server
```bash
yarn docs:dev
```

The site will be available at `http://localhost:5173`

## Available Scripts

### Development
- `yarn docs:dev` - Start development server with hot reload
- `yarn docs:preview` - Preview production build locally

### Building
- `yarn docs:build` - Build for production (includes assets and sitemap)

### Code Quality
- `yarn format` - Format markdown files with Prettier
- `yarn format:check` - Check formatting without making changes
- `yarn lint:md` - Lint markdown files
- `yarn lint:md:fix` - Auto-fix markdown linting issues
- `yarn spellcheck` - Check spelling
- `yarn spellfix` - Auto-fix spelling issues (interactive)
- `yarn check` - Run all checks (format, lint, spell)

### Maintenance
- `yarn outdated` - List outdated dependencies

## Project Structure

```
bondy_docs/
├── docs/                      # Documentation content
│   ├── .vitepress/           # VitePress configuration & theme
│   ├── about/                # About pages
│   ├── concepts/             # Conceptual documentation
│   ├── guides/               # How-to guides
│   ├── reference/            # API reference
│   ├── tutorials/            # Tutorials
│   └── assets/               # Images and assets
├── .github/workflows/        # CI/CD pipelines
└── CONTRIBUTING.md           # Contribution guidelines
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Checklist

1. Fork and create a feature branch
2. Make your changes
3. Run quality checks: `yarn check`
4. Test locally: `yarn docs:dev`
5. Submit a pull request

## Technology Stack

- [VitePress](https://vitepress.dev/) - Static site generator
- [Vue 3](https://vuejs.org/) - UI framework
- [Markdown](https://www.markdownguide.org/) - Content format
- Custom components and plugins

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