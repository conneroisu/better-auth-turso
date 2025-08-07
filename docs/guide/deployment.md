# 🚀 Deployment & Production Guide

This comprehensive guide covers deploying your VuePress site to production with best practices for performance, security, and reliability.

## Build Process

### Production Build

```bash
# Build for production
npm run docs:build

# Output will be in docs/.vuepress/dist
ls docs/.vuepress/dist
```

### Build Optimization

```javascript
// .vuepress/config.js
module.exports = {
  // Enable extraction of CSS into separate files
  extractCSS: true,
  
  // Enable evergreen browser support
  evergreen: true,
  
  // Disable cache in dev, enable in production
  cache: process.env.NODE_ENV === 'production',
  
  // Optimize build for production
  chainWebpack: (config, isServer) => {
    if (process.env.NODE_ENV === 'production') {
      // Enable gzip compression
      config.plugin('compression').use(require('compression-webpack-plugin'), [{
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      }])
      
      // Bundle analyzer (optional)
      if (process.env.ANALYZE) {
        config.plugin('bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
      }
    }
  }
}
```

## Deployment Platforms

### GitHub Pages

#### 1. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy VuePress to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        fetch-depth: 0
        
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build VuePress site
      run: npm run docs:build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: docs/.vuepress/dist
        cname: your-domain.com  # Optional: if using custom domain
```

#### 2. Configuration for GitHub Pages

```javascript
// .vuepress/config.js
module.exports = {
  // Set base URL for GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/repository-name/' : '/',
  
  // Ensure proper asset handling
  head: [
    ['link', { rel: 'icon', href: '/repository-name/favicon.ico' }]
  ]
}
```

### Netlify

#### 1. netlify.toml Configuration

```toml
[build]
  publish = "docs/.vuepress/dist"
  command = "npm run docs:build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"

# Redirect rules for SPA routing
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

#### 2. Environment Variables

Set these in Netlify dashboard:
- `NODE_VERSION`: 18
- `NPM_FLAGS`: --prefix=/opt/buildhome/.nodejs/bin/
- `VUEPRESS_BASE`: / (for root domain) or /subdirectory/

### Vercel

#### 1. vercel.json Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "docs/.vuepress/dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/404.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### 2. Build Script

Add to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm run docs:build"
  }
}
```

### Firebase Hosting

#### 1. Firebase Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "docs/.vuepress/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/404.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(html|json)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      }
    ]
  }
}
```

#### 2. Deploy Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Deploy
npm run docs:build
firebase deploy
```

### AWS S3 + CloudFront

#### 1. Build and Upload Script

```bash
#!/bin/bash
# deploy-aws.sh

# Build the site
npm run docs:build

# Upload to S3
aws s3 sync docs/.vuepress/dist s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

#### 2. S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Performance Optimization

### 1. Asset Optimization

```javascript
// .vuepress/config.js
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  chainWebpack: (config, isServer) => {
    // Optimize images
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 80 },
        optipng: { enabled: false },
        pngquant: { quality: [0.65, 0.90], speed: 4 },
        gifsicle: { interlaced: false },
        webp: { quality: 80 }
      })
    
    // Split chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
    }
  }
}
```

### 2. PWA Configuration

```javascript
// .vuepress/config.js
module.exports = {
  plugins: [
    ['@vuepress/pwa', {
      serviceWorker: true,
      updatePopup: {
        message: "New content is available.",
        buttonText: "Refresh"
      },
      generateSWConfig: {
        cacheId: 'vuepress-pwa',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    }]
  ]
}
```

### 3. SEO Optimization

```javascript
// .vuepress/config.js
module.exports = {
  head: [
    // Essential meta tags
    ['meta', { charset: 'utf-8' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    
    // SEO meta tags
    ['meta', { name: 'description', content: 'Your site description' }],
    ['meta', { name: 'keywords', content: 'vuepress, documentation, vue, static site' }],
    ['meta', { name: 'author', content: 'Your Name' }],
    
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Your Site Title' }],
    ['meta', { property: 'og:description', content: 'Your site description' }],
    ['meta', { property: 'og:image', content: '/og-image.jpg' }],
    ['meta', { property: 'og:url', content: 'https://your-domain.com' }],
    
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Your Site Title' }],
    ['meta', { name: 'twitter:description', content: 'Your site description' }],
    ['meta', { name: 'twitter:image', content: '/twitter-image.jpg' }],
    
    // Favicon
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    
    // Preconnect to external domains
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }]
  ],
  
  plugins: [
    // Generate sitemap
    ['sitemap', {
      hostname: 'https://your-domain.com'
    }],
    
    // SEO enhancements
    ['seo', {
      siteTitle: (_, $site) => $site.title,
      title: $page => $page.title,
      description: $page => $page.frontmatter.description,
      author: (_, $site) => $site.themeConfig.author,
      tags: $page => $page.frontmatter.tags,
      type: $page => 'article'
    }]
  ]
}
```

