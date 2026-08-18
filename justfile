# Bondy documentation site — task runner (https://just.systems)
# Run `just` with no args to list recipes.

set shell := ["bash", "-cu"]

# Codespell — skip list and known-good words
codespell  := `which codespell || echo ""`
skip       := "./node_modules,.git,./docs/.vitepress/*.*"
ignore     := "applys,nd,accout,mattern,pres,fo"
spellcheck := codespell + ' --skip="' + skip + '" -L ' + ignore
spellfix   := spellcheck + " -i 3 -w"

# List available recipes
default:
    @just --list

# Start the VitePress dev server with hot reload
dev:
    yarn docs:dev

# Run spell checker
spellcheck:
    @if [ -z "{{codespell}}" ]; then \
        echo "Aborting, command codespell not found in PATH"; \
        exit 1; \
    fi
    {{spellcheck}}

# Run spell checker with auto-fix
spellfix:
    @if [ -z "{{codespell}}" ]; then \
        echo "Aborting, command codespell not found in PATH"; \
        exit 1; \
    fi
    {{spellfix}}

# --- Multi-version site -------------------------------------------------
# Mirrors .github/workflows/deploy.yml locally: the current version is
# built fresh, each archived version is downloaded as the pre-built
# package release-docs.yml published, and both are combined into one tree.

repo          := "bondy-io/bondy_docs"
# Assembled multi-version site (gitignored)
site_dir      := ".site"
# Downloaded archived-version packages, kept between runs (gitignored)
release_cache := ".cache/docs-releases"
preview_port  := "4180"

# Structural navigation must never leave its documentation set: a reader in
# the Fabric sidebar stays in Fabric. Cross-set pointers belong in a page's
# `related:` frontmatter, which is an aside the reader chooses.

# Check no sidebar links out of its own documentation set
check-sets:
    node scripts/check-set-boundaries.mjs

# Build the current version only -> docs/.vitepress/dist
build: check-sets
    yarn docs:build

# Download each archived version's released package (skips what's cached)
fetch-versions:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p {{release_cache}}
    jq -c '.archived[]' docs/versions.json | while read -r entry; do
        tag=$(jq -r '.tag' <<<"$entry")
        # release-docs.yml names the asset docs-<version>.tar.gz, and
        # <version> is the tag minus its `docs-` prefix, so asset == tag.
        out="{{release_cache}}/$tag.tar.gz"
        if [ -f "$out" ]; then
            echo "cached      $tag"
            continue
        fi
        echo "downloading $tag"
        curl -fsSL -o "$out" \
            "https://github.com/{{repo}}/releases/download/$tag/$tag.tar.gz"
    done

# Assemble current + archived versions into the site dir
site: build fetch-versions
    #!/usr/bin/env bash
    set -euo pipefail
    rm -rf {{site_dir}}
    mkdir -p {{site_dir}}
    cp -R docs/.vitepress/dist/. {{site_dir}}/
    jq -c '.archived[]' docs/versions.json | while read -r entry; do
        version=$(jq -r '.version' <<<"$entry")
        tag=$(jq -r '.tag' <<<"$entry")
        mkdir -p "{{site_dir}}/v$version"
        tar -xzf "{{release_cache}}/$tag.tar.gz" -C "{{site_dir}}/v$version"
        echo "mounted     $tag at /v$version/"
    done

# Check every archived version's baked-in base matches where it is mounted
verify-versions: site
    #!/usr/bin/env bash
    set -euo pipefail
    status=0
    for version in $(jq -r '.archived[].version' docs/versions.json); do
        mount="/v$version/"
        # The base a version was built with is the prefix of its asset URLs.
        baked=$(grep -o 'src="/[^"]*/assets/app\.[^"]*"' "{{site_dir}}/v$version/index.html" \
            | head -1 | sed 's|^src="\(/.*/\)assets/.*|\1|')
        if [ "$baked" = "$mount" ]; then
            echo "ok         $mount"
        else
            echo "MISMATCH   mounted at $mount but built with base ${baked:-<none>}" >&2
            echo "           its assets will 404 - align docs/versions.json" >&2
            status=1
        fi
    done
    exit $status

# `--ext html` reproduces the extensionless URLs the built site links to
# (VitePress `cleanUrls`), which Netlify resolves the same way. `serve` is
# not usable here: it will not serve the index.html of a directory whose
# name contains dots, e.g. /v1.0.0-rc.65.1/.
#
# Serve the assembled multi-version site locally
preview-site: site
    npx --yes http-server {{site_dir}} -p {{preview_port}} --ext html -c-1
