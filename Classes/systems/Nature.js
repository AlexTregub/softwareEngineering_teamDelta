class GlobalTime{
    constructor(){
        this.inGameSeconds = 0;
        this.inGameDays = 1;
        this.weatherSeconds = 0;
        this.transitionAlpha = 0;
        this.timeOfDay = "day";
        this.transitioning = false;
        this.weather = false;
        this.weatherName = null;
        this.lastFrameTime = performance.now();
        this._accumulator = 0;
        this.timeSpeed = 1.0; // Time multiplier (1.0 = normal speed, 2.0 = 2x speed, etc.)
        console.log(`Global Time System Initialized`);
    }

    update(){  
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        
        // Apply time speed multiplier
        const adjustedDeltaTime = deltaTime * this.timeSpeed;
        this.internalTimer(adjustedDeltaTime); //Runs internal timer

        if(this.transitioning){
            const fadeSpeed = 255 / 60; // alpha change per second
            if(this.timeOfDay === "sunset" && this.transitionAlpha < 255){
                this.transitionAlpha += fadeSpeed * adjustedDeltaTime;
            }
            if(this.timeOfDay === "sunrise" && this.transitionAlpha > 0){
                this.transitionAlpha -= fadeSpeed * adjustedDeltaTime;
            }
            this.transitionAlpha = Math.min(255, Math.max(0, this.transitionAlpha));
        }
        if(this.weather){
          this.runWeather();
        }
    }

    internalTimer(deltaTime){
        this._accumulator = (this._accumulator || 0) + deltaTime;
        if (this._accumulator >= 1) { //Every second
            this._accumulator = 0;
            this.incrementTime(); //Increments internal timer
            if(this.weather){
                this.weatherSeconds += 1; //Increments weather timer (so that weather can end after certain time)
            }
        }
    }
    incrementTime(){
        this.inGameSeconds += 1; //Increments seconds
        this.weatherChance = Math.random();
        if(this.weatherChance < 0.01){ //1% chance of weather change every second
            if(this.weather === true){
                this.weather = false;
                this.weatherName = null;
                window.g_naturePower = null;
                this.weatherSeconds = 0;
                console.log(`Weather ended`);
            }
            else{
                console.log(`Weather Change approaching`);
                this.weather = true;
            }
        }
        if(this.transitioning){ //Transitions last one minue
            if(this.inGameSeconds >= 60){
                this.transition(this.timeOfDay); //Add function to add darkening/lightening effects
            }
        }
        else{
            if(this.inGameSeconds >= 240){ //Day/Night last 4 minutes (10 minutes per day (probably shorten by half)
                this.transition(this.timeOfDay);
            }
        }
        if(this.weatherSeconds >= 120){ //Weather automatically ends after 2 minutes
            this.weather = false
            this.weatherName = null;
            window.g_naturePower = null;
            //Literally makes entire new power manager for every weather change. Absolutely horrible...but it works
            this.weatherSeconds = 0;
            console.log(`Weather ended`);
        }
        console.log(`Day: ${this.inGameDays} Seconds: ${this.inGameSeconds} Time: ${this.timeOfDay}`); //Testing
    }
    transition(currentTime){
        switch(currentTime){
        case "day":
            this.timeOfDay = "sunset";
            this.transitioning = true; //Changes time of day at thresholds
            this.transitionAlpha = 0;
            break;
        case "sunset":
            this.timeOfDay = "night";
            this.transitioning = false;
            this.transitionAlpha = 255;
            break;
        case "night":
            this.timeOfDay = "sunrise";
            this.transitioning = true;
            this.transitionAlpha = 255;
            break;
        case "sunrise":
            this.timeOfDay = "day";
            this.transitioning = false;
            this.transitionAlpha = 0;
            this.runNewDay();
            break;
        }
        this.inGameSeconds = 0; //Resets timer
        this.runTimeBasedEvents(this.timeOfDay);
    }
    runTimeBasedEvents(time){ //Will run events like boss fights and enemy waves
        switch(time){
            case "night":
                //Spawn enemy ant wave
                break;
        }
    }
    runNewDay(){
        this.inGameDays += 1; //Increments day counter
        this.inGameSeconds = 0;
    }
    runWeather(){
      if(this.weatherName == null){
        this.chance = Math.random();
        if(this.chance <= 1){
          this.weatherName = "lightning";
          window.g_naturePower = new PowerManager(true);
        }
      }
      else{
        switch(this.weatherName){
          case "lightning":
            this.strikeChance = Math.random();
            if(this.strikeChance > 0.99){
              const queen = getQueen();
              if (queen && queen.model) {
                const screenPos = queen.model.getScreenPosition();
                window.g_naturePower.addPower(this.weatherName, 10, screenPos.x, screenPos.y);
              }
            }
            break;
        }
        if(window.g_naturePower.runningPowers != null){
          window.g_naturePower.update();
        }
      }
    }
    
    /**
     * Set the time speed multiplier
     * @param {number} speed - Speed multiplier (1.0 = normal, 2.0 = 2x speed, 0.5 = half speed, etc.)
     */
    setTimeSpeed(speed) {
        if (typeof speed !== 'number' || speed < 0) {
            console.warn('Invalid time speed. Must be a positive number.');
            return false;
        }
        this.timeSpeed = speed;
        console.log(`⏱️ Time speed set to ${speed}x (${speed === 1 ? 'normal' : speed > 1 ? 'fast' : 'slow'})`);
        return true;
    }
    
    /**
     * Get current time speed multiplier
     */
    getTimeSpeed() {
        return this.timeSpeed;
    }
    
    /**
     * Reset time speed to normal
     */
    resetTimeSpeed() {
        this.timeSpeed = 1.0;
        console.log('⏱️ Time speed reset to normal (1x)');
        return true;
    }
}

