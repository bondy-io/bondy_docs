// Sitemap
import { createWriteStream, cpSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SitemapStream } from 'sitemap'
import mdCustomBlock from 'markdown-it-custom-block'
import { withThemeDefaults } from '@leapsight/vitepress-template/theme/config'

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
    // These are app level configs.
    lang: 'en-GB',
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
      ['meta', {name: "theme-color", content: "#171916"}],
      ['meta', {name: "msapplication-TileColor", content: "#171916"}],
      ['meta', { name: "msapplication-config", content: "/assets/favicons/browserconfig.xml"}],
      ['link', { rel: "apple-touch-icon", sizes: "180x180", href: "/assets/favicons/apple-touch-icon.png"}],
      ['link', { rel: "icon", type: "image/png", sizes: "32x32", href: "/assets/favicons/favicon-32x32.png"}],
      ['link', { rel: "icon", type: "image/png", sizes: "16x16", href: "/assets/favicons/favicon-16x16.png"}],
      ['link', { rel: "manifest", href: "/assets/favicons/site.webmanifest"}],
      ['link', { rel: "mask-icon", href: "/assets/favicons/safari-pinned-tab.svg", color: "#171916"}],
      ['link', { rel: "shortcut icon", href: "/assets/favicons/favicon.ico"}],
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
        siteTitle: false,
        logo: '/assets/logo.png',

        // Search
        search: {
          provider: 'algolia',
          options: {
            appId: '1GA3LX5N2C',
            apiKey: '17d9078a92df8769b75e5a64a3d8f869',
            indexName: 'bondy'
          }
        },

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
        versions: [
          { ...versionsManifest.current, current: true },
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
    // KaTeX CSS is linked in `head` above.
    markdown: { math: true }
  }
)

// Top navigation

