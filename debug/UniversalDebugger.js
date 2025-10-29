/**
 * @fileoverview Universal Object Debugger for runtime introspection and visualization.
 * Provides comprehensive debugging capabilities for any JavaScript object with
 * property extraction, method discovery, visual overlays, and interactive controls.
 * 
 * @author Software Engineering Team Delta - David Willman
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
      showPerformanceGraph: true,
      showProperties: true,
      showMethods: true,
      showGetters: true,
      showSetters: true,
      autoRefresh: false,
      maxDepth: 3,
      fontSize: 12,
      performanceHistoryLength: 60,  // Keep 60 frames of performance data
      graphWidth: 200,
      graphHeight: 100,
      ...config
    };
    
    this.isActive = false;
    this.introspectionData = null;
    this.boundingBox = null;
    this.debugUI = null;
    
    // Performance monitoring
    this.performanceData = {
      updateTimes: [],          // Execution time for update calls
      renderTimes: [],          // Execution time for render calls
      memoryUsage: [],          // Memory snapshots (if available)
      frameCount: 0,            // Total frames monitored
      lastUpdateTime: 0,        // Last update timestamp
      lastRenderTime: 0,        // Last render timestamp
      updateFrequency: 0,       // Updates per second
      renderFrequency: 0,       // Renders per second
      averageUpdateTime: 0,     // Average update execution time
      averageRenderTime: 0,     // Average render execution time
      peakUpdateTime: 0,        // Peak update time
      peakRenderTime: 0         // Peak render time
    };

    // Graph display toggles - default to off for individual graphs
    this.graphToggles = {
      showUpdateGraph: false,
      showRenderGraph: false, 
      showMemoryGraph: false,
      showSummaryGraph: false
    };
    
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
    this._initializePerformanceTracking();
  }

  /**
   * Initializes performance tracking system.
   * 
   * @private
   */
  _initializePerformanceTracking() {
    this.performanceData.lastUpdateTime = performance.now();
    this.performanceData.lastRenderTime = performance.now();
    
    // Initialize arrays with zeros for smooth graph start
    const historyLength = this.config.performanceHistoryLength;
    this.performanceData.updateTimes = new Array(historyLength).fill(0);
    this.performanceData.renderTimes = new Array(historyLength).fill(0);
    this.performanceData.memoryUsage = new Array(historyLength).fill(0);
  }

  /**
   * Records performance data for a specific operation.
   * 
   * @param {string} operation - 'update' or 'render'
   * @param {number} startTime - Performance timestamp when operation started
   * @private
   */
  _recordPerformance(operation, startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const historyLength = this.config.performanceHistoryLength;
    
    if (operation === 'update') {
      this.performanceData.updateTimes.push(duration);
      if (this.performanceData.updateTimes.length > historyLength) {
        this.performanceData.updateTimes.shift();
      }
      
      this.performanceData.lastUpdateTime = endTime;
      this.performanceData.peakUpdateTime = Math.max(this.performanceData.peakUpdateTime, duration);
      
      // Calculate average
      const sum = this.performanceData.updateTimes.reduce((a, b) => a + b, 0);
      this.performanceData.averageUpdateTime = sum / this.performanceData.updateTimes.length;
      
    } else if (operation === 'render') {
      this.performanceData.renderTimes.push(duration);
      if (this.performanceData.renderTimes.length > historyLength) {
        this.performanceData.renderTimes.shift();
      }
      
      this.performanceData.lastRenderTime = endTime;
      this.performanceData.peakRenderTime = Math.max(this.performanceData.peakRenderTime, duration);
      
      // Calculate average
      const sum = this.performanceData.renderTimes.reduce((a, b) => a + b, 0);
      this.performanceData.averageRenderTime = sum / this.performanceData.renderTimes.length;
    }
    
    // Record memory usage if available
    if (typeof performance.memory !== 'undefined') {
      const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      this.performanceData.memoryUsage.push(memoryMB);
      if (this.performanceData.memoryUsage.length > historyLength) {
        this.performanceData.memoryUsage.shift();
      }
    }
    
    this.performanceData.frameCount++;
  }

  /**
   * Calculates current frequency statistics.
   * 
   * @private
   */
  _updateFrequencyStats() {
    const now = performance.now();
    const timeSinceLastUpdate = now - this.performanceData.lastUpdateTime;
    const timeSinceLastRender = now - this.performanceData.lastRenderTime;
    
    // Calculate frequencies (frames per second)
    if (timeSinceLastUpdate > 0) {
      this.performanceData.updateFrequency = 1000 / timeSinceLastUpdate;
    }
    if (timeSinceLastRender > 0) {
      this.performanceData.renderFrequency = 1000 / timeSinceLastRender;
    }
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
    
    const startTime = performance.now();
    
    this._refreshBoundingInfo();
    this._drawBoundingBox();
    this._drawPropertyPanel();
    
    // Draw performance graph if enabled
    if (this.config.showPerformanceGraph) {
      this._drawPerformanceGraph();
    }
    
    // Log hover detection details if mouse is moving
    this._logHoverDebugInfo();
    
    this._recordPerformance('render', startTime);
  }
  
  /**
   * Logs hover detection debugging information when mouse moves.
   * Only active when debugger is visible and mouse has moved.
   * 
   * @private
   */
  _logHoverDebugInfo() {
    if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return;
    
    // Track last mouse position to only log on movement
    if (!this._lastDebugMouseX) this._lastDebugMouseX = mouseX;
    if (!this._lastDebugMouseY) this._lastDebugMouseY = mouseY;
    
    const mouseMoved = (mouseX !== this._lastDebugMouseX || mouseY !== this._lastDebugMouseY);
    if (!mouseMoved) return;
    
    this._lastDebugMouseX = mouseX;
    this._lastDebugMouseY = mouseY;
    
    // Gather coordinate information
    const screenMouse = { x: mouseX, y: mouseY };
    let worldMouse = { x: mouseX, y: mouseY };
    
    if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
      worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
    }
    
    // Get entity positions
    const entityWorldPos = this.target.getPosition ? this.target.getPosition() : 
                           (this.target._collisionBox ? { x: this.target._collisionBox.x, y: this.target._collisionBox.y } : null);
    const spritePos = this.target._sprite ? { x: this.target._sprite.pos.x, y: this.target._sprite.pos.y } : null;
    const collisionPos = this.target._collisionBox ? { x: this.target._collisionBox.x, y: this.target._collisionBox.y } : null;
    
    // Calculate screen position of entity
    let entityScreenPos = entityWorldPos;
    if (entityWorldPos && this.target._renderController && typeof this.target._renderController.worldToScreenPosition === 'function') {
      entityScreenPos = this.target._renderController.worldToScreen(entityWorldPos);
    } else if (entityWorldPos && typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
      entityScreenPos = CoordinateConverter.worldToScreen(entityWorldPos.x, entityWorldPos.y);
    }
    
    // Check if hovering
    const isHovering = this.target._selectionController ? this.target._selectionController.isHovered() : false;
    
    // Log comprehensive info
    logNormal(`[UniversalDebugger] ${this.target.type || 'Entity'} Hover Debug:`);
    logNormal(`  Screen Mouse: (${screenMouse.x.toFixed(0)}, ${screenMouse.y.toFixed(0)})`);
    logNormal(`  World Mouse:  (${worldMouse.x.toFixed(2)}, ${worldMouse.y.toFixed(2)})`);
    if (entityWorldPos) {
      logNormal(`  Entity World: (${entityWorldPos.x.toFixed(2)}, ${entityWorldPos.y.toFixed(2)})`);
    }
    if (entityScreenPos && entityScreenPos !== entityWorldPos) {
      logNormal(`  Entity Screen: (${entityScreenPos.x.toFixed(0)}, ${entityScreenPos.y.toFixed(0)})`);
    }
    
    // ALWAYS show sprite and collision positions
    if (spritePos) {
      const match = spritePos.x === entityWorldPos?.x && spritePos.y === entityWorldPos?.y;
      logNormal(`  Sprite Pos:    (${spritePos.x.toFixed(2)}, ${spritePos.y.toFixed(2)})${match ? ' [OK]' : ' [MISMATCH!]'}`);
    }
    if (collisionPos) {
      const match = collisionPos.x === entityWorldPos?.x && collisionPos.y === entityWorldPos?.y;
      logNormal(`  Collision Pos: (${collisionPos.x.toFixed(2)}, ${collisionPos.y.toFixed(2)})${match ? ' [OK]' : ' [MISMATCH!]'}`);
    }
    
    logNormal(`  Is Hovering: ${isHovering}`);
  }

  /**
   * Updates the debugger state and refreshes introspection data.
   * 
   * @public
   */
  update() {
    if (!this.isActive) return;
    
    const startTime = performance.now();
    
    // Refresh introspection data periodically for dynamic properties
    this.introspectionData = this._performIntrospection();
    
    // Update frequency statistics
    this._updateFrequencyStats();
    
    this._recordPerformance('update', startTime);
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
    let bounds = {
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
    let convertPos = worldToScreen([this.boundingBox.x,this.boundingBox.y])
    this.boundingBox.x = convertPos[0]
    this.boundingBox.y = convertPos[1]
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

  /**
   * Draws a real-time performance graph showing execution times and memory usage.
   * 
   * @private
   */
  _drawPerformanceGraph() {
    if (!this.performanceData || this.performanceData.frameCount < 2) return;
    
    const bounds = this.boundingBox;
    if (!bounds || !bounds.detected) return;
    
    // Position graph to the right of the entity
    const graphX = bounds.x + bounds.width + 10;
    const graphY = bounds.y;
    const graphW = this.config.graphWidth;
    const graphH = this.config.graphHeight;
    
    push();
    
    // Draw graph background
    fill(0, 180);
    stroke(255, 100);
    strokeWeight(1);
    rect(graphX, graphY, graphW, graphH);
    
    // Draw title
    fill(255);
    textSize(10);
    textAlign(LEFT, TOP);
    text(`Performance: ${this.introspectionData.objectType.constructor}`, graphX + 5, graphY + 5);
    
    // Draw toggle buttons
    this._drawGraphToggleButtons(graphX, graphY, graphW);
    
    // Draw performance statistics
    let yPos = graphY + 35; // Moved down to account for toggle buttons
    textSize(8);
    text(`Update: ${this.performanceData.averageUpdateTime.toFixed(2)}ms avg`, graphX + 5, yPos);
    yPos += 10;
    text(`Render: ${this.performanceData.averageRenderTime.toFixed(2)}ms avg`, graphX + 5, yPos);
    yPos += 10;
    text(`Update FPS: ${this.performanceData.updateFrequency.toFixed(1)}`, graphX + 5, yPos);
    yPos += 10;
    text(`Render FPS: ${this.performanceData.renderFrequency.toFixed(1)}`, graphX + 5, yPos);
    
    // Draw performance graphs based on toggles
    const graphStartY = graphY + 75; // Adjusted for buttons
    const enabledGraphs = this._getEnabledGraphCount();
    
    if (enabledGraphs > 0) {
      const graphAreaH = (graphH - 80) / enabledGraphs;
      let currentY = graphStartY;
      
      // Draw summary graph if enabled
      if (this.graphToggles.showSummaryGraph) {
        this._drawSummaryChart(graphX + 5, currentY, graphW - 10, graphAreaH);
        currentY += graphAreaH;
      }
      
      // Draw individual graphs if enabled
      if (this.graphToggles.showUpdateGraph) {
        this._drawPerformanceChart(graphX + 5, currentY, graphW - 10, graphAreaH, 
                                  this.performanceData.updateTimes, 'Update Time (ms)', [0, 255, 0]);
        currentY += graphAreaH;
      }
      
      if (this.graphToggles.showRenderGraph) {
        this._drawPerformanceChart(graphX + 5, currentY, graphW - 10, graphAreaH, 
                                  this.performanceData.renderTimes, 'Render Time (ms)', [0, 100, 255]);
        currentY += graphAreaH;
      }
      
      if (this.graphToggles.showMemoryGraph && this.performanceData.memoryUsage.length > 0 && 
          this.performanceData.memoryUsage.some(m => m > 0)) {
        this._drawPerformanceChart(graphX + 5, currentY, graphW - 10, graphAreaH, 
                                  this.performanceData.memoryUsage, 'Memory (MB)', [255, 100, 0]);
      }
    }
    
    pop();
  }

  /**
   * Draws a single performance chart within the performance graph.
   * 
   * @param {number} x - Chart X position
   * @param {number} y - Chart Y position  
   * @param {number} w - Chart width
   * @param {number} h - Chart height
   * @param {Array<number>} data - Performance data array
   * @param {string} label - Chart label
   * @param {Array<number>} color - RGB color array
   * @private
   */
  _drawPerformanceChart(x, y, w, h, data, label, color) {
    if (data.length < 2) return;
    
    push();
    
    // Draw chart background
    fill(0, 100);
    noStroke();
    rect(x, y, w, h);
    
    // Draw chart border
    noFill();
    stroke(255, 150);
    strokeWeight(1);
    rect(x, y, w, h);
    
    // Calculate data range for scaling
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue;
    const scale = range > 0 ? (h - 10) / range : 1;
    
    // Draw data line
    stroke(color[0], color[1], color[2]);
    strokeWeight(1.5);
    noFill();
    
    beginShape();
    for (let i = 0; i < data.length; i++) {
      const dataX = x + (i / (data.length - 1)) * w;
      const dataY = y + h - 5 - ((data[i] - minValue) * scale);
      vertex(dataX, dataY);
    }
    endShape();
    
    // Draw current value indicator
    if (data.length > 0) {
      const currentValue = data[data.length - 1];
      const currentY = y + h - 5 - ((currentValue - minValue) * scale);
      
      // Current value dot
      fill(color[0], color[1], color[2]);
      noStroke();
      ellipse(x + w - 2, currentY, 4, 4);
      
      // Value text
      fill(255);
      textSize(7);
      textAlign(RIGHT, CENTER);
      text(currentValue.toFixed(2), x + w - 5, currentY);
    }
    
    // Draw label
    fill(color[0], color[1], color[2]);
    textSize(7);
    textAlign(LEFT, TOP);
    text(label, x + 2, y + 2);
    
    // Draw min/max values
    fill(255, 150);
    textSize(6);
    textAlign(LEFT, CENTER);
    if (range > 0) {
      text(maxValue.toFixed(1), x + 2, y + 5);
      text(minValue.toFixed(1), x + 2, y + h - 5);
    }
    
    pop();
  }

  /**
   * Draws toggle buttons for individual graph types.
   * 
   * @param {number} graphX - X position of the graph panel
   * @param {number} graphY - Y position of the graph panel
   * @param {number} graphW - Width of the graph panel
   * @private
   */
  _drawGraphToggleButtons(graphX, graphY, graphW) {
    const buttonY = graphY + 15;
    const buttonW = 15;
    const buttonH = 12;
    const buttonSpacing = 18;
    
    push();
    textSize(8);
    textAlign(CENTER, CENTER);
    
    // Update graph toggle
    const updateX = graphX + 5;
    fill(this.graphToggles.showUpdateGraph ? [0, 255, 0, 100] : [50, 50, 50, 100]);
    stroke(this.graphToggles.showUpdateGraph ? [0, 255, 0] : [100, 100, 100]);
    strokeWeight(1);
    rect(updateX, buttonY, buttonW, buttonH);
    fill(255);
    text('U', updateX + buttonW/2, buttonY + buttonH/2);
    
    // Render graph toggle
    const renderX = updateX + buttonSpacing;
    fill(this.graphToggles.showRenderGraph ? [0, 100, 255, 100] : [50, 50, 50, 100]);
    stroke(this.graphToggles.showRenderGraph ? [0, 100, 255] : [100, 100, 100]);
    rect(renderX, buttonY, buttonW, buttonH);
    fill(255);
    text('R', renderX + buttonW/2, buttonY + buttonH/2);
    
    // Memory graph toggle
    const memoryX = renderX + buttonSpacing;
    fill(this.graphToggles.showMemoryGraph ? [255, 100, 0, 100] : [50, 50, 50, 100]);
    stroke(this.graphToggles.showMemoryGraph ? [255, 100, 0] : [100, 100, 100]);
    rect(memoryX, buttonY, buttonW, buttonH);
    fill(255);
    text('M', memoryX + buttonW/2, buttonY + buttonH/2);
    
    // Summary graph toggle
    const summaryX = memoryX + buttonSpacing;
    fill(this.graphToggles.showSummaryGraph ? [255, 255, 0, 100] : [50, 50, 50, 100]);
    stroke(this.graphToggles.showSummaryGraph ? [255, 255, 0] : [100, 100, 100]);
    rect(summaryX, buttonY, buttonW, buttonH);
    fill(255);
    text('S', summaryX + buttonW/2, buttonY + buttonH/2);
    
    // Check for button clicks
    if (mouseIsPressed && frameCount % 5 === 0) { // Debounce clicks
      this._handleButtonClicks(updateX, renderX, memoryX, summaryX, buttonY, buttonW, buttonH);
    }
    
    pop();
  }

  /**
   * Handles mouse clicks on graph toggle buttons.
   * 
   * @param {number} updateX - X position of update button
   * @param {number} renderX - X position of render button  
   * @param {number} memoryX - X position of memory button
   * @param {number} summaryX - X position of summary button
   * @param {number} buttonY - Y position of all buttons
   * @param {number} buttonW - Button width
   * @param {number} buttonH - Button height
   * @private
   */
  _handleButtonClicks(updateX, renderX, memoryX, summaryX, buttonY, buttonW, buttonH) {
    const mouseXPos = mouseX;
    const mouseYPos = mouseY;
    
    if (mouseYPos >= buttonY && mouseYPos <= buttonY + buttonH) {
      if (mouseXPos >= updateX && mouseXPos <= updateX + buttonW) {
        this.graphToggles.showUpdateGraph = !this.graphToggles.showUpdateGraph;
      } else if (mouseXPos >= renderX && mouseXPos <= renderX + buttonW) {
        this.graphToggles.showRenderGraph = !this.graphToggles.showRenderGraph;
      } else if (mouseXPos >= memoryX && mouseXPos <= memoryX + buttonW) {
        this.graphToggles.showMemoryGraph = !this.graphToggles.showMemoryGraph;
      } else if (mouseXPos >= summaryX && mouseXPos <= summaryX + buttonW) {
        this.graphToggles.showSummaryGraph = !this.graphToggles.showSummaryGraph;
      }
    }
  }

  /**
   * Counts how many graph types are currently enabled.
   * 
   * @returns {number} Number of enabled graph types
   * @private
   */
  _getEnabledGraphCount() {
    let count = 0;
    if (this.graphToggles.showUpdateGraph) count++;
    if (this.graphToggles.showRenderGraph) count++;
    if (this.graphToggles.showMemoryGraph && this.performanceData.memoryUsage.length > 0) count++;
    if (this.graphToggles.showSummaryGraph) count++;
    return count;
  }

  /**
   * Draws a summary chart combining all performance metrics.
   * 
   * @param {number} x - Chart X position
   * @param {number} y - Chart Y position
   * @param {number} w - Chart width
   * @param {number} h - Chart height
   * @private
   */
  _drawSummaryChart(x, y, w, h) {
    if (this.performanceData.frameCount < 2) return;
    
    push();
    
    // Draw chart background
    fill(0, 100);
    noStroke();
    rect(x, y, w, h);
    
    // Draw chart border
    noFill();
    stroke(255, 200);
    strokeWeight(1);
    rect(x, y, w, h);
    
    // Calculate combined performance score (lower is better)
    const combinedData = [];
    const maxLen = Math.max(this.performanceData.updateTimes.length, this.performanceData.renderTimes.length);
    
    for (let i = 0; i < maxLen; i++) {
      const updateTime = i < this.performanceData.updateTimes.length ? this.performanceData.updateTimes[i] : 0;
      const renderTime = i < this.performanceData.renderTimes.length ? this.performanceData.renderTimes[i] : 0;
      combinedData.push(updateTime + renderTime);
    }
    
    if (combinedData.length > 1) {
      // Draw combined performance line
      const maxValue = Math.max(...combinedData);
      const minValue = Math.min(...combinedData);
      const range = maxValue - minValue;
      const scale = range > 0 ? (h - 10) / range : 1;
      
      stroke(255, 255, 0);
      strokeWeight(2);
      noFill();
      
      beginShape();
      for (let i = 0; i < combinedData.length; i++) {
        const dataX = x + (i / (combinedData.length - 1)) * w;
        const dataY = y + h - 5 - ((combinedData[i] - minValue) * scale);
        vertex(dataX, dataY);
      }
      endShape();
      
      // Current value indicator
      if (combinedData.length > 0) {
        const currentValue = combinedData[combinedData.length - 1];
        const currentY = y + h - 5 - ((currentValue - minValue) * scale);
        
        fill(255, 255, 0);
        noStroke();
        ellipse(x + w - 2, currentY, 4, 4);
        
        fill(255);
        textSize(7);
        textAlign(RIGHT, CENTER);
        text(currentValue.toFixed(2), x + w - 5, currentY);
      }
    }
    
    // Draw label and stats
    fill(255, 255, 0);
    textSize(7);
    textAlign(LEFT, TOP);
    text('Combined Performance (ms)', x + 2, y + 2);
    
    // Draw average total time
    const avgTotal = this.performanceData.averageUpdateTime + this.performanceData.averageRenderTime;
    fill(255, 150);
    textSize(6);
    textAlign(LEFT, BOTTOM);
    text(`Avg Total: ${avgTotal.toFixed(2)}ms`, x + 2, y + h - 2);
    
    pop();
  }

  /**
   * Gets current performance statistics and data.
   * 
   * @returns {Object} Performance data and statistics
   * @public
   */
  getPerformanceData() {
    return {
      ...this.performanceData,
      isTracking: this.isActive,
      targetObjectType: this.introspectionData?.objectType?.constructor || 'Unknown',
      targetObjectId: this.target?.id || this.target?.constructor?.name || 'Unknown',
      graphConfig: {
        width: this.config.graphWidth,
        height: this.config.graphHeight,
        historyLength: this.config.performanceHistoryLength
      }
    };
  }

  /**
   * Resets performance tracking data.
   * 
   * @public
   */
  resetPerformanceData() {
    this._initializePerformanceTracking();
    logNormal(`Performance data reset for ${this.introspectionData?.objectType?.constructor || 'object'}`);
  }

  /**
   * Toggles a specific graph type on or off.
   * 
   * @param {string} graphType - Type of graph ('update', 'render', 'memory', 'summary')
   * @param {boolean} [state] - Optional specific state to set (if not provided, toggles current state)
   * @public
   */
  toggleGraph(graphType, state) {
    const toggleMap = {
      'update': 'showUpdateGraph',
      'render': 'showRenderGraph', 
      'memory': 'showMemoryGraph',
      'summary': 'showSummaryGraph'
    };
    
    const toggleKey = toggleMap[graphType.toLowerCase()];
    if (!toggleKey) {
      console.warn(`Invalid graph type: ${graphType}. Valid types are: update, render, memory, summary`);
      return false;
    }
    
    if (typeof state === 'boolean') {
      this.graphToggles[toggleKey] = state;
    } else {
      this.graphToggles[toggleKey] = !this.graphToggles[toggleKey];
    }
    
    logNormal(`${graphType} graph ${this.graphToggles[toggleKey] ? 'enabled' : 'disabled'} for ${this.introspectionData?.objectType?.constructor || 'object'}`);
    return this.graphToggles[toggleKey];
  }

  /**
   * Gets the current state of all graph toggles.
   * 
   * @returns {Object} Current graph toggle states
   * @public
   */
  getGraphStates() {
    return { ...this.graphToggles };
  }

  /**
   * Sets all graph toggles to a specific state.
   * 
   * @param {boolean} state - State to set all graphs to
   * @public
   */
  setAllGraphs(state) {
    this.graphToggles.showUpdateGraph = state;
    this.graphToggles.showRenderGraph = state;
    this.graphToggles.showMemoryGraph = state;
    this.graphToggles.showSummaryGraph = state;
    
    logNormal(`All graphs ${state ? 'enabled' : 'disabled'} for ${this.introspectionData?.objectType?.constructor || 'object'}`);
  }
}

// Global debugger management
window.UniversalDebugger = UniversalDebugger;
window._activeDebuggers = window._activeDebuggers || [];