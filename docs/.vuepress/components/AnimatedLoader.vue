<template>
  <div class="animated-loader">
    <div class="loader-container">
      <div class="loader-content">
        <div class="pulse-rings">
          <div class="ring ring-1"></div>
          <div class="ring ring-2"></div>
          <div class="ring ring-3"></div>
          <div class="ring ring-4"></div>
        </div>
        
        <div class="loader-icon">
          <div class="gear gear-1">⚙️</div>
          <div class="gear gear-2">⚙️</div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        
        <div class="loading-text">
          <span v-for="(char, index) in loadingMessage" 
                :key="index" 
                :style="{ animationDelay: index * 0.1 + 's' }"
                class="char">
            {{ char === ' ' ? '\u00A0' : char }}
          </span>
        </div>
        
        <div class="stats">
          <div class="stat">
            <span class="stat-label">Progress:</span>
            <span class="stat-value">{{ Math.round(progress) }}%</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time:</span>
            <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <button @click="startLoading" :disabled="isLoading" class="start-btn">
        {{ isLoading ? '⏳ Loading...' : '🚀 Start Loading Demo' }}
      </button>
      <button @click="resetLoader" class="reset-btn">
        🔄 Reset
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnimatedLoader',
  data() {
    return {
      progress: 0,
      isLoading: false,
      elapsedTime: 0,
      loadingMessage: 'Loading awesome content...',
      intervalId: null,
      startTime: null
    }
  },
  methods: {
    startLoading() {
      if (this.isLoading) return
      
      this.isLoading = true
      this.progress = 0
      this.elapsedTime = 0
      this.startTime = Date.now()
      
      // Simulate realistic loading with variable speed
      const steps = [
        { target: 15, duration: 800 },   // Initial loading
        { target: 35, duration: 1200 },  // Processing
        { target: 65, duration: 2000 },  // Heavy work
        { target: 85, duration: 1000 },  // Almost done
        { target: 100, duration: 500 }   // Finalizing
      ]
      
      let currentStep = 0
      let currentProgress = 0
      
      const updateProgress = () => {
        if (currentStep >= steps.length) {
          this.isLoading = false
          clearInterval(this.intervalId)
          return
        }
        
        const step = steps[currentStep]
        const increment = (step.target - currentProgress) / (step.duration / 50)
        
        this.intervalId = setInterval(() => {
          this.elapsedTime = Date.now() - this.startTime
          
          if (currentProgress < step.target) {
            currentProgress += increment
            this.progress = Math.min(currentProgress, step.target)
          } else {
            clearInterval(this.intervalId)
            currentProgress = step.target
            currentStep++
            setTimeout(updateProgress, 100)
          }
        }, 50)
      }
      
      updateProgress()
    },
    
    resetLoader() {
      this.isLoading = false
      this.progress = 0
      this.elapsedTime = 0
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
    },
    
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000)
      const milliseconds = Math.floor((ms % 1000) / 10)
      return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`
    }
  },
  
  beforeDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }
}
</script>

<style scoped>
.animated-loader {
  max-width: 600px;
  margin: 30px auto;
  padding: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loader-container {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-content {
  text-align: center;
  position: relative;
  z-index: 2;
}

.pulse-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.ring {
  position: absolute;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.ring-1 {
  width: 100px;
  height: 100px;
  margin: -50px 0 0 -50px;
  animation-delay: 0s;
}

.ring-2 {
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  animation-delay: 0.5s;
}

.ring-3 {
  width: 200px;
  height: 200px;
  margin: -100px 0 0 -100px;
  animation-delay: 1s;
}

.ring-4 {
  width: 250px;
  height: 250px;
  margin: -125px 0 0 -125px;
  animation-delay: 1.5s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.loader-icon {
  position: relative;
  margin: 30px 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gear {
  position: absolute;
  font-size: 3em;
  animation: rotate 3s linear infinite;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}

.gear-1 {
  animation-direction: normal;
}

.gear-2 {
  font-size: 2em;
  margin-left: 40px;
  margin-top: 20px;
  animation-direction: reverse;
  animation-duration: 2s;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin: 30px 0;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #44a08d);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.loading-text {
  margin: 20px 0;
  font-size: 1.2em;
  font-weight: 500;
  letter-spacing: 1px;
}

.char {
  display: inline-block;
  animation: bounce 1.5s infinite ease-in-out;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
}

.stats {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9em;
  opacity: 0.8;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.4em;
  font-weight: bold;
  color: #4ecdc4;
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}

.start-btn, .reset-btn {
  padding: 12px 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.start-btn:hover:not(:disabled), .reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-btn {
  background: rgba(255, 107, 107, 0.2);
  border-color: rgba(255, 107, 107, 0.3);
}

.reset-btn:hover {
  background: rgba(255, 107, 107, 0.3);
}

@media (max-width: 768px) {
  .animated-loader {
    margin: 20px;
    padding: 20px;
  }
  
  .ring-3, .ring-4 {
    display: none;
  }
  
  .gear {
    font-size: 2em;
  }
  
  .gear-2 {
    font-size: 1.5em;
  }
  
  .stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .controls {
    flex-direction: column;
  }
}
</style>