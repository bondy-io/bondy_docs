// import MermaidPlugin from "vitepress-plugin-mermaid";

export default {
    // Set to false for publishing
    ignoreDeadLinks: true,
    // These are app level configs.
    lang: 'en-GB',
    title: 'Bondy Docs',
    titleTemplate: false,
    head: [
      ['meta', { property: 'og:description', content: 'Bondy Documentation Website' }],
    ],
    // This will render as a <meta> tag in the page HTML.
    description: 'Bondy Documentation Website',
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
          md.use(require('markdown-it-container'), 'big-button', {
            validate: function(params) {
              return params.trim().match(/^big-button\s+(.*)$/);
            },

            render: function (tokens, idx) {
              var m = tokens[idx].info.trim().match(/^big-button\s+(.*)$/);

              if (tokens[idx].nesting === 1) {
                var href = m[1];
                var target = href.startsWith('http') ? '__blank' : '';
                // opening tag
                return '<div class="action"><a class="BondyButton big alt" href="' + href + '" target="' + target + '">';

              } else {
                // closing tag
                return '</a></div>\n';
              }
            }
          })
          md.use(require('markdown-it-container'), 'column', {
            validate: function(params) {
              return params.trim().match(/^column\s+(.*)$/);
            },

            render: function (tokens, idx) {
              var m = tokens[idx].info.trim().match(/^column\s+(.*)$/);

              if (tokens[idx].nesting === 1) {
                // opening tag
                return '<div class="column">'

              } else {
                // closing tag
                return '</div>\n';
              }
            }
          })
          md.use(require('markdown-it-container'), 'columns', {
            validate: function(params) {
              return params.trim().match(/^columns\s+(.*)$/);
            },

            render: function (tokens, idx) {
              var m = tokens[idx].info.trim().match(/^columns\s+(.*)$/);

              if (tokens[idx].nesting === 1) {
                // opening tag
                return '<div class="column-wrapper">'

              } else {
                // closing tag
                return '</div>\n';
              }
            }
          })
          // md.use(require('markdown-it-container'), 'tab', {
          //   validate: function(params) {
          //     return params.trim().match(/^tab\s+(.*)$/);
          //   },
          //   render: function(tokens, idx) {
          //     var tokens = tokens[idx].info.trim().match(/^tab\s+(.*)$/);
          //     var name  = md.utils.escapeHtml(tokens[1]);
          //     var content  = md.utils.escapeHtml(tokens[2]);
          //     return '<tab name="' + name + '">' + content + '</tab>\n';
          //   }
          // })
          // md.use(require('markdown-it-container'), 'tabs', {
          //   validate: function(params) {
          //     return params.trim().match(/^tabs\s+(.*)$/);
          //   },
          //   render: function(tokens, idx) {
          //     var tokens = tokens[idx].info.trim().match(/^tabs\s+(.*)$/);
          //     return '<tabs cache-lifetime="1000">' + md.utils.escapeHtml(tokens[1]) + '</tabs>\n';
          //   }
          // })
          md.use(require('markdown-it-custom-block'), {
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
              return `<div class="custom-block uri ${className}"><a name="${uri}"></a><span class="custom-block uri ${className}">${badge}</span><p class="custom-block-title">${uri}</p></div>`;
            },
            // CONFIG
            config (str) {
              console.log(str);
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
              <h3 id="${param}" tabindex="-1"><span class="custom-block config-param"><span><span class="custom-block-title"><a class="header-anchor" href="#${param}" aria-hidden="true">#</a>${param}</span><span class="meta">&nbsp;::&nbsp;${datatype}</span></span></span><div class="since-version"><span class="meta">Default = ${defaultValue}</span><span>Since&nbsp;${since}</span></div></h3>`;
            }
          })
        }
    },

    themeConfig: {
        siteTitle: false,
        logo: '/assets/logo.png',
        // logo: {
        //   light: '/assets/logo.png',
        //   dark: '/assets/logo.png',
        //   // light: {src:'/assets/logo.png', alt:"Bondy"},
        //   // dark: {src:'/assets/logo.png', alt:"Bondy"}
        // },

        // Search
        algolia: {
            appId: '66TO7T25GX',
            apiKey: '4d01178fd6ad6018c75914e31db9bae4',
            indexName: 'bondy_docs'
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/bondy-io'},
            { icon: 'twitter', link: 'https://twitter.com/bondyIO' },
            { icon: 'discord', link: 'https://discord.gg/Ux9EVst4' }
        ],

        // The footer will displayed only when the page doesn't contain sidebar
        // due to design reason.
        footer: {
            message: 'Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution-ShareAlike (CC-BY-SA) 4.0 International license. Bondy and Leapsight are registered trademarks.',
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
        // {
        //   text: 'Alt Home',
        //   link: 'alt_index',
        //   activeMatch: '/'
        // },

        {
          text: 'Concepts',
          link: '/concepts/index',
          activeMatch: '/concepts/'
        },
        {
          text: 'Tutorials',
          link: '/tutorials/index',
          activeMatch: '/tutorials/'
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
              text: 'FAQ',
              link: '/about/faq',
            },
            {
              text: 'Bondy Compared',
              link: '/concepts/how_is_bondy_different',
            },
            {
              text: 'Community',
              link: '/about/community',
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
            link: 'https://github.com/Leapsight/bondy',
            isFeature: false
          }
        ]
  }

  function tc() {
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
            link: 'https://github.com/Leapsight/bondy',
            isFeature: false
          }
        ]
  }

  // Tutorials Section

  function tutorialsSidebar() {
    return [
        {
          text: 'Getting Started',
          collapsible: true,
          items: [
            { text: 'Get Bondy', link: '/tutorials/getting_started/get_bondy' },
            { text: 'Getting Started', link: '/tutorials/getting_started/index'}
          ]
        },
        {
          text: 'Other Tutorials',
          items: [

          ]
        }
    ]
  }


  // Guides Section

  function guidesSidebar() {
    return [
        {
          text: 'Programming with WAMP',
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
            // { text: 'Simplifying realm management using prototypes', link: '/guides/administration/simplifying_realm_management_using_prototypes'}
          ]
        },
        {
          text: 'Security',
          collapsible:true,
          items: [
            // { text: 'TLS configuration', link: '/guides/security/tls_configuration'}
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
            {
              text: 'What is Bondy',
              link: '/concepts/what_is_bondy' ,
              isFeature: true
            },
            {
              text: 'Why Bondy',
              link: '/concepts/why_bondy' ,
              isFeature: true
            },
            {
              text: 'How is Bondy different',
              link: '/concepts/how_is_bondy_different',
              isFeature: true
            },
            {
              text: 'Features',
              link: '/concepts/features',
              isFeature: true
            },
            {
              text: 'Architecture',
              link: '/concepts/architecture',
              isFeature: true
            }
          ]
        },
        {
          text: 'Multi-tenant Security',
          items: [
            {
              text: 'Realms',
              link: '/concepts/realms',
              isFeature: true
            },
            {
              text: 'Identity Management',
              link: '/concepts/identity_management',
              isFeature: true
            },
            {
              text: 'Authentication',
              link: '/concepts/authentication',
              isFeature: true
            },
            {
              text: 'Authorization',
              link: '/concepts/authorization',
              isFeature: true
            },
            {
              text: 'Same Sign-on',
              link: '/concepts/same_sign_on',
              isFeature: true
            },
            {
              text: 'Single Sign-on',
              link: '/concepts/single_sign_on',
              isFeature: true
            },
          ]
        },
        {
          text: 'Clustering',
          items: [
            {
              text: 'Overview',
              link: '/concepts/clustering/index',
              isFeature: true },
            {
              text: 'Data Replication',
              link: '/concepts/clustering/data_replication',
              isFeature: true
            },
          ]
        },
        {
          text: 'WAMP',
          items: [
            {
              text: 'Introduction to WAMP',
              link: '/concepts/wamp/introduction',
              isFeature: true
            },
            {
              text: 'Getting started with WAMP',
              link: '/concepts/wamp/getting_started',
              isFeature: true
            },
            {
              text: 'Communication Patterns',
              link: '/concepts/wamp/communication_patterns',
              isFeature: true
            },
            {
              text: 'Under the Hood',
              link: '/concepts/wamp/under_the_hood',
              isFeature: true
            },
            {
              text: 'Beyond the Basics',
              link: '/concepts/wamp/beyond_the_basics',
              isFeature: true
            },
            {
              text: 'Security',
              link: '/concepts/wamp/security',
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
              text: 'Active Anti-entropy',
              link: '/reference/configuration/aae',
              isFeature: true
            },
            {
              text: 'Data Storage',
              link: '/reference/configuration/data_storage',
              isFeature: true
            },
            {
              text: 'Bridge Relay (Edge)',
              link: '/reference/configuration/bridge_relay',
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
            },
            {
              text: 'HTTP API Gateway',
              link: '/reference/configuration/http_api_gateway',
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
            }
          ]
        }
    ]
  }