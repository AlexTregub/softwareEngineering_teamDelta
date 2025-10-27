/**
 * Unit Tests - MaterialPalette Interaction
 * 
 * Tests for:
 * 1. Text centering on material swatches
 * 2. Material swatches centered on panel
 * 3. Click detection for material selection
 * 4. Material painting (not just colors)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('MaterialPalette - User Interaction', function() {
  let MaterialPalette;
  let palette;
  let mockTerrainImages;

  beforeEach(function() {
    // Setup UI test environment
    setupUITestEnvironment();
    
    // Mock terrain images
    mockTerrainImages = {
      MOSS_IMAGE: { _mockImage: true, name: 'MOSS_IMAGE' },
      STONE_IMAGE: { _mockImage: true, name: 'STONE_IMAGE' },
      DIRT_IMAGE: { _mockImage: true, name: 'DIRT_IMAGE' },
      GRASS_IMAGE: { _mockImage: true, name: 'GRASS_IMAGE' }
    };
    
    // Set global terrain images
    global.MOSS_IMAGE = mockTerrainImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockTerrainImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockTerrainImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockTerrainImages.GRASS_IMAGE;
    
    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [[0, 0.3], (x, y, squareSize) => global.image(global.MOSS_IMAGE, x, y, squareSize, squareSize)],
      'moss_1': [[0.375, 0.4], (x, y, squareSize) => global.image(global.MOSS_IMAGE, x, y, squareSize, squareSize)],
      'stone': [[0, 0.4], (x, y, squareSize) => global.image(global.STONE_IMAGE, x, y, squareSize, squareSize)],
      'dirt': [[0.4, 0.525], (x, y, squareSize) => global.image(global.DIRT_IMAGE, x, y, squareSize, squareSize)],
      'grass': [[0, 1], (x, y, squareSize) => global.image(global.GRASS_IMAGE, x, y, squareSize, squareSize)]
    };
    
    if (typeof window !== 'undefined') {
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }
    
    // Load MaterialPalette
    MaterialPalette = require('../../../Classes/ui/MaterialPalette');
    
    // Create palette - should auto-populate from TERRAIN_MATERIALS_RANGED
    palette = new MaterialPalette();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Text Centering on Swatches', function() {
    it('should call textAlign with CENTER for both horizontal and vertical', function() {
      global.textAlign.resetHistory();
      
      palette.render(10, 10);
      
      // Should have called textAlign with CENTER, CENTER
      const centerCalls = global.textAlign.getCalls().filter(call => {
        return call.args[0] === global.CENTER && call.args[1] === global.CENTER;
      });
      
      expect(centerCalls.length).to.be.greaterThan(0);
    });
    
    it('should position text at center of swatch', function() {
      global.text.resetHistory();
      
      const panelX = 100;
      const panelY = 100;
      const swatchSize = 40;
      const spacing = 5;
      
      palette.render(panelX, panelY);
      
      // First material text should be centered in first swatch
      const textCalls = global.text.getCalls();
      expect(textCalls.length).to.be.greaterThan(0);
      
      const firstTextCall = textCalls[0];
      const expectedCenterX = panelX + spacing + (swatchSize / 2);
      const expectedCenterY = panelY + spacing + (swatchSize / 2);
      
      expect(firstTextCall.args[1]).to.equal(expectedCenterX);
      expect(firstTextCall.args[2]).to.equal(expectedCenterY);
    });
    
    it('should render text for all materials', function() {
      global.text.resetHistory();
      
      palette.render(10, 10);
      
      // Should have text calls for all 5 materials
      const textCalls = global.text.getCalls();
      expect(textCalls.length).to.equal(5);
    });
  });
  
  describe('Material Swatch Centering on Panel', function() {
    it('should calculate content size correctly', function() {
      const contentSize = palette.getContentSize();
      
      const swatchSize = 40;
      const spacing = 5;
      const columns = 2;
      
      const expectedWidth = columns * swatchSize + (columns + 1) * spacing;
      const rows = Math.ceil(5 / columns); // 5 materials, 2 columns = 3 rows
      const expectedHeight = rows * (swatchSize + spacing) + spacing;
      
      expect(contentSize.width).to.equal(expectedWidth);
      expect(contentSize.height).to.equal(expectedHeight);
    });
    
    it('should start rendering at panel position with spacing', function() {
      global.image.resetHistory();
      
      const panelX = 50;
      const panelY = 50;
      const spacing = 5;
      
      palette.render(panelX, panelY);
      
      // First swatch should be at panelX + spacing, panelY + spacing
      const firstImageCall = global.image.getCall(0);
      expect(firstImageCall.args[1]).to.equal(panelX + spacing);
      expect(firstImageCall.args[2]).to.equal(panelY + spacing);
    });
    
    it('should arrange swatches in 2-column grid', function() {
      global.image.resetHistory();
      
      const panelX = 0;
      const panelY = 0;
      const swatchSize = 40;
      const spacing = 5;
      
      palette.render(panelX, panelY);
      
      // First material (moss) - column 0, row 0
      const call0 = global.image.getCall(0);
      expect(call0.args[1]).to.equal(spacing);
      expect(call0.args[2]).to.equal(spacing);
      
      // Second material (moss_1) - column 1, row 0
      const call1 = global.image.getCall(1);
      expect(call1.args[1]).to.equal(spacing + swatchSize + spacing);
      expect(call1.args[2]).to.equal(spacing);
      
      // Third material (stone) - column 0, row 1
      const call2 = global.image.getCall(2);
      expect(call2.args[1]).to.equal(spacing);
      expect(call2.args[2]).to.equal(spacing + swatchSize + spacing);
    });
  });
  
  describe('Click Detection for Material Selection', function() {
    it('should detect click on first material swatch', function() {
      const panelX = 100;
      const panelY = 100;
      const spacing = 5;
      const swatchSize = 40;
      
      // Click in center of first swatch
      const clickX = panelX + spacing + (swatchSize / 2);
      const clickY = panelY + spacing + (swatchSize / 2);
      
      const handled = palette.handleClick(clickX, clickY, panelX, panelY);
      
      expect(handled).to.be.true;
      expect(palette.getSelectedMaterial()).to.equal('moss');
    });
    
    it('should detect click on second material swatch', function() {
      const panelX = 100;
      const panelY = 100;
      const spacing = 5;
      const swatchSize = 40;
      
      // Click in center of second swatch (moss_1)
      const clickX = panelX + spacing + swatchSize + spacing + (swatchSize / 2);
      const clickY = panelY + spacing + (swatchSize / 2);
      
      const handled = palette.handleClick(clickX, clickY, panelX, panelY);
      
      expect(handled).to.be.true;
      expect(palette.getSelectedMaterial()).to.equal('moss_1');
    });
    
    it('should detect click on third material swatch (second row)', function() {
      const panelX = 100;
      const panelY = 100;
      const spacing = 5;
      const swatchSize = 40;
      
      // Click in center of third swatch (stone) - second row, first column
      const clickX = panelX + spacing + (swatchSize / 2);
      const clickY = panelY + spacing + swatchSize + spacing + (swatchSize / 2);
      
      const handled = palette.handleClick(clickX, clickY, panelX, panelY);
      
      expect(handled).to.be.true;
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should not detect click outside swatch area', function() {
      const panelX = 100;
      const panelY = 100;
      
      // Click far outside panel
      const clickX = panelX - 50;
      const clickY = panelY - 50;
      
      const handled = palette.handleClick(clickX, clickY, panelX, panelY);
      
      expect(handled).to.be.false;
    });
    
    it('should not change selection when clicking outside swatches', function() {
      palette.selectMaterial('stone');
      const originalSelection = palette.getSelectedMaterial();
      
      const panelX = 100;
      const panelY = 100;
      
      // Click outside
      palette.handleClick(panelX - 50, panelY - 50, panelX, panelY);
      
      expect(palette.getSelectedMaterial()).to.equal(originalSelection);
    });
    
    it('should detect click in gap between swatches as no-op', function() {
      const panelX = 100;
      const panelY = 100;
      const spacing = 5;
      const swatchSize = 40;
      
      palette.selectMaterial('moss');
      
      // Click in gap between first and second swatch
      const clickX = panelX + spacing + swatchSize + (spacing / 2);
      const clickY = panelY + spacing + (swatchSize / 2);
      
      const handled = palette.handleClick(clickX, clickY, panelX, panelY);
      
      expect(handled).to.be.false;
      expect(palette.getSelectedMaterial()).to.equal('moss'); // Should not change
    });
  });
  
  describe('Material Type Selection (Not Color)', function() {
    it('should return material name, not color code', function() {
      palette.selectMaterial('stone');
      
      const selected = palette.getSelectedMaterial();
      
      expect(selected).to.be.a('string');
      expect(selected).to.equal('stone');
      expect(selected).to.not.match(/^#[0-9A-F]{6}$/i); // Not a hex color
    });
    
    it('should select terrain material names from TERRAIN_MATERIALS_RANGED', function() {
      const terrainMaterials = Object.keys(global.TERRAIN_MATERIALS_RANGED);
      
      terrainMaterials.forEach(material => {
        palette.selectMaterial(material);
        expect(palette.getSelectedMaterial()).to.equal(material);
      });
    });
    
    it('should provide material name for painting operations', function() {
      palette.selectMaterial('dirt');
      
      const materialForPainting = palette.getSelectedMaterial();
      
      // Should be usable with TERRAIN_MATERIALS_RANGED
      expect(global.TERRAIN_MATERIALS_RANGED).to.have.property(materialForPainting);
    });
  });
  
  describe('Integration with Terrain Painting', function() {
    it('should provide selected material compatible with TerrainEditor', function() {
      palette.selectMaterial('grass');
      
      const material = palette.getSelectedMaterial();
      
      // Material should exist in TERRAIN_MATERIALS_RANGED
      expect(global.TERRAIN_MATERIALS_RANGED[material]).to.exist;
      
      // Material should have render function
      const renderFunction = global.TERRAIN_MATERIALS_RANGED[material][1];
      expect(renderFunction).to.be.a('function');
    });
    
    it('should allow selecting all available terrain materials', function() {
      const materials = palette.getMaterials();
      
      materials.forEach(material => {
        palette.selectMaterial(material);
        const selected = palette.getSelectedMaterial();
        
        expect(selected).to.equal(material);
        expect(global.TERRAIN_MATERIALS_RANGED[selected]).to.exist;
      });
    });
  });
});
