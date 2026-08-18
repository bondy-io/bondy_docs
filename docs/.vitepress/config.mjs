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
    vite: { ssr: { noExternal: ['@bondy/site-chrome'] } },

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
      // (code and the uppercase mono labels).
      ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
      ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
      ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap' }],
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
        theme: 'one-dark-pro',
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
                    ${param}
                </span>
                <span class="config-param-meta">&nbsp;::&nbsp;${datatype}</span>
            </span>
        </span>
        <div class="since-version">
            <span class="config-param-meta">Default = ${defaultValue}</span>
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
              return `
    <div id="${oldKey}" tabindex="-1" class="config-param-deprecated">
        <span class="config-param-badge-deprecated">Deprecated</span>
        <span class="config-param-old">
            <a href="#${oldKey}" aria-hidden="true"></a>
            ${oldKey}
        </span>
        <span class="config-param-arrow">renamed to</span>
        <a class="config-param-new" href="#${newKey}"><code>${newKey}</code></a>
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
            ${oldKey}
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
                    ${obj.key}
                </span>
                <span class="config-param-meta">&nbsp;::&nbsp;${datatype}</span>
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

// Top navigation

function nav() {
    return [
      {
        text: 'Tutorials',
        link: '/router/tutorials/index',
        activeMatch: '/router/tutorials/'
      },
      {
        text: 'Concepts',
        link: '/router/concepts/index',
        activeMatch: '/router/concepts/'
      },
      {
        text: 'How-to Guides',
        link: '/router/guides/index',
        activeMatch: '/router/guides/'
      },
      {
        text: 'Reference',
        items: [
          {
            text: 'Configuration Reference',
            link: '/router/reference/configuration/index',
            activeMatch: '/router/reference/configuration'
          },
          {
            text: 'WAMP API Reference',
            link: '/router/reference/wamp_api/index',
            activeMatch: '/router/reference/wamp_api'
          },
          {
            text: 'HTTP API Reference',
            link: '/router/reference/http_api/index',
            activeMatch: '/router/reference/http_api'
          },
          {
            text: 'HTTP API Gateway Specification',
            link: '/router/reference/api_gateway/index',
            activeMatch: '/router/reference/api_gateway'
          },
          {
            text: 'Metrics Reference',
            link: '/router/reference/metrics',
            activeMatch: '/router/reference/metrics'
          },
          {
            text: 'Error Reference',
            link: '/router/reference/errors',
            activeMatch: '/router/reference/errors'
          },
          {
            text: 'Glossary',
            link: '/router/reference/glossary',
            activeMatch: '/router/reference/glossary'
          },
        ]
      },
      {
        text: 'About',
        items: [
          {
            text: 'Bondy.io',
            link: ORIGINS.website,
          },
          {
            text: 'FAQ',
            link: '/about/faq',
          },
          {
            text: 'Community',
            link: '/about/community',
          },
          {
            text: 'Contributors',
            link: '/about/contributors',
          },
          {
            text: 'Terms and Policies',
            link: '/about/terms_and_policies',
          }
        ]
      }
  ]
}

function sidebars() {
  return {
    // Longest prefix wins in VitePress, so /wamp/ can sit alongside the
    // router's keys without either shadowing the other.
    '/wamp/': wampSidebar(),
    '/router/tutorials/': tutorialsSidebar(),
    '/router/guides/': guidesSidebar(),
    '/router/reference/configuration': configurationSidebar(),
    '/router/reference/wamp_api': wampAPISidebar(),
    '/router/reference/http_api': httpAPISidebar(),
    '/router/reference/api_gateway': httpAPIGatewaySidebar(),
    '/router/concepts/': conceptsSidebar()
  }
}


/**
 * The WAMP protocol set.
 *
 * This is documentation for someone writing a WAMP component, who does not
 * need to know how Bondy is configured or operated — that is the router set.
 * The examples still run against Bondy, because that is the router we ship;
 * what makes a page belong here is what the reader is learning.
 *
 * Grouped by Diataxis kind, matching the router set. The router's own
 * sidebars still link into these pages where a Bondy reader needs them as
 * prerequisites: the split separates the sets, it does not sever them.
 */
function wampSidebar() {
  return [
    {
      text: 'Concepts',
      description: 'What WAMP is and how its two communication patterns work.',
      items: [
        { text: 'What is WAMP?', link: '/wamp/concepts/what_is_wamp', isFeature: true,
          description: 'The protocol in one page: what it gives you and what it replaces.' },
        { text: 'Introduction', link: '/wamp/concepts/introduction', isFeature: true,
          description: 'Roles, peers and the router, and how a session is established.' },
        { text: 'Communication Patterns', link: '/wamp/concepts/communication_patterns', isFeature: true,
          description: 'The two patterns — RPC and Pub/Sub — that together cover request-response and event distribution.' },
        { text: 'Routed RPC', link: '/wamp/concepts/rpc',
          description: 'The Caller/Callee request-response pattern: registering, calling and routing a procedure.' },
        { text: 'Publish/Subscribe', link: '/wamp/concepts/pubsub',
          description: 'The Publisher/Subscriber event pattern: topics, subscriptions and publications.' },
        { text: 'Connections and Sessions', link: '/wamp/concepts/sessions',
          description: 'What a WAMP session is and how it relates to transports, realms and authentication.' },
        { text: 'Security', link: '/wamp/concepts/security',
          description: 'How a session authenticates and what it is then authorized to do.' },
        { text: 'Naming', link: '/wamp/concepts/naming',
          description: 'Designing procedure and topic URIs, beyond the bare syntax rules.' }
      ]
    },
    {
      text: 'Beyond the Basics',
      description: 'The protocol-level mechanics behind the advanced features.',
      items: [
        { text: 'Beyond the Basics', link: '/wamp/concepts/beyond_the_basics',
          description: 'What the advanced profile adds once the two patterns are working.' },
        { text: 'Advanced RPC', link: '/wamp/concepts/advanced/rpc',
          description: 'Progressive results, call cancellation, shared registrations and invocation policies.' },
        { text: 'Advanced Pub/Sub', link: '/wamp/concepts/advanced/pubsub',
          description: 'Pattern-based subscriptions, event retention and subscriber allow/deny lists.' },
        { text: 'Compliance', link: '/wamp/concepts/compliance',
          description: 'Which parts of the specification are implemented.' }
      ]
    },
    {
      text: 'Programming Guides',
      description: 'Getting a specific job done from a WAMP component.',
      items: [
        { text: 'General', link: '/wamp/guides/programming/general',
          description: 'The conventions every component follows, whatever the pattern.' },
        { text: 'Calling and Registering Procedures', link: '/wamp/guides/programming/rpc',
          description: 'Register a procedure, call one, and choose an invocation policy.' },
        { text: 'Publishing and Subscribing', link: '/wamp/guides/programming/pub_sub',
          description: 'Publish to a topic and subscribe to one, including pattern matching.' }
      ]
    },
    {
      text: 'Tutorials',
      description: 'End-to-end walkthroughs against a running Bondy.',
      items: [
        { text: 'Wampy (Python)', link: '/wamp/tutorials/wampy',
          description: 'Connect, call and subscribe from Python.' },
        { text: 'Bondy Connect (BEAM)', link: '/wamp/tutorials/bondy_connect',
          description: 'Connect, call and subscribe from Erlang or Elixir.' }
      ]
    },
    {
      text: 'Client Libraries',
      description: 'What to use to speak WAMP from your language.',
      items: [
        { text: 'WAMP Client Libraries', link: '/wamp/reference/clients/index', isFeature: true,
          description: 'The libraries available per language, and which Bondy ships itself.' },
        { text: 'Bondy Connect', link: '/wamp/reference/clients/bondy_connect',
          description: 'The complete API reference for bondy_connect: every function, option and error shape.' }
      ]
    }
  ]
}

function externalResources() {
  return [
        {
          text: 'Community Forum',
          link: 'https://discuss.bondy.io',
          isFeature: false
        },
        {
          text: 'Community Chat',
          link: 'https://bondy.zulipchat.com',
          isFeature: false
        },
        {
          text: 'Commercial Support',
          link: 'https://bondy.io/',
          isFeature: false
        },
        {
          text: 'Github',
          link: 'https://github.com/bondy-io/bondy',
          isFeature: false
        }
      ]
}

// Tutorials Section

function tutorialsSidebar() {
  return [
      {
        text: 'Example Applications',
        description: 'Complete, worked applications to follow once you know the fundamentals.',
        items: [
          {
            text: 'Marketplace',
            link: '/router/tutorials/getting_started/marketplace',
            isFeature:true,
            description: 'A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS web application.'
          },
          {
            text: 'Marketplace HTTP API Gateway',
            link: '/router/tutorials/getting_started/marketplace_api_gateway',
            isFeature:true,
            description: 'A tutorial that demonstrates how to add an HTTP API to an existing project using the HTTP API Gateway.'
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
        text: 'Advanced Security Topics',
        items: [
          {
            text: 'Using Same Sign-on',
            link: '/router/tutorials/security/same_sign_on' ,
            description: 'Learn how to use create and use a Same Sign-on Realm.',
            isFeature: true
          },
          { text: 'More tutorials coming soon...',}
        ]
      }
  ]
}


// Guides Section

function guidesSidebar() {
  return [
      {
        text: 'Get Bondy',
        description: 'Bondy can be deployed anywhere from resource-constrained AMD64/ARM64 edge devices to private, hybrid and public clouds running bare metal, virtual machines and containers. Choose the option best suited to your needs.',
        collapsible: true,
        items: [
          {
            text: 'Install from Source',
            link: '/router/guides/install/source',
            description: 'Build and install Bondy from source.',
            isFeature: true
          },
          {
            text: 'Install using Docker',
            link: '/router/guides/install/docker' ,
            description: 'Use the official Docker images for AMD64 and ARM64 architectures.',
            isFeature: true
          },
          {
            text: 'Install using Kubernetes',
            link: '/router/guides/install/kubernetes' ,
            description: 'See a starter manifest recipe and taylor it based on your needs.',
            isFeature: true
          },
        ]
      },
      {
        text: 'Programming with HTTP',
        collapsible: true,
        items: [
          {
            text: 'Loading an API Gateway Specification',
            link: '/router/guides/programming/loading_api_spec',
            isFeature: true,
            description: "Learn how to load an API Gateway Specification using the HTTP Admin API."
          },
          {
            text: 'Using the HTTP Connector',
            link: '/router/guides/programming/http_connector',
            isFeature: true,
            description: "Bridge WAMP RPC calls to upstream HTTP/REST services with step-by-step examples."
          },
          {
            text: 'Sending Email',
            link: '/router/guides/programming/sending_email',
            isFeature: true,
            description: "Send email from a WAMP client, or on a published event, with idempotency and error handling."
          }
        ]
      },
      {
        text: 'Configuration',
        collapsible: true,
        items: [
          { text: 'Configuration Basics', link: '/router/guides/configuration/configuration_basics'}
        ]
      },
      {
        text: 'Administration',
        collapsible: true,
        items: [
          {
            text: 'Backup and Restore',
            link: '/router/guides/administration/backup_and_restore',
            isFeature: true,
            description: 'Back up and restore the write-ahead log and Merkle Search Tree pack store.'
          },
          {
            text: 'Monitoring with Prometheus & Grafana',
            link: '/router/guides/administration/monitoring',
            isFeature: true,
            description: 'Run the bundled Prometheus and Grafana stack against your cluster.'
          },
          {
            text: 'Configuring Mail Relays',
            link: '/router/guides/administration/configuring_mail_relays',
            isFeature: true,
            description: 'Declare a relay, scope it to realms, wire up its credential, and verify it.'
          },
          {
            text: 'Load Regulation and Rate Limiting',
            link: '/router/guides/administration/load_regulation_and_rate_limiting',
            isFeature: true,
            description: 'How Bondy protects itself from overload and from abuse, and what a client sees when either engages.'
          },
          {
            text: 'Simplifying realm management using prototypes',
            link: '/router/guides/administration/simplifying_realm_management_using_prototypes',
            isFeature: true
          },
          {
            text: 'Raising Open File Limits',
            link: '/router/guides/administration/raising_open_file_limits',
            isFeature: true,
            description: 'Raise the OS and Docker open-file limit so Bondy never runs out of file handles.'
          }
        ]
      },
      {
        text: 'Security',
        collapsible:true,
        items: [
          // { text: 'TLS configuration', link: '/router/guides/security/tls_configuration'},
          { text: 'Configuring CORS & HTTP Security Headers', link: '/router/guides/security/configuring_cors'}
        ]
      },
      {
        text: 'Deployment',
        collapsible: true,
        items: [
          { text: 'Running a cluster', link: '/router/guides/deployment/running_a_cluster'},
          {
            text: 'Upgrading to 1.0.0',
            link: '/router/guides/deployment/upgrading_to_1_0_0',
            isFeature: true,
            description: 'Migrate an existing deployment to the new storage and replication stack.'
          }
        ]
      }
  ]
}

// Concepts Section
function conceptsSidebar() {
  return [
      {
        text: 'Realms & Security',
        description: "Once RPC and Pub/Sub are working, the next thing to understand: the domain your sessions attach to, and how they authenticate.",
        items: [
          {
            text: 'Realms',
            link: '/router/concepts/realms',
            isFeature: true,
            description: "Realms are authentication, authorization, routing and administrative domains that act as namespaces."
          },
          {
            text: 'Same Sign-on',
            link: '/router/concepts/same_sign_on',
            isFeature: true,
            description: "Do you need to provide users access to multiple realms? Learn about same sign-on realms."
          },
          {
            text: 'Single Sign-on',
            link: '/router/concepts/single_sign_on',
            isFeature: true,
            description: "Learn how to enable Single Sign-on on multiple realms."
          },
          {
            text: 'OIDC Authentication',
            link: '/router/concepts/oidc_authentication',
            isFeature: true,
            description: "Learn how to authenticate users via external Identity Providers using OpenID Connect."
          }
        ]
      },
      {
        text: 'Platform & Scaling',
        description: "Concepts for once you're running Bondy for real: clustering, edge deployments, and cross-node routing.",
        items: [
          {
            text: 'Clustering',
            link: '/router/concepts/clustering',
            isFeature: true
          },
          {
            text: 'Registry Routing (RIB)',
            link: '/router/concepts/registry_routing',
            isFeature: true,
            description: "How Bondy scales cross-node call and event routing without replicating every registration to every node."
          },
          {
            text: 'Bondy Edge (Bridge Relay)',
            link: '/router/concepts/bridge_relay',
            isFeature: true,
            description: "Connect one Bondy node, as a client, to a remote router — sharing a subset of a realm without joining its cluster."
          },
          {
            text: 'Broker Bridge',
            link: '/router/concepts/broker_bridge',
            isFeature: true,
            description: "Re-publish WAMP events to Kafka, AWS SNS, Mailgun, or SendGrid."
          },
          {
            text: 'Mail',
            link: '/router/concepts/mail',
            isFeature: true,
            description: "Outbound email through operator-declared relays, kept off the routing path."
          },
          {
            text: 'HTTP Transports (Longpoll & SSE)',
            link: '/router/concepts/http_transports',
            isFeature: true,
            description: "Learn how to use HTTP long-polling and Server-Sent Events transports for WAMP sessions."
          },
          {
            text: 'HTTP API Gateway',
            link: '/router/concepts/api_gateway',
            isFeature: true,
            description: "Route incoming HTTP/REST requests to WAMP procedures or external APIs using declarative JSON specifications."
          },
          {
            text: 'HTTP Connector',
            link: '/router/concepts/http_connector',
            isFeature: true,
            description: "Bridge WAMP RPC calls to upstream HTTP/REST services with automatic auth, retries, and error mapping."
          },
          {
            text: 'Deletion and Reclamation',
            link: '/router/concepts/deletion_and_reclamation',
            isFeature: true,
            description: "How Bondy safely reclaims space for deleted replicated data."
          },
          {
            text: 'Per-Origin Prefix Closure',
            link: '/router/concepts/prefix_closure',
            isFeature: true,
            description: "How Bondy guarantees each node applies every origin's operations as an unbroken prefix, and repairs truncated history on rejoin."
          },
        ]
      },
      {
        text: 'Background',
        description: "Optional reading: the reasoning and terminology behind Bondy and WAMP. Not required to build your first client.",
        items: [
          {
            text: 'Why Bondy',
            link: '/router/concepts/why_bondy' ,
            isFeature: true,
            description: "Learn about the need for a unified application networking platform for distributed application development."
          },
          {
            text: 'What is Bondy',
            link: '/router/concepts/what_is_bondy',
            isFeature: true,
            description: "A high-level description of Bondy, its key features and the key benefits it delivers."
          },
          {
            text: 'What is an Application Network',
            link: '/router/concepts/application_networks',
            isFeature: true,
            description: "Learn about application networks, their characteristics and benefits, and how Bondy is implementing them. "
          },
          {
            text: 'How does Bondy work',
            link: '/router/concepts/how_does_bondy_work' ,
            isFeature: true,
            description: "A high-level description that explains how Bondy works."
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
            description: "Dive into a more detail description of Bondy's features."
          },
          {
            text: 'Architecture',
            link: '/router/concepts/architecture',
            isFeature: true,
            description: "Dive into a description of Bondy's architecture and its rationale behind its characteristics."
          }
        ]
      }
  ]
}

// Reference Section


function configurationSidebar() {
  return [
      {
        text: 'Configuration Reference',
        items: [
          {
            text: 'Overview',
            link: '/router/reference/configuration/index',
            isFeature: false
          },
          {
            text: 'Configuration basics',
            description: 'Learn about the Bondy runtime configuration, the Bondy configuration file, its syntax, variable replacement and the required OS-specific configuration.',
            link: '/router/reference/configuration/basics',
            isFeature: true
          },
          {
            text: 'Quickstart Configuration',
            description: 'The minimal configuration you must do for a quick start.',
            link: '/router/reference/configuration/quickstart',
            isFeature: true
          }
        ]
      },
      {
        text: 'Fabric Configuration',
        items: [
          {
            text: 'Node',
            description: 'Configure the nodename, platform paths and Erlang VM parameters',
            link: '/router/reference/configuration/node',
            isFeature: true
          },
          {
            text: 'Startup/Shutdown',
            description: 'Configure options controlling serveral aspects of what happens during startup and shutdown',
            link: '/router/reference/configuration/startup_shutdown',
            isFeature: true
          },
          {
            text: 'Network Listeners',
            description: 'Configure the network listeners for the different protocols and gateways',
            link: '/router/reference/configuration/listeners',
            isFeature: true
          },
          {
            text: 'HTTP Security Headers',
            description: 'Configure CORS, HSTS, X-Frame-Options, CSP, and other HTTP security response headers per listener',
            link: '/router/reference/configuration/http_security_headers',
            isFeature: true
          },
          {
            text: 'Security',
            link: '/router/reference/configuration/security',
            isFeature: true
          },
          {
            text: 'Overload Protection',
            link: '/router/reference/configuration/overload_protection',
            isFeature: true
          },
          {
            text: 'Cluster',
            link: '/router/reference/configuration/cluster',
            isFeature: true
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
          },
          {
            text: 'Bridge Relay (Edge)',
            link: '/router/reference/configuration/bridge_relay',
            isFeature: true
          },
          {
            text: 'HTTP Connector',
            description: 'Configure WAMP-to-HTTP service bridges with authentication, connection pools, and secret management.',
            link: '/router/reference/configuration/http_connector',
            isFeature: true
          },
          {
            text: 'Mail',
            description: 'Declare SMTP relays: endpoint, TLS, credentials, which realms may send and as whom.',
            link: '/router/reference/configuration/mail',
            isFeature: true
          },
          {
            text: 'Certificate Manager',
            description: 'Configure the CA trust store, server certificate rotation, and mTLS settings.',
            link: '/router/reference/configuration/cert_manager',
            isFeature: true
          }
        ]
      },

      {
        text: 'Protocols',
        items: [
          {
            text: 'WAMP Features',
            description: 'Configure several WAMP features like URI strictness, RPC timeouts and message retention',
            link: '/router/reference/configuration/wamp',
            isFeature: true
          }
        ]
      },
      {
        text: 'Broker Bridge',
        items: [
          {
            text: 'General',
            link: '/router/reference/configuration/broker_bridge',
            isFeature: true
          },
          {
            text: 'Kafka Bridge',
            link: '/router/reference/configuration/kafka_bridge',
            isFeature: true
          }
        ]
      },
  ]
}


function wampAPISidebar() {
  return [
      {
        text: 'WAMP API Reference',
        items: [
          { text: 'Introduction',
            link: '/router/reference/wamp_api/index',
            isFeature: false
          },
          { text: 'Realm',
            link: '/router/reference/wamp_api/realm',
            isFeature: true,
            description:"Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status."
          },
          { text: 'User',
            link: '/router/reference/wamp_api/user',
            isFeature: true,
            description:"Creating, retrieving and managing users within a realm."
          },
          { text: 'Group',
            link: '/router/reference/wamp_api/group',
            isFeature: true,
            description:"Creating, retrieving and managing groups within a realm."
          },
          { text: 'Source',
            link: '/router/reference/wamp_api/source',
            isFeature: true,
            description:"Creating, retrieving and managing authentication methods and available sources within a realm."
          },
          { text: 'Grant',
            link: '/router/reference/wamp_api/grant',
            isFeature: true
          },
          { text: 'RBAC',
            link: '/router/reference/wamp_api/rbac',
            isFeature: true,
            description: "Check whether an identity holds a given permission on a resource."
          },
          { text: 'Session',
            link: '/router/reference/wamp_api/session',
            isFeature: true
          },
          { text: 'Registration',
            link: '/router/reference/wamp_api/registration',
            isFeature: true,
            description: "Introspecting RPC registrations: paginated and WAMP Meta API listing, matching, and callee lookup."
          },
          { text: 'Subscription',
            link: '/router/reference/wamp_api/subscription',
            isFeature: true,
            description: "Introspecting Pub/Sub subscriptions: paginated and WAMP Meta API listing, matching, and subscriber lookup."
          },
          { text: 'Mail',
            link: '/router/reference/wamp_api/mail',
            isFeature: true,
            description: "Sending email: send, send_async, status, relay listing and a relay test."
          },
          { text: 'Ticket',
            link: '/router/reference/wamp_api/ticket',
            isFeature: true,
            description: "Issuing and revoking tickets."
          },
          { text: 'OAuth2 Administration',
            link: '/router/reference/wamp_api/oauth2',
            isFeature: true,
            description: "Manage API client and resource owner identities, and revoke refresh tokens administratively."
          },
          { text: 'OAuth2 Token',
            link: '/router/reference/wamp_api/oauth2_token',
            isFeature: true
          },
          { text: 'Cluster',
            link: '/router/reference/wamp_api/cluster',
            isFeature: true
          },
          { text: 'Bridge Relay (Edge)',
            link: '/router/reference/wamp_api/bridge_relay',
            isFeature: true,
            description: "Creating, retrieving and managing Bridge Relay (Edge) connections."
          },
          { text: 'HTTP API Gateway',
            link: '/router/reference/wamp_api/api_gateway',
            isFeature: true,
            description: "Load and manage API Gateway specifications."
          },
          { text: 'Certificate Manager',
            link: '/router/reference/wamp_api/cert_manager',
            isFeature: true,
            description: "Live TLS certificate rotation, CA trust store management, and mTLS configuration."
          },
          { text: 'Export & Backup',
            link: '/router/reference/wamp_api/export',
            isFeature: true,
            description: "Exporting and importing Bondy's durable data (security, tokens, tickets, bridges, retained messages)."
          },
          { text: 'Error URIs',
            link: '/router/reference/wamp_api/errors/index',
            isFeature: true,
            description: "The catalogue of all error URIs used by Bondy and WAMP."
          }
        ]
      }
  ]
}

function httpAPISidebar() {
  return [
      {
        text: 'HTTP API Reference',
        items: [
          {
            text: 'Introduction',
            link: '/router/reference/index',
            isFeature: false
          },

          {
            text: 'Realm',
            link: '/router/reference/http_api/realm',
            isFeature: true,
            description:"Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status."
          },
          {
            text: 'HTTP API Gateway',
            link: '/router/reference/http_api/api_gateway',
            isFeature: true,
            description: "Bondy API Gateway is a reverse proxy that lets you manage, configure, and route requests to your WAMP APIs and also to external HTTP/REST APIs."
          },
          {
            text: 'OIDC',
            link: '/router/reference/http_api/oidc',
            isFeature: true,
            description: "OIDC login, callback and logout endpoints for OpenID Connect authentication."
          }

        ]
      }
  ]
}

  function httpAPIGatewaySidebar() {
  return [
      {
        text: 'HTTP API Gateway Reference',
        items: [
          {
            text: 'Introduction',
            link: '/router/reference/api_gateway/index',
            isFeature: false
          },
          {
            text: 'API Gateway Specification',
            link: '/router/reference/api_gateway/specification',
            isFeature: true,
            description: "An API Gateway specification is a document that tells Bondy how to route incoming HTTP requests to your WAMP APIs or to external HTTP/REST APIs."
          },
          {
            text: 'API Gateway Expressions',
            link: '/router/reference/api_gateway/expressions',
            isFeature: true,
            description: "Bondy API Specification use a logic-less domain-specific language for data transformation and dynamic configuration."
          }

        ]
      }
  ]
}
