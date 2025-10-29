/**
 * Unit Tests for ShortcutManager
 * 
 * Tests the reusable shortcut registration and handling system.
 * Following TDD: Write tests FIRST, then implement.
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock global environment
global.window = global.window || {};

describe('ShortcutManager', function() {
  let ShortcutManager;
  let mockContext;
  
  beforeEach(function() {
    // Reset module cache to get fresh instance
    delete require.cache[require.resolve('../../../Classes/managers/ShortcutManager.js')];
    
    // Mock context with common methods
    mockContext = {
      getCurrentTool: sinon.stub().returns('paint'),
      getBrushSize: sinon.stub().returns(1),
      setBrushSize: sinon.stub(),
      getOpacity: sinon.stub().returns(100),
      setOpacity: sinon.stub()
    };
    
    // Load ShortcutManager
    ShortcutManager = require('../../../Classes/managers/ShortcutManager.js');
    
    // Clear any existing shortcuts using public API
    ShortcutManager.clearAll();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Singleton Pattern', function() {
    it('should return same instance on multiple calls', function() {
      const instance1 = ShortcutManager.getInstance();
      const instance2 = ShortcutManager.getInstance();
      expect(instance1).to.equal(instance2);
    });
  });
  
  describe('register()', function() {
    it('should register shortcut with valid config', function() {
      const config = {
        id: 'test-shortcut',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: sinon.stub()
      };
      
      ShortcutManager.register(config);
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.size).to.equal(1);
      expect(shortcuts.has('test-shortcut')).to.be.true;
      expect(shortcuts.get('test-shortcut').id).to.equal('test-shortcut');
    });
    
    it('should throw error if id is missing', function() {
      const config = {
        trigger: { modifier: 'shift', event: 'mousewheel' },
        tools: ['paint'],
        action: sinon.stub()
      };
      
      expect(() => ShortcutManager.register(config)).to.throw('Shortcut id is required');
    });
    
    it('should throw error if trigger is missing', function() {
      const config = {
        id: 'test-shortcut',
        tools: ['paint'],
        action: sinon.stub()
      };
      
      expect(() => ShortcutManager.register(config)).to.throw('Shortcut trigger is required');
    });
    
    it('should throw error if action is not a function', function() {
      const config = {
        id: 'test-shortcut',
        trigger: { modifier: 'shift', event: 'mousewheel' },
        tools: ['paint'],
        action: 'not a function'
      };
      
      expect(() => ShortcutManager.register(config)).to.throw('Shortcut action must be a function');
    });
    
    it('should allow registering multiple shortcuts', function() {
      ShortcutManager.register({
        id: 'shortcut-1',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: sinon.stub()
      });
      
      ShortcutManager.register({
        id: 'shortcut-2',
        trigger: { modifier: 'ctrl', event: 'keypress', key: 'z' },
        tools: ['all'],
        action: sinon.stub()
      });
      
      expect(ShortcutManager.getRegisteredShortcuts()).to.have.lengthOf(2);
    });
  });
  
  describe('unregister()', function() {
    it('should remove shortcut by id', function() {
      ShortcutManager.register({
        id: 'test-shortcut',
        trigger: { modifier: 'shift', event: 'mousewheel' },
        tools: ['paint'],
        action: sinon.stub()
      });
      
      ShortcutManager.unregister('test-shortcut');
      
      expect(ShortcutManager.getRegisteredShortcuts()).to.have.lengthOf(0);
    });
    
    it('should not throw if id does not exist', function() {
      expect(() => ShortcutManager.unregister('nonexistent')).to.not.throw();
    });
  });
  
  describe('handleMouseWheel()', function() {
    it('should trigger action when modifiers match', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: -100 }; // Negative = scroll up
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.true;
      expect(actionStub.calledOnce).to.be.true;
      expect(actionStub.firstCall.args[0]).to.equal(mockContext);
    });
    
    it('should not trigger if modifier does not match', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: -100 };
      const modifiers = { shift: false, ctrl: false, alt: false }; // No shift
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.false;
      expect(actionStub.called).to.be.false;
    });
    
    it('should not trigger if direction does not match', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: 100 }; // Positive = scroll down
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.false;
      expect(actionStub.called).to.be.false;
    });
    
    it('should not trigger if tool does not match', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('eraser'); // Different tool
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.false;
      expect(actionStub.called).to.be.false;
    });
    
    it('should trigger for "all" tools regardless of current tool', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['all'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('eraser');
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.true;
      expect(actionStub.calledOnce).to.be.true;
    });
    
    it('should trigger for multiple tools', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint', 'eraser'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('eraser');
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.true;
      expect(actionStub.calledOnce).to.be.true;
    });
    
    it('should support multiple modifiers (shift+ctrl)', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift+ctrl', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: true, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.true;
      expect(actionStub.calledOnce).to.be.true;
    });
    
    it('should not trigger if only one modifier of multiple is pressed', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift+ctrl', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: false, alt: false }; // Missing ctrl
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.false;
      expect(actionStub.called).to.be.false;
    });
    
    it('should handle scroll down direction', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'down' },
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: 100 }; // Positive = scroll down
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.true;
      expect(actionStub.calledOnce).to.be.true;
    });
    
    it('should trigger any direction if not specified', function() {
      const actionStub = sinon.stub();
      
      ShortcutManager.register({
        id: 'scroll-test',
        trigger: { modifier: 'shift', event: 'mousewheel' }, // No direction
        tools: ['paint'],
        action: actionStub
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      // Test scroll up
      let event = { deltaY: -100 };
      let modifiers = { shift: true, ctrl: false, alt: false };
      let handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      expect(handled).to.be.true;
      expect(actionStub.callCount).to.equal(1);
      
      // Test scroll down
      event = { deltaY: 100 };
      handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      expect(handled).to.be.true;
      expect(actionStub.callCount).to.equal(2);
    });
    
    it('should only trigger first matching shortcut', function() {
      const action1 = sinon.stub();
      const action2 = sinon.stub();
      
      ShortcutManager.register({
        id: 'shortcut-1',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: action1
      });
      
      ShortcutManager.register({
        id: 'shortcut-2',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: action2
      });
      
      mockContext.getCurrentTool.returns('paint');
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(handled).to.be.true;
      expect(action1.calledOnce).to.be.true;
      expect(action2.called).to.be.false; // Second should not be called
    });
  });
  
  describe('getRegisteredShortcuts()', function() {
    it('should return all registered shortcuts', function() {
      ShortcutManager.register({
        id: 'shortcut-1',
        trigger: { modifier: 'shift', event: 'mousewheel' },
        tools: ['paint'],
        action: sinon.stub()
      });
      
      ShortcutManager.register({
        id: 'shortcut-2',
        trigger: { modifier: 'ctrl', event: 'keypress' },
        tools: ['all'],
        action: sinon.stub()
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      
      expect(shortcuts.size).to.equal(2);
      expect(shortcuts.has('shortcut-1')).to.be.true;
      expect(shortcuts.has('shortcut-2')).to.be.true;
      expect(shortcuts.get('shortcut-1').id).to.equal('shortcut-1');
      expect(shortcuts.get('shortcut-2').id).to.equal('shortcut-2');
    });
    
    it('should return copy of shortcuts Map (not reference)', function() {
      ShortcutManager.register({
        id: 'test',
        trigger: { modifier: 'shift', event: 'mousewheel' },
        tools: ['paint'],
        action: sinon.stub()
      });
      
      const shortcuts1 = ShortcutManager.getRegisteredShortcuts();
      const shortcuts2 = ShortcutManager.getRegisteredShortcuts();
      
      expect(shortcuts1).to.not.equal(shortcuts2); // Different Map references
      expect(Array.from(shortcuts1.entries())).to.deep.equal(Array.from(shortcuts2.entries())); // Same content
    });
  });
  
  describe('clearAll()', function() {
    it('should remove all registered shortcuts', function() {
      ShortcutManager.register({
        id: 'shortcut-1',
        trigger: { modifier: 'shift', event: 'mousewheel' },
        tools: ['paint'],
        action: sinon.stub()
      });
      
      ShortcutManager.register({
        id: 'shortcut-2',
        trigger: { modifier: 'ctrl', event: 'keypress' },
        tools: ['all'],
        action: sinon.stub()
      });
      
      ShortcutManager.clearAll();
      
      expect(ShortcutManager.getRegisteredShortcuts()).to.have.lengthOf(0);
    });
  });
  
  describe('Context Integration', function() {
    it('should call context methods during action', function() {
      ShortcutManager.register({
        id: 'brush-size-test',
        trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
        tools: ['paint'],
        action: (context) => {
          const currentSize = context.getBrushSize();
          context.setBrushSize(currentSize + 1);
        }
      });
      
      mockContext.getCurrentTool.returns('paint');
      mockContext.getBrushSize.returns(3);
      
      const event = { deltaY: -100 };
      const modifiers = { shift: true, ctrl: false, alt: false };
      
      ShortcutManager.handleMouseWheel(event, modifiers, mockContext);
      
      expect(mockContext.getBrushSize.calledOnce).to.be.true;
      expect(mockContext.setBrushSize.calledOnce).to.be.true;
      expect(mockContext.setBrushSize.firstCall.args[0]).to.equal(4);
    });
  });
});
