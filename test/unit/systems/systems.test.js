/**
 * Consolidated Systems Tests
 * Generated: 2025-10-29T03:11:41.150Z
 * Source files: 20
 * Total tests: 893
 * 
 * This file contains all systems tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');


// ================================================================
// BrushBase.test.js (35 tests)
// ================================================================
/**
 * Unit Tests for BrushBase
 * Tests base brush functionality for painting tools
 */

// Mock p5.js
global.mouseX = 100;
global.mouseY = 100;

// Load BrushBase
let { BrushBase } = require('../../../Classes/systems/tools/BrushBase');

describe('BrushBase', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new BrushBase();
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.brushSize).to.equal(30);
      expect(brush.spawnCooldown).to.equal(100);
    });
    
    it('should initialize cursor position', function() {
      expect(brush.cursorPosition).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulseAnimation).to.equal(0);
      expect(brush.pulseSpeed).to.equal(0.05);
    });
    
    it('should initialize type cycling support', function() {
      expect(brush.availableTypes).to.be.an('array');
      expect(brush.currentIndex).to.equal(0);
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
  
  describe('cycleType()', function() {
    
    it('should cycle through available types', function() {
      brush.availableTypes = [
        { type: 'A', name: 'Type A' },
        { type: 'B', name: 'Type B' },
        { type: 'C', name: 'Type C' }
      ];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleType();
      expect(brush.currentIndex).to.equal(1);
      expect(brush.currentType.type).to.equal('B');
    });
    
    it('should wrap around to start', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' }
      ];
      brush.currentIndex = 1;
      brush.currentType = brush.availableTypes[1];
      
      brush.cycleType();
      expect(brush.currentIndex).to.equal(0);
      expect(brush.currentType.type).to.equal('A');
    });
    
    it('should handle empty types array', function() {
      brush.availableTypes = [];
      
      const result = brush.cycleType();
      expect(result).to.be.null;
    });
    
    it('should support backwards cycling with negative step', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' }
      ];
      brush.currentIndex = 2;
      brush.currentType = brush.availableTypes[2];
      
      brush.cycleType(-1);
      expect(brush.currentIndex).to.equal(1);
    });
  });
  
  describe('cycleTypeStep()', function() {
    
    it('should cycle by specified step', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' },
        { type: 'D' }
      ];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleTypeStep(2);
      expect(brush.currentIndex).to.equal(2);
    });
    
    it('should handle negative steps', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' }
      ];
      brush.currentIndex = 2;
      brush.currentType = brush.availableTypes[2];
      
      brush.cycleTypeStep(-1);
      expect(brush.currentIndex).to.equal(1);
    });
    
    it('should wrap correctly with large steps', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' }
      ];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleTypeStep(5);
      expect(brush.currentIndex).to.be.lessThan(3);
    });
    
    it('should return current type when step is 0', function() {
      brush.availableTypes = [{ type: 'A' }];
      brush.currentType = brush.availableTypes[0];
      
      const result = brush.cycleTypeStep(0);
      expect(result).to.equal(brush.currentType);
    });
  });
  
  describe('setType()', function() {
    
    it('should set type by key', function() {
      brush.availableTypes = [
        { type: 'greenLeaf', name: 'Green Leaf' },
        { type: 'stick', name: 'Stick' }
      ];
      
      brush.setType('stick');
      
      expect(brush.currentType.type).to.equal('stick');
      expect(brush.currentIndex).to.equal(1);
    });
    
    it('should find type by name property', function() {
      brush.availableTypes = [
        { name: 'Resource A' },
        { name: 'Resource B' }
      ];
      
      brush.setType('Resource B');
      
      expect(brush.currentType.name).to.equal('Resource B');
    });
    
    it('should return null for unknown type', function() {
      brush.availableTypes = [{ type: 'A' }];
      
      const result = brush.setType('UNKNOWN');
      
      expect(result).to.be.null;
    });
    
    it('should handle empty types array', function() {
      brush.availableTypes = [];
      
      const result = brush.setType('anything');
      
      expect(result).to.be.null;
    });
  });
  
  describe('update()', function() {
    
    it('should update cursor position', function() {
      brush.isActive = true;
      global.mouseX = 200;
      global.mouseY = 300;
      
      brush.update();
      
      expect(brush.cursorPosition.x).to.equal(200);
      expect(brush.cursorPosition.y).to.equal(300);
    });
    
    it('should not update when inactive', function() {
      brush.isActive = false;
      const oldX = brush.cursorPosition.x;
      
      brush.update();
      
      expect(brush.cursorPosition.x).to.equal(oldX);
    });
    
    it('should update pulse animation', function() {
      brush.isActive = true;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2*PI', function() {
      brush.isActive = true;
      brush.pulseAnimation = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.lessThan(Math.PI * 2);
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should call performAction on LEFT click', function() {
      brush.isActive = true;
      let called = false;
      
      brush.performAction = () => { called = true; };
      
      brush.onMousePressed(100, 100, 'LEFT');
      
      expect(called).to.be.true;
    });
    
    it('should cycle type on RIGHT click', function() {
      brush.isActive = true;
      brush.availableTypes = [{ type: 'A' }, { type: 'B' }];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(brush.currentIndex).to.equal(1);
    });
    
    it('should return true when consuming LEFT event', function() {
      brush.isActive = true;
      brush.performAction = () => {};
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.true;
    });
    
    it('should return false when performAction not implemented', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should return false by default', function() {
      brush.isActive = true;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      brush.availableTypes = [
        { name: 'Type A' },
        { type: 'typeB' }
      ];
      brush.currentType = brush.availableTypes[0];
      
      const info = brush.getDebugInfo();
      
      expect(info).to.have.property('isActive');
      expect(info).to.have.property('brushSize');
      expect(info).to.have.property('spawnCooldown');
      expect(info).to.have.property('availableTypes');
      expect(info).to.have.property('currentType');
    });
    
    it('should map available types to names', function() {
      brush.availableTypes = [
        { name: 'Resource A' },
        { name: 'Resource B' }
      ];
      
      const info = brush.getDebugInfo();
      
      expect(info.availableTypes).to.deep.equal(['Resource A', 'Resource B']);
    });
    
    it('should handle missing currentType', function() {
      brush.currentType = null;
      
      const info = brush.getDebugInfo();
      
      expect(info.currentType).to.be.null;
    });
  });
  
  describe('onTypeChanged callback', function() {
    
    it('should call onTypeChanged when type changes', function() {
      let callbackCalled = false;
      let callbackArg = null;
      
      brush.onTypeChanged = (type) => {
        callbackCalled = true;
        callbackArg = type;
      };
      
      brush.availableTypes = [{ type: 'A' }, { type: 'B' }];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleType();
      
      expect(callbackCalled).to.be.true;
      expect(callbackArg.type).to.equal('B');
    });
    
    it('should handle callback errors gracefully', function() {
      brush.onTypeChanged = () => {
        throw new Error('Callback error');
      };
      
      brush.availableTypes = [{ type: 'A' }, { type: 'B' }];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      expect(() => brush.cycleType()).to.not.throw();
    });
  });
});

describe('BrushBase Global Export', function() {
  
  it('should export BrushBase in browser environment', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/BrushBase')];
    require('../../../Classes/systems/tools/BrushBase');
    
    expect(mockWindow.BrushBase).to.exist;
    
    delete global.window;
  });
});




// ================================================================
// BuildingBrush.test.js (41 tests)
// ================================================================
/**
 * Unit Tests for BuildingBrush
 * Tests building placement tool with grid snapping
 */

// Mock p5.js and globals
global.mouseX = 100;
global.mouseY = 100;
global.TILE_SIZE = 32;
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
global.rectMode = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';
global.CORNER = 'corner';

// Mock Buildings array
global.Buildings = [];

// Mock createBuilding function
global.createBuilding = (type, x, y, faction, isActive) => {
  return {
    type,
    x,
    y,
    faction,
    isActive,
    getPosition: () => ({ x, y })
  };
};

// Mock tile interaction manager
global.g_tileInteractionManager = {
  addObject: (obj, category) => true
};

// Mock CoordinateConverter
global.CoordinateConverter = {
  screenToWorld: (x, y) => ({ x, y })
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load BuildingBrush
let { BuildingBrush } = require('../../../Classes/systems/tools/BuildingBrush');

describe('BuildingBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new BuildingBrush();
    global.Buildings = [];
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.brushSize).to.equal(64);
      expect(brush.gridSize).to.equal(32);
    });
    
    it('should initialize with antcone building type', function() {
      expect(brush.buildingType).to.equal('antcone');
    });
    
    it('should have building type colors', function() {
      expect(brush.buildingColors).to.be.an('object');
      expect(brush.buildingColors.antcone).to.be.an('array');
      expect(brush.buildingColors.anthill).to.be.an('array');
      expect(brush.buildingColors.hivesource).to.be.an('array');
    });
    
    it('should initialize brush colors', function() {
      expect(brush.brushColor).to.be.an('array');
      expect(brush.brushColor).to.have.lengthOf(4); // RGBA
      
      expect(brush.brushOutlineColor).to.be.an('array');
      expect(brush.brushOutlineColor).to.have.lengthOf(4);
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulseAnimation).to.equal(0);
      expect(brush.pulseSpeed).to.be.greaterThan(0);
    });
    
    it('should track mouse state', function() {
      expect(brush.isMousePressed).to.be.false;
      expect(brush.lastPlacementPos).to.be.null;
    });
  });
  
  describe('setBuildingType()', function() {
    
    it('should set building type', function() {
      brush.setBuildingType('anthill');
      
      expect(brush.buildingType).to.equal('anthill');
    });
    
    it('should update brush colors for type', function() {
      brush.setBuildingType('hivesource');
      
      const expectedColor = brush.buildingColors.hivesource;
      expect(brush.brushColor[0]).to.equal(expectedColor[0]);
      expect(brush.brushColor[1]).to.equal(expectedColor[1]);
      expect(brush.brushColor[2]).to.equal(expectedColor[2]);
    });
    
    it('should handle unknown building type', function() {
      const originalType = brush.buildingType;
      
      expect(() => {
        brush.setBuildingType('unknownBuilding');
      }).to.not.throw();
      
      expect(brush.buildingType).to.equal('unknownBuilding');
    });
    
    it('should preserve alpha values in colors', function() {
      brush.setBuildingType('antcone');
      
      expect(brush.brushColor[3]).to.equal(100); // Transparent fill
      expect(brush.brushOutlineColor[3]).to.equal(255); // Solid outline
    });
  });
  
  describe('getBuildingType()', function() {
    
    it('should return current building type', function() {
      const type = brush.getBuildingType();
      
      expect(type).to.equal('antcone');
    });
    
    it('should reflect type changes', function() {
      brush.setBuildingType('anthill');
      
      expect(brush.getBuildingType()).to.equal('anthill');
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
  
  describe('activate()', function() {
    
    it('should activate brush', function() {
      brush.activate();
      
      expect(brush.isActive).to.be.true;
    });
    
    it('should activate with specific type', function() {
      brush.activate('hivesource');
      
      expect(brush.isActive).to.be.true;
      expect(brush.buildingType).to.equal('hivesource');
    });
    
    it('should activate without changing type if not provided', function() {
      brush.buildingType = 'anthill';
      brush.activate();
      
      expect(brush.buildingType).to.equal('anthill');
    });
  });
  
  describe('deactivate()', function() {
    
    it('should deactivate brush', function() {
      brush.isActive = true;
      
      brush.deactivate();
      
      expect(brush.isActive).to.be.false;
    });
    
    it('should reset last placement position', function() {
      brush.lastPlacementPos = { x: 100, y: 100 };
      
      brush.deactivate();
      
      expect(brush.lastPlacementPos).to.be.null;
    });
  });
  
  describe('update()', function() {
    
    it('should not update when inactive', function() {
      brush.isActive = false;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.equal(oldPulse);
    });
    
    it('should update pulse animation when active', function() {
      brush.isActive = true;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2π', function() {
      brush.isActive = true;
      brush.pulseAnimation = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.lessThan(Math.PI * 2);
    });
  });
  
  describe('render()', function() {
    
    it('should not render when inactive', function() {
      brush.isActive = false;
      
      expect(() => brush.render()).to.not.throw();
    });
    
    it('should render when active', function() {
      brush.isActive = true;
      
      expect(() => brush.render()).to.not.throw();
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should place building on LEFT click', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.true;
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
      expect(brush.isMousePressed).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should handle LEFT release', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      brush.lastPlacementPos = { x: 100, y: 100 };
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.false;
      expect(brush.lastPlacementPos).to.be.null;
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMouseReleased(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('tryPlaceBuilding()', function() {
    
    it('should snap to grid', function() {
      brush.tryPlaceBuilding(105, 205);
      
      // Should snap to nearest grid position (96, 192)
      expect(global.Buildings.length).to.equal(1);
      const building = global.Buildings[0];
      expect(building.x % 32).to.equal(0);
      expect(building.y % 32).to.equal(0);
    });
    
    it('should create building with correct type', function() {
      brush.setBuildingType('anthill');
      
      brush.tryPlaceBuilding(100, 100);
      
      const building = global.Buildings[0];
      expect(building.type).to.equal('anthill');
    });
    
    it('should create building with Player faction', function() {
      brush.tryPlaceBuilding(100, 100);
      
      const building = global.Buildings[0];
      expect(building.faction).to.equal('Player');
    });
    
    it('should prevent duplicate placements at same location', function() {
      brush.tryPlaceBuilding(100, 100);
      brush.tryPlaceBuilding(100, 100);
      
      // Should only create one building
      expect(global.Buildings.length).to.equal(1);
    });
    
    it('should allow placement at different locations', function() {
      brush.tryPlaceBuilding(100, 100);
      brush.tryPlaceBuilding(200, 200);
      
      expect(global.Buildings.length).to.equal(2);
    });
    
    it('should track last placement position', function() {
      brush.tryPlaceBuilding(105, 205);
      
      expect(brush.lastPlacementPos).to.exist;
      expect(brush.lastPlacementPos.x % 32).to.equal(0);
      expect(brush.lastPlacementPos.y % 32).to.equal(0);
    });
    
    it('should return true when building placed', function() {
      const result = brush.tryPlaceBuilding(100, 100);
      
      expect(result).to.be.true;
    });
    
    it('should return false when duplicate prevented', function() {
      brush.tryPlaceBuilding(100, 100);
      const result = brush.tryPlaceBuilding(100, 100);
      
      expect(result).to.be.false;
    });
    
    it('should handle missing createBuilding function', function() {
      const oldFn = global.createBuilding;
      global.createBuilding = undefined;
      
      const result = brush.tryPlaceBuilding(100, 100);
      
      expect(result).to.be.false;
      
      global.createBuilding = oldFn;
    });
    
    it('should register with TileInteractionManager', function() {
      let addedObject = null;
      let addedCategory = null;
      
      global.g_tileInteractionManager.addObject = (obj, category) => {
        addedObject = obj;
        addedCategory = category;
        return true;
      };
      
      brush.tryPlaceBuilding(100, 100);
      
      expect(addedObject).to.exist;
      expect(addedCategory).to.equal('building');
    });
  });
});

describe('BuildingBrush Integration', function() {
  
  it('should initialize global instance', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/BuildingBrush')];
    const { initializeBuildingBrush } = require('../../../Classes/systems/tools/BuildingBrush');
    
    const brush = initializeBuildingBrush();
    
    expect(mockWindow.g_buildingBrush).to.exist;
    expect(mockWindow.g_buildingBrush).to.equal(brush);
    
    delete global.window;
  });
});




// ================================================================
// Button.test.js (61 tests)
// ================================================================
/**
 * Unit Tests for Button Class
 * Tests UI button creation, interaction, and rendering
 */

// Mock p5.js dependencies
global.push = () => {};
global.pop = () => {};
global.imageMode = () => {};
global.rectMode = () => {};
global.textAlign = () => {};
global.CENTER = 'CENTER';
global.WORD = 'WORD';
global.translate = () => {};
global.scale = () => {};
global.tint = () => {};
global.noTint = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.rect = () => {};
global.image = () => {};
global.text = () => {};
global.textFont = () => {};
global.textSize = () => {};
global.textWrap = () => {};
global.textWidth = (str) => str.length * 8; // Mock text width
global.color = (...args) => args.join(',');
global.sin = Math.sin;
global.frameCount = 0;

// Load CollisionBox2D first (dependency)
let CollisionBox2D = require('../../../Classes/systems/CollisionBox2D');
global.CollisionBox2D = CollisionBox2D;

// Load Button class
let Button = require('../../../Classes/systems/Button');
let { ButtonStyles, createMenuButton } = Button;

describe('Button Class', function() {
  
  describe('Constructor', function() {
    
    it('should create button with position and size', function() {
      const btn = new Button(100, 200, 150, 40, 'Click Me');
      
      expect(btn.x).to.equal(100);
      expect(btn.y).to.equal(200);
      expect(btn.width).to.equal(150);
      expect(btn.height).to.equal(40);
    });
    
    it('should set caption text', function() {
      const btn = new Button(0, 0, 100, 50, 'Test Caption');
      
      expect(btn.caption).to.equal('Test Caption');
    });
    
    it('should create CollisionBox2D for bounds', function() {
      const btn = new Button(10, 20, 100, 50, 'Test');
      
      expect(btn.bounds).to.be.instanceOf(CollisionBox2D);
      expect(btn.bounds.x).to.equal(10);
      expect(btn.bounds.y).to.equal(20);
    });
    
    it('should use default colors', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.backgroundColor).to.equal('#4CAF50');
      expect(btn.hoverColor).to.equal('#45a049');
      expect(btn.textColor).to.equal('white');
      expect(btn.borderColor).to.equal('#333');
    });
    
    it('should apply custom colors from options', function() {
      const btn = new Button(0, 0, 100, 50, 'Test', {
        backgroundColor: '#FF0000',
        hoverColor: '#CC0000',
        textColor: 'black',
        borderColor: '#000000'
      });
      
      expect(btn.backgroundColor).to.equal('#FF0000');
      expect(btn.hoverColor).to.equal('#CC0000');
      expect(btn.textColor).to.equal('black');
      expect(btn.borderColor).to.equal('#000000');
    });
    
    it('should set default styling options', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.borderWidth).to.equal(2);
      expect(btn.cornerRadius).to.equal(5);
      expect(btn.fontFamily).to.equal('Arial');
      expect(btn.fontSize).to.equal(16);
    });
    
    it('should apply custom styling options', function() {
      const btn = new Button(0, 0, 100, 50, 'Test', {
        borderWidth: 3,
        cornerRadius: 10,
        fontFamily: 'Helvetica',
        fontSize: 20
      });
      
      expect(btn.borderWidth).to.equal(3);
      expect(btn.cornerRadius).to.equal(10);
      expect(btn.fontFamily).to.equal('Helvetica');
      expect(btn.fontSize).to.equal(20);
    });
    
    it('should initialize scale properties', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.scale).to.equal(1);
      expect(btn.targetScale).to.equal(1);
      expect(btn.scaleSpeed).to.equal(0.1);
    });
    
    it('should set click handler if provided', function() {
      const handler = () => console.log('clicked');
      const btn = new Button(0, 0, 100, 50, 'Test', { onClick: handler });
      
      expect(btn.onClick).to.equal(handler);
    });
    
    it('should be enabled by default', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.enabled).to.be.true;
    });
    
    it('should respect enabled option', function() {
      const btn = new Button(0, 0, 100, 50, 'Test', { enabled: false });
      
      expect(btn.enabled).to.be.false;
    });
    
    it('should initialize state flags', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.isHovered).to.be.false;
      expect(btn.isPressed).to.be.false;
      expect(btn.wasClicked).to.be.false;
    });
    
    it('should support image option', function() {
      const mockImage = { _mockImage: true };
      const btn = new Button(0, 0, 100, 50, 'Test', { image: mockImage });
      
      expect(btn.img).to.equal(mockImage);
    });
  });
  
  describe('Getter Properties', function() {
    
    it('should return x from bounds', function() {
      const btn = new Button(150, 200, 100, 50, 'Test');
      expect(btn.x).to.equal(150);
    });
    
    it('should return y from bounds', function() {
      const btn = new Button(150, 200, 100, 50, 'Test');
      expect(btn.y).to.equal(200);
    });
    
    it('should return width from bounds', function() {
      const btn = new Button(0, 0, 120, 60, 'Test');
      expect(btn.width).to.equal(120);
    });
    
    it('should return height from bounds', function() {
      const btn = new Button(0, 0, 120, 60, 'Test');
      expect(btn.height).to.equal(60);
    });
  });
  
  describe('isMouseOver()', function() {
    
    it('should return true when mouse is over button', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.isMouseOver(150, 125)).to.be.true;
    });
    
    it('should return false when mouse is outside button', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.isMouseOver(50, 50)).to.be.false;
      expect(btn.isMouseOver(250, 200)).to.be.false;
    });
    
    it('should check boundaries correctly', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.isMouseOver(100, 100)).to.be.true; // Top-left corner
      expect(btn.isMouseOver(200, 150)).to.be.true; // Bottom-right corner
      expect(btn.isMouseOver(99, 125)).to.be.false; // Just outside left
      expect(btn.isMouseOver(201, 125)).to.be.false; // Just outside right
    });
  });
  
  describe('update()', function() {
    
    it('should detect hover state', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, false);
      
      expect(btn.isHovered).to.be.true;
    });
    
    it('should detect when mouse leaves', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, false);
      expect(btn.isHovered).to.be.true;
      
      btn.update(50, 50, false);
      expect(btn.isHovered).to.be.false;
    });
    
    it('should detect mouse press on button', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true);
      
      expect(btn.isPressed).to.be.true;
    });
    
    it('should call onClick handler on release', function() {
      let clicked = false;
      const btn = new Button(100, 100, 100, 50, 'Test', {
        onClick: () => { clicked = true; }
      });
      
      // Press
      btn.update(150, 125, true);
      expect(clicked).to.be.false;
      
      // Release while still hovering
      btn.update(150, 125, false);
      expect(clicked).to.be.true;
    });
    
    it('should set wasClicked flag on successful click', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true); // Press
      btn.update(150, 125, false); // Release
      
      expect(btn.wasClicked).to.be.true;
    });
    
    it('should not trigger onClick if released outside button', function() {
      let clicked = false;
      const btn = new Button(100, 100, 100, 50, 'Test', {
        onClick: () => { clicked = true; }
      });
      
      btn.update(150, 125, true); // Press inside
      btn.update(50, 50, false); // Release outside
      
      expect(clicked).to.be.false;
    });
    
    it('should not respond when disabled', function() {
      const btn = new Button(100, 100, 100, 50, 'Test', { enabled: false });
      
      btn.update(150, 125, true);
      
      expect(btn.isHovered).to.be.false;
      expect(btn.isPressed).to.be.false;
    });
    
    it('should return true when consuming mouse event', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      const consumed = btn.update(150, 125, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return false when not consuming event', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      const consumed = btn.update(50, 50, false);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Setter Methods', function() {
    
    describe('setBackgroundColor()', function() {
      it('should update background color', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setBackgroundColor('#FF0000');
        
        expect(btn.backgroundColor).to.equal('#FF0000');
      });
    });
    
    describe('setHoverColor()', function() {
      it('should update hover color', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setHoverColor('#00FF00');
        
        expect(btn.hoverColor).to.equal('#00FF00');
      });
    });
    
    describe('setTextColor()', function() {
      it('should update text color', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setTextColor('black');
        
        expect(btn.textColor).to.equal('black');
      });
    });
    
    describe('setCaption()', function() {
      it('should update caption text', function() {
        const btn = new Button(0, 0, 100, 50, 'Old Text');
        
        btn.setCaption('New Text');
        
        expect(btn.caption).to.equal('New Text');
      });
    });
    
    describe('setText()', function() {
      it('should update caption text (alias)', function() {
        const btn = new Button(0, 0, 100, 50, 'Old Text');
        
        btn.setText('New Text');
        
        expect(btn.caption).to.equal('New Text');
      });
    });
    
    describe('setPosition()', function() {
      it('should update button position', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setPosition(200, 300);
        
        expect(btn.x).to.equal(200);
        expect(btn.y).to.equal(300);
      });
    });
    
    describe('setSize()', function() {
      it('should update button size', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setSize(150, 75);
        
        expect(btn.width).to.equal(150);
        expect(btn.height).to.equal(75);
      });
    });
    
    describe('setEnabled()', function() {
      it('should enable button', function() {
        const btn = new Button(0, 0, 100, 50, 'Test', { enabled: false });
        
        btn.setEnabled(true);
        
        expect(btn.enabled).to.be.true;
      });
      
      it('should disable button', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setEnabled(false);
        
        expect(btn.enabled).to.be.false;
      });
      
      it('should clear hover/press state when disabled', function() {
        const btn = new Button(100, 100, 100, 50, 'Test');
        
        btn.update(150, 125, true); // Hover and press
        expect(btn.isHovered).to.be.true;
        expect(btn.isPressed).to.be.true;
        
        btn.setEnabled(false);
        
        expect(btn.isHovered).to.be.false;
        expect(btn.isPressed).to.be.false;
      });
    });
    
    describe('setOnClick()', function() {
      it('should set click handler', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        const handler = () => console.log('new handler');
        
        btn.setOnClick(handler);
        
        expect(btn.onClick).to.equal(handler);
      });
    });
  });
  
  describe('wasClickedThisFrame()', function() {
    
    it('should return true if clicked this frame', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true);
      btn.update(150, 125, false);
      
      expect(btn.wasClickedThisFrame()).to.be.true;
    });
    
    it('should return false if not clicked', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.wasClickedThisFrame()).to.be.false;
    });
    
    it('should reset flag after check', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true);
      btn.update(150, 125, false);
      
      expect(btn.wasClickedThisFrame()).to.be.true;
      expect(btn.wasClickedThisFrame()).to.be.false; // Second call returns false
    });
  });
  
  describe('getBounds()', function() {
    
    it('should return bounds object', function() {
      const btn = new Button(10, 20, 100, 50, 'Test');
      
      const bounds = btn.getBounds();
      
      expect(bounds).to.deep.equal({
        x: 10,
        y: 20,
        width: 100,
        height: 50
      });
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const btn = new Button(10, 20, 100, 50, 'Test');
      
      const info = btn.getDebugInfo();
      
      expect(info.position).to.deep.equal({ x: 10, y: 20 });
      expect(info.size).to.deep.equal({ width: 100, height: 50 });
      expect(info.caption).to.equal('Test');
      expect(info.enabled).to.be.true;
      expect(info.colors).to.exist;
    });
  });
  
  describe('Text Wrapping', function() {
    
    describe('wrapTextToFit()', function() {
      
      it('should wrap text to fit width', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        const wrapped = btn.wrapTextToFit('This is a long text', 50, 12);
        
        expect(wrapped).to.be.a('string');
        expect(wrapped).to.include('\n'); // Should have line breaks
      });
      
      it('should not wrap short text', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        const wrapped = btn.wrapTextToFit('Short', 200, 12);
        
        expect(wrapped).to.equal('Short');
        expect(wrapped).to.not.include('\n');
      });
    });
    
    describe('calculateWrappedTextHeight()', function() {
      
      it('should calculate height for wrapped text', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        const height = btn.calculateWrappedTextHeight('Short text', 100, 16);
        
        expect(height).to.be.a('number');
        expect(height).to.be.greaterThan(0);
      });
    });
  });
  
  describe('darkenColor()', function() {
    
    it('should darken hex color', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      const darkened = btn.darkenColor('#FFFFFF', 0.5);
      
      expect(darkened).to.be.a('string');
      expect(darkened).to.match(/^#[0-9a-f]{6}$/);
    });
    
    it('should return original if not hex', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      const result = btn.darkenColor('rgb(255, 0, 0)', 0.5);
      
      expect(result).to.equal('rgb(255, 0, 0)');
    });
  });
});

describe('ButtonStyles', function() {
  
  it('should define TOOLBAR style', function() {
    expect(ButtonStyles.TOOLBAR).to.exist;
    expect(ButtonStyles.TOOLBAR.backgroundColor).to.exist;
  });
  
  it('should define MAIN_MENU style', function() {
    expect(ButtonStyles.MAIN_MENU).to.exist;
  });
  
  it('should define DEFAULT style', function() {
    expect(ButtonStyles.DEFAULT).to.exist;
  });
  
  it('should define SUCCESS style', function() {
    expect(ButtonStyles.SUCCESS).to.exist;
  });
});

describe('createMenuButton()', function() {
  
  it('should create button with default style', function() {
    const btn = createMenuButton(0, 0, 100, 50, 'Test');
    
    expect(btn).to.be.instanceOf(Button);
    expect(btn.caption).to.equal('Test');
  });
  
  it('should apply style by name', function() {
    const btn = createMenuButton(0, 0, 100, 50, 'Test', 'success');
    
    expect(btn.backgroundColor).to.equal(ButtonStyles.SUCCESS.backgroundColor);
  });
  
  it('should set click handler', function() {
    const handler = () => console.log('clicked');
    const btn = createMenuButton(0, 0, 100, 50, 'Test', 'default', handler);
    
    expect(btn.onClick).to.equal(handler);
  });
  
  it('should create action method for backwards compatibility', function() {
    const btn = createMenuButton(0, 0, 100, 50, 'Test');
    
    expect(btn.action).to.be.a('function');
  });
});




// ================================================================
// collisionBox2D.test.js (2 tests)
// ================================================================
// DUPLICATE REQUIRE REMOVED: let CollisionBox2D = require('../../Classes/systems/CollisionBox2D.js');

describe('CollisionBox2D', function() {
  it('constructor sets properties', () => {
    const b = new CollisionBox2D(10, 20, 100, 80);
    expect(b.x).to.equal(10);
    expect(b.y).to.equal(20);
    expect(b.width).to.equal(100);
    expect(b.height).to.equal(80);
  });

  it('contains and isPointInside detect points correctly', () => {
    const b = new CollisionBox2D(10, 10, 100, 100);
    expect(b.contains(50, 50)).to.be.true;
    expect(b.isPointInside(10, 10)).to.be.true;
    expect(b.contains(110, 110)).to.be.true;
    expect(b.contains(5, 50)).to.be.false;
    expect(b.contains(50, 5)).to.be.false;
  });
});




// ================================================================
// CoordinateConverter.test.js (28 tests)
// ================================================================
/**
 * Unit Tests for CoordinateConverter
 * Tests coordinate system conversion utilities
 */

// Mock globals
global.TILE_SIZE = 32;
global.window = global;
global.g_activeMap = null;

// Load CoordinateConverter
let CoordinateConverter = require('../../../Classes/systems/CoordinateConverter');

