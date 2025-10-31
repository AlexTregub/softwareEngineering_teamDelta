/**
 * ShortcutManager Keyboard Shortcuts - Unit Tests (TDD)
 * 
 * Testing keyboard shortcut handling for ShortcutManager:
 * - Register keyboard shortcuts with key codes
 * - Handle keypress events with modifiers
 * - Match shortcuts to current tool
 * - Execute action callbacks
 * - Support common keys: Delete, Escape, Enter, letters, numbers
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ShortcutManager Keyboard Shortcuts', function() {
  let ShortcutManager;

  beforeEach(function() {
    // Load ShortcutManager
    ShortcutManager = require('../../../Classes/managers/ShortcutManager');
    
    // Clear all shortcuts before each test
    ShortcutManager.clearAll();
  });

  afterEach(function() {
    ShortcutManager.clearAll();
    sinon.restore();
  });

  describe('Keyboard Shortcut Registration', function() {
    it('should register keypress shortcut', function() {
      ShortcutManager.register({
        id: 'delete-entity',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: () => {}
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('delete-entity')).to.be.true;
    });

    it('should register keypress with modifier', function() {
      ShortcutManager.register({
        id: 'save-with-ctrl-s',
        trigger: { event: 'keypress', key: 's', modifier: 'ctrl' },
        tools: ['all'],
        action: () => {}
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('save-with-ctrl-s')).to.be.true;
    });

    it('should register multiple keyboard shortcuts', function() {
      ShortcutManager.register({
        id: 'shortcut-1',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: () => {}
      });
      
      ShortcutManager.register({
        id: 'shortcut-2',
        trigger: { event: 'keypress', key: 'Escape' },
        tools: ['entity-palette'],
        action: () => {}
      });
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.size).to.equal(2);
    });
  });

  describe('handleKeyPress() Method', function() {
    it('should have static handleKeyPress method', function() {
      expect(ShortcutManager.handleKeyPress).to.be.a('function');
    });

    it('should return false when no shortcuts registered', function() {
      const context = { getCurrentTool: () => 'entity-palette' };
      const modifiers = { shift: false, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.false;
    });

    it('should trigger action for matching key', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'delete-entity',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.true;
      expect(actionSpy.calledOnce).to.be.true;
      expect(actionSpy.firstCall.args[0]).to.equal(context);
    });

    it('should not trigger action for non-matching key', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'delete-entity',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Escape', modifiers, context);
      
      expect(handled).to.be.false;
      expect(actionSpy.called).to.be.false;
    });

    it('should pass context to action callback', function() {
      let receivedContext = null;
      const context = { 
        getCurrentTool: () => 'entity-palette',
        deleteEntity: () => {}
      };
      
      ShortcutManager.register({
        id: 'delete-entity',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: (ctx) => { receivedContext = ctx; }
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(receivedContext).to.equal(context);
    });
  });

  describe('Modifier Key Matching', function() {
    it('should trigger action when modifier matches', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'ctrl-s',
        trigger: { event: 'keypress', key: 's', modifier: 'ctrl' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: true, alt: false };
      const handled = ShortcutManager.handleKeyPress('s', modifiers, context);
      
      expect(handled).to.be.true;
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should not trigger when modifier does not match', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'ctrl-s',
        trigger: { event: 'keypress', key: 's', modifier: 'ctrl' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('s', modifiers, context);
      
      expect(handled).to.be.false;
      expect(actionSpy.called).to.be.false;
    });

    it('should support multiple modifiers (shift+ctrl)', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'shift-ctrl-s',
        trigger: { event: 'keypress', key: 's', modifier: 'shift+ctrl' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: true, ctrl: true, alt: false };
      const handled = ShortcutManager.handleKeyPress('s', modifiers, context);
      
      expect(handled).to.be.true;
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should not trigger when extra modifier is pressed', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'ctrl-s',
        trigger: { event: 'keypress', key: 's', modifier: 'ctrl' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: true, ctrl: true, alt: false }; // Extra shift
      const handled = ShortcutManager.handleKeyPress('s', modifiers, context);
      
      expect(handled).to.be.false;
      expect(actionSpy.called).to.be.false;
    });
  });

  describe('Tool Filtering', function() {
    it('should trigger action when tool matches', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'delete-entity',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.true;
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should not trigger when tool does not match', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'paint-tool' };
      
      ShortcutManager.register({
        id: 'delete-entity',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.false;
      expect(actionSpy.called).to.be.false;
    });

    it('should trigger for "all" tools', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'any-tool' };
      
      ShortcutManager.register({
        id: 'escape',
        trigger: { event: 'keypress', key: 'Escape' },
        tools: ['all'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Escape', modifiers, context);
      
      expect(handled).to.be.true;
      expect(actionSpy.calledOnce).to.be.true;
    });
  });

  describe('Common Keys', function() {
    it('should handle Delete key', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'delete',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should handle Escape key', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'escape',
        trigger: { event: 'keypress', key: 'Escape' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('Escape', modifiers, context);
      
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should handle Enter key', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'enter',
        trigger: { event: 'keypress', key: 'Enter' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('Enter', modifiers, context);
      
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should handle letter keys (case-insensitive)', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'a-key',
        trigger: { event: 'keypress', key: 'a' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('A', modifiers, context); // Uppercase
      
      expect(actionSpy.calledOnce).to.be.true;
    });

    it('should handle number keys', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'number-1',
        trigger: { event: 'keypress', key: '1' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('1', modifiers, context);
      
      expect(actionSpy.calledOnce).to.be.true;
    });
  });

  describe('Multiple Shortcuts Priority', function() {
    it('should trigger only first matching shortcut', function() {
      const actionSpy1 = sinon.spy();
      const actionSpy2 = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'delete-1',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy1
      });
      
      ShortcutManager.register({
        id: 'delete-2',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['entity-palette'],
        action: actionSpy2
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.true;
      expect(actionSpy1.calledOnce).to.be.true;
      expect(actionSpy2.called).to.be.false; // Second not triggered
    });
  });

  describe('Edge Cases', function() {
    it('should handle null context gracefully', function() {
      ShortcutManager.register({
        id: 'delete',
        trigger: { event: 'keypress', key: 'Delete' },
        tools: ['all'],
        action: () => {}
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, null);
      
      expect(handled).to.be.false;
    });

    it('should handle undefined key gracefully', function() {
      const context = { getCurrentTool: () => 'entity-palette' };
      const modifiers = { shift: false, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleKeyPress(undefined, modifiers, context);
      
      expect(handled).to.be.false;
    });

    it('should handle empty key string gracefully', function() {
      const context = { getCurrentTool: () => 'entity-palette' };
      const modifiers = { shift: false, ctrl: false, alt: false };
      
      const handled = ShortcutManager.handleKeyPress('', modifiers, context);
      
      expect(handled).to.be.false;
    });

    it('should not trigger non-keypress shortcuts', function() {
      const actionSpy = sinon.spy();
      const context = { getCurrentTool: () => 'entity-palette' };
      
      ShortcutManager.register({
        id: 'mousewheel-up',
        trigger: { event: 'mousewheel', direction: 'up' },
        tools: ['entity-palette'],
        action: actionSpy
      });
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.false;
      expect(actionSpy.called).to.be.false;
    });
  });
});
