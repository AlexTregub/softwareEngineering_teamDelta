/**
 * Integration Tests: File Save/Export
 * Tests interaction between LevelEditor, SaveDialog, and TerrainExporter
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('File Save/Export - Integration Tests', function() {
  let sandbox;
  let editor;
  let saveDialog;
  let terrainExporter;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock SaveDialog
    const SaveDialog = function() {
      this.isOpen = false;
      this.callback = null;
    };
    SaveDialog.prototype.show = function(callback) {
      this.isOpen = true;
      this.callback = callback;
    };
    SaveDialog.prototype.simulateInput = function(filename) {
      if (this.callback) {
        this.callback(filename);
      }
      this.isOpen = false;
    };
    global.SaveDialog = SaveDialog;
    window.SaveDialog = SaveDialog;
    
    // Mock TerrainExporter
    const TerrainExporter = function() {};
    TerrainExporter.prototype.export = function(terrain, filename) {
      this.lastExport = {
        terrain: terrain,
        filename: filename
      };
      return true;
    };
    global.TerrainExporter = TerrainExporter;
    window.TerrainExporter = TerrainExporter;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Create instances
    saveDialog = new SaveDialog();
    terrainExporter = new TerrainExporter();
    
    editor = new LevelEditor();
    editor.saveDialog = saveDialog;
    editor.terrainExporter = terrainExporter;
    editor.customTerrain = { grid: [[{ type: 0 }]] };
    editor.isModified = true;
    editor.currentFilename = 'Untitled';
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.SaveDialog;
    delete window.SaveDialog;
    delete global.TerrainExporter;
    delete window.TerrainExporter;
  });
  
  describe('Save → Filename → Export Workflow', function() {
    it('should show dialog, store filename, then allow export', function() {
      // Step 1: Save - show dialog
      editor.handleFileSave();
      expect(saveDialog.isOpen).to.be.true;
      
      // Step 2: User enters filename
      saveDialog.simulateInput('MyLevel');
      expect(editor.currentFilename).to.equal('MyLevel');
      expect(editor.isModified).to.be.false;
      
      // Step 3: Export uses stored filename
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('MyLevel.json');
    });
    
    it('should handle Save → Export without reopening dialog', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('TestMap');
      
      // Export should use stored filename without prompting
      const dialogOpenCount = saveDialog.isOpen ? 1 : 0;
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.filename).to.equal('TestMap.json');
      expect(saveDialog.isOpen).to.be.false;
    });
  });
  
  describe('Export Without Filename Workflow', function() {
    it('should prompt for filename if Untitled', function() {
      editor.currentFilename = 'Untitled';
      
      editor.handleFileExport();
      
      expect(saveDialog.isOpen).to.be.true;
    });
    
    it('should complete export after filename entered', function() {
      editor.currentFilename = 'Untitled';
      
      editor.handleFileExport();
      saveDialog.simulateInput('NewMap');
      
      expect(editor.currentFilename).to.equal('NewMap');
      // Export should have been triggered
      expect(terrainExporter.lastExport).to.exist;
    });
  });
  
  describe('Filename Normalization', function() {
    it('should strip .json extension from internal storage', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('map.json');
      
      expect(editor.currentFilename).to.equal('map');
    });
    
    it('should strip .JSON extension (case insensitive)', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('MAP.JSON');
      
      expect(editor.currentFilename).to.equal('MAP');
    });
    
    it('should append .json for download', function() {
      editor.currentFilename = 'MyMap';
      
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.filename).to.equal('MyMap.json');
    });
    
    it('should not double-append .json extension', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('level.json');
      
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.filename).to.equal('level.json');
    });
  });
  
  describe('Export with Existing Filename', function() {
    it('should export immediately if filename already set', function() {
      editor.currentFilename = 'ExistingMap';
      
      editor.handleFileExport();
      
      expect(saveDialog.isOpen).to.be.false;
      expect(terrainExporter.lastExport.filename).to.equal('ExistingMap.json');
    });
    
    it('should include terrain data in export', function() {
      editor.currentFilename = 'TestMap';
      const terrain = editor.customTerrain;
      
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.terrain).to.equal(terrain);
    });
  });
  
  describe('Modified Flag Behavior', function() {
    it('should clear isModified after save', function() {
      editor.isModified = true;
      
      editor.handleFileSave();
      saveDialog.simulateInput('SavedMap');
      
      expect(editor.isModified).to.be.false;
    });
    
    it('should not affect isModified on export', function() {
      editor.currentFilename = 'Map';
      editor.isModified = true;
      
      editor.handleFileExport();
      
      // Export doesn't change modified state
      expect(editor.isModified).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty filename gracefully', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('');
      
      // Empty filename should not crash
      expect(() => editor.handleFileExport()).to.not.throw();
    });
    
    it('should handle filename with special characters', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('map-v2_final');
      
      expect(editor.currentFilename).to.equal('map-v2_final');
      
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('map-v2_final.json');
    });
    
    it('should handle very long filenames', function() {
      const longName = 'a'.repeat(200);
      editor.handleFileSave();
      saveDialog.simulateInput(longName);
      
      expect(editor.currentFilename).to.equal(longName);
    });
    
    it('should handle missing saveDialog', function() {
      editor.saveDialog = null;
      
      expect(() => editor.handleFileSave()).to.not.throw();
    });
    
    it('should handle missing terrainExporter', function() {
      editor.terrainExporter = null;
      editor.currentFilename = 'Map';
      
      expect(() => editor.handleFileExport()).to.not.throw();
    });
    
    it('should handle missing customTerrain', function() {
      editor.customTerrain = null;
      editor.currentFilename = 'Map';
      
      expect(() => editor.handleFileExport()).to.not.throw();
    });
  });
  
  describe('Multiple Save/Export Cycles', function() {
    it('should handle multiple save operations', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('Map1');
      expect(editor.currentFilename).to.equal('Map1');
      
      editor.handleFileSave();
      saveDialog.simulateInput('Map2');
      expect(editor.currentFilename).to.equal('Map2');
      
      editor.handleFileSave();
      saveDialog.simulateInput('Map3');
      expect(editor.currentFilename).to.equal('Map3');
    });
    
    it('should handle alternating save/export operations', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('Map1');
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('Map1.json');
      
      editor.handleFileSave();
      saveDialog.simulateInput('Map2');
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('Map2.json');
    });
  });
});