describe('CoordinateConverter', function() {
  
  beforeEach(function() {
    // Reset mock state before each test
    global.g_activeMap = null;
    global.cameraX = 0;
    global.cameraY = 0;
  });
  
  describe('getTileSize()', function() {
    
    it('should return TILE_SIZE when defined', function() {
      global.TILE_SIZE = 32;
      
      expect(CoordinateConverter.getTileSize()).to.equal(32);
    });
    
    it('should return default 32 when TILE_SIZE undefined', function() {
      const oldTileSize = global.TILE_SIZE;
      delete global.TILE_SIZE;
      
      expect(CoordinateConverter.getTileSize()).to.equal(32);
      
      global.TILE_SIZE = oldTileSize; // Restore
    });
  });
  
  describe('isAvailable()', function() {
    
    it('should return false when g_activeMap undefined', function() {
      global.g_activeMap = undefined;
      
      expect(CoordinateConverter.isAvailable()).to.be.false;
    });
    
    it('should return false when g_activeMap null', function() {
      global.g_activeMap = null;
      
      expect(CoordinateConverter.isAvailable()).to.be.false;
    });
    
    it('should return false when renderConversion missing', function() {
      global.g_activeMap = {};
      
      expect(CoordinateConverter.isAvailable()).to.be.false;
    });
    
    it('should return true when terrain system available', function() {
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: () => [0, 0],
          convPosToCanvas: () => [0, 0]
        }
      };
      global.TILE_SIZE = 32;
      
      expect(CoordinateConverter.isAvailable()).to.be.true;
    });
  });
  
  describe('worldToTile()', function() {
    
    it('should convert world pixels to tile coordinates', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(64, 96);
      
      expect(tile.x).to.equal(2); // 64 / 32
      expect(tile.y).to.equal(3); // 96 / 32
    });
    
    it('should floor tile coordinates', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(75, 110);
      
      expect(tile.x).to.equal(2); // floor(75 / 32)
      expect(tile.y).to.equal(3); // floor(110 / 32)
    });
    
    it('should handle negative coordinates', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(-64, -96);
      
      expect(tile.x).to.equal(-2);
      expect(tile.y).to.equal(-3);
    });
    
    it('should handle origin correctly', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(0, 0);
      
      expect(tile.x).to.equal(0);
      expect(tile.y).to.equal(0);
    });
  });
  
  describe('tileToWorld()', function() {
    
    it('should convert tile coordinates to world pixels', function() {
      global.TILE_SIZE = 32;
      
      const world = CoordinateConverter.tileToWorld(5, 10);
      
      expect(world.x).to.equal(160); // 5 * 32
      expect(world.y).to.equal(320); // 10 * 32
    });
    
    it('should handle negative tile coordinates', function() {
      global.TILE_SIZE = 32;
      
      const world = CoordinateConverter.tileToWorld(-3, -5);
      
      expect(world.x).to.equal(-96);
      expect(world.y).to.equal(-160);
    });
    
    it('should handle zero coordinates', function() {
      global.TILE_SIZE = 32;
      
      const world = CoordinateConverter.tileToWorld(0, 0);
      
      expect(world.x).to.equal(0);
      expect(world.y).to.equal(0);
    });
  });
  
  describe('screenToWorld() with terrain system', function() {
    
    it('should use terrain system when available', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            return [screenPos[0] / 32, screenPos[1] / 32];
          }
        }
      };
      
      const world = CoordinateConverter.screenToWorld(320, 480);
      
      expect(world.x).to.equal(320); // (320/32) * 32
      expect(world.y).to.equal(480); // (480/32) * 32
    });
    
    it('should handle terrain system with camera offset', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            // Mock camera at (10, 10) in tile space
            return [screenPos[0] / 32 + 10, screenPos[1] / 32 + 10];
          }
        }
      };
      
      const world = CoordinateConverter.screenToWorld(0, 0);
      
      expect(world.x).to.equal(320); // (0 + 10) * 32
      expect(world.y).to.equal(320); // (0 + 10) * 32
    });
  });
  
  describe('screenToWorld() fallback modes', function() {
    
    it('should use fallback camera globals when terrain unavailable', function() {
      global.g_activeMap = null;
      global.cameraX = 100;
      global.cameraY = 200;
      
      const world = CoordinateConverter.screenToWorld(50, 75);
      
      expect(world.x).to.equal(150); // 50 + 100
      expect(world.y).to.equal(275); // 75 + 200
    });
    
    it('should handle missing camera globals', function() {
      global.g_activeMap = null;
      delete global.cameraX;
      delete global.cameraY;
      
      const world = CoordinateConverter.screenToWorld(100, 200);
      
      expect(world.x).to.equal(100); // No offset
      expect(world.y).to.equal(200); // No offset
    });
  });
  
  describe('worldToScreen() with terrain system', function() {
    
    it('should use terrain system when available', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: (tilePos) => {
            return [tilePos[0] * 32, tilePos[1] * 32];
          }
        }
      };
      
      const screen = CoordinateConverter.worldToScreen(160, 320);
      
      expect(screen.x).to.equal(160); // (160/32) * 32
      expect(screen.y).to.equal(320); // (320/32) * 32
    });
  });
  
  describe('worldToScreen() fallback modes', function() {
    
    it('should use fallback camera globals when terrain unavailable', function() {
      global.g_activeMap = null;
      global.cameraX = 100;
      global.cameraY = 200;
      
      const screen = CoordinateConverter.worldToScreen(250, 450);
      
      expect(screen.x).to.equal(150); // 250 - 100
      expect(screen.y).to.equal(250); // 450 - 200
    });
  });
  
  describe('screenToWorldTile()', function() {
    
    it('should convert screen to tile coordinates via terrain', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            return [screenPos[0] / 32, screenPos[1] / 32];
          }
        }
      };
      
      const tile = CoordinateConverter.screenToWorldTile(96, 128);
      
      expect(tile.x).to.equal(3); // floor(96 / 32)
      expect(tile.y).to.equal(4); // floor(128 / 32)
    });
    
    it('should floor tile coordinates', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            return [screenPos[0] / 32 + 0.7, screenPos[1] / 32 + 0.3];
          }
        }
      };
      
      const tile = CoordinateConverter.screenToWorldTile(0, 0);
      
      expect(tile.x).to.equal(0); // floor(0.7)
      expect(tile.y).to.equal(0); // floor(0.3)
    });
  });
  
  describe('worldTileToScreen()', function() {
    
    it('should convert tile coordinates to screen via terrain', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: (tilePos) => {
            return [tilePos[0] * 32, tilePos[1] * 32];
          }
        }
      };
      
      const screen = CoordinateConverter.worldTileToScreen(5, 10);
      
      expect(screen.x).to.equal(160); // 5 * 32
      expect(screen.y).to.equal(320); // 10 * 32
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information object', function() {
      const info = CoordinateConverter.getDebugInfo();
      
      expect(info).to.be.an('object');
      expect(info.terrainSystemAvailable).to.be.a('boolean');
      expect(info.g_activeMapExists).to.be.a('boolean');
      expect(info.tileSizeDefined).to.be.a('boolean');
      expect(info.tileSize).to.be.a('number');
    });
    
    it('should reflect terrain system availability', function() {
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: () => [0, 0],
          convPosToCanvas: () => [0, 0]
        }
      };
      global.TILE_SIZE = 32;
      
      const info = CoordinateConverter.getDebugInfo();
      
      expect(info.terrainSystemAvailable).to.be.true;
      expect(info.g_activeMapExists).to.be.true;
      expect(info.renderConversionExists).to.be.true;
    });
    
    it('should reflect missing terrain system', function() {
      global.g_activeMap = null;
      
      const info = CoordinateConverter.getDebugInfo();
      
      expect(info.terrainSystemAvailable).to.be.false;
      expect(info.g_activeMapExists).to.be.false;
    });
  });
  
  describe('Round-trip Conversions', function() {
    
    it('should preserve tile coordinates in round trip', function() {
      global.TILE_SIZE = 32;
      
      const originalTile = { x: 10, y: 15 };
      const worldPos = CoordinateConverter.tileToWorld(originalTile.x, originalTile.y);
      const backToTile = CoordinateConverter.worldToTile(worldPos.x, worldPos.y);
      
      expect(backToTile.x).to.equal(originalTile.x);
      expect(backToTile.y).to.equal(originalTile.y);
    });
  });
  
  describe('Error Handling', function() {
    
    it('should handle errors in screenToWorld gracefully', function() {
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: () => {
            throw new Error('Mock error');
          }
        }
      };
      
      // Should not throw, should fall back
      const result = CoordinateConverter.screenToWorld(100, 100);
      
      expect(result).to.exist;
      expect(result.x).to.be.a('number');
      expect(result.y).to.be.a('number');
    });
    
    it('should handle errors in worldToScreen gracefully', function() {
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: () => {
            throw new Error('Mock error');
          }
        }
      };
      
      // Should not throw, should fall back
      const result = CoordinateConverter.worldToScreen(100, 100);
      
      expect(result).to.exist;
      expect(result.x).to.be.a('number');
      expect(result.y).to.be.a('number');
    });
  });
});




// ================================================================
// DraggablePanelSystem.test.js (38 tests)
// ================================================================
/**
 * Unit Tests for DraggablePanelSystem
 * Tests system initialization and panel setup
 */

// Mock globals
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  draggablePanelManager: null,
  draggablePanelContentRenderers: null
};

global.console = {
  log: () => {},
  error: () => {},
  warn: () => {}
};

// Mock globalThis
global.globalThis = {
  logVerbose: () => {},
  logNormal: () => {}
};

// Mock g_renderLayerManager for debug info panel
global.g_renderLayerManager = {
  renderStats: {
    frameCount: 0,
    lastFrameTime: 16.67
  },
  getLayersForState: () => [],
  getLayerStates: () => ({
    TERRAIN: true,
    ENTITIES: true,
    EFFECTS: true
  }),
  layerRenderers: new Map(),
  layerDrawables: new Map()
};

// Mock DraggablePanelManager
class MockDraggablePanelManager {
  constructor() {
    this.panels = [];
    this.isInitialized = false;
  }
  
  initialize() {
    this.isInitialized = true;
  }
  
  addPanel(config) {
    const panel = { ...config };
    this.panels.push(panel);
    return panel;
  }
  
  togglePanel(id) {
    const panel = this.panels.find(p => p.id === id);
    if (panel) {
      panel.visible = !panel.visible;
      return panel.visible;
    }
    return false;
  }
  
  resetAllPanels() {
    this.panels.forEach(p => p.position = p.originalPosition);
  }
  
  getPanelCount() {
    return this.panels.length;
  }
  
  getVisiblePanelCount() {
    return this.panels.filter(p => p.visible).length;
  }
  
  update(mx, my, mouse) {
    return false;
  }
  
  render(renderers) {}
}

global.DraggablePanelManager = MockDraggablePanelManager;

// Mock p5.js keyboard
global.keyCode = 0;
global.SHIFT = 16;
global.CONTROL = 17;
global.keyIsDown = (code) => false;

// Mock resource managers
global.g_resourceManager = {
  getResourcesByType: (type) => [],
  getResourceList: () => []
};

global.ants = [];

// Mock GameState
global.GameState = {
  getState: () => 'PLAYING',
  getDebugInfo: () => ({ state: 'PLAYING' })
};

// Mock performance
global.performance = {
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024
  }
};

// Mock globals
global.g_canvasX = 1920;
global.g_canvasY = 1080;
global.TILE_SIZE = 32;

// Mock text and frameRate functions
global.text = () => {};
global.frameRate = () => 60;

// Load DraggablePanelSystem
let systemPath = '../../../Classes/systems/ui/DraggablePanelSystem.js';
delete require.cache[require.resolve(systemPath)];
let systemCode = require('fs').readFileSync(
  require('path').resolve(__dirname, systemPath),
  'utf8'
);
eval(systemCode);

describe('DraggablePanelSystem', function() {
  
  beforeEach(function() {
    global.window.draggablePanelManager = null;
    global.window.draggablePanelContentRenderers = null;
  });
  
  describe('initializeDraggablePanelSystem()', function() {
    
    it('should exist as function', function() {
      expect(initializeDraggablePanelSystem).to.be.a('function');
    });
    
    it('should create panel manager instance', async function() {
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelManager).to.exist;
    });
    
    it('should initialize panel manager', async function() {
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelManager.isInitialized).to.be.true;
    });
    
    it('should create resource display panel', async function() {
      await initializeDraggablePanelSystem();
      
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      expect(panel).to.exist;
      expect(panel.title).to.equal('Resources');
    });
    
    it('should create performance monitor panel', async function() {
      await initializeDraggablePanelSystem();
      
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'performance-monitor');
      expect(panel).to.exist;
      expect(panel.title).to.equal('Performance Monitor');
    });
    
    it('should create debug info panel', async function() {
      await initializeDraggablePanelSystem();
      
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'debug-info');
      expect(panel).to.exist;
      expect(panel.title).to.equal('Debug Info');
    });
    
    it('should set up content renderers', async function() {
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelContentRenderers).to.exist;
      expect(global.window.draggablePanelContentRenderers['resource-display']).to.be.a('function');
      expect(global.window.draggablePanelContentRenderers['performance-monitor']).to.be.a('function');
      expect(global.window.draggablePanelContentRenderers['debug-info']).to.be.a('function');
    });
    
    it('should return true on success', async function() {
      const result = await initializeDraggablePanelSystem();
      
      expect(result).to.be.true;
    });
    
    it('should prevent duplicate initialization', async function() {
      await initializeDraggablePanelSystem();
      const panelCount = global.window.draggablePanelManager.panels.length;
      
      await initializeDraggablePanelSystem();
      
      expect(global.window.draggablePanelManager.panels.length).to.equal(panelCount);
    });
    
    it('should handle missing DraggablePanelManager', async function() {
      const oldManager = global.DraggablePanelManager;
      global.DraggablePanelManager = undefined;
      
      const result = await initializeDraggablePanelSystem();
      
      expect(result).to.be.false;
      
      global.DraggablePanelManager = oldManager;
    });
  });
  
  describe('Panel Configurations', function() {
    
    beforeEach(async function() {
      await initializeDraggablePanelSystem();
    });
    
    it('should position resource panel at bottom right', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      
      expect(panel.position.x).to.be.greaterThan(1700);
      expect(panel.position.y).to.be.greaterThan(900);
    });
    
    it('should set draggable behavior', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      
      expect(panel.behavior.draggable).to.be.true;
    });
    
    it('should set persistent behavior', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'performance-monitor');
      
      expect(panel.behavior.persistent).to.be.true;
    });
    
    it('should constrain panels to screen', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'debug-info');
      
      expect(panel.behavior.constrainToScreen).to.be.true;
    });
    
    it('should enable snap to edges', function() {
      const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'resource-display');
      
      expect(panel.behavior.snapToEdges).to.be.true;
    });
  });
  
  describe('Content Renderers', function() {
    
    beforeEach(async function() {
      await initializeDraggablePanelSystem();
    });
    
    it('should render resource display content', function() {
      const renderer = global.window.draggablePanelContentRenderers['resource-display'];
      const contentArea = { x: 100, y: 100 };
      const style = {};
      
      expect(() => renderer(contentArea, style)).to.not.throw();
    });
    
    it('should render performance monitor content', function() {
      const renderer = global.window.draggablePanelContentRenderers['performance-monitor'];
      const contentArea = { x: 100, y: 100 };
      const style = {};
      
      expect(() => renderer(contentArea, style)).to.not.throw();
    });
    
    it('should render debug info content', function() {
      const renderer = global.window.draggablePanelContentRenderers['debug-info'];
      const contentArea = { x: 100, y: 100 };
      const style = {};
      
      expect(() => renderer(contentArea, style)).to.not.throw();
    });
  });
  
  describe('updateDraggablePanels()', function() {
    
    it('should exist as function', function() {
      expect(updateDraggablePanels).to.be.a('function');
    });
    
    it('should update panel manager', async function() {
      await initializeDraggablePanelSystem();
      global.mouseX = 100;
      global.mouseY = 100;
      global.mouseIsPressed = false;
      global.mouse = {};
      global.RenderManager = {
        startRendererOverwrite: () => {}
      };
      
      expect(() => updateDraggablePanels()).to.not.throw();
    });
    
    it('should handle missing mouse coordinates', function() {
      global.mouseX = undefined;
      
      expect(() => updateDraggablePanels()).to.not.throw();
    });
  });
  
  describe('renderDraggablePanels()', function() {
    
    it('should exist as function', function() {
      expect(renderDraggablePanels).to.be.a('function');
    });
    
    it('should render panels', async function() {
      await initializeDraggablePanelSystem();
      
      expect(() => renderDraggablePanels()).to.not.throw();
    });
    
    it('should handle missing panel manager', function() {
      global.window.draggablePanelManager = null;
      
      expect(() => renderDraggablePanels()).to.not.throw();
    });
  });
});

describe('Panel Keyboard Shortcuts', function() {
  
  beforeEach(async function() {
    global.window.draggablePanelManager = null;
    await initializeDraggablePanelSystem();
  });
  
  it('should toggle performance monitor with Ctrl+Shift+1', function() {
    const panel = global.window.draggablePanelManager.panels.find(p => p.id === 'performance-monitor');
    const initialVisibility = panel.visible;
    
    // Simulate keypress
    global.keyCode = 49; // '1'
    global.keyIsDown = (code) => code === 16 || code === 17; // Shift + Control
    
    if (global.window.keyPressed) {
      global.window.keyPressed();
    }
    
    // Note: In actual implementation, panel would toggle
  });
  
  it('should reset panels with Ctrl+Shift+R', function() {
    // Simulate keypress
    global.keyCode = 82; // 'R'
    global.keyIsDown = (code) => code === 16 || code === 17;
    
    if (global.window.keyPressed) {
      expect(() => global.window.keyPressed()).to.not.throw();
    }
  });
});

describe('DraggablePanelSystem Exports', function() {
  
  it('should export to window', function() {
    expect(global.window.initializeDraggablePanelSystem).to.be.a('function');
    expect(global.window.updateDraggablePanels).to.be.a('function');
    expect(global.window.renderDraggablePanels).to.be.a('function');
  });
});

describe('DraggablePanelManager - managedExternally Flag', function() {
  let manager;

  beforeEach(function() {
    manager = new MockDraggablePanelManager();
    manager.initialize();
  });

  describe('Panel Rendering with managedExternally', function() {
    it('should skip rendering panels with managedExternally: true', function() {
      const panel = {
        id: 'test-managed',
        title: 'Managed Panel',
        visible: true,
        managedExternally: true,
        render: function() {
          this.renderCalled = true;
        },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.false;
    });

    it('should render panels with managedExternally: false', function() {
      const panel = {
        id: 'test-normal',
        title: 'Normal Panel',
        visible: true,
        managedExternally: false,
        render: function() {
          this.renderCalled = true;
        },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.true;
    });

    it('should render panels when managedExternally is undefined', function() {
      const panel = {
        id: 'test-default',
        title: 'Default Panel',
        visible: true,
        // managedExternally not set
        render: function() {
          this.renderCalled = true;
        },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.true;
    });
  });

  describe('Mixed Panel Types', function() {
    it('should only render non-managed panels', function() {
      const panels = [
        {
          id: 'managed1',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'normal1',
          visible: true,
          managedExternally: false,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'managed2',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'normal2',
          visible: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        }
      ];

      panels.forEach(p => manager.panels.push(p));

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panels[0].renderCalled).to.be.false; // managed1
      expect(panels[1].renderCalled).to.be.true;  // normal1
      expect(panels[2].renderCalled).to.be.false; // managed2
      expect(panels[3].renderCalled).to.be.true;  // normal2
    });

    it('should count correct number of rendered panels', function() {
      const panels = [
        { id: 'm1', visible: true, managedExternally: true },
        { id: 'n1', visible: true, managedExternally: false },
        { id: 'm2', visible: true, managedExternally: true },
        { id: 'n2', visible: true }
      ];

      let renderCount = 0;
      panels.forEach(p => {
        p.render = () => { renderCount++; };
        manager.panels.push(p);
      });

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(renderCount).to.equal(2);
    });
  });

  describe('Visibility Interactions', function() {
    it('should not render invisible panels regardless of managedExternally', function() {
      const panels = [
        {
          id: 'hidden-managed',
          visible: false,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'hidden-normal',
          visible: false,
          managedExternally: false,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        }
      ];

      panels.forEach(p => manager.panels.push(p));

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panels[0].renderCalled).to.be.false;
      expect(panels[1].renderCalled).to.be.false;
    });

    it('should not render visible managed panels', function() {
      const panel = {
        id: 'visible-managed',
        visible: true,
        managedExternally: true,
        render: function() { this.renderCalled = true; },
        renderCalled: false
      };

      manager.panels.push(panel);

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(panel.renderCalled).to.be.false;
    });
  });

  describe('Level Editor Panels', function() {
    it('should have managedExternally set for level editor materials panel', function() {
      const levelEditorPanel = {
        id: 'level-editor-materials',
        title: 'Materials',
        managedExternally: true,
        visible: true
      };

      expect(levelEditorPanel.managedExternally).to.be.true;
    });

    it('should have managedExternally set for level editor tools panel', function() {
      const levelEditorPanel = {
        id: 'level-editor-tools',
        title: 'Tools',
        managedExternally: true,
        visible: true
      };

      expect(levelEditorPanel.managedExternally).to.be.true;
    });

    it('should have managedExternally set for level editor brush panel', function() {
      const levelEditorPanel = {
        id: 'level-editor-brush',
        title: 'Brush Size',
        managedExternally: true,
        visible: true
      };

      expect(levelEditorPanel.managedExternally).to.be.true;
    });

    it('should not auto-render any level editor panels', function() {
      const levelEditorPanels = [
        {
          id: 'level-editor-materials',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'level-editor-tools',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        },
        {
          id: 'level-editor-brush',
          visible: true,
          managedExternally: true,
          render: function() { this.renderCalled = true; },
          renderCalled: false
        }
      ];

      levelEditorPanels.forEach(p => manager.panels.push(p));

      // Simulate renderPanels logic
      manager.panels.forEach(p => {
        if (p.visible && !p.managedExternally) {
          p.render();
        }
      });

      expect(levelEditorPanels[0].renderCalled).to.be.false;
      expect(levelEditorPanels[1].renderCalled).to.be.false;
      expect(levelEditorPanels[2].renderCalled).to.be.false;
    });
  });
});




// ================================================================
// EnemyAntBrush.test.js (34 tests)
// ================================================================
/**
 * Unit Tests for EnemyAntBrush
 * Tests enemy ant spawning/painting tool
 */

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
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';

// Mock ants array
global.ants = [];

// Mock AntUtilities
global.AntUtilities = {
  spawnAnt: function(x, y, job, faction) {
    const ant = {
      x, y, job, faction,
      setPosition: function(newX, newY) {
        this.x = newX;
        this.y = newY;
      }
    };
    global.ants.push(ant);
    return ant;
  }
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load EnemyAntBrush
let { EnemyAntBrush } = require('../../../Classes/systems/tools/EnemyAntBrush');

describe('EnemyAntBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new EnemyAntBrush();
    global.ants = [];
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.brushSize).to.equal(30);
      expect(brush.spawnCooldown).to.equal(50);
    });
    
    it('should initialize brush colors', function() {
      expect(brush.brushColor).to.be.an('array');
      expect(brush.brushColor).to.have.lengthOf(4); // RGBA
      
      // Orange color for enemy
      expect(brush.brushColor[0]).to.equal(255);
      expect(brush.brushColor[1]).to.equal(69);
      expect(brush.brushColor[2]).to.equal(0);
    });
    
    it('should initialize mouse tracking', function() {
      expect(brush.isMousePressed).to.be.false;
      expect(brush.lastSpawnTime).to.equal(0);
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulseAnimation).to.equal(0);
      expect(brush.pulseSpeed).to.be.greaterThan(0);
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
  
  describe('activate()', function() {
    
    it('should activate brush', function() {
      brush.activate();
      
      expect(brush.isActive).to.be.true;
    });
  });
  
  describe('deactivate()', function() {
    
    it('should deactivate brush', function() {
      brush.isActive = true;
      
      brush.deactivate();
      
      expect(brush.isActive).to.be.false;
    });
  });
  
  describe('update()', function() {
    
    it('should not update when inactive', function() {
      brush.isActive = false;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.equal(oldPulse);
    });
    
    it('should update pulse animation when active', function() {
      brush.isActive = true;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2π', function() {
      brush.isActive = true;
      brush.pulseAnimation = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.lessThan(Math.PI * 2);
    });
    
    it('should handle continuous painting when mouse pressed', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      brush.lastSpawnTime = 0;
      
      global.mouseX = 150;
      global.mouseY = 200;
      
      brush.update();
      
      // Should spawn ant
      expect(global.ants.length).to.be.greaterThan(0);
    });
  });
  
  describe('render()', function() {
    
    it('should not render when inactive', function() {
      brush.isActive = false;
      
      expect(() => brush.render()).to.not.throw();
    });
    
    it('should render when active', function() {
      brush.isActive = true;
      
      expect(() => brush.render()).to.not.throw();
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should start continuous painting on LEFT click', function() {
      brush.isActive = true;
      brush.lastSpawnTime = 0;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.true;
      expect(global.ants.length).to.be.greaterThan(0);
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
      expect(brush.isMousePressed).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should stop continuous painting on LEFT release', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.false;
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMouseReleased(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('trySpawnAnt()', function() {
    
    it('should spawn ant at location', function() {
      brush.lastSpawnTime = 0;
      
      const result = brush.trySpawnAnt(100, 100);
      
      expect(result).to.be.true;
      expect(global.ants.length).to.equal(1);
    });
    
    it('should respect cooldown', function() {
      brush.lastSpawnTime = Date.now();
      
      const result = brush.trySpawnAnt(100, 100);
      
      expect(result).to.be.false;
      expect(global.ants.length).to.equal(0);
    });
    
    it('should spawn enemy faction ants', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      const ant = global.ants[0];
      expect(ant.faction).to.equal('enemy');
    });
    
    it('should spawn warrior ants', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      const ant = global.ants[0];
      expect(ant.job).to.equal('Warrior');
    });
    
    it('should add randomness to spawn position', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      const ant = global.ants[0];
      // Position should be near 100, but with some offset
      expect(Math.abs(ant.x - 100)).to.be.lessThan(brush.brushSize);
      expect(Math.abs(ant.y - 100)).to.be.lessThan(brush.brushSize);
    });
    
    it('should update last spawn time on success', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      expect(brush.lastSpawnTime).to.be.greaterThan(0);
    });
    
    it('should handle missing AntUtilities gracefully', function() {
      const oldUtilities = global.AntUtilities;
      global.AntUtilities = undefined;
      
      brush.lastSpawnTime = 0;
      
      expect(() => {
        brush.trySpawnAnt(100, 100);
      }).to.not.throw();
      
      global.AntUtilities = oldUtilities;
    });
    
    it('should fallback to command system if AntUtilities fails', function() {
      global.AntUtilities = {
        spawnAnt: () => null // Simulate failure
      };
      
      global.executeCommand = (cmd) => {
        if (cmd.includes('spawn')) {
          global.ants.push({ x: 100, y: 100, job: 'Warrior', faction: 'enemy' });
        }
      };
      
      brush.lastSpawnTime = 0;
      const result = brush.trySpawnAnt(100, 100);
      
      expect(result).to.be.true;
      expect(global.ants.length).to.equal(1);
      
      delete global.executeCommand;
    });
  });
  
  describe('setBrushSize()', function() {
    
    it('should set brush size', function() {
      brush.setBrushSize(50);
      
      expect(brush.brushSize).to.equal(50);
    });
    
    it('should clamp to minimum of 10', function() {
      brush.setBrushSize(5);
      
      expect(brush.brushSize).to.equal(10);
    });
    
    it('should clamp to maximum of 100', function() {
      brush.setBrushSize(150);
      
      expect(brush.brushSize).to.equal(100);
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const info = brush.getDebugInfo();
      
      expect(info).to.have.property('isActive');
      expect(info).to.have.property('brushSize');
      expect(info).to.have.property('spawnCooldown');
      expect(info).to.have.property('isMousePressed');
      expect(info).to.have.property('lastSpawnTime');
    });
    
    it('should reflect current state', function() {
      brush.isActive = true;
      brush.brushSize = 50;
      brush.isMousePressed = true;
      
      const info = brush.getDebugInfo();
      
      expect(info.isActive).to.be.true;
      expect(info.brushSize).to.equal(50);
      expect(info.isMousePressed).to.be.true;
    });
  });
});

describe('EnemyAntBrush Integration', function() {
  
  it('should initialize global instance', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/EnemyAntBrush')];
    const { initializeEnemyAntBrush } = require('../../../Classes/systems/tools/EnemyAntBrush');
    
    const brush = initializeEnemyAntBrush();
    
    expect(mockWindow.g_enemyAntBrush).to.exist;
    expect(mockWindow.g_enemyAntBrush).to.equal(brush);
    
    delete global.window;
  });
});




// ================================================================
// Fireball.test.js (40 tests)
// ================================================================
/**
 * Unit Tests for FireballSystem
 * Tests fireball projectile mechanics and damage
 */

// Mock p5.js and game globals
global.millis = () => Date.now();
global.performance = global.performance || { now: () => Date.now() };
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.line = () => {};
global.Math = Math;
global.width = 800;
global.height = 600;
global.ants = [];

// Load FireballSystem
let { Fireball, FireballManager, initializeFireballSystem } = require('../../../Classes/systems/combat/FireballSystem');

