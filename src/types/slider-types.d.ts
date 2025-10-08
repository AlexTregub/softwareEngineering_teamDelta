/**
 * @fileoverview TypeScript definitions for Slider component
 * Generic slider component with comprehensive IntelliSense support
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

declare namespace SliderTypes {
  /**
   * Configuration object for creating a new Slider instance
   */
  interface SliderConfig {
    /** Display label for the slider */
    label: string;
    
    /** Current slider value */
    value: number;
    
    /** Minimum value (default: 0) */
    min?: number;
    
    /** Maximum value (default: 255) */
    max?: number;
    
    /** Step size for value changes (default: 1) */
    step?: number;
    
    /** RGB color array for the slider track [r, g, b] */
    color?: [number, number, number];
    
    /** Callback function when value changes */
    onChange: (value: number, label: string) => void;
    
    /** Whether to display the numeric value (default: true) */
    showValue?: boolean;
    
    /** Format string for value display (default: rounds to integer) */
    valueFormat?: string;
    
    /** Decimal precision for display (default: 0) */
    precision?: number;
  }
  
  /**
   * Dimensions configuration for slider rendering
   */
  interface SliderDimensions {
    /** X position */
    x?: number;
    
    /** Y position */
    y?: number;
    
    /** Total slider width */
    width?: number;
    
    /** Width reserved for label (default: 80px) */
    labelWidth?: number;
    
    /** Width reserved for value display (default: 40px) */
    valueWidth?: number;
    
    /** Slider track height (default: 12px) */
    height?: number;
    
    /** Size of the slider handle (default: 18px) */
    handleSize?: number;
  }
  
  /**
   * Bounds information for slider interaction
   */
  interface SliderBounds {
    /** Overall slider X position */
    x: number;
    
    /** Overall slider Y position */
    y: number;
    
    /** Overall slider width */
    width: number;
    
    /** Overall slider height */
    height: number;
    
    /** Slider track X position */
    sliderX: number;
    
    /** Slider track Y position */
    sliderY: number;
    
    /** Slider track width */
    sliderWidth: number;
    
    /** Slider track height */
    sliderHeight: number;
    
    /** Current handle X position */
    handleX: number;
    
    /** Current handle Y position */
    handleY: number;
  }
}

/**
 * Reusable Slider Component Class
 * Creates interactive sliders for numeric input with customizable appearance and behavior
 */
declare class Slider {
  /** Current slider label */
  readonly label: string;
  
  /** Current slider value */
  readonly value: number;
  
  /** Minimum allowed value */
  readonly min: number;
  
  /** Maximum allowed value */
  readonly max: number;
  
  /** Step size for value changes */
  readonly step: number;
  
  /** RGB color array for slider track */
  readonly color: [number, number, number];
  
  /** Whether to show numeric value */
  readonly showValue: boolean;
  
  /** Value format string */
  readonly valueFormat?: string;
  
  /** Decimal precision for display */
  readonly precision: number;
  
  /** Whether slider is currently being dragged */
  readonly isDragging: boolean;
  
  /** Cached bounds for interaction */
  readonly bounds: SliderTypes.SliderBounds;
  
  /**
   * Creates a new Slider instance
   * @param config - Slider configuration object
   * @throws {Error} When required parameters are missing or invalid
   * 
   * @example
   * ```javascript
   * const redSlider = new Slider({
   *   label: 'Red',
   *   value: 128,
   *   min: 0,
   *   max: 255,
   *   color: [255, 0, 0],
   *   onChange: (value) => console.log('Red value:', value)
   * });
   * ```
   */
  constructor(config: SliderTypes.SliderConfig);
  
  /**
   * Update slider interaction state
   * Call this every frame in your update loop
   * 
   * @param mouseX - Current mouse X position
   * @param mouseY - Current mouse Y position  
   * @param mousePressed - Whether mouse is currently pressed
   * @returns True if slider value changed this frame
   * 
   * @example
   * ```javascript
   * // In your update loop
   * const changed = slider.update(mouseX, mouseY, mouseIsPressed);
   * if (changed) {
   *   console.log('Slider value changed to:', slider.getValue());
   * }
   * ```
   */
  update(mouseX: number, mouseY: number, mousePressed: boolean): boolean;
  
