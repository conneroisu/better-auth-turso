# Examples

This section provides practical examples of VuePress features in action. Each example includes working code, explanations, and best practices.

## Quick Navigation

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0;">

<FeatureCard
  title="🚀 Basic Examples"
  description="Simple, straightforward examples perfect for getting started"
  icon="🚀"
  link="/examples/basic/"
>

- Simple site setup
- Basic navigation
- Content organization
- Asset handling

</FeatureCard>

<FeatureCard
  title="⚡ Advanced Examples"
  description="Complex implementations showcasing advanced VuePress features"
  icon="⚡"
  link="/examples/advanced/"
>

- Custom plugins
- Complex theming
- API integrations
- Dynamic content

</FeatureCard>

<FeatureCard
  title="🎨 Component Examples"
  description="Custom Vue components for enhanced documentation"
  icon="🎨"
  link="/examples/components/"
>

- Interactive widgets
- Data visualizations
- Form components
- Layout components

</FeatureCard>

</div>

## Live Demos

### Interactive Counter

This component demonstrates Vue.js reactivity in VuePress:

<CustomComponent :count="3" />

### Code Demonstration

<CodeDemo />

### Feature Card Grid

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin: 20px 0;">

<FeatureCard
  title="Markdown Extensions"
  description="Enhanced markdown with custom containers and syntax highlighting"
  icon="📝"
  :featured="true"
/>

<FeatureCard
  title="Vue Components"
  description="Seamlessly integrate Vue.js components in your documentation"
  icon="⚡"
/>

<FeatureCard
  title="Plugin System"
  description="Extend functionality with a rich ecosystem of plugins"
  icon="🔌"
/>

<FeatureCard
  title="Custom Themes"
  description="Create beautiful, custom themes with Vue.js and CSS"
  icon="🎨"
/>

</div>

## Code Examples

### Configuration Example

```js{5,7-9}
// .vuepress/config.js
module.exports = {
  title: 'My Documentation',
  description: 'A VuePress site',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: {
      '/guide/': [
        '',
        'getting-started',
        'advanced'
      ]
    }
  }
}
```

### Custom Component Example

```vue
<template>
  <div class="example-component">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button @click="count++" :class="{ active: count > 0 }">
      Clicked {{ count }} times
    </button>
  </div>
</template>

<script>
export default {
  props: ['title', 'description'],
  data() {
    return { count: 0 }
  }
}
</script>

<style scoped>
.example-component {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
}

button {
  background: #3eaf7c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button.active {
  background: #369870;
}
</style>
```

## Custom Containers Examples

::: tip Pro Tip
Use custom containers to highlight important information!
:::

::: warning Compatibility Note
Some features require VuePress 1.x or higher.
:::

::: danger Breaking Change
This will be removed in the next major version.
:::

::: details Click to expand detailed example
This is a detailed explanation that's hidden by default.

```js
// Complex configuration example
module.exports = {
  // Advanced settings here
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions.whitespace = 'condense'
        return options
      })
  }
}
```
:::

## Markdown Extensions in Action

### Tables with Alignment

| Feature | Description | Status |
|:--------|:------------|:------:|
| Markdown | Enhanced Markdown support | ✅ |
| Vue | Vue.js integration | ✅ |
| Plugins | Extensible plugin system | ✅ |
| Themes | Custom theming | ✅ |

### Task Lists

- [x] Set up VuePress project
- [x] Create basic configuration
- [x] Add custom components
- [ ] Deploy to production
- [ ] Add analytics tracking

### Emoji Support

VuePress supports GitHub-style emoji: :tada: :rocket: :heart: :100:

### Code Block Features

```bash
# Install VuePress
npm install -D vuepress

# Start development server
npm run docs:dev

# Build for production
npm run docs:build
```

```js{1,3-5}
// JavaScript with line highlighting
const config = {
  title: 'My Site',
  description: 'Site description',
  base: '/'
}

export default config
```

## Asset Examples

### Images with Captions

![VuePress Logo](/logo.svg "VuePress - Vue-powered Static Site Generator")

*VuePress combines the power of Vue.js with static site generation*

### Linked Images

[![VuePress Documentation](https://img.shields.io/badge/docs-VuePress-3eaf7c.svg)](https://vuepress.vuejs.org/)

## Real-World Use Cases

### 1. API Documentation

Perfect for documenting REST APIs, GraphQL schemas, and SDK references:

```js
// Example API endpoint
GET /api/users/:id

// Response
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2023-01-01T00:00:00Z"
}
```

### 2. Technical Guides

Step-by-step tutorials with code examples and interactive elements:

1. **Setup**: Install dependencies and configure your environment
2. **Development**: Write your code with live examples
3. **Testing**: Add tests and validation
4. **Deployment**: Deploy to production with CI/CD

### 3. Design Systems

Document design tokens, components, and usage guidelines:

<div style="display: flex; gap: 16px; margin: 20px 0;">
  <div style="width: 50px; height: 50px; background: #3eaf7c; border-radius: 4px;"></div>
  <div style="width: 50px; height: 50px; background: #42b983; border-radius: 50%;"></div>
  <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #3eaf7c, #42b983); border-radius: 4px;"></div>
</div>

### 4. Product Documentation

User guides, feature descriptions, and help documentation:

- **Getting Started**: Quick setup and first steps
- **Features**: Detailed feature explanations
- **Tutorials**: Step-by-step learning paths
- **FAQ**: Common questions and answers

## Performance Examples

VuePress automatically optimizes your site:

- **Code Splitting**: Automatic route-based code splitting
- **Prefetching**: Smart prefetching of page resources
- **Service Worker**: Optional PWA features
- **Image Optimization**: Responsive images and lazy loading

## SEO Examples

Built-in SEO optimization:

```js
// Automatic meta tags
head: [
  ['meta', { name: 'description', content: 'Page description' }],
  ['meta', { property: 'og:title', content: 'Page Title' }],
  ['meta', { property: 'og:description', content: 'Page description' }]
]
```

## What's Next?

Explore these example categories:

1. **[Basic Examples](./basic/)** - Simple implementations
2. **[Advanced Examples](./advanced/)** - Complex use cases  
3. **[Component Examples](./components/)** - Custom components

Start building amazing documentation sites with VuePress! 🚀