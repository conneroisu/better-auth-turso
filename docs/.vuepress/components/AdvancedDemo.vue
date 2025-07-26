<template>
  <div class="advanced-demo">
    <div class="demo-header">
      <h3>🚀 Advanced VuePress Features</h3>
      <div class="demo-controls">
        <button @click="toggleTheme" class="theme-toggle">
          {{ isDark ? '☀️' : '🌙' }} {{ isDark ? 'Light' : 'Dark' }}
        </button>
        <button @click="randomizeData" class="randomize-btn">
          🎲 Randomize
        </button>
      </div>
    </div>

    <div class="demo-grid" :class="{ 'dark-theme': isDark }">
      <!-- Real-time Chart -->
      <div class="demo-card">
        <h4>📊 Real-time Data Visualization</h4>
        <div class="chart-container">
          <div class="chart-bar" v-for="(value, index) in chartData" :key="index">
            <div 
              class="bar" 
              :style="{ height: value + '%', backgroundColor: getBarColor(index) }"
              :title="`Value: ${value}%`"
            ></div>
            <span class="bar-label">{{ getBarLabel(index) }}</span>
          </div>
        </div>
        <p class="chart-info">Data updates every {{ updateInterval / 1000 }}s</p>
      </div>

      <!-- Interactive Form -->
      <div class="demo-card">
        <h4>📝 Dynamic Form with Validation</h4>
        <form @submit.prevent="submitForm" class="demo-form">
          <div class="form-group">
            <label>Name:</label>
            <input 
              v-model="form.name" 
              type="text" 
              :class="{ error: errors.name }"
              @blur="validateName"
            >
            <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
          </div>
          
          <div class="form-group">
            <label>Email:</label>
            <input 
              v-model="form.email" 
              type="email" 
              :class="{ error: errors.email }"
              @blur="validateEmail"
            >
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>
          
          <div class="form-group">
            <label>Framework:</label>
            <select v-model="form.framework">
              <option value="">Select a framework</option>
              <option value="vue">Vue.js</option>
              <option value="react">React</option>
              <option value="angular">Angular</option>
              <option value="svelte">Svelte</option>
            </select>
          </div>

          <button type="submit" :disabled="!isFormValid" class="submit-btn">
            {{ isSubmitting ? '⏳ Submitting...' : '🚀 Submit' }}
          </button>
        </form>

        <div v-if="submissionResult" class="submission-result">
          <h5>✅ Form Submitted!</h5>
          <pre>{{ JSON.stringify(submissionResult, null, 2) }}</pre>
        </div>
      </div>

      <!-- State Management Demo -->
      <div class="demo-card">
        <h4>🏪 State Management & Watchers</h4>
        <div class="state-demo">
          <div class="counter-group">
            <label>Counter A:</label>
            <div class="counter-controls">
              <button @click="counterA--">-</button>
              <span class="counter-value">{{ counterA }}</span>
              <button @click="counterA++">+</button>
            </div>
          </div>

          <div class="counter-group">
            <label>Counter B:</label>
            <div class="counter-controls">
              <button @click="counterB--">-</button>
              <span class="counter-value">{{ counterB }}</span>
              <button @click="counterB++">+</button>
            </div>
          </div>

          <div class="computed-results">
            <p><strong>Sum:</strong> {{ sum }}</p>
            <p><strong>Product:</strong> {{ product }}</p>
            <p><strong>Average:</strong> {{ average.toFixed(2) }}</p>
          </div>

          <div class="watch-log">
            <h5>📝 Change Log:</h5>
            <div class="log-entries">
              <div v-for="(entry, index) in changeLog" :key="index" class="log-entry">
                <span class="timestamp">{{ entry.timestamp }}</span>
                <span class="change">{{ entry.change }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Integration Demo -->
      <div class="demo-card">
        <h4>🌐 API Integration & Loading States</h4>
        <div class="api-demo">
          <button @click="fetchData" :disabled="isLoading" class="fetch-btn">
            {{ isLoading ? '⏳ Loading...' : '📡 Fetch Random Data' }}
          </button>

          <div v-if="isLoading" class="loading-spinner">
            <div class="spinner"></div>
            <p>Fetching data...</p>
          </div>

          <div v-else-if="apiData" class="api-result">
            <h5>📦 API Response:</h5>
            <div class="data-display">
              <div class="data-item" v-for="(value, key) in apiData" :key="key">
                <strong>{{ formatKey(key) }}:</strong> {{ value }}
              </div>
            </div>
          </div>

          <div v-if="apiError" class="api-error">
            <h5>❌ Error:</h5>
            <p>{{ apiError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Features Info -->
    <div class="features-info">
      <h4>🎯 Demonstrated Features:</h4>
      <div class="feature-tags">
        <span class="tag">Real-time Updates</span>
        <span class="tag">Form Validation</span>
        <span class="tag">State Management</span>
        <span class="tag">Computed Properties</span>
        <span class="tag">Watchers</span>
        <span class="tag">API Integration</span>
        <span class="tag">Loading States</span>
        <span class="tag">Error Handling</span>
        <span class="tag">Dynamic Styling</span>
        <span class="tag">Event Handling</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdvancedDemo',
  data() {
    return {
      isDark: false,
      chartData: [45, 72, 38, 89, 56, 23, 67],
      updateInterval: 3000,
      intervalId: null,
      
      // Form data
      form: {
        name: '',
        email: '',
        framework: ''
      },
      errors: {},
      isSubmitting: false,
      submissionResult: null,
      
      // State management
      counterA: 5,
      counterB: 3,
      changeLog: [],
      
      // API demo
      isLoading: false,
      apiData: null,
      apiError: null
    }
  },
  computed: {
    sum() {
      return this.counterA + this.counterB
    },
    product() {
      return this.counterA * this.counterB
    },
    average() {
      return (this.counterA + this.counterB) / 2
    },
    isFormValid() {
      return this.form.name && this.form.email && !this.errors.name && !this.errors.email
    }
  },
  watch: {
    counterA(newVal, oldVal) {
      this.logChange(`Counter A: ${oldVal} → ${newVal}`)
    },
    counterB(newVal, oldVal) {
      this.logChange(`Counter B: ${oldVal} → ${newVal}`)
    },
    sum(newVal) {
      this.logChange(`Sum updated to: ${newVal}`)
    }
  },
  mounted() {
    this.startChartUpdates()
    this.logChange('Component mounted')
  },
  beforeDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  },
  methods: {
    toggleTheme() {
      this.isDark = !this.isDark
    },
    
    randomizeData() {
      this.chartData = this.chartData.map(() => Math.floor(Math.random() * 100))
    },
    
    startChartUpdates() {
      this.intervalId = setInterval(() => {
        const index = Math.floor(Math.random() * this.chartData.length)
        const newValue = Math.floor(Math.random() * 100)
        this.$set(this.chartData, index, newValue)
      }, this.updateInterval)
    },
    
    getBarColor(index) {
      const colors = ['#3eaf7c', '#42b883', '#35495e', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
      return colors[index % colors.length]
    },
    
    getBarLabel(index) {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      return labels[index] || `Day ${index + 1}`
    },
    
    validateName() {
      if (!this.form.name.trim()) {
        this.$set(this.errors, 'name', 'Name is required')
      } else if (this.form.name.length < 2) {
        this.$set(this.errors, 'name', 'Name must be at least 2 characters')
      } else {
        this.$delete(this.errors, 'name')
      }
    },
    
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!this.form.email.trim()) {
        this.$set(this.errors, 'email', 'Email is required')
      } else if (!emailRegex.test(this.form.email)) {
        this.$set(this.errors, 'email', 'Please enter a valid email')
      } else {
        this.$delete(this.errors, 'email')
      }
    },
    
    async submitForm() {
      this.validateName()
      this.validateEmail()
      
      if (!this.isFormValid) return
      
      this.isSubmitting = true
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      this.submissionResult = {
        ...this.form,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      }
      
      this.isSubmitting = false
      this.logChange('Form submitted successfully')
    },
    
    logChange(change) {
      const timestamp = new Date().toLocaleTimeString()
      this.changeLog.unshift({ timestamp, change })
      
      // Keep only last 10 entries
      if (this.changeLog.length > 10) {
        this.changeLog = this.changeLog.slice(0, 10)
      }
    },
    
    async fetchData() {
      this.isLoading = true
      this.apiError = null
      this.apiData = null
      
      try {
        // Simulate API call with random data
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Simulate occasional errors
        if (Math.random() < 0.2) {
          throw new Error('Network error: Unable to fetch data')
        }
        
        this.apiData = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          randomValue: Math.floor(Math.random() * 1000),
          status: 'success',
          userAgent: navigator.userAgent.split(' ')[0],
          language: navigator.language
        }
        
        this.logChange('API data fetched successfully')
      } catch (error) {
        this.apiError = error.message
        this.logChange(`API error: ${error.message}`)
      } finally {
        this.isLoading = false
      }
    },
    
    formatKey(key) {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }
}
</script>

