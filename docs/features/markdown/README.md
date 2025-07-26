# Markdown Features

VuePress extends standard Markdown with powerful features that make writing documentation a breeze. This page demonstrates all the enhanced Markdown capabilities available in VuePress.

## Table of Contents

[[toc]]

## Headers

VuePress automatically generates anchor links for headers:

# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Formatting

### Basic Formatting

**Bold text** and *italic text* and ***bold italic text***

~~Strikethrough text~~

Inline `code` with backticks

### Links

[Internal link](../vue-components/)
[External link](https://vuejs.org)
[Link with title](https://vuejs.org "Vue.js Official Site")

Auto-converted links: https://vuejs.org

### Emphasis and Importance

*This is emphasized*
**This is important**
***This is both***

## Lists

### Unordered Lists

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deeply nested item
- Item 3

### Ordered Lists

1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

### Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Code Blocks

### Basic Code Block

```
This is a plain code block
```

### Syntax Highlighting

```js
// JavaScript
function hello() {
  console.log('Hello, VuePress!')
}
```

```python
# Python
def hello():
    print("Hello, VuePress!")
```

```css
/* CSS */
.highlight {
  background-color: yellow;
  font-weight: bold;
}
```

### Line Highlighting

```js{2,4-6}
export default {
  data () { // This line is highlighted
    return {
      msg: 'Highlighted!' // This line is highlighted
    } // This line is highlighted
  } // This line is highlighted
}
```

### Line Numbers

```js
// Line numbers are enabled globally in config
function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log(`Result: ${result}`);
```

### Code Groups

<code-group>
<code-block title="YARN">
```bash
yarn add vuepress
```
</code-block>

<code-block title="NPM">
```bash
npm install vuepress
```
</code-block>
</code-group>

## Custom Containers

### Tip Container

::: tip
This is a tip container. It's great for highlighting helpful information!
:::

::: tip Custom Title
You can also customize the title of tip containers.
:::

### Warning Container

::: warning
This is a warning container. Use it to alert users about potential issues.
:::

::: warning DEPRECATED
This feature is deprecated and will be removed in v2.0.
:::

### Danger Container

::: danger
This is a danger container. Use it for critical warnings!
:::

::: danger STOP
Don't do this in production!
:::

### Details Container

::: details Click me to view the code
```js
console.log('Hello, world!')
```
:::

::: details Show/Hide Example
This content will be hidden by default and can be expanded by clicking the summary.

You can include any markdown content here:
- Lists
- Code blocks
- **Formatted text**
- [Links](https://vuejs.org)
:::

## Tables

### Basic Table

| Feature | VuePress | GitBook | Docsify |
|---------|----------|---------|---------|
| Vue.js | ✅ | ❌ | ❌ |
| React | ❌ | ❌ | ❌ |
| Themes | ✅ | ⚠️ | ✅ |
| Plugins | ✅ | ⚠️ | ✅ |

### Aligned Table

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left | Center | Right |
| Text | Text | Text |

## Emoji Support

VuePress supports GitHub-style emoji shortcodes:

- :tada: `:tada:`
- :100: `:100:`
- :fire: `:fire:`
- :rocket: `:rocket:`
- :heart: `:heart:`
- :thumbsup: `:thumbsup:`

## Blockquotes

> This is a simple blockquote.

> **Multi-line blockquote**
> 
> This blockquote spans
> multiple lines and can contain
> **formatted text** and [links](https://vuejs.org).

> Nested blockquotes:
> > This is nested inside another blockquote.
> > 
> > It can be useful for highlighting quoted content within quotes.

## Horizontal Rules

Use three or more hyphens, asterisks, or underscores:

---

***

___

## Line Breaks

Two spaces at the end of a line  
create a line break.

Or use a blank line

to create a paragraph break.

## Escaping

Use backslashes to escape special characters:

\*This won't be italic\*
\`This won't be code\`

## HTML in Markdown

You can use HTML tags directly in Markdown:

<div style="color: red; font-weight: bold;">
This is red and bold text using HTML.
</div>

<details>
<summary>HTML Details Element</summary>
This uses the native HTML details element.
</details>

## Badge Component

<Badge text="beta" type="warn"/> <Badge text="0.10.1+"/>

<Badge text="stable"/> <Badge text="deprecated" type="error"/>

## Math Expressions (with plugin)

Inline math: $E = mc^2$

Block math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Code Import

You can import code snippets from files:

```js
// This would import from a real file
// <<< @/examples/basic.js
```

### Import with Line Highlighting

```js{2}
// This would import with line 2 highlighted
// <<< @/examples/basic.js{2}
```

### Import Specific Lines

```js
// This would import lines 10-20
// <<< @/examples/basic.js#L10-L20
```

## Footnotes

Here's a sentence with a footnote [^1].

Here's another footnote [^note].

[^1]: This is the first footnote.
[^note]: This is a named footnote.

## Advanced Features

### Custom Anchor Links

You can customize anchor links for headers:

### Custom Header {#custom-id}

This header has a custom ID that you can link to: [Custom Header](#custom-id)

### Disable Header Anchors

```markdown
### Header Without Anchor {.no-anchor}
```

## Markdown Configuration Examples

Here are some configuration examples for `.vuepress/config.js`:

```js
module.exports = {
  markdown: {
    // Enable line numbers in code blocks
    lineNumbers: true,
    
    // Configure extracted headers
    extractHeaders: ['h2', 'h3', 'h4'],
    
    // Anchor options
    anchor: { 
      permalink: true,
      permalinkBefore: true,
      permalinkSymbol: '#'
    },
    
    // External links configuration
    externalLinks: { 
      target: '_blank', 
      rel: 'noopener noreferrer' 
    },
    
    // Extend markdown-it
    extendMarkdown: md => {
      md.use(require('markdown-it-footnote'))
      md.use(require('markdown-it-task-lists'))
    }
  }
}
```

## Best Practices

### 1. Header Hierarchy

Use proper header hierarchy for better SEO and accessibility:

```markdown
# Page Title (H1)
## Section (H2)
### Subsection (H3)
#### Sub-subsection (H4)
```

### 2. Code Block Languages

Always specify the language for syntax highlighting:

```markdown
// Good
```js
console.log('Hello')
```

// Avoid
```
console.log('Hello')
```
```

### 3. Link Descriptions

Use descriptive link text instead of "click here":

```markdown
// Good
[Read the Vue.js documentation](https://vuejs.org/guide/)

// Avoid
[Click here](https://vuejs.org/guide/) to read the documentation
```

### 4. Image Alt Text

Always provide alt text for images:

```markdown
![VuePress logo showing the Vue.js logo with "Press" text](/logo.png)
```

### 5. Table Headers

Use table headers for better accessibility:

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Data 1   | Data 2   |
```

## Interactive Demo

<CodeDemo />

## Summary

VuePress Markdown features include:

- ✅ All standard Markdown syntax
- ✅ Syntax highlighting with line numbers
- ✅ Custom containers (tip, warning, danger)
- ✅ Table of contents generation
- ✅ Emoji support
- ✅ Task lists and footnotes
- ✅ Code imports and highlighting
- ✅ Vue components integration
- ✅ Math expressions (with plugins)
- ✅ HTML support
- ✅ Custom anchor links

These features make VuePress perfect for creating rich, interactive documentation that's both readable and functional.

## What's Next?

- **[Vue Components](../vue-components/)** - Learn to use Vue components in Markdown
- **[Themes](../themes/)** - Customize your site's appearance
- **[Plugins](../plugins/)** - Extend Markdown functionality