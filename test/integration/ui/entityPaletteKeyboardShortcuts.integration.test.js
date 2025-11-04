/**
 * EntityPalette Keyboard Shortcuts Integration - Integration Tests (TDD)
 * 
 * Testing keyboard shortcut integration with EntityPalette:
 * - Delete key deletes selected custom entity
 * - Escape key clears selection
 * - Shortcuts only work when EntityPalette is active tool
 * - Show toast notifications on keyboard actions
 * - Handle edge cases (no selection, non-custom category)
 */

const { expect } = require('chai');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');
const sinon = require('sinon');

setupTestEnvironment({ rendering: true });

describe('EntityPalette Keyboard Shortcuts Integration', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let clock;
  let EntityPalette, ToastNotification, ShortcutManager;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    
    // Mock p5.js functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.stroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
    global.image = sinon.stub();
    global.width = 1920;
    global.height = 1080;
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.CORNER = 'corner';
    global.strokeWeight = sinon.stub();
    
    // Mock localStorage
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub(),
      removeItem: sinon.stub()
    };
    
    // Sync window object for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.noStroke = global.noStroke;
      window.stroke = global.stroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textSize = global.textSize;
      window.textAlign = global.textAlign;
      window.color = global.color;
      window.image = global.image;
      window.width = global.width;
      window.height = global.height;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.RIGHT = global.RIGHT;
      window.CORNER = global.CORNER;
      window.strokeWeight = global.strokeWeight;
      window.localStorage = global.localStorage;
    }
    
    // Load classes
    ToastNotification = require('../../../Classes/ui/levelEditor/toastNotifications/ToastNotification');
    global.ToastNotification = ToastNotification;
    if (typeof window !== 'undefined') {
      window.ToastNotification = ToastNotification;
    }
    
    ShortcutManager = require('../../../Classes/managers/ShortcutManager');
    global.ShortcutManager = ShortcutManager;
    if (typeof window !== 'undefined') {
      window.ShortcutManager = ShortcutManager;
    }
    
    EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
    
    // Mock ModalDialog
    global.ModalDialog = class {
      constructor() {
        this.visible = false;
      }
      show() {}
      hide() {}
      render() {}
      handleClick() {}
      handleKeyPress() {}
    };
    if (typeof window !== 'undefined') {
      window.ModalDialog = global.ModalDialog;
    }
    
    // Clear shortcuts before each test
    ShortcutManager.clearAll();
  });

  afterEach(function() {
    clock.restore();
    cleanupTestEnvironment();
    ShortcutManager.clearAll();
    delete global.localStorage;
    delete global.ModalDialog;
    delete global.ToastNotification;
    delete global.ShortcutManager;
    if (typeof window !== 'undefined') {
      delete window.localStorage;
      delete window.ModalDialog;
      delete window.ToastNotification;
      delete window.ShortcutManager;
    }
  });

  describe('Shortcut Registration', function() {
    it('should register Delete key shortcut for entity-palette', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('entity-palette-delete')).to.be.true;
    });

    it('should register Escape key shortcut for entity-palette', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.has('entity-palette-escape')).to.be.true;
    });

    it('should only register once (idempotent)', function() {
      EntityPalette.registerKeyboardShortcuts();
      EntityPalette.registerKeyboardShortcuts();
      EntityPalette.registerKeyboardShortcuts();
      
      const shortcuts = ShortcutManager.getRegisteredShortcuts();
      expect(shortcuts.size).to.equal(2); // Only 2 shortcuts
    });
  });

  describe('Delete Key Shortcut', function() {
    it('should delete selected custom entity when Delete pressed', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.selectEntity(entity.id);
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.true;
      expect(palette.getCustomEntity(entity.id)).to.be.null;
    });

    it('should show toast notification after deletion', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.selectEntity(entity.id);
      
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      // Should have 2 toasts: one from addCustomEntity, one from deletion
      expect(toastSpy.callCount).to.be.at.least(1);
    });

    it('should not delete when no entity selected', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.true; // Shortcut handled
      expect(palette._templates.custom.length).to.equal(1); // Entity still there
    });

    it('should not delete when wrong tool active', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.selectEntity(entity.id);
      
      const context = {
        getCurrentTool: () => 'paint-tool', // Different tool
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(handled).to.be.false;
      expect(palette.getCustomEntity(entity.id)).to.exist;
    });

    it('should not delete when not in custom category', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('entities'); // Not custom
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      // Should not crash or cause issues
    });
  });

  describe('Escape Key Shortcut', function() {
    it('should clear selection when Escape pressed', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.selectEntity(entity.id);
      expect(palette.getSelectedEntity()).to.exist;
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Escape', modifiers, context);
      
      expect(handled).to.be.true;
      expect(palette.getSelectedEntity()).to.be.null;
    });

    it('should work even when no entity selected', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Escape', modifiers, context);
      
      expect(handled).to.be.true;
      expect(palette.getSelectedEntity()).to.be.null;
    });

    it('should not clear selection when wrong tool active', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.selectEntity(entity.id);
      
      const context = {
        getCurrentTool: () => 'paint-tool', // Different tool
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Escape', modifiers, context);
      
      expect(handled).to.be.false;
      expect(palette.getSelectedEntity()).to.exist;
    });
  });

  describe('Context Requirements', function() {
    it('should require getEntityPalette method in context', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const context = {
        getCurrentTool: () => 'entity-palette'
        // Missing getEntityPalette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      // Should not crash
      expect(handled).to.be.false;
    });

    it('should handle null EntityPalette gracefully', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => null
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      const handled = ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      // Should not crash
      expect(handled).to.be.false;
    });
  });

  describe('Multiple Operations', function() {
    it('should handle Delete then Escape sequence', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      palette.addCustomEntity('Worker 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Worker 2', 'ant_soldier', {});
      palette.selectEntity(entity2.id);
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      
      // Delete selected entity
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      expect(palette._templates.custom.length).to.equal(1);
      
      // Clear selection
      ShortcutManager.handleKeyPress('Escape', modifiers, context);
      expect(palette.getSelectedEntity()).to.be.null;
    });

    it('should handle multiple deletions', function() {
      EntityPalette.registerKeyboardShortcuts();
      
      const palette = new EntityPalette();
      palette.setCategory('custom');
      
      const entity1 = palette.addCustomEntity('Worker 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Worker 2', 'ant_soldier', {});
      const entity3 = palette.addCustomEntity('Worker 3', 'ant_queen', {});
      
      const context = {
        getCurrentTool: () => 'entity-palette',
        getEntityPalette: () => palette
      };
      
      const modifiers = { shift: false, ctrl: false, alt: false };
      
      // Delete each entity
      palette.selectEntity(entity1.id);
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      palette.selectEntity(entity2.id);
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      palette.selectEntity(entity3.id);
      ShortcutManager.handleKeyPress('Delete', modifiers, context);
      
      expect(palette._templates.custom.length).to.equal(0);
    });
  });

  describe('EntityPalette Methods', function() {
    it('should have selectEntity method', function() {
      const palette = new EntityPalette();
      expect(palette.selectEntity).to.be.a('function');
    });

    it('should have getSelectedEntity method', function() {
      const palette = new EntityPalette();
      expect(palette.getSelectedEntity).to.be.a('function');
    });

    it('should have clearSelection method', function() {
      const palette = new EntityPalette();
      expect(palette.clearSelection).to.be.a('function');
    });

    it('should have deleteSelectedEntity method', function() {
      const palette = new EntityPalette();
      expect(palette.deleteSelectedEntity).to.be.a('function');
    });
  });
});
