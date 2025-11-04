/**
 * BaseController Unit Tests
 * -------------------------
 * Tests for the base controller class that all MVC controllers will inherit from.
 * 
 * BaseController provides:
 * - Coordination between model and view
 * - Input handling integration
 * - Lifecycle management
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadMVCBaseClasses } = require('../../helpers/mvcTestHelpers');

// Set up test environment
setupTestEnvironment();

describe('BaseController', function() {
  let BaseModel, BaseView, BaseController;
  
  before(function() {
    // Load classes
    const classes = loadMVCBaseClasses();
    BaseModel = classes.BaseModel;
    BaseView = classes.BaseView;
    BaseController = classes.BaseController;
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should accept model and view instances', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller._model).to.equal(model);
      expect(controller._view).to.equal(view);
    });
    
    it('should throw error if no model provided', function() {
      expect(() => new BaseController()).to.throw('BaseController requires a model and view');
    });
    
    it('should throw error if no view provided', function() {
      const model = new BaseModel();
      expect(() => new BaseController(model)).to.throw('BaseController requires a model and view');
    });
    
    it('should accept options object', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const options = { testOption: 'value' };
      const controller = new BaseController(model, view, options);
      
      expect(controller._options).to.deep.equal(options);
    });
  });
  
  describe('Property Access', function() {
    it('should provide access to model', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller.model).to.equal(model);
    });
    
    it('should provide access to view', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller.view).to.equal(view);
    });
    
    it('should provide access to options', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const options = { color: 'red' };
      const controller = new BaseController(model, view, options);
      
      expect(controller.options).to.deep.equal(options);
    });
  });
  
  describe('Update/Render Lifecycle', function() {
    it('should have update method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller.update).to.be.a('function');
    });
    
    it('should delegate update to model', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      const updateSpy = sinon.spy(model, 'update');
      controller.update(16.67);
      
      expect(updateSpy.calledOnce).to.be.true;
      expect(updateSpy.firstCall.args[0]).to.equal(16.67);
    });
    
    it('should have render method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller.render).to.be.a('function');
    });
    
    it('should delegate render to view', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      const renderSpy = sinon.spy(view, 'render');
      controller.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should not update if model is inactive', function() {
      const model = new BaseModel();
      model.isActive = false;
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      const updateSpy = sinon.spy(model, 'update');
      controller.update(16.67);
      
      expect(updateSpy.called).to.be.false;
    });
    
    it('should not render if model is inactive', function() {
      const model = new BaseModel();
      model.isActive = false;
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      const renderSpy = sinon.spy(view, 'render');
      controller.render();
      
      expect(renderSpy.called).to.be.false;
    });
  });
  
  describe('Input Handling', function() {
    it('should have handleInput method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller.handleInput).to.be.a('function');
    });
    
    it('should call handleInput without errors', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(() => controller.handleInput('click', {})).to.not.throw();
    });
  });
  
  describe('Lifecycle', function() {
    it('should have destroy method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      expect(controller.destroy).to.be.a('function');
    });
    
    it('should destroy model on controller destroy', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      const destroySpy = sinon.spy(model, 'destroy');
      controller.destroy();
      
      expect(destroySpy.calledOnce).to.be.true;
    });
    
    it('should destroy view on controller destroy', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      const destroySpy = sinon.spy(view, 'destroy');
      controller.destroy();
      
      expect(destroySpy.calledOnce).to.be.true;
    });
    
    it('should clear references on destroy', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      controller.destroy();
      
      expect(controller._model).to.be.null;
      expect(controller._view).to.be.null;
    });
    
    it('should handle destroy without errors if already destroyed', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view);
      
      controller.destroy();
      
      // Second destroy should not throw
      expect(() => controller.destroy()).to.not.throw();
    });
  });
  
  describe('Inheritance Support', function() {
    it('should be extendable by subclasses', function() {
      class TestController extends BaseController {
        constructor(model, view, options) {
          super(model, view, options);
          this._customProperty = 'test';
        }
      }
      
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new TestController(model, view);
      
      expect(controller).to.be.instanceOf(BaseController);
      expect(controller).to.be.instanceOf(TestController);
      expect(controller._customProperty).to.equal('test');
    });
    
    it('should support custom handleInput in subclasses', function() {
      class TestController extends BaseController {
        constructor(model, view, options) {
          super(model, view, options);
          this.inputCount = 0;
        }
        
        handleInput(type, data) {
          this.inputCount++;
        }
      }
      
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new TestController(model, view);
      
      controller.handleInput('click', {});
      expect(controller.inputCount).to.equal(1);
      
      controller.handleInput('hover', {});
      expect(controller.inputCount).to.equal(2);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null options', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view, null);
      
      expect(controller._options).to.be.null;
    });
    
    it('should handle undefined options', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      const controller = new BaseController(model, view, undefined);
      
      expect(controller._options).to.be.undefined;
    });
  });
});
