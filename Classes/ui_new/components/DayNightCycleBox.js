/**
 * DayNightCycleBox
 * @module ui_new/components/DayNightCycleBox
 * 
 * Displays the current time of day with visual representation
 * Shows: Morning → Day → Evening → Night cycle
 * Integrates with GlobalTime (Nature.js) system
 * 
 * Features:
 * - Visual icon for current time period
 * - Color-coded background (warm for day, cool for night)
 * - Smooth transitions between periods
 * - Normalized coordinate positioning
 */

class DayNightCycleBox {
  /**
   * Create a day/night cycle display box
   * @param {Object} p5Instance - p5.js instance
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.normalizedX=-0.8] - Normalized X position (-1 to 1)
   * @param {number} [options.normalizedY=-0.85] - Normalized Y position (-1 to 1)
   * @param {number} [options.width=120] - Box width in pixels
   * @param {number} [options.height=80] - Box height in pixels
   */
  constructor(p5Instance, options = {}) {
    this.p5 = p5Instance;
    
    // Coordinate converter for normalized UI positioning
    this.coordConverter = new UICoordinateConverter(p5Instance);
    
    // Configuration
    this.width = options.width || 120;
    this.height = options.height || 80;
    this.padding = 8;
    
    // Position in normalized coordinates (default: bottom-left)
    const normalizedX = options.normalizedX !== undefined ? options.normalizedX : -0.8;
    const normalizedY = options.normalizedY !== undefined ? options.normalizedY : -0.85;
    
    // Convert to screen coordinates
    const screenPos = this.coordConverter.normalizedToScreen(normalizedX, normalizedY);
    this.x = screenPos.x - this.width / 2;
    this.y = screenPos.y - this.height / 2;
    
    // Time period colors (background)
    this.colors = {
      sunrise: { r: 255, g: 180, b: 120, label: 'Morning' },  // Warm orange/pink
      day: { r: 100, g: 200, b: 255, label: 'Day' },          // Sky blue
      sunset: { r: 255, g: 120, b: 80, label: 'Evening' },    // Orange
      night: { r: 20, g: 20, b: 80, label: 'Night' }          // Dark blue
    };
    
    // Icon symbols for each time period
    this.icons = {
      sunrise: '🌅',  // Sunrise emoji
      day: '☀️',      // Sun
      sunset: '🌇',   // Sunset
      night: '🌙'     // Moon
    };
    
    // Current and target colors for smooth transitions
    this.currentColor = { r: 100, g: 200, b: 255 };
    this.targetColor = { r: 100, g: 200, b: 255 };
    this.transitionSpeed = 0.05; // Interpolation speed (0-1 per frame)
    
    // Reference to global time system
    this.globalTime = null;
    
    // State
    this.enabled = true;
    this.lastTimeOfDay = 'day';
    
    console.log('🌅 DayNightCycleBox created:');
    console.log(`   Position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`   Size: ${this.width}x${this.height}`);
    console.log(`   Normalized: (${normalizedX}, ${normalizedY})`);
  }
  
  /**
   * Update cycle display
   * Checks GlobalTime and updates colors/state
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
    
    // Get current time of day
    const timeOfDay = this.globalTime.timeOfDay || 'day';
    
    // Update target color if time changed
    if (timeOfDay !== this.lastTimeOfDay) {
      this.lastTimeOfDay = timeOfDay;
      const newColor = this.colors[timeOfDay];
      if (newColor) {
        this.targetColor = { r: newColor.r, g: newColor.g, b: newColor.b };
      }
    }
    
    // Smooth color transition
    this.currentColor.r += (this.targetColor.r - this.currentColor.r) * this.transitionSpeed;
    this.currentColor.g += (this.targetColor.g - this.currentColor.g) * this.transitionSpeed;
    this.currentColor.b += (this.targetColor.b - this.currentColor.b) * this.transitionSpeed;
  }
  
  /**
   * Render the day/night cycle box
   */
  render() {
    if (!this.enabled) return;
    
    this.p5.push();
    
    // Background box with current time color
    this.p5.fill(this.currentColor.r, this.currentColor.g, this.currentColor.b, 200);
    this.p5.stroke(255, 255, 255, 150);
    this.p5.strokeWeight(2);
    this.p5.rect(this.x, this.y, this.width, this.height, 8); // Rounded corners
    
    // Get current time info
    const timeOfDay = this.lastTimeOfDay;
    const timeConfig = this.colors[timeOfDay];
    const icon = this.icons[timeOfDay] || '⏰';
    const label = timeConfig ? timeConfig.label : 'Unknown';
    
    // Draw icon (large)
    this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
    this.p5.textSize(32);
    this.p5.fill(255);
    this.p5.noStroke();
    this.p5.text(icon, this.x + this.width / 2, this.y + this.height / 2 - 8);
    
    // Draw label (small text below icon)
    this.p5.textSize(14);
    this.p5.fill(255, 255, 255, 230);
    this.p5.text(label, this.x + this.width / 2, this.y + this.height - this.padding - 8);
    
    // Draw day counter if available
    if (this.globalTime && typeof this.globalTime.inGameDays === 'number') {
      this.p5.textSize(10);
      this.p5.fill(255, 255, 255, 180);
      this.p5.text(`Day ${this.globalTime.inGameDays}`, this.x + this.width / 2, this.y + this.padding + 5);
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
   * Handle click (for future interactions like time speed control)
   * @param {number} x - Click X position
   * @param {number} y - Click Y position
   * @returns {boolean} True if click was handled
   */
  handleClick(x, y) {
    if (!this.enabled) return false;
    
    if (this.isPointInside(x, y)) {
      console.log('🌅 Day/Night box clicked');
      // Future: Could open time control panel or show time stats
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
   * Get current time of day
   * @returns {string} Current time period
   */
  getCurrentTimeOfDay() {
    return this.lastTimeOfDay;
  }
  
  /**
   * Get current day number
   * @returns {number} Day count or 0 if not available
   */
  getCurrentDay() {
    return (this.globalTime && this.globalTime.inGameDays) || 0;
  }
  
  /**
   * Register with RenderManager for interactive layer
   */
  registerInteractive() {
    if (typeof RenderManager === 'undefined') {
      console.warn('RenderManager not available');
      return;
    }
    
    console.log('📝 Registering DayNightCycleBox as interactive drawable...');
    
    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
      id: 'day-night-cycle-box',
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
    
    console.log('✅ DayNightCycleBox registered as interactive drawable');
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DayNightCycleBox;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.DayNightCycleBox = DayNightCycleBox;
}
