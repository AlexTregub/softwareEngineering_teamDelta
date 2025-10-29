/**
 * Integration Tests for FileMenuBar with Save/Load File I/O
 * Tests complete workflow from menu → levelEditor save/load methods
 * 
 * Following TDD: These tests verify FileMenuBar correctly triggers LevelEditor I/O
 * Note: Full terrain export/import testing is done in terrainExporter/terrainImporter tests
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

// Setup JSDOM with localStorage
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Load FileMenuBar
const fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(fileMenuBarCode);

// Sync to window
global.FileMenuBar = FileMenuBar;
window.FileMenuBar = FileMenuBar;

describe('FileMenuBar Save/Load I/O Integration Tests', function() {
  let menuBar;
  let mockLevelEditor;
  let mockP5;
  let saveStub;
  let loadStub;
  
  beforeEach(function() {
    // Clear localStorage
    localStorage.clear();
    
    // Mock p5.js functions
    mockP5 = {
      rect: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      noStroke: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Assign to global
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Create stubs for save/load
    saveStub = sinon.stub();
    loadStub = sinon.stub();
    
    // Mock LevelEditor with tracked save/load
    mockLevelEditor = {
      terrain: {
        tiles: [
          [{ material: 'grass', type: 0 }, { material: 'stone', type: 2 }],
          [{ material: 'dirt', type: 4 }, { material: 'sand', type: 3 }]
        ],
        width: 2,
        height: 2
      },
      editor: {
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      },
      undo: sinon.stub(),
      redo: sinon.stub(),
      save: saveStub,
      load: loadStub,
      showGrid: true,
      showMinimap: true,
      notifications: {
        show: sinon.stub()
      }
    };
    
    menuBar = new FileMenuBar();
    menuBar.setLevelEditor(mockLevelEditor);
  });
  
  afterEach(function() {
    sinon.restore();
    localStorage.clear();
  });
  
  describe('Save Integration', function() {
    it('should call levelEditor.save() when triggered from File menu', function() {
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      
      saveOption.action();
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.save() via keyboard shortcut Ctrl+S', function() {
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.save() via menu click', function() {
      menuBar.openMenu('File');
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15; // Save is second item
      
      menuBar.handleClick(clickX, clickY);
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should close menu after save is triggered', function() {
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
  });
  
  describe('Load Integration', function() {
    it('should call levelEditor.load() when triggered from File menu', function() {
      const fileMenu = menuBar.getMenuItem('File');
      const loadOption = fileMenu.items.find(item => item.label === 'Load');
      
      loadOption.action();
      
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.load() via keyboard shortcut Ctrl+O', function() {
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.load() via menu click', function() {
      menuBar.openMenu('File');
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15; // Load is third item
      
      menuBar.handleClick(clickX, clickY);
      
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should close menu after load is triggered', function() {
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
  });
  
  describe('Save-Load Workflow', function() {
    it('should allow save followed by load', function() {
      // Save
      menuBar.handleKeyPress('s', { ctrl: true });
      expect(saveStub.calledOnce).to.be.true;
      
      // Load
      menuBar.handleKeyPress('o', { ctrl: true });
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should handle multiple save operations', function() {
      menuBar.handleKeyPress('s', { ctrl: true });
      menuBar.handleKeyPress('s', { ctrl: true });
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(saveStub.callCount).to.equal(3);
    });
    
    it('should handle multiple load operations', function() {
      menuBar.handleKeyPress('o', { ctrl: true });
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(loadStub.callCount).to.equal(2);
    });
  });
  
  describe('Error Handling', function() {
    it('should handle missing levelEditor gracefully', function() {
      menuBar.setLevelEditor(null);
      
      // Should not throw when save is called
      expect(() => menuBar.handleKeyPress('s', { ctrl: true })).to.not.throw();
    });
    
    it('should handle levelEditor without save method gracefully', function() {
      mockLevelEditor.save = undefined;
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Should not throw
      expect(() => menuBar.handleKeyPress('s', { ctrl: true })).to.not.throw();
    });
    
    it('should handle levelEditor without load method gracefully', function() {
      mockLevelEditor.load = undefined;
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Should not throw
      expect(() => menuBar.handleKeyPress('o', { ctrl: true })).to.not.throw();
    });
  });
  
  describe('Integration with LevelEditor State', function() {
    it('should access levelEditor terrain data before save', function() {
      let terrainSizeAccessed = 0;
      
      // Add custom save that uses terrain
      mockLevelEditor.save = function() {
        terrainSizeAccessed = this.terrain.width * this.terrain.height;
      };
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      
      saveOption.action();
      
      // Verify save accessed terrain
      expect(terrainSizeAccessed).to.equal(4); // 2x2 = 4
    });
    
    it('should allow levelEditor to update terrain after load', function() {
      let terrainUpdated = false;
      
      mockLevelEditor.load = function() {
        this.terrain.width = 10;
        this.terrain.height = 10;
        terrainUpdated = true;
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(terrainUpdated).to.be.true;
      expect(mockLevelEditor.terrain.width).to.equal(10);
    });
  });
});
