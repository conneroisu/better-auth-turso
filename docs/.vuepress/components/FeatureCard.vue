<template>
  <div class="feature-card" :class="{ featured: featured }">
    <div class="card-header">
      <div class="icon" v-if="icon">{{ icon }}</div>
      <h3>{{ title }}</h3>
    </div>
    <div class="card-content">
      <p>{{ description }}</p>
      <slot></slot>
    </div>
    <div class="card-footer" v-if="$slots.footer || link">
      <slot name="footer">
        <a v-if="link" :href="link" class="learn-more">Learn More →</a>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "FeatureCard",
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.feature-card {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  margin: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.feature-card.featured {
  border-color: #3eaf7c;
  background: linear-gradient(135deg, #f6fffd 0%, #f0fff4 100%);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.icon {
  font-size: 2em;
  margin-right: 12px;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4em;
}

.card-content {
  flex: 1;
  margin-bottom: 16px;
}

.card-content p {
  color: #6a737d;
  line-height: 1.6;
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e1e4e8;
}

.learn-more {
  color: #3eaf7c;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.learn-more:hover {
  color: #369870;
}
</style>
