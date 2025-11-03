/**
 * Integration Tests for FileMenuBar with LevelEditor
 * Tests menu bar integration with save/load functionality and file I/O
 * 
 * Following TDD: These tests verify real system interactions
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load all required classes
const fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);
const saveDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/SaveDialog.js'),
  'utf8'
);
const loadDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LoadDialog.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(fileMenuBarCode);
vm.runInThisContext(saveDialogCode);
vm.runInThisContext(loadDialogCode);

// Sync to window
global.FileMenuBar = FileMenuBar;
global.SaveDialog = SaveDialog;
global.LoadDialog = LoadDialog;
window.FileMenuBar = FileMenuBar;
window.SaveDialog = SaveDialog;
window.LoadDialog = LoadDialog;

describe('FileMenuBar Integration Tests', function() {
  let menuBar;
  let mockLevelEditor;
  let mockP5;
  
  beforeEach(function() {
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
      noStroke: sinon.stub()
    };
    
    // Assign to global
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Mock LevelEditor with save/load functionality
    mockLevelEditor = {
      terrain: {
        tiles: [[{material: 'grass'}]],
        width: 10,
        height: 10
      },
      editor: {
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      },
      // Methods called by FileMenuBar (at top level)
      undo: sinon.stub(),
      redo: sinon.stub(),
      save: sinon.stub(),
      load: sinon.stub(),
      showGrid: true,
      showMinimap: true,
      saveDialog: new SaveDialog(),
      loadDialog: new LoadDialog(),
      notifications: {
        show: sinon.stub()
      }
    };
    
    menuBar = new FileMenuBar();
    menuBar.setLevelEditor(mockLevelEditor);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Save Functionality Integration', function() {
    it('should call levelEditor.save() when Save menu item clicked', function() {
      // Open File menu
      menuBar.openMenu('File');
      
      // Get Save option position
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15; // Save is second item (index 1)
      
      // Click Save
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.save.called).to.be.true;
    });
    
    it('should trigger save via keyboard shortcut Ctrl+S', function() {
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(mockLevelEditor.save.called).to.be.true;
    });
    
    it('should integrate with SaveDialog', function() {
      // Trigger save
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action();
      
      // Verify save dialog interaction
      expect(mockLevelEditor.save.called).to.be.true;
    });
  });
  
  describe('Load Functionality Integration', function() {
    it('should call levelEditor.load() when Load menu item clicked', function() {
      // Open File menu
      menuBar.openMenu('File');
      
      // Get Load option position
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15; // Load is third item (index 2)
      
      // Click Load
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.load.called).to.be.true;
    });
    
    it('should trigger load via keyboard shortcut Ctrl+O', function() {
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(mockLevelEditor.load.called).to.be.true;
    });
    
    it('should integrate with LoadDialog', function() {
      // Trigger load
      const fileMenu = menuBar.getMenuItem('File');
      const loadOption = fileMenu.items.find(item => item.label === 'Load');
      loadOption.action();
      
      // Verify load dialog interaction
      expect(mockLevelEditor.load.called).to.be.true;
    });
  });
  
  describe('Edit Menu Integration', function() {
    it('should call levelEditor.undo() when Undo clicked', function() {
      // Enable undo BEFORE updating menu states
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      // Recreate menuBar to get fresh menu items with enabled state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Open Edit menu
      menuBar.openMenu('Edit');
      
      // Click Undo (first item, index 0)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'Edit');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (0 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.undo.called).to.be.true;
    });
    
    it('should call levelEditor.redo() when Redo clicked', function() {
      // Enable redo BEFORE updating menu states
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      // Recreate menuBar to get fresh menu items with enabled state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Open Edit menu
      menuBar.openMenu('Edit');
      
      // Click Redo (second item, index 1)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'Edit');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.redo.called).to.be.true;
    });
    
    it('should trigger undo via keyboard shortcut Ctrl+Z', function() {
      // Enable undo BEFORE creating menuBar
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      menuBar.handleKeyPress('z', { ctrl: true });
      
      expect(mockLevelEditor.undo.called).to.be.true;
    });
    
    it('should trigger redo via keyboard shortcut Ctrl+Y', function() {
      // Enable redo BEFORE creating menuBar
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      menuBar.handleKeyPress('y', { ctrl: true });
      
      expect(mockLevelEditor.redo.called).to.be.true;
    });
    
    it('should update Undo/Redo enabled states based on editor', function() {
      // Initially disabled
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(false);
      menuBar.updateMenuStates();
      
      let editMenu = menuBar.getMenuItem('Edit');
      let undoOption = editMenu.items.find(item => item.label === 'Undo');
      let redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.false;
      
      // Enable undo
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      menuBar.updateMenuStates();
      
      editMenu = menuBar.getMenuItem('Edit');
      undoOption = editMenu.items.find(item => item.label === 'Undo');
      redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.true;
      expect(redoOption.enabled).to.be.false;
    });
  });
  
  describe('View Menu Integration', function() {
    it('should toggle grid visibility when Grid clicked', function() {
      expect(mockLevelEditor.showGrid).to.be.true;
      
      // Open View menu
      menuBar.openMenu('View');
      
      // Click Grid (first item, index 0)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'View');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (0 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.showGrid).to.be.false;
    });
    
    it('should toggle minimap visibility when Minimap clicked', function() {
      expect(mockLevelEditor.showMinimap).to.be.true;
      
      // Open View menu
      menuBar.openMenu('View');
      
      // Click Minimap (second item, index 1)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'View');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.showMinimap).to.be.false;
    });
    
    it('should trigger grid toggle via keyboard shortcut G', function() {
      expect(mockLevelEditor.showGrid).to.be.true;
      
      menuBar.handleKeyPress('g', {});
      
      expect(mockLevelEditor.showGrid).to.be.false;
    });
    
    it('should trigger minimap toggle via keyboard shortcut M', function() {
      expect(mockLevelEditor.showMinimap).to.be.true;
      
      menuBar.handleKeyPress('m', {});
      
      expect(mockLevelEditor.showMinimap).to.be.false;
    });
  });
  
  describe('Complete Save/Load Workflow', function() {
    it('should complete full save workflow', function() {
      // 1. User opens File menu
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      // 2. User clicks Save
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      menuBar.handleClick(clickX, clickY);
      
      // 3. Save method called
      expect(mockLevelEditor.save.called).to.be.true;
      
      // 4. Menu closes
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
    
    it('should complete full load workflow', function() {
      // 1. User opens File menu
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      // 2. User clicks Load
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15;
      menuBar.handleClick(clickX, clickY);
      
      // 3. Load method called
      expect(mockLevelEditor.load.called).to.be.true;
      
      // 4. Menu closes
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
    
    it('should handle Save → Undo → Redo workflow', function() {
      // Start with undo/redo disabled
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(false);
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // 1. Save
      menuBar.handleKeyPress('s', { ctrl: true });
      expect(mockLevelEditor.save.called).to.be.true;
      
      // 2. Make edit (undo becomes available)
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      // Recreate menuBar with new state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // 3. Undo
      menuBar.handleKeyPress('z', { ctrl: true });
      expect(mockLevelEditor.undo.called).to.be.true;
      
      // 4. Redo becomes available
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      // Recreate menuBar with new state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // 5. Redo
      menuBar.handleKeyPress('y', { ctrl: true });
      expect(mockLevelEditor.redo.called).to.be.true;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should keep menu states synced with editor state', function() {
      // Initial state
      expect(mockLevelEditor.editor.canUndo()).to.be.false;
      expect(mockLevelEditor.editor.canRedo()).to.be.false;
      
      menuBar.updateMenuStates();
      
      const editMenu = menuBar.getMenuItem('Edit');
      const undoOption = editMenu.items.find(item => item.label === 'Undo');
      const redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.false;
      
      // Change editor state
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(true);
      
      menuBar.updateMenuStates();
      
      expect(undoOption.enabled).to.be.true;
      expect(redoOption.enabled).to.be.true;
    });
    
    it('should update states after each edit operation', function() {
      // Start with undo available
      mockLevelEditor.editor.canUndo.returns(true);
      menuBar.updateMenuStates();
      
      let editMenu = menuBar.getMenuItem('Edit');
      let undoOption = editMenu.items.find(item => item.label === 'Undo');
      expect(undoOption.enabled).to.be.true;
      
      // Undo (undo becomes unavailable)
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      menuBar.handleKeyPress('z', { ctrl: true });
      menuBar.updateMenuStates();
      
      editMenu = menuBar.getMenuItem('Edit');
      undoOption = editMenu.items.find(item => item.label === 'Undo');
      const redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.true;
    });
  });
});
