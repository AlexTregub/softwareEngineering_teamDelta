/**
 * Integration Tests: File → New
 * Tests interaction between LevelEditor, TerrainEditor, and terrain creation
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('File New - Integration Tests', function() {
  let sandbox;
  let editor;
  let terrainEditor;
  let customTerrain;
  let confirmStub;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Ensure global.confirm exists before stubbing
    if (!global.confirm) {
      global.confirm = () => true;
    }
    confirmStub = sandbox.stub(global, 'confirm');
    
    // Mock CustomTerrain
    const CustomTerrain = function(width, height) {
      this.width = width || 50;
      this.height = height || 50;
      this.grid = [];
      for (let y = 0; y < this.height; y++) {
        this.grid[y] = [];
        for (let x = 0; x < this.width; x++) {
          this.grid[y][x] = { type: 0 }; // Grass
        }
      }
    };
    global.CustomTerrain = CustomTerrain;
    window.CustomTerrain = CustomTerrain;
    
    // Mock TerrainEditor
    const TerrainEditor = function() {
      this.undoHistory = ['edit1', 'edit2'];
      this.redoHistory = ['redo1'];
    };
    TerrainEditor.prototype.clearHistory = function() {
      this.undoHistory = [];
      this.redoHistory = [];
    };
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Create instances
    customTerrain = new CustomTerrain(50, 50);
    terrainEditor = new TerrainEditor();
    
    editor = new LevelEditor();
    editor.terrainEditor = terrainEditor;
    editor.customTerrain = customTerrain;
    editor.isModified = false;
    editor.currentFilename = 'TestLevel';
  });
  
  afterEach(function() {
    if (confirmStub) confirmStub.restore();
    sandbox.restore();
    delete global.CustomTerrain;
    delete window.CustomTerrain;
    delete global.TerrainEditor;
    delete window.TerrainEditor;
  });
  
  describe('New Terrain Creation', function() {
    it('should create blank CustomTerrain with default size 50x50', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      editor.handleFileNew();
      
      expect(editor.customTerrain).to.exist;
      expect(editor.customTerrain.width).to.equal(50);
      expect(editor.customTerrain.height).to.equal(50);
    });
    
    it('should create terrain with all default grass tiles', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      editor.handleFileNew();
      
      const terrain = editor.customTerrain;
      for (let y = 0; y < terrain.height; y++) {
        for (let x = 0; x < terrain.width; x++) {
          expect(terrain.grid[y][x].type).to.equal(0); // Grass
        }
      }
    });
  });
  
  describe('Filename Reset', function() {
    it('should reset filename to "Untitled"', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.currentFilename = 'MyLevel';
      
      editor.handleFileNew();
      
      expect(editor.currentFilename).to.equal('Untitled');
    });
    
    it('should reset filename even if already "Untitled"', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.currentFilename = 'Untitled';
      
      editor.handleFileNew();
      
      expect(editor.currentFilename).to.equal('Untitled');
    });
  });
  
  describe('Undo/Redo History Clearing', function() {
    it('should clear undo history', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      expect(terrainEditor.undoHistory.length).to.equal(2);
      
      editor.handleFileNew();
      
      expect(terrainEditor.undoHistory.length).to.equal(0);
    });
    
    it('should clear redo history', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      expect(terrainEditor.redoHistory.length).to.equal(1);
      
      editor.handleFileNew();
      
      expect(terrainEditor.redoHistory.length).to.equal(0);
    });
    
    it('should clear history even if already empty', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      terrainEditor.undoHistory = [];
      terrainEditor.redoHistory = [];
      
      expect(() => editor.handleFileNew()).to.not.throw();
      
      expect(terrainEditor.undoHistory.length).to.equal(0);
      expect(terrainEditor.redoHistory.length).to.equal(0);
    });
  });
  
  describe('Modified Flag Behavior', function() {
    it('should reset isModified to false', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      editor.handleFileNew();
      
      expect(editor.isModified).to.be.false;
    });
    
    it('should keep isModified false if not modified', function() {
      confirmStub.returns(true);
      editor.isModified = false;
      
      editor.handleFileNew();
      
      expect(editor.isModified).to.be.false;
    });
  });
  
  describe('Unsaved Changes Workflow', function() {
    it('should prompt when terrain modified', function() {
      editor.isModified = true;
      confirmStub.returns(true);
      
      editor.handleFileNew();
      
      expect(confirmStub.calledOnce).to.be.true;
      expect(confirmStub.firstCall.args[0]).to.include('unsaved');
    });
    
    it('should not prompt when terrain clean', function() {
      editor.isModified = false;
      
      editor.handleFileNew();
      
      expect(confirmStub.called).to.be.false;
    });
    
    it('should create new terrain on confirmation', function() {
      editor.isModified = true;
      confirmStub.returns(true);
      const oldTerrain = editor.customTerrain;
      
      editor.handleFileNew();
      
      expect(editor.customTerrain).to.not.equal(oldTerrain);
    });
    
    it('should preserve current terrain on cancel', function() {
      editor.isModified = true;
      confirmStub.returns(false);
      const oldTerrain = editor.customTerrain;
      const oldFilename = editor.currentFilename;
      
      editor.handleFileNew();
      
      expect(editor.customTerrain).to.equal(oldTerrain);
      expect(editor.currentFilename).to.equal(oldFilename);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle missing terrainEditor', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.terrainEditor = null;
      
      expect(() => editor.handleFileNew()).to.not.throw();
      expect(editor.currentFilename).to.equal('Untitled');
    });
    
    it('should handle missing customTerrain', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.customTerrain = null;
      
      expect(() => editor.handleFileNew()).to.not.throw();
    });
    
    it('should work without CustomTerrain class (fallback)', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      delete global.CustomTerrain;
      delete window.CustomTerrain;
      
      // Should fallback to gridTerrain or handle gracefully
      expect(() => editor.handleFileNew()).to.not.throw();
    });
  });
  
  describe('Multiple New Operations', function() {
    it('should handle multiple new operations in sequence', function() {
      confirmStub.returns(true);
      
      editor.isModified = true;
      editor.handleFileNew();
      expect(editor.currentFilename).to.equal('Untitled');
      
      editor.currentFilename = 'Level2';
      editor.isModified = true;
      editor.handleFileNew();
      expect(editor.currentFilename).to.equal('Untitled');
      
      editor.currentFilename = 'Level3';
      editor.isModified = true;
      editor.handleFileNew();
      expect(editor.currentFilename).to.equal('Untitled');
    });
  });
});