/*
function draw() {

  // Update time logic
  globalTime.update();

  // Sky background
  background(100, 200, 255);

  // Overlay filter based on time of day
  noStroke();
  let a = globalTime.transitionAlpha;
  if (globalTime.timeOfDay === "sunset") {
    fill(0, 0, 50, a*0.7); // orange overlay
  } else if (globalTime.timeOfDay === "night") {
    fill(0, 0, 50, 180); // dark blue night
  } else if (globalTime.timeOfDay === "sunrise") {
    fill(255, 180, 80, a * 0.6); // warm sunrise tone
  } else {
    noFill();
  }
*/

// Global console commands for time control
if (typeof window !== 'undefined') {
  /**
   * Set time speed multiplier
   * @param {number} speed - Speed multiplier (1.0 = normal, 2.0 = 2x, 10.0 = 10x, etc.)
   */
  window.setTimeSpeed = function(speed) {
    const globalTime = window.g_globalTime || (typeof g_globalTime !== 'undefined' ? g_globalTime : null);
    if (!globalTime) {
      console.error('❌ GlobalTime not initialized yet. Make sure the game has started.');
      return false;
    }
    return globalTime.setTimeSpeed(speed);
  };
  
  /**
   * Get current time speed
   */
  window.getTimeSpeed = function() {
    const globalTime = window.g_globalTime || (typeof g_globalTime !== 'undefined' ? g_globalTime : null);
    if (!globalTime) {
      console.error('❌ GlobalTime not initialized yet. Make sure the game has started.');
      return null;
    }
    const speed = globalTime.getTimeSpeed();
    console.log(`⏱️ Current time speed: ${speed}x`);
    return speed;
  };
  
  /**
   * Reset time speed to normal (1x)
   */
  window.resetTimeSpeed = function() {
    const globalTime = window.g_globalTime || (typeof g_globalTime !== 'undefined' ? g_globalTime : null);
    if (!globalTime) {
      console.error('❌ GlobalTime not initialized yet. Make sure the game has started.');
      return false;
    }
    return globalTime.resetTimeSpeed();
  };
  
  /**
   * Quick preset speeds
   */
  window.fastTime = function() {
    return window.setTimeSpeed(5.0);
  };
  
  window.superFastTime = function() {
    return window.setTimeSpeed(10.0);
  };
  
  window.slowTime = function() {
    return window.setTimeSpeed(0.5);
  };
  
  window.normalTime = function() {
    return window.resetTimeSpeed();
  };
  
  console.log('⏱️ Time control console commands available:');
  console.log('  setTimeSpeed(n) - Set time speed (1.0 = normal, 2.0 = 2x, 10.0 = 10x, etc.)');
  console.log('  getTimeSpeed() - Get current time speed');
  console.log('  resetTimeSpeed() / normalTime() - Reset to normal speed');
  console.log('  fastTime() - Set to 5x speed');
  console.log('  superFastTime() - Set to 10x speed');
  console.log('  slowTime() - Set to 0.5x speed');
}


/**
 * @fileoverview TimeOfDayOverlay - Renders semi-transparent overlay based on in-game time
 * 
 * This class creates atmospheric lighting effects that change based on the GlobalTime system.
 * It renders between the ENTITIES and UI_GAME layers so it affects the game world but not the HUD.
 */

