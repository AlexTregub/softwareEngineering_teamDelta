/**
 * @fileoverview EntityDelegationBuilder - Utility for automatically generating delegation methods
 * @module EntityDelegationBuilder
 * @see {@link docs/api/EntityDelegationBuilder.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Delegation pattern reference
 */

/**
 * Utility for automatically generating delegation methods to eliminate code repetition.
 * 
 * **Purpose**: Creates delegation methods on class prototypes for controller patterns
 * 
 * @class EntityDelegationBuilder
 * @see {@link docs/api/EntityDelegationBuilder.md} Full documentation and examples
 */
class EntityDelegationBuilder {
  /**
   * Create delegation methods on a class prototype
   * This eliminates code repetition when delegating to controllers
   */
  static createDelegationMethods(entityClass, controllerProperty, methodList, namespace = null) {
    methodList.forEach(methodName => {
      const targetName = namespace ? `${namespace}_${methodName}` : methodName;
      
      entityClass.prototype[targetName] = function(...args) {
        const controller = this[controllerProperty];
        if (controller && typeof controller[methodName] === 'function') {
          return controller[methodName](...args);
        } else {
          console.warn(`${this.constructor.name}: Method ${methodName} not available on ${controllerProperty}`);
          return null;
        }
      };
    });
  }

  /**
   * Create namespace-based delegation properties
   * Creates clean property-based API like entity.highlight.selected()
   */
  static createNamespaceDelegation(entityClass, controllerProperty, namespaceConfig) {
    for (const [namespaceName, methodList] of Object.entries(namespaceConfig)) {
      entityClass.prototype[namespaceName] = {};
      
      methodList.forEach(methodName => {
        Object.defineProperty(entityClass.prototype[namespaceName], methodName, {
          value: function(...args) {
            const entity = this; // 'this' refers to the namespace object
            const controller = entity[controllerProperty];
            
            if (controller && typeof controller[methodName] === 'function') {
              return controller[methodName](...args);
            } else {
              console.warn(`${entity.constructor.name}: Method ${methodName} not available on ${controllerProperty}`);
              return null;
            }
          },
          writable: false,
          enumerable: true,
          configurable: false
        });
      });

      // Bind namespace to entity instance
      Object.defineProperty(entityClass.prototype, namespaceName, {
        get: function() {
          if (!this[`_${namespaceName}Namespace`]) {
            const namespace = {};
            const entity = this;
            
            namespaceConfig[namespaceName].forEach(methodName => {
              namespace[methodName] = (...args) => {
                const controller = entity[controllerProperty];
                if (controller && typeof controller[methodName] === 'function') {
                  return controller[methodName](...args);
                } else {
                  console.warn(`${entity.constructor.name}: Method ${methodName} not available on ${controllerProperty}`);
                  return null;
                }
              };
            });
            
            this[`_${namespaceName}Namespace`] = namespace;
          }
          
          return this[`_${namespaceName}Namespace`];
        },
        enumerable: true,
        configurable: false
      });
    }
  }

  /**
   * Create chainable API methods
   * Allows for method chaining like entity.highlight.selected().effects.sparkle()
   */
  static createChainableAPI(entityClass, controllerProperty, chainConfig) {
    for (const [namespaceName, methods] of Object.entries(chainConfig)) {
      Object.defineProperty(entityClass.prototype, namespaceName, {
        get: function() {
          if (!this[`_${namespaceName}Chain`]) {
            const chainAPI = {};
            const entity = this;
            
            methods.forEach(methodConfig => {
              const methodName = methodConfig.name;
              const returnsChain = methodConfig.chainable !== false;
              
              chainAPI[methodName] = (...args) => {
                const controller = entity[controllerProperty];
                if (controller && typeof controller[methodName] === 'function') {
                  const result = controller[methodName](...args);
                  return returnsChain ? chainAPI : result;
                } else {
                  console.warn(`${entity.constructor.name}: Method ${methodName} not available on ${controllerProperty}`);
                  return returnsChain ? chainAPI : null;
                }
              };
            });
            
            this[`_${namespaceName}Chain`] = chainAPI;
          }
          
          return this[`_${namespaceName}Chain`];
        },
        enumerable: true,
        configurable: false
      });
    }
  }

