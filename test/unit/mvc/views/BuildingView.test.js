const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM for p5.js-like environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock p5.js graphics context
function createMockGraphics() {
  return {
    push: sinon.stub(),
    pop: sinon.stub(),
    fill: sinon.stub(),
    noFill: sinon.stub(),
    stroke: sinon.stub(),
    noStroke: sinon.stub(),
    strokeWeight: sinon.stub(),
    rect: sinon.stub(),
    ellipse: sinon.stub(),
    text: sinon.stub(),
    textAlign: sinon.stub(),
    textSize: sinon.stub(),
    translate: sinon.stub(),
    scale: sinon.stub(),
    rotate: sinon.stub(),
    image: sinon.stub(),
    imageMode: sinon.stub(),
    tint: sinon.stub(),
    noTint: sinon.stub(),
    // Track state
    _fillColor: null,
    _strokeColor: null
  };
}

// Mock sprite manager
const mockSpriteManager = {
  getSprite: sinon.stub().callsFake((spriteName) => {
    return {
      name: spriteName,
      width: 64,
      height: 64,
      image: { _mockImage: spriteName }
    };
  })
};

// Make sprite manager available globally
global.window.spriteManager = mockSpriteManager;

// Mock text constants
global.window.CENTER = 'center';
global.window.LEFT = 'left';
global.window.RIGHT = 'right';

// Import classes
const BuildingModel = require('../../../../Classes/mvc/models/BuildingModel');
const BuildingView = require('../../../../Classes/mvc/views/BuildingView');