function nav() {
    return [
      {
        text: 'Tutorials',
        link: '/tutorials/index',
        activeMatch: '/tutorials/'
      },
      {
        text: 'Concepts',
        link: '/concepts/index',
        activeMatch: '/concepts/'
      },
      {
        text: 'How-to Guides',
        link: '/guides/index',
        activeMatch: '/guides/'
      },
      {
        text: 'Reference',
        items: [
          {
            text: 'Configuration Reference',
            link: '/reference/configuration/index',
            activeMatch: '/reference/configuration'
          },
          {
            text: 'WAMP API Reference',
            link: '/reference/wamp_api/index',
            activeMatch: '/reference/wamp_api'
          },
          {
            text: 'HTTP API Reference',
            link: '/reference/http_api/index',
            activeMatch: '/reference/http_api'
          },
          {
            text: 'HTTP API Gateway Specification',
            link: '/reference/api_gateway/index',
            activeMatch: '/reference/api_gateway'
          },
          {
            text: 'WAMP Client Libraries',
            link: '/reference/wamp_clients/index',
            activeMatch: '/reference/wamp_clients'
          },
          {
            text: 'Metrics Reference',
            link: '/reference/metrics',
            activeMatch: '/reference/metrics'
          },
          {
            text: 'Error Reference',
            link: '/reference/errors',
            activeMatch: '/reference/errors'
          },
          {
            text: 'Glossary',
            link: '/reference/glossary',
            activeMatch: '/reference/glossary'
          },
        ]
      },
      {
        text: 'About',
        items: [
          {
            text: 'Bondy.io',
            link: 'https://www.bondy.io',
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
    '/tutorials/': tutorialsSidebar(),
    '/guides/': guidesSidebar(),
    '/reference/configuration': configurationSidebar(),
    '/reference/wamp_api': wampAPISidebar(),
    '/reference/http_api': httpAPISidebar(),
    '/reference/api_gateway': httpAPIGatewaySidebar(),
    '/concepts/': conceptsSidebar()
  }
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
        text: 'Get Started',
        description: 'The fastest path from a running Bondy node to your first RPC call and Pub/Sub event.',
        collapsible: true,
        items: [
          {
            text: 'Getting Started with Wampy (JavaScript)',
            link: '/tutorials/getting_started/wampy',
            isFeature: true,
            description: 'Connect to Bondy from Node.js using Wampy: register and call a procedure, then publish and subscribe.'
          },
          {
            text: 'Getting Started with Bondy Connect (Erlang/Elixir)',
            link: '/tutorials/getting_started/bondy_connect',
            isFeature: true,
            description: 'Connect to Bondy from Erlang or Elixir using bondy_connect: register and call a procedure, then publish and subscribe.'
          }
        ]
      },
      {
        text: 'Example Applications',
        description: 'Complete, worked applications to follow once you know the fundamentals.',
        items: [
          {
            text: 'Marketplace',
            link: '/tutorials/getting_started/marketplace',
            isFeature:true,
            description: 'A tutorial that demonstrates a simple marketplace with Python microservices and a VueJS web application.'
          },
          {
            text: 'Marketplace HTTP API Gateway',
            link: '/tutorials/getting_started/marketplace_api_gateway',
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
            link: '/tutorials/smtp_bridge',
            isFeature: true,
            description: 'Publish an event, read the email it produced — end to end against a local mail server.'
          },
          {
            text: 'Kafka Bridge',
            link: '/tutorials/kafka_bridge',
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
            link: '/tutorials/security/same_sign_on' ,
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
            link: '/guides/install/source',
            description: 'Build and install Bondy from source.',
            isFeature: true
          },
          {
            text: 'Install using Docker',
            link: '/guides/install/docker' ,
            description: 'Use the official Docker images for AMD64 and ARM64 architectures.',
            isFeature: true
          },
          {
            text: 'Install using Kubernetes',
            link: '/guides/install/kubernetes' ,
            description: 'See a starter manifest recipe and taylor it based on your needs.',
            isFeature: true
          },
        ]
      },
      {
        text: 'Programming with WAMP',
        collapsible: true,
        items: [
          {
            text: 'General',
            link: '/guides/programming/general',
            isFeature: true
          },
          {
            text: 'Remote Procedure Calls',
            link: '/guides/programming/rpc',
            isFeature: true
          },
          {
            text: 'Publish and Subscribe',
            link: '/guides/programming/pub_sub',
            isFeature: true
          }
        ]
      },
      {
        text: 'Programming with HTTP',
        collapsible: true,
        items: [
          {
            text: 'Loading an API Gateway Specification',
            link: '/guides/programming/loading_api_spec',
            isFeature: true,
            description: "Learn how to load an API Gateway Specification using the HTTP Admin API."
          },
          {
            text: 'Using the HTTP Connector',
            link: '/guides/programming/http_connector',
            isFeature: true,
            description: "Bridge WAMP RPC calls to upstream HTTP/REST services with step-by-step examples."
          },
          {
            text: 'Sending Email',
            link: '/guides/programming/sending_email',
            isFeature: true,
            description: "Send email from a WAMP client, or on a published event, with idempotency and error handling."
          }
        ]
      },
      {
        text: 'Configuration',
        collapsible: true,
        items: [
          { text: 'Configuration Basics', link: '/guides/configuration/configuration_basics.md'}
        ]
      },
      {
        text: 'Administration',
        collapsible: true,
        items: [
          {
            text: 'Backup and Restore',
            link: '/guides/administration/backup_and_restore',
            isFeature: true,
            description: 'Back up and restore the write-ahead log and Merkle Search Tree pack store.'
          },
          {
            text: 'Monitoring with Prometheus & Grafana',
            link: '/guides/administration/monitoring',
            isFeature: true,
            description: 'Run the bundled Prometheus and Grafana stack against your cluster.'
          },
          {
            text: 'Configuring Mail Relays',
            link: '/guides/administration/configuring_mail_relays',
            isFeature: true,
            description: 'Declare a relay, scope it to realms, wire up its credential, and verify it.'
          },
          {
            text: 'Load Regulation and Rate Limiting',
            link: '/guides/administration/load_regulation_and_rate_limiting',
            isFeature: true,
            description: 'How Bondy protects itself from overload and from abuse, and what a client sees when either engages.'
          },
          {
            text: 'Simplifying realm management using prototypes',
            link: '/guides/administration/simplifying_realm_management_using_prototypes',
            isFeature: true
          },
          {
            text: 'Raising Open File Limits',
            link: '/guides/administration/raising_open_file_limits',
            isFeature: true,
            description: 'Raise the OS and Docker open-file limit so Bondy never runs out of file handles.'
          }
        ]
      },
      {
        text: 'Security',
        collapsible:true,
        items: [
          // { text: 'TLS configuration', link: '/guides/security/tls_configuration'},
          { text: 'Configuring CORS & HTTP Security Headers', link: '/guides/security/configuring_cors'}
        ]
      },
      {
        text: 'Deployment',
        collapsible: true,
        items: [
          { text: 'Running a cluster', link: '/guides/deployment/running_a_cluster'},
          {
            text: 'Upgrading to 1.0.0',
            link: '/guides/deployment/upgrading_to_1_0_0',
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
        text: 'Core Concepts',
        description: "What every Bondy developer needs to build their first client: the two communication patterns WAMP provides.",
        items: [
          {
            text: 'Communication Patterns',
            link: '/concepts/wamp/communication_patterns',
            isFeature: true,
            description: "The two patterns — RPC and Pub/Sub — that together cover request-response and event distribution."
          },
          {
            text: 'Routed RPC',
            link: '/concepts/wamp/rpc',
            isFeature: true,
            description: "The Caller/Callee request-response pattern: how a procedure is registered, called, and routed."
          },
          {
            text: 'Publish/Subscribe',
            link: '/concepts/wamp/pubsub',
            isFeature: true,
            description: "The Publisher/Subscriber event pattern: how topics, subscriptions, and publications work."
          }
        ]
      },
      {
        text: 'Realms & Security',
        description: "Once RPC and Pub/Sub are working, the next thing to understand: the domain your sessions attach to, and how they authenticate.",
        items: [
          {
            text: 'Realms',
            link: '/concepts/realms',
            isFeature: true,
            description: "Realms are authentication, authorization, routing and administrative domains that act as namespaces."
          },
          {
            text: 'Connections and Sessions',
            link: '/concepts/wamp/sessions',
            isFeature: true,
            description: "What a WAMP session is and how it relates to transports, realms, and authentication."
          },
          {
            text: 'Security',
            link: '/concepts/wamp/security',
            isFeature: true,
            description: "How Bondy authenticates and authorizes sessions within a realm."
          },
          {
            text: 'Same Sign-on',
            link: '/concepts/same_sign_on',
            isFeature: true,
            description: "Do you need to provide users access to multiple realms? Learn about same sign-on realms."
          },
          {
            text: 'Single Sign-on',
            link: '/concepts/single_sign_on',
            isFeature: true,
            description: "Learn how to enable Single Sign-on on multiple realms."
          },
          {
            text: 'OIDC Authentication',
            link: '/concepts/oidc_authentication',
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
            link: '/concepts/clustering',
            isFeature: true
          },
          {
            text: 'Registry Routing (RIB)',
            link: '/concepts/registry_routing',
            isFeature: true,
            description: "How Bondy scales cross-node call and event routing without replicating every registration to every node."
          },
          {
            text: 'Bondy Edge (Bridge Relay)',
            link: '/concepts/bridge_relay',
            isFeature: true,
            description: "Connect one Bondy node, as a client, to a remote router — sharing a subset of a realm without joining its cluster."
          },
          {
            text: 'Broker Bridge',
            link: '/concepts/broker_bridge',
            isFeature: true,
            description: "Re-publish WAMP events to Kafka, AWS SNS, Mailgun, or SendGrid."
          },
          {
            text: 'Mail',
            link: '/concepts/mail',
            isFeature: true,
            description: "Outbound email through operator-declared relays, kept off the routing path."
          },
          {
            text: 'HTTP Transports (Longpoll & SSE)',
            link: '/concepts/http_transports',
            isFeature: true,
            description: "Learn how to use HTTP long-polling and Server-Sent Events transports for WAMP sessions."
          },
          {
            text: 'HTTP API Gateway',
            link: '/concepts/api_gateway',
            isFeature: true,
            description: "Route incoming HTTP/REST requests to WAMP procedures or external APIs using declarative JSON specifications."
          },
          {
            text: 'HTTP Connector',
            link: '/concepts/http_connector',
            isFeature: true,
            description: "Bridge WAMP RPC calls to upstream HTTP/REST services with automatic auth, retries, and error mapping."
          },
          {
            text: 'Deletion and Reclamation',
            link: '/concepts/deletion_and_reclamation',
            isFeature: true,
            description: "How Bondy safely reclaims space for deleted replicated data."
          },
          {
            text: 'Per-Origin Prefix Closure',
            link: '/concepts/prefix_closure',
            isFeature: true,
            description: "How Bondy guarantees each node applies every origin's operations as an unbroken prefix, and repairs truncated history on rejoin."
          },
        ]
      },
      {
        text: 'Advanced WAMP Protocol',
        description: "Protocol-level mechanics for once the basics are second nature.",
        items: [
          {
            text: 'Naming Best Practices',
            link: '/concepts/wamp/naming',
            isFeature: true
          },
          {
            text: 'Advanced RPC',
            link: '/concepts/wamp/advanced/rpc',
            isFeature: true
          },
          {
            text: 'Advanced Publish/Subscribe',
            link: '/concepts/wamp/advanced/pubsub',
            isFeature: true
          },
          {
            text: 'WAMP Compliance',
            link: '/concepts/wamp/compliance',
            isFeature: true
          }
        ]
      },
      {
        text: 'Background',
        description: "Optional reading: the reasoning and terminology behind Bondy and WAMP. Not required to build your first client.",
        items: [
          {
            text: 'Why Bondy',
            link: '/concepts/why_bondy' ,
            isFeature: true,
            description: "Learn about the need for a unified application networking platform for distributed application development."
          },
          {
            text: 'What is Bondy',
            link: '/concepts/what_is_bondy',
            isFeature: true,
            description: "A high-level description of Bondy, its key features and the key benefits it delivers."
          },
          {
            text: 'What is an Application Network',
            link: '/concepts/application_networks',
            isFeature: true,
            description: "Learn about application networks, their characteristics and benefits, and how Bondy is implementing them. "
          },
          {
            text: 'What is WAMP',
            link: '/concepts/what_is_wamp' ,
            isFeature: true,
            description: "Find out more about the Web Application Messaging Protocol. "
          },
          {
            text: 'Introduction to WAMP',
            link: '/concepts/wamp/introduction',
            isFeature: true,
            description:'Learn the WAMP basics including how to establish a session and use RPC and Publish/Subscribe.'
          },
          {
            text: 'How does Bondy work',
            link: '/concepts/how_does_bondy_work' ,
            isFeature: true,
            description: "A high-level description that explains how Bondy works."
          },
          {
            text: 'How is Bondy different',
            link: '/concepts/how_is_bondy_different',
            isFeature: true,
            description: "Learn about Bondy's unique set of features and how it compares to alternative solutions."
          },
          {
            text: 'Features',
            link: '/concepts/features',
            isFeature: true,
            description: "Dive into a more detail description of Bondy's features."
          },
          {
            text: 'Architecture',
            link: '/concepts/architecture',
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
            link: '/reference/configuration/index',
            isFeature: false
          },
          {
            text: 'Configuration basics',
            description: 'Learn about the Bondy runtime configuration, the Bondy configuration file, its syntax, variable replacement and the required OS-specific configuration.',
            link: '/reference/configuration/basics',
            isFeature: true
          },
          {
            text: 'Quickstart Configuration',
            description: 'The minimal configuration you must do for a quick start.',
            link: '/reference/configuration/quickstart',
            isFeature: true
          }
        ]
      },
      {
        text: 'Router Configuration',
        items: [
          {
            text: 'Node',
            description: 'Configure the nodename, platform paths and Erlang VM parameters',
            link: '/reference/configuration/node',
            isFeature: true
          },
          {
            text: 'Startup/Shutdown',
            description: 'Configure options controlling serveral aspects of what happens during startup and shutdown',
            link: '/reference/configuration/startup_shutdown',
            isFeature: true
          },
          {
            text: 'Network Listeners',
            description: 'Configure the network listeners for the different protocols and gateways',
            link: '/reference/configuration/listeners',
            isFeature: true
          },
          {
            text: 'HTTP Security Headers',
            description: 'Configure CORS, HSTS, X-Frame-Options, CSP, and other HTTP security response headers per listener',
            link: '/reference/configuration/http_security_headers',
            isFeature: true
          },
          {
            text: 'Security',
            link: '/reference/configuration/security',
            isFeature: true
          },
          {
            text: 'Overload Protection',
            link: '/reference/configuration/overload_protection',
            isFeature: true
          },
          {
            text: 'Cluster',
            link: '/reference/configuration/cluster',
            isFeature: true
          },
          {
            text: 'Data Storage & Active Anti-entropy',
            link: '/reference/configuration/data_storage',
            isFeature: true,
            description: 'Sharding, placement, pack-store durability, and anti-entropy sync for the db.* configuration surface.'
          },
          {
            text: 'Reclamation',
            link: '/reference/configuration/reclamation',
            isFeature: true,
            description: 'Configure deletion reclamation and origin retirement for the storage layer.'
          },
          {
            text: 'Bridge Relay (Edge)',
            link: '/reference/configuration/bridge_relay',
            isFeature: true
          },
          {
            text: 'HTTP Connector',
            description: 'Configure WAMP-to-HTTP service bridges with authentication, connection pools, and secret management.',
            link: '/reference/configuration/http_connector',
            isFeature: true
          },
          {
            text: 'Mail',
            description: 'Declare SMTP relays: endpoint, TLS, credentials, which realms may send and as whom.',
            link: '/reference/configuration/mail',
            isFeature: true
          },
          {
            text: 'Certificate Manager',
            description: 'Configure the CA trust store, server certificate rotation, and mTLS settings.',
            link: '/reference/configuration/cert_manager',
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
            link: '/reference/configuration/wamp',
            isFeature: true
          }
        ]
      },
      {
        text: 'Broker Bridge',
        items: [
          {
            text: 'General',
            link: '/reference/configuration/broker_bridge',
            isFeature: true
          },
          {
            text: 'Kafka Bridge',
            link: '/reference/configuration/kafka_bridge',
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
            link: '/reference/wamp_api/index',
            isFeature: false
          },
          { text: 'Realm',
            link: '/reference/wamp_api/realm',
            isFeature: true,
            description:"Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status."
          },
          { text: 'User',
            link: '/reference/wamp_api/user',
            isFeature: true,
            description:"Creating, retrieving and managing users within a realm."
          },
          { text: 'Group',
            link: '/reference/wamp_api/group',
            isFeature: true,
            description:"Creating, retrieving and managing groups within a realm."
          },
          { text: 'Source',
            link: '/reference/wamp_api/source',
            isFeature: true,
            description:"Creating, retrieving and managing authentication methods and available sources within a realm."
          },
          { text: 'Grant',
            link: '/reference/wamp_api/grant',
            isFeature: true
          },
          { text: 'RBAC',
            link: '/reference/wamp_api/rbac',
            isFeature: true,
            description: "Check whether an identity holds a given permission on a resource."
          },
          { text: 'Session',
            link: '/reference/wamp_api/session',
            isFeature: true
          },
          { text: 'Registration',
            link: '/reference/wamp_api/registration',
            isFeature: true,
            description: "Introspecting RPC registrations: paginated and WAMP Meta API listing, matching, and callee lookup."
          },
          { text: 'Subscription',
            link: '/reference/wamp_api/subscription',
            isFeature: true,
            description: "Introspecting Pub/Sub subscriptions: paginated and WAMP Meta API listing, matching, and subscriber lookup."
          },
          { text: 'Mail',
            link: '/reference/wamp_api/mail',
            isFeature: true,
            description: "Sending email: send, send_async, status, relay listing and a relay test."
          },
          { text: 'Ticket',
            link: '/reference/wamp_api/ticket',
            isFeature: true,
            description: "Issuing and revoking tickets."
          },
          { text: 'OAuth2 Administration',
            link: '/reference/wamp_api/oauth2',
            isFeature: true,
            description: "Manage API client and resource owner identities, and revoke refresh tokens administratively."
          },
          { text: 'OAuth2 Token',
            link: '/reference/wamp_api/oauth2_token',
            isFeature: true
          },
          { text: 'Cluster',
            link: '/reference/wamp_api/cluster',
            isFeature: true
          },
          { text: 'Bridge Relay (Edge)',
            link: '/reference/wamp_api/bridge_relay',
            isFeature: true,
            description: "Creating, retrieving and managing Bridge Relay (Edge) connections."
          },
          { text: 'HTTP API Gateway',
            link: '/reference/wamp_api/api_gateway',
            isFeature: true,
            description: "Load and manage API Gateway specifications."
          },
          { text: 'Certificate Manager',
            link: '/reference/wamp_api/cert_manager',
            isFeature: true,
            description: "Live TLS certificate rotation, CA trust store management, and mTLS configuration."
          },
          { text: 'Export & Backup',
            link: '/reference/wamp_api/export',
            isFeature: true,
            description: "Exporting and importing Bondy's durable data (security, tokens, tickets, bridges, retained messages)."
          },
          { text: 'Error URIs',
            link: '/reference/wamp_api/errors/index',
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
            link: '/reference/index',
            isFeature: false
          },

          {
            text: 'Realm',
            link: '/reference/http_api/realm',
            isFeature: true,
            description:"Creating, retrieving and managing realms and also enabling, disabling and checking per realm security status."
          },
          {
            text: 'HTTP API Gateway',
            link: '/reference/http_api/api_gateway',
            isFeature: true,
            description: "Bondy API Gateway is a reverse proxy that lets you manage, configure, and route requests to your WAMP APIs and also to external HTTP/REST APIs."
          },
          {
            text: 'OIDC',
            link: '/reference/http_api/oidc',
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
            link: '/reference/api_gateway/index',
            isFeature: false
          },
          {
            text: 'API Gateway Specification',
            link: '/reference/api_gateway/specification',
            isFeature: true,
            description: "An API Gateway specification is a document that tells Bondy how to route incoming HTTP requests to your WAMP APIs or to external HTTP/REST APIs."
          },
          {
            text: 'API Gateway Expressions',
            link: '/reference/api_gateway/expressions',
            isFeature: true,
            description: "Bondy API Specification use a logic-less domain-specific language for data transformation and dynamic configuration."
          }

        ]
      }
  ]
}