  /**
   * Render the slider at the specified position
   * 
   * @param x - X position
   * @param y - Y position (center of slider)
   * @param width - Total width available for slider
   * @param dimensions - Custom dimension overrides
   * 
   * @example
   * ```javascript
   * // Render with default dimensions
   * slider.render(50, 100, 300);
   * 
   * // Render with custom dimensions
   * slider.render(50, 100, 300, {
   *   labelWidth: 100,
   *   height: 16,
   *   handleSize: 20
   * });
   * ```
   */
  render(x: number, y: number, width: number, dimensions?: SliderTypes.SliderDimensions): void;
  
  /**
   * Set the slider value programmatically
   * 
   * @param newValue - New value to set
   * @param triggerCallback - Whether to trigger onChange callback (default: true)
   * 
   * @example
   * ```javascript
   * // Set value and trigger onChange
   * slider.setValue(200);
   * 
   * // Set value without triggering onChange
   * slider.setValue(200, false);
   * ```
   */
  setValue(newValue: number, triggerCallback?: boolean): void;
  
  /**
   * Get the current slider value
   * 
   * @returns Current value
   * 
   * @example
   * ```javascript
   * const currentValue = slider.getValue();
   * console.log('Current slider value:', currentValue);
   * ```
   */
  getValue(): number;
  
  /**
   * Update slider configuration
   * 
   * @param config - Configuration updates
   * 
   * @example
   * ```javascript
   * // Update slider range
   * slider.updateConfig({
   *   min: -100,
   *   max: 100,
   *   step: 5
   * });
   * 
   * // Update slider appearance
   * slider.updateConfig({
   *   color: [0, 255, 128],
   *   precision: 2
   * });
   * ```
   */
  updateConfig(config: Partial<SliderTypes.SliderConfig>): void;
}

/**
 * Utility function to create a group of sliders for related values
 * 
 * @param sliderConfigs - Array of slider configurations
 * @returns Array of created sliders
 * 
 * @example
 * ```javascript
 * // Create RGB color sliders
 * const colorSliders = createSliderGroup([
 *   { label: 'Red', value: 255, color: [255, 0, 0], onChange: (v) => updateColor('r', v) },
 *   { label: 'Green', value: 128, color: [0, 255, 0], onChange: (v) => updateColor('g', v) },
 *   { label: 'Blue', value: 64, color: [0, 0, 255], onChange: (v) => updateColor('b', v) }
 * ]);
 * ```
 */
declare function createSliderGroup(sliderConfigs: SliderTypes.SliderConfig[]): Slider[];

/**
 * Utility function to render a group of sliders with consistent spacing
 * 
 * @param sliders - Array of sliders to render
 * @param x - Starting X position
 * @param y - Starting Y position
 * @param width - Width available for each slider
 * @param spacing - Vertical spacing between sliders (default: 40)
 * @param dimensions - Custom dimension overrides
 * 
 * @example
 * ```javascript
 * // Render color sliders with 45px spacing
 * renderSliderGroup(colorSliders, 50, 100, 300, 45);
 * 
 * // Render with custom dimensions
 * renderSliderGroup(sliders, 50, 100, 300, 40, {
 *   labelWidth: 120,
 *   handleSize: 24
 * });
 * ```
 */
declare function renderSliderGroup(
  sliders: Slider[], 
  x: number, 
  y: number, 
  width: number, 
  spacing?: number, 
  dimensions?: SliderTypes.SliderDimensions
): void;

/**
 * Utility function to update a group of sliders
 * 
 * @param sliders - Array of sliders to update
 * @param mouseX - Mouse X position
 * @param mouseY - Mouse Y position
 * @param mousePressed - Whether mouse is pressed
 * @returns True if any slider value changed
 * 
 * @example
 * ```javascript
 * // Update all sliders and check if any changed
 * const anyChanged = updateSliderGroup(colorSliders, mouseX, mouseY, mouseIsPressed);
 * if (anyChanged) {
 *   console.log('Slider values updated');
 * }
 * ```
 */
declare function updateSliderGroup(
  sliders: Slider[], 
  mouseX: number, 
  mouseY: number, 
  mousePressed: boolean
): boolean;

// Global slider utilities available in browser environment
declare global {
  var Slider: typeof Slider;
  var createSliderGroup: typeof createSliderGroup;
  var renderSliderGroup: typeof renderSliderGroup;
  var updateSliderGroup: typeof updateSliderGroup;
}