## Security Best Practices

### 1. Content Security Policy

```javascript
// .vuepress/config.js
module.exports = {
  head: [
    ['meta', {
      'http-equiv': 'Content-Security-Policy',
      content: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://www.google-analytics.com"
      ].join('; ')
    }]
  ]
}
```

### 2. Security Headers

Set these headers on your hosting platform:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Monitoring and Analytics

### 1. Google Analytics 4

```javascript
// .vuepress/config.js
module.exports = {
  plugins: [
    ['@vuepress/google-analytics', {
      'ga': 'G-XXXXXXXXXX' // Your GA4 Measurement ID
    }]
  ]
}
```

### 2. Performance Monitoring

```javascript
// .vuepress/enhanceApp.js
export default ({ router, Vue }) => {
  if (typeof window !== 'undefined') {
    // Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    })
    
    // Error tracking
    window.addEventListener('error', (event) => {
      // Send error to monitoring service
      console.error('Global error:', event.error)
    })
    
    // Route change tracking
    router.afterEach((to, from) => {
      if (typeof gtag !== 'undefined') {
        gtag('config', 'G-XXXXXXXXXX', {
          page_path: to.path
        })
      }
    })
  }
}
```

## CI/CD Pipeline

### 1. Complete GitHub Actions Workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Build site
      run: npm run docs:build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: docs/.vuepress/dist

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: docs/.vuepress/dist
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: docs/.vuepress/dist
        
  lighthouse:
    needs: deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Lighthouse CI
      uses: treosh/lighthouse-ci-action@v9
      with:
        urls: |
          https://your-username.github.io/repository-name/
        uploadArtifacts: true
        temporaryPublicStorage: true
```

### 2. Environment-specific Configuration

```javascript
// .vuepress/config.js
const isProd = process.env.NODE_ENV === 'production'
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  // Environment-specific settings
  base: isProd ? '/production-path/' : '/',
  
  // Debug mode for development
  debug: isDev,
  
  // Cache settings
  cache: isProd ? '.vuepress/cache' : false,
  
  // Plugin configuration
  plugins: [
    // Analytics only in production
    ...(isProd ? [
      ['@vuepress/google-analytics', { ga: 'G-XXXXXXXXXX' }]
    ] : []),
    
    // PWA only in production
    ...(isProd ? [
      ['@vuepress/pwa', { serviceWorker: true }]
    ] : [])
  ],
  
  chainWebpack: (config, isServer) => {
    // Production optimizations
    if (isProd) {
      config.plugin('compression').use(require('compression-webpack-plugin'))
    }
    
    // Development enhancements
    if (isDev) {
      config.devtool('source-map')
    }
  }
}
```

## Domain and SSL Setup

### 1. Custom Domain Configuration

Create `docs/.vuepress/public/CNAME`:
```
your-domain.com
```

### 2. DNS Configuration

```
Type: CNAME
Name: www
Value: your-username.github.io

Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

### 3. SSL Certificate

Most platforms (GitHub Pages, Netlify, Vercel) provide automatic SSL certificates. For custom setups:

```bash
# Using Certbot for Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Troubleshooting Common Issues

### 1. Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .vuepress/cache
npm install

# Check for memory issues
export NODE_OPTIONS="--max-old-space-size=4096"
npm run docs:build

# Debug build process
DEBUG=vuepress:* npm run docs:build
```

### 2. Asset Loading Issues

```javascript
// Ensure proper base path configuration
module.exports = {
  base: process.env.DEPLOY_ENV === 'gh-pages' ? '/repo-name/' : '/',
  
  chainWebpack: (config) => {
    // Fix asset path issues
    config.output.publicPath(
      process.env.NODE_ENV === 'production' 
        ? '/repo-name/' 
        : '/'
    )
  }
}
```

### 3. Performance Issues

```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer
ANALYZE=true npm run docs:build

# Check lighthouse scores
npx lighthouse https://your-site.com --view

# Monitor Core Web Vitals
# Use Google PageSpeed Insights or web-vitals library
```

## Deployment Checklist

- [ ] Build completes without errors
- [ ] All assets load correctly
- [ ] Navigation works on all pages
- [ ] Search functionality works
- [ ] Mobile responsiveness verified
- [ ] SSL certificate configured
- [ ] SEO meta tags present
- [ ] Analytics tracking works
- [ ] Performance scores acceptable (Lighthouse)
- [ ] Error monitoring configured
- [ ] Backup strategy in place

Your VuePress site is now production-ready! 🎉