---
home: true
heroImage: /logo.png
heroText: VuePress Feature Showcase
tagline: A comprehensive demonstration of all VuePress features and capabilities
actionText: Get Started →
actionLink: /guide/
features:
- title: 📝 Markdown Powered
  details: Write content in Markdown with VuePress extensions like containers, code highlighting, and custom components.
- title: ⚡ Vue-Powered
  details: Enjoy the dev experience of Vue + webpack, use Vue components in markdown, and develop custom themes with Vue.
- title: 🚀 Performant
  details: VuePress generates pre-rendered static HTML for each page, and runs as an SPA once a page is loaded.
- title: 🎨 Customizable
  details: Themes, plugins, and extensive configuration options make VuePress highly customizable for any use case.
- title: 📱 Mobile Optimized
  details: Progressive Web App features with service worker, manifest, and responsive design out of the box.
- title: 🔍 Search Enabled
  details: Built-in search functionality with customizable options and third-party search integration support.
footer: MIT Licensed | Copyright © 2018-present Evan You & VuePress Contributors
---

# Welcome to VuePress Feature Showcase

This documentation site demonstrates all the powerful features and capabilities of VuePress, the Vue-powered static site generator.

## What You'll Learn

- **Core Features**: Markdown extensions, Vue components, theming, and plugins
- **Advanced Configuration**: PWA setup, SEO optimization, build customization
- **Real Examples**: Practical implementations and code samples
- **Best Practices**: Performance optimization and deployment strategies

## Quick Start

```bash
# Install VuePress
npm install -D vuepress

# Create your first page
echo '# Hello VuePress!' > README.md

# Start writing
vuepress dev .

# Build for production
vuepress build .
```

## Feature Categories

### 📝 Content & Markdown
- **Enhanced Markdown**: Custom containers, syntax highlighting, line numbers
- **Code Examples**: Import code snippets, highlight specific lines
- **Math & Diagrams**: LaTeX math expressions and diagram support
- **Internationalization**: Multi-language support with locale switching

### ⚡ Vue Integration
- **Components**: Use Vue components directly in Markdown
- **Global Components**: Auto-registration and component discovery
- **Custom Layouts**: Build custom page layouts with Vue
- **App Enhancement**: Client-side app modifications and plugins

### 🎨 Theming & Design
- **Default Theme**: Comprehensive built-in theme with navigation
- **Custom Themes**: Create completely custom themes
- **Styling**: CSS preprocessing, custom styles, and design tokens
- **Responsive Design**: Mobile-first responsive layouts

### 🔧 Plugins & Extensions
- **Official Plugins**: PWA, search, analytics, and more
- **Community Plugins**: Third-party extensions and tools
- **Custom Plugins**: Build your own VuePress plugins
- **Plugin API**: Comprehensive plugin development guide

### 🚀 Build & Deploy
- **Static Generation**: Pre-rendered HTML for optimal performance
- **Asset Optimization**: Automatic asset processing and optimization
- **Deployment**: GitHub Pages, Netlify, Vercel, and more
- **CI/CD**: Automated deployment pipelines

## Interactive Examples

Try these interactive examples throughout the documentation:

<Badge text="beta" type="warn"/> <Badge text="0.10.1+"/>

::: tip
This is a tip container with **markdown** support!
:::

::: warning
This is a warning container
:::

::: danger
This is a dangerous warning container
:::

## Table of Contents

[[toc]]

## Code Example with Line Numbers

```js{2,4-6}
// This is highlighted
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

## Interactive Component Demos

### Basic Vue Integration
<CustomComponent :count="10" />

### Advanced Loading Animation
<AnimatedLoader />

### Feature Cards Layout
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 30px 0;">
  <FeatureCard 
    title="Vue Components" 
    description="Seamlessly integrate Vue.js components into your Markdown content"
    icon="⚡"
    :featured="true"
  />
  <FeatureCard 
    title="Markdown Extensions" 
    description="Enhanced markdown with custom containers, code highlighting, and more"
    icon="📝"
  />
  <FeatureCard 
    title="Static Generation" 
    description="Pre-rendered HTML for optimal performance and SEO"
    icon="🚀"
  />
</div>

## Performance Showcase

VuePress delivers exceptional performance through:

- **Static Site Generation**: Pre-rendered HTML for fast loading
- **Code Splitting**: Automatic route-based code splitting
- **Asset Optimization**: CSS/JS minification and compression
- **Progressive Web App**: Service worker and offline capabilities

## What's Next?

1. 📖 Read the [Guide](/guide/) to understand VuePress fundamentals
2. 🔍 Explore [Features](/features/) for detailed capability overview
3. 💡 Check out [Examples](/examples/) for practical implementations
4. 🚀 See [Advanced Examples](/examples/advanced.html) for sophisticated features
5. 📚 Reference the [API](/api/) for technical details

Start your VuePress journey today and build amazing documentation sites! 🚀