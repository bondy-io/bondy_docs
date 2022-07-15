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
          text: 'Tutorials',
          link: '/tutorials/index',
          activeMatch: '/tutorials/'
        },
        {
          text: 'Guides',
          link: '/guides/index',
          activeMatch: '/guides/'
        },
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/index.md', activeMatch: '/reference/'  },
            { text: 'WAMP API Reference', link: '/reference/wamp_api/index' },
            { text: 'HTTP API Reference', link: '/reference/http_api/index' },
            { text: 'Glossary', link: '/reference/glossary' },
          ]
        },
        {
          text: 'Concepts',
          link: '/concepts/index',
          activeMatch: '/guides/'
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
          text: 'Concepts',
          items: [
            { text: 'What is Bondy', link: '/concepts/what_is_bondy' },
            { text: 'WAMP', link: '/concepts/what_is_wamp' },
            { text: 'Same Sign-on', link: ' j' },
            { text: 'Single Sign-on', link: '/concepts/single_sign_on' },
          ]
        }
    ]
  }

  // Reference Section

  function wampAPISidebar() {
    return [
        {
          text: 'WAMP API Reference',
          items: [
            { text: 'Introduction', link: '/reference/wamp_api/index' },
            { text: 'Realm', link: '/reference/wamp_api/realm' },
            { text: 'Session', link: '/reference/wamp_api/session' },
            { text: 'User', link: '/reference/wamp_api/user' },
            { text: 'Source', link: '/reference/wamp_api/source' },
            { text: 'Group', link: '/reference/wamp_api/group' },
            { text: 'Grant', link: '/reference/wamp_api/grant' },
            { text: 'Ticket', link: '/reference/wamp_api/ticket' },
            { text: 'OAuth2 Token', link: '/reference/wamp_api/oauth2_token' },
            { text: 'Cluster', link: '/reference/wamp_api/cluster' },
            { text: 'Errors', link: '/reference/wamp_api/errors/index' },
            { text: 'Edge', link: '/reference/wamp_api/edge' }
          ]
        }
    ]
  }

  function httpAPISidebar() {
    return [
        {
          text: 'HTTP API Reference',
          items: [
            { text: 'Introduction', link: '/reference/index' },


          ]
        }
    ]
  }