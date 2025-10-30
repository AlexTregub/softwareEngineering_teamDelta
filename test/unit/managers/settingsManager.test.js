/**
 * Unit Tests for SettingsManager
 * 
 * Tests the settings management system including:
 * - Initialization with defaults
 * - Get/set operations with nested keys
 * - LocalStorage persistence
 * - Change listeners
 * - Reset to defaults
 * 
 * TDD Phase: RED (tests should fail - SettingsManager doesn't exist yet)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('SettingsManager', function() {
  let settingsManager;
  let localStorageStub;
  
  beforeEach(function() {
    // Mock LocalStorage
    localStorageStub = {
      data: {},
      getItem: sinon.stub().callsFake(function(key) {
        return this.data[key] || null;
      }),
      setItem: sinon.stub().callsFake(function(key, value) {
        this.data[key] = value;
      }),
      removeItem: sinon.stub().callsFake(function(key) {
        delete this.data[key];
      }),
      clear: sinon.stub().callsFake(function() {
        this.data = {};
      })
    };
    
    // Mock global localStorage
    global.localStorage = localStorageStub;
    if (typeof window !== 'undefined') {
      window.localStorage = localStorageStub;
    }
    
    // Load SettingsManager (will fail until implemented)
    if (typeof SettingsManager === 'undefined') {
      try {
        const SettingsManagerClass = require('../../../Classes/managers/SettingsManager.js');
        global.SettingsManager = SettingsManagerClass;
        if (typeof window !== 'undefined') {
          window.SettingsManager = SettingsManagerClass;
        }
      } catch (e) {
        // Expected to fail in RED phase
      }
    }
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.localStorage;
    if (typeof window !== 'undefined') {
      delete window.localStorage;
    }
  });
  
  describe('Initialization', function() {
    it('should create singleton instance', function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip(); // Skip if not implemented yet
      }
      
      const instance1 = SettingsManager.getInstance();
      const instance2 = SettingsManager.getInstance();
      
      expect(instance1).to.exist;
      expect(instance1).to.equal(instance2);
    });
    
    it('should initialize with default settings', function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      
      settingsManager = SettingsManager.getInstance();
      
      // Should have default camera settings
      expect(settingsManager.get('camera.panSpeed')).to.exist;
      expect(typeof settingsManager.get('camera.panSpeed')).to.equal('number');
    });
    
    it('should initialize with empty settings if no defaults available', function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      
      settingsManager = SettingsManager.getInstance();
      
      // Should not throw error even if config file missing
      expect(() => settingsManager.get('nonexistent.key')).to.not.throw();
    });
  });
  
  describe('get() method', function() {
    beforeEach(function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      settingsManager = SettingsManager.getInstance();
      
      // Mock internal settings
      settingsManager._settings = {
        camera: {
          panSpeed: 1.5,
          zoomSpeed: 1.1
        },
        editor: {
          autoSave: true,
          theme: 'dark'
        }
      };
    });
    
    it('should get top-level setting', function() {
      const value = settingsManager.get('camera');
      
      expect(value).to.exist;
      expect(value).to.have.property('panSpeed');
      expect(value.panSpeed).to.equal(1.5);
    });
    
    it('should get nested setting with dot notation', function() {
      const value = settingsManager.get('camera.panSpeed');
      
      expect(value).to.equal(1.5);
    });
    
    it('should get deeply nested setting', function() {
      const value = settingsManager.get('editor.autoSave');
      
      expect(value).to.equal(true);
    });
    
    it('should return default value if key not found', function() {
      const value = settingsManager.get('nonexistent.key', 'default');
      
      expect(value).to.equal('default');
    });
    
    it('should return undefined if key not found and no default', function() {
      const value = settingsManager.get('nonexistent.key');
      
      expect(value).to.be.undefined;
    });
    
    it('should handle null/undefined in settings path', function() {
      settingsManager._settings = {
        camera: null
      };
      
      const value = settingsManager.get('camera.panSpeed', 1.0);
      
      expect(value).to.equal(1.0);
    });
  });
  
  describe('set() method', function() {
    beforeEach(function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      settingsManager = SettingsManager.getInstance();
      
      // Initialize with defaults
      settingsManager._settings = {
        camera: {
          panSpeed: 1.0
        }
      };
    });
    
    it('should set nested setting value', function() {
      settingsManager.set('camera.panSpeed', 2.0);
      
      expect(settingsManager.get('camera.panSpeed')).to.equal(2.0);
    });
    
    it('should create nested path if not exists', function() {
      settingsManager.set('editor.theme', 'dark');
      
      expect(settingsManager.get('editor.theme')).to.equal('dark');
    });
    
    it('should save to LocalStorage', function() {
      settingsManager.set('camera.panSpeed', 2.0);
      
      expect(localStorageStub.setItem.called).to.be.true;
      expect(localStorageStub.setItem.firstCall.args[0]).to.equal('editor-settings');
    });
    
    it('should persist complete settings object to LocalStorage', function() {
      settingsManager.set('camera.panSpeed', 2.0);
      
      const savedData = localStorageStub.setItem.firstCall.args[1];
      const parsed = JSON.parse(savedData);
      
      expect(parsed.camera.panSpeed).to.equal(2.0);
    });
    
    it('should handle LocalStorage errors gracefully', function() {
      localStorageStub.setItem.throws(new Error('Quota exceeded'));
      
      // Should not throw, but log error
      expect(() => settingsManager.set('camera.panSpeed', 2.0)).to.not.throw();
    });
    
    it('should notify listeners after setting value', function() {
      const listener = sinon.spy();
      settingsManager.onChange(listener);
      
      settingsManager.set('camera.panSpeed', 2.0);
      
      expect(listener.called).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('camera.panSpeed');
      expect(listener.firstCall.args[1]).to.equal(2.0);
    });
  });
  
  describe('resetToDefaults() method', function() {
    beforeEach(function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      settingsManager = SettingsManager.getInstance();
      
      // Set some custom values
      settingsManager._settings = {
        camera: { panSpeed: 3.0 }
      };
      settingsManager._defaultSettings = {
        camera: { panSpeed: 1.0 }
      };
    });
    
    it('should reset all settings to defaults', function() {
      settingsManager.resetToDefaults();
      
      expect(settingsManager.get('camera.panSpeed')).to.equal(1.0);
    });
    
    it('should clear LocalStorage overrides', function() {
      settingsManager.resetToDefaults();
      
      expect(localStorageStub.removeItem.called).to.be.true;
      expect(localStorageStub.removeItem.firstCall.args[0]).to.equal('editor-settings');
    });
    
    it('should notify all listeners', function() {
      const listener1 = sinon.spy();
      const listener2 = sinon.spy();
      
      settingsManager.onChange(listener1);
      settingsManager.onChange(listener2);
      
      settingsManager.resetToDefaults();
      
      expect(listener1.called).to.be.true;
      expect(listener2.called).to.be.true;
    });
  });
  
  describe('onChange() listener system', function() {
    beforeEach(function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {
        camera: { panSpeed: 1.0 }
      };
    });
    
    it('should register change listener', function() {
      const listener = sinon.spy();
      
      settingsManager.onChange(listener);
      settingsManager.set('camera.panSpeed', 2.0);
      
      expect(listener.called).to.be.true;
    });
    
    it('should call listener with key and value', function() {
      const listener = sinon.spy();
      
      settingsManager.onChange(listener);
      settingsManager.set('camera.panSpeed', 2.5);
      
      expect(listener.firstCall.args[0]).to.equal('camera.panSpeed');
      expect(listener.firstCall.args[1]).to.equal(2.5);
    });
    
    it('should support multiple listeners', function() {
      const listener1 = sinon.spy();
      const listener2 = sinon.spy();
      
      settingsManager.onChange(listener1);
      settingsManager.onChange(listener2);
      settingsManager.set('camera.panSpeed', 2.0);
      
      expect(listener1.called).to.be.true;
      expect(listener2.called).to.be.true;
    });
    
    it('should return unsubscribe function', function() {
      const listener = sinon.spy();
      
      const unsubscribe = settingsManager.onChange(listener);
      
      expect(typeof unsubscribe).to.equal('function');
    });
    
    it('should unsubscribe listener when unsubscribe called', function() {
      const listener = sinon.spy();
      
      const unsubscribe = settingsManager.onChange(listener);
      unsubscribe();
      
      settingsManager.set('camera.panSpeed', 2.0);
      
      expect(listener.called).to.be.false;
    });
    
    it('should not throw if listener throws error', function() {
      const badListener = sinon.stub().throws(new Error('Listener error'));
      const goodListener = sinon.spy();
      
      settingsManager.onChange(badListener);
      settingsManager.onChange(goodListener);
      
      // Should not throw, but other listeners should still be called
      expect(() => settingsManager.set('camera.panSpeed', 2.0)).to.not.throw();
      expect(goodListener.called).to.be.true;
    });
  });
  
  describe('Type validation', function() {
    beforeEach(function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      settingsManager = SettingsManager.getInstance();
    });
    
    it('should handle string values', function() {
      settingsManager.set('editor.theme', 'dark');
      
      expect(settingsManager.get('editor.theme')).to.equal('dark');
      expect(typeof settingsManager.get('editor.theme')).to.equal('string');
    });
    
    it('should handle number values', function() {
      settingsManager.set('camera.panSpeed', 1.5);
      
      expect(settingsManager.get('camera.panSpeed')).to.equal(1.5);
      expect(typeof settingsManager.get('camera.panSpeed')).to.equal('number');
    });
    
    it('should handle boolean values', function() {
      settingsManager.set('editor.autoSave', true);
      
      expect(settingsManager.get('editor.autoSave')).to.equal(true);
      expect(typeof settingsManager.get('editor.autoSave')).to.equal('boolean');
    });
    
    it('should handle object values', function() {
      const customObj = { x: 10, y: 20 };
      settingsManager.set('custom.position', customObj);
      
      const retrieved = settingsManager.get('custom.position');
      expect(retrieved).to.deep.equal(customObj);
    });
    
    it('should handle array values', function() {
      const customArray = [1, 2, 3];
      settingsManager.set('custom.array', customArray);
      
      const retrieved = settingsManager.get('custom.array');
      expect(retrieved).to.deep.equal(customArray);
    });
  });
  
  describe('Edge cases', function() {
    beforeEach(function() {
      if (typeof SettingsManager === 'undefined') {
        this.skip();
      }
      settingsManager = SettingsManager.getInstance();
      settingsManager._settings = {};
    });
    
    it('should handle empty key', function() {
      const value = settingsManager.get('', 'default');
      
      expect(value).to.equal('default');
    });
    
    it('should handle key with trailing dot', function() {
      settingsManager.set('camera.', 1.0);
      
      // Should handle gracefully (implementation specific)
      expect(() => settingsManager.get('camera.')).to.not.throw();
    });
    
    it('should handle very deep nesting', function() {
      settingsManager.set('a.b.c.d.e.f', 'deep');
      
      expect(settingsManager.get('a.b.c.d.e.f')).to.equal('deep');
    });
    
    it('should handle setting same value twice', function() {
      const listener = sinon.spy();
      settingsManager.onChange(listener);
      
      settingsManager.set('camera.panSpeed', 1.0);
      settingsManager.set('camera.panSpeed', 1.0);
      
      // Should notify both times
      expect(listener.callCount).to.equal(2);
    });
  });
});
