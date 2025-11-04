/**
 * BaseView Unit Tests
 * -------------------
 * Tests for the base view class that all MVC views will inherit from.
 * 
 * BaseView provides:
 * - Model change listener integration
 * - Rendering lifecycle
 * - Common view methods
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Set up test environment with p5.js rendering functions
setupTestEnvironment({ rendering: true });

describe('BaseView', function() {
  let BaseModel, BaseView;
  
  before(function() {
    // Load classes
    BaseModel = require('../../../Classes/models/BaseModel');
    BaseView = require('../../../Classes/views/BaseView');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should accept a model instance', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(view._model).to.equal(model);
    });
    
    it('should register as model change listener', function() {
      const model = new BaseModel();
      const addListenerSpy = sinon.spy(model, 'addChangeListener');
      
      const view = new BaseView(model);
      
      expect(addListenerSpy.calledOnce).to.be.true;
      expect(model._changeListeners.length).to.equal(1);
    });
    
    it('should throw error if no model provided', function() {
      expect(() => new BaseView()).to.throw('BaseView requires a model');
    });
    
    it('should accept options object', function() {
      const model = new BaseModel();
      const options = { testOption: 'value' };
      const view = new BaseView(model, options);
      
      expect(view._options).to.deep.equal(options);
    });
  });
  
  describe('Model Change Handling', function() {
    it('should have _onModelChange method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(view._onModelChange).to.be.a('function');
    });
    
    it('should receive model change notifications', function() {
      const model = new BaseModel();
      
      // Track if _onModelChange is called
      let changeCalled = false;
      let changeArgs = null;
      
      class TestView extends BaseView {
        _onModelChange(property, data, model) {
          changeCalled = true;
          changeArgs = { property, data, model };
        }
      }
      
      const view = new TestView(model);
      model._notifyChange('testProperty', { value: 42 });
      
      expect(changeCalled).to.be.true;
      expect(changeArgs.property).to.equal('testProperty');
      expect(changeArgs.data).to.deep.equal({ value: 42 });
      expect(changeArgs.model).to.equal(model);
    });
    
    it('should handle model changes without errors', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      // Base implementation should not throw
      expect(() => view._onModelChange('test', {}, model)).to.not.throw();
    });
  });
  
  describe('Rendering', function() {
    it('should have render method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(view.render).to.be.a('function');
    });
    
    it('should call render without errors', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(() => view.render()).to.not.throw();
    });
    
    it('should not render if model is inactive', function() {
      const model = new BaseModel();
      model.isActive = false;
      const view = new BaseView(model);
      
      const renderSpy = sinon.spy(view, '_renderContent');
      view.render();
      
      expect(renderSpy.called).to.be.false;
    });
    
    it('should render if model is active', function() {
      const model = new BaseModel();
      model.isActive = true;
      const view = new BaseView(model);
      
      const renderSpy = sinon.spy(view, '_renderContent');
      view.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
  });
  
  describe('Lifecycle', function() {
    it('should have destroy method', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(view.destroy).to.be.a('function');
    });
    
    it('should remove model listener on destroy', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(model._changeListeners.length).to.equal(1);
      
      view.destroy();
      
      expect(model._changeListeners.length).to.equal(0);
    });
    
    it('should clear model reference on destroy', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      view.destroy();
      
      expect(view._model).to.be.null;
    });
    
    it('should handle destroy without errors if already destroyed', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      view.destroy();
      
      // Second destroy should not throw
      expect(() => view.destroy()).to.not.throw();
    });
  });
  
  describe('Property Access', function() {
    it('should provide access to model', function() {
      const model = new BaseModel();
      const view = new BaseView(model);
      
      expect(view.model).to.equal(model);
    });
    
    it('should provide access to options', function() {
      const model = new BaseModel();
      const options = { color: 'red' };
      const view = new BaseView(model, options);
      
      expect(view.options).to.deep.equal(options);
    });
  });
  
  describe('Inheritance Support', function() {
    it('should be extendable by subclasses', function() {
      class TestView extends BaseView {
        constructor(model, options) {
          super(model, options);
          this._customProperty = 'test';
        }
        
        _renderContent() {
          // Custom rendering
        }
      }
      
      const model = new BaseModel();
      const view = new TestView(model);
      
      expect(view).to.be.instanceOf(BaseView);
      expect(view).to.be.instanceOf(TestView);
      expect(view._customProperty).to.equal('test');
    });
    
    it('should support custom _onModelChange in subclasses', function() {
      class TestView extends BaseView {
        constructor(model, options) {
          super(model, options);
          this.changeCount = 0;
        }
        
        _onModelChange(property, data, model) {
          this.changeCount++;
        }
      }
      
      const model = new BaseModel();
      const view = new TestView(model);
      
      model._notifyChange('test', {});
      expect(view.changeCount).to.equal(1);
      
      model._notifyChange('test', {});
      expect(view.changeCount).to.equal(2);
    });
    
    it('should support custom _renderContent in subclasses', function() {
      class TestView extends BaseView {
        constructor(model, options) {
          super(model, options);
          this.renderCount = 0;
        }
        
        _renderContent() {
          this.renderCount++;
        }
      }
      
      const model = new BaseModel();
      const view = new TestView(model);
      
      view.render();
      expect(view.renderCount).to.equal(1);
      
      view.render();
      expect(view.renderCount).to.equal(2);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle model with no isActive property', function() {
      const model = {};
      const view = new BaseView(model);
      
      // Should render without error
      expect(() => view.render()).to.not.throw();
    });
    
    it('should handle null options', function() {
      const model = new BaseModel();
      const view = new BaseView(model, null);
      
      expect(view._options).to.be.null;
    });
    
    it('should handle undefined options', function() {
      const model = new BaseModel();
      const view = new BaseView(model, undefined);
      
      expect(view._options).to.be.undefined;
    });
  });
});