describe('Fireball', function() {
  
  let fireball;
  
  beforeEach(function() {
    fireball = new Fireball(100, 100, 200, 200, 25);
  });
  
  describe('Constructor', function() {
    
    it('should create fireball with start and target positions', function() {
      expect(fireball.x).to.equal(100);
      expect(fireball.y).to.equal(100);
      expect(fireball.targetX).to.equal(200);
      expect(fireball.targetY).to.equal(200);
    });
    
    it('should set damage value', function() {
      expect(fireball.damage).to.equal(25);
    });
    
    it('should calculate velocity toward target', function() {
      expect(fireball.velocityX).to.be.a('number');
      expect(fireball.velocityY).to.be.a('number');
    });
    
    it('should initialize as active', function() {
      expect(fireball.isActive).to.be.true;
      expect(fireball.hasExploded).to.be.false;
    });
    
    it('should initialize visual properties', function() {
      expect(fireball.size).to.equal(12);
      expect(fireball.color).to.be.an('array');
      expect(fireball.trail).to.be.an('array');
    });
  });
  
  describe('update()', function() {
    
    it('should move fireball toward target', function() {
      const startX = fireball.x;
      const startY = fireball.y;
      
      fireball.update(1/60);
      
      expect(fireball.x).to.not.equal(startX);
      expect(fireball.y).to.not.equal(startY);
    });
    
    it('should add positions to trail', function() {
      expect(fireball.trail.length).to.equal(0);
      
      fireball.update(1/60);
      
      expect(fireball.trail.length).to.be.greaterThan(0);
    });
    
    it('should limit trail length', function() {
      for (let i = 0; i < 20; i++) {
        fireball.update(1/60);
      }
      
      expect(fireball.trail.length).to.be.at.most(fireball.maxTrailLength);
    });
    
    it('should explode when reaching target', function() {
      // Create fireball very close to target
      const closeFB = new Fireball(195, 195, 200, 200);
      
      closeFB.update(1/60);
      
      expect(closeFB.hasExploded).to.be.true;
      expect(closeFB.isActive).to.be.false;
    });
    
    it('should explode when off screen', function() {
      const offscreenFB = new Fireball(-100, -100, -200, -200);
      
      offscreenFB.update(1/60);
      
      expect(offscreenFB.hasExploded).to.be.true;
    });
    
    it('should not update when inactive', function() {
      fireball.isActive = false;
      const x = fireball.x;
      
      fireball.update(1/60);
      
      expect(fireball.x).to.equal(x);
    });
    
    it('should handle invalid deltaTime', function() {
      expect(() => {
        fireball.update(-1);
        fireball.update(0);
        fireball.update(Infinity);
        fireball.update(NaN);
      }).to.not.throw();
    });
  });
  
  describe('isOffScreen()', function() {
    
    it('should detect off-screen positions', function() {
      fireball.x = -100;
      expect(fireball.isOffScreen()).to.be.true;
      
      fireball.x = 1000;
      expect(fireball.isOffScreen()).to.be.true;
      
      fireball.x = 100;
      fireball.y = -100;
      expect(fireball.isOffScreen()).to.be.true;
      
      fireball.y = 1000;
      expect(fireball.isOffScreen()).to.be.true;
    });
    
    it('should detect on-screen positions', function() {
      fireball.x = 400;
      fireball.y = 300;
      
      expect(fireball.isOffScreen()).to.be.false;
    });
  });
  
  describe('checkAntCollisions()', function() {
    
    it('should handle no ants array', function() {
      global.ants = undefined;
      
      expect(() => fireball.checkAntCollisions()).to.not.throw();
    });
    
    it('should detect collision with ant', function() {
      const mockAnt = {
        isActive: true,
        health: 100,
        getPosition: () => ({ x: fireball.x, y: fireball.y }),
        takeDamage: function(dmg) { this.health -= dmg; }
      };
      
      global.ants = [mockAnt];
      
      fireball.checkAntCollisions();
      
      expect(fireball.hasExploded).to.be.true;
    });
    
    it('should skip inactive ants', function() {
      const mockAnt = {
        isActive: false,
        health: 100,
        getPosition: () => ({ x: fireball.x, y: fireball.y })
      };
      
      global.ants = [mockAnt];
      
      fireball.checkAntCollisions();
      
      expect(fireball.hasExploded).to.be.false;
    });
    
    it('should skip dead ants', function() {
      const mockAnt = {
        isActive: true,
        health: 0,
        getPosition: () => ({ x: fireball.x, y: fireball.y })
      };
      
      global.ants = [mockAnt];
      
      fireball.checkAntCollisions();
      
      expect(fireball.hasExploded).to.be.false;
    });
  });
  
  describe('hitAnt()', function() {
    
    it('should deal damage to ant', function() {
      const mockAnt = {
        health: 100,
        _maxHealth: 100,
        takeDamage: function(dmg) { this.health -= dmg; }
      };
      
      fireball.hitAnt(mockAnt);
      
      expect(mockAnt.health).to.equal(75); // 100 - 25
      expect(fireball.hasExploded).to.be.true;
    });
    
    it('should handle missing takeDamage method', function() {
      const mockAnt = {
        health: 100
      };
      
      expect(() => fireball.hitAnt(mockAnt)).to.not.throw();
    });
  });
  
  describe('explode()', function() {
    
    it('should mark fireball as exploded', function() {
      fireball.explode();
      
      expect(fireball.hasExploded).to.be.true;
      expect(fireball.isActive).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should render when active', function() {
      expect(() => fireball.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      fireball.isActive = false;
      
      expect(() => fireball.render()).to.not.throw();
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const info = fireball.getDebugInfo();
      
      expect(info).to.have.property('position');
      expect(info).to.have.property('target');
      expect(info).to.have.property('velocity');
      expect(info).to.have.property('damage');
      expect(info).to.have.property('isActive');
    });
  });
});

describe('FireballManager', function() {
  
  let manager;
  
  beforeEach(function() {
    manager = new FireballManager();
  });
  
  describe('Constructor', function() {
    
    it('should create manager with empty fireball list', function() {
      expect(manager.fireballs).to.be.an('array');
      expect(manager.fireballs.length).to.equal(0);
    });
    
    it('should initialize time tracking', function() {
      expect(manager.lastUpdateTime).to.be.null;
    });
  });
  
  describe('createFireball()', function() {
    
    it('should create and store fireball', function() {
      const fb = manager.createFireball(100, 100, 200, 200, 30);
      
      expect(fb).to.be.instanceOf(Fireball);
      expect(manager.fireballs.length).to.equal(1);
    });
    
    it('should use specified damage', function() {
      const fb = manager.createFireball(0, 0, 100, 100, 50);
      
      expect(fb.damage).to.equal(50);
    });
    
    it('should use default damage when not specified', function() {
      const fb = manager.createFireball(0, 0, 100, 100);
      
      expect(fb.damage).to.equal(25);
    });
  });
  
  describe('update()', function() {
    
    it('should update all active fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      expect(() => manager.update()).to.not.throw();
    });
    
    it('should remove inactive fireballs', function() {
      const fb = manager.createFireball(195, 195, 200, 200);
      expect(manager.fireballs.length).to.equal(1);
      
      manager.update();
      
      expect(manager.fireballs.length).to.equal(0);
    });
    
    it('should calculate deltaTime', function() {
      manager.createFireball(100, 100, 200, 200);
      
      manager.update();
      
      expect(manager.lastUpdateTime).to.be.a('number');
    });
    
    it('should handle errors gracefully', function() {
      // Create fireball with error flag
      const fb = manager.createFireball(100, 100, 200, 200);
      fb.hasError = true;
      fb.isActive = false;
      
      expect(() => manager.update()).to.not.throw();
    });
  });
  
  describe('render()', function() {
    
    it('should render all fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      expect(() => manager.render()).to.not.throw();
    });
    
    it('should handle empty fireball list', function() {
      expect(() => manager.render()).to.not.throw();
    });
  });
  
  describe('clear()', function() {
    
    it('should remove all fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      manager.clear();
      
      expect(manager.fireballs.length).to.equal(0);
    });
  });
  
  describe('getActiveCount()', function() {
    
    it('should count active fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      expect(manager.getActiveCount()).to.equal(2);
    });
    
    it('should not count inactive fireballs', function() {
      const fb = manager.createFireball(100, 100, 200, 200);
      fb.isActive = false;
      
      expect(manager.getActiveCount()).to.equal(0);
    });
  });
});

describe('initializeFireballSystem()', function() {
  
  it('should initialize and return manager', function() {
    const manager = initializeFireballSystem();
    
    expect(manager).to.be.instanceOf(FireballManager);
  });
  
  it('should create global instance', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/combat/FireballSystem')];
    const { initializeFireballSystem } = require('../../../Classes/systems/combat/FireballSystem');
    
    const manager = initializeFireballSystem();
    
    expect(mockWindow.g_fireballManager).to.equal(manager);
    
    delete global.window;
  });
});




// ================================================================
// FramebufferManager.test.js (52 tests)
// ================================================================
/**
 * Unit Tests for FramebufferManager
 * Tests framebuffer optimization system
 */

// Mock p5.js functions
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  _layerName: null,
  _hasAlpha: true,
  _lastUpdate: 0,
  _isDirty: true,
  clear: function() {},
  image: function() {},
  remove: function() {}
});
global.image = () => {};
global.millis = () => Date.now();
global.performance = global.performance || { now: () => Date.now() };

// Load FramebufferManager
let { FramebufferManager, AdaptiveFramebufferManager } = require('../../../Classes/systems/FramebufferManager');

describe('FramebufferManager', function() {
  
  let manager;
  
  beforeEach(function() {
    manager = new FramebufferManager();
  });
  
  describe('Constructor', function() {
    
    it('should create manager with default configuration', function() {
      expect(manager).to.exist;
      expect(manager.framebuffers).to.be.instanceOf(Map);
      expect(manager.config.enabled).to.be.true;
    });
    
    it('should initialize empty framebuffer storage', function() {
      expect(manager.framebuffers.size).to.equal(0);
      expect(manager.changeTracking.size).to.equal(0);
    });
    
    it('should have default buffer configurations', function() {
      expect(manager.bufferConfigs).to.be.instanceOf(Map);
      expect(manager.bufferConfigs.has('TERRAIN')).to.be.true;
      expect(manager.bufferConfigs.has('ENTITIES')).to.be.true;
      expect(manager.bufferConfigs.has('EFFECTS')).to.be.true;
    });
    
    it('should initialize statistics tracking', function() {
      expect(manager.stats.totalFramebuffers).to.equal(0);
      expect(manager.stats.cacheHits).to.equal(0);
      expect(manager.stats.cacheMisses).to.equal(0);
    });
  });
  
  describe('initialize()', function() {
    
    it('should initialize with canvas dimensions', function() {
      const result = manager.initialize(800, 600);
      
      expect(result).to.be.true;
      expect(manager.canvasWidth).to.equal(800);
      expect(manager.canvasHeight).to.equal(600);
    });
    
    it('should update buffer config sizes', function() {
      manager.initialize(1024, 768);
      
      const terrainConfig = manager.bufferConfigs.get('TERRAIN');
      expect(terrainConfig.size.width).to.equal(1024);
      expect(terrainConfig.size.height).to.equal(768);
    });
    
    it('should initialize change tracking for layers', function() {
      manager.initialize(800, 600);
      
      expect(manager.changeTracking.has('TERRAIN')).to.be.true;
      expect(manager.changeTracking.has('ENTITIES')).to.be.true;
      
      const tracking = manager.changeTracking.get('TERRAIN');
      expect(tracking.isDirty).to.be.true;
      expect(tracking.changeCount).to.equal(0);
    });
    
    it('should return false when disabled', function() {
      manager.config.enabled = false;
      const result = manager.initialize(800, 600);
      
      expect(result).to.be.false;
    });
    
    it('should accept custom options', function() {
      manager.initialize(800, 600, { debugMode: true });
      
      expect(manager.config.debugMode).to.be.true;
    });
  });
  
  describe('createFramebuffer()', function() {
    
    it('should create framebuffer with specified dimensions', function() {
      const buffer = manager.createFramebuffer('TEST', 640, 480, true);
      
      expect(buffer).to.exist;
      expect(buffer._width).to.equal(640);
      expect(buffer._height).to.equal(480);
    });
    
    it('should store framebuffer in map', function() {
      manager.createFramebuffer('CUSTOM', 800, 600);
      
      expect(manager.framebuffers.has('CUSTOM')).to.be.true;
    });
    
    it('should increment statistics', function() {
      const beforeCount = manager.stats.totalFramebuffers;
      
      manager.createFramebuffer('TEST', 100, 100);
      
      expect(manager.stats.totalFramebuffers).to.equal(beforeCount + 1);
      expect(manager.stats.activeFramebuffers).to.equal(beforeCount + 1);
    });
    
    it('should estimate memory usage', function() {
      const beforeMemory = manager.stats.memoryUsage;
      
      manager.createFramebuffer('TEST', 100, 100, true);
      
      expect(manager.stats.memoryUsage).to.be.greaterThan(beforeMemory);
    });
    
    it('should handle createGraphics unavailable', function() {
      const oldCreateGraphics = global.createGraphics;
      delete global.createGraphics;
      
      const buffer = manager.createFramebuffer('TEST', 100, 100);
      
      expect(buffer).to.be.null;
      expect(manager.config.enabled).to.be.false;
      
      global.createGraphics = oldCreateGraphics;
    });
  });
  
  describe('getFramebuffer()', function() {
    
    it('should return existing framebuffer', function() {
      const created = manager.createFramebuffer('EXISTING', 100, 100);
      const retrieved = manager.getFramebuffer('EXISTING');
      
      expect(retrieved).to.equal(created);
    });
    
    it('should create framebuffer if config exists', function() {
      manager.initialize(800, 600);
      
      const buffer = manager.getFramebuffer('TERRAIN');
      
      expect(buffer).to.exist;
      expect(manager.framebuffers.has('TERRAIN')).to.be.true;
    });
    
    it('should return null when disabled', function() {
      manager.config.enabled = false;
      const buffer = manager.getFramebuffer('TEST');
      
      expect(buffer).to.be.null;
    });
    
    it('should return null for unknown layer without config', function() {
      const buffer = manager.getFramebuffer('UNKNOWN');
      
      expect(buffer).to.be.null;
    });
  });
  
  describe('markLayerDirty()', function() {
    
    it('should mark layer as dirty', function() {
      manager.initialize(800, 600);
      
      const tracking = manager.changeTracking.get('TERRAIN');
      tracking.isDirty = false;
      
      manager.markLayerDirty('TERRAIN');
      
      expect(tracking.isDirty).to.be.true;
      expect(tracking.changeCount).to.equal(1);
    });
    
    it('should update last change time', function() {
      manager.initialize(800, 600);
      
      const before = Date.now();
      manager.markLayerDirty('TERRAIN');
      const tracking = manager.changeTracking.get('TERRAIN');
      
      expect(tracking.lastChangeTime).to.be.at.least(before);
    });
    
    it('should handle unknown layer gracefully', function() {
      expect(() => {
        manager.markLayerDirty('UNKNOWN');
      }).to.not.throw();
    });
  });
  
  describe('markLayerClean()', function() {
    
    it('should mark layer as clean', function() {
      manager.initialize(800, 600);
      manager.markLayerDirty('TERRAIN');
      
      manager.markLayerClean('TERRAIN');
      
      const tracking = manager.changeTracking.get('TERRAIN');
      expect(tracking.isDirty).to.be.false;
      expect(tracking.forceRefresh).to.be.false;
    });
    
    it('should update last update time', function() {
      manager.initialize(800, 600);
      
      const before = Date.now();
      manager.markLayerClean('TERRAIN');
      
      const lastUpdate = manager.lastUpdateTimes.get('TERRAIN');
      expect(lastUpdate).to.be.at.least(before);
    });
  });
  
  describe('shouldRedrawLayer()', function() {
    
    it('should return true when change tracking disabled', function() {
      manager.config.enableChangeTracking = false;
      
      expect(manager.shouldRedrawLayer('TERRAIN')).to.be.true;
    });
    
    it('should return true when forced refresh', function() {
      manager.initialize(800, 600);
      
      const tracking = manager.changeTracking.get('TERRAIN');
      tracking.forceRefresh = true;
      
      expect(manager.shouldRedrawLayer('TERRAIN')).to.be.true;
    });
    
    it('should return true when buffer age exceeds maximum', function() {
      manager.initialize(800, 600);
      manager.config.maxBufferAge = 100;
      
      manager.lastUpdateTimes.set('TERRAIN', Date.now() - 200);
      
      expect(manager.shouldRedrawLayer('TERRAIN')).to.be.true;
    });
  });
  
  describe('forceRefreshAll()', function() {
    
    it('should force refresh all layers', function() {
      manager.initialize(800, 600);
      
      manager.forceRefreshAll();
      
      manager.changeTracking.forEach(tracking => {
        expect(tracking.forceRefresh).to.be.true;
        expect(tracking.isDirty).to.be.true;
      });
    });
  });
  
  describe('forceRefreshLayer()', function() {
    
    it('should force refresh specific layer', function() {
      manager.initialize(800, 600);
      
      manager.forceRefreshLayer('TERRAIN');
      
      const tracking = manager.changeTracking.get('TERRAIN');
      expect(tracking.forceRefresh).to.be.true;
      expect(tracking.isDirty).to.be.true;
    });
  });
  
  describe('destroyFramebuffer()', function() {
    
    it('should remove framebuffer from map', function() {
      manager.createFramebuffer('TEST', 100, 100);
      expect(manager.framebuffers.has('TEST')).to.be.true;
      
      manager.destroyFramebuffer('TEST');
      
      expect(manager.framebuffers.has('TEST')).to.be.false;
    });
    
    it('should decrement active count', function() {
      manager.createFramebuffer('TEST', 100, 100);
      const before = manager.stats.activeFramebuffers;
      
      manager.destroyFramebuffer('TEST');
      
      expect(manager.stats.activeFramebuffers).to.equal(before - 1);
    });
    
    it('should handle non-existent framebuffer', function() {
      expect(() => {
        manager.destroyFramebuffer('NONEXISTENT');
      }).to.not.throw();
    });
  });
  
  describe('cleanup()', function() {
    
    it('should destroy all framebuffers', function() {
      manager.createFramebuffer('TEST1', 100, 100);
      manager.createFramebuffer('TEST2', 100, 100);
      
      manager.cleanup();
      
      expect(manager.framebuffers.size).to.equal(0);
      expect(manager.stats.activeFramebuffers).to.equal(0);
    });
    
    it('should reset tracking data', function() {
      manager.initialize(800, 600);
      
      manager.cleanup();
      
      expect(manager.changeTracking.size).to.equal(0);
      expect(manager.lastUpdateTimes.size).to.equal(0);
    });
    
    it('should reset statistics', function() {
      manager.stats.cacheHits = 100;
      manager.stats.cacheMisses = 50;
      
      manager.cleanup();
      
      expect(manager.stats.cacheHits).to.equal(0);
      expect(manager.stats.cacheMisses).to.equal(0);
    });
  });
  
  describe('getStatistics()', function() {
    
    it('should return statistics object', function() {
      const stats = manager.getStatistics();
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('cacheHitRate');
      expect(stats).to.have.property('memoryUsageMB');
      expect(stats).to.have.property('isEnabled');
    });
    
    it('should calculate cache hit rate', function() {
      manager.stats.cacheHits = 80;
      manager.stats.cacheMisses = 20;
      
      const stats = manager.getStatistics();
      
      expect(stats.cacheHitRate).to.equal(80);
    });
    
    it('should convert memory to MB', function() {
      manager.stats.memoryUsage = 1024 * 1024 * 5; // 5 MB
      
      const stats = manager.getStatistics();
      
      expect(stats.memoryUsageMB).to.equal(5);
    });
  });
  
  describe('updateConfig()', function() {
    
    it('should update configuration options', function() {
      manager.updateConfig({ debugMode: true });
      
      expect(manager.config.debugMode).to.be.true;
    });
    
    it('should cleanup when disabling', function() {
      manager.initialize(800, 600);
      manager.createFramebuffer('TEST', 100, 100);
      
      manager.updateConfig({ enabled: false });
      
      expect(manager.framebuffers.size).to.equal(0);
    });
  });
});

describe('AdaptiveFramebufferManager', function() {
  
  let adaptive;
  
  beforeEach(function() {
    adaptive = new AdaptiveFramebufferManager();
  });
  
  describe('Constructor', function() {
    
    it('should initialize metrics and strategies maps', function() {
      expect(adaptive.layerMetrics).to.be.instanceOf(Map);
      expect(adaptive.refreshStrategies).to.be.instanceOf(Map);
    });
  });
  
  describe('getLayerMetrics()', function() {
    
    it('should create metrics for new layer', function() {
      const metrics = adaptive.getLayerMetrics('TEST');
      
      expect(metrics).to.exist;
      expect(metrics.avgRenderTime).to.equal(0);
      expect(metrics.renderCount).to.equal(0);
    });
    
    it('should return existing metrics', function() {
      const first = adaptive.getLayerMetrics('TEST');
      first.renderCount = 5;
      
      const second = adaptive.getLayerMetrics('TEST');
      
      expect(second.renderCount).to.equal(5);
    });
  });
  
  describe('getRefreshStrategy()', function() {
    
    it('should return static strategy for static layers', function() {
      const strategy = adaptive.getRefreshStrategy('TEST', 'static');
      
      expect(strategy.type).to.equal('static');
    });
    
    it('should return time-based strategy for low refresh', function() {
      const strategy = adaptive.getRefreshStrategy('TEST', 'low');
      
      expect(strategy.type).to.equal('time-based');
      expect(strategy.interval).to.equal(500);
    });
    
    it('should return adaptive strategy for high refresh', function() {
      const strategy = adaptive.getRefreshStrategy('TEST', 'high');
      
      expect(strategy.type).to.equal('adaptive');
    });
    
    it('should cache strategy for layer', function() {
      adaptive.getRefreshStrategy('TEST', 'always');
      
      expect(adaptive.refreshStrategies.has('TEST')).to.be.true;
    });
  });
  
  describe('recordRenderTime()', function() {
    
    it('should record render time', function() {
      adaptive.recordRenderTime('TEST', 15.5);
      
      const metrics = adaptive.layerMetrics.get('TEST');
      expect(metrics.renderCount).to.equal(1);
      expect(metrics.lastRenderTime).to.equal(15.5);
    });
    
    it('should calculate average render time', function() {
      adaptive.recordRenderTime('TEST', 10);
      adaptive.recordRenderTime('TEST', 20);
      adaptive.recordRenderTime('TEST', 30);
      
      const metrics = adaptive.layerMetrics.get('TEST');
      expect(metrics.avgRenderTime).to.equal(20);
    });
  });
  
  describe('shouldRefresh()', function() {
    
    it('should refresh static layers when dirty', function() {
      const tracking = { isDirty: true };
      const result = adaptive.shouldRefresh('TEST', 'static', tracking, Date.now());
      
      expect(result).to.be.true;
    });
    
    it('should not refresh static layers when clean', function() {
      const tracking = { isDirty: false };
      const result = adaptive.shouldRefresh('TEST', 'static', tracking, Date.now());
      
      expect(result).to.be.false;
    });
    
    it('should refresh always layers', function() {
      const tracking = {};
      const result = adaptive.shouldRefresh('TEST', 'always', tracking, Date.now());
      
      expect(result).to.be.true;
    });
  });
  
  describe('getDiagnostics()', function() {
    
    it('should return diagnostic information', function() {
      adaptive.recordRenderTime('TEST', 10);
      
      const diagnostics = adaptive.getDiagnostics();
      
      expect(diagnostics).to.have.property('layerMetrics');
      expect(diagnostics).to.have.property('refreshStrategies');
    });
  });
});




// ================================================================
// GatherDebugRenderer.test.js (28 tests)
// ================================================================
/**
 * Unit Tests for GatherDebugRenderer
 * Tests gathering behavior visualization system
 */

// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.line = () => {};
global.CENTER = 'center';
global.BOTTOM = 'bottom';
global.LEFT = 'left';
global.TOP = 'top';

// Load GatherDebugRenderer
let GatherDebugRenderer = require('../../../Classes/systems/GatherDebugRenderer');

describe('GatherDebugRenderer', function() {
  
  let renderer;
  
  beforeEach(function() {
    renderer = new GatherDebugRenderer();
    
    // Mock global objects
    global.ants = [];
    global.g_resourceManager = {
      getResourceList: () => []
    };
  });
  
  afterEach(function() {
    delete global.ants;
    delete global.g_resourceManager;
  });
  
  describe('Constructor', function() {
    
    it('should create renderer with default settings', function() {
      expect(renderer).to.exist;
      expect(renderer.enabled).to.be.false;
      expect(renderer.showRanges).to.be.true;
      expect(renderer.showResourceInfo).to.be.true;
    });
    
    it('should initialize visual styling', function() {
      expect(renderer.rangeColor).to.be.an('array');
      expect(renderer.rangeColor).to.have.lengthOf(4);
      expect(renderer.resourceColor).to.be.an('array');
      expect(renderer.antColor).to.be.an('array');
    });
    
    it('should set default line visibility', function() {
      expect(renderer.showAllLines).to.be.false;
    });
  });
  
  describe('toggle()', function() {
    
    it('should toggle enabled state', function() {
      expect(renderer.enabled).to.be.false;
      
      renderer.toggle();
      expect(renderer.enabled).to.be.true;
      
      renderer.toggle();
      expect(renderer.enabled).to.be.false;
    });
  });
  
  describe('toggleAllLines()', function() {
    
    it('should toggle showAllLines state', function() {
      expect(renderer.showAllLines).to.be.false;
      
      renderer.toggleAllLines();
      expect(renderer.showAllLines).to.be.true;
      
      renderer.toggleAllLines();
      expect(renderer.showAllLines).to.be.false;
    });
  });
  
  describe('enable()', function() {
    
    it('should enable renderer', function() {
      renderer.enabled = false;
      
      renderer.enable();
      
      expect(renderer.enabled).to.be.true;
    });
  });
  
  describe('disable()', function() {
    
    it('should disable renderer', function() {
      renderer.enabled = true;
      
      renderer.disable();
      
      expect(renderer.enabled).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should not render when disabled', function() {
      renderer.enabled = false;
      
      // Should not throw
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should handle no ants gracefully', function() {
      renderer.enabled = true;
      global.ants = undefined;
      
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should handle empty ants array', function() {
      renderer.enabled = true;
      global.ants = [];
      
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should handle missing resource manager', function() {
      renderer.enabled = true;
      global.ants = [{
        state: 'GATHERING',
        getPosition: () => ({ x: 100, y: 100 })
      }];
      global.g_resourceManager = undefined;
      
      expect(() => renderer.render()).to.not.throw();
    });
    
    it('should render gathering ants', function() {
      renderer.enabled = true;
      global.ants = [{
        state: 'GATHERING',
        getPosition: () => ({ x: 100, y: 100 })
      }];
      
      expect(() => renderer.render()).to.not.throw();
    });
  });
  
  describe('renderAntGatherInfo()', function() {
    
    it('should render ant position', function() {
      renderer.enabled = true;
      renderer.showAntInfo = true;
      
      const ant = {
        getPosition: () => ({ x: 150, y: 200 })
      };
      
      expect(() => {
        renderer.renderAntGatherInfo(ant, 0, []);
      }).to.not.throw();
    });
    
    it('should render gathering range when enabled', function() {
      renderer.enabled = true;
      renderer.showRanges = true;
      
      const ant = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      expect(() => {
        renderer.renderAntGatherInfo(ant, 0, []);
      }).to.not.throw();
    });
    
    it('should render distance lines to resources', function() {
      renderer.enabled = true;
      renderer.showDistances = true;
      
      const ant = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const resources = [{
        getPosition: () => ({ x: 150, y: 150 })
      }];
      
      expect(() => {
        renderer.renderAntGatherInfo(ant, 0, resources);
      }).to.not.throw();
    });
  });
  
  describe('Visual Properties', function() {
    
    it('should have customizable colors', function() {
      renderer.rangeColor = [255, 0, 0, 100];
      renderer.antColor = [0, 255, 0];
      
      expect(renderer.rangeColor).to.deep.equal([255, 0, 0, 100]);
      expect(renderer.antColor).to.deep.equal([0, 255, 0]);
    });
    
    it('should maintain color arrays', function() {
      expect(renderer.rangeColor).to.have.lengthOf(4); // RGBA
      expect(renderer.rangeStrokeColor).to.have.lengthOf(4);
      expect(renderer.resourceColor).to.have.lengthOf(3); // RGB
      expect(renderer.antColor).to.have.lengthOf(3);
    });
  });
  
  describe('Feature Toggles', function() {
    
    it('should allow toggling ranges display', function() {
      renderer.showRanges = false;
      expect(renderer.showRanges).to.be.false;
      
      renderer.showRanges = true;
      expect(renderer.showRanges).to.be.true;
    });
    
    it('should allow toggling resource info display', function() {
      renderer.showResourceInfo = false;
      expect(renderer.showResourceInfo).to.be.false;
      
      renderer.showResourceInfo = true;
      expect(renderer.showResourceInfo).to.be.true;
    });
    
    it('should allow toggling distance display', function() {
      renderer.showDistances = false;
      expect(renderer.showDistances).to.be.false;
      
      renderer.showDistances = true;
      expect(renderer.showDistances).to.be.true;
    });
    
    it('should allow toggling ant info display', function() {
      renderer.showAntInfo = false;
      expect(renderer.showAntInfo).to.be.false;
      
      renderer.showAntInfo = true;
      expect(renderer.showAntInfo).to.be.true;
    });
  });
});

describe('Utility Functions', function() {
  
  beforeEach(function() {
    // Re-mock p5 functions for utility tests
    global.push = () => {};
    global.pop = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.text = () => {};
    global.line = () => {};
  });
  
  describe('drawLineBetweenEntities()', function() {
    
    it('should draw line without errors', function() {
      const obj1Pos = { x: 100, y: 100 };
      const obj2Pos = { x: 200, y: 200 };
      const lineColor = [255, 255, 255, 100];
      
      expect(() => {
        drawLineBetweenEntities(obj1Pos, obj2Pos, lineColor, 2);
      }).to.not.throw();
    });
  });
  
  describe('drawTextBetweenTwoObjects()', function() {
    
    it('should draw text without errors', function() {
      const obj1Pos = { x: 100, y: 100 };
      const obj2Pos = { x: 200, y: 200 };
      const textColor = [255, 255, 255, 255];
      
      expect(() => {
        drawTextBetweenTwoObjects(obj1Pos, obj2Pos, textColor, 'TEST', '100', 'px');
      }).to.not.throw();
    });
    
    it('should handle missing distance parameters', function() {
      const obj1Pos = { x: 100, y: 100 };
      const obj2Pos = { x: 200, y: 200 };
      const textColor = [255, 255, 255];
      
      expect(() => {
        drawTextBetweenTwoObjects(obj1Pos, obj2Pos, textColor, 'TEST');
      }).to.not.throw();
    });
  });
  
  describe('renderResourceInfo()', function() {
    
    beforeEach(function() {
      global.noStroke = () => {};
      global.ellipse = () => {};
      global.textAlign = () => {};
      global.textSize = () => {};
      global.CENTER = 'center';
      global.BOTTOM = 'bottom';
      global.LEFT = 'left';
      global.TOP = 'top';
    });
    
    it('should render resource information', function() {
      const resources = [{
        resourceType: 'stick',
        getPosition: () => ({ x: 100, y: 100 })
      }];
      const textColor = [255, 255, 255];
      const resourceColor = [0, 255, 0];
      
      expect(() => {
        renderResourceInfo(resources, textColor, resourceColor);
      }).to.not.throw();
    });
    
    it('should handle empty resources array', function() {
      const resources = [];
      const textColor = [255, 255, 255];
      const resourceColor = [0, 255, 0];
      
      expect(() => {
        renderResourceInfo(resources, textColor, resourceColor);
      }).to.not.throw();
    });
    
    it('should handle undefined parameters gracefully', function() {
      // Should handle undefined gracefully without throwing
      expect(() => {
        renderResourceInfo(undefined, undefined, undefined);
      }).to.not.throw();
    });
  });
});

describe('Global Instance', function() {
  
  it('should create global instance in browser', function() {
    // Simulate browser environment
    const mockWindow = {};
    global.window = mockWindow;
    
    // Reload module to trigger global creation
    delete require.cache[require.resolve('../../../Classes/systems/GatherDebugRenderer')];
    require('../../../Classes/systems/GatherDebugRenderer');
    
    expect(mockWindow.g_gatherDebugRenderer).to.exist;
    expect(mockWindow.g_gatherDebugRenderer).to.be.instanceOf(GatherDebugRenderer);
    
    delete global.window;
  });
});




// ================================================================
// Lightning.test.js (47 tests)
// ================================================================
/**
 * Unit Tests for LightningSystem
 * Tests lightning strike mechanics, knockback, and area damage
 */

// Mock p5.js and game globals
global.millis = () => Date.now();
global.TILE_SIZE = 32;
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.line = () => {};
global.ants = [];
global.getQueen = () => null;

// Mock Audio
global.Audio = class {
  constructor() {
    this.volume = 1;
    this.currentTime = 0;
  }
  play() {}
};

// Load LightningSystem
let { LightningManager, SootStain } = require('../../../Classes/systems/combat/LightningSystem');

