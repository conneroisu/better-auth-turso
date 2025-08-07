# 🔌 VuePress Plugins Showcase

VuePress has a rich ecosystem of plugins that extend functionality and enhance the development experience.

## Built-in Plugins

### Back to Top
The `@vuepress/back-to-top` plugin adds a smooth scrolling back-to-top button.

Try scrolling down this page and you'll see the back-to-top button appear in the bottom right corner!

### Progress Bar
The `@vuepress/nprogress` plugin shows a loading progress bar during page navigation.

Navigate between different pages to see the progress bar in action.

### Active Header Links
The `@vuepress/active-header-links` plugin automatically updates the URL hash when scrolling through sections.

### Component Registration
The `@vuepress/register-components` plugin automatically registers Vue components from a specified directory.

All our custom components (`CustomComponent`, `FeatureCard`, `CodeDemo`, `AdvancedDemo`, `AnimatedLoader`) are automatically registered through this plugin.

## Plugin Configuration Examples

### Basic Plugin Setup

```javascript
// .vuepress/config.js
module.exports = {
  plugins: [
    // Simple plugin activation
    '@vuepress/back-to-top',
    
    // Plugin with options
    ['@vuepress/nprogress', {
      // Custom progress bar color
      color: '#3eaf7c'
    }],
    
    // Component registration
    ['@vuepress/register-components', {
      componentsDir: 'components'
    }]
  ]
}
```

### Advanced Plugin Configuration

```javascript
// .vuepress/config.js
module.exports = {
  plugins: [
    // PWA Plugin
    ['@vuepress/pwa', {
      serviceWorker: true,
      updatePopup: {
        message: "New content is available.",
        buttonText: "Refresh"
      }
    }],
    
    // Search Plugin
    ['@vuepress/search', {
      searchMaxSuggestions: 10,
      test: ['/guide/', '/features/', '/examples/']
    }],
    
    // Google Analytics
    ['@vuepress/google-analytics', {
      'ga': 'UA-XXXXXXXX-X'
    }],
    
    // Medium Zoom for Images
    ['@vuepress/medium-zoom', {
      selector: '.content img',
      options: {
        margin: 16,
        background: 'rgba(0, 0, 0, 0.5)',
        scrollOffset: 0
      }
    }]
  ]
}
```

## Community Plugins

### Container Plugin

Create custom containers for different types of content:

::: theorem Newton's First Law
Every object in a state of uniform motion tends to remain in that state of motion unless an external force is applied to it.
:::

::: right
This text is aligned to the right
:::

```markdown
::: theorem Newton's First Law
Every object in a state of uniform motion tends to remain in that state of motion unless an external force is applied to it.
:::

::: right
This text is aligned to the right
:::
```

### Tabs Plugin

Create tabbed content for better organization:

:::: tabs

::: tab JavaScript
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`)
}

greet('VuePress')
```
:::

::: tab TypeScript
```typescript
function greet(name: string): void {
  console.log(`Hello, ${name}!`)
}

greet('VuePress')
```
:::

::: tab Python
```python
def greet(name):
    print(f"Hello, {name}!")

greet('VuePress')
```
:::

::::

### Code Copy Plugin

Adds copy buttons to code blocks for easy copying:

```javascript
// This code block has a copy button
const message = 'Hello VuePress!'
console.log(message)

// Try hovering over this code block to see the copy button
function setupVuePress() {
  return {
    title: 'My Awesome Site',
    description: 'Built with VuePress'
  }
}
```

## Custom Plugin Development

### Simple Plugin Example

```javascript
// plugins/my-plugin.js
module.exports = (options, context) => ({
  name: 'my-custom-plugin',
  
  ready() {
    console.log('Plugin is ready!')
  },
  
  extendPageData(pageContext) {
    const { frontmatter } = pageContext
    
    // Add custom data to all pages
    frontmatter.buildTime = new Date().toISOString()
  }
})
```

### Advanced Plugin with Webpack Modification

```javascript
// plugins/advanced-plugin.js
const path = require('path')

module.exports = (options, context) => ({
  name: 'advanced-plugin',
  
  chainWebpack(config, isServer) {
    // Add custom alias
    config.resolve.alias.set('@components', path.resolve('components'))
    
    // Add custom loader for special file types
    config.module
      .rule('special-files')
      .test(/\.special$/)
      .use('special-loader')
      .loader(require.resolve('./special-loader'))
  },
  
  async ready() {
    // Perform async setup
    const data = await fetchExternalData()
    context.customData = data
  },
  
  extendMarkdown(md) {
    // Add custom markdown-it plugin
    md.use(require('markdown-it-special'), options.special)
  }
})
```

## Plugin Ecosystem Examples

### SEO Plugin

