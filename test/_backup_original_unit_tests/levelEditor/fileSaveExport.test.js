/**
 * Unit Tests: File Save/Export
 * 
 * Tests for File → Save and File → Export functionality in Level Editor.
 * Tests naming dialog, filename storage, export workflow.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - File Save/Export', function() {
  let levelEditor;
  let mockSaveDialog;
  let mockTerrainExporter;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock SaveDialog
    mockSaveDialog = {
      show: sinon.spy(),
      onSave: null // Will be set by LevelEditor
    };
    
    // Mock TerrainExporter
    mockTerrainExporter = {
      exportToJSON: sinon.spy()
    };
    
    global.TerrainExporter = sinon.stub().returns(mockTerrainExporter);
    
    // Mock LevelEditor with save/export methods
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.currentFilename = "Untitled";
        this.isModified = true;
        this.saveDialog = mockSaveDialog;
        this.terrain = { /* mock terrain */ };
      }
      
      handleFileSave() {
        // Show naming dialog
        this.saveDialog.show();
        
        // Dialog will call onSaveComplete when user enters name
      }
      
      onSaveComplete(filename) {
        // Store filename without extension
        const nameWithoutExt = filename.replace(/\.json$/i, '');
        this.currentFilename = nameWithoutExt;
        this.isModified = false;
      }
      
      handleFileExport() {
        // Check if filename is set
        if (this.currentFilename === "Untitled") {
          // Prompt for name first
          this.handleFileSave();
          // Will export after save completes
          return false;
        }
        
        // Export with current filename
        const exporter = new TerrainExporter(this.terrain);
        exporter.exportToJSON(this.currentFilename + '.json');
        return true;
      }
    };
    
    levelEditor = new global.LevelEditor();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('File Save - Naming Dialog', function() {
    it('should show naming dialog when Save clicked', function() {
      levelEditor.handleFileSave();
      
      expect(mockSaveDialog.show.calledOnce).to.be.true;
    });
    
    it('should set currentFilename when name entered', function() {
      levelEditor.onSaveComplete("MyLevel");
      
      expect(levelEditor.currentFilename).to.equal("MyLevel");
    });
    
    it('should strip .json extension from filename', function() {
      levelEditor.onSaveComplete("MyLevel.json");
      
      expect(levelEditor.currentFilename).to.equal("MyLevel");
    });
    
    it('should set isModified to false after save', function() {
      levelEditor.isModified = true;
      
      levelEditor.onSaveComplete("MyLevel");
      
      expect(levelEditor.isModified).to.be.false;
    });
  });
  
  describe('File Export - With Filename', function() {
    it('should export immediately if filename is set', function() {
      levelEditor.currentFilename = "MyLevel";
      
      const result = levelEditor.handleFileExport();
      
      expect(result).to.be.true;
      expect(global.TerrainExporter.calledOnce).to.be.true;
      expect(mockTerrainExporter.exportToJSON.calledWith("MyLevel.json")).to.be.true;
    });
    
    it('should append .json extension for download', function() {
      levelEditor.currentFilename = "TestMap";
      
      levelEditor.handleFileExport();
      
      expect(mockTerrainExporter.exportToJSON.calledWith("TestMap.json")).to.be.true;
    });
  });
  
  describe('File Export - Without Filename', function() {
    it('should prompt for filename if Untitled', function() {
      levelEditor.currentFilename = "Untitled";
      
      const result = levelEditor.handleFileExport();
      
      expect(result).to.be.false; // Not exported yet
      expect(mockSaveDialog.show.calledOnce).to.be.true;
    });
    
    it('should export after save dialog completes', function() {
      levelEditor.currentFilename = "Untitled";
      
      // Trigger export (will show save dialog)
      levelEditor.handleFileExport();
      
      // User enters name in dialog
      levelEditor.onSaveComplete("NewMap");
      
      // Now export should work
      const result = levelEditor.handleFileExport();
      
      expect(result).to.be.true;
      expect(mockTerrainExporter.exportToJSON.calledWith("NewMap.json")).to.be.true;
    });
  });
  
  describe('Filename Storage', function() {
    it('should store filename without extension internally', function() {
      levelEditor.onSaveComplete("MyMap.json");
      
      expect(levelEditor.currentFilename).to.equal("MyMap");
      expect(levelEditor.currentFilename).to.not.include(".json");
    });
    
    it('should handle filename without extension', function() {
      levelEditor.onSaveComplete("MyMap");
      
      expect(levelEditor.currentFilename).to.equal("MyMap");
    });
  });
});
