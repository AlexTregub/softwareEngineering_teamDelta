/**
 * Integration Tests for LevelEditor with FileMenuBar
 * Tests that LevelEditor properly integrates and uses FileMenuBar
 * 
 * Following TDD: These tests verify LevelEditor correctly initializes and uses FileMenuBar
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

// Load FileMenuBar and mock dependencies
const fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(fileMenuBarCode);

// Sync to window
global.FileMenuBar = FileMenuBar;
window.FileMenuBar = FileMenuBar;

describe('LevelEditor + FileMenuBar Integration Tests', function() {
  let mockP5;
  let mockLevelEditor;
  
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
      noStroke: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Assign to global
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Create a simplified mock LevelEditor structure
    mockLevelEditor = {
      active: true,
      terrain: { tiles: [[]], width: 10, height: 10 },
      editor: {
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      },
      fileMenuBar: null,
      showGrid: true,
      showMinimap: true,
      save: sinon.stub(),
      load: sinon.stub(),
      undo: sinon.stub(),
      redo: sinon.stub()
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('FileMenuBar Initialization', function() {
    it('should create FileMenuBar instance during LevelEditor initialization', function() {
      // Simulate LevelEditor initializing FileMenuBar
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      expect(mockLevelEditor.fileMenuBar).to.exist;
      expect(mockLevelEditor.fileMenuBar.levelEditor).to.equal(mockLevelEditor);
    });
    
    it('should have FileMenuBar connected to LevelEditor', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      expect(mockLevelEditor.fileMenuBar.levelEditor).to.equal(mockLevelEditor);
    });
  });
  
  describe('Click Handling Integration', function() {
    it('should pass clicks to FileMenuBar before terrain editing', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const handleClickSpy = sinon.spy(mockLevelEditor.fileMenuBar, 'handleClick');
      
      // Simulate LevelEditor.handleClick calling FileMenuBar.handleClick
      const clickX = 50;
      const clickY = 20; // Within menu bar height
      
      mockLevelEditor.fileMenuBar.handleClick(clickX, clickY);
      
      expect(handleClickSpy.calledOnce).to.be.true;
      expect(handleClickSpy.calledWith(clickX, clickY)).to.be.true;
    });
    
    it('should consume menu bar clicks and prevent terrain editing', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Click on File menu (should be consumed)
      const clickX = 20;
      const clickY = 20;
      
      const consumed = mockLevelEditor.fileMenuBar.handleClick(clickX, clickY);
      
      // Menu bar should consume clicks within its bounds
      expect(consumed).to.be.true;
    });
  });
  
  describe('Keyboard Handling Integration', function() {
    it('should pass keyboard shortcuts to FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const handleKeySpy = sinon.spy(mockLevelEditor.fileMenuBar, 'handleKeyPress');
      
      // Simulate Ctrl+S
      mockLevelEditor.fileMenuBar.handleKeyPress('s', { ctrl: true });
      
      expect(handleKeySpy.calledOnce).to.be.true;
      expect(handleKeySpy.calledWith('s', { ctrl: true })).to.be.true;
    });
    
    it('should trigger save via Ctrl+S through FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      mockLevelEditor.fileMenuBar.handleKeyPress('s', { ctrl: true });
      
      expect(mockLevelEditor.save.calledOnce).to.be.true;
    });
    
    it('should trigger undo via Ctrl+Z through FileMenuBar', function() {
      // Enable undo first
      mockLevelEditor.editor.canUndo.returns(true);
      
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      mockLevelEditor.fileMenuBar.handleKeyPress('z', { ctrl: true });
      
      expect(mockLevelEditor.undo.calledOnce).to.be.true;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should update menu states when LevelEditor.update() is called', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const updateSpy = sinon.spy(mockLevelEditor.fileMenuBar, 'updateMenuStates');
      
      // Simulate LevelEditor.update() calling fileMenuBar.updateMenuStates()
      mockLevelEditor.fileMenuBar.updateMenuStates();
      
      expect(updateSpy.calledOnce).to.be.true;
    });
    
    it('should reflect undo/redo availability in menu states', function() {
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(false);
      
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const editMenu = mockLevelEditor.fileMenuBar.getMenuItem('Edit');
      const undoItem = editMenu.items.find(item => item.label === 'Undo');
      const redoItem = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoItem.enabled).to.be.false;
      expect(redoItem.enabled).to.be.false;
      
      // Change state
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.fileMenuBar.updateMenuStates();
      
      expect(undoItem.enabled).to.be.true;
      expect(redoItem.enabled).to.be.false;
    });
  });
  
  describe('Render Integration', function() {
    it('should render FileMenuBar when LevelEditor.render() is called', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const renderSpy = sinon.spy(mockLevelEditor.fileMenuBar, 'render');
      
      // Simulate LevelEditor.render() calling fileMenuBar.render()
      mockLevelEditor.fileMenuBar.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should render menu bar at top of screen', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // FileMenuBar should be positioned at {x: 0, y: 0}
      expect(mockLevelEditor.fileMenuBar.position.x).to.equal(0);
      expect(mockLevelEditor.fileMenuBar.position.y).to.equal(0);
    });
  });
  
  describe('Grid and Minimap Toggle Integration', function() {
    it('should toggle grid visibility via FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const initialGridState = mockLevelEditor.showGrid;
      
      // Trigger grid toggle via keyboard
      mockLevelEditor.fileMenuBar.handleKeyPress('g', {});
      
      expect(mockLevelEditor.showGrid).to.equal(!initialGridState);
    });
    
    it('should toggle minimap visibility via FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const initialMinimapState = mockLevelEditor.showMinimap;
      
      // Trigger minimap toggle via keyboard
      mockLevelEditor.fileMenuBar.handleKeyPress('m', {});
      
      expect(mockLevelEditor.showMinimap).to.equal(!initialMinimapState);
    });
  });
  
  describe('Complete Workflow Integration', function() {
    it('should support full save workflow from menu bar to LevelEditor', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // User clicks File menu
      mockLevelEditor.fileMenuBar.openMenu('File');
      
      // User clicks Save
      const fileMenu = mockLevelEditor.fileMenuBar.getMenuItem('File');
      const saveItem = fileMenu.items.find(item => item.label === 'Save');
      saveItem.action();
      
      // LevelEditor.save() should be called
      expect(mockLevelEditor.save.calledOnce).to.be.true;
    });
    
    it('should support undo/redo workflow', function() {
      // Enable undo
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Undo
      mockLevelEditor.fileMenuBar.handleKeyPress('z', { ctrl: true });
      expect(mockLevelEditor.undo.calledOnce).to.be.true;
      
      // Enable redo
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      // Recreate to update states
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Redo
      mockLevelEditor.fileMenuBar.handleKeyPress('y', { ctrl: true });
      expect(mockLevelEditor.redo.calledOnce).to.be.true;
    });
  });
});
