/**
 * WeatherBox
 * @module ui_new/components/WeatherBox
 * 
 * Displays current weather conditions
 * Shows: Clear → Lightning Storm (from Nature.js)
 * Integrates with GlobalTime weather system
 * 
 * Features:
 * - Visual icon for current weather
 * - Color-coded background (clear sky or stormy)
 * - Smooth transitions between weather states
 * - Normalized coordinate positioning
 */

class WeatherBox {
  /**
   * Create a weather display box
   * @param {Object} p5Instance - p5.js instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.normalizedX=0.9] - Normalized X position (-1 to 1)
   * @param {number} [options.normalizedY=0.7] - Normalized Y position (-1 to 1)
   * @param {number} [options.width=100] - Box width in pixels
   * @param {number} [options.height=80] - Box height in pixels
   */
  constructor(p5Instance, options = {}) {
    this.p5 = p5Instance;
    
    // Coordinate converter for normalized UI positioning
    this.coordConverter = new UICoordinateConverter(p5Instance);
    
    // Configuration
    this.width = options.width || 100;
    this.height = options.height || 80;
    this.padding = 8;
    
    // Position in normalized coordinates (default: top-right, below day/night box)
    const normalizedX = options.normalizedX !== undefined ? options.normalizedX : 0.9;
    const normalizedY = options.normalizedY !== undefined ? options.normalizedY : 0.7;
    
    // Convert to screen coordinates
    const screenPos = this.coordConverter.normalizedToScreen(normalizedX, normalizedY);
    this.x = screenPos.x - this.width / 2;
    this.y = screenPos.y - this.height / 2;
    
    // Weather state colors (background)
    this.colors = {
      clear: { r: 100, g: 180, b: 255, label: 'Clear' },        // Light blue
      lightning: { r: 60, g: 60, b: 90, label: 'Storm' },       // Dark stormy
      none: { r: 100, g: 180, b: 255, label: 'Clear' }          // Default clear
    };
    
    // Weather icons
    this.icons = {
      clear: '☀️',      // Sun (clear weather)
      lightning: '⚡',  // Lightning bolt
      none: '☀️'        // Default sun
    };
    
    // Current and target colors for smooth transitions
    this.currentColor = { r: 100, g: 180, b: 255 };
    this.targetColor = { r: 100, g: 180, b: 255 };
    this.transitionSpeed = 0.08; // Faster transitions for weather changes
    
    // Alpha (opacity) for fade in/out effect
    this.currentAlpha = 255; // Start fully visible
    this.targetAlpha = 0;    // Target: fade out when clear
    this.alphaTransitionSpeed = 3; // Alpha change per frame (0-255 scale)
    
    // Reference to global time system
    this.globalTime = null;
    
    // State
    this.enabled = true;
    this.lastWeatherState = 'clear';
    this.isWeatherActive = false;
    
    console.log('⚡ WeatherBox created:');
    console.log(`   Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`   Size: ${this.width}x${this.height}`);
    console.log(`   Normalized: (${normalizedX}, ${normalizedY})`);
  }
  
  /**
   * Update weather display
   * Checks GlobalTime weather system and updates colors/state
   */
  update() {
    if (!this.enabled) return;
    
    // Get global time reference (lazy initialization)
    if (!this.globalTime) {
      this.globalTime = (typeof window !== 'undefined' && window.g_globalTime) ||
                        (typeof g_globalTime !== 'undefined' && g_globalTime);
      
      if (!this.globalTime) {
        // GlobalTime not initialized yet
        return;
      }
    }
    
    // Get current weather state
    const isWeather = this.globalTime.weather || false;
    const weatherName = this.globalTime.weatherName || null;
    
    // Determine current weather state
    let currentWeather = 'clear';
    if (isWeather && weatherName) {
      currentWeather = weatherName; // 'lightning', etc.
    }
    
    // Update target color and alpha if weather changed
    if (currentWeather !== this.lastWeatherState || isWeather !== this.isWeatherActive) {
      this.lastWeatherState = currentWeather;
      this.isWeatherActive = isWeather;
      
      const newColor = this.colors[currentWeather] || this.colors.clear;
      this.targetColor = { r: newColor.r, g: newColor.g, b: newColor.b };
      
      // Set target alpha: fade out when clear, fade in when stormy
      if (isWeather) {
        this.targetAlpha = 255; // Fade in when weather active
      } else {
        this.targetAlpha = 0;   // Fade out when clear
      }
    }
    
    // Smooth color transition
    this.currentColor.r += (this.targetColor.r - this.currentColor.r) * this.transitionSpeed;
    this.currentColor.g += (this.targetColor.g - this.currentColor.g) * this.transitionSpeed;
    this.currentColor.b += (this.targetColor.b - this.currentColor.b) * this.transitionSpeed;
    
    // Smooth alpha transition
    if (this.currentAlpha < this.targetAlpha) {
      this.currentAlpha = Math.min(this.targetAlpha, this.currentAlpha + this.alphaTransitionSpeed);
    } else if (this.currentAlpha > this.targetAlpha) {
      this.currentAlpha = Math.max(this.targetAlpha, this.currentAlpha - this.alphaTransitionSpeed);
    }
  }
  
  /**
   * Render the weather box
   */
  render() {
    if (!this.enabled) return;
    
    // Skip rendering if fully transparent
    if (this.currentAlpha <= 0) return;
    
    this.p5.push();
    
    // Background box with current weather color and alpha
    const bgAlpha = (200 / 255) * this.currentAlpha; // Scale background alpha proportionally
    this.p5.fill(this.currentColor.r, this.currentColor.g, this.currentColor.b, bgAlpha);
    const strokeAlpha = (150 / 255) * this.currentAlpha; // Scale stroke alpha proportionally
    this.p5.stroke(255, 255, 255, strokeAlpha);
    this.p5.strokeWeight(2);
    this.p5.rect(this.x, this.y, this.width, this.height, 8); // Rounded corners
    
    // Get current weather info
    const weatherState = this.lastWeatherState;
    const weatherConfig = this.colors[weatherState] || this.colors.clear;
    const icon = this.icons[weatherState] || this.icons.clear;
    const label = weatherConfig.label;
    
    // Draw icon (large) with alpha
    this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
    this.p5.textSize(32);
    this.p5.fill(255, 255, 255, this.currentAlpha);
    this.p5.noStroke();
    this.p5.text(icon, this.x + this.width / 2, this.y + this.height / 2 - 8);
    
    // Draw label (small text below icon) with alpha
    this.p5.textSize(12);
    const labelAlpha = (230 / 255) * this.currentAlpha;
    this.p5.fill(255, 255, 255, labelAlpha);
    this.p5.text(label, this.x + this.width / 2, this.y + this.height - this.padding - 6);
    
    // Draw weather timer if active (with alpha)
    if (this.globalTime && this.isWeatherActive && typeof this.globalTime.weatherSeconds === 'number') {
      const remaining = Math.max(0, 120 - this.globalTime.weatherSeconds); // 120s max duration
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      this.p5.textSize(9);
      const timerAlpha = (200 / 255) * this.currentAlpha;
      this.p5.fill(255, 255, 255, timerAlpha);
      this.p5.text(timeStr, this.x + this.width / 2, this.y + this.padding + 4);
    }
    
    this.p5.pop();
  }
  
  /**
   * Check if point is inside box bounds
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @returns {boolean} True if inside
   */
  isPointInside(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
  
  /**
   * Handle click (for future interactions)
   * @param {number} x - Click X position
   * @param {number} y - Click Y position
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    if (!this.enabled) return false;
    
    if (this.isPointInside(x, y)) {
      console.log('⚡ Weather box clicked');
      // Future: Could show weather forecast or toggle weather
      return true;
    }
    
    return false;
  }
  
  /**
   * Enable/disable display
   * @param {boolean} enabled - True to enable
   */
  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }
  
  /**
   * Get current weather state
   * @returns {string} Current weather type
   */
  getCurrentWeather() {
    return this.lastWeatherState;
  }
  
  /**
   * Check if weather is active
   * @returns {boolean} True if weather event active
   */
  isWeatherEventActive() {
    return this.isWeatherActive;
  }
  
  /**
   * Register with RenderManager for interactive layer
   */
  registerInteractive() {
    if (typeof RenderManager === 'undefined') {
      console.warn('RenderManager not available');
      return;
    }
    
    console.log('📝 Registering WeatherBox as interactive drawable...');
    
    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
      id: 'weather-box',
      hitTest: (pointer) => {
        if (typeof GameState !== 'undefined' && GameState.getState && GameState.getState() !== 'PLAYING') {
          return false;
        }
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        return this.isPointInside(x, y);
      },
      onPointerDown: (pointer) => {
        if (typeof GameState !== 'undefined' && GameState.getState && GameState.getState() !== 'PLAYING') {
          return false;
        }
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        return this.handleClick(x, y);
      }
    });
    
    console.log('✅ WeatherBox registered as interactive drawable');
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherBox;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.WeatherBox = WeatherBox;
}
