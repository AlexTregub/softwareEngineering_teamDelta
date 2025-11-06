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
    // Track state
    _fillColor: null,
    _strokeColor: null
  };
}

// Import classes
const EntityModel = require('../../../../Classes/mvc/models/EntityModel');
const EntityView = require('../../../../Classes/mvc/views/EntityView');

describe('EntityView', function() {
  let mockGraphics;
  let model;
  
  beforeEach(function() {
    mockGraphics = createMockGraphics();
    model = new EntityModel({
      id: 'test_entity',
      type: 'Entity',
      position: { x: 100, y: 200 },
      size: { width: 32, height: 32 }
    });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create a view', function() {
      const view = new EntityView();
      expect(view).to.exist;
    });
    
    it('should be stateless (no internal state)', function() {
      const view = new EntityView();
      expect(Object.keys(view).length).to.equal(0); // No properties
    });
  });
  
  describe('render()', function() {
    it('should render a model to graphics context', function() {
      const view = new EntityView();
      view.render(model, mockGraphics);
      
      // Should call push/pop for isolated state
      expect(mockGraphics.push.calledOnce).to.be.true;
      expect(mockGraphics.pop.calledOnce).to.be.true;
      
      // Should draw a rectangle at model position
      expect(mockGraphics.rect.calledOnce).to.be.true;
      const rectArgs = mockGraphics.rect.firstCall.args;
      expect(rectArgs[0]).to.equal(100); // x
      expect(rectArgs[1]).to.equal(200); // y
      expect(rectArgs[2]).to.equal(32);  // width
      expect(rectArgs[3]).to.equal(32);  // height
    });
    
    it('should throw if model is null', function() {
      const view = new EntityView();
      expect(() => view.render(null, mockGraphics)).to.throw('EntityView.render: model is required');
    });
    
    it('should throw if graphics context is null', function() {
      const view = new EntityView();
      expect(() => view.render(model, null)).to.throw('EntityView.render: graphics context is required');
    });
    
    it('should handle disabled models (no rendering)', function() {
      model.enabled = false;
      const view = new EntityView();
      view.render(model, mockGraphics);
      
      // Should not draw anything
      expect(mockGraphics.rect.called).to.be.false;
    });
  });
  
  describe('Pure Function Behavior', function() {
    it('should produce same output for same inputs', function() {
      const view = new EntityView();
      
      // First render
      view.render(model, mockGraphics);
      const firstCallCount = mockGraphics.rect.callCount;
      const firstArgs = mockGraphics.rect.firstCall.args;
      
      // Reset mocks
      mockGraphics.rect.resetHistory();
      
      // Second render with same model
      view.render(model, mockGraphics);
      const secondCallCount = mockGraphics.rect.callCount;
      const secondArgs = mockGraphics.rect.firstCall.args;
      
      // Should be identical
      expect(firstCallCount).to.equal(secondCallCount);
      expect(firstArgs).to.deep.equal(secondArgs);
    });
    
    it('should not modify model (read-only access)', function() {
      const view = new EntityView();
      const originalPosition = { ...model.getPosition() };
      const originalSize = { ...model.getSize() };
      
      view.render(model, mockGraphics);
      
      // Model should be unchanged
      expect(model.getPosition()).to.deep.equal(originalPosition);
      expect(model.getSize()).to.deep.equal(originalSize);
    });
  });
  
  describe('Styling Options', function() {
    it('should accept custom fill color', function() {
      const view = new EntityView();
      const options = { fillColor: [255, 0, 0] }; // Red
      
      view.render(model, mockGraphics, options);
      
      expect(mockGraphics.fill.calledWith(255, 0, 0)).to.be.true;
    });
    
    it('should accept custom stroke color', function() {
      const view = new EntityView();
      const options = { strokeColor: [0, 255, 0] }; // Green
      
      view.render(model, mockGraphics, options);
      
      expect(mockGraphics.stroke.calledWith(0, 255, 0)).to.be.true;
    });
    
    it('should accept no fill', function() {
      const view = new EntityView();
      const options = { fillColor: null };
      
      view.render(model, mockGraphics, options);
      
      expect(mockGraphics.noFill.calledOnce).to.be.true;
    });
    
    it('should accept no stroke', function() {
      const view = new EntityView();
      const options = { strokeColor: null };
      
      view.render(model, mockGraphics, options);
      
      expect(mockGraphics.noStroke.calledOnce).to.be.true;
    });
  });
  
  describe('Different Model Types', function() {
    it('should render model at different position', function() {
      const view = new EntityView();
      model.setPosition(300, 400);
      
      view.render(model, mockGraphics);
      
      const rectArgs = mockGraphics.rect.firstCall.args;
      expect(rectArgs[0]).to.equal(300);
      expect(rectArgs[1]).to.equal(400);
    });
    
    it('should render model with different size', function() {
      const view = new EntityView();
      model.setSize(64, 48);
      
      view.render(model, mockGraphics);
      
      const rectArgs = mockGraphics.rect.firstCall.args;
      expect(rectArgs[2]).to.equal(64);
      expect(rectArgs[3]).to.equal(48);
    });
  });
  
  describe('Performance', function() {
    it('should render 1000 models quickly', function() {
      const view = new EntityView();
      const models = [];
      
      // Create 1000 models
      for (let i = 0; i < 1000; i++) {
        models.push(new EntityModel({
          position: { x: i * 10, y: i * 10 },
          size: { width: 32, height: 32 }
        }));
      }
      
      const startTime = Date.now();
      
      // Render all models
      models.forEach(m => view.render(m, mockGraphics));
      
      const elapsed = Date.now() - startTime;
      
      // Should complete in under 1 second (mock overhead is significant)
      expect(elapsed).to.be.lessThan(1000);
      
      // Verify all models were rendered
      expect(mockGraphics.rect.callCount).to.equal(1000);
    });
  });
  
});
