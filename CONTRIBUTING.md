# Contributing to Bondy Documentation

Thank you for your interest in contributing to the Bondy Developer Documentation! This guide will help you get started.

## Prerequisites

- Node.js 20 or higher (use `.nvmrc` file with `nvm use`)
- Yarn package manager
- Git

## Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/bondy-io/bondy_docs.git
cd bondy_docs
```

2. **Install dependencies**

```bash
yarn install
```

3. **Start the development server**

```bash
yarn docs:dev
```

The documentation site will be available at `http://localhost:5173`

## Project Structure

```
bondy_docs/
├── docs/                      # Documentation content
│   ├── .vitepress/           # VitePress configuration
│   │   ├── config.mjs        # Main configuration file
│   │   └── theme/            # Custom theme components
│   ├── about/                # About section
│   ├── concepts/             # Conceptual documentation
│   ├── guides/               # How-to guides
│   ├── reference/            # API reference documentation
│   ├── tutorials/            # Step-by-step tutorials
│   ├── assets/               # Images and other assets
│   └── public/               # Static files (favicons, etc.)
├── .github/workflows/        # CI/CD workflows
└── package.json              # Project dependencies
```

## Writing Documentation

### Adding a New Page

1. Create a new `.md` file in the appropriate directory
2. Add frontmatter at the top of the file:

```markdown
---
draft: false
related:
    - type: concepts
      text: Related Page Title
      link: /path/to/page
      description: Brief description
---

# Page Title

Content goes here...
```

3. Add the page to the sidebar in `docs/.vitepress/config.mjs`

### Markdown Conventions

- Use ATX-style headers (`#`, `##`, `###`)
- Use fenced code blocks with language identifiers
- Keep lines reasonably short for better diffs
- Use relative links for internal pages
- Place images in `docs/assets/` or `docs/public/`

### Custom Components

The documentation uses several custom VitePress components:

#### ZoomImg
For zoomable images:
```markdown
<ZoomImg
  src="/assets/image.png"
  caption="Image caption"
  width="600"/>
```

#### Tabs
For tabbed content:
```markdown
::: tabs
::: tab Python
Python code here
:::
::: tab JavaScript
JavaScript code here
:::
:::
```

#### Definition Boxes
```markdown
::: definition Term
Definition content here
:::
```

#### Custom Containers
```markdown
::: info
Information box
:::

::: warning
Warning box
:::

::: danger
Danger box
:::
```

## Code Quality

### Running Checks

Before submitting a PR, run the following checks:

```bash
# Check formatting
yarn format:check

# Check markdown linting
yarn lint:md

# Check spelling
yarn spellcheck

# Run all checks at once
yarn check
```

### Auto-fixing Issues

```bash
# Auto-format markdown files
yarn format

# Auto-fix markdown lint issues
yarn lint:md:fix

# Auto-fix spelling issues (interactive)
yarn spellfix
```

## Building

To build the documentation:

```bash
yarn docs:build
```

The built site will be in `docs/.vitepress/dist/`

To preview the built site:

```bash
yarn docs:preview
```

## Submitting Changes

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Write clear, concise documentation
   - Follow the existing style and structure
   - Add examples where appropriate

3. **Test your changes**
   - Run the dev server and verify your changes
   - Run all quality checks (`yarn check`)
   - Build and preview the site

4. **Commit your changes**

```bash
git add .
git commit -m "Brief description of your changes"
```

Follow conventional commit format:
- `docs: Add new tutorial on X`
- `fix: Correct typo in Y`
- `feat: Add new component Z`

5. **Push and create a pull request**

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear title and description
- Reference any related issues
- Screenshots if applicable

## Style Guide

### Writing Style

- Use clear, concise language
- Write in present tense
- Use active voice
- Address the reader as "you"
- Avoid jargon where possible
- Define technical terms on first use

### Code Examples

- Provide complete, runnable examples
- Use syntax highlighting
- Include comments for complex code
- Show both request and response for API examples
- Support multiple languages where applicable

### Links

- Use descriptive link text (not "click here")
- Use relative links for internal pages: `/concepts/what_is_bondy`
- Verify all links work before submitting

## Getting Help

- Check existing documentation
- Search existing issues on GitHub
- Ask questions in the [community chat](https://bondy.zulipchat.com)
- Join the discussion at [discuss.bondy.io](https://discuss.bondy.io)

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (CC-BY-SA-4.0).
