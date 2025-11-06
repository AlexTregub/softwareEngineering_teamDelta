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
      width: 16,
      height: 16,
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
const ResourceModel = require('../../../../Classes/mvc/models/ResourceModel');
const ResourceView = require('../../../../Classes/mvc/views/ResourceView');

describe('ResourceView', function() {
  let mockGraphics;
  let model;
  
  beforeEach(function() {
    mockGraphics = createMockGraphics();
    mockSpriteManager.getSprite.resetHistory();
    
    model = new ResourceModel({
      x: 100,
      y: 200,
      resourceType: 'greenLeaf',
      amount: 5
    });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create a ResourceView', function() {
      const view = new ResourceView();
      expect(view).to.exist;
    });
    
    it('should extend EntityView', function() {
      const view = new ResourceView();
      expect(view.render).to.be.a('function');
    });
  });
  
  describe('Resource Type Sprites', function() {
    it('should render greenLeaf sprite for greenLeaf resource', function() {
      const view = new ResourceView();
      model.resourceType = 'greenLeaf';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('resource_greenleaf')).to.be.true;
      expect(mockGraphics.image.called).to.be.true;
    });
    
    it('should render stick sprite for stick resource', function() {
      const view = new ResourceView();
      model.resourceType = 'stick';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('resource_stick')).to.be.true;
    });
    
    it('should render stone sprite for stone resource', function() {
      const view = new ResourceView();
      model.resourceType = 'stone';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('resource_stone')).to.be.true;
    });
    
    it('should render sand sprite for sand resource', function() {
      const view = new ResourceView();
      model.resourceType = 'sand';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('resource_sand')).to.be.true;
    });
    
    it('should render dirt sprite for dirt resource', function() {
      const view = new ResourceView();
      model.resourceType = 'dirt';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('resource_dirt')).to.be.true;
    });
    
    it('should fallback to greenLeaf sprite for unknown resource', function() {
      const view = new ResourceView();
      model.resourceType = 'unknownResource';
      
      view.render(model, mockGraphics);
      
      expect(mockSpriteManager.getSprite.calledWith('resource_greenleaf')).to.be.true;
    });
  });
  
  describe('Amount Display', function() {
    it('should render amount text overlay', function() {
      const view = new ResourceView();
      model.amount = 10;
      
      view.render(model, mockGraphics);
      
      // Should render text with amount
      expect(mockGraphics.text.calledWith('10')).to.be.true;
    });
    
    it('should position amount text in bottom-right corner', function() {
      const view = new ResourceView();
      model.amount = 5;
      
      view.render(model, mockGraphics);
      
      // Should set text alignment
      expect(mockGraphics.textAlign.called).to.be.true;
      
      // Should render text near resource position
      const textCall = mockGraphics.text.firstCall;
      expect(textCall.args[0]).to.equal('5'); // Amount
    });
    
    it('should not render amount if amount is 1 (single resource)', function() {
      const view = new ResourceView();
      model.amount = 1;
      
      view.render(model, mockGraphics);
      
      // Should not render amount text for single resources
      const textCalls = mockGraphics.text.getCalls().filter(
        call => call.args[0] === '1'
      );
      expect(textCalls.length).to.equal(0);
    });
    
    it('should handle large amounts (99+)', function() {
      const view = new ResourceView();
      model.amount = 150;
      
      view.render(model, mockGraphics);
      
      // Should render "99+" for amounts over 99
      expect(mockGraphics.text.calledWith('99+')).to.be.true;
    });
  });
  
  describe('Carried State', function() {
    it('should apply transparency when resource is carried', function() {
      const view = new ResourceView();
      model.carriedBy = 'ant_123';
      
      view.render(model, mockGraphics);
      
      // Should apply tint with transparency
      const tintCalls = mockGraphics.tint.getCalls();
      const transparentTint = tintCalls.find(call => call.args[3] === 128); // 50% alpha
      expect(transparentTint).to.exist;
    });
    
    it('should not apply transparency when resource is not carried', function() {
      const view = new ResourceView();
      model.carriedBy = null;
      
      view.render(model, mockGraphics);
      
      // Should use noTint or full opacity
      expect(mockGraphics.noTint.called).to.be.true;
    });
  });
  
  describe('Sprite Positioning', function() {
    it('should center sprite at model position', function() {
      const view = new ResourceView();
      model.setPosition(150, 250);
      
      view.render(model, mockGraphics);
      
      // Should set imageMode to CENTER
      expect(mockGraphics.imageMode.called).to.be.true;
      
      // Should draw image at model position
      const imageCall = mockGraphics.image.firstCall;
      expect(imageCall.args[1]).to.equal(150); // x
      expect(imageCall.args[2]).to.equal(250); // y
    });
    
    it('should scale sprite to model size', function() {
      const view = new ResourceView();
      model.setSize(24, 24);
      
      view.render(model, mockGraphics);
      
      // Should draw image with model dimensions
      const imageCall = mockGraphics.image.firstCall;
      expect(imageCall.args[3]).to.equal(24); // width
      expect(imageCall.args[4]).to.equal(24); // height
    });
  });
  
  describe('Disabled Resource Rendering', function() {
    it('should not render disabled resource', function() {
      const view = new ResourceView();
      model.enabled = false;
      
      view.render(model, mockGraphics);
      
      // Should not draw anything
      expect(mockGraphics.image.called).to.be.false;
      expect(mockSpriteManager.getSprite.called).to.be.false;
    });
  });
  
  describe('Fallback Rendering (No Sprite Manager)', function() {
    it('should render colored circle when sprite manager unavailable', function() {
      const view = new ResourceView();
      
      // Temporarily remove sprite manager
      const originalSpriteManager = global.window.spriteManager;
      delete global.window.spriteManager;
      
      view.render(model, mockGraphics);
      
      // Should draw ellipse instead of sprite
      expect(mockGraphics.ellipse.called).to.be.true;
      
      // Should use resource-specific color
      expect(mockGraphics.fill.called).to.be.true;
      
      // Restore sprite manager
      global.window.spriteManager = originalSpriteManager;
    });
    
    it('should use resource-specific fallback colors', function() {
      const view = new ResourceView();
      
      // Temporarily remove sprite manager
      const originalSpriteManager = global.window.spriteManager;
      delete global.window.spriteManager;
      
      // Test greenLeaf color
      model.resourceType = 'greenLeaf';
      view.render(model, mockGraphics);
      expect(mockGraphics.fill.calledWith(100, 200, 100)).to.be.true;
      
      mockGraphics.fill.resetHistory();
      mockGraphics.ellipse.resetHistory();
      
      // Test stone color
      model.resourceType = 'stone';
      view.render(model, mockGraphics);
      expect(mockGraphics.fill.calledWith(128, 128, 128)).to.be.true;
      
      // Restore sprite manager
      global.window.spriteManager = originalSpriteManager;
    });
  });
  
  describe('Performance', function() {
    it('should render 100 resources with different types quickly', function() {
      const view = new ResourceView();
      const models = [];
      const types = ['greenLeaf', 'stick', 'stone', 'sand', 'dirt'];
      
      // Create 100 resource models with varying types
      for (let i = 0; i < 100; i++) {
        models.push(new ResourceModel({
          x: i * 10,
          y: i * 10,
          resourceType: types[i % types.length],
          amount: (i % 10) + 1
        }));
      }
      
      const startTime = Date.now();
      
      // Render all resources
      models.forEach(m => view.render(m, mockGraphics));
      
      const elapsed = Date.now() - startTime;
      
      // Should complete in under 500ms
      expect(elapsed).to.be.lessThan(500);
      
      // Verify all sprites were requested
      expect(mockSpriteManager.getSprite.callCount).to.equal(100);
    });
  });
  
});
