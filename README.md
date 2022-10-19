# Bondy Docs

## Setting up locally

1. clone this repo
2. cd to the clone location and type `yarn add --dev vitepress`

## Build docs locally for development
```shell
yarn docs:dev
```

## Building

```shell
yarn docs:build && cp -r docs/assets/. docs/.vitepress/dist/assets/
```

For some reason assets are not being copied so we need to do it by hand