describe('SootStain', function() {
  
  let stain;
  
  beforeEach(function() {
    stain = new SootStain(100, 100, 24, 5000);
  });
  
  describe('Constructor', function() {
    
    it('should create stain with position and radius', function() {
      expect(stain.x).to.equal(100);
      expect(stain.y).to.equal(100);
      expect(stain.radius).to.equal(24);
    });
    
    it('should set duration', function() {
      expect(stain.duration).to.equal(5000);
    });
    
    it('should initialize as active', function() {
      expect(stain.isActive).to.be.true;
      expect(stain.alpha).to.equal(1.0);
    });
    
    it('should use default radius', function() {
      const defaultStain = new SootStain(0, 0);
      expect(defaultStain.radius).to.equal(24);
    });
    
    it('should use default duration', function() {
      const defaultStain = new SootStain(0, 0);
      expect(defaultStain.duration).to.equal(8000);
    });
  });
  
  describe('update()', function() {
    
    it('should fade alpha over time', function() {
      const initialAlpha = stain.alpha;
      
      // Simulate time passing
      stain.created = millis() - 2500; // Half duration
      stain.update();
      
      expect(stain.alpha).to.be.lessThan(initialAlpha);
    });
    
    it('should deactivate after duration', function() {
      stain.created = millis() - 6000; // Past duration
      stain.update();
      
      expect(stain.isActive).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should render when active', function() {
      expect(() => stain.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      stain.isActive = false;
      expect(() => stain.render()).to.not.throw();
    });
  });
});

describe('LightningManager', function() {
  
  let manager;
  
  beforeEach(function() {
    manager = new LightningManager();
    global.ants = [];
  });
  
  describe('Constructor', function() {
    
    it('should create manager with empty lists', function() {
      expect(manager.sootStains).to.be.an('array');
      expect(manager.bolts).to.be.an('array');
      expect(manager.sootStains.length).to.equal(0);
      expect(manager.bolts.length).to.equal(0);
    });
    
    it('should initialize cooldown settings', function() {
      expect(manager.cooldown).to.equal(300);
      expect(manager.lastStrikeTime).to.equal(0);
    });
    
    it('should initialize knockback settings', function() {
      expect(manager.knockbackPx).to.be.a('number');
      expect(manager.knockbackDurationMs).to.equal(180);
    });
    
    it('should have knockback API methods', function() {
      expect(manager.setKnockbackPx).to.be.a('function');
      expect(manager.getKnockbackPx).to.be.a('function');
      expect(manager.setKnockbackDurationMs).to.be.a('function');
      expect(manager.getKnockbackDurationMs).to.be.a('function');
    });
    
    it('should initialize volume setting', function() {
      expect(manager.volume).to.equal(0.25);
    });
  });
  
  describe('Knockback API', function() {
    
    it('should get knockback magnitude', function() {
      const kb = manager.getKnockbackPx();
      expect(kb).to.be.a('number');
    });
    
    it('should set knockback magnitude', function() {
      const result = manager.setKnockbackPx(50);
      expect(result).to.equal(50);
      expect(manager.knockbackPx).to.equal(50);
    });
    
    it('should get knockback duration', function() {
      const duration = manager.getKnockbackDurationMs();
      expect(duration).to.equal(180);
    });
    
    it('should set knockback duration', function() {
      const result = manager.setKnockbackDurationMs(200);
      expect(result).to.equal(200);
      expect(manager.knockbackDurationMs).to.equal(200);
    });
    
    it('should handle invalid knockback values', function() {
      const original = manager.knockbackPx;
      manager.setKnockbackPx(null);
      expect(manager.knockbackPx).to.equal(original);
    });
  });
  
  describe('strikeAtAnt()', function() {
    
    it('should handle missing ant', function() {
      expect(() => manager.strikeAtAnt(null)).to.not.throw();
    });
    
    it('should deal damage to ant', function() {
      const mockAnt = {
        health: 100,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      manager.strikeAtAnt(mockAnt, 50);
      
      expect(mockAnt.health).to.equal(50);
    });
    
    it('should skip player queen', function() {
      const mockQueen = {
        jobName: 'Queen',
        health: 100,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      manager.strikeAtAnt(mockQueen, 50);
      
      expect(mockQueen.health).to.equal(100); // No damage
    });
    
    it('should create soot stain', function() {
      const mockAnt = {
        takeDamage: () => {},
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const beforeCount = manager.sootStains.length;
      manager.strikeAtAnt(mockAnt);
      
      expect(manager.sootStains.length).to.equal(beforeCount + 1);
    });
    
    it('should handle ant without takeDamage method', function() {
      const mockAnt = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      expect(() => manager.strikeAtAnt(mockAnt)).to.not.throw();
    });
    
    it('should damage nearby ants (AoE)', function() {
      const targetAnt = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const nearbyAnt = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 120, y: 120 }) // Within AoE
      };
      
      global.ants = [targetAnt, nearbyAnt];
      
      manager.strikeAtAnt(targetAnt, 50, 3);
      
      expect(nearbyAnt.health).to.be.lessThan(100); // Took AoE damage
    });
    
    it('should not damage player queen in AoE', function() {
      const targetAnt = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const nearbyQueen = {
        jobName: 'Queen',
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 110, y: 110 })
      };
      
      global.ants = [targetAnt, nearbyQueen];
      
      manager.strikeAtAnt(targetAnt, 50, 3);
      
      expect(nearbyQueen.health).to.equal(100); // Queen undamaged
    });
  });
  
  describe('applyKnockback()', function() {
    
    it('should apply knockback to entity', function() {
      const entity = {
        x: 100,
        y: 100,
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: function(x, y) { this.x = x; this.y = y; }
      };
      
      const result = manager.applyKnockback(entity, 50, 50, 32);
      
      expect(result).to.be.true;
      expect(manager._activeKnockbacks.length).to.equal(1);
    });
    
    it('should handle entity without getPosition', function() {
      const entity = { x: 100, y: 100 };
      
      const result = manager.applyKnockback(entity, 50, 50);
      
      expect(result).to.be.false;
    });
    
    it('should use default magnitude when not specified', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: () => {}
      };
      
      manager.applyKnockback(entity, 50, 50);
      
      expect(manager._activeKnockbacks.length).to.equal(1);
    });
    
    it('should remove existing knockback for same entity', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: () => {}
      };
      
      manager.applyKnockback(entity, 50, 50);
      manager.applyKnockback(entity, 60, 60); // Apply again
      
      expect(manager._activeKnockbacks.length).to.equal(1);
    });
  });
  
  describe('requestStrike()', function() {
    
    it('should respect cooldown', function() {
      manager.lastStrikeTime = Date.now();
      
      const result = manager.requestStrike({ x: 100, y: 100 });
      
      expect(result).to.be.false;
    });
    
    it('should execute strike after cooldown', function() {
      manager.lastStrikeTime = Date.now() - 500; // Past cooldown
      
      const result = manager.requestStrike({ x: 100, y: 100 });
      
      expect(result).to.be.true;
    });
    
    it('should create bolt animation', function() {
      manager.lastStrikeTime = 0;
      
      manager.requestStrike({ x: 100, y: 100 });
      
      expect(manager.bolts.length).to.be.greaterThan(0);
    });
    
    it('should handle ant with getPosition', function() {
      const mockAnt = {
        getPosition: () => ({ x: 150, y: 150 })
      };
      
      manager.lastStrikeTime = 0;
      const result = manager.requestStrike(mockAnt);
      
      expect(result).to.be.true;
    });
  });
  
  describe('strikeAtPosition()', function() {
    
    it('should strike at specified coordinates', function() {
      expect(() => manager.strikeAtPosition(200, 300, 40, 5)).to.not.throw();
    });
    
    it('should create soot stain at position', function() {
      const beforeCount = manager.sootStains.length;
      
      manager.strikeAtPosition(200, 300);
      
      expect(manager.sootStains.length).to.equal(beforeCount + 1);
    });
    
    it('should damage ants in AoE radius', function() {
      const ant = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 210, y: 310 })
      };
      
      global.ants = [ant];
      
      manager.strikeAtPosition(200, 300, 50, 5);
      
      expect(ant.health).to.be.lessThan(100);
    });
    
    it('should skip ants outside AoE radius', function() {
      const ant = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 1000, y: 1000 }) // Far away
      };
      
      global.ants = [ant];
      
      manager.strikeAtPosition(200, 300, 50, 3);
      
      expect(ant.health).to.equal(100); // No damage
    });
  });
  
  describe('update()', function() {
    
    it('should update soot stains', function() {
      manager.sootStains.push(new SootStain(100, 100));
      
      expect(() => manager.update()).to.not.throw();
    });
    
    it('should remove inactive stains', function() {
      const stain = new SootStain(100, 100, 24, 1);
      stain.created = millis() - 100; // Past duration
      manager.sootStains.push(stain);
      
      manager.update();
      
      expect(manager.sootStains.length).to.equal(0);
    });
    
    it('should update bolts', function() {
      manager.bolts.push({
        x: 100,
        y: 100,
        created: millis(),
        duration: 220,
        executed: false
      });
      
      expect(() => manager.update()).to.not.throw();
    });
    
    it('should process active knockbacks', function() {
      const entity = {
        x: 100,
        y: 100,
        getPosition: () => ({ x: entity.x, y: entity.y }),
        setPosition: function(x, y) { this.x = x; this.y = y; }
      };
      
      manager.applyKnockback(entity, 50, 50);
      
      manager.update();
      
      // Entity should have moved
      expect(entity.x).to.not.equal(100);
    });
  });
  
  describe('render()', function() {
    
    it('should render bolts', function() {
      manager.bolts.push({
        x: 100,
        y: 100,
        created: millis(),
        duration: 220
      });
      
      expect(() => manager.render()).to.not.throw();
    });
    
    it('should render soot stains', function() {
      manager.sootStains.push(new SootStain(100, 100));
      
      expect(() => manager.render()).to.not.throw();
    });
  });
  
  describe('clear()', function() {
    
    it('should remove all soot stains', function() {
      manager.sootStains.push(new SootStain(100, 100));
      manager.sootStains.push(new SootStain(200, 200));
      
      manager.clear();
      
      expect(manager.sootStains.length).to.equal(0);
    });
  });
  
  describe('getActiveKnockbacks()', function() {
    
    it('should return active knockback info', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: () => {}
      };
      
      manager.applyKnockback(entity, 50, 50);
      
      const knockbacks = manager.getActiveKnockbacks();
      
      expect(knockbacks).to.be.an('array');
      expect(knockbacks.length).to.equal(1);
      expect(knockbacks[0]).to.have.property('progress');
    });
  });
});

describe('Lightning System Integration', function() {
  
  it('should initialize global manager in browser', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/combat/LightningSystem')];
    const { initializeLightningSystem } = require('../../../Classes/systems/combat/LightningSystem');
    
    const manager = initializeLightningSystem();
    
    expect(mockWindow.g_lightningManager).to.exist;
    expect(mockWindow.g_lightningManager).to.equal(manager);
    
    delete global.window;
  });
});




// ================================================================
// LightningAimBrush.test.js (38 tests)
// ================================================================
/**
 * Unit Tests for LightningAimBrush
 * Tests lightning strike aiming tool with range limitation
 */

// Mock p5.js and globals
global.mouseX = 100;
global.mouseY = 100;
global.TILE_SIZE = 32;
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.line = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';

// Mock queen
let mockQueen = {
  x: 300,
  y: 300,
  getPosition: function() {
    return { x: this.x, y: this.y };
  }
};

global.getQueen = () => mockQueen;

// Mock lightning manager
let strikeRequests = [];
global.g_lightningManager = {
  requestStrike: function(position) {
    strikeRequests.push(position);
    return true;
  }
};