class TimeOfDayOverlay {
  constructor(globalTimeRef) {
    this.globalTime = globalTimeRef;
    
    // Overlay configuration
    this.config = {
      // Day: no overlay
      day: {
        color: [0, 0, 0],
        alpha: 0
      },
      // Sunset: warm orange overlay that fades in
      sunset: {
        color: [255, 120, 0],  // Orange tint
        alpha: 0.3  // 30% opacity when fully transitioned
      },
      // Night: dark blue overlay
      night: {
        color: [0, 0, 50],  // Dark blue
        alpha: 0.7  // 70% opacity
      },
      // Sunrise: warm yellow/pink overlay that fades out
      sunrise: {
        color: [255, 180, 80],  // Warm sunrise tone
        alpha: 0.4  // 40% opacity when fully transitioned
      },
      lightningStorm: {
        color: [103, 104, 130], //Grey. If it's dynamic by current ToD, just set R and G to ~ 100 to R and G
        alpha: 0.5 // 50% opacity
      }
    };
    
    // Current overlay state (interpolated)
    this.currentColor = [0, 0, 0];
    this.currentAlpha = 0;
    
    // State transition tracking for smooth non-transitioning phases
    this.previousTimeOfDay = 'day';
    this.stateChangeProgress = 1.0; // 0 = just changed state, 1 = fully settled
    this.stateChangeSpeed = 0.02; // How fast to settle into new state
    
    console.log('🌅 TimeOfDayOverlay initialized');
  }
  
  /**
   * Linear interpolation helper
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  /**
   * Interpolate between two colors
   */
  lerpColor(color1, color2, t) {
    return [
      Math.round(this.lerp(color1[0], color2[0], t)),
      Math.round(this.lerp(color1[1], color2[1], t)),
      Math.round(this.lerp(color1[2], color2[2], t))
    ];
  }
  
