/**
 * @fileoverview Slider.js - Reusable slider component for UI panels
 * Generic slider component that can be used for color values, settings, or any numeric input
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * @typedef {Object} SliderConfig
 * @property {string} label - Display label for the slider
 * @property {number} value - Current slider value
 * @property {number} min - Minimum value (default: 0)
 * @property {number} max - Maximum value (default: 255)
 * @property {number} step - Step size for value changes (default: 1)
 * @property {number[]} color - RGB color array for the slider track [r, g, b]
 * @property {Function} onChange - Callback function when value changes
 * @property {boolean} showValue - Whether to display the numeric value (default: true)
 * @property {string} [valueFormat] - Format string for value display (default: rounds to integer)
 * @property {number} [precision] - Decimal precision for display (default: 0)
 */

/**
 * @typedef {Object} SliderDimensions
 * @property {number} x - X position
 * @property {number} y - Y position  
 * @property {number} width - Total slider width
 * @property {number} labelWidth - Width reserved for label (default: 80px)
 * @property {number} valueWidth - Width reserved for value display (default: 40px)
 * @property {number} height - Slider track height (default: 12px)
 * @property {number} handleSize - Size of the slider handle (default: 18px)
 */

/**
 * Reusable Slider Component
 * Creates interactive sliders for numeric input with customizable appearance and behavior
 * 
 * @class Slider
 * @example
 * // Create a color slider
 * const redSlider = new Slider({
 *   label: 'Red',
 *   value: 128,
 *   min: 0,
 *   max: 255,
 *   color: [255, 0, 0],
 *   onChange: (value) => console.log('Red value:', value)
 * });
 * 
 * // Render the slider
 * redSlider.render(50, 100, 300);
 * 
 * // Update the slider (call in your update loop)
 * redSlider.update(mouseX, mouseY, mouseIsPressed);
 */
class Slider {
  /**
   * Creates a new Slider instance
   * 
   * @param {SliderConfig} config - Slider configuration
   */
  constructor(config) {
    // Validate required parameters
    if (!config || typeof config.label !== 'string') {
      throw new Error('Slider requires a valid label');
    }
    
    if (typeof config.value !== 'number') {
      throw new Error('Slider requires a valid numeric value');
    }
    
    if (typeof config.onChange !== 'function') {
      throw new Error('Slider requires an onChange callback function');
    }
    
    // Store configuration
    this.label = config.label;
    this.value = config.value;
    this.min = config.min ?? 0;
    this.max = config.max ?? 255;
    this.step = config.step ?? 1;
    this.color = config.color || [128, 128, 128];
    this.onChange = config.onChange;
    this.showValue = config.showValue ?? true;
    this.valueFormat = config.valueFormat;
    this.precision = config.precision ?? 0;
    this.valueWidth = 0;
    
    // Internal state
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Cached dimensions (set during render)
    this.bounds = {
      x: 0, y: 0, width: 0, height: 0,
      sliderX: 0, sliderY: 0, sliderWidth: 0, sliderHeight: 0,
      handleX: 0, handleY: 0
    };
    
    console.log(`🎚️ Slider created: ${this.label} (${this.min}-${this.max})`);
  }
  
  /**
   * Update slider interaction state
   * Call this every frame in your update loop
   * 
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   * @param {boolean} mousePressed - Whether mouse is currently pressed
   * @returns {boolean} True if slider value changed this frame
   */
  update(mouseX, mouseY, mousePressed) {
    if (typeof mouseX !== 'number' || typeof mouseY !== 'number') return false;
    
    const wasPressed = this.isDragging;
    let valueChanged = false;
    
    // Check if mouse is over slider area
    const overSlider = this.isMouseOverSlider(mouseX, mouseY);
    
    // Handle mouse press/drag
    if (mousePressed && overSlider && !wasPressed) {
      // Start dragging
      this.isDragging = true;
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
      valueChanged = this.updateValueFromMouse(mouseX);
    } else if (mousePressed && this.isDragging) {
      // Continue dragging
      valueChanged = this.updateValueFromMouse(mouseX);
      this.lastMouseX = mouseX;
      this.lastMouseY = mouseY;
    } else if (!mousePressed && this.isDragging) {
      // Stop dragging
      this.isDragging = false;
    }
    
    return valueChanged;
  }
  