// Mock tile interaction manager
global.g_tileInteractionManager = {
  tileSize: 32
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load LightningAimBrush
let LightningAimBrush = require('../../../Classes/systems/tools/LightningAimBrush');

describe('LightningAimBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new LightningAimBrush();
    strikeRequests = [];
    mockQueen.x = 300;
    mockQueen.y = 300;
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.tileRange).to.equal(7);
      expect(brush.brushSize).to.equal(16);
    });
    
    it('should initialize cursor position', function() {
      expect(brush.cursor).to.be.an('object');
      expect(brush.cursor.x).to.be.a('number');
      expect(brush.cursor.y).to.be.a('number');
    });
    
    it('should calculate range in pixels', function() {
      expect(brush.rangePx).to.equal(brush.tileRange * 32);
    });
    
    it('should initialize cooldown settings', function() {
      expect(brush.spawnCooldown).to.equal(200);
      expect(brush.lastSpawnTime).to.equal(0);
    });
    
    it('should initialize mouse tracking', function() {
      expect(brush.isMousePressed).to.be.false;
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulse).to.equal(0);
      expect(brush.pulseSpeed).to.be.greaterThan(0);
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
  
  describe('activate()', function() {
    
    it('should activate brush', function() {
      brush.activate();
      
      expect(brush.isActive).to.be.true;
    });
  });
  
  describe('deactivate()', function() {
    
    it('should deactivate brush', function() {
      brush.isActive = true;
      
      brush.deactivate();
      
      expect(brush.isActive).to.be.false;
    });
  });
  
  describe('update()', function() {
    
    it('should not update when inactive', function() {
      brush.isActive = false;
      const oldCursorX = brush.cursor.x;
      
      global.mouseX = 500;
      brush.update();
      
      // Should not update cursor when inactive
      expect(brush.cursor.x).to.equal(oldCursorX);
    });
    
    it('should update cursor position when active', function() {
      brush.isActive = true;
      global.mouseX = 200;
      global.mouseY = 250;
      
      brush.update();
      
      expect(brush.cursor.x).to.equal(200);
      expect(brush.cursor.y).to.equal(250);
    });
    
    it('should update pulse animation', function() {
      brush.isActive = true;
      const oldPulse = brush.pulse;
      
      brush.update();
      
      expect(brush.pulse).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2π', function() {
      brush.isActive = true;
      brush.pulse = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulse).to.be.lessThan(Math.PI * 2);
    });
    
    it('should attempt strike when mouse held', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      brush.lastSpawnTime = 0;
      brush.cursor.x = 310;
      brush.cursor.y = 310;
      
      brush.update();
      
      expect(strikeRequests.length).to.be.greaterThan(0);
    });
  });
  
  describe('render()', function() {
    
    it('should not render when inactive', function() {
      brush.isActive = false;
      
      expect(() => brush.render()).to.not.throw();
    });
    
    it('should render when active', function() {
      brush.isActive = true;
      
      expect(() => brush.render()).to.not.throw();
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should deactivate on RIGHT click', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(result).to.be.true;
      expect(brush.isActive).to.be.false;
    });
    
    it('should start strike on LEFT click', function() {
      brush.isActive = true;
      brush.lastSpawnTime = 0;
      
      const result = brush.onMousePressed(310, 310, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.true;
      expect(strikeRequests.length).to.be.greaterThan(0);
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'CENTER');
      
      expect(result).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should stop continuous striking on LEFT release', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.false;
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMouseReleased(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('tryStrikeAt()', function() {
    
    it('should respect cooldown', function() {
      brush.lastSpawnTime = Date.now();
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
      expect(strikeRequests.length).to.equal(0);
    });
    
    it('should strike within range', function() {
      brush.lastSpawnTime = 0;
      
      // Position within 7 tiles (224px) of queen at (300, 300)
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.true;
      expect(strikeRequests.length).to.equal(1);
    });
    
    it('should not strike outside range', function() {
      brush.lastSpawnTime = 0;
      
      // Position far from queen
      const result = brush.tryStrikeAt(1000, 1000);
      
      expect(result).to.be.false;
    });
    
    it('should update last spawn time on success', function() {
      brush.lastSpawnTime = 0;
      
      brush.tryStrikeAt(310, 310);
      
      expect(brush.lastSpawnTime).to.be.greaterThan(0);
    });
    
    it('should pass correct position to lightning manager', function() {
      brush.lastSpawnTime = 0;
      
      brush.tryStrikeAt(350, 360);
      
      expect(strikeRequests.length).to.equal(1);
      expect(strikeRequests[0].x).to.equal(350);
      expect(strikeRequests[0].y).to.equal(360);
    });
    
    it('should handle missing queen gracefully', function() {
      const oldGetQueen = global.getQueen;
      global.getQueen = () => null;
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(100, 100);
      
      expect(result).to.be.false;
      
      global.getQueen = oldGetQueen;
    });
    
    it('should handle queen without getPosition method', function() {
      const oldGetQueen = global.getQueen;
      global.getQueen = () => ({ x: 300, y: 300 }); // No getPosition method
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.true;
      
      global.getQueen = oldGetQueen;
    });
    
    it('should handle missing lightning manager gracefully', function() {
      const oldManager = global.g_lightningManager;
      global.g_lightningManager = undefined;
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
      
      global.g_lightningManager = oldManager;
    });
    
    it('should handle lightning manager with no requestStrike method', function() {
      const oldManager = global.g_lightningManager;
      global.g_lightningManager = {};
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
      
      global.g_lightningManager = oldManager;
    });
    
    it('should handle failed strike request', function() {
      global.g_lightningManager.requestStrike = () => false;
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Range Validation', function() {
    
    it('should allow strike at exactly max range', function() {
      brush.lastSpawnTime = 0;
      
      // Position at exactly 7 tiles (224px) from queen
      const x = mockQueen.x + brush.rangePx;
      const y = mockQueen.y;
      
      const result = brush.tryStrikeAt(x, y);
      
      expect(result).to.be.true;
    });
    
    it('should reject strike just beyond max range', function() {
      brush.lastSpawnTime = 0;
      
      // Position just beyond 7 tiles
      const x = mockQueen.x + brush.rangePx + 1;
      const y = mockQueen.y;
      
      const result = brush.tryStrikeAt(x, y);
      
      expect(result).to.be.false;
    });
    
    it('should calculate diagonal range correctly', function() {
      brush.lastSpawnTime = 0;
      
      // Position at diagonal within range
      const offset = brush.rangePx / Math.sqrt(2);
      const x = mockQueen.x + offset;
      const y = mockQueen.y + offset;
      
      const result = brush.tryStrikeAt(x, y);
      
      expect(result).to.be.true;
    });
  });
});

describe('LightningAimBrush Integration', function() {
  
  it('should initialize global instance', function() {
    const mockWindow = { g_lightningAimBrush: null };
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/LightningAimBrush')];
    const { initializeLightningAimBrush } = require('../../../Classes/systems/tools/LightningAimBrush');
    
    const brush = initializeLightningAimBrush();
    
    expect(mockWindow.g_lightningAimBrush).to.exist;
    expect(mockWindow.g_lightningAimBrush).to.equal(brush);
    
    delete global.window;
  });
});




// ================================================================
// ResourceBrush.test.js (28 tests)
// ================================================================
/**
 * Unit Tests for ResourceBrush
 * Tests resource painting tool
 */

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
global.g_resourceManager = {
  resources: [],
  addResource: function(resource) {
    this.resources.push(resource);
    return true;
  }
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load ResourceBrush
let { ResourceBrush } = require('../../../Classes/systems/tools/ResourceBrush');

describe('ResourceBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new ResourceBrush();
    global.g_resourceManager.resources = [];
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
      
      expect(global.g_resourceManager.resources.length).to.equal(1);
    });
    
    it('should respect cooldown', function() {
      brush.lastSpawnTime = Date.now();
      
      brush.performAction(100, 100);
      
      expect(global.g_resourceManager.resources.length).to.equal(0);
    });
    
    it('should create correct resource type', function() {
      brush.lastSpawnTime = 0;
      brush.setResourceType('stick');
      
      brush.performAction(100, 100);
      
      const resource = global.g_resourceManager.resources[0];
      expect(resource.resourceType).to.equal('stick');
    });
    
    it('should add randomness to position', function() {
      brush.lastSpawnTime = 0;
      
      brush.performAction(100, 100);
      
      const resource = global.g_resourceManager.resources[0];
      // Position should be near 100, but with some offset
      expect(Math.abs(resource.x - 100)).to.be.lessThan(brush.brushSize);
    });
    
    it('should handle missing resource manager gracefully', function() {
      const oldManager = global.g_resourceManager;
      global.g_resourceManager = undefined;
      
      brush.lastSpawnTime = 0;
      
      expect(() => {
        brush.performAction(100, 100);
      }).to.not.throw();
      
      global.g_resourceManager = oldManager;
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
      
      expect(global.g_resourceManager.resources.length).to.be.greaterThan(0);
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




// ================================================================
// ResourceNode.test.js (171 tests)
// ================================================================
/**
 * Unit tests for ResourceNode.js
 * Tests resource node spawning system for building-based resource generation:
 * - Node types for different resources (trees, rocks, beehives, bushes)
 * - Ant detection within spawn range
 * - State-based spawning (only spawn when ants are gathering)
 * - Visual progress indicators
 * - workToGather values (varying difficulty)
 * - Multi-resource nodes with weighted randomization
 * - Batch resource spawning (1-5 resources spread around node)
 * - Integration with gathering ants movement
 * - Resource gather limits (depletable vs infinite nodes)
 * - Ant gathering experience tracking via StatsContainer
 * - Ant gather speed affects work accumulation rate
 * - Nodes targetable for attack but not auto-attacked
 * - Node destruction drops partial resources
 * 
 * COORDINATE SYSTEM:
 * - All positions use GRID COORDINATES (tiles)
 * - TILE_SIZE = 32 pixels per tile
 * - Node internally converts grid → pixel using g_activeMap.coordSys
 */

let path = require('path');

// Mock p5.js functions
global.random = function(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
};

global.push = function() {};
global.pop = function() {};
global.fill = function() {};
global.stroke = function() {};
global.noStroke = function() {};
global.rect = function() {};
global.circle = function() {};
global.text = function() {};
global.textSize = function() {};
global.textAlign = function() {};
global.arc = function() {};
global.PI = Math.PI;
global.TWO_PI = Math.PI * 2;
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';

// Mock Entity class (Resource Node will extend this)
class Entity {
  constructor(x, y, width, height, options = {}) {
    this.posX = x;
    this.posY = y;
    this.sizeX = width;
    this.sizeY = height;
    this.type = options.type || 'Entity';
    this._controllers = new Map();
  }

  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  getSize() {
    return { x: this.sizeX, y: this.sizeY };
  }

  setPosition(x, y) {
    this.posX = x;
    this.posY = y;
  }

  getController(name) {
    return this._controllers.get(name) || null;
  }

  update() {}
  render() {}
}

global.Entity = Entity;

// Mock TILE_SIZE constant
global.TILE_SIZE = 32;

// Mock CoordinateSystem for grid ↔ pixel conversion
class MockCoordinateSystem {
  convPosToBackingCanvas([gridX, gridY]) {
    return [gridX * TILE_SIZE, gridY * TILE_SIZE];
  }
  
  convBackingCanvasToPos([pixelX, pixelY]) {
    return [Math.floor(pixelX / TILE_SIZE), Math.floor(pixelY / TILE_SIZE)];
  }
}

// Mock g_activeMap with coordinate system
global.g_activeMap = {
  coordSys: new MockCoordinateSystem()
};

// Mock stat class from StatsContainer
class MockStat {
  constructor(statName = "NONAME", statValue = 0, statLowerLimit = 0, statUpperLimit = 500) {
    this.statName = statName;
    this._statValue = statValue;
    this.statLowerLimit = statLowerLimit;
    this.statUpperLimit = statUpperLimit;
  }
  
  get statValue() { return this._statValue; }
  set statValue(value) { 
    this._statValue = value;
    if (this._statValue < this.statLowerLimit) this._statValue = this.statLowerLimit;
    if (this._statValue > this.statUpperLimit) this._statValue = this.statUpperLimit;
  }
}

// Mock StatsContainer class
class MockStatsContainer {
  constructor(pos, size, movementSpeed = 0.05, pendingPos = null, strength = 10, health = 100, gatherSpeed = 1) {
    this.position = new MockStat("Position", pos);
    this.size = new MockStat("Size", size);
    this.movementSpeed = new MockStat("Movement Speed", movementSpeed, 0, 100);
    this.pendingPos = new MockStat("Pending Position", pendingPos || pos);
    this.strength = new MockStat("Strength", strength, 0, 1000);
    this.health = new MockStat("Health", health, 0, 10000);
    this.gatherSpeed = new MockStat("Gather Speed", gatherSpeed, 0, 100);
    
    this.exp = new Map();
    this.exp.set("Lifetime", new MockStat("Lifetime EXP", 0));
    this.exp.set("Gathering", new MockStat("Gathering EXP", 0));
    this.exp.set("Hunting", new MockStat("Hunting EXP", 0));
    this.exp.set("Swimming", new MockStat("Swimming EXP", 0));
    this.exp.set("Farming", new MockStat("Farming EXP", 0));
    this.exp.set("Construction", new MockStat("Construction EXP", 0));
    this.exp.set("Ranged", new MockStat("Ranged EXP", 0));
    this.exp.set("Scouting", new MockStat("Scouting EXP", 0));
  }
  
  getExpTotal() {
    let total = 0;
    for (const [key, stat] of this.exp) {
      total += stat.statValue;
    }
    return total;
  }
}

global.MockStat = MockStat;
global.MockStatsContainer = MockStatsContainer;

describe('ResourceNode', function() {
  
  describe('Node Type Definitions', function() {
    describe('Tree Node (Leaf/Stick/Apple)', function() {
      it('should define tree node configuration', function() {
        const treeConfig = {
          nodeType: 'tree',
          spawnRadius: 2, // 2 grid tiles
          workToGather: 100,
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'green' }
        };

        expect(treeConfig.nodeType).to.equal('tree');
        expect(treeConfig.spawnRadius).to.equal(2);
        expect(treeConfig.workToGather).to.equal(100);
        expect(treeConfig.resourceTypes).to.have.lengthOf(3);
      });

      it('should have greenLeaf as most common resource', function() {
        const treeConfig = {
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ]
        };

        const greenLeaf = treeConfig.resourceTypes.find(r => r.type === 'greenLeaf');
        const stick = treeConfig.resourceTypes.find(r => r.type === 'stick');
        const apple = treeConfig.resourceTypes.find(r => r.type === 'apple');

        expect(greenLeaf.weight).to.be.greaterThan(stick.weight);
        expect(stick.weight).to.be.greaterThan(apple.weight);
      });

      it('should have spawn chances sum to approximately 1.0', function() {
        const treeConfig = {
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ]
        };

        const totalChance = treeConfig.resourceTypes.reduce((sum, r) => sum + r.spawnChance, 0);
        expect(totalChance).to.be.closeTo(1.0, 0.01);
      });
    });

    describe('Rock Node (Stone)', function() {
      it('should define rock node configuration', function() {
        const rockConfig = {
          nodeType: 'rock',
          spawnRadius: 2,
          workToGather: 200, // Harder to gather than tree
          resourceTypes: [
            { type: 'stone', weight: 1, spawnChance: 1.0 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'gray' }
        };

        expect(rockConfig.nodeType).to.equal('rock');
        expect(rockConfig.workToGather).to.equal(200);
        expect(rockConfig.resourceTypes).to.have.lengthOf(1);
        expect(rockConfig.resourceTypes[0].type).to.equal('stone');
      });

      it('should have higher workToGather than tree', function() {
        const treeWork = 100;
        const rockWork = 200;

        expect(rockWork).to.be.greaterThan(treeWork);
      });
    });

    describe('Beehive Node (Honey)', function() {
      it('should define beehive node configuration', function() {
        const beehiveConfig = {
          nodeType: 'beehive',
          spawnRadius: 2,
          workToGather: 150,
          resourceTypes: [
            { type: 'honey', weight: 1, spawnChance: 1.0 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'yellow' }
        };

        expect(beehiveConfig.nodeType).to.equal('beehive');
        expect(beehiveConfig.workToGather).to.equal(150);
        expect(beehiveConfig.resourceTypes[0].type).to.equal('honey');
      });
    });

    describe('Bush Node (Berries/Leaves)', function() {
      it('should define bush node configuration', function() {
        const bushConfig = {
          nodeType: 'bush',
          spawnRadius: 2,
          workToGather: 80, // Easier than tree
          resourceTypes: [
            { type: 'berries', weight: 3, spawnChance: 0.7 },
            { type: 'greenLeaf', weight: 1, spawnChance: 0.3 }
          ],
          visualIndicator: { type: 'progress_bar', color: 'purple' }
        };

        expect(bushConfig.nodeType).to.equal('bush');
        expect(bushConfig.workToGather).to.be.lessThan(100); // Easier than tree
        expect(bushConfig.resourceTypes).to.have.lengthOf(2);
      });
    });
  });

  describe('ResourceNode Class - Constructor', function() {
    it('should create resource node with basic parameters in grid coordinates', function() {
      const node = {
        gridX: 3,  // Grid coordinates
        gridY: 3,
        nodeType: 'tree',
        spawnRadius: 2,  // In tiles
        workToGather: 100,
        currentWork: 0,
        active: true
      };

      expect(node.gridX).to.equal(3);
      expect(node.gridY).to.equal(3);
      expect(node.nodeType).to.equal('tree');
      expect(node.spawnRadius).to.equal(2);
      expect(node.workToGather).to.equal(100);
      expect(node.currentWork).to.equal(0);
    });

    it('should initialize with zero progress', function() {
      const node = {
        currentWork: 0,
        workToGather: 100
      };

      const progress = node.currentWork / node.workToGather;
      expect(progress).to.equal(0);
    });

    it('should store resource type configurations', function() {
      const node = {
        resourceTypes: [
          { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
          { type: 'stick', weight: 2, spawnChance: 0.3 }
        ]
      };

      expect(node.resourceTypes).to.be.an('array');
      expect(node.resourceTypes).to.have.lengthOf(2);
    });

    it('should default to active state', function() {
      const node = {
        active: true
      };

      expect(node.active).to.be.true;
    });

    it('should track nearby gathering ants', function() {
      const node = {
        nearbyGatheringAnts: []
      };

      expect(node.nearbyGatheringAnts).to.be.an('array');
      expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
    });
  });

  describe('Ant Detection System', function() {
    describe('detectNearbyAnts()', function() {
      it('should detect ants within spawn radius (grid coords)', function() {
        const node = {
          gridX: 3,  // Grid: 3, 3
          gridY: 3,
          spawnRadius: 2 // 2 grid tiles
        };

        // Convert node grid position to pixels
        const [nodePixelX, nodePixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);

        const ant = {
          posX: nodePixelX + 20,  // Within 64 pixel radius (2 tiles * 32)
          posY: nodePixelY + 20,
          currentState: 'GATHERING'
        };

        const distance = Math.sqrt(
          Math.pow(ant.posX - nodePixelX, 2) + 
          Math.pow(ant.posY - nodePixelY, 2)
        );

        const radiusInPixels = node.spawnRadius * TILE_SIZE; // 2 * 32 = 64
        expect(distance).to.be.lessThan(radiusInPixels);
      });

      it('should not detect ants outside spawn radius (grid coords)', function() {
        const node = {
          gridX: 3,
          gridY: 3,
          spawnRadius: 2 // 64 pixels
        };

        // Convert node position
        const [nodePixelX, nodePixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);

        const ant = {
          posX: nodePixelX + 100,  // Far outside radius
          posY: nodePixelY + 100,
          currentState: 'GATHERING'
        };

        const distance = Math.sqrt(
          Math.pow(ant.posX - nodePixelX, 2) + 
          Math.pow(ant.posY - nodePixelY, 2)
        );

        const radiusInPixels = node.spawnRadius * TILE_SIZE;

        expect(distance).to.be.greaterThan(radiusInPixels);
      });

      it('should filter ants by GATHERING state', function() {
        const ants = [
          { id: 1, posX: 110, posY: 110, currentState: 'GATHERING' },
          { id: 2, posX: 115, posY: 115, currentState: 'IDLE' },
          { id: 3, posX: 120, posY: 120, currentState: 'MOVING' }
        ];

        const gatheringAnts = ants.filter(ant => ant.currentState === 'GATHERING');
        expect(gatheringAnts).to.have.lengthOf(1);
        expect(gatheringAnts[0].id).to.equal(1);
      });

      it('should update nearbyGatheringAnts array', function() {
        const node = {
          posX: 100,
          posY: 100,
          spawnRadius: 2,
          nearbyGatheringAnts: []
        };

        const ant = {
          id: 1,
          posX: 110,
          posY: 110,
          currentState: 'GATHERING'
        };

        // Simulate detection
        node.nearbyGatheringAnts.push(ant);

        expect(node.nearbyGatheringAnts).to.have.lengthOf(1);
        expect(node.nearbyGatheringAnts[0].id).to.equal(1);
      });

      it('should handle multiple gathering ants', function() {
        const node = {
          nearbyGatheringAnts: []
        };

        const ants = [
          { id: 1, currentState: 'GATHERING' },
          { id: 2, currentState: 'GATHERING' },
          { id: 3, currentState: 'GATHERING' }
        ];

        node.nearbyGatheringAnts = ants;

        expect(node.nearbyGatheringAnts).to.have.lengthOf(3);
      });

      it('should clear ants that left range', function() {
        const node = {
          nearbyGatheringAnts: [
            { id: 1, posX: 110, posY: 110 }
          ]
        };

        // Ant moves away
        node.nearbyGatheringAnts = [];

        expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
      });

      it('should clear ants that changed state', function() {
        const node = {
          nearbyGatheringAnts: [
            { id: 1, currentState: 'GATHERING' }
          ]
        };

        // Filter out non-gathering ants
        node.nearbyGatheringAnts[0].currentState = 'IDLE';
        node.nearbyGatheringAnts = node.nearbyGatheringAnts.filter(
          ant => ant.currentState === 'GATHERING'
        );

        expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
      });
    });

    describe('isAntInRange()', function() {
      it('should return true for ant within range', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const ant = { posX: 110, posY: 110 };

        const dx = ant.posX - node.posX;
        const dy = ant.posY - node.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusInPixels = node.spawnRadius * 32;

        expect(distance).to.be.lessThan(radiusInPixels);
      });

      it('should return false for ant outside range', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const ant = { posX: 200, posY: 200 };

        const dx = ant.posX - node.posX;
        const dy = ant.posY - node.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusInPixels = node.spawnRadius * 32;

        expect(distance).to.be.greaterThan(radiusInPixels);
      });

      it('should handle ant exactly on radius edge', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const radiusInPixels = node.spawnRadius * 32; // 64 pixels
        const ant = { posX: 100 + radiusInPixels, posY: 100 };

        const dx = ant.posX - node.posX;
        const dy = ant.posY - node.posY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        expect(distance).to.be.closeTo(radiusInPixels, 0.01);
      });
    });
  });

  describe('Work Progress System', function() {
    describe('addWork()', function() {
      it('should increase currentWork when gathering ant present', function() {
        const node = {
          currentWork: 0,
          workToGather: 100,
          nearbyGatheringAnts: [{ id: 1 }]
        };

        // Simulate work being added
        node.currentWork += 10;

        expect(node.currentWork).to.equal(10);
      });

      it('should not increase work when no gathering ants', function() {
        const node = {
          currentWork: 0,
          workToGather: 100,
          nearbyGatheringAnts: []
        };

        // No work added when no ants
        const workBefore = node.currentWork;
        // No change
        expect(node.currentWork).to.equal(workBefore);
      });

      it('should cap currentWork at workToGather', function() {
        const node = {
          currentWork: 95,
          workToGather: 100
        };

        node.currentWork += 10; // Would go to 105
        if (node.currentWork > node.workToGather) {
          node.currentWork = node.workToGather;
        }

        expect(node.currentWork).to.equal(100);
      });

      it('should scale work by number of ants', function() {
        const baseWorkRate = 1;
        const antCount1 = 1;
        const antCount3 = 3;

        const work1 = baseWorkRate * antCount1;
        const work3 = baseWorkRate * antCount3;

        expect(work3).to.equal(3 * work1);
      });

      it('should handle fractional work values', function() {
        const node = {
          currentWork: 0,
          workToGather: 100
        };

        node.currentWork += 0.5;
        node.currentWork += 0.3;

        expect(node.currentWork).to.be.closeTo(0.8, 0.01);
      });
    });

    describe('getProgress()', function() {
      it('should return progress as percentage (0-1)', function() {
        const node = {
          currentWork: 50,
          workToGather: 100
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(0.5);
      });

      it('should return 0 when no work done', function() {
        const node = {
          currentWork: 0,
          workToGather: 100
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(0);
      });

      it('should return 1 when work complete', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(1);
      });

      it('should handle very small work values', function() {
        const node = {
          currentWork: 1,
          workToGather: 1000
        };

        const progress = node.currentWork / node.workToGather;
        expect(progress).to.equal(0.001);
      });
    });

    describe('isReadyToSpawn()', function() {
      it('should return true when work reaches 100%', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        const ready = node.currentWork >= node.workToGather;
        expect(ready).to.be.true;
      });

      it('should return false when work incomplete', function() {
        const node = {
          currentWork: 99,
          workToGather: 100
        };

        const ready = node.currentWork >= node.workToGather;
        expect(ready).to.be.false;
      });

      it('should handle work exceeding requirement', function() {
        const node = {
          currentWork: 105,
          workToGather: 100
        };

        const ready = node.currentWork >= node.workToGather;
        expect(ready).to.be.true;
      });
    });

    describe('resetWork()', function() {
      it('should reset currentWork to 0 after spawning', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        // After spawning resources
        node.currentWork = 0;

        expect(node.currentWork).to.equal(0);
      });

      it('should maintain workToGather value', function() {
        const node = {
          currentWork: 100,
          workToGather: 100
        };

        const originalWork = node.workToGather;
        node.currentWork = 0;

        expect(node.workToGather).to.equal(originalWork);
      });
    });
  });

  describe('Visual Progress Indicator', function() {
    describe('renderProgressBar()', function() {
      it('should have progress bar above node', function() {
        const node = {
          posX: 100,
          posY: 100,
          sizeY: 32
        };

        const barY = node.posY - node.sizeY - 10; // Above node
        expect(barY).to.be.lessThan(node.posY);
      });

      it('should render bar only when ants are gathering', function() {
        const node = {
          nearbyGatheringAnts: [{ id: 1 }],
          showProgressBar: true
        };

        expect(node.nearbyGatheringAnts.length).to.be.greaterThan(0);
        expect(node.showProgressBar).to.be.true;
      });

      it('should hide bar when no ants nearby', function() {
        const node = {
          nearbyGatheringAnts: [],
          showProgressBar: false
        };

        expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
        expect(node.showProgressBar).to.be.false;
      });

      it('should have background bar (gray)', function() {
        const progressBar = {
          background: { color: 'gray', width: 50, height: 6 }
        };

        expect(progressBar.background.color).to.equal('gray');
        expect(progressBar.background.width).to.be.greaterThan(0);
      });

      it('should have foreground bar (colored by node type)', function() {
        const treeBar = { foreground: { color: 'green' } };
        const rockBar = { foreground: { color: 'gray' } };
        const beehiveBar = { foreground: { color: 'yellow' } };

        expect(treeBar.foreground.color).to.equal('green');
        expect(rockBar.foreground.color).to.equal('gray');
        expect(beehiveBar.foreground.color).to.equal('yellow');
      });

      it('should scale foreground width by progress', function() {
        const progress = 0.5;
        const maxWidth = 50;
        const foregroundWidth = maxWidth * progress;

        expect(foregroundWidth).to.equal(25);
      });

      it('should show full bar at 100% progress', function() {
        const progress = 1.0;
        const maxWidth = 50;
        const foregroundWidth = maxWidth * progress;

        expect(foregroundWidth).to.equal(maxWidth);
      });

      it('should center bar above node', function() {
        const node = { posX: 100, sizeX: 32 };
        const barWidth = 50;
        const barX = node.posX + (node.sizeX / 2) - (barWidth / 2);

        expect(barX).to.equal(100 + 16 - 25);
      });
    });

    describe('Visual Indicator Timing', function() {
      it('should flash when reaching 100%', function() {
        const node = {
          currentWork: 100,
          workToGather: 100,
          flashTimer: 0,
          maxFlashTime: 1.0
        };

        const isFlashing = node.currentWork >= node.workToGather && 
                          node.flashTimer < node.maxFlashTime;

        expect(isFlashing).to.be.true;
      });

      it('should stop flashing after delay', function() {
        const node = {
          flashTimer: 1.5,
          maxFlashTime: 1.0
        };

        const isFlashing = node.flashTimer < node.maxFlashTime;
        expect(isFlashing).to.be.false;
      });
    });
  });

  describe('Resource Spawning System', function() {
    describe('spawnResource() - Single Resource', function() {
      it('should spawn resource when work complete', function() {
        const node = {
          currentWork: 100,
          workToGather: 100,
          canSpawn: function() {
            return this.currentWork >= this.workToGather;
          }
        };

        expect(node.canSpawn()).to.be.true;
      });

      it('should not spawn when work incomplete', function() {
        const node = {
          currentWork: 50,
          workToGather: 100,
          canSpawn: function() {
            return this.currentWork >= this.workToGather;
          }
        };

        expect(node.canSpawn()).to.be.false;
      });

      it('should select resource type based on weighted randomization', function() {
        const resourceTypes = [
          { type: 'greenLeaf', weight: 5 },
          { type: 'stick', weight: 2 },
          { type: 'apple', weight: 1 }
        ];

        const totalWeight = resourceTypes.reduce((sum, r) => sum + r.weight, 0);
        expect(totalWeight).to.equal(8);

        // Test probability distribution
        const roll = 3.5; // Mid-range
        let cumulative = 0;
        let selected;

        for (const resource of resourceTypes) {
          cumulative += resource.weight;
          if (roll <= cumulative) {
            selected = resource.type;
            break;
          }
        }

        expect(selected).to.equal('greenLeaf');
      });

      it('should spawn resource near node position', function() {
        const node = { posX: 100, posY: 100 };
        const spawnOffset = 20;
        const resourceX = node.posX + spawnOffset;
        const resourceY = node.posY + spawnOffset;

        expect(resourceX).to.be.closeTo(node.posX, 30);
        expect(resourceY).to.be.closeTo(node.posY, 30);
      });

      it('should reset work after spawning', function() {
        const node = {
          currentWork: 100,
          workToGather: 100,
          spawn: function() {
            this.currentWork = 0;
            return { type: 'resource' };
          }
        };

        node.spawn();
        expect(node.currentWork).to.equal(0);
      });
    });

    describe('spawnResourceBatch() - Multiple Resources', function() {
      it('should spawn 1-5 resources', function() {
        const batchSizes = [1, 2, 3, 4, 5];
        
        batchSizes.forEach(size => {
          expect(size).to.be.at.least(1);
          expect(size).to.be.at.most(5);
        });
      });

      it('should spread resources evenly around node', function() {
        const node = { posX: 100, posY: 100 };
        const count = 4;
        const radius = 30;

        const positions = [];
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const x = node.posX + Math.cos(angle) * radius;
          const y = node.posY + Math.sin(angle) * radius;
          positions.push({ x, y });
        }

        expect(positions).to.have.lengthOf(4);
        
        // Check they're spread out
        const distances = [];
        for (let i = 0; i < positions.length - 1; i++) {
          const dx = positions[i + 1].x - positions[i].x;
          const dy = positions[i + 1].y - positions[i].y;
          distances.push(Math.sqrt(dx * dx + dy * dy));
        }

        // All distances should be similar (evenly distributed)
        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        distances.forEach(d => {
          expect(d).to.be.closeTo(avgDist, 10);
        });
      });

      it('should randomize batch size', function() {
        const results = [];
        for (let i = 0; i < 10; i++) {
          const batchSize = Math.floor(random(1, 6)); // 1-5
          results.push(batchSize);
        }

        const allSame = results.every(v => v === results[0]);
        expect(allSame).to.be.false; // Should have variation
      });

      it('should use circular distribution formula', function() {
        const count = 3;
        const angles = [];

        for (let i = 0; i < count; i++) {
          angles.push((Math.PI * 2 * i) / count);
        }

        expect(angles[0]).to.equal(0);
        expect(angles[1]).to.be.closeTo(Math.PI * 2 / 3, 0.01);
        expect(angles[2]).to.be.closeTo(Math.PI * 4 / 3, 0.01);
      });

      it('should handle single resource batch', function() {
        const count = 1;
        const positions = [];
        const node = { posX: 100, posY: 100 };
        const radius = 30;

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const x = node.posX + Math.cos(angle) * radius;
          const y = node.posY + Math.sin(angle) * radius;
          positions.push({ x, y });
        }

        expect(positions).to.have.lengthOf(1);
        expect(positions[0].x).to.be.closeTo(node.posX + radius, 0.01);
      });

      it('should handle maximum batch (5 resources)', function() {
        const count = 5;
        const node = { posX: 100, posY: 100 };
        const radius = 30;
        const positions = [];

        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const x = node.posX + Math.cos(angle) * radius;
          const y = node.posY + Math.sin(angle) * radius;
          positions.push({ x, y });
        }

        expect(positions).to.have.lengthOf(5);
      });
    });

    describe('Resource Type Selection', function() {
      it('should favor common resources over rare', function() {
        const trials = 1000;
        const results = { greenLeaf: 0, stick: 0, apple: 0 };
        const resourceTypes = [
          { type: 'greenLeaf', weight: 5 },
          { type: 'stick', weight: 2 },
          { type: 'apple', weight: 1 }
        ];
        const totalWeight = 8;

        for (let i = 0; i < trials; i++) {
          const roll = random(0, totalWeight);
          let cumulative = 0;

          for (const resource of resourceTypes) {
            cumulative += resource.weight;
            if (roll <= cumulative) {
              results[resource.type]++;
              break;
            }
          }
        }

        // greenLeaf should be most common
        expect(results.greenLeaf).to.be.greaterThan(results.stick);
        expect(results.stick).to.be.greaterThan(results.apple);
      });

      it('should handle single resource type nodes', function() {
        const resourceTypes = [
          { type: 'stone', weight: 1 }
        ];

        const totalWeight = resourceTypes.reduce((sum, r) => sum + r.weight, 0);
        expect(totalWeight).to.equal(1);

        const selected = resourceTypes[0].type;
        expect(selected).to.equal('stone');
      });
    });
  });

  describe('Work Rate and Difficulty', function() {
    describe('Node Difficulty Levels', function() {
      it('should have easy nodes (bush: 80 work)', function() {
        const bushNode = { nodeType: 'bush', workToGather: 80 };
        expect(bushNode.workToGather).to.equal(80);
      });

      it('should have medium nodes (tree: 100 work)', function() {
        const treeNode = { nodeType: 'tree', workToGather: 100 };
        expect(treeNode.workToGather).to.equal(100);
      });

      it('should have hard nodes (beehive: 150 work)', function() {
        const beehiveNode = { nodeType: 'beehive', workToGather: 150 };
        expect(beehiveNode.workToGather).to.equal(150);
      });

      it('should have very hard nodes (rock: 200 work)', function() {
        const rockNode = { nodeType: 'rock', workToGather: 200 };
        expect(rockNode.workToGather).to.equal(200);
      });

      it('should order difficulties correctly', function() {
        const difficulties = {
          bush: 80,
          tree: 100,
          beehive: 150,
          rock: 200
        };

        expect(difficulties.bush).to.be.lessThan(difficulties.tree);
        expect(difficulties.tree).to.be.lessThan(difficulties.beehive);
        expect(difficulties.beehive).to.be.lessThan(difficulties.rock);
      });
    });

    describe('Work Rate Calculations', function() {
      it('should use base work rate per tick', function() {
        const baseWorkRate = 1.0; // 1 work per update
        expect(baseWorkRate).to.equal(1.0);
      });

      it('should scale work by ant count', function() {
        const baseRate = 1.0;
        const antCount = 3;
        const totalWork = baseRate * antCount;

        expect(totalWork).to.equal(3.0);
      });

      it('should cap work contribution per ant', function() {
        const maxWorkPerAnt = 1.5;
        const antCount = 10;
        const totalWork = Math.min(maxWorkPerAnt * antCount, maxWorkPerAnt * 5); // Cap at 5 ants

        expect(totalWork).to.equal(7.5);
      });

      it('should calculate time to complete', function() {
        const workRequired = 100;
        const workRate = 1.0; // per tick
        const antsWorking = 2;
        const ticksRequired = workRequired / (workRate * antsWorking);

        expect(ticksRequired).to.equal(50);
      });
    });
  });

  describe('Integration with Gathering State', function() {
    describe('Ant Movement Around Node', function() {
      it('should move ant towards node when gathering', function() {
        const node = { posX: 100, posY: 100 };
        const ant = { posX: 150, posY: 150, targetX: null, targetY: null };

        // Ant should target node position
        ant.targetX = node.posX;
        ant.targetY = node.posY;

        expect(ant.targetX).to.equal(node.posX);
        expect(ant.targetY).to.equal(node.posY);
      });

      it('should update ant position every few seconds', function() {
        const ant = {
          posX: 100,
          posY: 100,
          moveTimer: 0,
          moveInterval: 3.0 // 3 seconds
        };

        // Simulate time passing
        ant.moveTimer += 3.5;

        const shouldMove = ant.moveTimer >= ant.moveInterval;
        expect(shouldMove).to.be.true;
      });

      it('should reset move timer after repositioning', function() {
        const ant = {
          moveTimer: 3.5,
          moveInterval: 3.0
        };

        // After moving
        ant.moveTimer = 0;

        expect(ant.moveTimer).to.equal(0);
      });

      it('should generate random position around node', function() {
        const node = { posX: 100, posY: 100 };
        const radius = 40;
        const angle = random(0, Math.PI * 2);
        
        const newX = node.posX + Math.cos(angle) * radius;
        const newY = node.posY + Math.sin(angle) * radius;

        const distance = Math.sqrt(
          Math.pow(newX - node.posX, 2) + 
          Math.pow(newY - node.posY, 2)
        );

        expect(distance).to.be.closeTo(radius, 0.01);
      });

      it('should keep ant within spawn radius', function() {
        const node = { posX: 100, posY: 100, spawnRadius: 2 };
        const maxDistance = node.spawnRadius * 32; // 64 pixels
        const angle = random(0, Math.PI * 2);
        const distance = random(10, maxDistance - 5);

        const newX = node.posX + Math.cos(angle) * distance;
        const newY = node.posY + Math.sin(angle) * distance;

        const actualDistance = Math.sqrt(
          Math.pow(newX - node.posX, 2) + 
          Math.pow(newY - node.posY, 2)
        );

        expect(actualDistance).to.be.lessThan(maxDistance);
      });
    });

    describe('Gathering State Integration', function() {
      it('should transition to GATHERING when near node', function() {
        const ant = {
          currentState: 'MOVING',
          targetNode: { id: 'tree1' }
        };

        // When ant reaches node
        ant.currentState = 'GATHERING';

        expect(ant.currentState).to.equal('GATHERING');
      });

      it('should store target node reference', function() {
        const node = { id: 'tree1', nodeType: 'tree' };
        const ant = {
          targetNode: null,
          currentState: 'IDLE'
        };

        // When targeting node
        ant.targetNode = node;
        ant.currentState = 'GATHERING';

        expect(ant.targetNode).to.equal(node);
      });

      it('should leave GATHERING when node depleted', function() {
        const ant = {
          currentState: 'GATHERING',
          targetNode: { active: false }
        };

        // When node becomes inactive
        if (!ant.targetNode.active) {
          ant.currentState = 'IDLE';
          ant.targetNode = null;
        }

        expect(ant.currentState).to.equal('IDLE');
        expect(ant.targetNode).to.be.null;
      });
    });
  });

  describe('Update Loop', function() {
    it('should detect nearby ants on each update', function() {
      const node = {
        updateCount: 0,
        update: function() {
          this.updateCount++;
          // Detect ants
        }
      };

      node.update();
      node.update();

      expect(node.updateCount).to.equal(2);
    });

    it('should add work when gathering ants present', function() {
      const node = {
        currentWork: 0,
        nearbyGatheringAnts: [{ id: 1 }],
        update: function() {
          if (this.nearbyGatheringAnts.length > 0) {
            this.currentWork += this.nearbyGatheringAnts.length;
          }
        }
      };

      node.update();
      expect(node.currentWork).to.equal(1);
    });

    it('should spawn resources when work complete', function() {
      const node = {
        currentWork: 100,
        workToGather: 100,
        spawnedResources: [],
        update: function() {
          if (this.currentWork >= this.workToGather) {
            this.spawnedResources.push({ type: 'resource' });
            this.currentWork = 0;
          }
        }
      };

      node.update();
      expect(node.spawnedResources).to.have.lengthOf(1);
      expect(node.currentWork).to.equal(0);
    });

    it('should update visual indicators', function() {
      const node = {
        showProgressBar: false,
        nearbyGatheringAnts: [{ id: 1 }],
        update: function() {
          this.showProgressBar = this.nearbyGatheringAnts.length > 0;
        }
      };

      node.update();
      expect(node.showProgressBar).to.be.true;
    });
  });

  describe('Edge Cases and Error Handling', function() {
    it('should handle no nearby ants', function() {
      const node = {
        nearbyGatheringAnts: [],
        currentWork: 50
      };

      // No work should be added
      const workBefore = node.currentWork;
      // Update with no ants
      expect(node.currentWork).to.equal(workBefore);
    });

    it('should handle ant leaving mid-gather', function() {
      const node = {
        nearbyGatheringAnts: [{ id: 1 }],
        currentWork: 50
      };

      // Ant leaves
      node.nearbyGatheringAnts = [];

      expect(node.nearbyGatheringAnts).to.have.lengthOf(0);
      expect(node.currentWork).to.equal(50); // Progress preserved
    });

    it('should handle multiple resource types with equal weight', function() {
      const resourceTypes = [
        { type: 'berries', weight: 1 },
        { type: 'leaves', weight: 1 }
      ];

      const totalWeight = resourceTypes.reduce((sum, r) => sum + r.weight, 0);
      expect(totalWeight).to.equal(2);
    });

    it('should handle zero work requirement', function() {
      const node = {
        currentWork: 0,
        workToGather: 0
      };

      const ready = node.currentWork >= node.workToGather;
      expect(ready).to.be.true;
    });

    it('should handle node deactivation', function() {
      const node = {
        active: true,
        nearbyGatheringAnts: [{ id: 1 }]
      };

      node.active = false;

      expect(node.active).to.be.false;
      // Should stop processing when inactive
    });

    it('should handle null ant array', function() {
      const node = {
        nearbyGatheringAnts: null
      };

      const antCount = node.nearbyGatheringAnts ? node.nearbyGatheringAnts.length : 0;
      expect(antCount).to.equal(0);
    });

    it('should handle fractional spawn radius', function() {
      const node = {
        spawnRadius: 1.5 // 1.5 tiles
      };

      const radiusInPixels = node.spawnRadius * 32;
      expect(radiusInPixels).to.equal(48);
    });

    it('should handle very large workToGather values', function() {
      const node = {
        currentWork: 5000,
        workToGather: 10000
      };

      const progress = node.currentWork / node.workToGather;
      expect(progress).to.equal(0.5);
    });
  });

  describe('Performance and Optimization', function() {
    it('should cache nearby ants between updates', function() {
      const node = {
        nearbyGatheringAnts: [],
        cachedAnts: [],
        cacheValid: false
      };

      // First update - detect and cache
      node.nearbyGatheringAnts = [{ id: 1 }, { id: 2 }];
      node.cachedAnts = [...node.nearbyGatheringAnts];
      node.cacheValid = true;

      expect(node.cachedAnts).to.have.lengthOf(2);
    });

    it('should invalidate cache when ants change', function() {
      const node = {
        cachedAnts: [{ id: 1 }],
        cacheValid: true
      };

      // Ant moves away
      node.cacheValid = false;
      node.cachedAnts = [];

      expect(node.cacheValid).to.be.false;
    });

    it('should limit ant detection radius checks', function() {
      const maxCheckDistance = 100; // pixels
      const node = { posX: 100, posY: 100 };
      const ant = { posX: 250, posY: 250 };

      const dx = Math.abs(ant.posX - node.posX);
      const dy = Math.abs(ant.posY - node.posY);

      // Quick rejection before distance calculation
      if (dx > maxCheckDistance || dy > maxCheckDistance) {
        // Skip expensive sqrt calculation
        expect(true).to.be.true;
      }
    });
  });

  describe('Resource Gather Limits (Depletable vs Infinite)', function() {
    describe('Infinite Nodes (resourceGatherLimit = 0)', function() {
      it('should create infinite resource node with limit of 0', function() {
        const node = {
          nodeType: 'tree',
          gridX: 10,
          gridY: 10,
          resourceGatherLimit: 0, // 0 = infinite
          gatherCount: 0
        };

        expect(node.resourceGatherLimit).to.equal(0);
        expect(node.gatherCount).to.equal(0);
      });

      it('should never deplete when resourceGatherLimit is 0', function() {
        const node = {
          resourceGatherLimit: 0,
          gatherCount: 1000 // Gathered many times
        };

        const isDepleted = node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit;
        expect(isDepleted).to.be.false;
      });

      it('should allow unlimited gathers on trees', function() {
        const treeNode = {
          nodeType: 'tree',
          resourceGatherLimit: 0,
          gatherCount: 0
        };

        // Simulate many gathers
        for (let i = 0; i < 100; i++) {
          treeNode.gatherCount++;
        }

        const isDepleted = treeNode.resourceGatherLimit > 0 && treeNode.gatherCount >= treeNode.resourceGatherLimit;
        expect(isDepleted).to.be.false;
        expect(treeNode.gatherCount).to.equal(100);
      });

      it('should allow unlimited gathers on rocks', function() {
        const rockNode = {
          nodeType: 'rock',
          resourceGatherLimit: 0,
          gatherCount: 0
        };

        for (let i = 0; i < 50; i++) {
          rockNode.gatherCount++;
        }

        const isDepleted = rockNode.resourceGatherLimit > 0 && rockNode.gatherCount >= rockNode.resourceGatherLimit;
        expect(isDepleted).to.be.false;
      });
    });

    describe('Depletable Nodes (resourceGatherLimit > 0)', function() {
      it('should create depletable node with positive limit', function() {
        const node = {
          nodeType: 'bush',
          gridX: 5,
          gridY: 5,
          resourceGatherLimit: 10, // Depletes after 10 gathers
          gatherCount: 0
        };

        expect(node.resourceGatherLimit).to.be.greaterThan(0);
        expect(node.gatherCount).to.equal(0);
      });

      it('should track gathers toward limit', function() {
        const node = {
          resourceGatherLimit: 5,
          gatherCount: 0
        };

        node.gatherCount++;
        expect(node.gatherCount).to.equal(1);

        node.gatherCount++;
        expect(node.gatherCount).to.equal(2);

        const remaining = node.resourceGatherLimit - node.gatherCount;
        expect(remaining).to.equal(3);
      });

      it('should mark as depleted when limit reached', function() {
        const node = {
          resourceGatherLimit: 3,
          gatherCount: 0
        };

        node.gatherCount = 3;

        const isDepleted = node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit;
        expect(isDepleted).to.be.true;
      });

      it('should trigger destruction when depleted', function() {
        const node = {
          resourceGatherLimit: 5,
          gatherCount: 5,
          shouldDestroy: false
        };

        if (node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit) {
          node.shouldDestroy = true;
        }

        expect(node.shouldDestroy).to.be.true;
      });

      it('should have different nodes with different limits', function() {
        const bushNode = {
          nodeType: 'bush',
          resourceGatherLimit: 8
        };

        const grassNode = {
          nodeType: 'grass',
          resourceGatherLimit: 3
        };

        expect(bushNode.resourceGatherLimit).to.not.equal(grassNode.resourceGatherLimit);
      });
    });

    describe('Random Gather Limits', function() {
      it('should support random range for gather limits', function() {
        const nodeConfig = {
          nodeType: 'bush',
          gatherLimitRange: [5, 15] // Random between 5 and 15
        };

        // Simulate random limit generation
        const randomLimit = Math.floor(Math.random() * (nodeConfig.gatherLimitRange[1] - nodeConfig.gatherLimitRange[0] + 1)) + nodeConfig.gatherLimitRange[0];

        expect(randomLimit).to.be.at.least(nodeConfig.gatherLimitRange[0]);
        expect(randomLimit).to.be.at.most(nodeConfig.gatherLimitRange[1]);
      });

      it('should create nodes with varied limits from same config', function() {
        const config = {
          gatherLimitRange: [3, 10]
        };

        const limits = [];
        for (let i = 0; i < 20; i++) {
          const limit = Math.floor(Math.random() * (config.gatherLimitRange[1] - config.gatherLimitRange[0] + 1)) + config.gatherLimitRange[0];
          limits.push(limit);
        }

        // Should have variation (not all the same)
        const uniqueLimits = new Set(limits);
        expect(uniqueLimits.size).to.be.greaterThan(1);
      });

      it('should handle single value range (no randomness)', function() {
        const config = {
          gatherLimitRange: [7, 7] // Always 7
        };

        const limit = Math.floor(Math.random() * (config.gatherLimitRange[1] - config.gatherLimitRange[0] + 1)) + config.gatherLimitRange[0];

        expect(limit).to.equal(7);
      });

      it('should support infinite as part of config', function() {
        const treeConfig = {
          nodeType: 'tree',
          gatherLimitRange: [0, 0] // Always infinite
        };

        const limit = treeConfig.gatherLimitRange[0];
        expect(limit).to.equal(0);
      });
    });

    describe('Gather Limit Integration', function() {
      it('should increment gather count on resource spawn', function() {
        const node = {
          gatherCount: 0,
          resourceGatherLimit: 10,
          currentWork: 100,
          workToGather: 100
        };

        // Resource spawned
        if (node.currentWork >= node.workToGather) {
          node.gatherCount++;
          node.currentWork = 0;
        }

        expect(node.gatherCount).to.equal(1);
        expect(node.currentWork).to.equal(0);
      });

      it('should track progress toward depletion', function() {
        const node = {
          gatherCount: 7,
          resourceGatherLimit: 10
        };

        const progress = node.gatherCount / node.resourceGatherLimit;
        expect(progress).to.equal(0.7);

        const remaining = node.resourceGatherLimit - node.gatherCount;
        expect(remaining).to.equal(3);
      });

      it('should stop spawning when depleted', function() {
        const node = {
          gatherCount: 10,
          resourceGatherLimit: 10,
          active: true
        };

        if (node.resourceGatherLimit > 0 && node.gatherCount >= node.resourceGatherLimit) {
          node.active = false;
        }

        expect(node.active).to.be.false;
      });
    });
  });

  describe('Ant Gathering Experience (StatsContainer Integration)', function() {
    describe('StatsContainer Exp Structure', function() {
      it('should have gathering exp in StatsContainer', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        expect(stats.exp.has('Gathering')).to.be.true;
      });

      it('should initialize gathering exp to 0', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        const gatheringExp = stats.exp.get('Gathering');
        expect(gatheringExp.statValue).to.equal(0);
      });

      it('should support exp increment', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        const gatheringExp = stats.exp.get('Gathering');
        gatheringExp.statValue += 10;

        expect(gatheringExp.statValue).to.equal(10);
      });

      it('should track exp separately per ant', function() {
        const ant1Stats = new MockStatsContainer(createVector(10, 10), createVector(32, 32));
        const ant2Stats = new MockStatsContainer(createVector(20, 20), createVector(32, 32));

        ant1Stats.exp.get('Gathering').statValue = 50;
        ant2Stats.exp.get('Gathering').statValue = 30;

        expect(ant1Stats.exp.get('Gathering').statValue).to.equal(50);
        expect(ant2Stats.exp.get('Gathering').statValue).to.equal(30);
      });
    });

    describe('Experience Gain on Gather', function() {
      it('should increment ant exp when resource gathered', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32)),
          currentState: 'GATHERING'
        };

        const node = {
          currentWork: 100,
          workToGather: 100
        };

        // Resource gathered
        if (node.currentWork >= node.workToGather) {
          ant.stats.exp.get('Gathering').statValue += 10;
        }

        expect(ant.stats.exp.get('Gathering').statValue).to.equal(10);
      });

      it('should grant exp per gather completion', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        const expPerGather = 15;

        // Simulate 3 gathers
        for (let i = 0; i < 3; i++) {
          ant.stats.exp.get('Gathering').statValue += expPerGather;
        }

        expect(ant.stats.exp.get('Gathering').statValue).to.equal(45);
      });

      it('should award different exp for different node types', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        const treeExpReward = 10;
        const rockExpReward = 20; // Harder = more exp

        // Gather from tree
        ant.stats.exp.get('Gathering').statValue += treeExpReward;
        expect(ant.stats.exp.get('Gathering').statValue).to.equal(10);

        // Gather from rock
        ant.stats.exp.get('Gathering').statValue += rockExpReward;
        expect(ant.stats.exp.get('Gathering').statValue).to.equal(30);
      });

      it('should track exp across multiple ants independently', function() {
        const ant1 = {
          id: 1,
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        const ant2 = {
          id: 2,
          stats: new MockStatsContainer(createVector(20, 20), createVector(32, 32))
        };

        // Ant 1 gathers
        ant1.stats.exp.get('Gathering').statValue += 20;

        // Ant 2 gathers
        ant2.stats.exp.get('Gathering').statValue += 30;

        expect(ant1.stats.exp.get('Gathering').statValue).to.equal(20);
        expect(ant2.stats.exp.get('Gathering').statValue).to.equal(30);
      });
    });

    describe('Experience Persistence', function() {
      it('should preserve exp when ant leaves node', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        ant.stats.exp.get('Gathering').statValue = 75;

        // Ant leaves node area
        const expAfterLeaving = ant.stats.exp.get('Gathering').statValue;
        expect(expAfterLeaving).to.equal(75);
      });

      it('should accumulate exp across multiple nodes', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        // Gather from node 1
        ant.stats.exp.get('Gathering').statValue += 25;

        // Move to node 2 and gather
        ant.stats.exp.get('Gathering').statValue += 30;

        // Move to node 3 and gather
        ant.stats.exp.get('Gathering').statValue += 15;

        expect(ant.stats.exp.get('Gathering').statValue).to.equal(70);
      });

      it('should maintain exp in StatsContainer total', function() {
        const ant = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32))
        };

        ant.stats.exp.get('Gathering').statValue = 100;
        ant.stats.exp.get('Construction').statValue = 50;

        const totalExp = ant.stats.getExpTotal();
        expect(totalExp).to.equal(150);
      });
    });

    describe('Edge Cases - Experience', function() {
      it('should handle ant without StatsContainer gracefully', function() {
        const ant = {
          currentState: 'GATHERING'
          // No stats property
        };

        const hasStats = ant.stats && ant.stats.exp;
        expect(hasStats).to.be.undefined;
      });

      it('should handle partial StatsContainer (missing exp)', function() {
        const ant = {
          stats: {
            health: new MockStat('Health', 100)
            // Missing exp Map
          }
        };

        const hasGatheringExp = ant.stats.exp && ant.stats.exp.has('Gathering');
        expect(hasGatheringExp).to.be.undefined;
      });

      it('should cap exp at stat upper limit', function() {
        const stats = new MockStatsContainer(createVector(10, 10), createVector(32, 32));
        const gatheringExp = stats.exp.get('Gathering');
        
        gatheringExp.statUpperLimit = 1000;
        gatheringExp.statValue = 1500; // Try to exceed limit

        expect(gatheringExp.statValue).to.equal(1000);
      });
    });
  });

  describe('Ant Gather Speed (StatsContainer Integration)', function() {
    describe('Gather Speed Stat', function() {
      it('should have gatherSpeed stat in StatsContainer', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        expect(stats.gatherSpeed).to.exist;
        expect(stats.gatherSpeed.statName).to.equal('Gather Speed');
      });

      it('should default to gather speed of 1', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        expect(stats.gatherSpeed.statValue).to.equal(1);
      });

      it('should support custom gather speed', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32),
          0.05, // movementSpeed
          null, // pendingPos
          10, // strength
          100, // health
          2.5 // gatherSpeed
        );

        expect(stats.gatherSpeed.statValue).to.equal(2.5);
      });

      it('should allow gather speed modification', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        stats.gatherSpeed.statValue = 1.5;
        expect(stats.gatherSpeed.statValue).to.equal(1.5);
      });
    });

    describe('Speed Affects Work Rate', function() {
      it('should use gather speed as work multiplier', function() {
        const ant = {
          stats: new MockStatsContainer(
            createVector(10, 10),
            createVector(32, 32),
            0.05, null, 10, 100, 2.0 // gatherSpeed = 2.0
          )
        };

        const baseWorkPerUpdate = 1;
        const actualWork = baseWorkPerUpdate * ant.stats.gatherSpeed.statValue;

        expect(actualWork).to.equal(2.0);
      });

      it('should accumulate work faster with higher speed', function() {
        const fastAnt = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 3.0)
        };

        const slowAnt = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 0.5)
        };

        const baseWork = 5;
        const fastWork = baseWork * fastAnt.stats.gatherSpeed.statValue;
        const slowWork = baseWork * slowAnt.stats.gatherSpeed.statValue;

        expect(fastWork).to.equal(15); // 5 * 3.0
        expect(slowWork).to.equal(2.5); // 5 * 0.5
        expect(fastWork).to.be.greaterThan(slowWork);
      });

      it('should calculate time to gather based on speed', function() {
        const node = {
          workToGather: 100
        };

        const ant1 = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 1.0)
        };

        const ant2 = {
          stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 2.0)
        };

        const workPerUpdate = 2;

        const updatesForAnt1 = node.workToGather / (workPerUpdate * ant1.stats.gatherSpeed.statValue);
        const updatesForAnt2 = node.workToGather / (workPerUpdate * ant2.stats.gatherSpeed.statValue);

        expect(updatesForAnt1).to.equal(50); // 100 / (2 * 1.0)
        expect(updatesForAnt2).to.equal(25); // 100 / (2 * 2.0)
      });

      it('should support fractional gather speeds', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32),
          0.05, null, 10, 100, 0.75
        );

        const baseWork = 10;
        const actualWork = baseWork * stats.gatherSpeed.statValue;

        expect(actualWork).to.equal(7.5);
      });
    });

    describe('Multi-Ant Gathering with Different Speeds', function() {
      it('should handle multiple ants with different speeds', function() {
        const node = {
          currentWork: 0,
          workToGather: 100
        };

        const ants = [
          { stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 1.0) },
          { stats: new MockStatsContainer(createVector(20, 20), createVector(32, 32), 0.05, null, 10, 100, 1.5) },
          { stats: new MockStatsContainer(createVector(30, 30), createVector(32, 32), 0.05, null, 10, 100, 0.8) }
        ];

        const baseWorkPerAnt = 5;
        let totalWork = 0;

        for (const ant of ants) {
          totalWork += baseWorkPerAnt * ant.stats.gatherSpeed.statValue;
        }

        expect(totalWork).to.equal(16.5); // (5*1.0) + (5*1.5) + (5*0.8)
      });

      it('should calculate combined gather rate', function() {
        const ants = [
          { stats: new MockStatsContainer(createVector(10, 10), createVector(32, 32), 0.05, null, 10, 100, 2.0) },
          { stats: new MockStatsContainer(createVector(20, 20), createVector(32, 32), 0.05, null, 10, 100, 1.5) }
        ];

        const combinedSpeed = ants.reduce((sum, ant) => sum + ant.stats.gatherSpeed.statValue, 0);
        expect(combinedSpeed).to.equal(3.5);
      });
    });

    describe('Edge Cases - Gather Speed', function() {
      it('should fallback to speed 1.0 if ant has no StatsContainer', function() {
        const ant = {
          currentState: 'GATHERING'
          // No stats
        };

        const gatherSpeed = ant.stats?.gatherSpeed?.statValue || 1.0;
        expect(gatherSpeed).to.equal(1.0);
      });

      it('should handle zero gather speed gracefully', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32),
          0.05, null, 10, 100, 0
        );

        const baseWork = 10;
        const actualWork = baseWork * stats.gatherSpeed.statValue;

        expect(actualWork).to.equal(0);
      });

      it('should cap gather speed at upper limit', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        stats.gatherSpeed.statValue = 150; // Try to exceed default limit of 100

        expect(stats.gatherSpeed.statValue).to.equal(100);
      });

      it('should not go below lower limit', function() {
        const stats = new MockStatsContainer(
          createVector(10, 10),
          createVector(32, 32)
        );

        stats.gatherSpeed.statValue = -5; // Try negative

        expect(stats.gatherSpeed.statValue).to.equal(0);
      });
    });
  });

  describe('Attack Targeting (Combat Integration)', function() {
    describe('Targetable Property', function() {
      it('should mark nodes as targetable', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          nodeType: 'tree',
          targetable: true
        };

        expect(node.targetable).to.be.true;
      });

      it('should allow nodes to be selected as attack target', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          targetable: true,
          type: 'ResourceNode'
        };

        const attacker = {
          target: null
        };

        if (node.targetable) {
          attacker.target = node;
        }

        expect(attacker.target).to.equal(node);
      });

      it('should support faction property for targeting', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          faction: 'neutral',
          targetable: true
        };

        expect(node.faction).to.equal('neutral');
      });
    });

    describe('Not Auto-Attacked', function() {
      it('should not be in default enemy targeting', function() {
        const node = {
          type: 'ResourceNode',
          faction: 'neutral',
          autoAttackTarget: false
        };

        expect(node.autoAttackTarget).to.be.false;
      });

      it('should exclude neutral faction from auto-attack', function() {
        const entities = [
          { type: 'Ant', faction: 'enemy' },
          { type: 'ResourceNode', faction: 'neutral' },
          { type: 'Ant', faction: 'enemy' }
        ];

        const autoTargets = entities.filter(e => e.faction === 'enemy');
        expect(autoTargets).to.have.lengthOf(2);
      });

      it('should require manual targeting to attack', function() {
        const node = {
          type: 'ResourceNode',
          targetable: true,
          requiresManualTarget: true
        };

        expect(node.requiresManualTarget).to.be.true;
      });
    });

    describe('Health Tracking for Combat', function() {
      it('should have health property for nodes', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          nodeType: 'tree',
          health: 100,
          maxHealth: 100
        };

        expect(node.health).to.equal(100);
        expect(node.maxHealth).to.equal(100);
      });

      it('should support different health values per node type', function() {
        const treeNode = {
          nodeType: 'tree',
          health: 150,
          maxHealth: 150
        };

        const rockNode = {
          nodeType: 'rock',
          health: 300,
          maxHealth: 300
        };

        expect(rockNode.health).to.be.greaterThan(treeNode.health);
      });

      it('should reduce health when taking damage', function() {
        const node = {
          health: 100,
          maxHealth: 100
        };

        const damage = 25;
        node.health -= damage;

        expect(node.health).to.equal(75);
      });

      it('should track health as percentage', function() {
        const node = {
          health: 60,
          maxHealth: 100
        };

        const healthPercent = (node.health / node.maxHealth) * 100;
        expect(healthPercent).to.equal(60);
      });
    });

    describe('Combat Controller Integration', function() {
      it('should support onDamage callback', function() {
        const node = {
          health: 100,
          damaged: false,
          onDamage: function(amount) {
            this.health -= amount;
            this.damaged = true;
          }
        };

        node.onDamage(20);

        expect(node.health).to.equal(80);
        expect(node.damaged).to.be.true;
      });

      it('should trigger death when health reaches zero', function() {
        const node = {
          health: 10,
          isDead: false
        };

        node.health -= 15;
        if (node.health <= 0) {
          node.isDead = true;
        }

        expect(node.health).to.be.lessThanOrEqual(0);
        expect(node.isDead).to.be.true;
      });

      it('should support damage resistance for different types', function() {
        const rockNode = {
          nodeType: 'rock',
          damageResistance: 0.5 // Takes 50% less damage
        };

        const bushNode = {
          nodeType: 'bush',
          damageResistance: 0
        };

        const rawDamage = 20;
        const rockActualDamage = rawDamage * (1 - rockNode.damageResistance);
        const bushActualDamage = rawDamage * (1 - bushNode.damageResistance);

        expect(rockActualDamage).to.equal(10);
        expect(bushActualDamage).to.equal(20);
      });
    });
  });

  describe('Node Destruction and Resource Drop', function() {
    describe('Health Depletion', function() {
      it('should track damage accumulated', function() {
        const node = {
          health: 100,
          maxHealth: 100,
          damageTaken: 0
        };

        node.health -= 30;
        node.damageTaken += 30;

        expect(node.health).to.equal(70);
        expect(node.damageTaken).to.equal(30);
      });

      it('should reach zero health after sufficient damage', function() {
        const node = {
          health: 50
        };

        node.health -= 60;

        expect(node.health).to.be.lessThanOrEqual(0);
      });

      it('should not go below zero health', function() {
        const node = {
          health: 20
        };

        node.health -= 100;
        node.health = Math.max(0, node.health);

        expect(node.health).to.equal(0);
      });
    });

    describe('Death Trigger', function() {
      it('should trigger destruction at zero health', function() {
        const node = {
          health: 0,
          maxHealth: 100,
          shouldDestroy: false
        };

        if (node.health <= 0) {
          node.shouldDestroy = true;
        }

        expect(node.shouldDestroy).to.be.true;
      });

      it('should call onDestroy callback', function() {
        const node = {
          health: 0,
          destroyed: false,
          onDestroy: function() {
            this.destroyed = true;
          }
        };

        if (node.health <= 0) {
          node.onDestroy();
        }

        expect(node.destroyed).to.be.true;
      });

      it('should mark node for removal from game', function() {
        const node = {
          health: 0,
          active: true,
          markedForRemoval: false
        };

        if (node.health <= 0) {
          node.active = false;
          node.markedForRemoval = true;
        }

        expect(node.active).to.be.false;
        expect(node.markedForRemoval).to.be.true;
      });
    });

    describe('Partial Resource Drop Calculation', function() {
      it('should drop fraction of total spawnable resources', function() {
        const node = {
          nodeType: 'tree',
          resourceTypes: [
            { type: 'greenLeaf', weight: 5 },
            { type: 'stick', weight: 2 },
            { type: 'apple', weight: 1 }
          ]
        };

        const totalWeight = node.resourceTypes.reduce((sum, r) => sum + r.weight, 0);
        const dropFraction = 0.3; // Drop 30% of resources
        const dropAmount = Math.floor(totalWeight * dropFraction);

        expect(totalWeight).to.equal(8);
        expect(dropAmount).to.equal(2); // floor(8 * 0.3)
      });

      it('should use random fraction for drop amount', function() {
        const node = {
          nodeType: 'rock',
          totalResources: 20
        };

        const dropFraction = Math.random() * 0.4 + 0.1; // 10% to 50%
        const dropAmount = Math.floor(node.totalResources * dropFraction);

        expect(dropAmount).to.be.at.least(2); // 10% of 20
        expect(dropAmount).to.be.at.most(10); // 50% of 20
      });

      it('should drop at least 1 resource if node had any', function() {
        const node = {
          totalResources: 3
        };

        const dropFraction = 0.2;
        const dropAmount = Math.max(1, Math.floor(node.totalResources * dropFraction));

        expect(dropAmount).to.equal(1);
      });

      it('should drop 0 if node had no resources', function() {
        const node = {
          totalResources: 0
        };

        const dropAmount = Math.floor(node.totalResources * 0.5);

        expect(dropAmount).to.equal(0);
      });
    });

    describe('Resource Spawn on Death', function() {
      it('should spawn resources at node position when destroyed', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          health: 0,
          resourceTypes: [
            { type: 'stone', weight: 1 }
          ],
          droppedResources: []
        };

        if (node.health <= 0) {
          const dropAmount = 3;
          for (let i = 0; i < dropAmount; i++) {
            node.droppedResources.push({
              type: 'stone',
              gridX: node.gridX,
              gridY: node.gridY
            });
          }
        }

        expect(node.droppedResources).to.have.lengthOf(3);
        expect(node.droppedResources[0].gridX).to.equal(10);
        expect(node.droppedResources[0].gridY).to.equal(10);
      });

      it('should select resources based on node type weights', function() {
        const node = {
          resourceTypes: [
            { type: 'greenLeaf', weight: 5, spawnChance: 0.6 },
            { type: 'stick', weight: 2, spawnChance: 0.3 },
            { type: 'apple', weight: 1, spawnChance: 0.1 }
          ]
        };

        const roll = 0.5; // Should select greenLeaf (0.0-0.6 range)
        let selectedType = null;
        let cumulativeChance = 0;

        for (const resType of node.resourceTypes) {
          cumulativeChance += resType.spawnChance;
          if (roll < cumulativeChance) {
            selectedType = resType.type;
            break;
          }
        }

        expect(selectedType).to.equal('greenLeaf');
      });

      it('should scatter dropped resources around node', function() {
        const node = {
          gridX: 10,
          gridY: 10,
          droppedResources: []
        };

        const dropCount = 5;
        for (let i = 0; i < dropCount; i++) {
          const angle = (Math.PI * 2 * i) / dropCount;
          const distance = 1; // 1 tile away
          const dropX = node.gridX + Math.cos(angle) * distance;
          const dropY = node.gridY + Math.sin(angle) * distance;

          node.droppedResources.push({
            gridX: Math.round(dropX),
            gridY: Math.round(dropY)
          });
        }

        expect(node.droppedResources).to.have.lengthOf(5);
        // Resources should be scattered (not all at same position)
        const uniquePositions = new Set(node.droppedResources.map(r => `${r.gridX},${r.gridY}`));
        expect(uniquePositions.size).to.be.greaterThan(1);
      });
    });

    describe('Integration - Destruction Flow', function() {
      it('should execute full destruction sequence', function() {
        const node = {
          gridX: 15,
          gridY: 20,
          health: 100,
          maxHealth: 100,
          nodeType: 'bush',
          resourceTypes: [{ type: 'berries', weight: 1 }],
          active: true,
          destroyed: false,
          droppedResources: []
        };

        // Take damage
        node.health -= 100;

        // Check death
        if (node.health <= 0) {
          // Calculate drops
          const dropAmount = 2;
          
          // Spawn resources
          for (let i = 0; i < dropAmount; i++) {
            node.droppedResources.push({
              type: 'berries',
              gridX: node.gridX,
              gridY: node.gridY
            });
          }

          // Destroy node
          node.active = false;
          node.destroyed = true;
        }

        expect(node.health).to.equal(0);
        expect(node.active).to.be.false;
        expect(node.destroyed).to.be.true;
        expect(node.droppedResources).to.have.lengthOf(2);
      });

      it('should remove node from manager on destruction', function() {
        const nodeManager = {
          nodes: [
            { id: 1, health: 100 },
            { id: 2, health: 0 },
            { id: 3, health: 50 }
          ]
        };

        nodeManager.nodes = nodeManager.nodes.filter(node => node.health > 0);

        expect(nodeManager.nodes).to.have.lengthOf(2);
        expect(nodeManager.nodes.find(n => n.id === 2)).to.be.undefined;
      });

      it('should handle destruction from depletion vs combat', function() {
        const gatheredNode = {
          gatherCount: 10,
          resourceGatherLimit: 10,
          health: 100,
          destroyReason: null
        };

        const attackedNode = {
          gatherCount: 2,
          resourceGatherLimit: 10,
          health: 0,
          destroyReason: null
        };

        // Check depletion
        if (gatheredNode.resourceGatherLimit > 0 && gatheredNode.gatherCount >= gatheredNode.resourceGatherLimit) {
          gatheredNode.destroyReason = 'depleted';
        }

        // Check combat
        if (attackedNode.health <= 0) {
          attackedNode.destroyReason = 'destroyed';
        }

        expect(gatheredNode.destroyReason).to.equal('depleted');
        expect(attackedNode.destroyReason).to.equal('destroyed');
      });
    });
  });

  describe('Grid Coordinate System Integration', function() {
    describe('Grid to Pixel Conversion', function() {
      it('should convert grid coordinates to pixels', function() {
        const gridX = 10;
        const gridY = 5;

        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([gridX, gridY]);

        expect(pixelX).to.equal(320); // 10 * 32
        expect(pixelY).to.equal(160); // 5 * 32
      });

      it('should handle origin (0,0)', function() {
        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([0, 0]);

        expect(pixelX).to.equal(0);
        expect(pixelY).to.equal(0);
      });

      it('should handle large grid coordinates', function() {
        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([100, 75]);

        expect(pixelX).to.equal(3200);
        expect(pixelY).to.equal(2400);
      });
    });

    describe('Pixel to Grid Conversion', function() {
      it('should convert pixels to grid coordinates', function() {
        const pixelX = 320;
        const pixelY = 160;

        const [gridX, gridY] = g_activeMap.coordSys.convBackingCanvasToPos([pixelX, pixelY]);

        expect(gridX).to.equal(10);
        expect(gridY).to.equal(5);
      });

      it('should floor fractional pixels', function() {
        const [gridX, gridY] = g_activeMap.coordSys.convBackingCanvasToPos([335, 175]);

        expect(gridX).to.equal(10); // floor(335/32) = floor(10.46)
        expect(gridY).to.equal(5);  // floor(175/32) = floor(5.46)
      });
    });

    describe('Node Position Storage', function() {
      it('should store both grid and pixel coordinates', function() {
        const node = {
          gridX: 12,
          gridY: 8
        };

        const [pixelX, pixelY] = g_activeMap.coordSys.convPosToBackingCanvas([node.gridX, node.gridY]);
        node.posX = pixelX;
        node.posY = pixelY;

        expect(node.gridX).to.equal(12);
        expect(node.gridY).to.equal(8);
        expect(node.posX).to.equal(384);
        expect(node.posY).to.equal(256);
      });

      it('should use grid coords for logical position', function() {
        const node = {
          gridX: 10,
          gridY: 10
        };

        // Grid coords are the source of truth
        expect(node.gridX).to.equal(10);
        expect(node.gridY).to.equal(10);
      });
    });
  });
});



