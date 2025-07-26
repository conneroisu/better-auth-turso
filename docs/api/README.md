# API Reference

This section provides comprehensive API documentation for VuePress, including CLI commands, Node.js API, plugin development, and theme creation.

## Overview

VuePress provides multiple APIs for different use cases:

- **[CLI API](./cli.html)** - Command-line interface for development and building
- **[Node.js API](./node.html)** - Programmatic API for custom integrations
- **[Plugin API](./plugin.html)** - Create custom plugins to extend functionality
- **[Theme API](./theme.html)** - Develop custom themes with Vue.js

## Quick Reference

### CLI Commands

```bash
# Development
vuepress dev [targetDir]

# Build for production
vuepress build [targetDir]

# Eject default theme
vuepress eject [targetDir]

# Show environment info
vuepress info
```

### Configuration

```js
// .vuepress/config.js
module.exports = {
  title: 'Site Title',
  description: 'Site Description',
  
  // Theme configuration
  themeConfig: {
    nav: [...],
    sidebar: {...}
  },
  
  // Plugins
  plugins: [
    ['plugin-name', options]
  ]
}
```

### Plugin Structure

```js
// Basic plugin
module.exports = {
  name: 'my-plugin',
  plugins: [
    // Dependencies
  ],
  enhance(app) {
    // App enhancement
  }
}
```

## Global Computed Properties

VuePress provides several global computed properties available in all components:

### $site

Contains site-level metadata:

```js
{
  title: 'Site Title',
  description: 'Site Description',
  base: '/',
  pages: [...] // All pages
}
```

### $page

Contains current page metadata:

```js
{
  path: '/current/page.html',
  title: 'Page Title',
  frontmatter: {...},
  headers: [...] // Extracted headers
}
```

### $frontmatter

Current page's frontmatter:

```js
{
  title: 'Page Title',
  description: 'Page Description',
  // Custom frontmatter fields
}
```

### $localeConfig

Current locale configuration:

```js
{
  lang: 'en-US',
  title: 'Site Title',
  description: 'Site Description'
}
```

## Global Components

VuePress provides built-in global components:

### `<Content/>`

Renders the current page's markdown content:

```vue
<template>
  <div class="page">
    <Content/>
  </div>
</template>
```

### `<Content slot-key="slotName"/>`

Renders content from named slots:

```vue
<template>
  <div>
    <Content slot-key="header"/>
    <Content/>
    <Content slot-key="footer"/>
  </div>
</template>
```

### `<Badge/>`

Displays informational badges:

```vue
<Badge text="beta" type="warn"/>
<Badge text="v1.0.0+"/>
```

### `<CodeGroup>` and `<CodeBlock>`

Groups related code examples:

```vue
<CodeGroup>
  <CodeBlock title="YARN">
  ```bash
  yarn add vuepress
  ```
  </CodeBlock>
  
  <CodeBlock title="NPM">
  ```bash
  npm install vuepress
  ```
  </CodeBlock>
</CodeGroup>
```

## Lifecycle Hooks

### Plugin Lifecycle

```js
module.exports = {
  // Plugin ready
  ready() {
    // Plugin initialization
  },
  
  // Generate before
  async generated() {
    // Before static generation
  }
}
```

### App Enhancement

```js
// .vuepress/enhanceApp.js
export default ({
  Vue,      // Vue constructor
  options,  // Root instance options
  router,   // VueRouter instance
  siteData  // Site metadata
}) => {
  // App-level enhancements
}
```

## Markdown Extensions API

### Custom Containers

```js
// Plugin to add custom container
md.use(require('markdown-it-container'), 'containerName', {
  render(tokens, idx) {
    // Custom rendering logic
  }
})
```

### Custom Markdown Rules

```js
// Extend markdown-it
extendMarkdown: md => {
  md.use(customPlugin)
  md.renderer.rules.custom_rule = customRenderer
}
```

## Theme Development API

### Layout Components

```vue
<!-- .vuepress/theme/layouts/Layout.vue -->
<template>
  <div class="theme-container">
    <Navbar/>
    <Sidebar/>
    <Content/>
  </div>
</template>
```

### Theme Inheritance

```js
// .vuepress/theme/index.js
module.exports = {
  extend: '@vuepress/theme-default',
  // Override specific components
}
```

## Plugin Development Patterns

### Option Processing

```js
module.exports = (options = {}, context) => {
  const {
    // Extract options
    someOption = 'default'
  } = options
  
  return {
    name: 'my-plugin',
    // Plugin implementation
  }
}
```

### Async Plugin

```js
module.exports = async (options, context) => {
  // Async initialization
  const data = await fetchSomeData()
  
  return {
    name: 'async-plugin',
    async ready() {
      // Async ready hook
    }
  }
}
```

## Build Process API

### Webpack Configuration

```js
// .vuepress/config.js
module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../')
      }
    }
  },
  
  chainWebpack: config => {
    config.module
      .rule('custom')
      .test(/\.custom$/)
      .use('custom-loader')
      .loader('custom-loader')
  }
}
```

### Static Generation

```js
// Generate additional pages
module.exports = {
  async additionalPages() {
    return [
      {
        path: '/dynamic-page/',
        content: '# Dynamic Content'
      }
    ]
  }
}
```

## Error Handling

### Development Errors

```js
// Custom error handling
module.exports = {
  enhanceDevServer(app) {
    app.use('/api', (req, res, next) => {
      try {
        // Handle request
      } catch (error) {
        next(error)
      }
    })
  }
}
```

### Build Errors

```js
// Handle build failures
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
```

## Performance Optimization

### Code Splitting

```js
// Dynamic imports for code splitting
export default {
  async mounted() {
    const { heavyLibrary } = await import('./heavy-library')
    this.lib = heavyLibrary
  }
}
```

### Lazy Loading

```js
// Lazy load components
const LazyComponent = () => import('./LazyComponent.vue')

export default {
  components: {
    LazyComponent
  }
}
```

## Testing APIs

### Unit Testing

```js
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  test('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Expected content')
  })
})
```

### E2E Testing

```js
// Cypress example
describe('VuePress Site', () => {
  it('navigates correctly', () => {
    cy.visit('/')
    cy.contains('Get Started').click()
    cy.url().should('include', '/guide/')
  })
})
```

## Best Practices

### Plugin Development

1. **Use TypeScript** for better development experience
2. **Provide clear options** with defaults and validation
3. **Handle errors gracefully** with meaningful messages
4. **Document thoroughly** with examples and use cases
5. **Test across environments** (dev, build, SSR)

### Theme Development

1. **Extend existing themes** when possible
2. **Maintain accessibility** standards
3. **Ensure responsive design** for all devices
4. **Optimize performance** with lazy loading
5. **Follow Vue.js best practices** for components

### Configuration

1. **Keep it simple** - start with basics
2. **Use environment-specific configs** for different environments
3. **Validate configuration** to catch errors early
4. **Document custom options** for team members
5. **Version control configs** but not sensitive data

## Migration Guides

### From 0.x to 1.x

Major changes in VuePress 1.x:

- Plugin system overhaul
- Theme development changes
- Configuration updates
- Markdown processing improvements

### Plugin Migration

```js
// 0.x style
module.exports = {
  serviceWorker: true
}

// 1.x style
module.exports = {
  plugins: ['@vuepress/pwa']
}
```

This API reference provides the foundation for extending VuePress with custom functionality. Explore the detailed sections for specific implementation guidance.