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
          text: 'General',
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
          text: 'Startup/Shutdown',
          items: [
            {
              text: 'Configuration',
              link: '/reference/configuration/startup_shutdown.md',
              isFeature: true
            }
          ]
        },
        {
          text: 'Clustering',
          items: [
            {
              text: 'Configuration',
              link: '/reference/configuration/cluster.md',
              isFeature: true
            }
          ]
        },
        {
          text: 'HTTP Gateway',
          items: [
            {
              text: 'Configuration',
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
            }
          ]
        },
        {
          text: 'Bondy Edge (Bridge Relay)',
          items: [
            {
              text: 'Configuration',
              link: '/reference/configuration/bridge_relay.md',
              isFeature: true
            }
          ]
        }
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