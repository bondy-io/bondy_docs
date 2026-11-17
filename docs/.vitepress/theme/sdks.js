// The Bondy Connect SDK catalogue: one entry per language, in the order the
// SDK home page shows them (<SdkGallery>, theme/SdkGallery.vue).
//
// Each published SDK has a folder of its own, named after its `id`:
//
//   docs/connect/sdk/<id>/index.md   the SDK's page; its card links here
//   docs/connect/sdk/<id>/…          its tutorial, reference and design pages
//
// To publish an SDK: add that folder, set `available: true` here, and give it
// a sidebar in sidebars() (.vitepress/config.mjs), as '/connect/sdk/<id>/'.
// An entry with `available: false` is shown dimmed and links nowhere.
export const sdks = [
  {
    id: 'erlang',
    name: 'Erlang',
    languages: 'Erlang and Elixir',
    description: 'A supervised connection for services on the BEAM.',
    available: true
  },
  { id: 'rust', name: 'Rust', available: false },
  { id: 'java', name: 'Java', available: false }
]