<style scoped>
.advanced-demo {
  margin: 30px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.demo-header h3 {
  margin: 0;
  font-size: 1.5em;
}

.demo-controls {
  display: flex;
  gap: 10px;
}

.theme-toggle, .randomize-btn {
  padding: 8px 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.theme-toggle:hover, .randomize-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  transition: all 0.3s ease;
}

.demo-grid.dark-theme {
  filter: hue-rotate(180deg) invert(1);
}

.demo-card {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.demo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.demo-card h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.2em;
  border-bottom: 2px solid #3eaf7c;
  padding-bottom: 10px;
}

/* Chart Styles */
.chart-container {
  display: flex;
  align-items: flex-end;
  height: 120px;
  gap: 8px;
  margin: 20px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  min-height: 5px;
  border-radius: 4px 4px 0 0;
  transition: all 0.5s ease;
  cursor: pointer;
}

.bar-label {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.chart-info {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0;
}

/* Form Styles */
.demo-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.form-group input, .form-group select {
  padding: 12px;
  border: 2px solid #e1e4e8;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #3eaf7c;
}

.form-group input.error {
  border-color: #ff6b6b;
}

.error-text {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 2px;
}

.submit-btn {
  padding: 12px 24px;
  background: #3eaf7c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #369870;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.submission-result {
  margin-top: 20px;
  padding: 15px;
  background: #f0fff4;
  border: 1px solid #3eaf7c;
  border-radius: 6px;
}

.submission-result h5 {
  margin: 0 0 10px 0;
  color: #3eaf7c;
}

.submission-result pre {
  background: #2d3748;
  color: #f7fafc;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  margin: 0;
}

/* State Management Styles */
.state-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.counter-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.counter-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.counter-controls button {
  width: 40px;
  height: 40px;
  border: none;
  background: #3eaf7c;
  color: white;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.counter-controls button:hover {
  background: #369870;
  transform: scale(1.1);
}

.counter-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  min-width: 40px;
  text-align: center;
}

.computed-results {
  padding: 15px;
  background: #e8f5e8;
  border-radius: 8px;
  border-left: 4px solid #3eaf7c;
}

.computed-results p {
  margin: 5px 0;
  font-size: 16px;
}

.watch-log {
  max-height: 150px;
  overflow-y: auto;
}

.watch-log h5 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
}

.timestamp {
  color: #666;
  font-family: monospace;
  min-width: 80px;
}

.change {
  color: #2c3e50;
}

/* API Demo Styles */
.api-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fetch-btn {
  padding: 12px 24px;
  background: #4ecdc4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fetch-btn:hover:not(:disabled) {
  background: #45b7aa;
  transform: translateY(-1px);
}

.fetch-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4ecdc4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.api-result {
  padding: 20px;
  background: #f0fff4;
  border: 1px solid #3eaf7c;
  border-radius: 8px;
}

.api-result h5 {
  margin: 0 0 15px 0;
  color: #3eaf7c;
}

.data-display {
  display: grid;
  gap: 10px;
}

.data-item {
  padding: 10px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #3eaf7c;
}

.api-error {
  padding: 20px;
  background: #fff5f5;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
}

.api-error h5 {
  margin: 0 0 10px 0;
  color: #ff6b6b;
}

/* Features Info */
.features-info {
  margin-top: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
}

.features-info h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 6px 12px;
  background: #3eaf7c;
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .demo-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .demo-grid {
    grid-template-columns: 1fr;
  }
  
  .counter-group {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>