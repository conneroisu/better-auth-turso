<template>
  <div class="custom-component">
    <h3>🎯 Custom Vue Component</h3>
    <p>This component demonstrates Vue.js integration in VuePress:</p>

    <div class="demo-section">
      <div class="counter">
        <h4>Interactive Counter</h4>
        <p>
          Current count: <strong>{{ currentCount }}</strong>
        </p>
        <div class="buttons">
          <button @click="decrement" :disabled="currentCount <= 0">-</button>
          <button @click="increment" :disabled="currentCount >= maxCount">
            +
          </button>
          <button @click="reset">Reset</button>
        </div>
      </div>

      <div class="features">
        <h4>Component Features</h4>
        <ul>
          <li>✅ Reactive data binding</li>
          <li>✅ Event handling</li>
          <li>✅ Computed properties</li>
          <li>✅ Conditional rendering</li>
          <li>✅ Custom styling</li>
        </ul>
      </div>
    </div>

    <div class="props-demo">
      <h4>Props Demo</h4>
      <p>This component was passed a <code>count</code> prop: {{ count }}</p>
      <p v-if="count > 5" class="highlight">
        The count prop is greater than 5! 🎉
      </p>
    </div>

    <div class="lifecycle-demo">
      <h4>Lifecycle Hooks</h4>
      <p>Component mounted at: {{ mountedTime }}</p>
      <p>Random ID: {{ randomId }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "CustomComponent",
  props: {
    count: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      currentCount: 0,
      maxCount: 20,
      mountedTime: "",
      randomId: "",
    };
  },
  computed: {
    isMaxReached() {
      return this.currentCount >= this.maxCount;
    },
  },
  methods: {
    increment() {
      if (this.currentCount < this.maxCount) {
        this.currentCount++;
      }
    },
    decrement() {
      if (this.currentCount > 0) {
        this.currentCount--;
      }
    },
    reset() {
      this.currentCount = 0;
    },
  },
  mounted() {
    this.currentCount = this.count;
    this.mountedTime = new Date().toLocaleTimeString();
    this.randomId = Math.random().toString(36).substr(2, 9);

    console.log("CustomComponent mounted!", {
      count: this.count,
      currentCount: this.currentCount,
      mountedTime: this.mountedTime,
    });
  },
};
</script>

<style scoped>
.custom-component {
  border: 2px solid #3eaf7c;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.demo-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

@media (max-width: 768px) {
  .demo-section {
    grid-template-columns: 1fr;
  }
}

.counter {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.features {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.features ul {
  margin: 0;
  padding-left: 20px;
}

.features li {
  margin: 5px 0;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.buttons button {
  padding: 8px 16px;
  border: 1px solid #3eaf7c;
  background: #3eaf7c;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.buttons button:hover:not(:disabled) {
  background: #369870;
  transform: translateY(-1px);
}

.buttons button:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.props-demo,
.lifecycle-demo {
  background: white;
  padding: 15px;
  margin: 15px 0;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.highlight {
  color: #3eaf7c;
  font-weight: bold;
}

code {
  background: #f1f1f1;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: Monaco, Consolas, monospace;
}

h3 {
  margin-top: 0;
  color: #2c3e50;
}

h4 {
  color: #3eaf7c;
  margin-top: 0;
}
</style>
