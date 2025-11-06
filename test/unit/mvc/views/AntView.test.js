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
    // Return mock sprite objects
    return {
      name: spriteName,
      width: 32,
      height: 32,
      image: { _mockImage: spriteName } // Mock p5.Image
    };
  })
};

// Make sprite manager available globally
global.window.spriteManager = mockSpriteManager;

// Import classes
const AntModel = require('../../../../Classes/mvc/models/AntModel');
const AntView = require('../../../../Classes/mvc/views/AntView');

describe('AntView', function() {
  let mockGraphics;
  let model;
  
  beforeEach(function() {
    mockGraphics = createMockGraphics();
    mockSpriteManager.getSprite.resetHistory();
    
    model = new AntModel({
      position: { x: 100, y: 200 },
      jobName: 'Scout',
      health: 100,
      maxHealth: 100
    });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create an AntView', function() {
      const view = new AntView();
      expect(view).to.exist;
    });
    
    it('should extend EntityView', function() {
      const view = new AntView();
      expect(view.render).to.be.a('function');
    });
  });
  
  describe('Job-Specific Sprites', function() {
    it('should render Scout sprite for Scout ant', function() {
      const view = new AntView();
      model.jobName = 'Scout';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_scout')).to.be.true;
      expect(mockGraphics.image.called).to.be.true;
    });
    
    it('should render Warrior sprite for Warrior ant', function() {
      const view = new AntView();
      model.jobName = 'Warrior';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_warrior')).to.be.true;
    });
    
    it('should render Builder sprite for Builder ant', function() {
      const view = new AntView();
      model.jobName = 'Builder';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_builder')).to.be.true;
    });
    
    it('should render Farmer sprite for Farmer ant', function() {
      const view = new AntView();
      model.jobName = 'Farmer';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_farmer')).to.be.true;
    });
    
    it('should render Spitter sprite for Spitter ant', function() {
      const view = new AntView();
      model.jobName = 'Spitter';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_spitter')).to.be.true;
    });
    
    it('should render Queen sprite for Queen ant', function() {
      const view = new AntView();
      model.jobName = 'Queen';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_queen')).to.be.true;
    });
    
    it('should fallback to default sprite for unknown job', function() {
      const view = new AntView();
      model.jobName = 'UnknownJob';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('ant_scout')).to.be.true; // Default
    });
  });
  
  describe('Faction Colors', function() {
    it('should apply player faction tint (default - no tint)', function() {
      const view = new AntView();
      model.faction = 'player';
      
      view.render(model, mockGraphics);
      
      // Player faction: no tint (default sprites)
      expect(mockGraphics.noTint.called).to.be.true;
    });
    
    it('should apply enemy faction tint (red)', function() {
      const view = new AntView();
      model.faction = 'enemy';
      
      view.render(model, mockGraphics);
      
      // Enemy faction: red tint
      expect(mockGraphics.tint.calledWith(255, 100, 100)).to.be.true;
    });
    
    it('should apply neutral faction tint (gray)', function() {
      const view = new AntView();
      model.faction = 'neutral';
      
      view.render(model, mockGraphics);
      
      // Neutral faction: gray tint
      expect(mockGraphics.tint.calledWith(150, 150, 150)).to.be.true;
    });
  });
  
  describe('Health Bar Rendering', function() {
    it('should render health bar when health is below max', function() {
      const view = new AntView();
      model.health = 50;
      model.maxHealth = 100;
      
      view.render(model, mockGraphics);
      
      // Should draw health bar background (red)
      expect(mockGraphics.fill.calledWith(255, 0, 0)).to.be.true;
      
      // Should draw health bar foreground (green)
      expect(mockGraphics.fill.calledWith(0, 255, 0)).to.be.true;
      
      // Should draw two rectangles (background + foreground)
      expect(mockGraphics.rect.callCount).to.be.at.least(2);
    });
    
    it('should not render health bar when at full health', function() {
      const view = new AntView();
      model.health = 100;
      model.maxHealth = 100;
      
      view.render(model, mockGraphics);
      
      // Should not draw health bar rectangles
      const redFillCalls = mockGraphics.fill.getCalls().filter(
        call => call.args[0] === 255 && call.args[1] === 0 && call.args[2] === 0
      );
      expect(redFillCalls.length).to.equal(0);
    });
    
    it('should calculate health bar width proportionally', function() {
      const view = new AntView();
      model.health = 25;
      model.maxHealth = 100;
      
      view.render(model, mockGraphics);
      
      // Health bar should be 25% of full width
      // Model size is 32x32, health bar width should be ~28px (32 - 4px padding)
      // At 25% health: 28 * 0.25 = 7px
      const rectCalls = mockGraphics.rect.getCalls();
      const healthBarCall = rectCalls.find(call => call.args[2] === 7); // Width of 7
      expect(healthBarCall).to.exist;
    });
  });
  
  describe('Selection Highlighting', function() {
    it('should render selection ring when ant is selected', function() {
      const view = new AntView();
      model.isSelected = true;
      
      view.render(model, mockGraphics);
      
      // Should draw selection ellipse
      expect(mockGraphics.ellipse.called).to.be.true;
      
      // Should use yellow stroke for selection
      expect(mockGraphics.stroke.calledWith(255, 255, 0)).to.be.true;
    });
    
    it('should not render selection ring when ant is not selected', function() {
      const view = new AntView();
      model.isSelected = false;
      
      view.render(model, mockGraphics);
      
      // Should not draw selection ellipse
      const yellowStrokeCalls = mockGraphics.stroke.getCalls().filter(
        call => call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowStrokeCalls.length).to.equal(0);
    });
  });
  
  describe('Sprite Positioning', function() {
    it('should center sprite at model position', function() {
      const view = new AntView();
      model.setPosition(100, 200);
      
      view.render(model, mockGraphics);
      
      // Should set imageMode to CENTER
      expect(mockGraphics.imageMode.called).to.be.true;
      
      // Should draw image at model position
      const imageCall = mockGraphics.image.firstCall;
      expect(imageCall.args[1]).to.equal(100); // x
      expect(imageCall.args[2]).to.equal(200); // y
    });
    
    it('should scale sprite to model size', function() {
      const view = new AntView();
      model.setSize(64, 64); // Larger than default
      
      view.render(model, mockGraphics);
      
      // Should draw image with model dimensions
      const imageCall = mockGraphics.image.firstCall;
      expect(imageCall.args[3]).to.equal(64); // width
      expect(imageCall.args[4]).to.equal(64); // height
    });
  });
  
  describe('Disabled Ant Rendering', function() {
    it('should not render disabled ant', function() {
      const view = new AntView();
      model.enabled = false;
      
      view.render(model, mockGraphics);
      
      // Should not draw anything
      expect(mockGraphics.image.called).to.be.false;
      expect(mockSpriteManager.getSprite.called).to.be.false;
    });
  });
  
  describe('Fallback Rendering (No Sprite Manager)', function() {
    it('should render colored rectangle when sprite manager unavailable', function() {
      const view = new AntView();
      
      // Temporarily remove sprite manager
      const originalSpriteManager = global.window.spriteManager;
      delete global.window.spriteManager;
      
      view.render(model, mockGraphics);
      
      // Should draw rectangle instead of sprite
      expect(mockGraphics.rect.called).to.be.true;
      
      // Should use job-specific color
      expect(mockGraphics.fill.called).to.be.true;
      
      // Restore sprite manager
      global.window.spriteManager = originalSpriteManager;
    });
  });
  
  describe('Performance', function() {
    it('should render 100 ants with different jobs quickly', function() {
      const view = new AntView();
      const models = [];
      const jobs = ['Scout', 'Warrior', 'Builder', 'Farmer', 'Spitter', 'Queen'];
      
      // Create 100 ant models with varying jobs
      for (let i = 0; i < 100; i++) {
        models.push(new AntModel({
          position: { x: i * 10, y: i * 10 },
          jobName: jobs[i % jobs.length]
        }));
      }
      
      const startTime = Date.now();
      
      // Render all ants
      models.forEach(m => view.render(m, mockGraphics));
      
      const elapsed = Date.now() - startTime;
      
      // Should complete in under 500ms
      expect(elapsed).to.be.lessThan(500);
      
      // Verify all sprites were requested
      expect(mockSpriteManager.getSprite.callCount).to.equal(100);
    });
  });
  
});
