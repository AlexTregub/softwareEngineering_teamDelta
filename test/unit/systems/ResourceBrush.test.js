/**
 * Unit Tests for ResourceBrush
 * Tests resource painting tool
 */

const { expect } = require('chai');

// Mock p5.js and globals
global.mouseX = 100;
global.mouseY = 100;
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.line = () => {};
global.rect = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';

// Mock Resource class
global.Resource = {
  createGreenLeaf: (x, y) => ({ resourceType: 'greenLeaf', x, y, getPosition: () => ({ x, y }) }),
  createMapleLeaf: (x, y) => ({ resourceType: 'mapleLeaf', x, y, getPosition: () => ({ x, y }) }),
  createStick: (x, y) => ({ resourceType: 'stick', x, y, getPosition: () => ({ x, y }) }),
  createStone: (x, y) => ({ resourceType: 'stone', x, y, getPosition: () => ({ x, y }) })
};

// Mock resource manager
global.g_entityInventoryManager = {
  resources: [],
  addResource: function(resource) {
    this.resources.push(resource);
    return true;
  }
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load ResourceBrush
const { ResourceBrush } = require('../../../Classes/systems/tools/ResourceBrush');

describe('ResourceBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new ResourceBrush();
    global.g_entityInventoryManager.resources = [];
  });
  
  describe('Constructor', function() {
    
    it('should create brush with resource types', function() {
      expect(brush.availableTypes).to.be.an('array');
      expect(brush.availableTypes.length).to.be.greaterThan(0);
    });
    
    it('should have default resource types', function() {
      const types = brush.availableTypes.map(t => t.type);
      
      expect(types).to.include('greenLeaf');
      expect(types).to.include('mapleLeaf');
      expect(types).to.include('stick');
      expect(types).to.include('stone');
    });
    
    it('should initialize with first resource type', function() {
      expect(brush.currentType).to.exist;
      expect(brush.currentType.type).to.equal('greenLeaf');
    });
    
    it('should have resource factories', function() {
      brush.availableTypes.forEach(type => {
        expect(type.factory).to.be.a('function');
      });
    });
    
    it('should set spawn cooldown', function() {
      expect(brush.spawnCooldown).to.equal(100);
    });
  });
  
  describe('toggle()', function() {
    
    it('should toggle active state', function() {
      expect(brush.isActive).to.be.false;
      
      brush.toggle();
      expect(brush.isActive).to.be.true;
      
      brush.toggle();
      expect(brush.isActive).to.be.false;
    });
    
    it('should return new active state', function() {
      const result = brush.toggle();
      expect(result).to.be.true;
    });
  });
  
  describe('setResourceType()', function() {
    
    it('should set resource type by key', function() {
      brush.setResourceType('stick');
      
      expect(brush.currentType.type).to.equal('stick');
    });
    
    it('should handle unknown resource type', function() {
      expect(() => {
        brush.setResourceType('unknownType');
      }).to.not.throw();
    });
  });
  
  describe('performAction()', function() {
    
    it('should paint resource at location', function() {
      brush.lastSpawnTime = 0; // Reset cooldown
      
      brush.performAction(100, 100);
      
      expect(global.g_entityInventoryManager.resources.length).to.equal(1);
    });
    
    it('should respect cooldown', function() {
      brush.lastSpawnTime = Date.now();
      
      brush.performAction(100, 100);
      
      expect(global.g_entityInventoryManager.resources.length).to.equal(0);
    });
    
    it('should create correct resource type', function() {
      brush.lastSpawnTime = 0;
      brush.setResourceType('stick');
      
      brush.performAction(100, 100);
      
      const resource = global.g_entityInventoryManager.resources[0];
      expect(resource.resourceType).to.equal('stick');
    });
    
    it('should add randomness to position', function() {
      brush.lastSpawnTime = 0;
      
      brush.performAction(100, 100);
      
      const resource = global.g_entityInventoryManager.resources[0];
      // Position should be near 100, but with some offset
      expect(Math.abs(resource.x - 100)).to.be.lessThan(brush.brushSize);
    });
    
    it('should handle missing resource manager gracefully', function() {
      const oldManager = global.g_entityInventoryManager;
      global.g_entityInventoryManager = undefined;
      
      brush.lastSpawnTime = 0;
      
      expect(() => {
        brush.performAction(100, 100);
      }).to.not.throw();
      
      global.g_entityInventoryManager = oldManager;
    });
  });
  
  describe('update()', function() {
    
    it('should update cursor position when active', function() {
      brush.isActive = true;
      global.mouseX = 200;
      global.mouseY = 250;
      
      brush.update();
      
      expect(brush.cursorPosition.x).to.equal(200);
      expect(brush.cursorPosition.y).to.equal(250);
    });
    
    it('should update pulse animation', function() {
      brush.isActive = true;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.greaterThan(oldPulse);
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should paint on LEFT click', function() {
      brush.isActive = true;
      brush.lastSpawnTime = 0;
      
      brush.onMousePressed(150, 200, 'LEFT');
      
      expect(global.g_entityInventoryManager.resources.length).to.be.greaterThan(0);
    });
    
    it('should cycle type on RIGHT click', function() {
      brush.isActive = true;
      const oldType = brush.currentType;
      
      brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(brush.currentType).to.not.equal(oldType);
    });
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should not render when inactive', function() {
      brush.isActive = false;
      
      expect(() => brush.render()).to.not.throw();
    });
    
    it('should render brush cursor when active', function() {
      brush.isActive = true;
      
      expect(() => brush.render()).to.not.throw();
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const info = brush.getDebugInfo();
      
      expect(info).to.have.property('isActive');
      expect(info).to.have.property('currentResource');
      expect(info).to.have.property('brushSize');
      expect(info).to.have.property('availableTypes');
    });
    
    it('should include current resource name', function() {
      brush.setResourceType('mapleLeaf');
      
      const info = brush.getDebugInfo();
      
      expect(info.currentResource).to.equal('Maple Leaf');
    });
    
    it('should list all available types', function() {
      const info = brush.getDebugInfo();
      
      expect(info.availableTypes).to.be.an('array');
      expect(info.availableTypes).to.include('Green Leaf');
      expect(info.availableTypes).to.include('Stick');
    });
  });
  
  describe('Resource Type Properties', function() {
    
    it('should have color for each resource type', function() {
      brush.availableTypes.forEach(type => {
        expect(type.color).to.be.an('array');
        expect(type.color).to.have.lengthOf(3); // RGB
      });
    });
    
    it('should have name for each resource type', function() {
      brush.availableTypes.forEach(type => {
        expect(type.name).to.be.a('string');
        expect(type.name.length).to.be.greaterThan(0);
      });
    });
  });
});

describe('ResourceBrush Integration', function() {
  
  it('should initialize global instance', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/ResourceBrush')];
    const { initializeResourceBrush } = require('../../../Classes/systems/tools/ResourceBrush');
    
    const brush = initializeResourceBrush();
    
    expect(mockWindow.g_resourceBrush).to.exist;
    expect(mockWindow.g_resourceBrush).to.equal(brush);
    
    delete global.window;
  });
  
  it('should provide test utilities in browser', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/ResourceBrush')];
    require('../../../Classes/systems/tools/ResourceBrush');
    
    expect(mockWindow.testResourceBrush).to.be.a('function');
    expect(mockWindow.checkResourceBrushState).to.be.a('function');
    
    delete global.window;
  });
});
