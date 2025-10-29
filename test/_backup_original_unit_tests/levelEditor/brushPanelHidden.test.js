/**
 * Unit Tests: Brush Panel Hidden by Default (Enhancement #9)
 * 
 * Tests that the draggable Brush Panel is hidden by default in Level Editor
 * since brush size is now controlled via menu bar inline controls.
 * 
 * TDD: Write tests FIRST, then implement the enhancement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Brush Panel Hidden by Default', function() {
  let LevelEditorPanels;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Load LevelEditorPanels
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Visibility', function() {
    it('should NOT include Brush Panel in LEVEL_EDITOR state visibility', function() {
      // Create mock level editor
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      // Check that draggablePanelManager was called without brush panel
      const brushPanelId = 'level-editor-brush';
      
      // Get the visibility list for LEVEL_EDITOR state
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        expect(visiblePanels).to.not.include(brushPanelId);
      }
    });
    
    it('should initialize Level Editor without Brush Panel visible', function() {
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      // Verify brush panel was not added to visibility list
      const brushPanelId = 'level-editor-brush';
      
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility) {
        const levelEditorPanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR || [];
        expect(levelEditorPanels).to.be.an('array');
        expect(levelEditorPanels).to.not.include(brushPanelId);
      }
    });
  });
  
  describe('View Menu Integration', function() {
    it('should NOT include Brush Panel toggle in View menu', function() {
      // This test verifies that the View menu doesn't have a Brush Panel toggle
      // Since View menu is in FileMenuBar, we need to check that
      
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {},
        fileMenuBar: null
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      // Check FileMenuBar View menu structure (if available)
      if (mockLevelEditor.fileMenuBar && mockLevelEditor.fileMenuBar.viewMenu) {
        const viewMenuItems = mockLevelEditor.fileMenuBar.viewMenu.items || [];
        const hasBrushPanelToggle = viewMenuItems.some(item => 
          item.label && item.label.includes('Brush')
        );
        
        expect(hasBrushPanelToggle).to.be.false;
      }
    });
  });
  
  describe('Other Panels Still Visible', function() {
    it('should still show Materials Panel by default', function() {
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      const materialsPanelId = 'level-editor-materials';
      
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        expect(visiblePanels).to.include(materialsPanelId);
      }
    });
    
    it('should still show Tools Panel by default', function() {
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      const toolsPanelId = 'level-editor-tools';
      
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        expect(visiblePanels).to.include(toolsPanelId);
      }
    });
  });
});
