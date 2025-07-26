module.exports = {
  // Basic site metadata
  title: "VuePress Feature Showcase",
  description:
    "A comprehensive demonstration of all VuePress features and capabilities",
  base: "/",

  // Head tags for SEO and PWA
  head: [
    ["link", { rel: "icon", href: "/logo.svg", type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
    ["meta", { property: "og:title", content: "VuePress Feature Showcase" }],
    [
      "meta",
      {
        property: "og:description",
        content: "A comprehensive demonstration of all VuePress features",
      },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      {
        name: "viewport",
        content: "width=device-width,initial-scale=1,user-scalable=no",
      },
    ],
  ],

  // Theme configuration
  themeConfig: {
    // Logo
    logo: "/logo.svg",

    // Navigation
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      {
        text: "Features",
        ariaLabel: "Features Menu",
        items: [
          { text: "Markdown", link: "/features/markdown/" },
          { text: "Vue Components", link: "/features/vue-components/" },
          { text: "Plugins", link: "/features/plugins/" },
          { text: "Themes", link: "/features/themes/" },
          { text: "Build & Deploy", link: "/features/build-deploy/" },
        ],
      },
      {
        text: "Examples",
        items: [
          { text: "Basic Examples", link: "/examples/basic/" },
          { text: "Advanced Examples", link: "/examples/advanced/" },
          { text: "Custom Components", link: "/examples/components/" },
        ],
      },
      { text: "API Reference", link: "/api/" },
      { text: "GitHub", link: "https://github.com/vuejs/vuepress" },
    ],

    // Sidebar
    sidebar: {
      "/guide/": ["", "getting-started"],
      "/features/": [
        {
          title: "Core Features",
          collapsable: false,
          children: ["", "markdown/"],
        },
      ],
      "/examples/": [""],
      "/api/": [""],
      "/": ["", "guide/", "features/", "examples/", "api/"],
    },

    // GitHub repository
    repo: "vuejs/vuepress",
    repoLabel: "GitHub",
    editLinks: true,
    editLinkText: "Edit this page on GitHub",

    // Last updated
    lastUpdated: "Last Updated",

    // Search settings
    search: true,
    searchMaxSuggestions: 10,
    searchPlaceholder: "Search...",

    // Smooth scrolling
    smoothScroll: true,

    // Display all headers or just h2
    displayAllHeaders: false,
    activeHeaderLinks: true,

    // Page navigation
    nextLinks: true,
    prevLinks: true,
  },

  // Markdown configuration
  markdown: {
    // Line numbers in code blocks
    lineNumbers: true,

    // Extract headers
    extractHeaders: ["h2", "h3", "h4"],

    // Anchor options
    anchor: {
      permalink: true,
      permalinkBefore: true,
      permalinkSymbol: "#",
    },

    // Table of contents
    toc: {
      includeLevel: [1, 2, 3, 4],
    },

    // External links
    externalLinks: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  },

  // Simple plugins configuration
  plugins: [
    // Back to top button
    "@vuepress/back-to-top",

    // Progress bar
    "@vuepress/nprogress",

    // Active header links
    "@vuepress/active-header-links",

    // Register components automatically
    [
      "@vuepress/register-components",
      {
        componentsDir: "components",
      },
    ],
  ],

  // Cache settings for development
  cache: false,

  // Extract CSS
  extractCSS: true,

  // Enable evergreen browsers
  evergreen: true,
};
