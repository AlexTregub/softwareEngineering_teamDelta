const { expect } = require('chai');
const path = require('path');

describe('EntityDelegationBuilder', () => {
  let EntityDelegationBuilder, STANDARD_ENTITY_API_CONFIG, MINIMAL_ENTITY_API_CONFIG, ADVANCED_ENTITY_API_CONFIG;
  
  before(() => {
    // Mock performance if not available
    if (typeof global.performance === 'undefined') {
      global.performance = {
        now: () => Date.now()
      };
    }
    
    // Load the module
    const module = require(path.resolve(__dirname, '../../../Classes/rendering/EntityDelegationBuilder.js'));
    EntityDelegationBuilder = module.EntityDelegationBuilder;
    STANDARD_ENTITY_API_CONFIG = module.STANDARD_ENTITY_API_CONFIG;
    MINIMAL_ENTITY_API_CONFIG = module.MINIMAL_ENTITY_API_CONFIG;
    ADVANCED_ENTITY_API_CONFIG = module.ADVANCED_ENTITY_API_CONFIG;
  });
  
  beforeEach(() => {
    // Reset stats before each test
    EntityDelegationBuilder.resetStats();
  });
  
  describe('Configuration Exports', () => {
    it('should export EntityDelegationBuilder class', () => {
      expect(EntityDelegationBuilder).to.be.a('function');
      expect(EntityDelegationBuilder.name).to.equal('EntityDelegationBuilder');
    });
    
    it('should export STANDARD_ENTITY_API_CONFIG', () => {
      expect(STANDARD_ENTITY_API_CONFIG).to.be.an('object');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('namespaces');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('properties');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('chainable');
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('directMethods');
    });
    
    it('should export MINIMAL_ENTITY_API_CONFIG', () => {
      expect(MINIMAL_ENTITY_API_CONFIG).to.be.an('object');
      expect(MINIMAL_ENTITY_API_CONFIG).to.have.property('namespaces');
    });
    
    it('should export ADVANCED_ENTITY_API_CONFIG', () => {
      expect(ADVANCED_ENTITY_API_CONFIG).to.be.an('object');
      expect(ADVANCED_ENTITY_API_CONFIG).to.have.property('namespaces');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('animation');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('physics');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('audio');
    });
  });
  
  describe('createDelegationMethods()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        render: () => 'rendered',
        update: () => 'updated',
        clear: () => 'cleared'
      };
    });
    
    it('should create delegation methods on prototype', () => {
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render', 'update', 'clear']
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('render');
      expect(instance).to.have.property('update');
      expect(instance).to.have.property('clear');
    });
    
    it('should delegate method calls to controller', () => {
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render', 'update']
      );
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
      expect(instance.update()).to.equal('updated');
    });
    
    it('should pass arguments to delegated methods', () => {
      controller.setColor = (color) => `color: ${color}`;
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['setColor']
      );
      
      const instance = new TestClass();
      expect(instance.setColor('red')).to.equal('color: red');
    });
    
    it('should handle multiple arguments', () => {
      controller.setPosition = (x, y) => `position: ${x}, ${y}`;
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['setPosition']
      );
      
      const instance = new TestClass();
      expect(instance.setPosition(100, 200)).to.equal('position: 100, 200');
    });
    
    it('should warn when controller not available', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_missingController',
        ['render']
      );
      
      const instance = new TestClass();
      const result = instance.render();
      
      console.warn = originalWarn;
      expect(result).to.be.null;
      expect(warnings.length).to.be.greaterThan(0);
    });
    
    it('should warn when method not available on controller', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['nonExistentMethod']
      );
      
      const instance = new TestClass();
      const result = instance.nonExistentMethod();
      
      console.warn = originalWarn;
      expect(result).to.be.null;
      expect(warnings.length).to.be.greaterThan(0);
    });
    
    it('should support namespace parameter', () => {
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render'],
        'gfx'
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('gfx_render');
      expect(instance.gfx_render()).to.equal('rendered');
    });
  });
  
  describe('createNamespaceDelegation()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        selected: () => 'selected',
        hover: () => 'hover',
        clear: () => 'clear'
      };
    });
    
    it('should create namespace property on prototype', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover', 'clear'] }
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('highlight');
    });
    
    it('should create methods within namespace', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover', 'clear'] }
      );
      
      const instance = new TestClass();
      expect(instance.highlight).to.have.property('selected');
      expect(instance.highlight).to.have.property('hover');
      expect(instance.highlight).to.have.property('clear');
    });
    
    it('should delegate namespace method calls', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover'] }
      );
      
      const instance = new TestClass();
      expect(instance.highlight.selected()).to.equal('selected');
      expect(instance.highlight.hover()).to.equal('hover');
    });
    
    it('should support multiple namespaces', () => {
      controller.add = () => 'effect added';
      controller.remove = () => 'effect removed';
      
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        {
          highlight: ['selected', 'clear'],
          effects: ['add', 'remove']
        }
      );
      
      const instance = new TestClass();
      expect(instance.highlight.selected()).to.equal('selected');
      expect(instance.effects.add()).to.equal('effect added');
    });
    
    it('should cache namespace object per instance', () => {
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        { highlight: ['selected'] }
      );
      
      const instance = new TestClass();
      const ns1 = instance.highlight;
      const ns2 = instance.highlight;
      expect(ns1).to.equal(ns2); // Same object reference
    });
  });
  
  describe('createChainableAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        highlight: () => 'highlighted',
        effect: () => 'effect applied',
        render: () => 'rendered',
        update: () => 'updated'
      };
    });
    
    it('should create chainable namespace', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'highlight', chainable: true },
            { name: 'effect', chainable: true }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('chain');
    });
    
    it('should allow method chaining', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'highlight', chainable: true },
            { name: 'effect', chainable: true }
          ]
        }
      );
      
      const instance = new TestClass();
      const result = instance.chain.highlight().effect();
      expect(result).to.have.property('highlight');
      expect(result).to.have.property('effect');
    });
    
    it('should return value for non-chainable methods', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'render', chainable: false }
          ]
        }
      );
      
      const instance = new TestClass();
      const result = instance.chain.render();
      expect(result).to.equal('rendered');
    });
    
    it('should default to chainable if not specified', () => {
      EntityDelegationBuilder.createChainableAPI(
        TestClass,
        '_renderController',
        {
          chain: [
            { name: 'highlight' } // chainable not specified
          ]
        }
      );
      
      const instance = new TestClass();
      const result = instance.chain.highlight();
      expect(result).to.have.property('highlight');
    });
  });
  
  describe('createPropertyAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        _debugMode: false,
        _opacity: 1.0,
        getDebugMode: function() { return this._debugMode; },
        setDebugMode: function(val) { this._debugMode = val; },
        getOpacity: function() { return this._opacity; },
        setOpacity: function(val) { this._opacity = val; }
      };
    });
    
    it('should create property namespace', () => {
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'debugMode' }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance).to.have.property('config');
    });
    
    it('should create getter properties', () => {
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'debugMode' }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance.config.debugMode).to.equal(false);
      instance._renderController._debugMode = true;
      expect(instance.config.debugMode).to.equal(true);
    });
    
    it('should create setter properties', () => {
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'opacity' }
          ]
        }
      );
      
      const instance = new TestClass();
      instance.config.opacity = 0.5;
      expect(instance._renderController._opacity).to.equal(0.5);
    });
    
    it('should support custom getter/setter names', () => {
      controller.isVisible = () => true;
      controller.setVisible = () => {};
      
      EntityDelegationBuilder.createPropertyAPI(
        TestClass,
        '_renderController',
        {
          config: [
            { name: 'visible', getter: 'isVisible', setter: 'setVisible' }
          ]
        }
      );
      
      const instance = new TestClass();
      expect(instance.config.visible).to.equal(true);
    });
  });
  
  describe('setupEntityAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        selected: () => 'selected',
        clear: () => 'cleared',
        render: () => 'rendered',
        getRenderController: function() { return this; },
        _debugMode: false,
        getDebugMode: function() { return this._debugMode; },
        setDebugMode: function(val) { this._debugMode = val; }
      };
    });
    
    it('should setup namespaces from config', () => {
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        namespaces: {
          highlight: ['selected', 'clear']
        }
      });
      
      const instance = new TestClass();
      expect(instance.highlight.selected()).to.equal('selected');
    });
    
    it('should setup direct methods from config', () => {
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        directMethods: ['render', 'getRenderController']
      });
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
    });
    
    it('should setup properties from config', () => {
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        properties: {
          config: [
            { name: 'debugMode' }
          ]
        }
      });
      
      const instance = new TestClass();
      expect(instance.config.debugMode).to.equal(false);
    });
    
    it('should handle empty config', () => {
      expect(() => {
        EntityDelegationBuilder.setupEntityAPI(TestClass, {});
      }).to.not.throw();
    });
    
    it('should use custom controller property name', () => {
      TestClass = class {
        constructor() {
          this._customController = controller;
        }
      };
      
      EntityDelegationBuilder.setupEntityAPI(TestClass, {
        renderController: '_customController',
        directMethods: ['render']
      });
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
    });
  });
  
  describe('createNamespaceAPI()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      controller = {
        selected: () => 'selected',
        hover: () => 'hover'
      };
    });
    
    it('should create namespace with statistics tracking', () => {
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.totalDelegatedMethods).to.be.greaterThan(0);
    });
    
    it('should track class names in statistics', () => {
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { highlight: ['selected'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.classesWithDelegation).to.include(TestClass.name);
    });
    
    it('should track methods per class', () => {
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { highlight: ['selected', 'hover'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.methodsPerClass[TestClass.name]).to.equal(2);
    });
  });
  
  describe('validateDelegationConfig()', () => {
    it('should validate valid configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: 'selected', clear: 'clear' }
      });
      
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.an('array').with.lengthOf(0);
    });
    
    it('should reject null configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig(null);
      expect(result.isValid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(0);
    });
    
    it('should reject undefined configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig(undefined);
      expect(result.isValid).to.be.false;
    });
    
    it('should reject non-object configuration', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig('invalid');
      expect(result.isValid).to.be.false;
    });
    
    it('should reject invalid namespace structure', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: 'not an object'
      });
      
      expect(result.isValid).to.be.false;
    });
    
    it('should accept null method values', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: null }
      });
      
      expect(result.isValid).to.be.true;
    });
    
    it('should accept string method values', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: 'selected' }
      });
      
      expect(result.isValid).to.be.true;
    });
    
    it('should accept function method values', () => {
      const result = EntityDelegationBuilder.validateDelegationConfig({
        highlight: { selected: () => {} }
      });
      
      expect(result.isValid).to.be.true;
    });
  });
  
  describe('validateControllerMethods()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      controller = {
        render: () => {},
        update: () => {}
      };
      
      TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
    });
    
    it('should identify available methods', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_renderController',
        ['render', 'update']
      );
      
      expect(result.available).to.include('render');
      expect(result.available).to.include('update');
      expect(result.missing).to.be.empty;
    });
    
    it('should identify missing methods', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_renderController',
        ['render', 'nonExistent']
      );
      
      expect(result.available).to.include('render');
      expect(result.missing).to.include('nonExistent');
    });
    
    it('should detect when controller exists', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_renderController',
        ['render']
      );
      
      expect(result.controllerExists).to.be.true;
    });
    
    it('should detect when controller missing', () => {
      const result = EntityDelegationBuilder.validateControllerMethods(
        TestClass,
        '_missingController',
        ['render']
      );
      
      expect(result.controllerExists).to.be.false;
      expect(result.missing).to.include('render');
    });
  });
  
  describe('createAdvancedDelegation()', () => {
    let TestClass, controller;
    
    beforeEach(() => {
      controller = {
        setColor: (color) => `color: ${color}`,
        render: () => 'rendered'
      };
      
      TestClass = class {
        constructor() {
          this._renderController = controller;
          this.enabled = true;
        }
      };
    });
    
    it('should support method transforms', () => {
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            setColor: { targetMethod: 'setColor' }
          },
          methodTransforms: {
            setColor: function(color) {
              return [color.toUpperCase()];
            }
          }
        }
      );
      
      const instance = new TestClass();
      expect(instance.setColor('red')).to.equal('color: RED');
    });
    
    it('should support conditional delegation', () => {
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            render: { targetMethod: 'render' }
          },
          conditionalDelegation: {
            render: function() {
              return this.enabled === true;
            }
          }
        }
      );
      
      const instance = new TestClass();
      expect(instance.render()).to.equal('rendered');
      
      instance.enabled = false;
      expect(instance.render()).to.be.null;
    });
    
    it('should support warn error handling', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            nonExistent: { targetMethod: 'nonExistent' }
          },
          errorHandling: 'warn'
        }
      );
      
      const instance = new TestClass();
      instance.nonExistent();
      
      console.warn = originalWarn;
      expect(warnings.length).to.be.greaterThan(0);
    });
    
    it('should support silent error handling', () => {
      const warnings = [];
      const originalWarn = console.warn;
      console.warn = (msg) => warnings.push(msg);
      
      EntityDelegationBuilder.createAdvancedDelegation(
        TestClass,
        '_renderController',
        {
          methods: {
            nonExistent: { targetMethod: 'nonExistent' }
          },
          errorHandling: 'silent'
        }
      );
      
      const instance = new TestClass();
      const result = instance.nonExistent();
      
      console.warn = originalWarn;
      expect(result).to.be.null;
      expect(warnings).to.be.empty;
    });
  });
  
  describe('Delegation Statistics', () => {
    it('should initialize statistics', () => {
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats).to.have.property('totalDelegatedMethods');
      expect(stats).to.have.property('classesWithDelegation');
      expect(stats).to.have.property('methodsPerClass');
    });
    
    it('should track total delegated methods', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            method1: () => {},
            method2: () => {}
          };
        }
      };
      
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { namespace: ['method1', 'method2'] }
      );
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.totalDelegatedMethods).to.be.greaterThan(0);
    });
    
    it('should reset statistics', () => {
      const TestClass = class {
        constructor() {
          this._renderController = { method: () => {} };
        }
      };
      
      EntityDelegationBuilder.createNamespaceAPI(
        TestClass,
        '_renderController',
        { namespace: ['method'] }
      );
      
      EntityDelegationBuilder.resetStats();
      
      const stats = EntityDelegationBuilder.getDelegationStats();
      expect(stats.totalDelegatedMethods).to.equal(0);
      expect(stats.classesWithDelegation).to.be.empty;
    });
  });
  
  describe('Predefined Configurations', () => {
    it('STANDARD_ENTITY_API_CONFIG should have highlight namespace', () => {
      expect(STANDARD_ENTITY_API_CONFIG.namespaces).to.have.property('highlight');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.highlight).to.include('selected');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.highlight).to.include('hover');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.highlight).to.include('clear');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have effects namespace', () => {
      expect(STANDARD_ENTITY_API_CONFIG.namespaces).to.have.property('effects');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.effects).to.include('add');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.effects).to.include('remove');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have rendering namespace', () => {
      expect(STANDARD_ENTITY_API_CONFIG.namespaces).to.have.property('rendering');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.rendering).to.include('render');
      expect(STANDARD_ENTITY_API_CONFIG.namespaces.rendering).to.include('setDebugMode');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have properties config', () => {
      expect(STANDARD_ENTITY_API_CONFIG.properties).to.have.property('config');
      expect(STANDARD_ENTITY_API_CONFIG.properties.config).to.be.an('array');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have chainable config', () => {
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('chainable');
      expect(STANDARD_ENTITY_API_CONFIG.chainable).to.have.property('chain');
    });
    
    it('STANDARD_ENTITY_API_CONFIG should have direct methods', () => {
      expect(STANDARD_ENTITY_API_CONFIG).to.have.property('directMethods');
      expect(STANDARD_ENTITY_API_CONFIG.directMethods).to.be.an('array');
    });
    
    it('MINIMAL_ENTITY_API_CONFIG should be subset of STANDARD', () => {
      expect(MINIMAL_ENTITY_API_CONFIG.namespaces).to.have.property('highlight');
      expect(MINIMAL_ENTITY_API_CONFIG.namespaces).to.have.property('effects');
      expect(MINIMAL_ENTITY_API_CONFIG.namespaces).to.have.property('rendering');
    });
    
    it('ADVANCED_ENTITY_API_CONFIG should extend STANDARD with additional namespaces', () => {
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('animation');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('physics');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('audio');
    });
    
    it('ADVANCED_ENTITY_API_CONFIG should include STANDARD namespaces', () => {
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('highlight');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('effects');
      expect(ADVANCED_ENTITY_API_CONFIG.namespaces).to.have.property('rendering');
    });
  });
  
  describe('Edge Cases and Integration', () => {
    it('should handle class without constructor', () => {
      const TestClass = class {};
      
      expect(() => {
        EntityDelegationBuilder.createDelegationMethods(
          TestClass,
          '_renderController',
          ['method']
        );
      }).to.not.throw();
    });
    
    it('should handle multiple instances sharing prototype methods', () => {
      const TestClass = class {
        constructor(controller) {
          this._renderController = controller;
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['render']
      );
      
      const controller1 = { render: () => 'controller1' };
      const controller2 = { render: () => 'controller2' };
      
      const instance1 = new TestClass(controller1);
      const instance2 = new TestClass(controller2);
      
      expect(instance1.render()).to.equal('controller1');
      expect(instance2.render()).to.equal('controller2');
    });
    
    it('should handle delegating to same method from multiple namespaces', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            clear: () => 'cleared'
          };
        }
      };
      
      EntityDelegationBuilder.createNamespaceDelegation(
        TestClass,
        '_renderController',
        {
          highlight: ['clear'],
          effects: ['clear']
        }
      );
      
      const instance = new TestClass();
      expect(instance.highlight.clear()).to.equal('cleared');
      expect(instance.effects.clear()).to.equal('cleared');
    });
    
    it('should handle very long method names', () => {
      const longMethodName = 'thisIsAVeryLongMethodNameForTestingPurposes';
      const TestClass = class {
        constructor() {
          this._renderController = {
            [longMethodName]: () => 'success'
          };
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        [longMethodName]
      );
      
      const instance = new TestClass();
      expect(instance[longMethodName]()).to.equal('success');
    });
    
    it('should handle delegating methods that return undefined', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            voidMethod: () => undefined
          };
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['voidMethod']
      );
      
      const instance = new TestClass();
      expect(instance.voidMethod()).to.be.undefined;
    });
    
    it('should handle delegating methods that throw errors', () => {
      const TestClass = class {
        constructor() {
          this._renderController = {
            errorMethod: () => { throw new Error('Test error'); }
          };
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['errorMethod']
      );
      
      const instance = new TestClass();
      expect(() => instance.errorMethod()).to.throw('Test error');
    });
    
    it('should preserve method context in delegated calls', () => {
      const controller = {
        value: 42,
        getValue: function() { return this.value; }
      };
      
      const TestClass = class {
        constructor() {
          this._renderController = controller;
        }
      };
      
      EntityDelegationBuilder.createDelegationMethods(
        TestClass,
        '_renderController',
        ['getValue']
      );
      
      const instance = new TestClass();
      expect(instance.getValue()).to.equal(42);
    });
  });
});
