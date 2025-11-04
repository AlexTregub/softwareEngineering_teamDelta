/**
 * ResourceView Integration Tests
 * ------------------------------
 * Tests for ResourceView class with real p5.js rendering context.
 * 
 * ResourceView handles:
 * - Sprite rendering
 * - Resource type visualization
 * - Amount visualization (color/opacity based on depletion)
 * - Model change reactions
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Set up test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('ResourceView', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let BaseModel, BaseView, ResourceModel, ResourceView;
  
  before(function() {
    // Load classes
    BaseModel = require('../../../Classes/models/BaseModel');
    BaseView = require('../../../Classes/views/BaseView');
    ResourceModel = require('../../../Classes/models/ResourceModel');
    ResourceView = require('../../../Classes/views/ResourceView');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should extend BaseView', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model);
      
      expect(view).to.be.instanceOf(BaseView);
      expect(view).to.be.instanceOf(ResourceView);
    });
    
    it('should accept model instance', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model);
      
      expect(view.model).to.equal(model);
    });
    
    it('should accept options with imagePath', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Food' });
      const view = new ResourceView(model, { imagePath: 'Images/Resources/food.png' });
      
      expect(view._sprite).to.exist;
      expect(view._sprite.imagePath).to.equal('Images/Resources/food.png');
    });
    
    it('should create sprite with model position and size', function() {
      const model = new ResourceModel(150, 200, 48, 48, { type: 'Wood' });
      const view = new ResourceView(model, { imagePath: 'Images/Resources/wood.png' });
      
      expect(view._sprite.position.x).to.equal(150);
      expect(view._sprite.position.y).to.equal(200);
      expect(view._sprite.size.x).to.equal(48);
      expect(view._sprite.size.y).to.equal(48);
    });
  });
  
  describe('Rendering', function() {
    it('should have render method', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model);
      
      expect(view.render).to.be.a('function');
    });
    
    it('should call render without errors', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model);
      
      expect(() => view.render()).to.not.throw();
    });
    
    it('should not render if model inactive', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 10 });
      model.reduceAmount(10); // Depletes
      const view = new ResourceView(model);
      
      const renderSpy = sinon.spy(view, '_renderContent');
      view.render();
      
      expect(renderSpy.called).to.be.false;
    });
    
    it('should render sprite if present', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model, { imagePath: 'test.png' });
      
      // Mock sprite render method
      let renderCalled = false;
      view._sprite.render = () => { renderCalled = true; };
      
      view.render();
      
      expect(renderCalled).to.be.true;
    });
    
    it('should render placeholder if no sprite', function() {
      // Reset existing stub (don't create a new one)
      if (global.ellipse && global.ellipse.resetHistory) {
        global.ellipse.resetHistory();
      }
      
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model); // No imagePath
      
      view.render();
      
      // Should call p5.js rendering functions
      expect(global.ellipse.called).to.be.true;
    });
  });
  
  describe('Model Change Handling', function() {
    it('should update sprite position when model position changes', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model, { imagePath: 'test.png' });
      
      model.setPosition(200, 250);
      
      expect(view._sprite.position.x).to.equal(200);
      expect(view._sprite.position.y).to.equal(250);
    });
    
    it('should update sprite size when model size changes', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model, { imagePath: 'test.png' });
      
      model.setSize(64, 64);
      
      expect(view._sprite.size.x).to.equal(64);
      expect(view._sprite.size.y).to.equal(64);
    });
    
    it('should react to amount changes', function() {
      let changeCalled = false;
      
      class TestView extends ResourceView {
        _onModelChange(property, data, model) {
          changeCalled = true;
          super._onModelChange(property, data, model);
        }
      }
      
      const model = new ResourceModel(100, 100, 32, 32, { amount: 100 });
      const view = new TestView(model);
      
      model.reduceAmount(30);
      
      expect(changeCalled).to.be.true;
    });
    
    it('should react to depletion', function() {
      let changeCount = 0;
      
      class TestView extends ResourceView {
        _onModelChange(property, data, model) {
          changeCount++;
          super._onModelChange(property, data, model);
        }
      }
      
      const model = new ResourceModel(100, 100, 32, 32, { amount: 20 });
      const view = new TestView(model);
      
      model.reduceAmount(20);
      
      // Should receive both amount and depleted notifications
      expect(changeCount).to.equal(2);
    });
  });
  
  describe('Resource Type Visualization', function() {
    it('should use Food color when type is Food', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Food' });
      const view = new ResourceView(model);
      
      const color = view._getResourceColor();
      expect(color).to.deep.equal([255, 200, 0]); // Orange/yellow
    });
    
    it('should use Wood color when type is Wood', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Wood' });
      const view = new ResourceView(model);
      
      const color = view._getResourceColor();
      expect(color).to.deep.equal([139, 90, 43]); // Brown
    });
    
    it('should use Stone color when type is Stone', function() {
      const model = new ResourceModel(100, 100, 32, 32, { type: 'Stone' });
      const view = new ResourceView(model);
      
      const color = view._getResourceColor();
      expect(color).to.deep.equal([128, 128, 128]); // Gray
    });
  });
  
  describe('Depletion Visualization', function() {
    it('should calculate opacity based on amount remaining', function() {
      const model = new ResourceModel(100, 100, 32, 32, { amount: 100 });
      const view = new ResourceView(model);
      
      // Full amount = full opacity
      expect(view._getOpacity()).to.equal(1.0);
      
      // Half amount = half opacity
      model.reduceAmount(50);
      expect(view._getOpacity()).to.be.closeTo(0.5, 0.1);
      
      // Nearly depleted = low opacity
      model.reduceAmount(40);
      expect(view._getOpacity()).to.be.closeTo(0.1, 0.1);
    });
  });
  
  describe('Cleanup', function() {
    it('should destroy sprite on destroy', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model, { imagePath: 'test.png' });
      
      view.destroy();
      
      expect(view._sprite).to.be.null;
    });
    
    it('should call parent destroy', function() {
      const model = new ResourceModel(100, 100, 32, 32);
      const view = new ResourceView(model);
      
      view.destroy();
      
      expect(view._model).to.be.null;
    });
  });
});