```javascript
// Comprehensive SEO plugin configuration
['vuepress-plugin-seo', {
  siteTitle: (_, $site) => $site.title,
  title: $page => $page.title,
  description: $page => $page.frontmatter.description,
  author: (_, $site) => $site.themeConfig.author,
  tags: $page => $page.frontmatter.tags,
  twitterCard: _ => 'summary_large_image',
  type: $page => ['articles', 'posts', 'blog'].some(folder => $page.regularPath.startsWith('/' + folder)) ? 'article' : 'website',
  url: (_, $site, path) => ($site.themeConfig.domain || '') + path,
  image: ($page, $site) => $page.frontmatter.image && (($site.themeConfig.domain || '') + $page.frontmatter.image),
  publishedAt: $page => $page.frontmatter.date && new Date($page.frontmatter.date),
  modifiedAt: $page => $page.lastUpdated && new Date($page.lastUpdated)
}]
```

### Sitemap Plugin

```javascript
// Generate sitemap.xml automatically
['vuepress-plugin-sitemap', {
  hostname: 'https://your-domain.com',
  exclude: ['/404.html'],
  dateFormatter: time => {
    return new Date(time).toISOString()
  }
}]
```

### Feed Plugin (RSS/Atom)

```javascript
// Generate RSS/Atom feeds
['vuepress-plugin-feed', {
  canonical_base: 'https://your-domain.com',
  posts_directories: ['/blog/'],
  feed_options: {
    title: 'Your Site Title',
    description: 'Your site description',
    link: 'https://your-domain.com',
    language: 'en'
  },
  publishing_options: {
    rss: {
      file_name: 'rss.xml',
      head_link: {
        enable: true,
        type: 'application/rss+xml',
        title: '%%site_title%% RSS Feed'
      }
    }
  }
}]
```

## Plugin Development Best Practices

### 1. Plugin Structure

```javascript
module.exports = (options = {}, context) => {
  return {
    name: 'my-plugin',
    
    // Plugin metadata
    multiple: false, // Whether plugin can be used multiple times
    
    // Lifecycle hooks
    ready() {
      // Plugin initialization
    },
    
    updated() {
      // Called when files change in dev mode
    },
    
    generated() {
      // Called after static files are generated
    },
    
    // Extend functionality
    extendPageData(pageContext) {
      // Modify page data
    },
    
    extendMarkdown(md) {
      // Add markdown-it plugins
    },
    
    chainWebpack(config, isServer) {
      // Modify webpack configuration
    },
    
    // Client-side enhancements
    enhanceAppFiles: path.resolve(__dirname, 'enhanceApp.js'),
    
    // Add global components
    globalUIComponents: ['GlobalComponent'],
    
    // Custom commands
    extendCli(cli) {
      cli
        .command('custom-command')
        .action(() => {
          // Custom command implementation
        })
    }
  }
}
```

### 2. Options Validation

```javascript
const { logger } = require('@vuepress/shared-utils')

module.exports = (options = {}, context) => {
  // Validate options
  if (typeof options.required !== 'string') {
    logger.error('Option "required" must be a string')
    process.exit(1)
  }
  
  // Set defaults
  const {
    required,
    optional = 'default-value',
    advanced = {}
  } = options
  
  return {
    name: 'validated-plugin',
    // ... plugin implementation
  }
}
```

### 3. Error Handling

```javascript
module.exports = (options, context) => ({
  name: 'error-handling-plugin',
  
  async ready() {
    try {
      await someAsyncOperation()
    } catch (error) {
      logger.error('Plugin failed to initialize:', error.message)
      
      // Graceful fallback
      if (process.env.NODE_ENV === 'production') {
        // Continue without this feature in production
        logger.warn('Continuing without advanced features')
      } else {
        // Fail fast in development
        throw error
      }
    }
  }
})
```

## Testing Plugins

### Unit Testing

```javascript
// test/plugin.test.js
const plugin = require('../lib/index')
const { createApp } = require('@vuepress/core')

describe('My Plugin', () => {
  test('should register correctly', async () => {
    const app = createApp({
      plugins: [plugin]
    })
    
    await app.ready()
    
    expect(app.pluginAPI.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'my-plugin'
        })
      ])
    )
  })
})
```

### Integration Testing

```javascript
// test/integration.test.js
const { build } = require('@vuepress/core')
const path = require('path')

describe('Plugin Integration', () => {
  test('should build successfully with plugin', async () => {
    const sourceDir = path.resolve(__dirname, 'fixtures')
    const tempDir = path.resolve(__dirname, 'temp')
    
    await build({
      sourceDir,
      dest: tempDir,
      plugins: ['./lib/index.js']
    })
    
    // Assert generated files exist
    expect(fs.existsSync(path.join(tempDir, 'index.html'))).toBe(true)
  })
})
```

## Plugin Performance Tips

1. **Lazy Loading**: Only load heavy dependencies when needed
2. **Caching**: Cache expensive operations between builds
3. **Async Operations**: Use async/await for non-blocking operations
4. **Memory Management**: Clean up resources in lifecycle hooks
5. **Bundle Size**: Keep plugin size minimal for faster installs

The VuePress plugin ecosystem provides incredible flexibility for extending functionality. Whether using existing plugins or creating custom ones, plugins are the key to building powerful documentation sites! 🚀