  /**
   * Render the slider at the specified position
   * 
   * @param {number} x - X position
   * @param {number} y - Y position (center of slider)
   * @param {number} width - Total width available for slider
   * @param {SliderDimensions} [dimensions] - Custom dimension overrides
   */
  render(x, y, width, dimensions = {}) {
    if (typeof text === 'undefined' || typeof fill === 'undefined' || typeof rect === 'undefined') {
      console.warn('🎚️ p5.js functions not available for slider rendering');
      return;
    }
    
    // Calculate dimensions
    const labelWidth = dimensions.labelWidth ?? 80;
    this.valueWidth = this.showValue ? (dimensions.valueWidth ?? 40) : 0;
    const sliderHeight = dimensions.height ?? 12;
    const handleSize = dimensions.handleSize ?? 18;
    
    const sliderX = x + labelWidth + 10;
    const sliderY = y - sliderHeight / 2;
    const sliderWidth = width - labelWidth - this.valueWidth - 20;
    
    // Store bounds for interaction
    this.bounds = {
      x, y: y - handleSize/2, width, height: handleSize,
      sliderX, sliderY, sliderWidth, sliderHeight,
      handleX: 0, handleY: y
    };
    push();
    noStroke();
    // Render label
    fill(220, 220, 240);
    if (typeof textAlign === 'function') textAlign(LEFT, CENTER);
    if (typeof textSize === 'function') textSize(13);
    text(`${this.label}:`, x, y);
    
    // Render value display
    if (this.showValue) {
      fill(180, 180, 200);
      if (typeof textAlign === 'function') textAlign(RIGHT, CENTER);
      const displayValue = this.formatValue(this.value);
      text(displayValue, x + labelWidth + sliderWidth + 15, y);
    }
    
    // Render slider track background
    fill(50, 50, 60);
    stroke(100, 100, 120);
    if (typeof strokeWeight === 'function') strokeWeight(1);
    rect(sliderX, sliderY, sliderWidth, sliderHeight, 6);
    
    // Render slider value bar
    const normalizedValue = (this.value - this.min) / (this.max - this.min);
    this.valueWidth = normalizedValue * sliderWidth;
    
    fill(...this.color, 180);
    if (typeof noStroke === 'function') noStroke();
    rect(sliderX, sliderY, this.valueWidth, sliderHeight, 6);

    // Render slider handle
    const handleX = sliderX + this.valueWidth;
    this.bounds.handleX = handleX;
    
    // Handle styling based on interaction state
    if (this.isDragging) {
      fill(255, 255, 255);
      stroke(200, 200, 255);
      if (typeof strokeWeight === 'function') strokeWeight(2);
    } else if (this.isMouseOverSlider(typeof mouseX !== 'undefined' ? mouseX : 0, 
                                       typeof mouseY !== 'undefined' ? mouseY : 0)) {
      fill(240, 240, 240);
      stroke(160, 160, 180);
      if (typeof strokeWeight === 'function') strokeWeight(1);
    } else {
      fill(255, 255, 255);
      stroke(120, 120, 140);
      if (typeof strokeWeight === 'function') strokeWeight(1);
    }
    
    if (typeof ellipse === 'function') {
      ellipse(handleX, y, handleSize);
    }
    pop();
  }
  
  /**
   * Set the slider value programmatically
   * 
   * @param {number} newValue - New value to set
   * @param {boolean} [triggerCallback=true] - Whether to trigger onChange callback
   */
  setValue(newValue, triggerCallback = true) {
    const clampedValue = this.clampValue(newValue);
    const oldValue = this.value;
    this.value = clampedValue;
    
    if (triggerCallback && clampedValue !== oldValue && this.onChange) {
      this.onChange(clampedValue, this.label);
    }
  }
  
  /**
   * Get the current slider value
   * 
   * @returns {number} Current value
   */
  getValue() {
    return this.value;
  }
  
  /**
   * Update slider configuration
   * 
   * @param {Partial<SliderConfig>} config - Configuration updates
   */
  updateConfig(config) {
    if (config.label !== undefined) this.label = config.label;
    if (config.min !== undefined) this.min = config.min;
    if (config.max !== undefined) this.max = config.max;
    if (config.step !== undefined) this.step = config.step;
    if (config.color !== undefined) this.color = config.color;
    if (config.onChange !== undefined) this.onChange = config.onChange;
    if (config.showValue !== undefined) this.showValue = config.showValue;
    if (config.valueFormat !== undefined) this.valueFormat = config.valueFormat;
    if (config.precision !== undefined) this.precision = config.precision;
    
    // Re-clamp value if range changed
    if (config.min !== undefined || config.max !== undefined) {
      this.setValue(this.value, false); // Don't trigger callback for range adjustment
    }
  }
  
  // ===== PRIVATE METHODS =====
  