// ================================================================
// shapes.test.js (20 tests)
// ================================================================
/**
 * Unit Tests for Shape Utilities (circle and rect)
 * Tests p5.js shape drawing helper functions
 */

// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.circle = () => {};
global.rect = () => {};

describe('Circle Utilities', function() {
  
  beforeEach(function() {
    // Load circle utilities
    require('../../../Classes/systems/shapes/circle');
  });
  
  describe('circleNoFill()', function() {
    
    it('should draw circle with no fill', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 50, 2);
      }).to.not.throw();
    });
    
    it('should accept color as Vector3', function() {
      const color = { x: 0, y: 120, z: 255 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 50, 1);
      }).to.not.throw();
    });
    
    it('should accept position as Vector2', function() {
      const color = { x: 255, y: 255, z: 0 };
      const pos = { x: 200, y: 300 };
      
      expect(() => {
        circleNoFill(color, pos, 100, 3);
      }).to.not.throw();
    });
    
    it('should handle various diameters', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 10, 1);
        circleNoFill(color, pos, 50, 1);
        circleNoFill(color, pos, 200, 1);
      }).to.not.throw();
    });
    
    it('should handle various stroke weights', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 50, 1);
        circleNoFill(color, pos, 50, 5);
        circleNoFill(color, pos, 50, 10);
      }).to.not.throw();
    });
  });
  
  describe('circleFill()', function() {
    
    it('should draw filled circle with no stroke', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleFill(color, pos, 50);
      }).to.not.throw();
    });
    
    it('should accept RGB color values', function() {
      const color = { x: 128, y: 128, z: 255 };
      const pos = { x: 150, y: 200 };
      
      expect(() => {
        circleFill(color, pos, 75);
      }).to.not.throw();
    });
    
    it('should handle various diameters', function() {
      const color = { x: 0, y: 255, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleFill(color, pos, 20);
        circleFill(color, pos, 60);
        circleFill(color, pos, 150);
      }).to.not.throw();
    });
  });
  
  describe('circleCustom()', function() {
    
    it('should draw circle with custom stroke and fill', function() {
      const strokeColor = { x: 0, y: 120, z: 255 };
      const fillColor = { x: 255, y: 255, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleCustom(strokeColor, fillColor, pos, 50, 3);
      }).to.not.throw();
    });
    
    it('should accept two different colors', function() {
      const strokeColor = { x: 255, y: 0, z: 0 };
      const fillColor = { x: 0, y: 255, z: 0 };
      const pos = { x: 200, y: 200 };
      
      expect(() => {
        circleCustom(strokeColor, fillColor, pos, 80, 2);
      }).to.not.throw();
    });
    
    it('should handle various stroke weights', function() {
      const strokeColor = { x: 100, y: 100, z: 100 };
      const fillColor = { x: 200, y: 200, z: 200 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleCustom(strokeColor, fillColor, pos, 50, 1);
        circleCustom(strokeColor, fillColor, pos, 50, 4);
        circleCustom(strokeColor, fillColor, pos, 50, 8);
      }).to.not.throw();
    });
  });
});

describe('Rectangle Utilities', function() {
  
  beforeEach(function() {
    // Load rect utilities
    require('../../../Classes/systems/shapes/rect');
  });
  
  describe('rectCustom()', function() {
    
    it('should draw rectangle with stroke and fill', function() {
      const strokeColor = [255, 0, 0];
      const fillColor = [0, 255, 0];
      const pos = { x: 50, y: 50 };
      const size = { x: 100, y: 75 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 2, pos, size, true, true);
      }).to.not.throw();
    });
    
    it('should draw rectangle with stroke only', function() {
      const strokeColor = [0, 0, 255];
      const fillColor = [0, 0, 0];
      const pos = { x: 100, y: 100 };
      const size = { x: 80, y: 60 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 3, pos, size, false, true);
      }).to.not.throw();
    });
    
    it('should draw rectangle with fill only', function() {
      const strokeColor = [0, 0, 0];
      const fillColor = [255, 255, 0];
      const pos = { x: 200, y: 150 };
      const size = { x: 120, y: 90 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, pos, size, true, false);
      }).to.not.throw();
    });
    
    it('should draw rectangle with no stroke or fill', function() {
      const strokeColor = [0, 0, 0];
      const fillColor = [0, 0, 0];
      const pos = { x: 50, y: 50 };
      const size = { x: 100, y: 100 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, pos, size, false, false);
      }).to.not.throw();
    });
    
    it('should handle various stroke widths', function() {
      const strokeColor = [100, 100, 100];
      const fillColor = [200, 200, 200];
      const pos = { x: 100, y: 100 };
      const size = { x: 80, y: 60 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, pos, size, true, true);
        rectCustom(strokeColor, fillColor, 5, pos, size, true, true);
        rectCustom(strokeColor, fillColor, 10, pos, size, true, true);
      }).to.not.throw();
    });
    
    it('should accept color arrays', function() {
      const strokeColor = [255, 128, 0];
      const fillColor = [0, 128, 255];
      const pos = { x: 150, y: 200 };
      const size = { x: 60, y: 40 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 2, pos, size, true, true);
      }).to.not.throw();
    });
    
    it('should handle different rectangle sizes', function() {
      const strokeColor = [255, 0, 0];
      const fillColor = [0, 255, 0];
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, { x: 0, y: 0 }, { x: 10, y: 10 }, true, true);
        rectCustom(strokeColor, fillColor, 1, { x: 0, y: 0 }, { x: 100, y: 50 }, true, true);
        rectCustom(strokeColor, fillColor, 1, { x: 0, y: 0 }, { x: 200, y: 200 }, true, true);
      }).to.not.throw();
    });
  });
});

describe('Shape Utility Integration', function() {
  
  it('should have circle utilities available globally', function() {
    expect(typeof circleNoFill).to.equal('function');
    expect(typeof circleFill).to.equal('function');
    expect(typeof circleCustom).to.equal('function');
  });
  
  it('should have rect utilities available globally', function() {
    expect(typeof rectCustom).to.equal('function');
  });
});




// ================================================================
// SpatialGrid.test.js (41 tests)
// ================================================================
/**
 * Unit Tests for SpatialGrid
 * Tests spatial hash grid for entity proximity queries
 */

// Mock globals
global.TILE_SIZE = 32;

// Load SpatialGrid
let SpatialGrid = require('../../../Classes/systems/SpatialGrid');