  /**
   * Smooth easing function (ease-in-out)
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Update overlay based on current time of day
   * Called automatically by RenderLayerManager
   */
  update() {
  if (!this.globalTime) return;
  
  const timeOfDay = this.globalTime.timeOfDay;
  const isWeather = this.globalTime.weather;
  const transitionAlpha = this.globalTime.transitionAlpha;
  const isTransitioning = this.globalTime.transitioning;
  
  // Detect state changes to trigger smooth settling
  if (timeOfDay !== this.previousTimeOfDay) {
    this.previousTimeOfDay = timeOfDay;
    this.stateChangeProgress = 0;
  }
  
  // Get target configuration for current time
  const targetConfig = this.config[timeOfDay];
  
  if (!targetConfig) {
    console.warn(`Unknown time of day: ${timeOfDay}`);
    return;
  }
  
  // Normalize transition alpha to 0-1 range and apply easing
  const rawT = transitionAlpha / 255.0;
  const easedT = this.easeInOutCubic(rawT);
  
  // Handle weather overlay - this should take precedence
  if(isWeather){
    const lightningConfig = this.config.lightningStorm;
    
    if (isTransitioning) {
      // If transitioning between times, blend the weather effect with the transition
      let baseColor, baseAlpha;
      
      // Calculate what the base color/alpha would be without weather
      if (timeOfDay === 'sunset') {
        const dayConfig = this.config.day;
        baseColor = this.lerpColor(dayConfig.color, targetConfig.color, easedT);
        baseAlpha = this.lerp(dayConfig.alpha, targetConfig.alpha, easedT);
      }
      else if (timeOfDay === 'sunrise') {
        const nightConfig = this.config.night;
        const dayConfig = this.config.day;
        const invertedT = 1.0 - easedT;
        
        if (invertedT < 0.5) {
          const halfT = invertedT * 2.0;
          baseColor = this.lerpColor(nightConfig.color, targetConfig.color, halfT);
          baseAlpha = this.lerp(nightConfig.alpha, targetConfig.alpha, halfT);
        } else {
          const halfT = (invertedT - 0.5) * 2.0;
          baseColor = this.lerpColor(targetConfig.color, dayConfig.color, halfT);
          baseAlpha = this.lerp(targetConfig.alpha, dayConfig.alpha, halfT);
        }
      }
      else {
        // For stable times (day/night), just use target config
        baseColor = targetConfig.color;
        baseAlpha = targetConfig.alpha;
      }
      
      // Blend between base time-of-day and weather overlay
      this.currentColor = this.lerpColor(baseColor, lightningConfig.color, 0.7); // 70% weather influence
      this.currentAlpha = this.lerp(baseAlpha, lightningConfig.alpha, 0.7);
      
    } else {
      // Not transitioning - apply weather overlay directly
      // You might want to blend with the current time of day instead of replacing it
      this.currentColor = this.lerpColor(targetConfig.color, lightningConfig.color, 0.5); // 50/50 blend
      this.currentAlpha = Math.max(targetConfig.alpha, lightningConfig.alpha); // Use the stronger alpha
    }
    
    // Reset state change progress since weather overrides normal transitions
    this.stateChangeProgress = 1.0;
  } 
    else if (isTransitioning) {
      // During active transitions (sunset entering, sunrise leaving)
      if (timeOfDay === 'sunset') {
        // Fading from day (no overlay) to sunset overlay
        // transitionAlpha goes 0→255, so easedT goes 0→1
        const dayConfig = this.config.day;
        this.currentColor = this.lerpColor(dayConfig.color, targetConfig.color, easedT);
        this.currentAlpha = this.lerp(dayConfig.alpha, targetConfig.alpha, easedT);
      }
      else if (timeOfDay === 'sunrise') {
        // Fading from night → sunrise → day
        // transitionAlpha goes 255→0, so we need to INVERT easedT
        const nightConfig = this.config.night;
        const dayConfig = this.config.day;
        const invertedT = 1.0 - easedT; // Invert since alpha is decreasing
        
        // First half: transition from night to sunrise (0.0 → 0.5)
        // Second half: transition from sunrise to day (0.5 → 1.0)
        if (invertedT < 0.5) {
          // Night → Sunrise (first half of sunrise period)
          const halfT = invertedT * 2.0; // Map 0→0.5 to 0→1
          this.currentColor = this.lerpColor(nightConfig.color, targetConfig.color, halfT);
          this.currentAlpha = this.lerp(nightConfig.alpha, targetConfig.alpha, halfT);
        } else {
          // Sunrise → Day (second half of sunrise period)
          const halfT = (invertedT - 0.5) * 2.0; // Map 0.5→1.0 to 0→1
          this.currentColor = this.lerpColor(targetConfig.color, dayConfig.color, halfT);
          this.currentAlpha = this.lerp(targetConfig.alpha, dayConfig.alpha, halfT);
        }
      }
      // Reset state change progress during active transitions
      this.stateChangeProgress = 1.0;
    } else {
      // Not actively transitioning - stable state
      // Gradually settle into stable states to avoid jarring jumps
      if (this.stateChangeProgress < 1.0) {
        this.stateChangeProgress = Math.min(1.0, this.stateChangeProgress + this.stateChangeSpeed);
        const settleT = this.easeInOutCubic(this.stateChangeProgress);
        
        // Get the previous config to interpolate from (use the OLD time of day)
        let sourceConfig;
        if (timeOfDay === 'night' && oldTimeOfDay === 'sunset') {
          // Coming from sunset - smooth transition to night
          sourceConfig = this.config.sunset;
        } else if (timeOfDay === 'day' && oldTimeOfDay === 'sunrise') {
          // Coming from sunrise - smooth transition to day
          sourceConfig = this.config.sunrise;
        } else {
          // Already at stable state or first initialization
          sourceConfig = targetConfig;
        }
        
        // Smoothly interpolate to target
        this.currentColor = this.lerpColor(sourceConfig.color, targetConfig.color, settleT);
        this.currentAlpha = this.lerp(sourceConfig.alpha, targetConfig.alpha, settleT);
      } else {
        // Fully settled - use target values
        this.currentColor = targetConfig.color;
        this.currentAlpha = targetConfig.alpha;
      }
    }
  }
  
  /**
   * Render the time-of-day overlay
   * This should be called in the EFFECTS layer after entities but before UI
   */
  render() {
    if (!this.globalTime) return;
    
    // Update state first
    this.update();
    
    // Skip rendering if overlay is transparent
    if (this.currentAlpha <= 0) return;
    
    // Save graphics state
    push();
    
    // No camera transform - render in screen space to cover entire viewport
    // This ensures the overlay covers the game world but stays below the HUD
    
    // Set up overlay fill
    noStroke();
    const [r, g, b] = this.currentColor;
    const alpha = this.currentAlpha * 255; // Convert to 0-255 range for p5.js
    fill(r, g, b, alpha);
    
    // Draw full-screen rectangle
    // Using g_canvasX and g_canvasY to cover the entire canvas
    const canvasWidth = (typeof g_canvasX !== 'undefined') ? g_canvasX : width;
    const canvasHeight = (typeof g_canvasY !== 'undefined') ? g_canvasY : height;
    
    rect(0, 0, canvasWidth, canvasHeight);
    
    // Restore graphics state
    pop();
    
    // Debug info (optional)
    if (this.debugMode) {
      this.renderDebugInfo();
    }
  }
  
