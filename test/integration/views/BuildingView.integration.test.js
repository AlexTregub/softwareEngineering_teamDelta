/**
 * BuildingView Integration Tests
 * 
 * Tests for BuildingView (MVC pattern)
 * Following TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering support
setupTestEnvironment({ rendering: true, sprite: true });

describe('BuildingView', function() {
  let BuildingModel, BuildingView, BaseView;
  
  before(function() {
    BuildingModel = require('../../../Classes/models/BuildingModel');
    BaseView = require('../../../Classes/views/BaseView');
    // BuildingView will be created after tests are written
    BuildingView = require('../../../Classes/views/BuildingView');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
    sinon.restore(); // Restore all stubs/spies
  });
  
  describe('Constructor', function() {
    it('should extend BaseView', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view).to.be.instanceOf(BaseView);
    });
    
    it('should accept model parameter', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view._model).to.equal(model);
    });
    
    it('should accept options parameter', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png', showHealthBar: false });
      expect(view._options.showHealthBar).to.be.false;
    });
    
    it('should create sprite with image path', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view._sprite).to.exist;
    });
    
    it('should default showHealthBar to true', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view._showHealthBar).to.be.true;
    });
    
    it('should accept showHealthBar option', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png', showHealthBar: false });
      expect(view._showHealthBar).to.be.false;
    });
  });
  
  describe('Model Change Reactions', function() {
    it('should react to health changes', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const renderSpy = sinon.spy(view, '_renderContent');
      
      model.takeDamage(30);
      view.render(); // Trigger render
      
      expect(renderSpy.called).to.be.true;
    });
    
    it('should react to died event', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      
      model.takeDamage(100); // Kill building
      
      // Sprite should be cleared
      expect(view._sprite).to.be.null;
    });
    
    it('should react to upgraded event', function() {
      const model = new BuildingModel(100, 100, 91, 97, {
        upgradeTree: {
          progressions: {
            1: { cost: 50 }
          }
        }
      });
      const view = new BuildingView(model, { imagePath: 'test.png' });
      
      // Trigger upgrade (view automatically receives notification via BaseView listener)
      const result = model.applyUpgrade();
      
      // Upgrade should succeed and view should handle it without error
      expect(result).to.be.true;
      expect(() => view.render()).to.not.throw();
    });
  });
  
  describe('Rendering', function() {
    it('should have render method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view.render).to.be.a('function');
    });
    
    it('should call _renderContent when active', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const renderSpy = sinon.spy(view, '_renderContent');
      
      view.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should not render when model inactive', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      model._isActive = false;
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const renderSpy = sinon.spy(view, '_renderContent');
      
      view.render();
      
      expect(renderSpy.called).to.be.false;
    });
    
    it('should render sprite when active', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const spriteSpy = sinon.spy(view._sprite, 'render');
      
      view.render();
      
      expect(spriteSpy.calledOnce).to.be.true;
    });
    
    it('should not render sprite after died', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      
      model.takeDamage(100); // Kill building
      view.render();
      
      // Should not throw error even with null sprite
      expect(() => view.render()).to.not.throw();
    });
  });
  
  describe('Health Bar Rendering', function() {
    it('should render health bar when health < max', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 50 });
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const healthBarSpy = sinon.spy(view, '_renderHealthBar');
      
      view.render();
      
      // Health bar should render when damaged
      expect(healthBarSpy.calledOnce).to.be.true;
    });
    
    it('should not render health bar when health at max', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 100 });
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const healthBarSpy = sinon.spy(view, '_renderHealthBar');
      
      view.render();
      
      // No health bar when at full health
      expect(healthBarSpy.called).to.be.false;
    });
    
    it('should not render health bar when showHealthBar is false', function() {
      const model = new BuildingModel(100, 100, 91, 97, { health: 50 });
      const view = new BuildingView(model, { imagePath: 'test.png', showHealthBar: false });
      const healthBarSpy = sinon.spy(view, '_renderHealthBar');
      
      view.render();
      
      // Should not render even when damaged
      expect(healthBarSpy.called).to.be.false;
    });
  });
  
  describe('Image Management', function() {
    it('should have setImage method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view.setImage).to.be.a('function');
    });
    
    it('should update sprite image', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const mockImage = { width: 100, height: 100 };
      
      view.setImage(mockImage);
      
      // Sprite should be updated (implementation detail)
      expect(view._sprite._image).to.equal(mockImage);
    });
    
    it('should handle setImage when sprite is null', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      view._sprite = null;
      
      expect(() => view.setImage({ width: 100, height: 100 })).to.not.throw();
    });
  });
  
  describe('Lifecycle', function() {
    it('should have destroy method', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      expect(view.destroy).to.be.a('function');
    });
    
    it('should clear sprite on destroy', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      
      view.destroy();
      
      expect(view._sprite).to.be.null;
    });
    
    it('should call parent destroy', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      const view = new BuildingView(model, { imagePath: 'test.png' });
      const parentDestroy = sinon.spy(BaseView.prototype, 'destroy');
      
      view.destroy();
      
      expect(parentDestroy.calledOnce).to.be.true;
      
      parentDestroy.restore();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle model without position', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      delete model._position;
      
      expect(() => new BuildingView(model, { imagePath: 'test.png' })).to.not.throw();
    });
    
    it('should handle missing imagePath', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      
      expect(() => new BuildingView(model, {})).to.not.throw();
    });
    
    it('should handle null options', function() {
      const model = new BuildingModel(100, 100, 91, 97);
      
      expect(() => new BuildingView(model, null)).to.not.throw();
    });
  });
});
