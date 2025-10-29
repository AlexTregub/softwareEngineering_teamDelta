/**
 * Integration Tests - PropertiesPanel with CustomTerrain
 * 
 * Tests for:
 * 1. PropertiesPanel displays actual tile counts from CustomTerrain
 * 2. Panel updates when terrain changes
 * 3. Integration with LevelEditorPanels as draggable panel
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('PropertiesPanel Integration Tests', function() {
  let PropertiesPanel;
  let CustomTerrain;
  let TerrainEditor;
  let panel;
  let terrain;
  let editor;

  beforeEach(function() {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.line = sinon.stub();
    global.image = sinon.stub();
    global.CENTER = 'center';
    global.TOP = 'top';
    global.LEFT = 'left';

    // Mock terrain materials
    global.TERRAIN_MATERIALS_RANGED = {
      'grass': [[0, 1], (x, y, s) => {}],
      'dirt': [[0, 0.5], (x, y, s) => {}],
      'stone': [[0.5, 1], (x, y, s) => {}]
    };

    // Sync to window
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.line = global.line;
      window.image = global.image;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.LEFT = global.LEFT;
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }

    // Load classes
    PropertiesPanel = require('../../../Classes/ui/PropertiesPanel');
    CustomTerrain = require('../../../Classes/terrainUtils/CustomTerrain');
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

    // Create instances
    terrain = new CustomTerrain(10, 10, 32);
    editor = new TerrainEditor(terrain);
    panel = new PropertiesPanel();
    panel.setTerrain(terrain);
    panel.setEditor(editor);
  });

  afterEach(function() {
    sinon.restore();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.line;
    delete global.image;
    delete global.CENTER;
    delete global.TOP;
    delete global.LEFT;
    delete global.TERRAIN_MATERIALS_RANGED;
  });

  describe('Real Terrain Integration', function() {
    it('should display actual tile count from CustomTerrain', function() {
      const stats = panel.getStatistics();
      
      expect(stats.totalTiles).to.equal(100); // 10x10 terrain
    });

    it('should update when terrain is painted', function() {
      // Initial state - all grass
      let stats = panel.getStatistics();
      expect(stats.totalTiles).to.equal(100);
      
      // Paint some tiles with dirt
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      editor.paint(6, 5);
      editor.paint(7, 5);
      
      // Update panel
      panel.update();
      stats = panel.getStatistics();
      
      // Total tiles should still be 100
      expect(stats.totalTiles).to.equal(100);
      
      // Should have both materials now
      expect(stats.materials).to.have.property('grass');
      expect(stats.materials).to.have.property('dirt');
      expect(stats.materials['dirt']).to.be.at.least(3);
    });

    it('should calculate diversity correctly', function() {
      // All grass initially
      let stats = panel.getStatistics();
      expect(stats.diversity).to.equal(0); // No diversity, all one material
      
      // Paint half with dirt
      editor.selectMaterial('dirt');
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 5; x++) {
          editor.paint(x, y);
        }
      }
      
      panel.update();
      stats = panel.getStatistics();
      
      // Should have diversity now (50/50 split is max for 2 materials)
      expect(stats.diversity).to.be.greaterThan(0.9);
      expect(stats.materials['grass']).to.equal(50);
      expect(stats.materials['dirt']).to.equal(50);
    });

    it('should show three-material diversity', function() {
      // Paint terrain with three different materials
      editor.selectMaterial('grass');
      for (let i = 0; i < 33; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10);
        editor.paint(x, y);
      }
      
      editor.selectMaterial('dirt');
      for (let i = 33; i < 66; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10);
        editor.paint(x, y);
      }
      
      editor.selectMaterial('stone');
      for (let i = 66; i < 100; i++) {
        const x = i % 10;
        const y = Math.floor(i / 10);
        editor.paint(x, y);
      }
      
      panel.update();
      const stats = panel.getStatistics();
      
      // Should have three materials
      expect(Object.keys(stats.materials).length).to.equal(3);
      expect(stats.materials).to.have.property('grass');
      expect(stats.materials).to.have.property('dirt');
      expect(stats.materials).to.have.property('stone');
      
      // Diversity should be high
      expect(stats.diversity).to.be.greaterThan(0.9);
    });
  });

  describe('Undo/Redo Integration', function() {
    it('should reflect undo availability', function() {
      // Make a change
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      
      const stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
    });

    it('should update after undo', function() {
      // Paint terrain
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      editor.paint(6, 5);
      
      let stats = panel.getStatistics();
      const dirtCountBefore = stats.materials['dirt'];
      
      // Undo
      if (editor.canUndo()) {
        editor.undo();
      }
      
      panel.update();
      stats = panel.getStatistics();
      
      // Should have one less dirt tile
      const dirtCountAfter = stats.materials['dirt'] || 0;
      expect(dirtCountAfter).to.be.lessThan(dirtCountBefore);
    });
  });

  describe('Display Formatting', function() {
    it('should format tile count as string', function() {
      const items = panel.getDisplayItems();
      const tileItem = items.find(item => item.label === 'Total Tiles');
      
      expect(tileItem.value).to.be.a('string');
      expect(tileItem.value).to.equal('100');
    });

    it('should format diversity to 2 decimal places', function() {
      // Paint half with dirt
      editor.selectMaterial('dirt');
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 10; x++) {
          editor.paint(x, y);
        }
      }
      
      panel.update();
      const items = panel.getDisplayItems();
      const diversityItem = items.find(item => item.label === 'Diversity');
      
      expect(diversityItem.value).to.match(/^\d\.\d{2}$/);
    });
  });

  describe('DraggablePanel Integration', function() {
    it('should provide content size for panel', function() {
      const size = panel.getContentSize();
      
      expect(size.width).to.equal(180);
      expect(size.height).to.equal(360);
    });

    it('should render without background when isPanelContent is true', function() {
      global.rect.resetHistory();
      
      panel.render(100, 100, { isPanelContent: true });
      
      expect(global.rect.called).to.be.false;
    });

    it('should render all statistics when used as panel content', function() {
      global.text.resetHistory();
      
      panel.render(100, 100, { isPanelContent: true });
      
      // Should have rendered text for labels and values
      expect(global.text.called).to.be.true;
      const calls = global.text.getCalls();
      
      // Should have Total Tiles label
      const tileLabel = calls.find(call => 
        typeof call.args[0] === 'string' && call.args[0].includes('Total Tiles')
      );
      expect(tileLabel).to.exist;
    });
  });

  describe('Real-time Updates', function() {
    it('should reflect terrain changes immediately after update()', function() {
      // Initial state
      let stats = panel.getStatistics();
      const initialGrass = stats.materials['grass'] || 0;
      
      // Paint
      editor.selectMaterial('dirt');
      editor.paint(0, 0);
      
      // Before update - stats should change (getStatistics is called fresh)
      stats = panel.getStatistics();
      const currentGrass = stats.materials['grass'] || 0;
      
      expect(currentGrass).to.be.lessThan(initialGrass);
      expect(stats.materials['dirt']).to.equal(1);
    });

    it('should work with brush size changes', function() {
      // Set brush size 3
      editor.setBrushSize(3);
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      
      panel.update();
      const stats = panel.getStatistics();
      
      // 3x3 brush should paint 9 tiles
      expect(stats.materials['stone']).to.be.at.least(9);
    });
  });
});