  /**
   * Render debug information about current overlay state
   */
  renderDebugInfo() {
    push();
    fill(255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(12);
    
    const debugX = 10;
    const debugY = 100;
    const lineHeight = 16;
    
    text(`Time of Day: ${this.globalTime.timeOfDay}`, debugX, debugY);
    text(`Transitioning: ${this.globalTime.transitioning}`, debugX, debugY + lineHeight);
    text(`Transition Alpha: ${this.globalTime.transitionAlpha.toFixed(1)}`, debugX, debugY + lineHeight * 2);
    text(`Overlay Alpha: ${(this.currentAlpha * 100).toFixed(1)}%`, debugX, debugY + lineHeight * 3);
    text(`In-Game Seconds: ${this.globalTime.inGameSeconds}`, debugX, debugY + lineHeight * 4);
    text(`In-Game Days: ${this.globalTime.inGameDays}`, debugX, debugY + lineHeight * 5);
    
    pop();
  }
  
  /**
   * Toggle debug mode
   */
  toggleDebug() {
    this.debugMode = !this.debugMode;
    console.log(`🌅 TimeOfDayOverlay debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
    return this.debugMode;
  }
  
  /**
   * Update overlay configuration
   * @param {string} timeOfDay - 'day', 'sunset', 'night', or 'sunrise'
   * @param {object} config - { color: [r,g,b], alpha: number }
   */
  setConfig(timeOfDay, config) {
    if (!this.config[timeOfDay]) {
      console.warn(`Unknown time of day: ${timeOfDay}`);
      return false;
    }
    
    if (config.color) {
      this.config[timeOfDay].color = config.color;
    }
    
    if (typeof config.alpha === 'number') {
      this.config[timeOfDay].alpha = Math.max(0, Math.min(1, config.alpha));
    }
    
    console.log(`🌅 Updated ${timeOfDay} config:`, this.config[timeOfDay]);
    return true;
  }
  
  /**
   * Get current overlay configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Force a specific time of day (for testing)
   * @param {string} timeOfDay - 'day', 'sunset', 'night', or 'sunrise'
   */
  forceTimeOfDay(timeOfDay) {
    if (!this.config[timeOfDay]) {
      console.warn(`Unknown time of day: ${timeOfDay}`);
      return false;
    }
    
    if (this.globalTime) {
      this.globalTime.timeOfDay = timeOfDay;
      this.globalTime.transitioning = false;
      this.globalTime.transitionAlpha = (timeOfDay === 'night' || timeOfDay === 'sunrise') ? 255 : 0;
      console.log(`🌅 Forced time of day: ${timeOfDay}`);
      return true;
    }
    
    return false;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlobalTime, TimeOfDayOverlay };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.GlobalTime = GlobalTime;
  window.TimeOfDayOverlay = TimeOfDayOverlay;
  
  // Add console commands for easy testing
  window.setTimeOfDay = function(timeOfDay) {
    if (!window.g_timeOfDayOverlay) {
      console.error('❌ TimeOfDayOverlay not initialized');
      return false;
    }
    return window.g_timeOfDayOverlay.forceTimeOfDay(timeOfDay);
  };
  
  window.toggleTimeDebug = function() {
    if (!window.g_timeOfDayOverlay) {
      console.error('❌ TimeOfDayOverlay not initialized');
      return false;
    }
    return window.g_timeOfDayOverlay.toggleDebug();
  };
  
  window.getTimeConfig = function() {
    if (!window.g_timeOfDayOverlay) {
      console.error('❌ TimeOfDayOverlay not initialized');
      return null;
    }
    const config = window.g_timeOfDayOverlay.getConfig();
    console.log('🌅 Time of Day Configuration:');
    console.table(config);
    return config;
  };
  
  window.setTimeConfig = function(timeOfDay, color, alpha) {
    if (!window.g_timeOfDayOverlay) {
      console.error('❌ TimeOfDayOverlay not initialized');
      return false;
    }
    
    const config = {};
    if (color) config.color = color;
    if (typeof alpha === 'number') config.alpha = alpha;
    
    return window.g_timeOfDayOverlay.setConfig(timeOfDay, config);
  };
  
  console.log('🌅 TimeOfDayOverlay console commands available:');
  console.log('  setTimeOfDay("day"|"sunset"|"night"|"sunrise") - Force a specific time');
  console.log('  toggleTimeDebug() - Show/hide debug info');
  console.log('  getTimeConfig() - View current overlay settings');
  console.log('  setTimeConfig(timeOfDay, [r,g,b], alpha) - Customize overlay');
}
