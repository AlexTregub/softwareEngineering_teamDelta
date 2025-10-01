/**
 * @fileoverview Universal Object Debugger for runtime introspection and visualization.
 * Provides comprehensive debugging capabilities for any JavaScript object with
 * property extraction, method discovery, visual overlays, and interactive controls.
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Configuration object for debugger appearance and behavior.
 * @typedef {Object} DebuggerConfig
 * @property {string} borderColor - Color for bounding box outlines
 * @property {string} fillColor - Color for bounding box fills  
 * @property {number} borderWidth - Width of bounding box borders
 * @property {boolean} showProperties - Whether to display object properties
 * @property {boolean} showMethods - Whether to display object methods
 * @property {boolean} showGetters - Whether to display getter properties
 * @property {boolean} showSetters - Whether to display setter properties
 * @property {number} maxDepth - Maximum depth for nested object inspection
 * @property {number} fontSize - Font size for debug text
 */

/**
 * Universal debugger for runtime object introspection and visualization.
 * Attaches to any JavaScript object to provide debugging capabilities.
 */
class UniversalDebugger {
  /**
   * Creates a new UniversalDebugger instance.
   * 
   * @param {Object} targetObject - The object to debug
   * @param {DebuggerConfig} [config={}] - Configuration options
   */
  constructor(targetObject, config = {}) {
    this.target = targetObject;
    this.config = {
      borderColor: '#FF0000',
      fillColor: 'rgba(255, 0, 0, 0)',
      borderWidth: 2,
      showBoundingBox: true,
      showPropertyPanel: true,
      showProperties: true,
      showMethods: true,
      showGetters: true,
      showSetters: true,
      autoRefresh: false,
      maxDepth: 3,
      fontSize: 12,
      ...config
    };
    
    this.isActive = false;
    this.introspectionData = null;
    this.boundingBox = null;
    this.debugUI = null;
    
    this._initialize();
  }

  /**
   * Initializes the debugger by performing initial introspection.
   * 
   * @private
   */
  _initialize() {
    this.introspectionData = this._performIntrospection();
    this.boundingBox = this._extractBoundingInfo();
  }

  /**
   * Activates the debugger, making it visible and interactive.
   * 
   * @public
   */
  activate() {
    this.isActive = true;
  }

  /**
   * Deactivates the debugger, hiding all visual elements.
   * 
   * @public
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * Toggles the debugger active state.
   * 
   * @public
   */
  toggle() {
    this.isActive = !this.isActive;
  }

  /**
   * Main render method - draws all debug visualizations if active.
   * 
   * @public
   */
  render() {
    if (!this.isActive) return;
    
    this._refreshBoundingInfo();
    this._drawBoundingBox();
    this._drawPropertyPanel();
  }

  /**
   * Updates the debugger state and refreshes introspection data.
   * 
   * @public
   */
  update() {
    if (!this.isActive) return;
    
    // Refresh introspection data periodically for dynamic properties
    this.introspectionData = this._performIntrospection();
  }

  /**
   * Gets comprehensive debug information about the target object.
   * 
   * @returns {Object} Complete debug information structure
   * @public
   */
  getDebugInfo() {
    return {
      targetType: this._getObjectType(),
      isActive: this.isActive,
      boundingBox: this.boundingBox,
      introspection: this.introspectionData,
      config: this.config
    };
  }

  /**
   * Performs comprehensive introspection of the target object.
   * 
   * @returns {Object} Structured introspection data
   * @private
   */
  _performIntrospection() {
    return {
      objectType: this._getObjectType(),
      properties: this._extractProperties(),
      methods: this._extractMethods(),
      getters: this._extractGetters(),
      setters: this._extractSetters(),
      prototype: this._extractPrototypeInfo(),
      constructor: this._extractConstructorInfo()
    };
  }

