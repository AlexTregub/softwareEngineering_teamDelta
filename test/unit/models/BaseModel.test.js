/**
 * BaseModel Unit Tests
 * --------------------
 * Tests for the base model class that all MVC models will inherit from.
 * 
 * BaseModel provides:
 * - Change notification system (observer pattern)
 * - Serialization (toJSON/fromJSON)
 * - Common model lifecycle methods
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Set up test environment (JSDOM + p5.js globals + CollisionBox2D)
setupTestEnvironment();

describe('BaseModel', function() {
  let BaseModel;
  
  before(function() {
    // Load BaseModel class
    BaseModel = require('../../../Classes/models/BaseModel');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should initialize with empty change listeners array', function() {
      const model = new BaseModel();
      expect(model._changeListeners).to.be.an('array');
      expect(model._changeListeners.length).to.equal(0);
    });
    
    it('should be active by default', function() {
      const model = new BaseModel();
      expect(model.isActive).to.be.true;
    });
  });
  
  describe('Change Notification System', function() {
    it('should add change listener', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      expect(model._changeListeners.length).to.equal(1);
      expect(model._changeListeners[0]).to.equal(listener);
    });
    
    it('should remove change listener', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      expect(model._changeListeners.length).to.equal(1);
      
      model.removeChangeListener(listener);
      expect(model._changeListeners.length).to.equal(0);
    });
    
    it('should notify all listeners when property changes', function() {
      const model = new BaseModel();
      const listener1 = sinon.spy();
      const listener2 = sinon.spy();
      
      model.addChangeListener(listener1);
      model.addChangeListener(listener2);
      
      model._notifyChange('testProperty', { value: 42 });
      
      expect(listener1.calledOnce).to.be.true;
      expect(listener2.calledOnce).to.be.true;
      
      // Check arguments
      expect(listener1.firstCall.args[0]).to.equal('testProperty');
      expect(listener1.firstCall.args[1]).to.deep.equal({ value: 42 });
      expect(listener1.firstCall.args[2]).to.equal(model);
    });
    
    it('should handle listener errors gracefully', function() {
      const model = new BaseModel();
      const errorListener = sinon.stub().throws(new Error('Listener error'));
      const goodListener = sinon.spy();
      
      model.addChangeListener(errorListener);
      model.addChangeListener(goodListener);
      
      // Should not throw
      expect(() => model._notifyChange('test', {})).to.not.throw();
      
      // Good listener should still be called
      expect(goodListener.calledOnce).to.be.true;
    });
    
    it('should not call removed listeners', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.removeChangeListener(listener);
      model._notifyChange('test', {});
      
      expect(listener.called).to.be.false;
    });
  });
  
  describe('Serialization', function() {
    it('should serialize to JSON with base properties', function() {
      const model = new BaseModel();
      const json = model.toJSON();
      
      expect(json).to.be.an('object');
      expect(json.isActive).to.equal(true);
    });
    
    it('should deserialize from JSON', function() {
      const json = { isActive: false };
      const model = BaseModel.fromJSON(json);
      
      expect(model).to.be.instanceOf(BaseModel);
      expect(model.isActive).to.equal(false);
    });
    
    it('should handle missing properties in JSON', function() {
      const json = {};
      const model = BaseModel.fromJSON(json);
      
      expect(model).to.be.instanceOf(BaseModel);
      expect(model.isActive).to.equal(true); // Default value
    });
  });
  
  describe('Lifecycle', function() {
    it('should have update method', function() {
      const model = new BaseModel();
      expect(model.update).to.be.a('function');
    });
    
    it('should call update without errors', function() {
      const model = new BaseModel();
      expect(() => model.update(16.67)).to.not.throw();
    });
    
    it('should have destroy method', function() {
      const model = new BaseModel();
      expect(model.destroy).to.be.a('function');
    });
    
    it('should clear listeners on destroy', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.destroy();
      
      expect(model._changeListeners.length).to.equal(0);
    });
    
    it('should set isActive to false on destroy', function() {
      const model = new BaseModel();
      model.destroy();
      
      expect(model.isActive).to.be.false;
    });
  });
  
  describe('Property Access', function() {
    it('should have isActive getter', function() {
      const model = new BaseModel();
      expect(model.isActive).to.equal(true);
    });
    
    it('should have isActive setter', function() {
      const model = new BaseModel();
      model.isActive = false;
      expect(model.isActive).to.equal(false);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding same listener multiple times', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.addChangeListener(listener);
      
      expect(model._changeListeners.length).to.equal(2);
    });
    
    it('should handle removing listener that was never added', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      expect(() => model.removeChangeListener(listener)).to.not.throw();
      expect(model._changeListeners.length).to.equal(0);
    });
    
    it('should handle notifyChange with no listeners', function() {
      const model = new BaseModel();
      expect(() => model._notifyChange('test', {})).to.not.throw();
    });
    
    it('should handle notifyChange with undefined data', function() {
      const model = new BaseModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model._notifyChange('test', undefined);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[1]).to.be.undefined;
    });
  });
  
  describe('Inheritance Support', function() {
    it('should be extendable by subclasses', function() {
      class TestModel extends BaseModel {
        constructor() {
          super();
          this._testProperty = 'test';
        }
        
        get testProperty() { return this._testProperty; }
        set testProperty(value) {
          if (this._testProperty !== value) {
            this._testProperty = value;
            this._notifyChange('testProperty', { value });
          }
        }
      }
      
      const model = new TestModel();
      expect(model).to.be.instanceOf(BaseModel);
      expect(model).to.be.instanceOf(TestModel);
      expect(model.testProperty).to.equal('test');
    });
    
    it('should support change notifications in subclasses', function() {
      class TestModel extends BaseModel {
        constructor() {
          super();
          this._value = 0;
        }
        
        setValue(value) {
          this._value = value;
          this._notifyChange('value', { value });
        }
      }
      
      const model = new TestModel();
      const listener = sinon.spy();
      
      model.addChangeListener(listener);
      model.setValue(42);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('value');
      expect(listener.firstCall.args[1]).to.deep.equal({ value: 42 });
    });
  });
});
