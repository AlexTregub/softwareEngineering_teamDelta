/**
 * Integration Tests for Terrain UI Components
 * Tests UI components working with TerrainEditor and real terrain systems
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load UI components
const materialPaletteCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/MaterialPalette.js'),
  'utf8'
);
const toolBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ToolBar.js'),
  'utf8'
);
const brushSizeControlCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/BrushSizeControl.js'),
  'utf8'
);
const propertiesPanelCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/PropertiesPanel.js'),
  'utf8'
);

// Load TerrainEditor
const terrainEditorCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainEditor.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(materialPaletteCode);
vm.runInThisContext(toolBarCode);
vm.runInThisContext(brushSizeControlCode);
vm.runInThisContext(propertiesPanelCode);
vm.runInThisContext(terrainEditorCode);

describe('TerrainUI Integration Tests', function() {
  
  describe('MaterialPalette + TerrainEditor Integration', function() {
    
    it('should select material and use it in editor', function() {
      // Create mock terrain
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          const index = y * this.gridSize + x;
          return this.grid[index];
        },
        setArrPos: function(x, y, material) {
          const index = y * this.gridSize + x;
          this.grid[index] = material;
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function(x, y, weight) {
          // Mock weight assignment
        }
      };
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const editor = new TerrainEditor(mockTerrain);
      
      // Select stone from palette
      palette.selectMaterial('stone');
      
      // Set selected material in editor
      editor.setSelectedMaterial(palette.getSelectedMaterial());
      
      // Paint with selected material
      editor.paint(5, 5);
      
      expect(mockTerrain.getArrPos(5, 5)).to.equal('stone');
    });
    
    it('should update palette selection when using eyedropper', function() {
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          const index = y * this.gridSize + x;
          return this.grid[index];
        },
        setArrPos: function(x, y, material) {
          const index = y * this.gridSize + x;
          this.grid[index] = material;
        }
      };
      
      // Set a specific material at a location
      mockTerrain.grid[25] = 'stone'; // Position (5,2)
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      // Simulate eyedropper picking material
      const sampledMaterial = mockTerrain.getArrPos(5, 2);
      palette.selectMaterial(sampledMaterial);
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should support keyboard navigation in palette while editing', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          this.grid[y * this.gridSize + x] = material;
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function() {}
      };
      
      const editor = new TerrainEditor(mockTerrain);
      
      // Cycle through materials with keyboard
      palette.selectNext(); // stone
      editor.setSelectedMaterial(palette.getSelectedMaterial());
      editor.paint(0, 0);
      
      palette.selectNext(); // dirt
      editor.setSelectedMaterial(palette.getSelectedMaterial());
      editor.paint(1, 0);
      
      expect(mockTerrain.getArrPos(0, 0)).to.equal('stone');
      expect(mockTerrain.getArrPos(1, 0)).to.equal('dirt');
    });
  });
  
  describe('ToolBar + TerrainEditor Integration', function() {
    
    it('should switch between brush and fill tools', function() {
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          this.grid[y * this.gridSize + x] = material;
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function() {}
      };
      
      const toolbar = new ToolBar();
      const editor = new TerrainEditor(mockTerrain);
      
      // Select brush tool
      toolbar.selectTool('brush');
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // Use brush
      editor.setSelectedMaterial('stone');
      editor.paint(5, 5);
      
      // Switch to fill tool
      toolbar.selectTool('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
      
      // Editor should still work
      editor.setSelectedMaterial('dirt');
      editor.fill(0, 0);
      
      expect(mockTerrain.getArrPos(5, 5)).to.equal('stone');
      expect(mockTerrain.getArrPos(0, 0)).to.equal('dirt');
    });
    
    it('should enable/disable undo/redo based on editor state', function() {
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          this.grid[y * this.gridSize + x] = material;
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function() {}
      };
      
      const toolbar = new ToolBar();
      const editor = new TerrainEditor(mockTerrain);
      
      // Initially, no undo available
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.false;
      
      // Make a change
      editor.setSelectedMaterial('stone');
      editor.paint(5, 5);
      
      // Now undo should be available
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.true;
      
      // Undo the change
      editor.undo();
      
      // Redo should now be available
      toolbar.setEnabled('redo', editor.canRedo());
      expect(toolbar.isEnabled('redo')).to.be.true;
    });
  });
  
  describe('BrushSizeControl + TerrainEditor Integration', function() {
    
    it('should paint with different brush sizes', function() {
      const mockTerrain = {
        gridSize: 20,
        grid: Array(400).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            this.grid[y * this.gridSize + x] = material;
          }
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function() {}
      };
      
      const brushControl = new BrushSizeControl(1);
      const editor = new TerrainEditor(mockTerrain);
      
      editor.setSelectedMaterial('stone');
      
      // Paint with size 1 (single tile)
      brushControl.setSize(1);
      editor.setBrushSize(brushControl.getSize());
      editor.paint(10, 10);
      
      expect(mockTerrain.getArrPos(10, 10)).to.equal('stone');
      
      // Paint with size 3 (3x3 area)
      brushControl.setSize(3);
      editor.setBrushSize(brushControl.getSize());
      editor.setSelectedMaterial('dirt');
      editor.paint(5, 5);
      
      // Check center and surrounding tiles
      expect(mockTerrain.getArrPos(5, 5)).to.equal('dirt');
      expect(mockTerrain.getArrPos(4, 4)).to.equal('dirt'); // Top-left of 3x3
      expect(mockTerrain.getArrPos(6, 6)).to.equal('dirt'); // Bottom-right of 3x3
    });
    
    it('should constrain brush size to odd numbers', function() {
      const brushControl = new BrushSizeControl(1);
      
      brushControl.setSize(2); // Even number, should round to 3
      expect(brushControl.getSize()).to.equal(3);
      
      brushControl.setSize(4); // Even number, should round to 5
      expect(brushControl.getSize()).to.equal(5);
    });
  });
  
  describe('PropertiesPanel + TerrainEditor Integration', function() {
    
    it('should display selected tile information', function() {
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          this.grid[y * this.gridSize + x] = material;
        }
      };
      
      mockTerrain.grid[55] = 'stone'; // Position (5,5)
      
      const panel = new PropertiesPanel();
      
      // Simulate tile selection
      const tileInfo = {
        position: { x: 5, y: 5 },
        material: mockTerrain.getArrPos(5, 5),
        weight: 100,
        passable: false
      };
      
      panel.setSelectedTile(tileInfo);
      const props = panel.getProperties();
      
      expect(props.material).to.equal('stone');
      expect(props.position.x).to.equal(5);
      expect(props.position.y).to.equal(5);
    });
    
    it('should show undo/redo stack information', function() {
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          this.grid[y * this.gridSize + x] = material;
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function() {}
      };
      
      const editor = new TerrainEditor(mockTerrain);
      const panel = new PropertiesPanel();
      panel.setEditor(editor);
      
      // Initial state
      let stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.false;
      expect(stackInfo.undoCount).to.equal(0);
      
      // Make some changes
      editor.setSelectedMaterial('stone');
      editor.paint(0, 0);
      editor.paint(1, 1);
      editor.paint(2, 2);
      
      // Check stack info
      stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
      expect(stackInfo.undoCount).to.equal(3);
    });
  });
  
  describe('Full UI Workflow Integration', function() {
    
    it('should complete full editing workflow with all UI components', function() {
      const mockTerrain = {
        gridSize: 10,
        grid: Array(100).fill('moss'),
        getArrPos: function(x, y) {
          return this.grid[y * this.gridSize + x];
        },
        setArrPos: function(x, y, material) {
          this.grid[y * this.gridSize + x] = material;
        },
        setMaterial: function(x, y, material) {
          this.setArrPos(x, y, material);
        },
        assignWeight: function() {}
      };
      
      // Initialize all UI components
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      const panel = new PropertiesPanel();
      const editor = new TerrainEditor(mockTerrain);
      
      panel.setEditor(editor);
      
      // 1. Select material from palette
      palette.selectMaterial('stone');
      editor.setSelectedMaterial(palette.getSelectedMaterial());
      
      // 2. Select brush tool
      toolbar.selectTool('brush');
      
      // 3. Set brush size
      brushControl.setSize(3);
      editor.setBrushSize(brushControl.getSize());
      
      // 4. Paint
      editor.paint(5, 5);
      
      // 5. Verify changes
      expect(mockTerrain.getArrPos(5, 5)).to.equal('stone');
      
      // 6. Check properties panel
      const stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
      expect(stackInfo.undoCount).to.equal(1);
      
      // 7. Undo
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.true;
      editor.undo();
      
      // 8. Verify undo worked
      expect(mockTerrain.getArrPos(5, 5)).to.equal('moss');
      
      // 9. Switch to fill tool
      toolbar.selectTool('fill');
      palette.selectMaterial('dirt');
      editor.setSelectedMaterial(palette.getSelectedMaterial());
      editor.fill(0, 0);
      
      // 10. Verify fill
      expect(mockTerrain.getArrPos(0, 0)).to.equal('dirt');
    });
  });
});