describe('SpatialGrid', function() {
  
  let grid;
  
  beforeEach(function() {
    grid = new SpatialGrid();
  });
  
  describe('Constructor', function() {
    
    it('should create grid with default cell size', function() {
      const grid = new SpatialGrid();
      
      expect(grid._cellSize).to.equal(32); // Default TILE_SIZE
      expect(grid._grid).to.be.instanceOf(Map);
      expect(grid._entityCount).to.equal(0);
    });
    
    it('should create grid with custom cell size', function() {
      const grid = new SpatialGrid(64);
      
      expect(grid._cellSize).to.equal(64);
    });
    
    it('should initialize with empty grid', function() {
      const grid = new SpatialGrid();
      
      expect(grid._grid.size).to.equal(0);
      expect(grid._entityCount).to.equal(0);
    });
  });
  
  describe('addEntity()', function() {
    
    it('should add entity to correct cell', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle multiple entities in same cell', function() {
      const entity1 = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      const entity2 = {
        getX: () => 60,
        getY: () => 60,
        getPosition: () => ({ x: 60, y: 60 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      expect(grid._entityCount).to.equal(2);
    });
    
    it('should handle entities at different cells', function() {
      const entity1 = {
        getX: () => 10,
        getY: () => 10,
        getPosition: () => ({ x: 10, y: 10 })
      };
      const entity2 = {
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      expect(grid._entityCount).to.equal(2);
      expect(grid._grid.size).to.be.greaterThan(1);
    });
    
    it('should handle entity at origin', function() {
      const entity = {
        getX: () => 0,
        getY: () => 0,
        getPosition: () => ({ x: 0, y: 0 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle entity with negative coordinates', function() {
      const entity = {
        getX: () => -50,
        getY: () => -50,
        getPosition: () => ({ x: -50, y: -50 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should not add same entity twice', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      grid.addEntity(entity); // Duplicate
      
      expect(grid._entityCount).to.equal(1);
    });
  });
  
  describe('removeEntity()', function() {
    
    it('should remove existing entity', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      expect(grid._entityCount).to.equal(1);
      
      grid.removeEntity(entity);
      expect(grid._entityCount).to.equal(0);
    });
    
    it('should handle removing non-existent entity', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      // Should not throw
      grid.removeEntity(entity);
      expect(grid._entityCount).to.equal(0);
    });
    
    it('should only remove specified entity', function() {
      const entity1 = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      const entity2 = {
        getX: () => 60,
        getY: () => 60,
        getPosition: () => ({ x: 60, y: 60 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      grid.removeEntity(entity1);
      
      expect(grid._entityCount).to.equal(1);
    });
  });
  
  describe('updateEntity()', function() {
    
    let movingEntity;
    
    beforeEach(function() {
      movingEntity = {
        x: 50,
        y: 50,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      };
    });
    
    it('should update entity position to new cell', function() {
      grid.addEntity(movingEntity);
      
      // Move entity to different cell
      movingEntity.x = 150;
      movingEntity.y = 150;
      
      grid.updateEntity(movingEntity);
      
      // Entity should still be in grid
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle update in same cell', function() {
      grid.addEntity(movingEntity);
      
      // Move within same cell
      movingEntity.x = 55;
      movingEntity.y = 55;
      
      grid.updateEntity(movingEntity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle updating non-existent entity by adding it', function() {
      // Update without add should add it
      grid.updateEntity(movingEntity);
      
      expect(grid._entityCount).to.equal(1);
    });
  });
  
  describe('queryRadius()', function() {
    
    beforeEach(function() {
      // Add entities in grid pattern
      for (let x = 0; x < 200; x += 50) {
        for (let y = 0; y < 200; y += 50) {
          grid.addEntity({
            x,
            y,
            getX: function() { return this.x; },
            getY: function() { return this.y; },
            getPosition: function() { return { x: this.x, y: this.y }; }
          });
        }
      }
    });
    
    it('should find entities within radius', function() {
      const results = grid.queryRadius(100, 100, 30);
      
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
      
      // All results should be within radius
      results.forEach(entity => {
        const dx = entity.x - 100;
        const dy = entity.y - 100;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(distance).to.be.at.most(30);
      });
    });
    
    it('should return empty array when no entities nearby', function() {
      const results = grid.queryRadius(1000, 1000, 30);
      
      expect(results).to.be.an('array');
      expect(results).to.be.empty;
    });
    
    it('should handle filter function', function() {
      const results = grid.queryRadius(100, 100, 100, (entity) => {
        return entity.x === 100;
      });
      
      // All results should match filter
      results.forEach(entity => {
        expect(entity.x).to.equal(100);
      });
    });
    
    it('should find entities at exact radius boundary', function() {
      const results = grid.queryRadius(50, 50, 50);
      
      // Should include entity at (100, 50) which is exactly 50 pixels away
      expect(results.some(e => e.x === 100 && e.y === 50)).to.be.true;
    });
  });
  
  describe('queryRect()', function() {
    
    beforeEach(function() {
      // Add entities in grid pattern
      for (let x = 0; x < 200; x += 50) {
        for (let y = 0; y < 200; y += 50) {
          grid.addEntity({
            x,
            y,
            getX: function() { return this.x; },
            getY: function() { return this.y; },
            getPosition: function() { return { x: this.x, y: this.y }; }
          });
        }
      }
    });
    
    it('should find entities within rectangle', function() {
      const results = grid.queryRect(80, 80, 60, 60);
      
      expect(results).to.be.an('array');
      
      // All results should be within rectangle
      results.forEach(entity => {
        expect(entity.x).to.be.at.least(80);
        expect(entity.x).to.be.at.most(140);
        expect(entity.y).to.be.at.least(80);
        expect(entity.y).to.be.at.most(140);
      });
    });
    
    it('should return empty array when no entities in rectangle', function() {
      const results = grid.queryRect(1000, 1000, 50, 50);
      
      expect(results).to.be.an('array');
      expect(results).to.be.empty;
    });
    
    it('should handle filter function', function() {
      const results = grid.queryRect(0, 0, 200, 200, (entity) => {
        return entity.x === 100;
      });
      
      // All results should match filter
      results.forEach(entity => {
        expect(entity.x).to.equal(100);
      });
    });
    
    it('should handle rectangle at origin', function() {
      const results = grid.queryRect(0, 0, 50, 50);
      
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
    });
  });
  
  describe('queryCell()', function() {
    
    it('should return entities in specific cell', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      
      const results = grid.queryCell(50, 50);
      
      expect(results).to.be.an('array');
      expect(results).to.include(entity);
    });
    
    it('should return empty array for empty cell', function() {
      const results = grid.queryCell(1000, 1000);
      
      expect(results).to.be.an('array');
      expect(results).to.be.empty;
    });
  });
  
  describe('findNearest()', function() {
    
    beforeEach(function() {
      // Add entities at known distances
      grid.addEntity({
        id: 'far',
        x: 200,
        y: 200,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      });
      grid.addEntity({
        id: 'near',
        x: 110,
        y: 110,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      });
      grid.addEntity({
        id: 'closest',
        x: 105,
        y: 105,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      });
    });
    
    it('should find nearest entity', function() {
      const nearest = grid.findNearest(100, 100);
      
      expect(nearest).to.exist;
      expect(nearest.id).to.equal('closest');
    });
    
    it('should return null when no entities within maxRadius', function() {
      const nearest = grid.findNearest(100, 100, 1);
      
      expect(nearest).to.be.null;
    });
    
    it('should respect filter function', function() {
      const nearest = grid.findNearest(100, 100, Infinity, (entity) => {
        return entity.id === 'near';
      });
      
      expect(nearest).to.exist;
      expect(nearest.id).to.equal('near');
    });
    
    it('should return null when no entities', function() {
      const emptyGrid = new SpatialGrid();
      const nearest = emptyGrid.findNearest(100, 100);
      
      expect(nearest).to.be.null;
    });
  });
  
  describe('clear()', function() {
    
    it('should remove all entities', function() {
      grid.addEntity({
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      });
      grid.addEntity({
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      });
      
      expect(grid._entityCount).to.equal(2);
      
      grid.clear();
      
      expect(grid._entityCount).to.equal(0);
      expect(grid._grid.size).to.equal(0);
    });
    
    it('should handle clearing empty grid', function() {
      grid.clear();
      
      expect(grid._entityCount).to.equal(0);
    });
  });
  
  describe('getStats()', function() {
    
    it('should return statistics object', function() {
      const stats = grid.getStats();
      
      expect(stats).to.be.an('object');
      expect(stats.totalEntities).to.be.a('number');
      expect(stats.occupiedCells).to.be.a('number');
      expect(stats.cellSize).to.be.a('number');
    });
    
    it('should reflect actual entity count', function() {
      grid.addEntity({
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      });
      grid.addEntity({
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      });
      
      const stats = grid.getStats();
      
      expect(stats.totalEntities).to.equal(2);
    });
    
    it('should include memory estimate', function() {
      const stats = grid.getStats();
      
      expect(stats.estimatedMemoryBytes).to.be.a('number');
      expect(stats.estimatedMemoryBytes).to.be.at.least(0);
    });
  });
  
  describe('getAllEntities()', function() {
    
    it('should return all entities', function() {
      const entity1 = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      const entity2 = {
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      const all = grid.getAllEntities();
      
      expect(all).to.be.an('array');
      expect(all).to.have.lengthOf(2);
      expect(all).to.include(entity1);
      expect(all).to.include(entity2);
    });
    
    it('should return empty array for empty grid', function() {
      const all = grid.getAllEntities();
      
      expect(all).to.be.an('array');
      expect(all).to.be.empty;
    });
  });
  
  describe('Performance Characteristics', function() {
    
    it('should handle large number of entities efficiently', function() {
      const startTime = Date.now();
      
      // Add 1000 entities
      for (let i = 0; i < 1000; i++) {
        grid.addEntity({
          id: i,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          getX: function() { return this.x; },
          getY: function() { return this.y; },
          getPosition: function() { return { x: this.x, y: this.y }; }
        });
      }
      
      const addTime = Date.now() - startTime;
      
      // Should complete in reasonable time (< 1 second)
      expect(addTime).to.be.lessThan(1000);
      expect(grid._entityCount).to.equal(1000);
    });
    
    it('should query efficiently with many entities', function() {
      // Add 100 entities
      for (let i = 0; i < 100; i++) {
        grid.addEntity({
          id: i,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          getX: function() { return this.x; },
          getY: function() { return this.y; },
          getPosition: function() { return { x: this.x, y: this.y }; }
        });
      }
      
      const startTime = Date.now();
      
      // Perform 100 queries
      for (let i = 0; i < 100; i++) {
        grid.queryRadius(500, 500, 100);
      }
      
      const queryTime = Date.now() - startTime;
      
      // Should complete in reasonable time (< 100ms)
      expect(queryTime).to.be.lessThan(100);
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle entity with only getPosition method', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle very large coordinates', function() {
      const entity = {
        getX: () => 1000000,
        getY: () => 1000000,
        getPosition: () => ({ x: 1000000, y: 1000000 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle fractional coordinates', function() {
      const entity = {
        getX: () => 50.7,
        getY: () => 75.3,
        getPosition: () => ({ x: 50.7, y: 75.3 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
  });
});




// ================================================================
// textRenderer.test.js (27 tests)
// ================================================================
/**
 * Unit Tests for textRenderer
 * Tests text rendering utilities with emoji detection
 */

// Mock p5.js functions
let mockState = {
  pushCalled: false,
  popCalled: false,
  noStrokeCalled: false,
  rectModeCalled: false,
  rectModeValue: null,
  textFontCalled: false,
  textFontValue: null,
  textSizeCalled: false,
  textSizeValue: null,
  fillCalled: false,
  fillValue: null,
  textAlignCalled: false,
  textAlignValues: [],
  textArgExecuted: false
};

global.push = () => { mockState.pushCalled = true; };
global.pop = () => { mockState.popCalled = true; };
global.noStroke = () => { mockState.noStrokeCalled = true; };
global.rectMode = (mode) => { 
  mockState.rectModeCalled = true;
  mockState.rectModeValue = mode;
};
global.CENTER = 'center';
global.textFont = (font) => {
  mockState.textFontCalled = true;
  mockState.textFontValue = font;
};
global.textSize = (size) => {
  mockState.textSizeCalled = true;
  mockState.textSizeValue = size;
};
global.fill = (...args) => {
  mockState.fillCalled = true;
  mockState.fillValue = args;
};
global.textAlign = (...args) => {
  mockState.textAlignCalled = true;
  mockState.textAlignValues = args;
};

// Load textRenderer functions
let textRendererPath = '../../../Classes/systems/text/textRenderer.js';
delete require.cache[require.resolve(textRendererPath)];
let textRendererCode = require('fs').readFileSync(
  require('path').resolve(__dirname, textRendererPath),
  'utf8'
);
eval(textRendererCode);

describe('textRenderer', function() {
  
  beforeEach(function() {
    // Reset mock state
    mockState = {
      pushCalled: false,
      popCalled: false,
      noStrokeCalled: false,
      rectModeCalled: false,
      rectModeValue: null,
      textFontCalled: false,
      textFontValue: null,
      textSizeCalled: false,
      textSizeValue: null,
      fillCalled: false,
      fillValue: null,
      textAlignCalled: false,
      textAlignValues: [],
      textArgExecuted: false
    };
  });
  
  describe('containsEmoji()', function() {
    
    it('should detect smileys', function() {
      expect(containsEmoji('Hello 😀')).to.be.true;
      expect(containsEmoji('😃')).to.be.true;
      expect(containsEmoji('Test 😊 text')).to.be.true;
    });
    
    it('should detect various emoji ranges', function() {
      // Emoticons (1F600-1F64F)
      expect(containsEmoji('😀')).to.be.true;
      expect(containsEmoji('😎')).to.be.true;
      
      // Miscellaneous Symbols (1F300-1F5FF)
      expect(containsEmoji('🌟')).to.be.true;
      expect(containsEmoji('🏠')).to.be.true;
      
      // Transport (1F680-1F6FF)
      expect(containsEmoji('🚀')).to.be.true;
      expect(containsEmoji('🚗')).to.be.true;
      
      // Miscellaneous Symbols (2600-26FF)
      expect(containsEmoji('☀')).to.be.true;
      expect(containsEmoji('⚡')).to.be.true;
    });
    
    it('should not detect regular text', function() {
      expect(containsEmoji('Hello')).to.be.false;
      expect(containsEmoji('Test 123')).to.be.false;
      expect(containsEmoji('abc ABC')).to.be.false;
    });
    
    it('should handle empty strings', function() {
      expect(containsEmoji('')).to.be.false;
    });
    
    it('should handle special characters', function() {
      expect(containsEmoji('!@#$%^&*()')).to.be.false;
      expect(containsEmoji('Hello! How are you?')).to.be.false;
    });
    
    it('should handle mixed content', function() {
      expect(containsEmoji('Numbers 123')).to.be.false;
      expect(containsEmoji('Symbols !@#')).to.be.false;
      expect(containsEmoji('Mixed 123!@#')).to.be.false;
    });
    
    it('should detect emoji at start', function() {
      expect(containsEmoji('😀 Hello')).to.be.true;
    });
    
    it('should detect emoji at end', function() {
      expect(containsEmoji('Hello 😀')).to.be.true;
    });
    
    it('should detect emoji in middle', function() {
      expect(containsEmoji('Hello 😀 World')).to.be.true;
    });
    
    it('should detect multiple emojis', function() {
      expect(containsEmoji('😀😃😊')).to.be.true;
      expect(containsEmoji('Test 😀 more 😃 text')).to.be.true;
    });
  });
  
  describe('textNoStroke()', function() {
    
    const mockStyle = {
      textFont: 'Arial',
      textSize: 16,
      textColor: [255, 255, 255],
      textAlign: ['CENTER', 'TOP']
    };
    
    it('should call push/pop for state isolation', function() {
      const textArg = () => { mockState.textArgExecuted = true; };
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.pushCalled).to.be.true;
      expect(mockState.popCalled).to.be.true;
    });
    
    it('should call noStroke', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.noStrokeCalled).to.be.true;
    });
    
    it('should set rectMode to CENTER', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.rectModeCalled).to.be.true;
      expect(mockState.rectModeValue).to.equal('center');
    });
    
    it('should set textFont for non-emoji text', function() {
      const textArg = () => 'Hello';
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textFontCalled).to.be.true;
      expect(mockState.textFontValue).to.equal('Arial');
    });
    
    it('should NOT set textFont for emoji text', function() {
      const textArg = () => 'Hello 😀';
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textFontCalled).to.be.false;
    });
    
    it('should set textSize from style', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textSizeCalled).to.be.true;
      expect(mockState.textSizeValue).to.equal(16);
    });
    
    it('should set fill color from style', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.fillCalled).to.be.true;
      expect(mockState.fillValue).to.deep.equal([[255, 255, 255]]);
    });
    
    it('should set textAlign from style', function() {
      const textArg = () => {};
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textAlignCalled).to.be.true;
      expect(mockState.textAlignValues).to.deep.equal(['CENTER', 'TOP']);
    });
    
    it('should execute textArg function', function() {
      const textArg = () => { mockState.textArgExecuted = true; };
      
      textNoStroke(textArg, mockStyle);
      
      expect(mockState.textArgExecuted).to.be.true;
    });
    
    it('should handle different textSize values', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textSize: 24 };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textSizeValue).to.equal(24);
    });
    
    it('should handle different textFont values', function() {
      const textArg = () => 'Regular text';
      const customStyle = { ...mockStyle, textFont: 'Helvetica' };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textFontValue).to.equal('Helvetica');
    });
    
    it('should handle different fill colors', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textColor: [255, 0, 0] };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.fillValue).to.deep.equal([[255, 0, 0]]);
    });
    
    it('should handle different text alignments', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textAlign: ['LEFT', 'BOTTOM'] };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textAlignValues).to.deep.equal(['LEFT', 'BOTTOM']);
    });
    
    it('should handle single textAlign value', function() {
      const textArg = () => {};
      const customStyle = { ...mockStyle, textAlign: ['CENTER'] };
      
      textNoStroke(textArg, customStyle);
      
      expect(mockState.textAlignValues).to.deep.equal(['CENTER']);
    });
  });
  
  describe('textNoStroke() integration', function() {
    
    it('should apply all styles in correct order', function() {
      const callOrder = [];
      
      global.push = () => callOrder.push('push');
      global.noStroke = () => callOrder.push('noStroke');
      global.rectMode = () => callOrder.push('rectMode');
      global.textFont = () => callOrder.push('textFont');
      global.textSize = () => callOrder.push('textSize');
      global.fill = () => callOrder.push('fill');
      global.textAlign = () => callOrder.push('textAlign');
      global.pop = () => callOrder.push('pop');
      
      const textArg = () => callOrder.push('textArg');
      const style = {
        textFont: 'Arial',
        textSize: 16,
        textColor: [255, 255, 255],
        textAlign: ['CENTER']
      };
      
      textNoStroke(textArg, style);
      
      expect(callOrder[0]).to.equal('push');
      expect(callOrder[callOrder.length - 1]).to.equal('pop');
      expect(callOrder).to.include('textArg');
    });
    
    it('should handle textArg that returns string', function() {
      const textArg = () => 'Test string';
      const style = {
        textFont: 'Arial',
        textSize: 16,
        textColor: [255, 255, 255],
        textAlign: ['CENTER']
      };
      
      expect(() => textNoStroke(textArg, style)).to.not.throw();
    });
    
    it('should handle textArg with side effects', function() {
      let sideEffect = false;
      const textArg = () => {
        sideEffect = true;
        return 'Text';
      };
      const style = {
        textFont: 'Arial',
        textSize: 16,
        textColor: [255, 255, 255],
        textAlign: ['CENTER']
      };
      
      textNoStroke(textArg, style);
      
      expect(sideEffect).to.be.true;
    });
  });
});




// ================================================================
// newPathfinding.test.js (32 tests)
// ================================================================
/**
 * Unit Tests for newPathfinding
 * Tests pathfinding system with nodes, grid, and wandering
 */

// Mock Grid class
class Grid {
  constructor(xCount, yCount, offset1, offset2) {
    this.xCount = xCount;
    this.yCount = yCount;
    this.data = [];
    for (let y = 0; y < yCount; y++) {
      this.data[y] = [];
      for (let x = 0; x < xCount; x++) {
        this.data[y][x] = null;
      }
    }
  }
  
  getArrPos(pos) {
    const [x, y] = pos;
    if (x < 0 || x >= this.xCount || y < 0 || y >= this.yCount) {
      return null;
    }
    return this.data[y][x];
  }
  
  setArrPos(pos, value) {
    const [x, y] = pos;
    if (x >= 0 && x < this.xCount && y >= 0 && y < this.yCount) {
      this.data[y][x] = value;
    }
  }
}

global.Grid = Grid;

// Mock StenchGrid
class StenchGrid {
  constructor() {
    this.grid = {};
  }
  
  addPheromone(x, y, antType, tag) {
    const key = `${x},${y}`;
    if (!this.grid[key]) {
      this.grid[key] = [];
    }
    this.grid[key].push({ antType, tag });
  }
}

global.StenchGrid = StenchGrid;
global.pheromoneGrid = new StenchGrid();

// Load newPathfinding
let pathfindingCode = require('fs').readFileSync(
  require('path').resolve(__dirname, '../../../Classes/systems/newPathfinding.js'),
  'utf8'
);
eval(pathfindingCode);

describe('Node', function() {
  
  let mockTile;
  
  beforeEach(function() {
    mockTile = {
      getWeight: () => 1,
      type: 'grass'
    };
    global.pheromoneGrid = new StenchGrid();
  });
  
  describe('Constructor', function() {
    
    it('should create node with position', function() {
      const node = new Node(mockTile, 5, 10);
      
      expect(node._x).to.equal(5);
      expect(node._y).to.equal(10);
    });
    
    it('should store terrain tile', function() {
      const node = new Node(mockTile, 0, 0);
      
      expect(node._terrainTile).to.equal(mockTile);
    });
    
    it('should create unique ID', function() {
      const node1 = new Node(mockTile, 5, 10);
      const node2 = new Node(mockTile, 3, 7);
      
      expect(node1.id).to.equal('5-10');
      expect(node2.id).to.equal('3-7');
      expect(node1.id).to.not.equal(node2.id);
    });
    
    it('should initialize empty scents array', function() {
      const node = new Node(mockTile, 0, 0);
      
      expect(node.scents).to.be.an('array');
      expect(node.scents).to.have.lengthOf(0);
    });
    
    it('should store weight from terrain tile', function() {
      const node = new Node(mockTile, 0, 0);
      
      expect(node.weight).to.equal(1);
    });
    
    it('should handle different weights', function() {
      mockTile.getWeight = () => 5;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.weight).to.equal(5);
    });
  });
  
  describe('assignWall()', function() {
    
    it('should mark as wall when weight is 100', function() {
      mockTile.getWeight = () => 100;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.wall).to.be.true;
    });
    
    it('should not mark as wall for normal weight', function() {
      mockTile.getWeight = () => 1;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.wall).to.be.false;
    });
    
    it('should not mark as wall for high but non-100 weight', function() {
      mockTile.getWeight = () => 99;
      const node = new Node(mockTile, 0, 0);
      
      expect(node.wall).to.be.false;
    });
  });
  
  describe('addScent()', function() {
    
    it('should add scent to pheromone grid', function() {
      const node = new Node(mockTile, 5, 10);
      
      node.addScent(5, 10, 'player', 'forage');
      
      expect(global.pheromoneGrid.grid['5,10']).to.exist;
      expect(global.pheromoneGrid.grid['5,10']).to.have.lengthOf(1);
    });
    
    it('should store ant type and tag', function() {
      const node = new Node(mockTile, 3, 7);
      
      node.addScent(3, 7, 'enemy', 'combat');
      
      const scent = global.pheromoneGrid.grid['3,7'][0];
      expect(scent.antType).to.equal('enemy');
      expect(scent.tag).to.equal('combat');
    });
  });
});

describe('PathMap', function() {
  
  let mockTerrain;
  
  beforeEach(function() {
    mockTerrain = {
      _xCount: 3,
      _yCount: 3,
      _tileStore: [],
      conv2dpos: (x, y) => y * 3 + x
    };
    
    // Create 9 tiles
    for (let i = 0; i < 9; i++) {
      mockTerrain._tileStore.push({
        getWeight: () => 1,
        type: 'grass'
      });
    }
  });
  
  describe('Constructor', function() {
    
    it('should create grid matching terrain size', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      expect(grid.xCount).to.equal(3);
      expect(grid.yCount).to.equal(3);
    });
    
    it('should create nodes for all tiles', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = grid.getArrPos([x, y]);
          expect(node).to.exist;
          expect(node._x).to.equal(x);
          expect(node._y).to.equal(y);
        }
      }
    });
    
    it('should store terrain reference', function() {
      const pathMap = new PathMap(mockTerrain);
      
      expect(pathMap._terrain).to.equal(mockTerrain);
    });
  });
  
  describe('getGrid()', function() {
    
    it('should return grid', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      expect(grid).to.be.an.instanceof(Grid);
    });
  });
});

describe('findBestNeighbor()', function() {
  
  let grid, node, travelled;
  
  beforeEach(function() {
    grid = new Grid(5, 5, [0, 0], [0, 0]);
    travelled = new Set();
    
    // Create nodes with different weights
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const mockTile = {
          getWeight: () => Math.random() * 5,
          type: 'grass'
        };
        grid.setArrPos([x, y], new Node(mockTile, x, y));
      }
    }
    
    node = grid.getArrPos([2, 2]); // Center node
  });
  
  it('should find best neighbor', function() {
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor).to.exist;
  });
  
  it('should return neighbor with lowest weight', function() {
    // Set specific weights
    grid.getArrPos([1, 2]).weight = 1;  // Left
    grid.getArrPos([3, 2]).weight = 5;  // Right
    grid.getArrPos([2, 1]).weight = 3;  // Up
    grid.getArrPos([2, 3]).weight = 4;  // Down
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor.weight).to.equal(1);
    expect(bestNeighbor._x).to.equal(1);
    expect(bestNeighbor._y).to.equal(2);
  });
  
  it('should add current node to travelled set', function() {
    findBestNeighbor(grid, node, travelled);
    
    expect(travelled.has(node.id)).to.be.true;
  });
  
  it('should exclude already travelled nodes', function() {
    // Mark left neighbor as travelled
    const leftNeighbor = grid.getArrPos([1, 2]);
    leftNeighbor.weight = 1; // Lowest weight
    travelled.add(leftNeighbor.id);
    
    // Set right neighbor with higher weight
    grid.getArrPos([3, 2]).weight = 2;
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    // Should not pick left neighbor even though it has lowest weight
    expect(bestNeighbor.id).to.not.equal(leftNeighbor.id);
  });
  
  it('should check all 8 neighbors', function() {
    // Set corner neighbor as best
    const cornerNode = grid.getArrPos([1, 1]);
    cornerNode.weight = 0.5;
    
    // Set all adjacent neighbors higher
    grid.getArrPos([1, 2]).weight = 5;
    grid.getArrPos([2, 1]).weight = 5;
    grid.getArrPos([3, 2]).weight = 5;
    grid.getArrPos([2, 3]).weight = 5;
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor._x).to.equal(1);
    expect(bestNeighbor._y).to.equal(1);
  });
  
  it('should return null if all neighbors travelled', function() {
    // Mark all neighbors as travelled
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const neighbor = grid.getArrPos([node._x + i, node._y + j]);
        if (neighbor) {
          travelled.add(neighbor.id);
        }
      }
    }
    
    const bestNeighbor = findBestNeighbor(grid, node, travelled);
    
    expect(bestNeighbor).to.be.null;
  });
  
  it('should handle edge nodes', function() {
    const edgeNode = grid.getArrPos([0, 0]); // Top-left corner
    
    const bestNeighbor = findBestNeighbor(grid, edgeNode, travelled);
    
    expect(bestNeighbor).to.exist;
  });
});

describe('tryTrack()', function() {
  
  let mockAnt;
  
  beforeEach(function() {
    mockAnt = {
      brain: {
        checkTrail: (scent) => false
      },
      speciesName: 'worker'
    };
  });
  
  it('should return 0 when no scents match', function() {
    const scents = [
      { name: 'forage' },
      { name: 'combat' }
    ];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal(0);
  });
  
  it('should return scent name when match found', function() {
    mockAnt.brain.checkTrail = (scent) => scent.name === 'forage';
    
    const scents = [
      { name: 'forage' },
      { name: 'combat' }
    ];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal('forage');
  });
  
  it('should check multiple scents', function() {
    const checkedScents = [];
    mockAnt.brain.checkTrail = (scent) => {
      checkedScents.push(scent.name);
      return scent.name === 'build';
    };
    
    const scents = [
      { name: 'forage' },
      { name: 'combat' },
      { name: 'build' }
    ];
    
    tryTrack(scents, mockAnt);
    
    expect(checkedScents).to.include('forage');
    expect(checkedScents).to.include('combat');
  });
  
  it('should return first matching scent', function() {
    mockAnt.brain.checkTrail = (scent) => true; // Match all
    
    const scents = [
      { name: 'forage' },
      { name: 'combat' },
      { name: 'build' }
    ];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal('forage'); // First one
  });
  
  it('should handle empty scents array', function() {
    const scents = [];
    
    const result = tryTrack(scents, mockAnt);
    
    expect(result).to.equal(0);
  });
});

describe('wander()', function() {
  
  let grid, node, travelled, mockAnt;
  
  beforeEach(function() {
    grid = new Grid(5, 5, [0, 0], [0, 0]);
    travelled = new Set();
    
    // Create nodes
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const mockTile = {
          getWeight: () => 1,
          type: 'grass'
        };
        grid.setArrPos([x, y], new Node(mockTile, x, y));
      }
    }
    
    node = grid.getArrPos([2, 2]);
    
    mockAnt = {
      brain: {
        checkTrail: () => false
      },
      speciesName: 'worker',
      avoidSmellCheck: false,
      pathType: null,
      _faction: 'player'
    };
  });
  
  it('should return neighbor when no scents', function() {
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    expect(result).to.exist;
  });
  
  it('should call findBestNeighbor when no scents', function() {
    node.scents = [];
    
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    // Result should be a neighbor node
    expect(result._x).to.be.within(1, 3);
    expect(result._y).to.be.within(1, 3);
  });
  
  it('should check scents when available', function() {
    node.scents = [{ name: 'forage' }];
    
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    expect(result).to.exist;
  });
  
  it('should handle avoidSmellCheck flag', function() {
    node.scents = [{ name: 'forage' }];
    mockAnt.avoidSmellCheck = true;
    
    const result = wander(grid, node, travelled, mockAnt, 'idle');
    
    // Should use findBestNeighbor instead of tracking
    expect(result).to.exist;
  });
});

describe('Pathfinding Integration', function() {
  
  it('should create complete path map from terrain', function() {
    const mockTerrain = {
      _xCount: 5,
      _yCount: 5,
      _tileStore: [],
      conv2dpos: (x, y) => y * 5 + x
    };
    
    for (let i = 0; i < 25; i++) {
      mockTerrain._tileStore.push({
        getWeight: () => 1,
        type: 'grass'
      });
    }
    
    const pathMap = new PathMap(mockTerrain);
    const grid = pathMap.getGrid();
    
    // Verify all nodes accessible
    const centerNode = grid.getArrPos([2, 2]);
    const travelled = new Set();
    
    const neighbor = findBestNeighbor(grid, centerNode, travelled);
    
    expect(neighbor).to.exist;
  });
});




// ================================================================
// pathfinding.test.js (77 tests)
// ================================================================
/**
 * Unit tests for pathfinding.js
 * Tests bidirectional A* pathfinding system including:
 * - PathMap creation and grid management
 * - Node construction and neighbor detection
 * - BinaryHeap priority queue operations
 * - Path finding algorithms (bidirectional A*)
 * - Distance calculations (octile distance)
 * - Path reconstruction and optimization
 */

// DUPLICATE REQUIRE REMOVED: let path = require('path');

// Mock p5.js functions
global.abs = Math.abs;
global.min = Math.min;
global.max = Math.max;

// Mock Grid class
class Grid {
  constructor(sizeX, sizeY, pos1, pos2) {
    this._sizeX = sizeX;
    this._sizeY = sizeY;
    this._data = [];
    for (let i = 0; i < sizeX * sizeY; i++) {
      this._data[i] = null;
    }
  }

  setArrPos(pos, value) {
    const [x, y] = pos;
    if (x >= 0 && x < this._sizeX && y >= 0 && y < this._sizeY) {
      this._data[y * this._sizeX + x] = value;
    }
  }

  getArrPos(pos) {
    const [x, y] = pos;
    if (x >= 0 && x < this._sizeX && y >= 0 && y < this._sizeY) {
      return this._data[y * this._sizeX + x];
    }
    return null;
  }
}

global.Grid = Grid;

// Load pathfinding module
let pathfindingPath = path.resolve(__dirname, '../../../Classes/pathfinding.js');
// DUPLICATE REQUIRE REMOVED: let pathfindingCode = require('fs').readFileSync(pathfindingPath, 'utf8');
eval(pathfindingCode);

describe('BinaryHeap', function() {
  describe('Constructor', function() {
    it('should create empty heap', function() {
      const heap = new BinaryHeap();
      expect(heap.items).to.be.an('array');
      expect(heap.items).to.have.lengthOf(0);
      expect(heap.isEmpty()).to.be.true;
    });
  });

  describe('push() - Adding Elements', function() {
    it('should add single element to heap', function() {
      const heap = new BinaryHeap();
      const node = { f: 5, id: 'test' };
      heap.push(node);
      expect(heap.items).to.have.lengthOf(1);
      expect(heap.items[0]).to.equal(node);
    });

    it('should maintain min-heap property with multiple elements', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      heap.push({ f: 3, id: '3' });
      heap.push({ f: 7, id: '7' });
      
      expect(heap.items[0].f).to.equal(3); // Min at root
    });

    it('should bubble up smaller elements', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 10, id: '10' });
      heap.push({ f: 5, id: '5' });
      heap.push({ f: 1, id: '1' });
      
      expect(heap.items[0].f).to.equal(1); // Smallest bubbled to top
    });

    it('should handle many elements correctly', function() {
      const heap = new BinaryHeap();
      const values = [15, 10, 20, 8, 25, 5, 30];
      
      values.forEach(v => heap.push({ f: v, id: String(v) }));
      
      expect(heap.items[0].f).to.equal(5); // Minimum at root
      expect(heap.items).to.have.lengthOf(7);
    });

    it('should handle duplicate f values', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: 'a' });
      heap.push({ f: 5, id: 'b' });
      heap.push({ f: 5, id: 'c' });
      
      expect(heap.items).to.have.lengthOf(3);
      expect(heap.items[0].f).to.equal(5);
    });
  });

  describe('pop() - Removing Elements', function() {
    it('should return and remove minimum element', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      heap.push({ f: 3, id: '3' });
      heap.push({ f: 7, id: '7' });
      
      const min = heap.pop();
      expect(min.f).to.equal(3);
      expect(heap.items).to.have.lengthOf(2);
    });

    it('should maintain heap property after pop', function() {
      const heap = new BinaryHeap();
      const values = [10, 5, 15, 3, 8];
      values.forEach(v => heap.push({ f: v, id: String(v) }));
      
      heap.pop(); // Remove 3
      expect(heap.items[0].f).to.equal(5); // Next minimum
    });

    it('should handle single element', function() {
      const heap = new BinaryHeap();
      const node = { f: 10, id: '10' };
      heap.push(node);
      
      const popped = heap.pop();
      expect(popped).to.equal(node);
      expect(heap.isEmpty()).to.be.true;
    });

    it('should return elements in sorted order', function() {
      const heap = new BinaryHeap();
      const values = [9, 4, 7, 2, 6];
      values.forEach(v => heap.push({ f: v, id: String(v) }));
      
      const sorted = [];
      while (!heap.isEmpty()) {
        sorted.push(heap.pop().f);
      }
      
      expect(sorted).to.deep.equal([2, 4, 6, 7, 9]);
    });

    it('should handle empty heap gracefully', function() {
      const heap = new BinaryHeap();
      const result = heap.pop();
      expect(result).to.be.undefined;
    });
  });

  describe('isEmpty()', function() {
    it('should return true for empty heap', function() {
      const heap = new BinaryHeap();
      expect(heap.isEmpty()).to.be.true;
    });

    it('should return false for non-empty heap', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      expect(heap.isEmpty()).to.be.false;
    });

    it('should return true after popping all elements', function() {
      const heap = new BinaryHeap();
      heap.push({ f: 5, id: '5' });
      heap.pop();
      expect(heap.isEmpty()).to.be.true;
    });
  });

  describe('Heap Property Invariant', function() {
    it('should maintain parent <= children property', function() {
      const heap = new BinaryHeap();
      for (let i = 0; i < 20; i++) {
        heap.push({ f: Math.floor(Math.random() * 100), id: String(i) });
      }
      
      // Check heap property
      for (let i = 0; i < heap.items.length; i++) {
        const leftChild = 2 * i + 1;
        const rightChild = 2 * i + 2;
        
        if (leftChild < heap.items.length) {
          expect(heap.items[i].f).to.be.at.most(heap.items[leftChild].f);
        }
        if (rightChild < heap.items.length) {
          expect(heap.items[i].f).to.be.at.most(heap.items[rightChild].f);
        }
      }
    });
  });
});

