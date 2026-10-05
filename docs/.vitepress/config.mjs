// Sitemap
import { createWriteStream, cpSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SitemapStream } from 'sitemap'
import mdCustomBlock from 'markdown-it-custom-block'
import { withThemeDefaults } from '@leapsight/vitepress-template/theme/config'
import { ORIGINS } from '@bondy/site-chrome/sitemap'

const links = []

// Single source of truth for the version picker and the release/deploy
// workflows (.github/workflows/release-docs.yml, deploy.yml). Each
// archived entry's `tag` names the git tag whose one-off release build
// gets downloaded and placed at /v<version>/ at deploy time; `tag` is
// dropped below since the widget only needs {version, label}.
const versionsManifest = JSON.parse(
  readFileSync(resolve(__dirname, '../versions.json'), 'utf-8')
)

// Serve under a sub-path by setting DOCS_BASE (used to build the
// archived version snapshots under /v<version>/, see the deploy
// workflow).
const base = process.env.DOCS_BASE ?? '/'

export default withThemeDefaults(
  {
    // @bondy/site-chrome ships raw .vue source, so Vite must compile it
    // rather than treat it as an external CommonJS dep during SSR.
    // withThemeDefaults merges this with its own package's entry.
    // Fonts are never inlined: Vite base64-inlines assets under 4 KB, which
    // would put the @fontsource subset files (greek, cyrillic, …, and .woff
    // fallbacks) into the render-blocking stylesheet, though a browser
    // fetches a subset only when the page uses its glyphs. Same as bondy.io.
    vite: {
      build: { assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined) },
      ssr: { noExternal: ['@bondy/site-chrome'] }
    },

    // These are app level configs.
    // Pagefind shards its index by <html lang>, and the search box merges
    // one bundle per property at query time. Each property indexes only its
    // own build now, so a mismatch here no longer splits a shared index —
    // but a bundle whose language nobody else declares still returns nothing
    // to the others, so keep this in step with the other Bondy sites.
    lang: 'en',
    titleTemplate: false,
    title: 'Bondy Developer',
    base,
    // This will render as a <meta> tag in the page HTML.
    description: 'Learn how to develop, deploy and manage distributed applications using Bondy. Bondy is an open-source, always-on and scalable application networking platform connecting all elements of a distributed application—offering event and service mesh capabilities combined. From web and mobile apps to IoT devices and backend microservices, Bondy allows everything to talk using one simple communication protocol.',
    head: [
      ['meta', { property: 'og:title', content: 'Bondy Developer'}],
      ['meta', { property: 'description', content: 'Learn how to develop, deploy and manage distributed applications using Bondy. Bondy is an open-source, always-on and scalable application networking platform connecting all elements of a distributed application—offering event and service mesh capabilities combined. From web and mobile apps to IoT devices and backend microservices, Bondy allows everything to talk using one simple communication protocol.' }],
      ['meta', { property: 'og:description', content: 'Learn how to develop, deploy and manage distributed applications using Bondy. Bondy is an open-source, always-on and scalable application networking platform connecting all elements of a distributed application—offering event and service mesh capabilities combined. From web and mobile apps to IoT devices and backend microservices, Bondy allows everything to talk using one simple communication protocol.' }],
      ['meta', { property: 'keywords', content: "distributed application, application networking platform, scalable, always-on, universal protocol, remote procedure call, RPC, service mesh, publish-subscribe, publish/subscribe, event mesh, authorization, authentication, web application messaging protocol, router, WAMP, wamp router, API gateway, kubernetes, microservices, p2p, erlang"
        }],
      // Type system, shared with bondy.io: Inter (sans) and JetBrains Mono
      // (code and the uppercase mono labels), both self-hosted — see the
      // font imports in theme/index.js.
      ['meta', {name: "theme-color", content: "#f1efec"}],
      ['meta', {name: "msapplication-TileColor", content: "#171916"}],
      ['meta', { name: "msapplication-config", content: `${base}assets/favicons/browserconfig.xml`}],
      ['link', { rel: "apple-touch-icon", sizes: "180x180", href: `${base}assets/favicons/apple-touch-icon.png`}],
      ['link', { rel: "icon", type: "image/png", sizes: "32x32", href: `${base}assets/favicons/favicon-32x32.png`}],
      ['link', { rel: "icon", type: "image/png", sizes: "16x16", href: `${base}assets/favicons/favicon-16x16.png`}],
      ['link', { rel: "manifest", href: `${base}assets/favicons/site.webmanifest`}],
      ['link', { rel: "mask-icon", href: `${base}assets/favicons/safari-pinned-tab.svg`, color: "#171916"}],
      ['link', { rel: "shortcut icon", href: `${base}assets/favicons/favicon.ico`}],
      ['link', { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" }],
      ['script',{
        defer: true,
        'data-domain':"bondy.dev",
        src:"https://plausible.io/js/script.js"
      }],
      ['script',{
        defer: true,
        'data-domain':"bondy.dev",
        src:"https://plausible.io/js/script.local.js"
      }]
    ],
    sitemap: {
      hostname: 'https://developer.bondy.io/'
    },
    appearance: true,

    markdown: {
        toc: { level: [3] },
        // Fences render on bondy.io's dark plate in both appearances (see
        // brand.css), so only the dark theme's colours reach the page; the
        // pair is the website's. github-dark-default's comments are 4.69:1 on
        // the plate, where github-dark's were 3.0:1.
        theme: { light: 'github-light', dark: 'github-dark-default' },
        lineNumbers: true,
        attrs: {
          leftDelimiter: '{',
          rightDelimiter: '}',
          allowedAttributed: ['id', 'class'],
          disable: false
        },
        config: (md) => {
          // Bondy-specific `@[name](args)` reference macros. Tabs,
          // buttons, columns and definitions come from the shared
          // theme's markdown kit (see @leapsight/vitepress-template/theme/config).
          // Config keys, enum datatypes and default values are dotted
          // identifiers, `|`-separated alternatives (written `&#124;` in the
          // markdown) and paths with no break opportunity, so on a phone a long
          // one ran off the page. A <wbr> after each separator lets a line
          // break at segment boundaries and renders nothing otherwise. Display
          // text only: ids and hrefs keep the raw key.
          const wrappable = (s) => String(s).replace(/([./|]|&#124;)/g, '$1<wbr>')
          md.use(mdCustomBlock, {
            // URI
            uri (str) {
              let args = str.replace(/\s+/g, '').split(",");
              let uri = args.shift();
              var badge;
              var className;
              if (args.length == 0) {
                badge = 'PROC';
                className = 'public';
              } else {
                badge = args.shift();
                className = (args.shift() === 'private') ? 'private' : 'public';
              };
              return `<div class=" wamp-uri ${className}"><a name="${uri}"></a><span class="wamp-uri ${className}">${badge}</span><p class="wamp-uri-title">${uri}</p></div>`;
            },
            // CONFIG
            config (str) {
              let args = str.replace(/\s+/g, '').split(",");
              let param = args.shift();
              var datatype = 'string';
              var defaultValue;
              var since = '';
              if (args.length == 0) {
                datatype = 'string';
                defaultValue = 'N/A';
                since = 'N/A';
              } else {
                datatype = args.shift();
                defaultValue = args.shift();
                defaultValue = defaultValue ? defaultValue : 'N/A';
                since = args.shift();
                since = since ? since : 'N/A';
              };
              return `
    <div id="${param}" tabindex="-1">
        <span class="custom-block config-param">
            <span>
                <span class="custom-block-title">
                    <a href="#${param}" aria-hidden="true"></a>
                    ${wrappable(param)}
                </span>
                <span class="config-param-meta"> ::&nbsp;${wrappable(datatype)}</span>
            </span>
        </span>
        <div class="since-version">
            <span class="config-param-meta">Default = ${wrappable(defaultValue)}</span>
            <span>Since&nbsp;${since}</span>
        </div>
    </div>`;
            },
            // DEPRECATED CONFIG (renamed to a current key)
            configDeprecated (str) {
              let args = str.split(",").map((s) => s.trim());
              let oldKey = args.shift();
              let newKey = args.shift();
              let since = args.shift();
              // Optional: the page that defines the replacement key, when it
              // is not the current page.
              let page = args.shift() || '';
              return `
    <div id="${oldKey}" tabindex="-1" class="config-param-deprecated">
        <span class="config-param-badge-deprecated">Deprecated</span>
        <span class="config-param-old">
            <a href="#${oldKey}" aria-hidden="true"></a>
            ${wrappable(oldKey)}
        </span>
        <span class="config-param-arrow">renamed to</span>
        ${newKey.includes('*')
          // A wildcard names a family of keys, not one entry, so there is no
          // anchor to link to.
          ? `<span class="config-param-new"><code>${wrappable(newKey)}</code></span>`
          : `<a class="config-param-new" href="${page}#${newKey}"><code>${wrappable(newKey)}</code></a>`}
        ${since ? `<span class="config-param-meta">since&nbsp;${since}</span>` : ''}
    </div>`;
            },
            // REMOVED CONFIG (no replacement)
            configRemoved (str) {
              let args = str.split(",").map((s) => s.trim());
              let oldKey = args.shift();
              let reason = args.shift();
              let since = args.shift();
              return `
    <div id="${oldKey}" tabindex="-1" class="config-param-deprecated">
        <span class="config-param-badge-deprecated">Removed</span>
        <span class="config-param-old">
            <a href="#${oldKey}" aria-hidden="true"></a>
            ${wrappable(oldKey)}
        </span>
        ${reason ? `<span class="config-param-meta">${reason}</span>` : ''}
        ${since ? `<span class="config-param-meta">since&nbsp;${since}</span>` : ''}
    </div>`;
            },
            // FOO
            configRef (str) {
              let obj = str.replace(/\s+/g, '');
              var datatype = obj.datatype ? obj.datatype : 'string';
              return `
    <div id="${obj.key}" tabindex="-1">
        <span class="config-param">
            <span>
                <span class="config-param-badge">config</span>
                <span class="custom-block-title">
                    <a href="#${obj.key}" aria-hidden="true"></a>
                    ${wrappable(obj.key)}
                </span>
                <span class="config-param-meta"> ::&nbsp;${datatype}</span>
            </span>
        </span>
    </div>`;
            }
          })
        }
    },

    themeConfig: {
        // The torso header (theme/DocsNav.vue) renders the wordmark and the
        // nav itself; VitePress's own navbar is hidden by torso.css. These
        // stay for the surfaces that still read themeConfig (404, search).
        siteTitle: false,
        logo: '/bondy-logo.svg',

        // Search
        // Search comes from @bondy/site-chrome's SiteSearch, which merges this
        // deploy's Pagefind bundle with the other Bondy deploys' bundles in the
        // browser. VitePress's own provider is off so it does not render a
        // second box.
        search: false,

        socialLinks: [
            { icon: 'github', link: 'https://github.com/bondy-io'},
            { icon: 'twitter', link: 'https://twitter.com/bondyIO' },
            { icon: 'slack', link: 'https://join.slack.com/t/bondy-group/shared_invite/zt-1j1fbpr04-BUesuqeWBbblbqUPsXrP1A' },
            {
              icon: {
                svg: '<svg width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><title>Discourse</title><path d="M12.103 0C18.666 0 24 5.485 24 11.997c0 6.51-5.33 11.99-11.9 11.99L0 24V11.79C0 5.28 5.532 0 12.103 0zm.116 4.563a7.395 7.395 0 0 0-6.337 3.57 7.247 7.247 0 0 0-.148 7.22L4.4 19.61l4.794-1.074a7.424 7.424 0 0 0 8.136-1.39 7.256 7.256 0 0 0 1.737-7.997 7.375 7.375 0 0 0-6.84-4.585h-.008z"/></svg>'
              },
              link: 'https://discuss.bondy.io'
            }
        ],

        // The footer will displayed only when the page doesn't contain sidebar
        // due to design reason.
        footer: {
            message: 'Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution-ShareAlike (CC-BY-SA) 4.0 International license.<br> Bondy and Leapsight are registered trademarks of Leapsight Technologies Ltd.',
            copyright: 'Copyright © 2025 Leapsight'
        },

        editLink: {
            pattern: 'https://github.com/bondy-io/bondy_docs/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },

        // Shown by the navbar <NavbarVersion> widget as a dropdown.
        // Sourced from versions.json; each non-current entry defaults to
        // linking at /v<version>/, which is where the deploy workflow
        // unpacks that version's released package (see
        // .github/workflows/deploy.yml and release-docs.yml).
        // The current version is deployed at the site root, not at
        // /v<version>/, so it needs an explicit link: <NavbarVersion>
        // otherwise falls back to /v<version>/ and sends readers to a 404.
        versions: [
          { ...versionsManifest.current, current: true, link: '/' },
          ...versionsManifest.archived.map(({ tag, ...v }) => v)
        ],

        // Arbitrary site metadata, readable in markdown via <SiteMeta k="..."/>.
        metadata: {
          bondyVersion: versionsManifest.current.version
        },

        nav: nav(),

        sidebar: sidebars()
    },

    transformHtml: (_, id, { pageData }) => {
      if (!/[\\/]404\.html$/.test(id))
        links.push({
          // you might need to change this if not using clean urls mode
          url: pageData.relativePath.replace(/((^|\/)index)?\.md$/, '$2'),
          lastmod: pageData.lastUpdated
        })
    },
    buildEnd: async ({ outDir }) => {
      // Copy assets directory to build output
      const assetsSource = resolve(__dirname, '../assets')
      const assetsDest = resolve(outDir, 'assets')
      try {
        cpSync(assetsSource, assetsDest, { recursive: true })
        console.log('✓ Assets copied successfully')
      } catch (err) {
        console.error('Error copying assets:', err)
      }

      // Generate sitemap
      const sitemap = new SitemapStream({
        hostname: 'https://developer.bondy.io/'
      })
      const writeStream = createWriteStream(resolve(outDir, 'sitemap.xml'))
      sitemap.pipe(writeStream)
      links.forEach((link) => sitemap.write(link))
      sitemap.end()
      await new Promise((r) => writeStream.on('finish', r))
      console.log('✓ Sitemap generated successfully')
    },

    cleanUrls: 'with-subfolders',
    // Set to false for publishing
    ignoreDeadLinks: false,
  },
  {
    markdown: {
      // KaTeX CSS is linked in `head` above.
      math: true,
      // The shared kit synthesizes an `# H1` from frontmatter `title:` for
      // pages that don't open with a heading. Pages that select their own
      // layout render their own masthead (the Diataxis home does), so they
      // opt out and keep `title:` for the document title alone.
      injectTitle: (env) => !env?.frontmatter?.layout
    }
  }
)

// ---------------------------------------------------------------------------
// NAVIGATION
//
// One documentation set is published here:
//
//   Bondy Connect  /router   tutorials, how-to guides, concepts and reference
//                            for building on, running and operating Bondy
//                            Connect.
//
// The interfaces Bondy Connect offers — WAMP, the HTTP/REST API Gateway, MCP,
// and BAMP when it ships — are not sets of their own. Each is a group inside
// every Diataxis section, because realms, URIs, authentication and RBAC are
// shared by all of them. A protocol *specification* would be a set of its own;
// using a protocol with Bondy is not.
//
// Three surfaces are configured below.
//
//   nav()       VitePress's top navbar (see the note on it — not rendered
//               on this deploy).
//   sidebars()  the left-hand navigation, keyed by path prefix.
//
// And one that is not a surface of its own but is fed by the second: seven
// section index pages render themselves FROM their sidebar.
// docs/router/{tutorials,guides,concepts}/index.md and the four reference
// manuals' index.md read `theme.sidebar[<key>]` and, for each group, emit the
// group's `text` as an H2, its `description` as the lead paragraph, and a card
// for every item carrying `isFeature: true`, subtitled with that item's
// `description`. Two consequences, both of which this file must respect:
//
//   * an item with `isFeature: true` and no `description` renders a blank card;
//   * an item without `isFeature` does not appear on its section index at all,
//     so a page reachable only through the sidebar is half-published.
//
// Group names are controlled vocabulary. A group is named with the same words
// the breadcrumb (theme/Breadcrumb.vue, SECTIONS and SUBSECTIONS) and the set
// landing page (docs/router.md) use for the same thing. Change
// one, change all three.
// ---------------------------------------------------------------------------

/**
 * The top navbar.
 *
 * NOT RENDERED on this deploy. @bondy/site-chrome's SiteNav replaces
 * VitePress's navbar and chrome.css hides what is left outright
 * (`:root:has(.chrome-nav--docs) .VPNav { display: none }`), while SiteNav
 * draws its own links from the shared cross-property sitemap. Nothing here
 * reaches the screen today.
 *
 * It is kept, and kept correct, for two reasons: it is the one place that
 * states the site's top-level shape in full, and it is what the navbar falls
 * back to if the chrome is ever dropped. Treat it as documentation of the
 * information architecture, and keep it in step with sidebars() below.
 */
function nav() {
  return [
    {
      text: 'Bondy Connect',
      activeMatch: '^/router/',
      items: [
        { text: 'Overview', link: '/router' },
        { text: 'Tutorials', link: '/router/tutorials/index' },
        { text: 'How-to Guides', link: '/router/guides/index' },
        { text: 'Concepts', link: '/router/concepts/index' },
        { text: 'Reference', link: '/router/reference/index' }
      ]
    },
    // Reference gets its own menu as well as a place under Bondy Connect: it
    // is the set readers arrive at directly and return to most often, and the
    // eight manuals are not otherwise visible without two clicks.
    {
      text: 'Reference',
      activeMatch: '^/router/reference/',
      items: [
        { text: 'Configuration', link: '/router/reference/configuration/index' },
        { text: 'WAMP API', link: '/router/reference/wamp_api/index' },
        { text: 'HTTP API', link: '/router/reference/http_api/index' },
        { text: 'HTTP API Gateway', link: '/router/reference/api_gateway/index' },
        { text: 'Client Libraries', link: '/router/reference/clients/index' },
        { text: 'WAMP Compliance', link: '/router/reference/protocols/wamp' },
        { text: 'Serialization', link: '/router/reference/serialization' },
        { text: 'Metrics', link: '/router/reference/metrics' },
        { text: 'Alarms', link: '/router/reference/alarms' },
        { text: 'Logging', link: '/router/reference/logging' },
        { text: 'Errors', link: '/router/reference/errors' },
        { text: 'Glossary', link: '/router/reference/glossary' }
      ]
    },
    {
      text: 'About',
      items: [
        { text: 'Bondy.io', link: ORIGINS.website },
        { text: 'FAQ', link: '/about/faq' },
        { text: 'Community', link: '/about/community' },
        { text: 'Contributors', link: '/about/contributors' },
        { text: 'Terms and Policies', link: '/about/terms_and_policies' }
      ]
    }
  ]
}

/**
 * Left-hand navigation, keyed by path prefix.
 *
 * VitePress resolves a path to a sidebar by sorting the keys on their
 * `/`-separated segment count, descending, and taking the first one that
 * prefixes the path — see `getSidebar` in
 * vitepress/dist/client/theme-default/support/sidebar.js:
 *
 *     Object.keys(_sidebar)
 *       .sort((a, b) => b.split('/').length - a.split('/').length)
 *       .find((dir) => path.startsWith(ensureStartingSlash(dir)))
 *
 * It is segment count, not string length, and ties fall back to declaration
 * order. That is why '/router/reference' is written WITHOUT a trailing slash:
 * three segments places it strictly below the four-segment per-manual keys, so
 * it picks up the reference hub, glossary, metrics, logging and errors — which
 * had no sidebar at all before — and can never shadow a manual, whatever order
 * this object is written in. Adding the slash would make it a four-segment key
 * and put that guarantee at the mercy of declaration order.
 *
 * The keys are also read verbatim by the section index pages
 * (`theme.sidebar['<key>']`), so renaming one means editing that page too.
 */
function sidebars() {
  return {
    // One sidebar per Diataxis section, because each is too large to share a
    // column with the others.
    '/router/tutorials/': tutorialsSidebar(),
    '/router/guides/': guidesSidebar(),
    '/router/concepts/': conceptsSidebar(),

    // Reference is a set of manuals, so each gets its own sidebar, and the hub
    // plus the standalone pages get one of their own. See the note above on
    // why the last key has no trailing slash.
    '/router/reference/configuration': configurationSidebar(),
    '/router/reference/wamp_api': wampAPISidebar(),
    '/router/reference/http_api': httpAPISidebar(),
    '/router/reference/api_gateway': apiGatewaySidebar(),
    '/router/reference': referenceSidebar()
  }
}


/* ===========================================================================
 * Bondy Connect — Tutorials
 *
 * Learning-oriented. Groups are named after the directory the pages live in,
 * which is also what the breadcrumb shows.
 * ======================================================================== */
function tutorialsSidebar() {
  return [
    {
      text: 'Getting Started',
      description: 'Worked applications you build end to end. Start with the marketplace; each one after it adds to what came before.',
      items: [
        {
          text: 'Marketplace',
          link: '/router/tutorials/getting_started/marketplace',
          isFeature: true,
          description: 'A simple marketplace built from Python microservices and a VueJS web application.'
        },
        {
          text: 'Marketplace HTTP API Gateway',
          link: '/router/tutorials/getting_started/marketplace_api_gateway',
          isFeature: true,
          description: 'Add an HTTP API to the marketplace using the HTTP API Gateway.'
        },
        {
          text: 'Marketplace for AI Agents (MCP)',
          link: '/router/tutorials/getting_started/marketplace_mcp',
          isFeature: true,
          description: 'Expose the marketplace to AI agents as MCP tools — without touching the Autobahn Python microservice.'
        },
        {
          text: 'Watching an Alarm from Raise to Clear',
          link: '/router/tutorials/getting_started/watching_an_alarm',
          isFeature: true,
          description: 'Raise a real alarm, follow its runbook to a sanctioned remedy, and watch it clear.'
        }
      ]
    },
    {
      text: 'WAMP',
      description: 'Write your first WAMP component against a local Bondy, from the language you use.',
      items: [
        {
          text: 'Wampy (Python)',
          link: '/router/tutorials/wamp/wampy',
          isFeature: true,
          description: 'Connect, call and subscribe from Python.'
        },
        {
          text: 'Bondy Connect SDK (Erlang/Elixir)',
          link: '/router/tutorials/wamp/bondy_connect_sdk',
          isFeature: true,
          description: 'Connect, call and subscribe from Erlang or Elixir.'
        }
      ]
    },
    {
      text: 'Edge',
      description: 'Link a Bondy node to a remote router over a bridge relay.',
      items: [
        {
          text: 'Connecting an Edge Node',
          link: '/router/tutorials/edge/connecting_an_edge_node',
          isFeature: true,
          description: 'Run a core and an edge node locally, then send an event and a call across the bridge.'
        }
      ]
    },
    {
      text: 'Integrations',
      description: 'Forwarding WAMP events out to systems that do not speak WAMP.',
      items: [
        {
          text: 'Sending Email with the SMTP Bridge',
          link: '/router/tutorials/smtp_bridge',
          isFeature: true,
          description: 'Publish an event, read the email it produced — end to end against a local mail server.'
        },
        {
          text: 'Kafka Bridge',
          link: '/router/tutorials/kafka_bridge',
          isFeature: true,
          description: 'Re-publish WAMP events to a Kafka topic.'
        }
      ]
    },
    {
      text: 'Security',
      description: 'Realm topologies that let one identity reach more than one realm.',
      items: [
        {
          text: 'Using Same Sign-on',
          link: '/router/tutorials/security/same_sign_on',
          isFeature: true,
          description: 'Create a Same Sign-on realm and use one identity across the realms that inherit from it.'
        }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — How-to Guides
 *
 * Task-oriented, in three parts: develop (programming guides, grouped by the
 * interface the component uses), secure (who may connect and what they may
 * reach), then operate (install, configure, deploy, administer).
 *
 * Groups are the job, not the directory. Three pages sit in a directory that
 * disagrees with the group they belong to (guides/security/configuring_cors,
 * guides/administration/configuring_listeners, guides/administration/
 * configuring_mail_relays are all configuration tasks) — the grouping follows
 * the reader's question, and the breadcrumb, which is derived from the path,
 * will say Security or Administration for those three until the files move.
 * ======================================================================== */
function guidesSidebar() {
  return [
    {
      text: 'Programming with WAMP',
      description: 'Write the components that register, call, publish and subscribe on a realm.',
      items: [
        {
          text: 'General Conventions',
          link: '/router/guides/programming/wamp/general',
          isFeature: true,
          description: 'The conventions every WAMP component follows, whatever the pattern.'
        },
        {
          text: 'Calling and Registering Procedures',
          link: '/router/guides/programming/wamp/rpc',
          isFeature: true,
          description: 'Register a procedure, call one, and choose an invocation policy.'
        },
        {
          text: 'Publishing and Subscribing',
          link: '/router/guides/programming/wamp/pub_sub',
          isFeature: true,
          description: 'Publish to a topic and subscribe to one, including pattern matching.'
        }
      ]
    },
    {
      text: 'Programming with HTTP and Mail',
      description: 'Expose HTTP APIs, call out to HTTP services, and send mail.',
      items: [
        {
          text: 'Loading an API Gateway Specification',
          link: '/router/guides/programming/loading_api_spec',
          isFeature: true,
          description: 'Load an API Gateway specification using the HTTP Admin API.'
        },
        {
          text: 'Using the HTTP Connector',
          link: '/router/guides/programming/http_connector',
          isFeature: true,
          description: 'Bridge WAMP RPC calls to upstream HTTP/REST services with step-by-step examples.'
        },
        {
          text: 'Sending Email',
          link: '/router/guides/programming/sending_email',
          isFeature: true,
          description: 'Send email from a WAMP client, or on a published event, with idempotency and error handling.'
        }
      ]
    },
    {
      text: 'Security',
      description: 'Decide who may connect, how they authenticate, and what an HTTP API or an agent may reach.',
      items: [
        {
          text: 'Authenticating Clients',
          link: '/router/guides/security/authenticating_clients',
          isFeature: true,
          description: 'Set up a realm so clients authenticate with cryptosign, wampcra or wamp-scram, or a ticket.'
        },
        {
          text: 'Protecting an HTTP API with OAuth2',
          link: '/router/guides/security/protecting_an_http_api',
          isFeature: true,
          description: 'Require a Bondy OAuth2 access token on API Gateway routes; issue, use and revoke tokens.'
        },
        {
          text: 'Configuring CORS & HTTP Security Headers',
          link: '/router/guides/security/configuring_cors',
          isFeature: true,
          description: 'Common CORS and HTTP security header configurations for different deployment scenarios.'
        },
        {
          text: 'Giving an Agent Read-Only Access',
          link: '/router/guides/administration/giving_an_agent_read_only_access',
          isFeature: true,
          description: 'Adopt the shipped MCP read overlay and scope an agent with a role-restricted ticket.'
        }
      ]
    },
    {
      text: 'Installation',
      description: 'Bondy can be deployed anywhere from resource-constrained AMD64/ARM64 edge devices to private, hybrid and public clouds running bare metal, virtual machines and containers. Choose the option best suited to your needs.',
      items: [
        {
          text: 'Install from Source',
          link: '/router/guides/install/source',
          isFeature: true,
          description: 'Build and install Bondy from source.'
        },
        {
          text: 'Install using Docker',
          link: '/router/guides/install/docker',
          isFeature: true,
          description: 'Use the official Docker images for AMD64 and ARM64 architectures.'
        },
        {
          text: 'Install using Kubernetes',
          link: '/router/guides/install/kubernetes',
          isFeature: true,
          description: 'See a starter manifest recipe and tailor it based on your needs.'
        }
      ]
    },
    {
      text: 'Configuration',
      description: 'Set up the configuration file first, then the listeners and relays a particular deployment needs.',
      items: [
        {
          text: 'Configuration Basics',
          link: '/router/guides/configuration/configuration_basics',
          isFeature: true,
          description: 'Where bondy.conf lives, its syntax, variable replacement, and the OS settings it depends on.'
        },
        {
          text: 'Configuring Network Listeners',
          link: '/router/guides/administration/configuring_listeners',
          isFeature: true,
          description: 'Declare the socket inventory: terminate TLS, split audiences, budget an exposed listener, drain a node.'
        },
        {
          text: 'Configuring Mail Relays',
          link: '/router/guides/administration/configuring_mail_relays',
          isFeature: true,
          description: 'Declare a relay, scope it to realms, wire up its credential, and verify it.'
        }
      ]
    },
    {
      text: 'Deployment',
      description: 'Take a configured node into production, and move an existing deployment forward.',
      items: [
        {
          text: 'Running a Cluster',
          link: '/router/guides/deployment/running_a_cluster',
          isFeature: true,
          description: 'Configure DNS-based peer discovery and bring up a multi-node cluster — there is no join command to run.'
        },
        {
          text: 'Upgrading to 1.0.0',
          link: '/router/guides/deployment/upgrading_to_1_0_0',
          isFeature: true,
          description: 'Migrate an existing deployment to the new storage and replication stack.'
        },
        {
          text: 'Linking an Edge Node to a Remote Router',
          link: '/router/guides/deployment/linking_an_edge_node',
          isFeature: true,
          description: 'Accept bridges on the remote router, configure the bridge on the edge with its own key and TLS, verify it, and remove it.'
        }
      ]
    },
    {
      text: 'Administration',
      description: 'Keep a running deployment healthy: back it up, watch it, trace it, and keep it inside its limits.',
      items: [
        {
          text: 'Backup and Restore',
          link: '/router/guides/administration/backup_and_restore',
          isFeature: true,
          description: 'Export and import realms and security data, or take a cold copy of the storage tree.'
        },
        {
          text: 'Monitoring with Prometheus & Grafana',
          link: '/router/guides/administration/monitoring',
          isFeature: true,
          description: 'Run the bundled Prometheus and Grafana stack against your cluster.'
        },
        {
          text: 'Distributed Tracing',
          link: '/router/guides/administration/distributed_tracing',
          isFeature: true,
          description: 'Enable OpenTelemetry span export, point it at Tempo, and make Bondy the trace boundary.'
        },
        {
          text: 'Verifying Cluster Convergence',
          link: '/router/guides/administration/verifying_cluster_convergence',
          isFeature: true,
          description: 'Establish whether replicated state has converged, and whether a cluster that has not is repairing itself or stuck.'
        },
        {
          text: 'Responding to an Alarm',
          link: '/router/guides/administration/responding_to_alarms',
          isFeature: true,
          description: 'From a raised alarm to its signals, its sanctioned remediation, and a confirmed clear.'
        },
        {
          text: 'Load Regulation and Rate Limiting',
          link: '/router/guides/administration/load_regulation_and_rate_limiting',
          isFeature: true,
          description: 'How Bondy protects itself from overload and from abuse, and what a client sees when either engages.'
        },
        {
          text: 'Raising Open File Limits',
          link: '/router/guides/administration/raising_open_file_limits',
          isFeature: true,
          description: 'Raise the OS and Docker open-file limit so Bondy never runs out of file handles.'
        },
        {
          text: 'Simplifying Realm Management using Prototypes',
          link: '/router/guides/administration/simplifying_realm_management_using_prototypes',
          isFeature: true,
          description: 'Inherit shared configuration and RBAC across a fleet of realms from a single prototype realm.'
        },
        {
          text: 'Exposing an MCP Endpoint',
          link: '/router/guides/administration/exposing_an_mcp_endpoint',
          isFeature: true,
          description: 'Serve a realm to AI agents: declare the listener, publish interface metadata, connect a client.'
        }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — Concepts
 *
 * Understanding-oriented, ordered as a reading path: the WAMP model, the
 * domain a session attaches to, then what a node serves, then what happens across nodes, then
 * what it does with data and reports about itself. Background is last on
 * purpose — it is the "why", and none of it is needed to build.
 * ======================================================================== */
function conceptsSidebar() {
  return [
    {
      text: 'WAMP',
      description: 'The protocol most components use to talk to Bondy Connect: routed RPC and Publish/Subscribe over one session.',
      items: [
        {
          text: 'WAMP Overview',
          link: '/router/concepts/wamp/index',
          isFeature: true,
          description: 'Every WAMP concept page, in reading order.'
        },
        {
          text: 'What is WAMP?',
          link: '/router/concepts/wamp/what_is_wamp',
          isFeature: true,
          description: 'The protocol in one page: what it gives you and what it replaces.'
        },
        {
          text: 'Introduction',
          link: '/router/concepts/wamp/introduction',
          isFeature: true,
          description: 'Roles, peers and the router, and how a session is established.'
        },
        {
          text: 'Communication Patterns',
          link: '/router/concepts/wamp/communication_patterns',
          isFeature: true,
          description: 'The two patterns, RPC and Pub/Sub, that together cover request-response and event distribution.'
        },
        {
          text: 'Routed RPC',
          link: '/router/concepts/wamp/rpc',
          isFeature: true,
          description: 'The Caller/Callee request-response pattern: registering, calling and routing a procedure.'
        },
        {
          text: 'Publish/Subscribe',
          link: '/router/concepts/wamp/pubsub',
          isFeature: true,
          description: 'The Publisher/Subscriber event pattern: topics, subscriptions and publications.'
        },
        {
          text: 'Connections and Sessions',
          link: '/router/concepts/wamp/sessions',
          isFeature: true,
          description: 'What a WAMP session is and how it relates to transports, realms and authentication.'
        },
        {
          text: 'Security',
          link: '/router/concepts/wamp/security',
          isFeature: true,
          description: 'How a session authenticates and what it is then authorized to do.'
        },
        {
          text: 'Naming',
          link: '/router/concepts/wamp/naming',
          isFeature: true,
          description: 'Designing procedure and topic URIs, beyond the bare syntax rules.'
        },
        {
          text: 'Beyond the Basics',
          link: '/router/concepts/wamp/beyond_the_basics',
          isFeature: true,
          description: 'What the advanced profile adds once the two patterns are working.'
        },
        {
          text: 'Advanced RPC',
          link: '/router/concepts/wamp/advanced/rpc',
          isFeature: true,
          description: 'Progressive results, call cancellation, shared registrations and invocation policies.'
        },
        {
          text: 'Advanced Pub/Sub',
          link: '/router/concepts/wamp/advanced/pubsub',
          isFeature: true,
          description: 'Pattern-based subscriptions, event retention and subscriber allow/deny lists.'
        },
        {
          text: 'The Bondy Connect SDK',
          link: '/router/concepts/bondy_connect_sdk',
          isFeature: true,
          description: "How Bondy's Erlang/Elixir client is built: a supervised connection, one API across transports, reconnect and replay, isolated handlers, and errors that say whether to retry."
        }
      ]
    },
    {
      text: 'Realms & Security',
      description: 'Once RPC and Pub/Sub are working, the next thing to understand: the domain your sessions attach to, and how they authenticate.',
      items: [
        {
          text: 'Realms',
          link: '/router/concepts/realms',
          isFeature: true,
          description: 'Realms are authentication, authorization, routing and administrative domains that act as namespaces.'
        },
        {
          text: 'Same Sign-on',
          link: '/router/concepts/same_sign_on',
          isFeature: true,
          description: 'Do you need to provide users access to multiple realms? Learn about same sign-on realms.'
        },
        {
          text: 'Single Sign-on',
          link: '/router/concepts/single_sign_on',
          isFeature: true,
          description: 'Learn how to enable Single Sign-on on multiple realms.'
        },
        {
          text: 'OIDC Authentication',
          link: '/router/concepts/oidc_authentication',
          isFeature: true,
          description: 'Learn how to authenticate users via external Identity Providers using OpenID Connect.'
        }
      ]
    },
    {
      text: 'Listeners & Services',
      description: 'Services you enable on a Bondy node.',
      items: [
        {
          text: 'WAMP HTTP Transports (Longpoll & SSE)',
          link: '/router/concepts/http_transports',
          isFeature: true,
          description: 'Learn how to use HTTP long-polling and Server-Sent Events transports for WAMP sessions.'
        },
        {
          text: 'MCP Gateway',
          link: '/router/concepts/mcp_gateway',
          isFeature: true,
          description: "Expose a realm's procedures and topics to AI agents as MCP tools and resources."
        },
        {
          text: 'HTTP/REST API Gateway',
          link: '/router/concepts/api_gateway',
          isFeature: true,
          description: 'Route incoming HTTP/REST requests to WAMP procedures or external APIs using declarative JSON specifications.'
        },
        {
          text: 'HTTP Connector',
          link: '/router/concepts/http_connector',
          isFeature: true,
          description: 'Bridge WAMP RPC calls to upstream HTTP/REST services with automatic auth, retries, and error mapping.'
        },
        {
          text: 'Broker Bridge',
          link: '/router/concepts/broker_bridge',
          isFeature: true,
          description: 'Re-publish WAMP events to Kafka, AWS SNS, Mailgun, or SendGrid.'
        },
        {
          text: 'Mail',
          link: '/router/concepts/mail',
          isFeature: true,
          description: 'Outbound email through operator-declared relays, kept off the routing path.'
        }
      ]
    },
    {
      text: 'Scaling & Availability',
      description: "Concepts for once you're running Bondy Connect for real: clustering, edge deployments, and cross-node routing.",
      items: [
        {
          text: 'Clustering',
          link: '/router/concepts/clustering',
          isFeature: true,
          description: 'How Bondy Connect forms a cluster.'
        },
        {
          text: 'Registry Routing (RIB)',
          link: '/router/concepts/registry_routing',
          isFeature: true,
          description: 'How Bondy Connect scales cross-node call and event routing without replicating every registration to every node.'
        },
        {
          text: 'Bondy Edge (Bridge Relay)',
          link: '/router/concepts/bridge_relay',
          isFeature: true,
          description: 'Link one Bondy Connect node, as a client, to a remote router — sharing a subset of a realm without joining its cluster.'
        },
        {
          text: 'Convergence',
          link: '/router/concepts/convergence',
          isFeature: true,
          description: 'What "converged" means precisely, how a replica catches up, and how Bondy Connect detects and repairs a replica that is genuinely behind.'
        },
        {
          text: 'Per-Origin Prefix Closure',
          link: '/router/concepts/prefix_closure',
          isFeature: true,
          description: "How Bondy Connect guarantees each node applies every origin's operations as an unbroken prefix, and repairs truncated history on rejoin."
        }
      ]
    },
    {
      text: 'Data & Observability',
      description: 'What a node does with data it no longer needs, and what it reports about itself while it runs.',
      items: [
        {
          text: 'Node Lifecycle and Durability',
          link: '/router/concepts/node_lifecycle',
          isFeature: true,
          description: 'What a node does from boot to shutdown, what "ready" means, and why an acknowledged write survives a crash.'
        },
        {
          text: 'Deletion and Reclamation',
          link: '/router/concepts/deletion_and_reclamation',
          isFeature: true,
          description: 'How Bondy safely reclaims space for deleted replicated data.'
        },
        {
          text: 'Telemetry',
          link: '/router/concepts/telemetry',
          isFeature: true,
          description: 'Metrics and W3C distributed tracing: propagation, span seats, minting and OTLP export.'
        },
        {
          text: 'Alarms',
          link: '/router/concepts/alarms',
          isFeature: true,
          description: 'Conditions that are true now, a verified catalogue, and the runbook that says what may be done about each.'
        }
      ]
    },
    {
      text: 'Background',
      description: 'Optional reading: the reasoning and terminology behind Bondy and WAMP. Not required to build your first client.',
      items: [
        {
          text: 'Why Bondy',
          link: '/router/concepts/why_bondy',
          isFeature: true,
          description: 'Learn about the need for a unified application networking platform for distributed application development.'
        },
        {
          text: 'What is Bondy',
          link: '/router/concepts/what_is_bondy',
          isFeature: true,
          description: 'A high-level description of Bondy, its key features and the key benefits it delivers.'
        },
        {
          text: 'What is an Application Network',
          link: '/router/concepts/application_networks',
          isFeature: true,
          description: 'Learn about application networks, their characteristics and benefits, and how Bondy is implementing them.'
        },
        {
          text: 'How does Bondy work',
          link: '/router/concepts/how_does_bondy_work',
          isFeature: true,
          description: 'A high-level description that explains how Bondy works.'
        },
        {
          text: 'How is Bondy different',
          link: '/router/concepts/how_is_bondy_different',
          isFeature: true,
          description: "Learn about Bondy's unique set of features and how it compares to alternative solutions."
        },
        {
          text: 'Features',
          link: '/router/concepts/features',
          isFeature: true,
          description: "Dive into a more detailed description of Bondy's features."
        },
        {
          text: 'Architecture',
          link: '/router/concepts/architecture',
          isFeature: true,
          description: "Dive into a description of Bondy's architecture and the rationale behind its characteristics."
        }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — Reference
 *
 * The hub, plus the reference pages that belong to no single manual. Before
 * this sidebar existed those five pages — /router/reference/index, glossary,
 * metrics, logging and errors — rendered with no left navigation at all,
 * because every sidebar key was a manual's prefix.
 * ======================================================================== */
function referenceSidebar() {
  return [
    {
      text: 'Reference',
      description: 'Material to consult while working, not to read start to end.',
      items: [
        { text: 'Overview', link: '/router/reference/index' },
        { text: 'Glossary', link: '/router/reference/glossary' }
      ]
    },
    {
      text: 'Manuals',
      description: 'Each surface documented once, in full.',
      items: [
        { text: 'Configuration', link: '/router/reference/configuration/index' },
        { text: 'WAMP API', link: '/router/reference/wamp_api/index' },
        { text: 'HTTP API', link: '/router/reference/http_api/index' },
        { text: 'HTTP API Gateway', link: '/router/reference/api_gateway/index' },
        { text: 'Client Libraries', link: '/router/reference/clients/index' },
        { text: 'Bondy Connect SDK', link: '/router/reference/clients/bondy_connect_sdk' }
      ]
    },
    {
      text: 'Protocols',
      description: 'What Bondy Connect implements of each protocol it speaks, and how it encodes payloads.',
      items: [
        { text: 'WAMP Compliance', link: '/router/reference/protocols/wamp' },
        { text: 'MCP Compliance', link: '/router/reference/protocols/mcp' },
        { text: 'Serialization', link: '/router/reference/serialization' }
      ]
    },
    {
      text: 'Operations',
      description: 'What a running node emits, and what it returns when a request fails.',
      items: [
        { text: 'Metrics', link: '/router/reference/metrics' },
        { text: 'Alarms', link: '/router/reference/alarms' },
        { text: 'Logging', link: '/router/reference/logging' },
        { text: 'Errors', link: '/router/reference/errors' }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — Configuration Reference
 *
 * Every bondy.conf key, grouped by the subsystem it configures rather than
 * gathered under one "Configuration" heading, so the group titles read off the
 * shape of what a node can be told to do.
 * ======================================================================== */
function configurationSidebar() {
  return [
    {
      text: 'Getting Started',
      description: 'Where configuration lives and the least you must set.',
      items: [
        {
          text: 'Overview',
          link: '/router/reference/configuration/index'
        },
        {
          text: 'Configuration Basics',
          link: '/router/reference/configuration/basics',
          isFeature: true,
          description: 'Learn about the Bondy runtime configuration, the Bondy configuration file, its syntax, variable replacement and the required OS-specific configuration.'
        },
        {
          text: 'Quickstart Configuration',
          link: '/router/reference/configuration/quickstart',
          isFeature: true,
          description: 'The minimal configuration you must do for a quick start.'
        }
      ]
    },
    {
      text: 'Node & Storage',
      description: 'The node itself: identity, lifecycle, and what it keeps on disk.',
      items: [
        {
          text: 'Node',
          link: '/router/reference/configuration/node',
          isFeature: true,
          description: 'Configure the nodename, platform paths and Erlang VM parameters.'
        },
        {
          text: 'Shutdown',
          link: '/router/reference/configuration/startup_shutdown',
          isFeature: true,
          description: 'The shutdown sequence, and how long a node waits for clients to leave.'
        },
        {
          text: 'Data Storage & Active Anti-entropy',
          link: '/router/reference/configuration/data_storage',
          isFeature: true,
          description: 'Sharding, placement, pack-store durability, and anti-entropy sync for the db.* configuration surface.'
        },
        {
          text: 'Reclamation',
          link: '/router/reference/configuration/reclamation',
          isFeature: true,
          description: 'Configure deletion reclamation and origin retirement for the storage layer.'
        }
      ]
    },
    {
      text: 'Networking',
      description: 'The sockets a node opens and the protocol behaviour on them.',
      items: [
        {
          text: 'Network Listeners',
          link: '/router/reference/configuration/listeners',
          isFeature: true,
          description: 'Configure the network listeners for the different protocols and gateways.'
        },
        {
          text: 'WAMP Features',
          link: '/router/reference/configuration/wamp',
          isFeature: true,
          description: 'Configure several WAMP features like URI strictness, RPC timeouts and message retention.'
        },
        {
          text: 'HTTP Security Headers',
          link: '/router/reference/configuration/http_security_headers',
          isFeature: true,
          description: 'Configure CORS, HSTS, X-Frame-Options, CSP, and other HTTP security response headers per listener.'
        }
      ]
    },
    {
      text: 'Security',
      description: 'Who may connect, how they prove it, and what limits apply.',
      items: [
        {
          text: 'Security',
          link: '/router/reference/configuration/security',
          isFeature: true,
          description: 'Anonymous access, password and ticket policy, OAuth2, realm signing keys and rate limiting.'
        },
        {
          text: 'Certificate Manager',
          link: '/router/reference/configuration/cert_manager',
          isFeature: true,
          description: 'Configure the CA trust store, server certificate rotation, and mTLS settings.'
        }
      ]
    },
    {
      text: 'Clustering & Edge',
      description: 'How a node finds its peers, and how it reaches a router it is not clustered with.',
      items: [
        {
          text: 'Cluster',
          link: '/router/reference/configuration/cluster',
          isFeature: true,
          description: 'Cluster listeners, automatic peer discovery, and the performance options that govern cluster formation.'
        },
        {
          text: 'Bridge Relay (Edge)',
          link: '/router/reference/configuration/bridge_relay',
          isFeature: true,
          description: 'Configure a Bondy Edge connection to a remote router, and the procedures and topics the two share.'
        }
      ]
    },
    {
      text: 'Gateways & Bridges',
      description: 'Everything that carries traffic between Bondy and a system that does not speak WAMP.',
      items: [
        {
          text: 'MCP Gateway',
          link: '/router/reference/configuration/mcp',
          isFeature: true,
          description: 'The per-listener MCP edge keys and the node-global manifest, continuation and upstream settings.'
        },
        {
          text: 'HTTP Connector',
          link: '/router/reference/configuration/http_connector',
          isFeature: true,
          description: 'Configure WAMP-to-HTTP service bridges with authentication, connection pools, and secret management.'
        },
        {
          text: 'Mail',
          link: '/router/reference/configuration/mail',
          isFeature: true,
          description: 'Declare SMTP relays: endpoint, TLS, credentials, which realms may send and as whom.'
        },
        {
          text: 'Broker Bridge',
          link: '/router/reference/configuration/broker_bridge',
          isFeature: true,
          description: 'The supervised subscribers that re-publish WAMP events to an external system, and the JSON specification that declares them.'
        },
        {
          text: 'Kafka Bridge',
          link: '/router/reference/configuration/kafka_bridge',
          isFeature: true,
          description: 'Forward WAMP events to Kafka topics, with Mops expressions mapping event to message.'
        }
      ]
    },
    {
      text: 'Operations',
      description: 'What a node does under pressure, and what it reports about itself.',
      items: [
        {
          text: 'Overload Protection',
          link: '/router/reference/configuration/overload_protection',
          isFeature: true,
          description: 'Load-monitor watermarks and the admission gates that keep a node responsive when work arrives faster than it can be performed.'
        },
        {
          text: 'Telemetry',
          link: '/router/reference/configuration/telemetry',
          isFeature: true,
          description: 'Distributed tracing: OTLP span export and trace-context minting.'
        }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — WAMP Administration API Reference
 *
 * Grouped by the responsibility each set of procedures carries, so the group
 * titles alone describe what the administration API can do.
 * ======================================================================== */
function wampAPISidebar() {
  return [
    {
      text: 'WAMP API Reference',
      description: 'Administering Bondy over WAMP, including the procedures and events the WAMP Meta API defines.',
      items: [
        { text: 'Overview', link: '/router/reference/wamp_api/index' }
      ]
    },
    {
      text: 'Identity & Access',
      description: 'Who exists in a realm, how they authenticate, and what they may do.',
      items: [
        {
          text: 'Realm',
          link: '/router/reference/wamp_api/realm',
          isFeature: true,
          description: 'Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.'
        },
        {
          text: 'User',
          link: '/router/reference/wamp_api/user',
          isFeature: true,
          description: 'Creating, retrieving and managing users within a realm.'
        },
        {
          text: 'Group',
          link: '/router/reference/wamp_api/group',
          isFeature: true,
          description: 'Creating, retrieving and managing groups within a realm.'
        },
        {
          text: 'Source',
          link: '/router/reference/wamp_api/source',
          isFeature: true,
          description: 'Creating, retrieving and managing authentication methods and available sources within a realm.'
        },
        {
          text: 'Grant',
          link: '/router/reference/wamp_api/grant',
          isFeature: true,
          description: 'Granting and revoking permissions over a resource for users, groups and roles.'
        },
        {
          text: 'RBAC',
          link: '/router/reference/wamp_api/rbac',
          isFeature: true,
          description: 'Check whether an identity holds a given permission on a resource.'
        },
        {
          text: 'Ticket',
          link: '/router/reference/wamp_api/ticket',
          isFeature: true,
          description: 'Issuing and revoking tickets.'
        },
        {
          text: 'OAuth2 Token',
          link: '/router/reference/wamp_api/oauth2_token',
          isFeature: true,
          description: 'Issuing and managing the JWTs used to authenticate HTTP API Gateway requests.'
        },
        {
          text: 'OAuth2 Administration',
          link: '/router/reference/wamp_api/oauth2',
          isFeature: true,
          description: 'Manage API client and resource owner identities, and revoke refresh tokens administratively.'
        }
      ]
    },
    {
      text: 'Sessions & Routing',
      description: 'What is currently attached to a realm, and what it has registered or subscribed to.',
      items: [
        {
          text: 'Session',
          link: '/router/reference/wamp_api/session',
          isFeature: true,
          description: 'Inspecting and managing the authenticated links between clients and the router.'
        },
        {
          text: 'Registration',
          link: '/router/reference/wamp_api/registration',
          isFeature: true,
          description: 'Introspecting RPC registrations: paginated and WAMP Meta API listing, matching, and callee lookup.'
        },
        {
          text: 'Subscription',
          link: '/router/reference/wamp_api/subscription',
          isFeature: true,
          description: 'Introspecting Pub/Sub subscriptions: paginated and WAMP Meta API listing, matching, and subscriber lookup.'
        },
        {
          text: 'Interface Metadata & Reflection',
          link: '/router/reference/wamp_api/interface',
          isFeature: true,
          description: 'Publishing procedure/topic/error metadata as documents, and reading it through WAMP Interface Reflection.'
        }
      ]
    },
    {
      text: 'Clustering & Edge',
      description: 'The nodes a realm spans, and the routers it is bridged to.',
      items: [
        {
          text: 'Cluster',
          link: '/router/reference/wamp_api/cluster',
          isFeature: true,
          description: 'Inspecting cluster membership and node status; formation itself is configured in bondy.conf.'
        },
        {
          text: 'Bridge Relay (Edge)',
          link: '/router/reference/wamp_api/bridge_relay',
          isFeature: true,
          description: 'Creating, retrieving and managing Bridge Relay (Edge) connections.'
        }
      ]
    },
    {
      text: 'Gateways & Bridges',
      description: 'The procedures that manage what Bondy exposes to systems outside WAMP.',
      items: [
        {
          text: 'HTTP API Gateway',
          link: '/router/reference/wamp_api/api_gateway',
          isFeature: true,
          description: 'Load and manage API Gateway specifications.'
        },
        {
          text: 'MCP Gateway',
          link: '/router/reference/wamp_api/mcp',
          isFeature: true,
          description: 'Managing MCP overlay documents: bondy.mcp.overlay load, get, list, delete and suggested.'
        },
        {
          text: 'Mail',
          link: '/router/reference/wamp_api/mail',
          isFeature: true,
          description: 'Sending email: send, send_async, status, relay listing and a relay test.'
        }
      ]
    },
    {
      text: 'Health & Remediation',
      description: 'What is wrong right now, and what may be done about it.',
      items: [
        {
          text: 'Alarms',
          link: '/router/reference/wamp_api/alarm',
          isFeature: true,
          description: 'Reading raised alarms cluster-wide, one alarm by id, a node history and the alarm catalogue.'
        },
        {
          text: 'Task Catalogue',
          link: '/router/reference/wamp_api/task',
          isFeature: true,
          description: 'The procedures sanctioned as remediations, with their impact, blast radius and dry-run support.'
        }
      ]
    },
    {
      text: 'Node Operations',
      description: 'Operating a live node: its certificates and its durable data.',
      items: [
        {
          text: 'Certificate Manager',
          link: '/router/reference/wamp_api/cert_manager',
          isFeature: true,
          description: 'Live TLS certificate rotation, CA trust store management, and mTLS configuration.'
        },
        {
          text: 'Export & Backup',
          link: '/router/reference/wamp_api/export',
          isFeature: true,
          description: "Exporting and importing Bondy's durable data (security, tokens, tickets, bridges, retained messages)."
        }
      ]
    },
    {
      text: 'Errors',
      description: 'What comes back when a procedure fails.',
      items: [
        {
          text: 'Error URIs',
          link: '/router/reference/wamp_api/errors/index',
          isFeature: true,
          description: 'The catalogue of all error URIs used by Bondy and WAMP.'
        }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — HTTP API Reference
 * ======================================================================== */
function httpAPISidebar() {
  return [
    {
      text: 'HTTP API Reference',
      description: 'The HTTP/REST equivalents of the administration API, plus the OIDC endpoints.',
      items: [
        {
          // Pointed at /router/reference/index until now, which sent readers
          // out of this manual and into the reference hub.
          text: 'Admin HTTP API',
          link: '/router/reference/http_api/index'
        },
        {
          text: 'Realm',
          link: '/router/reference/http_api/realm',
          isFeature: true,
          description: 'Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status.'
        },
        {
          text: 'HTTP API Gateway',
          link: '/router/reference/http_api/api_gateway',
          isFeature: true,
          description: 'Bondy API Gateway is a reverse proxy that lets you manage, configure, and route requests to your WAMP APIs and also to external HTTP/REST APIs.'
        },
        {
          text: 'OIDC',
          link: '/router/reference/http_api/oidc',
          isFeature: true,
          description: 'OIDC login, callback and logout endpoints for OpenID Connect authentication.'
        }
      ]
    }
  ]
}


/* ===========================================================================
 * Bondy Connect — HTTP API Gateway Reference
 * ======================================================================== */
function apiGatewaySidebar() {
  return [
    {
      text: 'HTTP API Gateway Reference',
      description: 'The specification format that maps HTTP requests onto WAMP procedures, and the expression language it uses.',
      items: [
        {
          text: 'Overview',
          link: '/router/reference/api_gateway/index'
        },
        {
          text: 'API Gateway Specification',
          link: '/router/reference/api_gateway/specification',
          isFeature: true,
          description: 'An API Gateway specification is a document that tells Bondy how to route incoming HTTP requests to your WAMP APIs or to external HTTP/REST APIs.'
        },
        {
          text: 'API Gateway Expressions',
          link: '/router/reference/api_gateway/expressions',
          isFeature: true,
          description: 'Bondy API specifications use a logic-less domain-specific language for data transformation and dynamic configuration.'
        }
      ]
    }
  ]
}
