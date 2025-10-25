/**
 * Unit Tests for BuildingBrush
 * Tests building placement tool with grid snapping
 */

const { expect } = require('chai');

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
const { BuildingBrush } = require('../../../Classes/systems/tools/BuildingBrush');

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