describe('BuildingView', function() {
  let mockGraphics;
  let model;
  
  beforeEach(function() {
    mockGraphics = createMockGraphics();
    mockSpriteManager.getSprite.resetHistory();
    
    model = new BuildingModel({
      x: 100,
      y: 200,
      buildingType: 'AntHill',
      faction: 'player',
      level: 1
    });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create a BuildingView', function() {
      const view = new BuildingView();
      expect(view).to.exist;
    });
    
    it('should extend EntityView', function() {
      const view = new BuildingView();
      expect(view.render).to.be.a('function');
    });
  });
  
  describe('Building Type Sprites', function() {
    it('should render AntHill sprite for AntHill building', function() {
      const view = new BuildingView();
      model.buildingType = 'AntHill';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('building_anthill')).to.be.true;
      expect(mockGraphics.image.called).to.be.true;
    });
    
    it('should render Cone sprite for Cone building', function() {
      const view = new BuildingView();
      model.buildingType = 'Cone';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('building_cone')).to.be.true;
    });
    
    it('should render Hive sprite for Hive building', function() {
      const view = new BuildingView();
      model.buildingType = 'Hive';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('building_hive')).to.be.true;
    });
    
    it('should render Tower sprite for Tower building', function() {
      const view = new BuildingView();
      model.buildingType = 'Tower';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('building_tower')).to.be.true;
    });
    
    it('should fallback to AntHill sprite for unknown building type', function() {
      const view = new BuildingView();
      model.buildingType = 'UnknownBuilding';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('building_anthill')).to.be.true;
    });
  });
  
  describe('Faction Colors', function() {
    it('should apply player faction tint (default - no tint)', function() {
      const view = new BuildingView();
      model.faction = 'player';
      
      view.render(model, mockGraphics);
      
      // Player faction: no tint (default sprites)
      expect(mockGraphics.noTint.called).to.be.true;
    });
    
    it('should apply enemy faction tint (red)', function() {
      const view = new BuildingView();
      model.faction = 'enemy';
      
      view.render(model, mockGraphics);
      
      // Enemy faction: red tint
      expect(mockGraphics.tint.calledWith(255, 100, 100)).to.be.true;
    });
    
    it('should apply neutral faction tint (gray)', function() {
      const view = new BuildingView();
      model.faction = 'neutral';
      
      view.render(model, mockGraphics);
      
      // Neutral faction: gray tint
      expect(mockGraphics.tint.calledWith(150, 150, 150)).to.be.true;
    });
  });
  
  describe('Level Badge Rendering', function() {
    it('should render level badge for level > 1', function() {
      const view = new BuildingView();
      model.level = 3;
      
      view.render(model, mockGraphics);
      
      // Should render level text
      expect(mockGraphics.text.calledWith('3')).to.be.true;
      
      // Should draw badge background circle
      expect(mockGraphics.ellipse.called).to.be.true;
    });
    
    it('should not render level badge for level 1', function() {
      const view = new BuildingView();
      model.level = 1;
      
      view.render(model, mockGraphics);
      
      // Should not render level badge for base level
      const levelTextCalls = mockGraphics.text.getCalls().filter(
        call => call.args[0] === '1'
      );
      expect(levelTextCalls.length).to.equal(0);
    });
    
    it('should position level badge in top-right corner', function() {
      const view = new BuildingView();
      model.level = 5;
      
      view.render(model, mockGraphics);
      
      // Should render badge circle
      expect(mockGraphics.ellipse.called).to.be.true;
      
      // Should render level text
      expect(mockGraphics.text.calledWith('5')).to.be.true;
    });
    
    it('should handle max level (10)', function() {
      const view = new BuildingView();
      model.level = 10;
      
      view.render(model, mockGraphics);
      
      // Should render "10" text
      expect(mockGraphics.text.calledWith('10')).to.be.true;
    });
  });
  
  describe('Health Bar Rendering', function() {
    it('should render health bar when health is defined and below max', function() {
      const view = new BuildingView();
      model.health = 250;
      model.maxHealth = 500;
      
      view.render(model, mockGraphics);
      
      // Should draw health bar background (red)
      expect(mockGraphics.fill.calledWith(255, 0, 0)).to.be.true;
      
      // Should draw health bar foreground (green)
      expect(mockGraphics.fill.calledWith(0, 255, 0)).to.be.true;
      
      // Should draw two rectangles (background + foreground)
      expect(mockGraphics.rect.callCount).to.be.at.least(2);
    });
    
    it('should not render health bar when at full health', function() {
      const view = new BuildingView();
      model.health = 500;
      model.maxHealth = 500;
      
      view.render(model, mockGraphics);
      
      // Should not draw health bar rectangles
      const redFillCalls = mockGraphics.fill.getCalls().filter(
        call => call.args[0] === 255 && call.args[1] === 0 && call.args[2] === 0
      );
      expect(redFillCalls.length).to.equal(0);
    });
    
    it('should not render health bar when health is undefined', function() {
      const view = new BuildingView();
      model.health = undefined;
      model.maxHealth = undefined;
      
      view.render(model, mockGraphics);
      
      // Should not draw health bar
      const redFillCalls = mockGraphics.fill.getCalls().filter(
        call => call.args[0] === 255 && call.args[1] === 0 && call.args[2] === 0
      );
      expect(redFillCalls.length).to.equal(0);
    });
    
    it('should calculate health bar width proportionally', function() {
      const view = new BuildingView();
      model.health = 150;
      model.maxHealth = 500;
      
      view.render(model, mockGraphics);
      
      // Health bar should be 30% of full width (150/500 = 0.3)
      // Model size is 64x64, health bar width should be ~60px (64 - 4px padding)
      // At 30% health: 60 * 0.3 = 18px
      const rectCalls = mockGraphics.rect.getCalls();
      const healthBarCall = rectCalls.find(call => call.args[2] === 18); // Width of 18
      expect(healthBarCall).to.exist;
    });
  });
  
  describe('Sprite Positioning', function() {
    it('should center sprite at model position', function() {
      const view = new BuildingView();
      model.setPosition(200, 300);
      
      view.render(model, mockGraphics);
      
      // Should set imageMode to CENTER
      expect(mockGraphics.imageMode.called).to.be.true;
      
      // Should draw image at model position
      const imageCall = mockGraphics.image.firstCall;
      expect(imageCall.args[1]).to.equal(200); // x
      expect(imageCall.args[2]).to.equal(300); // y
    });
    
    it('should scale sprite to model size', function() {
      const view = new BuildingView();
      model.setSize(128, 128); // Larger building
      
      view.render(model, mockGraphics);
      
      // Should draw image with model dimensions
      const imageCall = mockGraphics.image.firstCall;
      expect(imageCall.args[3]).to.equal(128); // width
      expect(imageCall.args[4]).to.equal(128); // height
    });
  });
  
  describe('Disabled Building Rendering', function() {
    it('should not render disabled building', function() {
      const view = new BuildingView();
      model.enabled = false;
      
      view.render(model, mockGraphics);
      
      // Should not draw anything
      expect(mockGraphics.image.called).to.be.false;
      expect(mockSpriteManager.getSprite.called).to.be.false;
    });
  });
  
  describe('Fallback Rendering (No Sprite Manager)', function() {
    it('should render colored rectangle when sprite manager unavailable', function() {
      const view = new BuildingView();
      
      // Temporarily remove sprite manager
      const originalSpriteManager = global.window.spriteManager;
      delete global.window.spriteManager;
      
      view.render(model, mockGraphics);
      
      // Should draw rectangle instead of sprite
      expect(mockGraphics.rect.called).to.be.true;
      
      // Should use building-specific color
      expect(mockGraphics.fill.called).to.be.true;
      
      // Restore sprite manager
      global.window.spriteManager = originalSpriteManager;
    });
    
    it('should use building-specific fallback colors', function() {
      const view = new BuildingView();
      
      // Temporarily remove sprite manager
      const originalSpriteManager = global.window.spriteManager;
      delete global.window.spriteManager;
      
      // Test AntHill color
      model.buildingType = 'AntHill';
      view.render(model, mockGraphics);
      expect(mockGraphics.fill.calledWith(139, 90, 43)).to.be.true;
      
      mockGraphics.fill.resetHistory();
      mockGraphics.rect.resetHistory();
      
      // Test Tower color
      model.buildingType = 'Tower';
      view.render(model, mockGraphics);
      expect(mockGraphics.fill.calledWith(100, 100, 150)).to.be.true;
      
      // Restore sprite manager
      global.window.spriteManager = originalSpriteManager;
    });
  });
  
  describe('Performance', function() {
    it('should render 50 buildings with different types quickly', function() {
      const view = new BuildingView();
      const models = [];
      const types = ['AntHill', 'Cone', 'Hive', 'Tower'];
      
      // Create 50 building models with varying types
      for (let i = 0; i < 50; i++) {
        models.push(new BuildingModel({
          x: i * 20,
          y: i * 20,
          buildingType: types[i % types.length],
          level: (i % 5) + 1
        }));
      }
      
      const startTime = Date.now();
      
      // Render all buildings
      models.forEach(m => view.render(m, mockGraphics));
      
      const elapsed = Date.now() - startTime;
      
      // Should complete in under 500ms
      expect(elapsed).to.be.lessThan(500);
      
      // Verify all sprites were requested
      expect(mockSpriteManager.getSprite.callCount).to.equal(50);
    });
  });
  
});
