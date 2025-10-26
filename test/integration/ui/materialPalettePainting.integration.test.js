/**
 * Integration Tests - Material Palette Painting
 * 
 * Tests the complete flow from clicking a material swatch to painting terrain
 */

const { JSDOM } = require('jsdom');
const { expect } = require('chai');
const sinon = require('sinon');

describe('Material Palette Painting Integration', function() {
  let dom, window, document;
  let MaterialPalette, TerrainEditor, LevelEditor, LevelEditorPanels;
  let palette, terrainEditor, levelEditor, mockTerrain, mockTile;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      url: 'http://localhost'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.noFill = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.textWidth = sinon.stub().returns(20);
    global.translate = sinon.stub();
    global.image = sinon.stub();
    global.tint = sinon.stub();
    
    // p5 constants
    global.CENTER = 'center';
    global.LEFT = 'left';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    
    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.noStroke = global.noStroke;
    window.noFill = global.noFill;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.textWidth = global.textWidth;
    window.translate = global.translate;
    window.image = global.image;
    window.tint = global.tint;
    window.CENTER = global.CENTER;

    // Mock terrain images
    const mockTerrainImages = {
      MOSS_IMAGE: { _mockImage: true, name: 'MOSS_IMAGE' },
      STONE_IMAGE: { _mockImage: true, name: 'STONE_IMAGE' },
      DIRT_IMAGE: { _mockImage: true, name: 'DIRT_IMAGE' },
      GRASS_IMAGE: { _mockImage: true, name: 'GRASS_IMAGE' }
    };
    
    global.MOSS_IMAGE = mockTerrainImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockTerrainImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockTerrainImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockTerrainImages.GRASS_IMAGE;
    
    window.MOSS_IMAGE = global.MOSS_IMAGE;
    window.STONE_IMAGE = global.STONE_IMAGE;
    window.DIRT_IMAGE = global.DIRT_IMAGE;
    window.GRASS_IMAGE = global.GRASS_IMAGE;

    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [[0, 0.3], (x, y, squareSize) => global.image(global.MOSS_IMAGE, x, y, squareSize, squareSize)],
      'moss_1': [[0.375, 0.4], (x, y, squareSize) => global.image(global.MOSS_IMAGE, x, y, squareSize, squareSize)],
      'stone': [[0, 0.4], (x, y, squareSize) => global.image(global.STONE_IMAGE, x, y, squareSize, squareSize)],
      'dirt': [[0.4, 0.525], (x, y, squareSize) => global.image(global.DIRT_IMAGE, x, y, squareSize, squareSize)],
      'grass': [[0, 1], (x, y, squareSize) => global.image(global.GRASS_IMAGE, x, y, squareSize, squareSize)]
    };
    
    window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;

    // Mock tile
    mockTile = {
      _material: 'grass',
      getMaterial: sinon.stub().callsFake(function() { return this._material; }),
      setMaterial: sinon.stub().callsFake(function(mat) { this._material = mat; }),
      assignWeight: sinon.stub()
    };

    // Mock terrain
    mockTerrain = {
      _tileSize: 32,
      _chunkSize: 16,
      _gridSizeX: 4,
      _gridSizeY: 4,
      tileSize: 32,
      getArrPos: sinon.stub().returns(mockTile),
      getTile: sinon.stub().returns(mockTile),
      invalidateCache: sinon.stub()
    };

    // Load classes
    MaterialPalette = require('../../../Classes/ui/MaterialPalette');
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

    // Create instances
    palette = new MaterialPalette();
    terrainEditor = new TerrainEditor(mockTerrain);
  });

  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });

  describe('Material Selection to Painting Flow', function() {
    it('should select material from palette and use it for painting', function() {
      // Step 1: Click on stone material in palette
      const panelX = 100;
      const panelY = 100;
      const spacing = 5;
      const swatchSize = 40;
      
      // Stone is the 3rd material (index 2) - second row, first column
      const stoneX = panelX + spacing + (swatchSize / 2);
      const stoneY = panelY + spacing + swatchSize + spacing + (swatchSize / 2);
      
      palette.handleClick(stoneX, stoneY, panelX, panelY);
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
      
      // Step 2: Use selected material for painting
      const selectedMaterial = palette.getSelectedMaterial();
      terrainEditor.selectMaterial(selectedMaterial);
      
      expect(terrainEditor._selectedMaterial).to.equal('stone');
      
      // Step 3: Paint tile
      terrainEditor.paintTile(5 * 32, 5 * 32);
      
      // Verify tile was painted with 'stone' material
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
    });

    it('should paint actual terrain material, not color', function() {
      // Select moss
      palette.selectMaterial('moss');
      const material = palette.getSelectedMaterial();
      
      // Material should be a string name, not a color code
      expect(material).to.equal('moss');
      expect(material).to.not.match(/^#[0-9A-F]{6}$/i);
      
      // Paint with terrain editor
      terrainEditor.selectMaterial(material);
      terrainEditor.paintTile(10 * 32, 10 * 32);
      
      // Tile should have material name
      expect(mockTile.setMaterial.calledWith('moss')).to.be.true;
      expect(mockTile.setMaterial.calledWith(sinon.match(/^#/))).to.be.false;
    });

    it('should work for all terrain materials', function() {
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        mockTile.setMaterial.resetHistory();
        
        // Select material
        palette.selectMaterial(material);
        expect(palette.getSelectedMaterial()).to.equal(material);
        
        // Paint
        terrainEditor.selectMaterial(material);
        terrainEditor.paintTile(5 * 32, 5 * 32);
        
        // Verify
        expect(mockTile.setMaterial.calledWith(material)).to.be.true;
      });
    });
  });

  describe('Material Rendering with Textures', function() {
    it('should render selected material with terrain texture', function() {
      // Select dirt
      palette.selectMaterial('dirt');
      
      global.image.resetHistory();
      
      // Render palette
      palette.render(10, 10);
      
      // Should have rendered terrain texture images (not colors)
      expect(global.image.callCount).to.equal(5); // All 5 materials
      
      // Verify dirt image was used
      const dirtImageCalls = global.image.getCalls().filter(call => 
        call.args[0] === global.DIRT_IMAGE
      );
      expect(dirtImageCalls.length).to.equal(1);
    });

    it('should highlight selected material visually', function() {
      palette.selectMaterial('stone');
      
      global.rect.resetHistory();
      palette.render(10, 10);
      
      // Should have drawn highlight border
      expect(global.rect.called).to.be.true;
      
      // Should have set yellow color for highlight (255, 255, 0)
      const fillCalls = global.fill.getCalls();
      const yellowCalls = fillCalls.filter(call =>
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowCalls.length).to.be.greaterThan(0);
    });
  });

  describe('Click Detection Accuracy', function() {
    it('should detect clicks within swatch boundaries', function() {
      const panelX = 50;
      const panelY = 50;
      const spacing = 5;
      const swatchSize = 40;
      
      // Test clicking at various points within first swatch
      const testPoints = [
        { x: panelX + spacing + 1, y: panelY + spacing + 1 }, // Top-left corner
        { x: panelX + spacing + (swatchSize / 2), y: panelY + spacing + (swatchSize / 2) }, // Center
        { x: panelX + spacing + swatchSize - 1, y: panelY + spacing + swatchSize - 1 } // Bottom-right corner
      ];
      
      testPoints.forEach(point => {
        palette.selectMaterial('stone'); // Reset to different material
        const handled = palette.handleClick(point.x, point.y, panelX, panelY);
        
        expect(handled).to.be.true;
        expect(palette.getSelectedMaterial()).to.equal('moss');
      });
    });

    it('should not detect clicks in gaps between swatches', function() {
      const panelX = 50;
      const panelY = 50;
      const spacing = 5;
      const swatchSize = 40;
      
      palette.selectMaterial('moss');
      
      // Click in the gap between first and second swatch
      const gapX = panelX + spacing + swatchSize + (spacing / 2);
      const gapY = panelY + spacing + (swatchSize / 2);
      
      const handled = palette.handleClick(gapX, gapY, panelX, panelY);
      
      expect(handled).to.be.false;
      expect(palette.getSelectedMaterial()).to.equal('moss'); // Unchanged
    });
  });

  describe('Material Name Consistency', function() {
    it('should use same material names throughout the flow', function() {
      const selectedMaterial = 'grass';
      
      // Select in palette
      palette.selectMaterial(selectedMaterial);
      const paletteSelection = palette.getSelectedMaterial();
      
      // Set in editor
      terrainEditor.selectMaterial(paletteSelection);
      const editorSelection = terrainEditor._selectedMaterial;
      
      // Paint
      terrainEditor.paintTile(10 * 32, 10 * 32);
      const paintedMaterial = mockTile.setMaterial.getCall(0).args[0];
      
      // All should be identical
      expect(paletteSelection).to.equal(selectedMaterial);
      expect(editorSelection).to.equal(selectedMaterial);
      expect(paintedMaterial).to.equal(selectedMaterial);
    });

    it('should maintain material compatibility with TERRAIN_MATERIALS_RANGED', function() {
      const materials = palette.getMaterials();
      
      materials.forEach(material => {
        // Should exist in TERRAIN_MATERIALS_RANGED
        expect(global.TERRAIN_MATERIALS_RANGED).to.have.property(material);
        
        // Should have render function
        const renderFunction = global.TERRAIN_MATERIALS_RANGED[material][1];
        expect(renderFunction).to.be.a('function');
      });
    });
  });
});
