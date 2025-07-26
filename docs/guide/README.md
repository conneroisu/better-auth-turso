# Guide

Welcome to the comprehensive VuePress guide! This section will walk you through all the essential concepts and features you need to master VuePress.

## What is VuePress?

VuePress is a Vue-powered static site generator that's specifically designed for creating documentation websites. It was created by Evan You, the creator of Vue.js, to solve the problem of creating fast, SEO-friendly documentation sites with a great developer experience.

### Key Benefits

- **📝 Markdown-first**: Write content in Markdown with enhanced features
- **⚡ Fast**: Pre-rendered static HTML with SPA navigation
- **🎨 Customizable**: Extensible with themes and plugins
- **📱 Mobile-friendly**: Responsive design out of the box
- **🔍 SEO-optimized**: Server-side rendering for better search rankings

## Core Concepts

### 1. Site Structure

VuePress follows a simple directory structure:

```
docs/
├── .vuepress/
│   ├── config.js          # Site configuration
│   ├── components/        # Global Vue components
│   ├── theme/            # Custom theme files
│   ├── public/           # Static assets
│   └── styles/           # Custom styles
├── guide/                # Guide section
├── api/                  # API documentation
└── README.md             # Homepage
```

### 2. Configuration

The `.vuepress/config.js` file is the heart of your VuePress site:

```js
module.exports = {
  title: 'My Site',
  description: 'A VuePress site',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' }
    ],
    sidebar: {
      '/guide/': [
        '',
        'getting-started',
        'configuration'
      ]
    }
  }
}
```

### 3. Markdown Extensions

VuePress extends standard Markdown with powerful features:

#### Code Blocks with Syntax Highlighting

```js{2,4-6}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

#### Custom Containers

::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a dangerous warning
:::

::: details Click me to view the code
```js
console.log('Hello, VuePress!')
```
:::

#### Table of Contents

Use `[[toc]]` to generate a table of contents:

[[toc]]

### 4. Vue Components in Markdown

You can use Vue components directly in your Markdown files:

<FeatureCard
  title="Vue Integration"
  description="Seamlessly integrate Vue components in your documentation"
  icon="⚡"
  :featured="true"
>
This card is a custom Vue component embedded in Markdown!
</FeatureCard>

### 5. Asset Handling

VuePress automatically processes and optimizes your assets:

#### Images
- **Relative paths**: `./image.png` (relative to current file)
- **Absolute paths**: `/image.png` (relative to `.vuepress/public`)
- **Webpack aliases**: `~@/assets/image.png`

#### CSS and Preprocessing
- Sass/SCSS support
- PostCSS processing
- CSS Modules
- Custom styling with `.vuepress/styles/`

## Getting Started Checklist

- [ ] Install VuePress: `npm install -D vuepress`
- [ ] Create basic directory structure
- [ ] Write your first `.vuepress/config.js`
- [ ] Create a `README.md` homepage
- [ ] Add navigation and sidebar
- [ ] Write your first guide page
- [ ] Add custom components (optional)
- [ ] Configure plugins (optional)
- [ ] Build and deploy

## Quick Tips

### 1. Development Workflow

```bash
# Start development server
npm run docs:dev

# Build for production
npm run docs:build

# Serve built site locally
npm run docs:serve
```

### 2. Hot Reloading

VuePress supports hot reloading for:
- Markdown content
- Vue components
- Configuration changes (requires restart)
- Styles

### 3. Performance Best Practices

- Optimize images before adding them
- Use lazy loading for heavy components
- Minimize plugin usage
- Enable PWA features for better caching

### 4. SEO Optimization

```js
// .vuepress/config.js
module.exports = {
  head: [
    ['meta', { name: 'og:title', content: 'My Site' }],
    ['meta', { name: 'og:description', content: 'Site description' }],
    ['meta', { name: 'og:image', content: '/og-image.png' }]
  ]
}
```

## What's Next?

Now that you understand the basics, explore these sections:

1. **[Getting Started](./getting-started.html)** - Set up your first VuePress site
2. **[Configuration](./configuration.html)** - Deep dive into configuration options
3. **[Markdown](./markdown.html)** - Master VuePress Markdown features
4. **[Using Vue](./using-vue.html)** - Integrate Vue components effectively

<CodeDemo />

Ready to dive deeper? Let's get started with your first VuePress site!