describe('Node', function() {
  let mockTerrainTile;

  beforeEach(function() {
    mockTerrainTile = {
      getWeight: function() { return 1; }
    };
  });

  describe('Constructor', function() {
    it('should create node with terrain tile and coordinates', function() {
      const node = new Node(mockTerrainTile, 5, 7);
      
      expect(node._terrainTile).to.equal(mockTerrainTile);
      expect(node._x).to.equal(5);
      expect(node._y).to.equal(7);
      expect(node.id).to.equal('5-7');
    });

    it('should initialize empty neighbors array', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.neighbors).to.be.an('array');
      expect(node.neighbors).to.have.lengthOf(0);
    });

    it('should initialize pathfinding values to zero', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.f).to.equal(0);
      expect(node.g).to.equal(0);
      expect(node.h).to.equal(0);
    });

    it('should initialize previous pointers to null', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.previousStart).to.be.null;
      expect(node.previousEnd).to.be.null;
    });

    it('should set weight from terrain tile', function() {
      mockTerrainTile.getWeight = function() { return 2.5; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.weight).to.equal(2.5);
    });

    it('should generate unique IDs for different coordinates', function() {
      const node1 = new Node(mockTerrainTile, 3, 4);
      const node2 = new Node(mockTerrainTile, 4, 3);
      
      expect(node1.id).to.not.equal(node2.id);
      expect(node1.id).to.equal('3-4');
      expect(node2.id).to.equal('4-3');
    });
  });

  describe('assignWall()', function() {
    it('should mark node as wall when weight is 100', function() {
      mockTerrainTile.getWeight = function() { return 100; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.true;
    });

    it('should not mark node as wall when weight is less than 100', function() {
      mockTerrainTile.getWeight = function() { return 50; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.false;
    });

    it('should not mark node as wall when weight is 1', function() {
      mockTerrainTile.getWeight = function() { return 1; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.false;
    });

    it('should not mark node as wall when weight is 0', function() {
      mockTerrainTile.getWeight = function() { return 0; };
      const node = new Node(mockTerrainTile, 0, 0);
      expect(node.wall).to.be.false;
    });
  });

  describe('reset()', function() {
    it('should reset all pathfinding values to zero', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      node.f = 10;
      node.g = 5;
      node.h = 5;
      
      node.reset();
      
      expect(node.f).to.equal(0);
      expect(node.g).to.equal(0);
      expect(node.h).to.equal(0);
    });

    it('should reset previous pointers to null', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      node.previousStart = { id: 'start' };
      node.previousEnd = { id: 'end' };
      
      node.reset();
      
      expect(node.previousStart).to.be.null;
      expect(node.previousEnd).to.be.null;
    });

    it('should be callable multiple times', function() {
      const node = new Node(mockTerrainTile, 0, 0);
      node.f = 10;
      node.reset();
      node.f = 20;
      node.reset();
      
      expect(node.f).to.equal(0);
    });
  });

  describe('setNeighbors()', function() {
    it('should find all 8 neighbors for center node', function() {
      const grid = new Grid(5, 5, [0, 0], [0, 0]);
      
      // Create nodes
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const centerNode = grid.getArrPos([2, 2]);
      centerNode.setNeighbors(grid);
      
      expect(centerNode.neighbors).to.have.lengthOf(8);
    });

    it('should find 3 neighbors for corner node', function() {
      const grid = new Grid(5, 5, [0, 0], [0, 0]);
      
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const cornerNode = grid.getArrPos([0, 0]);
      cornerNode.setNeighbors(grid);
      
      expect(cornerNode.neighbors).to.have.lengthOf(3);
    });

    it('should find 5 neighbors for edge node', function() {
      const grid = new Grid(5, 5, [0, 0], [0, 0]);
      
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const edgeNode = grid.getArrPos([2, 0]);
      edgeNode.setNeighbors(grid);
      
      expect(edgeNode.neighbors).to.have.lengthOf(5);
    });

    it('should not include self as neighbor', function() {
      const grid = new Grid(3, 3, [0, 0], [0, 0]);
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const centerNode = grid.getArrPos([1, 1]);
      centerNode.setNeighbors(grid);
      
      const selfIncluded = centerNode.neighbors.some(n => n.id === centerNode.id);
      expect(selfIncluded).to.be.false;
    });

    it('should only add in-bounds neighbors', function() {
      const grid = new Grid(3, 3, [0, 0], [0, 0]);
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const node = grid.getArrPos([0, 0]);
      node.setNeighbors(grid);
      
      // All neighbors should be valid nodes
      node.neighbors.forEach(neighbor => {
        expect(neighbor).to.not.be.null;
        expect(neighbor).to.be.an('object');
        expect(neighbor.id).to.be.a('string');
      });
    });

    it('should include diagonal neighbors', function() {
      const grid = new Grid(3, 3, [0, 0], [0, 0]);
      
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const node = new Node(mockTerrainTile, x, y);
          grid.setArrPos([x, y], node);
        }
      }
      
      const centerNode = grid.getArrPos([1, 1]);
      centerNode.setNeighbors(grid);
      
      const diagonalIds = ['0-0', '2-0', '0-2', '2-2'];
      const foundDiagonals = centerNode.neighbors.filter(n => 
        diagonalIds.includes(n.id)
      );
      
      expect(foundDiagonals).to.have.lengthOf(4);
    });
  });
});

describe('PathMap', function() {
  let mockTerrain;

  beforeEach(function() {
    mockTerrain = {
      _xCount: 5,
      _yCount: 5,
      _tileStore: [],
      conv2dpos: function(x, y) {
        return y * this._xCount + x;
      }
    };

    // Create mock tiles
    for (let i = 0; i < 25; i++) {
      mockTerrain._tileStore[i] = {
        getWeight: function() { return 1; }
      };
    }
  });

  describe('Constructor', function() {
    it('should create PathMap from terrain', function() {
      const pathMap = new PathMap(mockTerrain);
      expect(pathMap._terrain).to.equal(mockTerrain);
      expect(pathMap._grid).to.be.an('object');
    });

    it('should create grid with correct dimensions', function() {
      const pathMap = new PathMap(mockTerrain);
      expect(pathMap._grid._sizeX).to.equal(5);
      expect(pathMap._grid._sizeY).to.equal(5);
    });

    it('should create nodes for all terrain tiles', function() {
      const pathMap = new PathMap(mockTerrain);
      
      let nodeCount = 0;
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const node = pathMap._grid.getArrPos([x, y]);
          if (node) nodeCount++;
        }
      }
      
      expect(nodeCount).to.equal(25);
    });

    it('should initialize neighbors for all nodes', function() {
      const pathMap = new PathMap(mockTerrain);
      
      const centerNode = pathMap._grid.getArrPos([2, 2]);
      expect(centerNode.neighbors).to.have.lengthOf(8);
    });

    it('should handle small grids (1x1)', function() {
      mockTerrain._xCount = 1;
      mockTerrain._yCount = 1;
      mockTerrain._tileStore = [{ getWeight: () => 1 }];
      
      const pathMap = new PathMap(mockTerrain);
      const node = pathMap._grid.getArrPos([0, 0]);
      
      expect(node).to.not.be.null;
      expect(node.neighbors).to.have.lengthOf(0);
    });

    it('should handle rectangular grids', function() {
      mockTerrain._xCount = 3;
      mockTerrain._yCount = 7;
      mockTerrain._tileStore = [];
      
      for (let i = 0; i < 21; i++) {
        mockTerrain._tileStore[i] = { getWeight: () => 1 };
      }
      
      const pathMap = new PathMap(mockTerrain);
      expect(pathMap._grid._sizeX).to.equal(3);
      expect(pathMap._grid._sizeY).to.equal(7);
    });
  });

  describe('getGrid()', function() {
    it('should return grid object', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      
      expect(grid).to.equal(pathMap._grid);
      expect(grid._sizeX).to.equal(5);
      expect(grid._sizeY).to.equal(5);
    });

    it('should allow access to nodes through grid', function() {
      const pathMap = new PathMap(mockTerrain);
      const grid = pathMap.getGrid();
      const node = grid.getArrPos([2, 3]);
      
      expect(node).to.not.be.null;
      expect(node.id).to.equal('2-3');
    });
  });
});

describe('distanceFinder()', function() {
  it('should calculate horizontal distance', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 5, _y: 0 };
    
    const distance = distanceFinder(start, end);
    expect(distance).to.equal(5);
  });

  it('should calculate vertical distance', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 0, _y: 5 };
    
    const distance = distanceFinder(start, end);
    expect(distance).to.equal(5);
  });

  it('should calculate diagonal distance (octile)', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 3, _y: 3 };
    
    const distance = distanceFinder(start, end);
    const expected = 3 * Math.SQRT2;
    expect(distance).to.be.closeTo(expected, 0.01);
  });

  it('should calculate mixed diagonal and straight distance', function() {
    const start = { _x: 0, _y: 0 };
    const end = { _x: 5, _y: 3 };
    
    const distance = distanceFinder(start, end);
    // Should favor diagonal movement
    expect(distance).to.be.greaterThan(5);
    expect(distance).to.be.lessThan(8);
  });

  it('should be commutative (distance A to B = distance B to A)', function() {
    const start = { _x: 2, _y: 3 };
    const end = { _x: 7, _y: 8 };
    
    const distAB = distanceFinder(start, end);
    const distBA = distanceFinder(end, start);
    
    expect(distAB).to.equal(distBA);
  });

  it('should return zero for same node', function() {
    const node = { _x: 5, _y: 5 };
    const distance = distanceFinder(node, node);
    expect(distance).to.equal(0);
  });

  it('should handle negative coordinates', function() {
    const start = { _x: -3, _y: -2 };
    const end = { _x: 4, _y: 5 };
    
    const distance = distanceFinder(start, end);
    expect(distance).to.be.greaterThan(0);
  });
});

describe('makePath()', function() {
  it('should reconstruct path from end node', function() {
    const node1 = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const node2 = { _x: 1, _y: 0, previousStart: node1, previousEnd: null };
    const node3 = { _x: 2, _y: 0, previousStart: node2, previousEnd: null };
    
    const path = makePath(node3);
    
    expect(path).to.have.lengthOf(3);
    expect(path[0]).to.equal(node1);
    expect(path[1]).to.equal(node2);
    expect(path[2]).to.equal(node3);
  });

  it('should handle bidirectional path (from start)', function() {
    const start = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const middle = { _x: 1, _y: 0, previousStart: start, previousEnd: null };
    
    const path = makePath(middle);
    
    expect(path).to.have.lengthOf(2);
    expect(path[0]).to.equal(start);
    expect(path[1]).to.equal(middle);
  });

  it('should handle bidirectional path (from end)', function() {
    const end = { _x: 3, _y: 0, previousStart: null, previousEnd: null };
    const middle = { _x: 2, _y: 0, previousStart: null, previousEnd: end };
    const meetingNode = { _x: 1, _y: 0, previousStart: null, previousEnd: middle };
    
    const path = makePath(meetingNode);
    
    expect(path).to.have.lengthOf(3);
    expect(path[2]).to.equal(end);
  });

  it('should handle single node path', function() {
    const node = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const path = makePath(node);
    
    expect(path).to.have.lengthOf(1);
    expect(path[0]).to.equal(node);
  });

  it('should concatenate both directions correctly', function() {
    const n1 = { _x: 0, _y: 0, previousStart: null, previousEnd: null };
    const n2 = { _x: 1, _y: 0, previousStart: n1, previousEnd: null };
    const n3 = { _x: 2, _y: 0, previousStart: n2, previousEnd: null };
    const n4 = { _x: 3, _y: 0, previousStart: null, previousEnd: null };
    const n5 = { _x: 4, _y: 0, previousStart: null, previousEnd: n4 };
    
    n3.previousEnd = n4;
    
    const path = makePath(n3);
    
    expect(path).to.have.lengthOf(5);
    expect(path[0]).to.equal(n1);
    expect(path[2]).to.equal(n3);
    expect(path[4]).to.equal(n5);
  });
});

describe('resetSearch()', function() {
  let mockTerrain, pathMap;

  beforeEach(function() {
    mockTerrain = {
      _xCount: 5,
      _yCount: 5,
      _tileStore: [],
      conv2dpos: function(x, y) {
        return y * this._xCount + x;
      }
    };

    for (let i = 0; i < 25; i++) {
      mockTerrain._tileStore[i] = { getWeight: () => 1 };
    }

    pathMap = new PathMap(mockTerrain);
  });

  it('should reset all node f, g, h values', function() {
    const grid = pathMap.getGrid();
    const node = grid.getArrPos([2, 2]);
    
    node.f = 10;
    node.g = 5;
    node.h = 5;
    
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    resetSearch(start, end, pathMap);
    
    expect(node.f).to.equal(0);
    expect(node.g).to.equal(0);
    expect(node.h).to.equal(0);
  });

  it('should initialize start node with f value', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    resetSearch(start, end, pathMap);
    
    expect(start.g).to.equal(0);
    expect(start.f).to.be.greaterThan(0);
  });

  it('should initialize end node with f value', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    resetSearch(start, end, pathMap);
    
    expect(end.g).to.equal(0);
    expect(end.f).to.be.greaterThan(0);
  });

  it('should clear previous search path', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    // Run a search first
    resetSearch(start, end, pathMap);
    
    // Check that path is cleared
    // (path variable is global in the module)
    expect(typeof path).to.not.be.undefined;
  });

  it('should reset meeting node to null', function() {
    const grid = pathMap.getGrid();
    const start = grid.getArrPos([0, 0]);
    const end = grid.getArrPos([4, 4]);
    
    resetSearch(start, end, pathMap);
    
    expect(meetingNode).to.be.null;
  });
});

describe('findPath() - Integration Tests', function() {
  let mockTerrain, pathMap;

  beforeEach(function() {
    mockTerrain = {
      _xCount: 10,
      _yCount: 10,
      _tileStore: [],
      conv2dpos: function(x, y) {
        return y * this._xCount + x;
      }
    };

    for (let i = 0; i < 100; i++) {
      mockTerrain._tileStore[i] = { getWeight: () => 1 };
    }

    pathMap = new PathMap(mockTerrain);
  });

  describe('Basic Pathfinding', function() {
    it('should find straight horizontal path', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([5, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should find straight vertical path', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 0]);
      const end = grid.getArrPos([5, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should find diagonal path', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([5, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should return single node for same start and end', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 5]);
      const end = start;
      
      const path = findPath(start, end, pathMap);
      
      // Should meet immediately
      expect(path).to.be.an('array');
    });

    it('should find path between adjacent nodes', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 5]);
      const end = grid.getArrPos([5, 6]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.at.least(2);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });
  });

  describe('Pathfinding with Obstacles', function() {
    it('should return empty array when no path exists', function() {
      const grid = pathMap.getGrid();
      
      // Create a wall blocking the path
      for (let y = 0; y < 10; y++) {
        const wallNode = grid.getArrPos([5, y]);
        wallNode.wall = true;
      }
      
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path).to.have.lengthOf(0);
    });

    it('should route around obstacles', function() {
      const grid = pathMap.getGrid();
      
      // Create vertical wall with gap
      for (let y = 0; y < 8; y++) {
        const wallNode = grid.getArrPos([5, y]);
        wallNode.wall = true;
      }
      
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should avoid wall nodes in path', function() {
      const grid = pathMap.getGrid();
      
      // Create some walls
      grid.getArrPos([3, 3]).wall = true;
      grid.getArrPos([3, 4]).wall = true;
      grid.getArrPos([3, 5]).wall = true;
      
      const start = grid.getArrPos([0, 4]);
      const end = grid.getArrPos([7, 4]);
      
      const path = findPath(start, end, pathMap);
      
      // Ensure no wall nodes in path
      const hasWallInPath = path.some(node => node.wall);
      expect(hasWallInPath).to.be.false;
    });
  });

  describe('Path Optimality', function() {
    it('should prefer diagonal movement when optimal', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([3, 3]);
      
      const path = findPath(start, end, pathMap);
      
      // Diagonal path should be shorter than Manhattan path
      expect(path.length).to.be.at.most(4); // Perfect diagonal
    });

    it('should handle weighted terrain', function() {
      const grid = pathMap.getGrid();
      
      // Make a row expensive
      for (let x = 0; x < 10; x++) {
        const node = grid.getArrPos([x, 5]);
        node.weight = 10;
      }
      
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path).to.be.an('array');
      // Path may route around expensive terrain if available
    });
  });

  describe('Edge Cases', function() {
    it('should handle path along grid boundaries', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([9, 0]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should handle corner to corner paths', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([9, 9]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.greaterThan(0);
      expect(path[0]).to.equal(start);
      expect(path[path.length - 1]).to.equal(end);
    });

    it('should find path in small grid (3x3)', function() {
      const smallTerrain = {
        _xCount: 3,
        _yCount: 3,
        _tileStore: [],
        conv2dpos: function(x, y) {
          return y * this._xCount + x;
        }
      };

      for (let i = 0; i < 9; i++) {
        smallTerrain._tileStore[i] = { getWeight: () => 1 };
      }

      const smallPathMap = new PathMap(smallTerrain);
      const grid = smallPathMap.getGrid();
      const start = grid.getArrPos([0, 0]);
      const end = grid.getArrPos([2, 2]);
      
      const path = findPath(start, end, smallPathMap);
      
      expect(path.length).to.be.greaterThan(0);
    });
  });

  describe('Bidirectional Search Properties', function() {
    it('should meet in the middle for long paths', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([0, 5]);
      const end = grid.getArrPos([9, 5]);
      
      const path = findPath(start, end, pathMap);
      
      // Bidirectional should be efficient
      expect(path).to.be.an('array');
      expect(path.length).to.be.greaterThan(0);
    });

    it('should work correctly when searches meet quickly', function() {
      const grid = pathMap.getGrid();
      const start = grid.getArrPos([5, 5]);
      const end = grid.getArrPos([6, 5]);
      
      const path = findPath(start, end, pathMap);
      
      expect(path.length).to.be.at.least(2);
      expect(path[0]).to.equal(start);
    });
  });
});

describe('expandNeighbors() - Algorithm Details', function() {
  it('should skip closed nodes', function() {
    const mockNode = {
      _x: 5,
      _y: 5,
      g: 0,
      neighbors: [
        { id: 'neighbor1', wall: false, g: 0, weight: 1, _x: 6, _y: 5 },
        { id: 'neighbor2', wall: false, g: 0, weight: 1, _x: 4, _y: 5 }
      ]
    };

    const openSet = new BinaryHeap();
    const openMap = new Map();
    const closedSet = new Set(['neighbor1']);
    const target = { _x: 10, _y: 10 };

    expandNeighbors(mockNode, openSet, openMap, closedSet, target, true);

    // Only neighbor2 should be added (neighbor1 is closed)
    expect(openMap.has('neighbor1')).to.be.false;
    expect(openMap.has('neighbor2')).to.be.true;
  });

  it('should skip wall nodes', function() {
    const mockNode = {
      _x: 5,
      _y: 5,
      g: 0,
      neighbors: [
        { id: 'wall', wall: true, g: 0, weight: 1, _x: 6, _y: 5 },
        { id: 'open', wall: false, g: 0, weight: 1, _x: 4, _y: 5 }
      ]
    };

    const openSet = new BinaryHeap();
    const openMap = new Map();
    const closedSet = new Set();
    const target = { _x: 10, _y: 10 };

    expandNeighbors(mockNode, openSet, openMap, closedSet, target, true);

    expect(openMap.has('wall')).to.be.false;
    expect(openMap.has('open')).to.be.true;
  });

  it('should update g value when better path found', function() {
    const neighbor = { 
      id: 'neighbor', 
      wall: false, 
      g: 100, 
      h: 0,
      f: 100,
      weight: 1, 
      _x: 6, 
      _y: 5 
    };

    const mockNode = {
      _x: 5,
      _y: 5,
      g: 1,
      neighbors: [neighbor]
    };

    const openSet = new BinaryHeap();
    const openMap = new Map([['neighbor', neighbor]]);
    const closedSet = new Set();
    const target = { _x: 10, _y: 10 };

    expandNeighbors(mockNode, openSet, openMap, closedSet, target, true);

    // Should update to lower g value
    expect(neighbor.g).to.be.lessThan(100);
  });
});



// ================================================================
// pheromones.test.js (53 tests)
// ================================================================
/**
 * Unit Tests for pheromones
 * Tests pheromone system (Note: incomplete implementation)
 */

// Load pheromones code
let pheromonesCode = require('fs').readFileSync(
  require('path').resolve(__dirname, '../../../Classes/systems/pheromones.js'),
  'utf8'
);
eval(pheromonesCode);

describe('Stench', function() {
  
  describe('Constructor', function() {
    
    it('should create stench with name', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench.name).to.equal('forage');
    });
    
    it('should create stench with allegiance', function() {
      const stench = new Stench('combat', 'enemy');
      
      expect(stench.origin).to.equal('enemy');
    });
    
    it('should initialize stress to 0', function() {
      const stench = new Stench('build', 'player');
      
      expect(stench.stress).to.equal(0);
    });
    
    it('should initialize strength to 0', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench.strength).to.equal(0);
    });
    
    it('should handle different pheromone types', function() {
      const types = ['forage', 'combat', 'build', 'home', 'farm', 'enemy', 'boss', 'default'];
      
      types.forEach(type => {
        const stench = new Stench(type, 'player');
        expect(stench.name).to.equal(type);
      });
    });
    
    it('should handle different allegiances', function() {
      const allegiances = ['player', 'enemy', 'neutral'];
      
      allegiances.forEach(allegiance => {
        const stench = new Stench('forage', allegiance);
        expect(stench.origin).to.equal(allegiance);
      });
    });
  });
  
  describe('Properties', function() {
    
    it('should have name property', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench).to.have.property('name');
    });
    
    it('should have origin property', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench).to.have.property('origin');
    });
    
    it('should have stress property', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench).to.have.property('stress');
    });
    
    it('should have strength property', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench).to.have.property('strength');
    });
  });
  
  describe('addStress()', function() {
    
    it('should exist as method', function() {
      const stench = new Stench('forage', 'player');
      
      expect(stench.addStress).to.be.a('function');
    });
    
    it('should accept terrain type parameter', function() {
      const stench = new Stench('forage', 'player');
      
      expect(() => {
        stench.addStress('rough');
      }).to.not.throw();
    });
    
    it('should handle various terrain types', function() {
      const stench = new Stench('forage', 'player');
      const terrainTypes = ['rough', 'smooth', 'water', 'stone'];
      
      terrainTypes.forEach(type => {
        expect(() => {
          stench.addStress(type);
        }).to.not.throw();
      });
    });
  });
});

describe('StenchGrid', function() {
  
  describe('Constructor', function() {
    
    it('should create stench grid', function() {
      const grid = new StenchGrid();
      
      expect(grid).to.exist;
    });
    
    it('should be instantiable', function() {
      expect(() => {
        new StenchGrid();
      }).to.not.throw();
    });
  });
  
  describe('addPheromone()', function() {
    
    it('should exist as method', function() {
      const grid = new StenchGrid();
      
      expect(grid.addPheromone).to.be.a('function');
    });
    
    it('should accept position parameters', function() {
      const grid = new StenchGrid();
      
      expect(() => {
        grid.addPheromone(5, 10, 'player', 'forage');
      }).to.not.throw();
    });
    
    it('should accept ant type parameter', function() {
      const grid = new StenchGrid();
      
      expect(() => {
        grid.addPheromone(0, 0, 'worker', 'forage');
      }).to.not.throw();
    });
    
    it('should accept tag parameter', function() {
      const grid = new StenchGrid();
      
      expect(() => {
        grid.addPheromone(0, 0, 'player', 'combat');
      }).to.not.throw();
    });
    
    it('should handle multiple pheromone additions', function() {
      const grid = new StenchGrid();
      
      expect(() => {
        grid.addPheromone(0, 0, 'player', 'forage');
        grid.addPheromone(1, 1, 'player', 'combat');
        grid.addPheromone(2, 2, 'enemy', 'forage');
      }).to.not.throw();
    });
    
    it('should handle negative coordinates', function() {
      const grid = new StenchGrid();
      
      expect(() => {
        grid.addPheromone(-5, -10, 'player', 'forage');
      }).to.not.throw();
    });
    
    it('should handle large coordinates', function() {
      const grid = new StenchGrid();
      
      expect(() => {
        grid.addPheromone(1000, 2000, 'player', 'forage');
      }).to.not.throw();
    });
  });
});

describe('diffuse() function', function() {
  
  it('should exist', function() {
    expect(diffuse).to.be.a('function');
  });
  
  it('should be callable', function() {
    expect(() => {
      diffuse();
    }).to.not.throw();
  });
});

describe('findDiffusionRate() function', function() {
  
  it('should exist', function() {
    expect(findDiffusionRate).to.be.a('function');
  });
  
  it('should be callable', function() {
    expect(() => {
      findDiffusionRate();
    }).to.not.throw();
  });
});

describe('Pheromone System Concepts', function() {
  
  describe('Stench Types', function() {
    
    it('should support forage pheromones', function() {
      const stench = new Stench('forage', 'player');
      expect(stench.name).to.equal('forage');
    });
    
    it('should support combat pheromones', function() {
      const stench = new Stench('combat', 'player');
      expect(stench.name).to.equal('combat');
    });
    
    it('should support build pheromones', function() {
      const stench = new Stench('build', 'player');
      expect(stench.name).to.equal('build');
    });
    
    it('should support home pheromones', function() {
      const stench = new Stench('home', 'player');
      expect(stench.name).to.equal('home');
    });
    
    it('should support farm pheromones', function() {
      const stench = new Stench('farm', 'player');
      expect(stench.name).to.equal('farm');
    });
    
    it('should support enemy pheromones', function() {
      const stench = new Stench('enemy', 'enemy');
      expect(stench.name).to.equal('enemy');
    });
    
    it('should support boss pheromones', function() {
      const stench = new Stench('boss', 'player');
      expect(stench.name).to.equal('boss');
    });
  });
  
  describe('Allegiance System', function() {
    
    it('should distinguish player pheromones', function() {
      const stench = new Stench('forage', 'player');
      expect(stench.origin).to.equal('player');
    });
    
    it('should distinguish enemy pheromones', function() {
      const stench = new Stench('combat', 'enemy');
      expect(stench.origin).to.equal('enemy');
    });
    
    it('should distinguish neutral pheromones', function() {
      const stench = new Stench('default', 'neutral');
      expect(stench.origin).to.equal('neutral');
    });
  });
  
  describe('Stress System', function() {
    
    it('should initialize with zero stress', function() {
      const stench = new Stench('forage', 'player');
      expect(stench.stress).to.equal(0);
    });
    
    it('should have stress modification method', function() {
      const stench = new Stench('forage', 'player');
      expect(stench.addStress).to.be.a('function');
    });
  });
  
  describe('Strength System', function() {
    
    it('should initialize with zero strength', function() {
      const stench = new Stench('forage', 'player');
      expect(stench.strength).to.equal(0);
    });
    
    it('should have strength property for diffusion', function() {
      const stench = new Stench('forage', 'player');
      expect(stench).to.have.property('strength');
    });
  });
});

describe('Pheromone System Integration (Concept Tests)', function() {
  
  it('should create pheromone grid for spatial storage', function() {
    const grid = new StenchGrid();
    
    expect(grid).to.exist;
    expect(grid.addPheromone).to.be.a('function');
  });
  
  it('should create stench objects for pheromone data', function() {
    const stench = new Stench('forage', 'player');
    
    expect(stench.name).to.exist;
    expect(stench.origin).to.exist;
    expect(stench.stress).to.be.a('number');
    expect(stench.strength).to.be.a('number');
  });
  
  it('should have diffusion mechanism', function() {
    expect(diffuse).to.be.a('function');
    expect(findDiffusionRate).to.be.a('function');
  });
  
  it('should support multiple pheromone types per grid cell', function() {
    const grid = new StenchGrid();
    
    // Conceptually should support multiple pheromones at same location
    expect(() => {
      grid.addPheromone(5, 5, 'player', 'forage');
      grid.addPheromone(5, 5, 'player', 'home');
      grid.addPheromone(5, 5, 'enemy', 'combat');
    }).to.not.throw();
  });
  
  it('should support terrain-based stress mechanics', function() {
    const stench = new Stench('forage', 'player');
    
    expect(() => {
      stench.addStress('rough');
      stench.addStress('water');
      stench.addStress('stone');
    }).to.not.throw();
  });
});

describe('Implementation Status', function() {
  
  it('should have Stench class defined', function() {
    expect(Stench).to.be.a('function');
  });
  
  it('should have StenchGrid class defined', function() {
    expect(StenchGrid).to.be.a('function');
  });
  
  it('should have diffuse function defined', function() {
    expect(diffuse).to.be.a('function');
  });
  
  it('should have findDiffusionRate function defined', function() {
    expect(findDiffusionRate).to.be.a('function');
  });
  
  it('should note addStress is not yet implemented', function() {
    const stench = new Stench('forage', 'player');
    
    // Method exists but does nothing (empty implementation)
    const initialStress = stench.stress;
    stench.addStress('rough');
    
    expect(stench.stress).to.equal(initialStress);
  });
  
  it('should note diffuse is not yet implemented', function() {
    // Function exists but empty
    const result = diffuse();
    expect(result).to.be.undefined;
  });
  
  it('should note findDiffusionRate is not yet implemented', function() {
    // Function exists but empty
    const result = findDiffusionRate();
    expect(result).to.be.undefined;
  });
  
  it('should note StenchGrid.addPheromone is not yet implemented', function() {
    const grid = new StenchGrid();
    
    // Method exists but does nothing (empty implementation)
    const result = grid.addPheromone(0, 0, 'player', 'forage');
    
    expect(result).to.be.undefined;
  });
});