  /**
   * Determines the type and class hierarchy of the target object.
   * 
   * @returns {Object} Type information including constructor name and inheritance chain
   * @private
   */
  _getObjectType() {
    const obj = this.target;
    const result = {
      primitive: typeof obj,
      constructor: obj?.constructor?.name || 'Unknown',
      inheritanceChain: []
    };

    // Build inheritance chain
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== Object.prototype) {
      if (proto.constructor && proto.constructor.name) {
        result.inheritanceChain.push(proto.constructor.name);
      }
      proto = Object.getPrototypeOf(proto);
    }

    return result;
  }

  /**
   * Extracts all enumerable and non-enumerable properties from the target object.
   * 
   * @returns {Array<Object>} Array of property descriptors with metadata
   * @private
   */
  _extractProperties() {
    const properties = [];
    const obj = this.target;
    
    // Get all property names (enumerable and non-enumerable)
    const allProps = new Set([
      ...Object.getOwnPropertyNames(obj),
      ...Object.keys(obj)
    ]);

    for (const propName of allProps) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(obj, propName);
        const value = obj[propName];
        
        properties.push({
          name: propName,
          value: this._formatValue(value),
          type: this._getValueType(value),
          writable: descriptor?.writable ?? false,
          enumerable: descriptor?.enumerable ?? false,
          configurable: descriptor?.configurable ?? false,
          hasGetter: typeof descriptor?.get === 'function',
          hasSetter: typeof descriptor?.set === 'function'
        });
      } catch (error) {
        properties.push({
          name: propName,
          value: '<Error accessing property>',
          type: 'error',
          error: error.message
        });
      }
    }

    return properties.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Extracts all methods from the target object and its prototype chain.
   * 
   * @returns {Array<Object>} Array of method descriptors with metadata
   * @private
   */
  _extractMethods() {
    const methods = [];
    const obj = this.target;
    const seen = new Set();

    // Check own methods
    this._extractMethodsFromObject(obj, methods, seen, 'own');

    // Check prototype chain methods
    let proto = Object.getPrototypeOf(obj);
    let depth = 0;
    while (proto && proto !== Object.prototype && depth < this.config.maxDepth) {
      this._extractMethodsFromObject(proto, methods, seen, `prototype-${depth}`);
      proto = Object.getPrototypeOf(proto);
      depth++;
    }

    return methods.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Extracts methods from a specific object level.
   * 
   * @param {Object} obj - Object to extract methods from
   * @param {Array} methods - Array to populate with method data
   * @param {Set} seen - Set to track already-processed method names
   * @param {string} source - Source identifier (own, prototype-0, etc.)
   * @private
   */
  _extractMethodsFromObject(obj, methods, seen, source) {
    const propNames = Object.getOwnPropertyNames(obj);
    
    for (const propName of propNames) {
      if (seen.has(propName)) continue;
      
      try {
        const value = obj[propName];
        if (typeof value === 'function' && propName !== 'constructor') {
          methods.push({
            name: propName,
            source: source,
            length: value.length, // Parameter count
            isAsync: this._isAsyncFunction(value),
            isGenerator: this._isGeneratorFunction(value),
            signature: this._extractFunctionSignature(value)
          });
          seen.add(propName);
        }
      } catch (error) {
        // Skip inaccessible methods
      }
    }
  }

  /**
   * Extracts getter properties from the target object.
   * 
   * @returns {Array<Object>} Array of getter descriptors
   * @private
   */
  _extractGetters() {
    const getters = [];
    const obj = this.target;
    
    for (const propName of Object.getOwnPropertyNames(obj)) {
      const descriptor = Object.getOwnPropertyDescriptor(obj, propName);
      if (descriptor && typeof descriptor.get === 'function') {
        getters.push({
          name: propName,
          hasValue: descriptor.value !== undefined,
          enumerable: descriptor.enumerable
        });
      }
    }

    return getters.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Extracts setter properties from the target object.
   * 
   * @returns {Array<Object>} Array of setter descriptors
   * @private
   */
  _extractSetters() {
    const setters = [];
    const obj = this.target;
    
    for (const propName of Object.getOwnPropertyNames(obj)) {
      const descriptor = Object.getOwnPropertyDescriptor(obj, propName);
      if (descriptor && typeof descriptor.set === 'function') {
        setters.push({
          name: propName,
          hasValue: descriptor.value !== undefined,
          enumerable: descriptor.enumerable
        });
      }
    }

    return setters.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Extracts prototype chain information.
   * 
   * @returns {Array<string>} Array of prototype constructor names
   * @private
   */
  _extractPrototypeInfo() {
    const chain = [];
    let proto = Object.getPrototypeOf(this.target);
    
    while (proto && chain.length < this.config.maxDepth) {
      if (proto.constructor && proto.constructor.name) {
        chain.push(proto.constructor.name);
      }
      proto = Object.getPrototypeOf(proto);
    }
    
    return chain;
  }

  /**
   * Extracts constructor information.
   * 
   * @returns {Object} Constructor metadata
   * @private
   */
  _extractConstructorInfo() {
    const constructor = this.target.constructor;
    if (!constructor) return null;
    
    return {
      name: constructor.name,
      length: constructor.length,
      signature: this._extractFunctionSignature(constructor)
    };
  }

  /**
   * Formats a value for display, handling various data types appropriately.
   * 
   * @param {*} value - Value to format
   * @returns {string} Formatted value string
   * @private
   */
  _formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return `{${Object.keys(value).length} props}`;
    
    return String(value);
  }

  /**
   * Determines the specific type of a value.
   * 
   * @param {*} value - Value to analyze
   * @returns {string} Specific type identifier
   * @private
   */
  _getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    if (typeof value === 'object' && value.constructor) {
      return value.constructor.name.toLowerCase();
    }
    
    return typeof value;
  }

  /**
   * Checks if a function is async.
   * 
   * @param {Function} func - Function to check
   * @returns {boolean} True if function is async
   * @private
   */
  _isAsyncFunction(func) {
    return func.constructor.name === 'AsyncFunction';
  }

  /**
   * Checks if a function is a generator.
   * 
   * @param {Function} func - Function to check
   * @returns {boolean} True if function is a generator
   * @private
   */
  _isGeneratorFunction(func) {
    return func.constructor.name === 'GeneratorFunction';
  }

  /**
   * Extracts function signature from its string representation.
   * 
   * @param {Function} func - Function to analyze
   * @returns {string} Function signature
   * @private
   */
  _extractFunctionSignature(func) {
    const funcStr = func.toString();
    const match = funcStr.match(/^(?:async\s+)?(?:function\s*\*?\s*)?[^(]*\([^)]*\)/);
    return match ? match[0] : 'Unknown signature';
  }

  /**
   * Extracts bounding box information from the target object.
   * Attempts to find position and size properties using common naming patterns.
   * 
   * @returns {Object|null} Bounding box data or null if not detectable
   * @private
   */
  _extractBoundingInfo() {
    const obj = this.target;
    const bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      detected: false,
      source: 'none'
    };

    // Strategy 1: Check for CollisionBox2D or bounds property
    if (obj.bounds && typeof obj.bounds === 'object') {
      if (this._tryExtractFromBounds(obj.bounds, bounds)) {
        bounds.source = 'bounds';
        bounds.detected = true;
        return bounds;
      }
    }

    // Strategy 2: Check for direct position/size properties
    if (this._tryExtractFromPositionSize(obj, bounds)) {
      bounds.source = 'position-size';
      bounds.detected = true;
      return bounds;
    }

    // Strategy 3: Check for sprite property
    if (obj._sprite && this._tryExtractFromSprite(obj._sprite, bounds)) {
      bounds.source = 'sprite';
      bounds.detected = true;
      return bounds;
    }

    // Strategy 4: Check for center and size properties
    if (this._tryExtractFromCenterSize(obj, bounds)) {
      bounds.source = 'center-size';
      bounds.detected = true;
      return bounds;
    }

    return bounds;
  }

  /**
   * Attempts to extract bounds from a bounds object (like CollisionBox2D).
   * 
   * @param {Object} boundsObj - Bounds object to extract from
   * @param {Object} target - Target bounds object to populate
   * @returns {boolean} True if successfully extracted
   * @private
   */
  _tryExtractFromBounds(boundsObj, target) {
    if (typeof boundsObj.x === 'number' && typeof boundsObj.y === 'number' &&
        typeof boundsObj.width === 'number' && typeof boundsObj.height === 'number') {
      target.x = boundsObj.x;
      target.y = boundsObj.y;
      target.width = boundsObj.width;
      target.height = boundsObj.height;
      return true;
    }
    return false;
  }

  /**
   * Attempts to extract bounds from position/size properties.
   * 
   * @param {Object} obj - Object to extract from
   * @param {Object} target - Target bounds object to populate
   * @returns {boolean} True if successfully extracted
   * @private
   */
  _tryExtractFromPositionSize(obj, target) {
    // Try common position property names
    const xProps = ['x', 'posX', 'position.x', '_x'];
    const yProps = ['y', 'posY', 'position.y', '_y'];
    const wProps = ['width', 'w', 'sizeX', 'size.x', '_width'];
    const hProps = ['height', 'h', 'sizeY', 'size.y', '_height'];

    const x = this._getValueFromPropNames(obj, xProps);
    const y = this._getValueFromPropNames(obj, yProps);
    const w = this._getValueFromPropNames(obj, wProps);
    const h = this._getValueFromPropNames(obj, hProps);

    if (typeof x === 'number' && typeof y === 'number' && 
        typeof w === 'number' && typeof h === 'number') {
      target.x = x;
      target.y = y;
      target.width = w;
      target.height = h;
      return true;
    }
    return false;
  }

  /**
   * Attempts to extract bounds from a sprite object.
   * 
   * @param {Object} sprite - Sprite object to extract from
   * @param {Object} target - Target bounds object to populate
   * @returns {boolean} True if successfully extracted
   * @private
   */
  _tryExtractFromSprite(sprite, target) {
    if (sprite.pos && sprite.size && 
        typeof sprite.pos.x === 'number' && typeof sprite.pos.y === 'number' &&
        typeof sprite.size.x === 'number' && typeof sprite.size.y === 'number') {
      target.x = sprite.pos.x;
      target.y = sprite.pos.y;
      target.width = sprite.size.x;
      target.height = sprite.size.y;
      return true;
    }
    return false;
  }

  /**
   * Attempts to extract bounds from center and size properties.
   * 
   * @param {Object} obj - Object to extract from
   * @param {Object} target - Target bounds object to populate
   * @returns {boolean} True if successfully extracted
   * @private
   */
  _tryExtractFromCenterSize(obj, target) {
    if (obj.center && typeof obj.center.x === 'number' && typeof obj.center.y === 'number') {
      const w = this._getValueFromPropNames(obj, ['width', 'w', 'sizeX', 'size.x']);
      const h = this._getValueFromPropNames(obj, ['height', 'h', 'sizeY', 'size.y']);
      
      if (typeof w === 'number' && typeof h === 'number') {
        target.x = obj.center.x - w / 2;
        target.y = obj.center.y - h / 2;
        target.width = w;
        target.height = h;
        return true;
      }
    }
    return false;
  }

  /**
   * Gets a value from an object using multiple possible property names.
   * 
   * @param {Object} obj - Object to search
   * @param {Array<string>} propNames - Array of property names to try
   * @returns {*} First found value or undefined
   * @private
   */
  _getValueFromPropNames(obj, propNames) {
    for (const propName of propNames) {
      try {
        if (propName.includes('.')) {
          const parts = propName.split('.');
          let value = obj;
          for (const part of parts) {
            value = value[part];
            if (value === undefined) break;
          }
          if (value !== undefined) return value;
        } else {
          if (obj[propName] !== undefined) return obj[propName];
        }
      } catch (e) {
        // Continue to next property name
      }
    }
    return undefined;
  }

  /**
   * Refreshes bounding box information from the current object state.
   * 
   * @private
   */
  _refreshBoundingInfo() {
    this.boundingBox = this._extractBoundingInfo();
  }

  /**
   * Draws the bounding box around the target object if bounds are detected.
   * 
   * @private
   */
  _drawBoundingBox() {
    if (!this.boundingBox || !this.boundingBox.detected) return;

    const bounds = this.boundingBox;
    
    // Save current drawing state
    push();
    
    // Only draw border (no fill background)
    noFill();
    stroke(this.config.borderColor);
    strokeWeight(this.config.borderWidth);
    rect(bounds.x, bounds.y, bounds.width, bounds.height);
    
    // Draw corner markers for better visibility
    this._drawCornerMarkers(bounds);
    
    // Draw info label
    this._drawBoundsLabel(bounds);
    
    // Restore drawing state
    pop();
  }

  /**
   * Draws corner markers on the bounding box for better visibility.
   * 
   * @param {Object} bounds - Bounding box data
   * @private
   */
  _drawCornerMarkers(bounds) {
    const markerSize = 6;
    fill(this.config.borderColor);
    noStroke();
    
    // Top-left
    rect(bounds.x - markerSize/2, bounds.y - markerSize/2, markerSize, markerSize);
    // Top-right
    rect(bounds.x + bounds.width - markerSize/2, bounds.y - markerSize/2, markerSize, markerSize);
    // Bottom-left
    rect(bounds.x - markerSize/2, bounds.y + bounds.height - markerSize/2, markerSize, markerSize);
    // Bottom-right
    rect(bounds.x + bounds.width - markerSize/2, bounds.y + bounds.height - markerSize/2, markerSize, markerSize);
  }

  /**
   * Draws an information label showing bounds data.
   * 
   * @param {Object} bounds - Bounding box data
   * @private
   */
  _drawBoundsLabel(bounds) {
    const label = `${this.introspectionData.objectType.constructor} (${bounds.width}×${bounds.height})`;
    const labelX = bounds.x;
    const labelY = bounds.y - 5;
    
    // Draw background for label
    fill(0, 150);
    noStroke();
    const labelWidth = textWidth(label) + 8;
    rect(labelX, labelY - this.config.fontSize - 4, labelWidth, this.config.fontSize + 4);
    
    // Draw text
    fill(255);
    textSize(this.config.fontSize);
    textAlign(LEFT, TOP);
    text(label, labelX + 4, labelY - this.config.fontSize);
  }

  /**
   * Draws the property inspection panel.
   * 
   * @private
   */
  _drawPropertyPanel() {
    if (!this.introspectionData) return;
    
    // For now, just draw a simple property count
    // This will be expanded into a full UI in the next step
    const panelX = 10;
    const panelY = 10;
    const info = this.introspectionData;
    
    push();
    fill(0, 200);
    noStroke();
    rect(panelX, panelY, 250, 100);
    
    fill(255);
    textSize(12);
    textAlign(LEFT, TOP);
    
    let yOffset = panelY + 10;
    text(`Type: ${info.objectType.constructor}`, panelX + 10, yOffset);
    yOffset += 15;
    text(`Properties: ${info.properties.length}`, panelX + 10, yOffset);
    yOffset += 15;
    text(`Methods: ${info.methods.length}`, panelX + 10, yOffset);
    yOffset += 15;
    text(`Getters: ${info.getters.length}`, panelX + 10, yOffset);
    yOffset += 15;
    text(`Setters: ${info.setters.length}`, panelX + 10, yOffset);
    
    pop();
  }
}

// Global debugger management
window.UniversalDebugger = UniversalDebugger;
window._activeDebuggers = window._activeDebuggers || [];