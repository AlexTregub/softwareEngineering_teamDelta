/**
 * Integration Tests for Terrain UI Components
 * Tests UI components working with TerrainEditor and CustomTerrain
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load CustomTerrain
const customTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/CustomTerrain.js'),
  'utf8'
);

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
const notificationManagerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/NotificationManager.js'),
  'utf8'
);

// Load TerrainEditor
const terrainEditorCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainEditor.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(customTerrainCode);
vm.runInThisContext(materialPaletteCode);
vm.runInThisContext(toolBarCode);
vm.runInThisContext(brushSizeControlCode);
vm.runInThisContext(propertiesPanelCode);
vm.runInThisContext(notificationManagerCode);
vm.runInThisContext(terrainEditorCode);

describe('TerrainUI Integration Tests', function() {
  
  describe('MaterialPalette + TerrainEditor + CustomTerrain Integration', function() {
    
    it('should select material and use it in editor', function() {
      // Create CustomTerrain
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const editor = new TerrainEditor(terrain);
      
      // Select stone from palette
      palette.selectMaterial('stone');
      
      // Set selected material in editor
      editor.selectMaterial(palette.getSelectedMaterial());
      
      // Paint with selected material
      editor.paint(5, 5);
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
    });
    
    it('should update palette selection when using eyedropper', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      // Set a specific material at a location
      terrain.setTile(5, 2, 'stone'); // Position (5,2)
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      // Simulate eyedropper picking material
      const sampledMaterial = terrain.getTile(5, 2).material;
      palette.selectMaterial(sampledMaterial);
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should support keyboard navigation in palette while editing', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const editor = new TerrainEditor(terrain);
      
      // Cycle through materials with keyboard
      palette.selectNext(); // stone
      editor.selectMaterial(palette.getSelectedMaterial());
      editor.paint(0, 0);
      
      palette.selectNext(); // dirt
      editor.selectMaterial(palette.getSelectedMaterial());
      editor.paint(1, 0);
      
      expect(terrain.getTile(0, 0).material).to.equal('stone');
      expect(terrain.getTile(1, 0).material).to.equal('dirt');
    });
  });
  
  describe('ToolBar + TerrainEditor Integration', function() {
    
    it('should switch between brush and fill tools', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const toolbar = new ToolBar();
      const editor = new TerrainEditor(terrain);
      
      // Select brush tool
      toolbar.selectTool('brush');
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // Use brush
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      
      // Switch to fill tool
      toolbar.selectTool('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
      
      // Editor should still work
      editor.selectMaterial('dirt');
      editor.fill(0, 0);
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
      expect(terrain.getTile(0, 0).material).to.equal('dirt');
    });
    
    it('should enable/disable undo/redo based on editor state', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const toolbar = new ToolBar();
      const editor = new TerrainEditor(terrain);
      
      // Initially, no undo available
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.false;
      
      // Make a change
      editor.selectMaterial('stone');
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
      const terrain = new CustomTerrain(15, 15, 32, 'moss');
      
      const brushControl = new BrushSizeControl(1);
      const editor = new TerrainEditor(terrain);
      
      editor.selectMaterial('stone');
      
      // Paint with size 1 (single tile)
      brushControl.setSize(1);
      editor.setBrushSize(brushControl.getSize());
      editor.paint(10, 10);
      
      expect(terrain.getTile(10, 10).material).to.equal('stone');
      
      // Paint with size 3 (circular brush, plus shape)
      brushControl.setSize(3);
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      
      // Check center and cardinal directions (circular brush)
      expect(terrain.getTile(5, 5).material).to.equal('dirt'); // Center
      expect(terrain.getTile(4, 5).material).to.equal('dirt'); // Left
      expect(terrain.getTile(6, 5).material).to.equal('dirt'); // Right
      expect(terrain.getTile(5, 4).material).to.equal('dirt'); // Top
      expect(terrain.getTile(5, 6).material).to.equal('dirt'); // Bottom
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
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      terrain.setTile(5, 5, 'stone'); // Position (5,5)
      
      const panel = new PropertiesPanel();
      
      // Simulate tile selection
      const tileInfo = {
        position: { x: 5, y: 5 },
        material: terrain.getTile(5, 5).material,
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
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const editor = new TerrainEditor(terrain);
      const panel = new PropertiesPanel();
      panel.setEditor(editor);
      
      // Initial state
      let stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.false;
      expect(stackInfo.undoCount).to.equal(0);
      
      // Make some changes
      editor.selectMaterial('stone');
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
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      // Initialize all UI components
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      const panel = new PropertiesPanel();
      const editor = new TerrainEditor(terrain);
      
      panel.setEditor(editor);
      
      // 1. Select material from palette
      palette.selectMaterial('stone');
      editor.selectMaterial(palette.getSelectedMaterial());
      
      // 2. Select brush tool
      toolbar.selectTool('brush');
      
      // 3. Set brush size
      brushControl.setSize(3);
      editor.setBrushSize(brushControl.getSize());
      
      // 4. Paint
      editor.paint(5, 5);
      
      // 5. Verify changes
      expect(terrain.getTile(5, 5).material).to.equal('stone');
      
      // 6. Check properties panel
      const stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
      expect(stackInfo.undoCount).to.equal(1);
      
      // 7. Undo
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.true;
      editor.undo();
      
      // 8. Verify undo worked
      expect(terrain.getTile(5, 5).material).to.equal('moss');
      
      // 9. Switch to fill tool
      toolbar.selectTool('fill');
      palette.selectMaterial('dirt');
      editor.selectMaterial(palette.getSelectedMaterial());
      editor.fill(0, 0);
      
      // 10. Verify fill
      expect(terrain.getTile(0, 0).material).to.equal('dirt');
    });
  });
  
  describe('UI Click Handling Integration', function() {
    
    it('should handle MaterialPalette clicks', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      
      // Initially moss is selected (index 0)
      expect(palette.getSelectedMaterial()).to.equal('moss');
      
      // Simulate click on stone swatch (position based on render layout)
      // Panel at (10, 10), swatches start at (10+5, 10+30), size 40x40, spacing 5
      // moss: (15, 40), stone: (60, 40), dirt: (15, 85), grass: (60, 85)
      const panelX = 10;
      const panelY = 10;
      
      // Click stone (second swatch, top-right)
      const stoneX = panelX + 5 + 40 + 5 + 20; // center of second swatch
      const stoneY = panelY + 30 + 20; // center vertically
      
      const handled = palette.handleClick(stoneX, stoneY, panelX, panelY);
      expect(handled).to.be.true;
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should handle ToolBar clicks', function() {
      const toolbar = new ToolBar();
      
      // Initially brush is selected
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // Simulate click on fill tool (second button)
      // Panel at (10, 10), buttons start at (10+5, 10+30), size 35x35, spacing 5
      const panelX = 10;
      const panelY = 10;
      
      // Click fill tool (second button)
      const fillX = panelX + 5 + 17; // center of button
      const fillY = panelY + 30 + 35 + 5 + 17; // second button position
      
      const tool = toolbar.handleClick(fillX, fillY, panelX, panelY);
      expect(tool).to.equal('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
    });
    
    it('should handle BrushSizeControl clicks', function() {
      const brushControl = new BrushSizeControl(1);
      
      // Initially size is 1
      expect(brushControl.getSize()).to.equal(1);
      
      // Panel at (10, 10)
      const panelX = 10;
      const panelY = 10;
      
      // Click increase button (right side)
      const increaseX = panelX + 90 - 25 + 10; // center of increase button
      const increaseY = panelY + 25 + 10;
      
      let action = brushControl.handleClick(increaseX, increaseY, panelX, panelY);
      expect(action).to.equal('increase');
      expect(brushControl.getSize()).to.equal(3);
      
      // Click increase again
      action = brushControl.handleClick(increaseX, increaseY, panelX, panelY);
      expect(action).to.equal('increase');
      expect(brushControl.getSize()).to.equal(5);
      
      // Click decrease button (left side)
      const decreaseX = panelX + 5 + 10;
      const decreaseY = panelY + 25 + 10;
      
      action = brushControl.handleClick(decreaseX, decreaseY, panelX, panelY);
      expect(action).to.equal('decrease');
      expect(brushControl.getSize()).to.equal(3);
    });
    
    it('should test BrushSizeControl with detailed coordinate mapping', function() {
      const brushControl = new BrushSizeControl(1, 1, 9);
      
      const panelX = 50;
      const panelY = 100;
      
      // Test initial state
      expect(brushControl.getSize()).to.equal(1);
      expect(brushControl.minSize).to.equal(1);
      expect(brushControl.maxSize).to.equal(9);
      
      // Decrease button is at: (panelX + 5, panelY + 25) with size 20x20
      // Center point: (panelX + 15, panelY + 35)
      const decreaseButtonX = panelX + 5;
      const decreaseButtonY = panelY + 25;
      const decreaseCenterX = decreaseButtonX + 10;
      const decreaseCenterY = decreaseButtonY + 10;
      
      // Increase button is at: (panelX + 65, panelY + 25) with size 20x20
      // Center point: (panelX + 75, panelY + 35)
      const increaseButtonX = panelX + 90 - 25; // panelWidth - 25
      const increaseButtonY = panelY + 25;
      const increaseCenterX = increaseButtonX + 10;
      const increaseCenterY = increaseButtonY + 10;
      
      // Test clicking increase button multiple times
      for (let expectedSize = 3; expectedSize <= 9; expectedSize += 2) {
        const result = brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
        expect(result).to.equal('increase', `Should return 'increase' when clicking at (${increaseCenterX}, ${increaseCenterY})`);
        expect(brushControl.getSize()).to.equal(expectedSize, `Size should be ${expectedSize}`);
      }
      
      // At max size (9), clicking increase should not go beyond
      const beforeMaxClick = brushControl.getSize();
      brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(beforeMaxClick, 'Should not exceed max size');
      
      // Test clicking decrease button
      for (let expectedSize = 7; expectedSize >= 1; expectedSize -= 2) {
        const result = brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
        expect(result).to.equal('decrease', `Should return 'decrease' when clicking at (${decreaseCenterX}, ${decreaseCenterY})`);
        expect(brushControl.getSize()).to.equal(expectedSize, `Size should be ${expectedSize}`);
      }
      
      // At min size (1), clicking decrease should not go below
      const beforeMinClick = brushControl.getSize();
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(beforeMinClick, 'Should not go below min size');
    });
    
    it('should test BrushSizeControl edge detection boundaries', function() {
      const brushControl = new BrushSizeControl(3, 1, 9);
      const panelX = 0;
      const panelY = 0;
      
      // Decrease button bounds: x=[5, 25], y=[25, 45]
      // Test just inside boundaries
      expect(brushControl.handleClick(6, 26, panelX, panelY)).to.equal('decrease');
      expect(brushControl.handleClick(24, 44, panelX, panelY)).to.equal('decrease');
      
      // Reset
      brushControl.setSize(3);
      
      // Test just outside boundaries (should return null)
      expect(brushControl.handleClick(4, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(6, 24, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(26, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(6, 46, panelX, panelY)).to.be.null;
      
      // Increase button bounds: x=[65, 85], y=[25, 45]
      // Test just inside boundaries
      expect(brushControl.handleClick(66, 26, panelX, panelY)).to.equal('increase');
      expect(brushControl.handleClick(84, 44, panelX, panelY)).to.equal('increase');
      
      // Test just outside boundaries
      expect(brushControl.handleClick(64, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(86, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(70, 24, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(70, 46, panelX, panelY)).to.be.null;
    });
    
    it('should test BrushSizeControl with panel offset positions', function() {
      const brushControl = new BrushSizeControl(1, 1, 9);
      
      // Test with various panel positions
      const positions = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 100, y: 200 },
        { x: 500, y: 300 }
      ];
      
      positions.forEach(pos => {
        brushControl.setSize(1);
        
        // Calculate button centers relative to panel position
        const increaseCenterX = pos.x + 90 - 25 + 10;
        const increaseCenterY = pos.y + 25 + 10;
        
        // Click increase button
        const result = brushControl.handleClick(increaseCenterX, increaseCenterY, pos.x, pos.y);
        expect(result).to.equal('increase', 
          `Should detect increase click at panel position (${pos.x}, ${pos.y})`);
        expect(brushControl.getSize()).to.equal(3);
      });
    });
    
    it('should verify BrushSizeControl size constraints', function() {
      const brushControl = new BrushSizeControl(5, 1, 9);
      
      // Test that size is always odd
      expect(brushControl.getSize() % 2).to.equal(1, 'Initial size should be odd');
      
      const panelX = 10;
      const panelY = 10;
      const increaseCenterX = panelX + 75;
      const increaseCenterY = panelY + 35;
      const decreaseCenterX = panelX + 15;
      const decreaseCenterY = panelY + 35;
      
      // Test increase maintains odd sizes
      brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(7);
      expect(brushControl.getSize() % 2).to.equal(1, 'Size should remain odd after increase');
      
      brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(9);
      
      // Test decrease maintains odd sizes
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(7);
      expect(brushControl.getSize() % 2).to.equal(1, 'Size should remain odd after decrease');
      
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(5);
    });
    
    it('should integrate BrushSizeControl clicks with LevelEditor workflow', function() {
      const terrain = new CustomTerrain(20, 20, 32, 'moss');
      const editor = new TerrainEditor(terrain);
      const brushControl = new BrushSizeControl(1, 1, 9);
      
      // Simulate LevelEditor panel positions
      const brushPanelX = 10;
      const brushPanelY = 290; // Below palette and toolbar
      
      // Calculate button positions exactly as they appear in LevelEditor
      const increaseButtonX = brushPanelX + 90 - 25; // Right side: panelWidth(90) - 25
      const increaseButtonY = brushPanelY + 25;
      const increaseCenterX = increaseButtonX + 10; // Center of 20px button
      const increaseCenterY = increaseButtonY + 10;
      
      const decreaseButtonX = brushPanelX + 5; // Left side
      const decreaseButtonY = brushPanelY + 25;
      const decreaseCenterX = decreaseButtonX + 10;
      const decreaseCenterY = decreaseButtonY + 10;
      
      // Verify initial state
      expect(brushControl.getSize()).to.equal(1);
      
      // Simulate user clicking increase button to size 3
      brushControl.handleClick(increaseCenterX, increaseCenterY, brushPanelX, brushPanelY);
      expect(brushControl.getSize()).to.equal(3);
      
      // Apply size to editor and paint
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      // Verify circular brush pattern (center + cardinal directions, not corners)
      // For brush size 3, radius=1, corners at distance=1.414 are excluded
      expect(terrain.getTile(10, 10).material).to.equal('stone'); // Center
      expect(terrain.getTile(9, 10).material).to.equal('stone'); // Left
      expect(terrain.getTile(11, 10).material).to.equal('stone'); // Right
      expect(terrain.getTile(10, 9).material).to.equal('stone'); // Top
      expect(terrain.getTile(10, 11).material).to.equal('stone'); // Bottom
      
      // Corners should NOT be painted (circular brush)
      expect(terrain.getTile(9, 9).material).to.equal('moss'); // Top-left corner
      expect(terrain.getTile(11, 11).material).to.equal('moss'); // Bottom-right corner
      
      // Increase to size 5
      brushControl.handleClick(increaseCenterX, increaseCenterY, brushPanelX, brushPanelY);
      expect(brushControl.getSize()).to.equal(5);
      
      // Apply to editor
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('dirt');
      editor.paint(15, 15);
      
      // Verify circular brush size 5 (radius=2)
      // Center + tiles within radius 2 (distance <= 2)
      expect(terrain.getTile(15, 15).material).to.equal('dirt'); // Center
      expect(terrain.getTile(13, 15).material).to.equal('dirt'); // 2 tiles left
      expect(terrain.getTile(17, 15).material).to.equal('dirt'); // 2 tiles right
      expect(terrain.getTile(15, 13).material).to.equal('dirt'); // 2 tiles up
      expect(terrain.getTile(15, 17).material).to.equal('dirt'); // 2 tiles down
      expect(terrain.getTile(14, 14).material).to.equal('dirt'); // Diagonal distance 1.414
      
      // Decrease back to size 3
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, brushPanelX, brushPanelY);
      expect(brushControl.getSize()).to.equal(3);
      
      // Apply to editor
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('grass');
      editor.paint(5, 5);
      
      // Verify circular brush size 3 again
      expect(terrain.getTile(5, 5).material).to.equal('grass'); // Center
      expect(terrain.getTile(4, 5).material).to.equal('grass'); // Left
      expect(terrain.getTile(6, 5).material).to.equal('grass'); // Right
      expect(terrain.getTile(5, 4).material).to.equal('grass'); // Top
      expect(terrain.getTile(5, 6).material).to.equal('grass'); // Bottom
    });
    
    it('should test full mouse interaction sequence with brush sizes', function() {
      const terrain = new CustomTerrain(30, 30, 32, 'moss');
      const editor = new TerrainEditor(terrain);
      const brushControl = new BrushSizeControl(1, 1, 9);
      const notifications = new NotificationManager();
      
      const panelX = 10;
      const panelY = 100;
      
      // Test complete workflow with circular brush patterns
      const workflow = [
        { 
          action: 'increase', 
          expectedSize: 3,
          paintX: 5, 
          paintY: 5,
          material: 'stone',
          verifyTiles: [[5,5], [4,5], [6,5], [5,4], [5,6]] // Plus shape, not square
        },
        { 
          action: 'increase', 
          expectedSize: 5,
          paintX: 15, 
          paintY: 15,
          material: 'dirt',
          verifyTiles: [[15,15], [13,15], [17,15], [15,13], [15,17], [14,14]] // Circular
        },
        { 
          action: 'increase', 
          expectedSize: 7,
          paintX: 25, 
          paintY: 25,
          material: 'grass',
          verifyTiles: [[25,25], [22,25], [28,25], [25,22], [25,28]] // Center + radius 3
        },
        { 
          action: 'decrease', 
          expectedSize: 5,
          paintX: 10, 
          paintY: 10,
          material: 'stone',
          verifyTiles: [[10,10], [8,10], [12,10], [10,8], [10,12]] // Circular
        },
        { 
          action: 'decrease', 
          expectedSize: 3,
          paintX: 20, 
          paintY: 20,
          material: 'dirt',
          verifyTiles: [[20,20], [19,20], [21,20], [20,19], [20,21]] // Plus shape
        },
        { 
          action: 'decrease', 
          expectedSize: 1,
          paintX: 12, 
          paintY: 12,
          material: 'grass',
          verifyTiles: [[12,12]] // Single tile
        }
      ];
      
      workflow.forEach((step, index) => {
        // Click appropriate button
        let clickX, clickY;
        if (step.action === 'increase') {
          clickX = panelX + 90 - 25 + 10;
          clickY = panelY + 25 + 10;
        } else {
          clickX = panelX + 5 + 10;
          clickY = panelY + 25 + 10;
        }
        
        const result = brushControl.handleClick(clickX, clickY, panelX, panelY);
        expect(result).to.equal(step.action, `Step ${index + 1}: Should ${step.action}`);
        expect(brushControl.getSize()).to.equal(step.expectedSize, 
          `Step ${index + 1}: Size should be ${step.expectedSize}`);
        
        // Notify user
        notifications.show(`Brush size: ${brushControl.getSize()}`);
        
        // Apply to editor and paint
        editor.setBrushSize(brushControl.getSize());
        editor.selectMaterial(step.material);
        editor.paint(step.paintX, step.paintY);
        
        // Verify painted tiles
        step.verifyTiles.forEach(([x, y]) => {
          const tile = terrain.getTile(x, y);
          expect(tile).to.not.be.null;
          expect(tile.material).to.equal(step.material, 
            `Step ${index + 1}: Tile at (${x}, ${y}) should be ${step.material}`);
        });
      });
      
      // Verify notification history
      expect(notifications.getHistory()).to.have.lengthOf(6);
    });
    
    it('should containsPoint checks for UI panels', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      
      const paletteX = 10;
      const paletteY = 10;
      
      // Point inside palette
      expect(palette.containsPoint(20, 20, paletteX, paletteY)).to.be.true;
      
      // Point outside palette
      expect(palette.containsPoint(200, 200, paletteX, paletteY)).to.be.false;
      
      // Point inside toolbar
      const toolbarX = 100;
      const toolbarY = 10;
      expect(toolbar.containsPoint(110, 20, toolbarX, toolbarY)).to.be.true;
      
      // Point inside brush control
      const brushX = 10;
      const brushY = 100;
      expect(brushControl.containsPoint(20, 110, brushX, brushY)).to.be.true;
    });
    
    it('should integrate click handling with TerrainEditor', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      const editor = new TerrainEditor(terrain);
      
      // Setup panel positions
      const paletteX = 10;
      const paletteY = 10;
      const toolbarX = 100;
      const toolbarY = 10;
      const brushX = 10;
      const brushY = 100;
      
      // 1. Click stone in palette
      const stoneX = paletteX + 5 + 40 + 5 + 20;
      const stoneY = paletteY + 30 + 20;
      palette.handleClick(stoneX, stoneY, paletteX, paletteY);
      editor.selectMaterial(palette.getSelectedMaterial());
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
      
      // 2. Click brush in toolbar
      const brushToolX = toolbarX + 5 + 17;
      const brushToolY = toolbarY + 30 + 17;
      toolbar.handleClick(brushToolX, brushToolY, toolbarX, toolbarY);
      
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // 3. Click increase in brush size
      const increaseX = brushX + 90 - 25 + 10;
      const increaseY = brushY + 25 + 10;
      brushControl.handleClick(increaseX, increaseY, brushX, brushY);
      editor.setBrushSize(brushControl.getSize());
      
      expect(brushControl.getSize()).to.equal(3);
      
      // 4. Paint with brush
      editor.paint(5, 5);
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
    });
    
    it('should not handle clicks outside UI panels', function() {
      const palette = new MaterialPalette(['moss', 'stone']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      
      const panelX = 10;
      const panelY = 10;
      
      // Click way outside all panels
      const outsideX = 1000;
      const outsideY = 1000;
      
      expect(palette.handleClick(outsideX, outsideY, panelX, panelY)).to.be.false;
      expect(toolbar.handleClick(outsideX, outsideY, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(outsideX, outsideY, panelX, panelY)).to.be.null;
    });
  });
  
  describe('NotificationManager History Integration', function() {
    
    it('should track notification history', function() {
      const notifications = new NotificationManager();
      
      // Show some notifications
      notifications.show('Action 1', 'info');
      notifications.show('Action 2', 'success');
      notifications.show('Action 3', 'warning');
      
      // Get history
      const history = notifications.getHistory();
      expect(history.length).to.equal(3);
      expect(history[0].message).to.equal('Action 1');
      expect(history[1].message).to.equal('Action 2');
      expect(history[2].message).to.equal('Action 3');
    });
    
    it('should maintain history after notifications expire', function() {
      const notifications = new NotificationManager(100); // 100ms duration
      
      notifications.show('Temporary message', 'info');
      
      // Before expiration
      expect(notifications.getNotifications().length).to.equal(1);
      expect(notifications.getHistory().length).to.equal(1);
      
      // Simulate time passing
      const futureTime = Date.now() + 200;
      notifications.removeExpired(futureTime);
      
      // After expiration - active is 0, history still has 1
      expect(notifications.getNotifications().length).to.equal(0);
      expect(notifications.getHistory().length).to.equal(1);
    });
    
    it('should limit history size', function() {
      const notifications = new NotificationManager(3000, 5); // max 5 in history
      
      // Show 10 notifications
      for (let i = 1; i <= 10; i++) {
        notifications.show(`Message ${i}`, 'info');
      }
      
      // History should only keep last 5
      const history = notifications.getHistory();
      expect(history.length).to.equal(5);
      expect(history[0].message).to.equal('Message 6');
      expect(history[4].message).to.equal('Message 10');
    });
    
    it('should get recent history items', function() {
      const notifications = new NotificationManager();
      
      for (let i = 1; i <= 10; i++) {
        notifications.show(`Message ${i}`, 'info');
      }
      
      // Get last 3
      const recent = notifications.getHistory(3);
      expect(recent.length).to.equal(3);
      expect(recent[0].message).to.equal('Message 8');
      expect(recent[1].message).to.equal('Message 9');
      expect(recent[2].message).to.equal('Message 10');
    });
    
    it('should integrate history with TerrainEditor workflow', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      const editor = new TerrainEditor(terrain);
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const notifications = new NotificationManager();
      
      // Track editing actions in notifications
      palette.selectMaterial('stone');
      notifications.show(`Selected material: ${palette.getSelectedMaterial()}`);
      
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      notifications.show('Painted stone at (5, 5)');
      
      editor.undo();
      notifications.show('Undid last action');
      
      // Verify history
      const history = notifications.getHistory();
      expect(history.length).to.equal(3);
      expect(history[0].message).to.equal('Selected material: stone');
      expect(history[1].message).to.equal('Painted stone at (5, 5)');
      expect(history[2].message).to.equal('Undid last action');
    });
  });
});