  /**
   * Create property-based configuration API
   * Allows setting properties like entity.rendering.smoothing = true
   */
  static createPropertyAPI(entityClass, controllerProperty, propertyConfig) {
    for (const [namespaceName, properties] of Object.entries(propertyConfig)) {
      Object.defineProperty(entityClass.prototype, namespaceName, {
        get: function() {
          if (!this[`_${namespaceName}Props`]) {
            const propAPI = {};
            const entity = this;
            
            properties.forEach(propConfig => {
              const propName = propConfig.name;
              const getterMethod = propConfig.getter || `get${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
              const setterMethod = propConfig.setter || `set${propName.charAt(0).toUpperCase() + propName.slice(1)}`;
              
              Object.defineProperty(propAPI, propName, {
                get: function() {
                  const controller = entity[controllerProperty];
                  if (controller && typeof controller[getterMethod] === 'function') {
                    return controller[getterMethod]();
                  }
                  return undefined;
                },
                set: function(value) {
                  const controller = entity[controllerProperty];
                  if (controller && typeof controller[setterMethod] === 'function') {
                    controller[setterMethod](value);
                  } else {
                    console.warn(`${entity.constructor.name}: Property ${propName} not settable on ${controllerProperty}`);
                  }
                },
                enumerable: true,
                configurable: false
              });
            });
            
            this[`_${namespaceName}Props`] = propAPI;
          }
          
          return this[`_${namespaceName}Props`];
        },
        enumerable: true,
        configurable: false
      });
    }
  }

  /**
   * Comprehensive entity API setup
   * Sets up all delegation patterns for an entity class
   */
  static setupEntityAPI(entityClass, config) {
    const {
      renderController = '_renderController',
      namespaces = {},
      chainable = {},
      properties = {},
      directMethods = []
    } = config;

    // Create namespace delegation
    if (Object.keys(namespaces).length > 0) {
      this.createNamespaceDelegation(entityClass, renderController, namespaces);
    }

    // Create chainable API
    if (Object.keys(chainable).length > 0) {
      this.createChainableAPI(entityClass, renderController, chainable);
    }

    // Create property API
    if (Object.keys(properties).length > 0) {
      this.createPropertyAPI(entityClass, renderController, properties);
    }

    // Create direct method delegation
    if (directMethods.length > 0) {
      this.createDelegationMethods(entityClass, renderController, directMethods);
    }
  }

  /**
   * MISSING API METHODS - Required by test suite
   */

  /**
   * Create namespace API with proper method delegation
   * @param {Function} entityClass - Target entity class
   * @param {string} controllerProperty - Controller property name
   * @param {Object} namespaceConfig - Namespace configuration object
   */
  static createNamespaceAPI(entityClass, controllerProperty, namespaceConfig) {
    // Track delegation statistics
    if (!this.stats) {
      this.stats = { totalDelegatedMethods: 0, classesWithDelegation: new Set(), methodsPerClass: {} };
    }
    
    const className = entityClass.name;
    this.stats.classesWithDelegation.add(className);
    this.stats.methodsPerClass[className] = 0;
    
    for (const [namespaceName, methodList] of Object.entries(namespaceConfig)) {
      Object.defineProperty(entityClass.prototype, namespaceName, {
        get: function() {
          if (!this[`_${namespaceName}Namespace`]) {
            const namespace = {};
            const entity = this;
            
            methodList.forEach(methodName => {
              namespace[methodName] = (...args) => {
                const controller = entity[controllerProperty];
                if (controller && typeof controller[methodName] === 'function') {
                  return controller[methodName](...args);
                } else {
                  console.warn(`${entity.constructor.name}: Method ${methodName} not available on ${controllerProperty}`);
                  return null;
                }
              };
              
              // Update statistics
              EntityDelegationBuilder.stats.totalDelegatedMethods++;
              EntityDelegationBuilder.stats.methodsPerClass[className]++;
            });
            
            this[`_${namespaceName}Namespace`] = namespace;
          }
          
          return this[`_${namespaceName}Namespace`];
        },
        enumerable: true,
        configurable: false
      });
    }
  }

  /**
   * Validate delegation configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with isValid and errors properties
   */
  static validateDelegationConfig(config) {
    const result = { isValid: true, errors: [] };
    
    if (!config || typeof config !== 'object') {
      result.isValid = false;
      result.errors.push('Configuration must be an object');
      return result;
    }
    
    // Validate namespace structure
    for (const [namespaceName, methods] of Object.entries(config)) {
      if (typeof namespaceName !== 'string') {
        result.isValid = false;
        result.errors.push(`Namespace name must be string, got ${typeof namespaceName}`);
        continue;
      }
      
      if (!methods || typeof methods !== 'object') {
        result.isValid = false;
        result.errors.push(`Namespace ${namespaceName} methods must be an object`);
        continue;
      }
      
      // Validate method names
      for (const methodName of Object.keys(methods)) {
        if (typeof methodName !== 'string') {
          result.isValid = false;
          result.errors.push(`Method name in ${namespaceName} must be string, got ${typeof methodName}`);
        }
        
        const methodValue = methods[methodName];
        if (methodValue !== null && typeof methodValue !== 'string' && typeof methodValue !== 'function') {
          result.isValid = false;
          result.errors.push(`Method ${methodName} in ${namespaceName} must be null, string, or function`);
        }
      }
    }
    
    return result;
  }

  /**
   * Validate controller methods existence
   * @param {Function} targetClass - Target entity class
   * @param {string} controllerProperty - Controller property name
   * @param {Array} methodNames - Array of method names to validate
   * @returns {Object} Validation result with available and missing methods
   */
  static validateControllerMethods(targetClass, controllerProperty, methodNames) {
    const result = { 
      available: [], 
      missing: [], 
      controllerExists: false 
    };
    
    // Check if we can create an instance to test
    try {
      const testInstance = new targetClass();
      const controller = testInstance[controllerProperty];
      
      if (controller) {
        result.controllerExists = true;
        
        methodNames.forEach(methodName => {
          if (typeof controller[methodName] === 'function') {
            result.available.push(methodName);
          } else {
            result.missing.push(methodName);
          }
        });
      } else {
        result.missing = [...methodNames];
      }
    } catch (error) {
      // Cannot instantiate class, assume all methods are missing
      result.missing = [...methodNames];
    }
    
    return result;
  }

  /**
   * Create advanced delegation with custom behaviors
   * @param {Function} targetClass - Target entity class
   * @param {string} controllerProperty - Controller property name
   * @param {Object} advancedConfig - Advanced delegation configuration
   */
  static createAdvancedDelegation(targetClass, controllerProperty, advancedConfig) {
    const {
      methodTransforms = {},
      conditionalDelegation = {},
      errorHandling = 'warn',
      performanceTracking = false
    } = advancedConfig;
    
    for (const [methodName, config] of Object.entries(advancedConfig.methods || {})) {
      targetClass.prototype[methodName] = function(...args) {
        const controller = this[controllerProperty];
        
        // Check conditions if specified
        if (conditionalDelegation[methodName]) {
          const condition = conditionalDelegation[methodName];
          if (typeof condition === 'function' && !condition.call(this, ...args)) {
            return null; // Condition not met, skip delegation
          }
        }
        
        // Transform arguments if specified
        let transformedArgs = args;
        if (methodTransforms[methodName] && typeof methodTransforms[methodName] === 'function') {
          transformedArgs = methodTransforms[methodName].call(this, ...args);
        }
        
        // Performance tracking
        const startTime = performanceTracking ? performance.now() : 0;
        
        // Execute delegation
        let result = null;
        if (controller && typeof controller[config.targetMethod || methodName] === 'function') {
          result = controller[config.targetMethod || methodName](...transformedArgs);
        } else {
          // Handle error based on configuration
          const errorMsg = `${this.constructor.name}: Method ${methodName} not available on ${controllerProperty}`;
          if (errorHandling === 'throw') {
            throw new Error(errorMsg);
          } else if (errorHandling === 'warn') {
            console.warn(errorMsg);
          }
          // 'silent' option does nothing
        }
        
        // Log performance if tracking enabled
        if (performanceTracking) {
          const elapsed = performance.now() - startTime;
          console.log(`Delegation ${this.constructor.name}.${methodName}: ${elapsed.toFixed(2)}ms`);
        }
        
        return result;
      };
    }
  }

  /**
   * Get delegation statistics
   * @returns {Object} Statistics about delegation usage
   */
  static getDelegationStats() {
    if (!this.stats) {
      return {
        totalDelegatedMethods: 0,
        classesWithDelegation: [],
        methodsPerClass: {}
      };
    }
    
    return {
      totalDelegatedMethods: this.stats.totalDelegatedMethods,
      classesWithDelegation: Array.from(this.stats.classesWithDelegation),
      methodsPerClass: { ...this.stats.methodsPerClass }
    };
  }

  /**
   * Reset delegation statistics (useful for testing)
   */
  static resetStats() {
    this.stats = { 
      totalDelegatedMethods: 0, 
      classesWithDelegation: new Set(), 
      methodsPerClass: {} 
    };
  }
}

// Initialize statistics tracking
EntityDelegationBuilder.stats = { 
  totalDelegatedMethods: 0, 
  classesWithDelegation: new Set(), 
  methodsPerClass: {} 
};

// Predefined API configurations for common use cases
const STANDARD_ENTITY_API_CONFIG = {
  namespaces: {
    highlight: [
      'selected', 'hover', 'boxHover', 'combat', 'set', 'clear'
    ],
    effects: [
      'add', 'remove', 'clear', 'damageNumber', 'healNumber', 'floatingText',
      'bloodSplatter', 'impactSparks', 'selectionSparkle', 'gatheringSparkle'
    ],
    rendering: [
      'setDebugMode', 'setSmoothing', 'render', 'update', 'setVisible'
    ]
  },
  
  properties: {
    config: [
      { name: 'debugMode', getter: 'getDebugMode', setter: 'setDebugMode' },
      { name: 'smoothing', getter: 'getSmoothing', setter: 'setSmoothing' },
      { name: 'visible', getter: 'isVisible', setter: 'setVisible' },
      { name: 'opacity', getter: 'getOpacity', setter: 'setOpacity' }
    ]
  },
  
  chainable: {
    chain: [
      { name: 'highlight', chainable: true },
      { name: 'effect', chainable: true },
      { name: 'render', chainable: true },
      { name: 'update', chainable: false }
    ]
  },
  
  directMethods: [
    'getRenderController', 'hasRenderController'
  ]
};

// Export configurations for easy use
const MINIMAL_ENTITY_API_CONFIG = {
  namespaces: {
    highlight: ['selected', 'clear'],
    effects: ['add', 'clear'],
    rendering: ['render', 'setVisible']
  }
};

const ADVANCED_ENTITY_API_CONFIG = {
  ...STANDARD_ENTITY_API_CONFIG,
  namespaces: {
    ...STANDARD_ENTITY_API_CONFIG.namespaces,
    animation: [
      'play', 'pause', 'stop', 'setLoop', 'setSpeed'
    ],
    physics: [
      'setVelocity', 'addForce', 'setGravity', 'enableCollision'
    ],
    audio: [
      'playSound', 'stopSound', 'setVolume', 'set3DPosition'
    ]
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EntityDelegationBuilder,
    STANDARD_ENTITY_API_CONFIG,
    MINIMAL_ENTITY_API_CONFIG,
    ADVANCED_ENTITY_API_CONFIG
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.EntityDelegationBuilder = EntityDelegationBuilder;
  window.STANDARD_ENTITY_API_CONFIG = STANDARD_ENTITY_API_CONFIG;
  window.MINIMAL_ENTITY_API_CONFIG = MINIMAL_ENTITY_API_CONFIG;
  window.ADVANCED_ENTITY_API_CONFIG = ADVANCED_ENTITY_API_CONFIG;
} else if (typeof global !== 'undefined') {
  global.EntityDelegationBuilder = EntityDelegationBuilder;
  global.STANDARD_ENTITY_API_CONFIG = STANDARD_ENTITY_API_CONFIG;
  global.MINIMAL_ENTITY_API_CONFIG = MINIMAL_ENTITY_API_CONFIG;
  global.ADVANCED_ENTITY_API_CONFIG = ADVANCED_ENTITY_API_CONFIG;
}