/**
 * Unit Tests - PropertiesPanel
 * 
 * Tests for:
 * 1. Tile count calculation from CustomTerrain
 * 2. Display of actual terrain data
 * 3. Proper integration as content within DraggablePanel
 * 4. Update method to refresh tile counts
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('PropertiesPanel - Unit Tests', function() {
  let PropertiesPanel;
  let panel;
  let mockTerrain;
  let mockEditor;

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
    global.CENTER = 'center';
    global.TOP = 'top';
    global.LEFT = 'left';

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
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.LEFT = global.LEFT;
    }

    // Mock terrain with CustomTerrain-like interface
    mockTerrain = {
      width: 10,
      height: 10,
      tiles: [],
      getTileCount: sinon.stub().returns(100),
      getStatistics: sinon.stub().returns({
        totalTiles: 100,
        materials: { grass: 60, dirt: 40 },
        diversity: 0.50
      })
    };

    // Create tiles array
    for (let y = 0; y < 10; y++) {
      mockTerrain.tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        mockTerrain.tiles[y][x] = {
          material: x < 5 ? 'grass' : 'dirt',
          weight: 1,
          passable: true
        };
      }
    }

    // Mock editor
    mockEditor = {
      canUndo: sinon.stub().returns(true),
      canRedo: sinon.stub().returns(false),
      undoStack: [1, 2, 3],
      redoStack: []
    };

    // Load PropertiesPanel
    PropertiesPanel = require('../../../Classes/ui/PropertiesPanel');
    panel = new PropertiesPanel();
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
    delete global.CENTER;
    delete global.TOP;
    delete global.LEFT;
  });

  describe('Terrain Statistics', function() {
    it('should calculate total tiles from CustomTerrain', function() {
      panel.setTerrain(mockTerrain);
      const stats = panel.getStatistics();
      
      expect(stats.totalTiles).to.equal(100);
    });

    it('should get material diversity from terrain', function() {
      panel.setTerrain(mockTerrain);
      const stats = panel.getStatistics();
      
      expect(stats.diversity).to.equal(0.50);
    });

    it('should return 0 tiles when no terrain set', function() {
      const stats = panel.getStatistics();
      
      expect(stats.totalTiles).to.equal(0);
      expect(stats.diversity).to.equal(0);
    });

    it('should update tile count when terrain changes', function() {
      panel.setTerrain(mockTerrain);
      let stats = panel.getStatistics();
      expect(stats.totalTiles).to.equal(100);

      // Change terrain statistics
      mockTerrain.getStatistics.returns({
        totalTiles: 150,
        materials: { grass: 90, dirt: 60 },
        diversity: 0.60
      });

      stats = panel.getStatistics();
      expect(stats.totalTiles).to.equal(150);
      expect(stats.diversity).to.equal(0.60);
    });
  });

  describe('Update Method', function() {
    it('should have update method to refresh data', function() {
      expect(panel.update).to.be.a('function');
    });

    it('should refresh statistics when update is called', function() {
      panel.setTerrain(mockTerrain);
      panel.setEditor(mockEditor);

      // Initial state
      let displayItems = panel.getDisplayItems();
      const initialTileCount = displayItems.find(item => item.label === 'Total Tiles');
      expect(initialTileCount.value).to.equal('100');

      // Change terrain
      mockTerrain.getStatistics.returns({
        totalTiles: 200,
        materials: { grass: 120, dirt: 80 },
        diversity: 0.60
      });

      // Update should refresh
      panel.update();

      displayItems = panel.getDisplayItems();
      const updatedTileCount = displayItems.find(item => item.label === 'Total Tiles');
      expect(updatedTileCount.value).to.equal('200');
    });
  });

  describe('Content Size for DraggablePanel', function() {
    it('should have getContentSize method', function() {
      expect(panel.getContentSize).to.be.a('function');
    });

    it('should return fixed content dimensions', function() {
      const size = panel.getContentSize();
      
      expect(size).to.have.property('width');
      expect(size).to.have.property('height');
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
    });

    it('should return consistent size for layout', function() {
      const size1 = panel.getContentSize();
      const size2 = panel.getContentSize();
      
      expect(size1.width).to.equal(size2.width);
      expect(size1.height).to.equal(size2.height);
    });
  });

  describe('Rendering as Panel Content', function() {
    it('should accept absolute coordinates for rendering', function() {
      panel.setTerrain(mockTerrain);
      panel.setEditor(mockEditor);

      const contentX = 100;
      const contentY = 200;

      global.text.resetHistory();

      panel.render(contentX, contentY);

      // Verify text was called with offset coordinates
      expect(global.text.called).to.be.true;
      
      // Get first text call (should be a label or value)
      const firstCall = global.text.getCalls().find(call => call.args.length >= 3);
      if (firstCall) {
        const xCoord = firstCall.args[1];
        const yCoord = firstCall.args[2];
        
        // Coordinates should be offset from content position
        expect(xCoord).to.be.at.least(contentX);
        expect(yCoord).to.be.at.least(contentY);
      }
    });

    it('should not render background when used as panel content', function() {
      panel.setTerrain(mockTerrain);

      global.rect.resetHistory();

      // Render with panel flag
      panel.render(10, 10, { isPanelContent: true });

      // Should not draw panel background
      expect(global.rect.called).to.be.false;
    });

    it('should render background when standalone', function() {
      panel.setTerrain(mockTerrain);

      global.rect.resetHistory();

      // Render without panel flag
      panel.render(10, 10);

      // Should draw panel background
      expect(global.rect.called).to.be.true;
    });
  });

  describe('Display Items', function() {
    it('should include Total Tiles in display', function() {
      panel.setTerrain(mockTerrain);
      const items = panel.getDisplayItems();

      const tileItem = items.find(item => item.label === 'Total Tiles');
      expect(tileItem).to.exist;
      expect(tileItem.value).to.equal('100');
    });

    it('should include Diversity in display', function() {
      panel.setTerrain(mockTerrain);
      const items = panel.getDisplayItems();

      const diversityItem = items.find(item => item.label === 'Diversity');
      expect(diversityItem).to.exist;
      expect(diversityItem.value).to.equal('0.50');
    });

    it('should include Undo/Redo status', function() {
      panel.setEditor(mockEditor);
      const items = panel.getDisplayItems();

      const undoItem = items.find(item => item.label === 'Undo Available');
      const redoItem = items.find(item => item.label === 'Redo Available');
      
      expect(undoItem).to.exist;
      expect(undoItem.value).to.equal('Yes');
      expect(redoItem).to.exist;
      expect(redoItem.value).to.equal('No');
    });
  });

  describe('Selected Tile Properties', function() {
    it('should display selected tile when set', function() {
      const tile = {
        position: { x: 5, y: 5 },
        material: 'stone',
        weight: 2,
        passable: false
      };

      panel.setSelectedTile(tile);
      const items = panel.getDisplayItems();

      const materialItem = items.find(item => item.label === 'Material');
      expect(materialItem).to.exist;
      expect(materialItem.value).to.equal('stone');
    });

    it('should not display tile properties when no tile selected', function() {
      panel.setTerrain(mockTerrain);
      const items = panel.getDisplayItems();

      // Should have terrain stats but not tile-specific props
      const tileItem = items.find(item => item.label === 'Total Tiles');
      const materialItem = items.find(item => item.label === 'Material');
      
      expect(tileItem).to.exist; // Terrain stat
      expect(materialItem).to.not.exist; // Tile-specific
    });
  });
});