  /**
   * Check if mouse is over the slider interaction area
   * 
   * @private
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if mouse is over slider
   */
  isMouseOverSlider(mouseX, mouseY) {
    return mouseX >= this.bounds.sliderX && 
           mouseX <= this.bounds.sliderX + this.bounds.sliderWidth &&
           mouseY >= this.bounds.y && 
           mouseY <= this.bounds.y + this.bounds.height;
  }
  
  /**
   * Update slider value based on mouse position
   * 
   * @private
   * @param {number} mouseX - Mouse X position
   * @returns {boolean} True if value changed
   */
  updateValueFromMouse(mouseX) {
    const relativeX = mouseX - this.bounds.sliderX;
    const normalizedValue = relativeX / this.bounds.sliderWidth;
    const rawValue = this.min + normalizedValue * (this.max - this.min);
    const newValue = this.clampValue(rawValue);
    
    if (newValue !== this.value) {
      const oldValue = this.value;
      this.value = newValue;
      
      if (this.onChange) {
        this.onChange(newValue, this.label);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Clamp value to valid range and apply step sizing
   * 
   * @private
   * @param {number} value - Raw value to clamp
   * @returns {number} Clamped and stepped value
   */
  clampValue(value) {
    // Apply step sizing
    const steppedValue = Math.round(value / this.step) * this.step;
    
    // Clamp to range
    return Math.max(this.min, Math.min(this.max, steppedValue));
  }
  
  /**
   * Format value for display
   * 
   * @private
   * @param {number} value - Value to format
   * @returns {string} Formatted value string
   */
  formatValue(value) {
    if (this.valueFormat) {
      return this.valueFormat.replace('{value}', value.toFixed(this.precision));
    }
    
    return value.toFixed(this.precision);
  }
}

/**
 * Utility function to create a group of sliders for related values
 * 
 * @param {SliderConfig[]} sliderConfigs - Array of slider configurations
 * @returns {Slider[]} Array of created sliders
 * 
 * @example
 * // Create RGB color sliders
 * const colorSliders = createSliderGroup([
 *   { label: 'Red', value: 255, color: [255, 0, 0], onChange: (v) => updateColor('r', v) },
 *   { label: 'Green', value: 128, color: [0, 255, 0], onChange: (v) => updateColor('g', v) },
 *   { label: 'Blue', value: 64, color: [0, 0, 255], onChange: (v) => updateColor('b', v) }
 * ]);
 */
function createSliderGroup(sliderConfigs) {
  if (!Array.isArray(sliderConfigs)) {
    throw new Error('createSliderGroup requires an array of slider configurations');
  }
  
  return sliderConfigs.map(config => new Slider(config));
}

/**
 * Utility function to render a group of sliders with consistent spacing
 * 
 * @param {Slider[]} sliders - Array of sliders to render
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position  
 * @param {number} width - Width available for each slider
 * @param {number} [spacing=40] - Vertical spacing between sliders
 * @param {SliderDimensions} [dimensions] - Custom dimension overrides
 * 
 * @example
 * // Render color sliders with 45px spacing
 * renderSliderGroup(colorSliders, 50, 100, 300, 45);
 */
function renderSliderGroup(sliders, x, y, width, spacing = 40, dimensions = {}) {
  if (!Array.isArray(sliders)) {
    console.warn('🎚️ renderSliderGroup requires an array of sliders');
    return;
  }
  
  sliders.forEach((slider, index) => {
    if (slider && typeof slider.render === 'function') {
      slider.render(x, y + (index * spacing), width, dimensions);
    }
  });
}

/**
 * Utility function to update a group of sliders
 * 
 * @param {Slider[]} sliders - Array of sliders to update
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @param {boolean} mousePressed - Whether mouse is pressed
 * @returns {boolean} True if any slider value changed
 * 
 * @example
 * // Update all sliders and check if any changed
 * const anyChanged = updateSliderGroup(colorSliders, mouseX, mouseY, mouseIsPressed);
 * if (anyChanged) {
 *   console.log('Slider values updated');
 * }
 */
function updateSliderGroup(sliders, mouseX, mouseY, mousePressed) {
  if (!Array.isArray(sliders)) {
    return false;
  }
  
  let anyChanged = false;
  
  sliders.forEach(slider => {
    if (slider && typeof slider.update === 'function') {
      const changed = slider.update(mouseX, mouseY, mousePressed);
      anyChanged = anyChanged || changed;
    }
  });
  
  return anyChanged;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    Slider, 
    createSliderGroup, 
    renderSliderGroup, 
    updateSliderGroup 
  };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.Slider = Slider;
  window.createSliderGroup = createSliderGroup;
  window.renderSliderGroup = renderSliderGroup;
  window.updateSliderGroup = updateSliderGroup;
}