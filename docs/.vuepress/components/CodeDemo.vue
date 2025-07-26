<template>
  <div class="code-demo">
    <div class="demo-tabs">
      <button
        v-for="(demo, index) in demos"
        :key="index"
        @click="activeTab = index"
        :class="{ active: activeTab === index }"
        class="tab-button"
      >
        {{ demo.title }}
      </button>
    </div>

    <div class="demo-content">
      <div class="demo-preview">
        <h4>Live Preview</h4>
        <div class="preview-area" v-html="currentDemo.preview"></div>
      </div>

      <div class="demo-code">
        <h4>Code</h4>
        <pre><code>{{ currentDemo.code }}</code></pre>
      </div>
    </div>

    <div class="demo-description" v-if="currentDemo.description">
      <h4>Description</h4>
      <p>{{ currentDemo.description }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "CodeDemo",
  data() {
    return {
      activeTab: 0,
      demos: [
        {
          title: "Basic HTML",
          preview:
            '<div style="padding: 10px; background: #f0f8ff; border-radius: 4px;"><strong>Hello World!</strong><br>This is basic HTML content.</div>',
          code: `<div>
  <strong>Hello World!</strong>
  <br>This is basic HTML content.
</div>`,
          description: "Basic HTML structure with text formatting elements.",
        },
        {
          title: "CSS Styling",
          preview:
            '<div style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 20px; border-radius: 8px; text-align: center;"><h3 style="margin:0;">Styled Component</h3><p style="margin:10px 0 0 0;">Beautiful gradients and typography</p></div>',
          code: `.styled-component {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}`,
          description:
            "CSS styling with gradients, colors, and layout properties.",
        },
        {
          title: "Interactive Elements",
          preview:
            "<div style=\"text-align: center; padding: 15px;\"><button onclick=\"this.innerHTML = this.innerHTML === 'Click me!' ? 'Clicked!' : 'Click me!'\" style=\"background: #3eaf7c; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;\">Click me!</button></div>",
          code: `<button @click="toggleText">
  {{ buttonText }}
</button>

// Vue.js method
methods: {
  toggleText() {
    this.buttonText = this.buttonText === 'Click me!' 
      ? 'Clicked!' 
      : 'Click me!';
  }
}`,
          description:
            "Interactive JavaScript/Vue.js functionality with event handling.",
        },
      ],
    };
  },
  computed: {
    currentDemo() {
      return this.demos[this.activeTab];
    },
  },
};
</script>

<style scoped>
.code-demo {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  margin: 20px 0;
  overflow: hidden;
}

.demo-tabs {
  display: flex;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
}

.tab-button {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.tab-button:hover {
  background: #e1e4e8;
}

.tab-button.active {
  border-bottom-color: #3eaf7c;
  background: white;
  color: #3eaf7c;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

@media (max-width: 768px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
}

.demo-preview,
.demo-code {
  padding: 20px;
}

.demo-preview {
  border-right: 1px solid #e1e4e8;
  background: #fafbfc;
}

@media (max-width: 768px) {
  .demo-preview {
    border-right: none;
    border-bottom: 1px solid #e1e4e8;
  }
}

.demo-code {
  background: #f6f8fa;
}

.demo-preview h4,
.demo-code h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.preview-area {
  min-height: 60px;
}

pre {
  background: #2d3748;
  color: #f7fafc;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

code {
  font-family: "Monaco", "Consolas", "Courier New", monospace;
}

.demo-description {
  padding: 20px;
  background: white;
  border-top: 1px solid #e1e4e8;
}

.demo-description h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.demo-description p {
  margin: 0;
  color: #6a737d;
  line-height: 1.6;
}
</style>
