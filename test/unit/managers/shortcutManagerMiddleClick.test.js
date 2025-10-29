const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('ShortcutManager - Middle-Click Support', function() {
  let ShortcutManager;
  
  before(function() {
    // Set up JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js globals
    global.mouseX = 0;
    global.mouseY = 0;
    
    // Sync to window
    window.mouseX = global.mouseX;
    window.mouseY = global.mouseY;
  });
  
  beforeEach(function() {
    // Load ShortcutManager
    ShortcutManager = require('../../../Classes/managers/ShortcutManager.js');
    
    // Clear all shortcuts before each test
    ShortcutManager.clearAll();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Middle-Click Registration', function() {
    it('should register middle-click press shortcut', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-middle-press',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('test-middle-press')).to.be.true;
    });
    
    it('should register middle-click drag shortcut', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-middle-drag',
        trigger: { event: 'middleclick', action: 'drag' },
        action: action
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('test-middle-drag')).to.be.true;
    });
    
    it('should register middle-click release shortcut', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-middle-release',
        trigger: { event: 'middleclick', action: 'release' },
        action: action
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('test-middle-release')).to.be.true;
    });
    
    it('should store action type in trigger configuration', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-action-type',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      const config = shortcuts.get('test-action-type');
      expect(config.trigger.action).to.equal('press');
    });
  });
  
  describe('Middle-Click Triggering', function() {
    it('should trigger press action on middle-click down', function() {
      const action = sinon.stub();
      const context = { testMethod: sinon.stub() };
      
      ShortcutManager.register({
        id: 'test-press',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      const handled = ShortcutManager.handleMiddleClick('press', {}, context);
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
      expect(action.calledWith(context)).to.be.true;
    });
    
    it('should trigger drag action during middle-click drag', function() {
      const action = sinon.stub();
      const context = { testMethod: sinon.stub() };
      
      ShortcutManager.register({
        id: 'test-drag',
        trigger: { event: 'middleclick', action: 'drag' },
        action: action
      });
      
      const handled = ShortcutManager.handleMiddleClick('drag', {}, context);
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
      expect(action.calledWith(context)).to.be.true;
    });
    
    it('should trigger release action on middle-click up', function() {
      const action = sinon.stub();
      const context = { testMethod: sinon.stub() };
      
      ShortcutManager.register({
        id: 'test-release',
        trigger: { event: 'middleclick', action: 'release' },
        action: action
      });
      
      const handled = ShortcutManager.handleMiddleClick('release', {}, context);
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
      expect(action.calledWith(context)).to.be.true;
    });
    
    it('should not trigger if action type does not match', function() {
      const pressAction = sinon.stub();
      const dragAction = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-press-only',
        trigger: { event: 'middleclick', action: 'press' },
        action: pressAction
      });
      
      ShortcutManager.register({
        id: 'test-drag-only',
        trigger: { event: 'middleclick', action: 'drag' },
        action: dragAction
      });
      
      // Trigger press - should only call press action
      ShortcutManager.handleMiddleClick('press', {}, {});
      expect(pressAction.calledOnce).to.be.true;
      expect(dragAction.called).to.be.false;
      
      // Reset
      pressAction.resetHistory();
      dragAction.resetHistory();
      
      // Trigger drag - should only call drag action
      ShortcutManager.handleMiddleClick('drag', {}, {});
      expect(pressAction.called).to.be.false;
      expect(dragAction.calledOnce).to.be.true;
    });
    
    it('should return false if no matching shortcut found', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-press',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      // Try to trigger drag (no drag shortcut registered)
      const handled = ShortcutManager.handleMiddleClick('drag', {}, {});
      
      expect(handled).to.be.false;
      expect(action.called).to.be.false;
    });
  });
  
  describe('Modifier Keys', function() {
    it('should trigger when no modifiers required', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-no-modifier',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleMiddleClick('press', modifiers, {});
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
    });
    
    it('should trigger with Shift modifier when specified', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-shift',
        trigger: { event: 'middleclick', action: 'press', modifier: 'shift' },
        action: action
      });
      
      const modifiers = { shift: true, ctrl: false, alt: false };
      const handled = ShortcutManager.handleMiddleClick('press', modifiers, {});
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
    });
    
    it('should not trigger when required modifier is missing', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-shift-required',
        trigger: { event: 'middleclick', action: 'press', modifier: 'shift' },
        action: action
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleMiddleClick('press', modifiers, {});
      
      expect(handled).to.be.false;
      expect(action.called).to.be.false;
    });
    
    it('should not trigger when unwanted modifier is pressed', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-no-modifier',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      const modifiers = { shift: true, ctrl: false, alt: false };
      const handled = ShortcutManager.handleMiddleClick('press', modifiers, {});
      
      expect(handled).to.be.false;
      expect(action.called).to.be.false;
    });
    
    it('should support Ctrl modifier', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-ctrl',
        trigger: { event: 'middleclick', action: 'press', modifier: 'ctrl' },
        action: action
      });
      
      const modifiers = { shift: false, ctrl: true, alt: false };
      const handled = ShortcutManager.handleMiddleClick('press', modifiers, {});
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
    });
    
    it('should support Alt modifier', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-alt',
        trigger: { event: 'middleclick', action: 'press', modifier: 'alt' },
        action: action
      });
      
      const modifiers = { shift: false, ctrl: false, alt: true };
      const handled = ShortcutManager.handleMiddleClick('press', modifiers, {});
      
      expect(handled).to.be.true;
      expect(action.calledOnce).to.be.true;
    });
  });
  
  describe('Context Integration', function() {
    it('should pass context to action callback', function() {
      const action = sinon.stub();
      const context = {
        startPan: sinon.stub(),
        getBrushSize: sinon.stub().returns(5)
      };
      
      ShortcutManager.register({
        id: 'test-context',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      ShortcutManager.handleMiddleClick('press', {}, context);
      
      expect(action.calledWith(context)).to.be.true;
    });
    
    it('should allow action to call context methods', function() {
      const context = {
        startPan: sinon.stub(),
        updatePan: sinon.stub()
      };
      
      ShortcutManager.register({
        id: 'test-call-context',
        trigger: { event: 'middleclick', action: 'press' },
        action: (ctx) => {
          ctx.startPan(100, 200);
        }
      });
      
      ShortcutManager.handleMiddleClick('press', {}, context);
      
      expect(context.startPan.calledOnce).to.be.true;
      expect(context.startPan.calledWith(100, 200)).to.be.true;
    });
  });
  
  describe('Multiple Shortcuts', function() {
    it('should handle multiple middle-click shortcuts with different actions', function() {
      const pressAction = sinon.stub();
      const dragAction = sinon.stub();
      const releaseAction = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-press',
        trigger: { event: 'middleclick', action: 'press' },
        action: pressAction
      });
      
      ShortcutManager.register({
        id: 'test-drag',
        trigger: { event: 'middleclick', action: 'drag' },
        action: dragAction
      });
      
      ShortcutManager.register({
        id: 'test-release',
        trigger: { event: 'middleclick', action: 'release' },
        action: releaseAction
      });
      
      // Trigger each action
      ShortcutManager.handleMiddleClick('press', {}, {});
      ShortcutManager.handleMiddleClick('drag', {}, {});
      ShortcutManager.handleMiddleClick('release', {}, {});
      
      expect(pressAction.calledOnce).to.be.true;
      expect(dragAction.calledOnce).to.be.true;
      expect(releaseAction.calledOnce).to.be.true;
    });
    
    it('should stop at first matching shortcut', function() {
      const action1 = sinon.stub();
      const action2 = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-first',
        trigger: { event: 'middleclick', action: 'press' },
        action: action1
      });
      
      ShortcutManager.register({
        id: 'test-second',
        trigger: { event: 'middleclick', action: 'press' },
        action: action2
      });
      
      ShortcutManager.handleMiddleClick('press', {}, {});
      
      // Only first should be called
      expect(action1.calledOnce).to.be.true;
      expect(action2.called).to.be.false;
    });
  });
  
  describe('Unregister', function() {
    it('should remove middle-click shortcut when unregistered', function() {
      const action = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-unregister',
        trigger: { event: 'middleclick', action: 'press' },
        action: action
      });
      
      ShortcutManager.unregister('test-unregister');
      
      const handled = ShortcutManager.handleMiddleClick('press', {}, {});
      
      expect(handled).to.be.false;
      expect(action.called).to.be.false;
    });
  });
  
  describe('Clear All', function() {
    it('should remove all middle-click shortcuts when cleared', function() {
      const action1 = sinon.stub();
      const action2 = sinon.stub();
      
      ShortcutManager.register({
        id: 'test-1',
        trigger: { event: 'middleclick', action: 'press' },
        action: action1
      });
      
      ShortcutManager.register({
        id: 'test-2',
        trigger: { event: 'middleclick', action: 'drag' },
        action: action2
      });
      
      ShortcutManager.clearAll();
      
      const handled1 = ShortcutManager.handleMiddleClick('press', {}, {});
      const handled2 = ShortcutManager.handleMiddleClick('drag', {}, {});
      
      expect(handled1).to.be.false;
      expect(handled2).to.be.false;
      expect(action1.called).to.be.false;
      expect(action2.called).to.be.false;
    });
  });
});
