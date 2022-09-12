// import MermaidPlugin from "vitepress-plugin-mermaid";

export default {
    // These are app level configs.
    lang: 'en-GB',
    title: 'Bondy Docs',
    titleTemplate: false,
    // This will render as a <meta> tag in the page HTML.
    description: 'Bondy Documentation',
    appearance: true,
    lastUpdated: true,

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
          md.use(require('markdown-it-footnote'))
          md.use(require('markdown-it-task-lists'))
          md.use(require('markdown-it-katex'))
          md.use(require('markdown-it-custom-block'), {
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
              return `<div class="custom-block uri ${className}"><a name="${uri}"></a><span class="custom-block uri ${className}">${badge}</span><p class="custom-block-title">${uri}</p></div>`;
            },
            config (str) {
              let args = str.replace(/\s+/g, '').split(",");
              let param = args.shift();
              var datatype = 'string';
              var defaultValue;
              var since = '';
              if (args.length == 0) {
                datatype = 'string';
              } else {
                datatype = args.shift();
                defaultValue = args.shift();
                defaultValue = defaultValue ? defaultValue : 'N/A';
                since = args.shift();
                since = since ? since : 'N/A';
              };
              return `
              <h3 id="${param}" tabindex="-1"><span class="custom-block config-param"><span><span class="custom-block-title"><a class="header-anchor" href="#${param}" aria-hidden="true">#</a>${param}</span><span class="meta">&nbsp;::&nbsp;${datatype}</span></span></span><div class="since-version"><span class="meta">Default = ${defaultValue}</span><span>Since&nbsp;${since}</span></div></h3>`;
            }
          })
        }
    },

    themeConfig: {
        siteTitle: false,
        logo: '/assets/logo.png',
        heroImage: '/assets/hero_white_s.png',
        // Search
        algolia: {
            appId: '66TO7T25GX',
            apiKey: '4d01178fd6ad6018c75914e31db9bae4',
            indexName: 'bondy_docs'
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/bondy-io'},
            { icon: 'twitter', link: 'https://twitter.com/bondyIO' },
            // { icon: 'discord', link: '...' }
        ],

        // The footer will displayed only when the page doesn't contain sidebar due to design reason.
        footer: {
            message: 'Released under  material licensed under the CC-BY-SA 4.0, provided as-is without any warranties. Bondy and Leapsight are registered trademarks.',
            copyright: 'Copyright © 2022 Leapsight'
        },

        editLink: {
            pattern: 'https://github.com/bondy-io/bondy_docs/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },

        nav: nav(),

        sidebar: sidebars()
    }
  }

  // Top navigation

  function nav() {
      return [
        {
          text: 'Get Started',
          link: '/tutorials/index',
          activeMatch: '/tutorials/'
        },
        {
          text: 'How-to Guides',
          link: '/guides/index',
          activeMatch: '/guides/'
        },
        {
          text: 'Concepts',
          link: '/concepts/index',
          activeMatch: '/guides/'
        },
        {
          text: 'Reference',
          items: [
            { text: 'Configuration', link: '/reference/configuration/index' },
            { text: 'WAMP API Reference', link: '/reference/wamp_api/index' },
            { text: 'HTTP API Reference', link: '/reference/http_api/index' },
            { text: 'Glossary', link: '/reference/glossary' },
          ]
        },
        {
          text: 'More',
          items: [
            { text: 'Community', link: '/community/index.md', activeMatch: '/community/'  },
            { text: 'The Team', link: 'https://bondy.io/team' },
            { text: 'Commercial Support', link: 'https://bondy.io/commercial_support' }
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
      '/concepts/': conceptsSidebar(),
    }
  }

  // Turorials Section

  function tutorialsSidebar() {
    return [
        {
          text: 'Tutorials',
          items: [

          ]
        }
    ]
  }


  // Guides Section

  function guidesSidebar() {
    return [
        {
          text: 'Getting Started',
          collapsible: true,
          items: [
            { text: 'Get Bondy', link: '/guides/getting_started/get_bondy' },
            { text: 'Getting Started', link: '/guides/getting_started/index'}
          ]
        },
        {
          text: 'Programming',
          collapsible: true,
          items: [
            { text: 'General', link: '/guides/programming/general'},
            { text: 'Remote Procedure Calls', link: '/guides/programming/rpc'},
            { text: 'Publish and Subscribe', link: '/guides/programming/pub_sub'}
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
            { text: 'Simplifying realm management using prototypes', link: '/guides/administration/simplifying_realm_management_using_prototypes'}
          ]
        },
        {
          text: 'Security',
          collapsible:true,
          items: [
            { text: 'TLS configuration', link: '/guides/security/tls_configuration'}
          ]
        },
        {
          text: 'Deployment',
          collapsible: true,
          items: [
            { text: 'Running a cluster', link: '/guides/deployment/running_a_cluster'}
          ]
        }
    ]
  }

  // Concepts Section
  function conceptsSidebar() {
    return [

        {
          text: 'Introduction',
          items: [
            { text: 'What is Bondy', link: '/concepts/what_is_bondy' },
            { text: 'How is Bondy different', link: '/concepts/how_is_bondy_different' },
            { text: 'Architecture', link: '/concepts/architecture' }

          ]
        },
        {
          text: 'Multi-tenant Security',
          items: [
            { text: 'Overview', link: '/concepts/index' },
            { text: 'Realms', link: '/concepts/realm' },
            { text: 'Identity', link: '/concepts/identity' },
            { text: 'Authentication', link: '/concepts/authentication' },
            { text: 'Authorization', link: '/concepts/authorization' },
            { text: 'Same Sign-on', link: '/concepts/same_sign_on' },
            { text: 'Single Sign-on', link: '/concepts/single_sign_on' },
          ]
        },
        {
          text: 'Clustering',
          items: [
            { text: 'Overview', link: '/concepts/index' },
            { text: 'Data Replication', link: '/concepts/data_replication' },
          ]
        },
        {
          text: 'WAMP',
          items: [
            { text: 'Introduction to WAMP', link: '/concepts/wamp/introduction' },
            { text: 'Getting started with WAMP', link: '/concepts/wamp/getting_started' },
            { text: 'Communication Patterns', link: '/concepts/wamp/communication_patterns' },
            { text: 'Under the Hood', link: '/concepts/wamp/under_the_hood' },
            { text: 'Beyond the Basics', link: '/concepts/wamp/beyond_the_basics' },
            { text: 'Security', link: '/concepts/wamp/security' },
          ]
        },
        {
          text: 'HTTP Gateway',
          items: []
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
              link: '/reference/configuration/index.md',
              isFeature: true
            },
            {
              text: 'Configuration basics',
              link: '/reference/configuration/basics.md',
              isFeature: true
            }
          ]
        },
        {
          text: 'Reference by Topic',
          items: [
            {
              text: 'Startup/Shutdown',
              link: '/reference/configuration/startup_shutdown.md',
              isFeature: true
            },
            {
              text: 'Cluster',
              link: '/reference/configuration/cluster.md',
              isFeature: true
            },
            {
              text: 'HTTP/Websocket Listener',
              link: '/reference/configuration/http_listener.md',
              isFeature: true
            },
            {
              text: 'Bridge Relay (Edge)',
              link: '/reference/configuration/bridge_relay.md',
              isFeature: true
            }
          ]
        },

        {
          text: 'Protocols',
          items: [
            {
              text: 'WAMP',
              link: '/reference/configuration/wamp.md',
              isFeature: true
            },
            {
              text: 'HTTP Gateway',
              link: '/reference/configuration/http_gateway.md',
              isFeature: true
            }
          ]
        },
        {
          text: 'Broker Bridge',
          items: [
            {
              text: 'Configuration',
              link: '/reference/configuration/broker_bridge.md',
              isFeature: true
            },
            {
              text: 'Kafka Bridge',
              link: '/reference/configuration/kafka_bridge.md',
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
            { text: 'Session',
              link: '/reference/wamp_api/session',
              isFeature: true
            },
            { text: 'Ticket',
              link: '/reference/wamp_api/ticket',
              isFeature: true
            },
            { text: 'OAuth2 Token',
              link: '/reference/wamp_api/oauth2_token',
              isFeature: true
            },
            { text: 'Cluster',
              link: '/reference/wamp_api/cluster',
              isFeature: true
            },
            { text: 'Bridge Relay',
              link: '/reference/wamp_api/bridge_relay',
              isFeature: true,
              description: "Creating, retrieving and managing Bridge Relay (Edge) connections."
            },
            { text: 'Errors',
              link: '/reference/wamp_api/errors/index',
              isFeature: false
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
            }
          ]
        }
    ]
  }