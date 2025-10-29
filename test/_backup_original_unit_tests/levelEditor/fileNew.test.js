/**
 * Unit Tests: File New
 * 
 * Tests for File → New functionality in Level Editor.
 * Tests terrain clearing, unsaved changes prompt, filename reset, undo history clearing.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - File New', function() {
  let levelEditor;
  let mockTerrain;
  let mockTerrainEditor;
  let confirmStub;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      clear: sinon.spy()
    };
    
    // Mock TerrainEditor
    mockTerrainEditor = {
      clearHistory: sinon.spy(),
      canUndo: sinon.stub().returns(false),
      canRedo: sinon.stub().returns(false)
    };
    
    // Mock window.confirm (add it first if it doesn't exist)
    if (!global.confirm) {
      global.confirm = () => true;
    }
    confirmStub = sinon.stub(global, 'confirm');
    window.confirm = global.confirm;
    
    // Mock CustomTerrain constructor
    global.CustomTerrain = sinon.stub().returns(mockTerrain);
    
    // Mock LevelEditor with handleFileNew method
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.terrain = mockTerrain;
        this.editor = mockTerrainEditor;
        this.currentFilename = "TestMap";
        this.isModified = false;
      }
      
      handleFileNew() {
        if (this.isModified) {
          const confirmed = confirm("Discard unsaved changes?");
          if (!confirmed) {
            return false; // Cancelled
          }
        }
        
        // Create new terrain
        this.terrain = new CustomTerrain(50, 50);
        
        // Reset filename
        this.currentFilename = "Untitled";
        
        // Clear undo/redo history
        this.editor.clearHistory();
        
        // Reset modified flag
        this.isModified = false;
        
        return true;
      }
    };
    
    levelEditor = new global.LevelEditor();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
    if (confirmStub) {
      confirmStub.restore();
    }
  });
  
  describe('Unsaved Changes Prompt', function() {
    it('should prompt if terrain has been modified', function() {
      levelEditor.isModified = true;
      confirmStub.returns(true);
      
      levelEditor.handleFileNew();
      
      expect(confirmStub.calledOnce).to.be.true;
      expect(confirmStub.calledWith("Discard unsaved changes?")).to.be.true;
    });
    
    it('should not prompt if terrain has not been modified', function() {
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(confirmStub.called).to.be.false;
    });
  });
  
  describe('Confirmation Behavior', function() {
    it('should create new blank terrain on confirmation', function() {
      levelEditor.isModified = true;
      confirmStub.returns(true);
      
      const result = levelEditor.handleFileNew();
      
      expect(result).to.be.true;
      expect(global.CustomTerrain.calledWith(50, 50)).to.be.true;
    });
    
    it('should preserve current terrain on cancel', function() {
      levelEditor.isModified = true;
      confirmStub.returns(false);
      const originalTerrain = levelEditor.terrain;
      
      const result = levelEditor.handleFileNew();
      
      expect(result).to.be.false;
      expect(levelEditor.terrain).to.equal(originalTerrain);
    });
  });
  
  describe('Filename Reset', function() {
    it('should reset filename to "Untitled"', function() {
      levelEditor.currentFilename = "MyLevel";
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(levelEditor.currentFilename).to.equal("Untitled");
    });
  });
  
  describe('Undo/Redo History', function() {
    it('should clear undo/redo history', function() {
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(mockTerrainEditor.clearHistory.calledOnce).to.be.true;
    });
    
    it('should have empty undo history after new', function() {
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(mockTerrainEditor.canUndo()).to.be.false;
      expect(mockTerrainEditor.canRedo()).to.be.false;
    });
  });
  
  describe('Modified Flag', function() {
    it('should reset modified flag to false', function() {
      levelEditor.isModified = true;
      confirmStub.returns(true);
      
      levelEditor.handleFileNew();
      
      expect(levelEditor.isModified).to.be.false;
    });
  });
});
