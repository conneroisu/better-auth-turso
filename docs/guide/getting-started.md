# Getting Started

This guide will help you create your first VuePress site from scratch.

## Prerequisites

Before we begin, make sure you have:

- **Node.js 10+** (recommended: Node.js 12+)
- **Package manager**: npm, yarn, or pnpm
- **Text editor**: VS Code, Vim, Sublime Text, etc.
- **Terminal**: Command line interface

## Installation Methods

### Method 1: Manual Setup (Recommended)

1. **Create a new directory**

```bash
mkdir my-vuepress-site
cd my-vuepress-site
```

2. **Initialize package.json**

```bash
npm init -y
```

3. **Install VuePress**

```bash
# Install as dev dependency
npm install -D vuepress

# Or with yarn
yarn add -D vuepress
```

4. **Add scripts to package.json**

```json
{
  "scripts": {
    "docs:dev": "vuepress dev docs",
    "docs:build": "vuepress build docs"
  }
}
```

5. **Create directory structure**

```bash
mkdir docs
mkdir docs/.vuepress
```

6. **Create your first page**

```bash
echo '# Hello VuePress!' > docs/README.md
```

7. **Start development server**

```bash
npm run docs:dev
```

### Method 2: Using Create VuePress Site

```bash
# With yarn
yarn create vuepress-site my-site

# With npx
npx create-vuepress-site my-site

# Navigate and install
cd my-site
npm install
npm run dev
```

## Basic Configuration

Create `.vuepress/config.js`:

```js
module.exports = {
  title: 'My VuePress Site',
  description: 'Just playing around with VuePress',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'GitHub', link: 'https://github.com' }
    ],
    
    sidebar: [
      '/',
      '/guide/',
      ['/guide/getting-started', 'Getting Started']
    ]
  }
}
```

## Project Structure

Your VuePress site should look like this:

```
my-vuepress-site/
├── docs/
│   ├── .vuepress/
│   │   ├── config.js
│   │   ├── components/       # Global Vue components
│   │   ├── theme/           # Custom theme
│   │   ├── public/          # Static assets
│   │   └── styles/          # Custom styles
│   ├── guide/
│   │   ├── README.md
│   │   └── getting-started.md
│   └── README.md            # Homepage
├── package.json
└── node_modules/
```

## Writing Your First Pages

### Homepage (docs/README.md)

```markdown
---
home: true
heroImage: /hero.png
heroText: Hero Title
tagline: Hero subtitle
actionText: Get Started →
actionLink: /guide/
features:
- title: Feature 1
  details: Description of feature 1
- title: Feature 2
  details: Description of feature 2
- title: Feature 3
  details: Description of feature 3
footer: MIT Licensed | Copyright © 2023-present Your Name
---

# Welcome to My Site

This is the homepage content.
```

### Guide Page (docs/guide/README.md)

```markdown
# Introduction

This is the introduction to my guide.

## What you'll learn

- How to use VuePress
- How to write great documentation
- How to deploy your site

## Getting started

Let's dive right in!
```

## Adding Navigation

### Navbar Configuration

```js
// .vuepress/config.js
module.exports = {
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      {
        text: 'Learn',
        ariaLabel: 'Learn Menu',
        items: [
          { text: 'Tutorial', link: '/tutorial/' },
          { text: 'Examples', link: '/examples/' }
        ]
      },
      { text: 'External', link: 'https://google.com' }
    ]
  }
}
```

### Sidebar Configuration

```js
// .vuepress/config.js
module.exports = {
  themeConfig: {
    sidebar: {
      '/guide/': [
        '',                    # /guide/README.md
        'getting-started',     # /guide/getting-started.md
        'configuration',       # /guide/configuration.md
        ['advanced', 'Advanced Guide'] # Explicit text
      ],
      
      '/tutorial/': [
        '',
        'basics',
        'advanced'
      ],
      
      // Fallback
      '/': [
        '',
        'contact',
        'about'
      ]
    }
  }
}
```

## Adding Assets

### Static Assets

Place files in `.vuepress/public/`:

```
.vuepress/
└── public/
    ├── logo.png
    ├── favicon.ico
    └── images/
        └── hero.jpg
```

Reference them with absolute paths:

```markdown
![Logo](/logo.png)
![Hero](/images/hero.jpg)
```

### Relative Assets

Place images relative to your markdown files:

```markdown
![Local Image](./my-image.png)
```

## Development Tips

### 1. Hot Reloading

VuePress watches for changes and automatically reloads:

- **Markdown files**: Instant reload
- **Vue components**: Hot reload
- **Config changes**: Requires manual restart

### 2. Development Server

```bash
# Start with default port (8080)
npm run docs:dev

# Custom port
npm run docs:dev -- --port 3000

# Custom host
npm run docs:dev -- --host 0.0.0.0
```

### 3. Debug Mode

```bash
# Enable debug mode
DEBUG=vuepress:* npm run docs:dev

# Debug specific components
DEBUG=vuepress:markdown npm run docs:dev
```

## Building for Production

### Build Command

```bash
npm run docs:build
```

This generates static files in `docs/.vuepress/dist/`.

### Build Options

```bash
# Build with debug info
DEBUG=vuepress:* npm run docs:build

# Build with custom output directory
vuepress build docs --dest public

# Build with custom temporary directory
vuepress build docs --temp .temp
```

## Common Issues & Solutions

### 1. Module Not Found

**Problem**: `Module not found: Error: Can't resolve 'some-module'`

**Solution**: Install the missing dependency:
```bash
npm install some-module
```

### 2. Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::8080`

**Solution**: Use a different port:
```bash
npm run docs:dev -- --port 3000
```

### 3. Build Fails

**Problem**: Build fails with webpack errors

**Solutions**:
- Clear cache: `rm -rf node_modules/.cache`
- Update dependencies: `npm update`
- Check for syntax errors in markdown/Vue files

### 4. 404 Errors

**Problem**: Pages return 404 in production

**Solutions**:
- Check file paths and names
- Ensure proper `base` configuration
- Verify server configuration for SPAs

## Best Practices

### 1. File Organization

```
docs/
├── .vuepress/
├── guide/
│   ├── README.md           # /guide/
│   ├── basic.md           # /guide/basic.html
│   └── advanced.md        # /guide/advanced.html
├── api/
│   ├── README.md          # /api/
│   └── reference.md       # /api/reference.html
└── README.md              # /
```

### 2. URL Structure

- Use lowercase filenames
- Use hyphens for spaces: `getting-started.md`
- Keep URLs short and descriptive
- Maintain consistent structure

### 3. Content Guidelines

- Write clear, concise content
- Use proper heading hierarchy
- Add navigation between related pages
- Include examples and code samples
- Test all links and examples

### 4. Performance

- Optimize images before adding
- Use appropriate image formats (WebP, AVIF)
- Minimize dependencies
- Enable gzip compression on server

## Next Steps

Now that you have a basic VuePress site running:

1. **[Configuration](./configuration.html)** - Learn advanced configuration options
2. **[Markdown](./markdown.html)** - Master VuePress Markdown extensions
3. **[Using Vue](./using-vue.html)** - Add Vue components to your docs
4. **[Themes](../features/themes/)** - Customize your site's appearance
5. **[Plugins](../features/plugins/)** - Extend functionality with plugins
6. **[Deployment](./deploy.html)** - Deploy your site to production

Happy building! 🚀