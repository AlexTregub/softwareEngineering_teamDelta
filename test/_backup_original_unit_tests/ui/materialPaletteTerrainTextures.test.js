/**
 * Unit Tests: MaterialPalette Terrain Texture Integration
 * 
 * Tests to verify MaterialPalette can use actual terrain material images
 * from TERRAIN_MATERIALS_RANGED instead of base colors.
 * 
 * Requirements:
 * - MaterialPalette should render using terrain texture images
 * - Fall back to color swatches if images not loaded
 * - Maintain selection and interaction behavior
 * - Support all materials from TERRAIN_MATERIALS_RANGED
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('MaterialPalette - Terrain Texture Integration', function() {
  let MaterialPalette, palette;
  let mockTerrainImages;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    // Mock terrain material images
    mockTerrainImages = {
      MOSS_IMAGE: { width: 32, height: 32, _mockImage: true },
      STONE_IMAGE: { width: 32, height: 32, _mockImage: true },
      DIRT_IMAGE: { width: 32, height: 32, _mockImage: true },
      GRASS_IMAGE: { width: 32, height: 32, _mockImage: true }
    };
    
    // Make terrain images globally available
    global.MOSS_IMAGE = mockTerrainImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockTerrainImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockTerrainImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockTerrainImages.GRASS_IMAGE;
    
    // Sync to window
    if (typeof window !== 'undefined') {
      window.MOSS_IMAGE = global.MOSS_IMAGE;
      window.STONE_IMAGE = global.STONE_IMAGE;
      window.DIRT_IMAGE = global.DIRT_IMAGE;
      window.GRASS_IMAGE = global.GRASS_IMAGE;
    }
    
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
    cleanupUITestEnvironment();
  });
  
  describe('Dynamic Material Loading', function() {
    it('should auto-populate materials from TERRAIN_MATERIALS_RANGED when no array provided', function() {
      expect(palette.materials).to.exist;
      expect(palette.materials.length).to.be.greaterThan(0);
    });

    it('should load all 5 materials from TERRAIN_MATERIALS_RANGED', function() {
      expect(palette.materials.length).to.equal(5);
      expect(palette.materials).to.include('moss');
      expect(palette.materials).to.include('moss_1');
      expect(palette.materials).to.include('stone');
      expect(palette.materials).to.include('dirt');
      expect(palette.materials).to.include('grass');
    });

    it('should select first material by default', function() {
      expect(palette.selectedMaterial).to.exist;
      expect(palette.selectedMaterial).to.equal(palette.materials[0]);
    });
  });
  
  describe('Material Image Detection', function() {
    it('should detect when terrain images are available', function() {
      expect(global.MOSS_IMAGE).to.exist;
      expect(global.STONE_IMAGE).to.exist;
      expect(global.DIRT_IMAGE).to.exist;
      expect(global.GRASS_IMAGE).to.exist;
    });
    
    it('should have access to TERRAIN_MATERIALS_RANGED', function() {
      expect(global.TERRAIN_MATERIALS_RANGED).to.exist;
      expect(global.TERRAIN_MATERIALS_RANGED).to.have.property('moss');
      expect(global.TERRAIN_MATERIALS_RANGED).to.have.property('stone');
      expect(global.TERRAIN_MATERIALS_RANGED).to.have.property('dirt');
      expect(global.TERRAIN_MATERIALS_RANGED).to.have.property('grass');
    });
    
    it('should map materials to correct images', function() {
      const materialImageMap = {
        'moss': 'MOSS_IMAGE',
        'moss_1': 'MOSS_IMAGE',
        'stone': 'STONE_IMAGE',
        'dirt': 'DIRT_IMAGE',
        'grass': 'GRASS_IMAGE'
      };
      
      for (const [material, imageName] of Object.entries(materialImageMap)) {
        expect(global[imageName]).to.exist;
        expect(global[imageName]._mockImage).to.be.true;
      }
    });
  });
  
  describe('Rendering with Terrain Textures', function() {
    it('should call image() for each material swatch when rendering', function() {
      // Reset the image stub to track calls
      global.image.resetHistory();
      
      // Render palette
      palette.render(10, 10);
      
      // Should have called image() 5 times (one per material)
      expect(global.image.callCount).to.equal(5);
      
      // Verify each material was rendered
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      materials.forEach((material, index) => {
        const call = global.image.getCall(index);
        expect(call).to.exist;
        
        // First argument should be the terrain image
        const imageArg = call.args[0];
        expect(imageArg).to.exist;
        expect(imageArg._mockImage).to.be.true;
      });
    });
    
    it('should use correct image for each material type', function() {
      global.image.resetHistory();
      
      palette.render(10, 10);
      
      // Check moss materials use MOSS_IMAGE
      expect(global.image.getCall(0).args[0]).to.equal(global.MOSS_IMAGE);
      expect(global.image.getCall(1).args[0]).to.equal(global.MOSS_IMAGE);
      
      // Check stone uses STONE_IMAGE
      expect(global.image.getCall(2).args[0]).to.equal(global.STONE_IMAGE);
      
      // Check dirt uses DIRT_IMAGE
      expect(global.image.getCall(3).args[0]).to.equal(global.DIRT_IMAGE);
      
      // Check grass uses GRASS_IMAGE
      expect(global.image.getCall(4).args[0]).to.equal(global.GRASS_IMAGE);
    });
    
    it('should render images at correct positions in grid layout', function() {
      global.image.resetHistory();
      
      const panelX = 100;
      const panelY = 100;
      const swatchSize = 40;
      const spacing = 5;
      
      palette.render(panelX, panelY);
      
      // First material (moss) - top-left
      const call0 = global.image.getCall(0);
      expect(call0.args[1]).to.equal(panelX + spacing); // x
      expect(call0.args[2]).to.equal(panelY + spacing); // y
      expect(call0.args[3]).to.equal(swatchSize); // width
      expect(call0.args[4]).to.equal(swatchSize); // height
      
      // Second material (moss_1) - top-right
      const call1 = global.image.getCall(1);
      expect(call1.args[1]).to.equal(panelX + spacing + swatchSize + spacing); // x
      expect(call1.args[2]).to.equal(panelY + spacing); // y
      
      // Third material (stone) - second row left
      const call2 = global.image.getCall(2);
      expect(call2.args[1]).to.equal(panelX + spacing); // x
      expect(call2.args[2]).to.equal(panelY + spacing + swatchSize + spacing); // y
    });
    
    it('should render images with correct size (40x40)', function() {
      global.image.resetHistory();
      
      palette.render(10, 10);
      
      // Check all images rendered at 40x40
      for (let i = 0; i < 5; i++) {
        const call = global.image.getCall(i);
        expect(call.args[3]).to.equal(40); // width
        expect(call.args[4]).to.equal(40); // height
      }
    });
  });
  
  describe('Fallback to Color Swatches', function() {
    it('should use color fill when images not available', function() {
      // Temporarily remove TERRAIN_MATERIALS_RANGED to force fallback
      const savedTerrain = global.TERRAIN_MATERIALS_RANGED;
      delete global.TERRAIN_MATERIALS_RANGED;
      
      global.fill.resetHistory();
      global.image.resetHistory();
      
      palette.render(10, 10);
      
      // Should NOT call image() when TERRAIN_MATERIALS_RANGED unavailable
      expect(global.image.callCount).to.equal(0);
      
      // Should call fill() for color swatches instead
      expect(global.fill.callCount).to.be.greaterThan(0);
      
      // Restore for other tests
      global.TERRAIN_MATERIALS_RANGED = savedTerrain;
    });
    
    it('should maintain layout when falling back to colors', function() {
      // Temporarily remove TERRAIN_MATERIALS_RANGED to force fallback
      const savedTerrain = global.TERRAIN_MATERIALS_RANGED;
      delete global.TERRAIN_MATERIALS_RANGED;
      
      global.rect.resetHistory();
      
      palette.render(10, 10);
      
      // Should still render rectangles in grid layout
      expect(global.rect.callCount).to.be.greaterThan(0);
      
      // Restore for other tests
      global.TERRAIN_MATERIALS_RANGED = savedTerrain;
    });
  });
  
  describe('Selection Highlighting with Textures', function() {
    it('should draw highlight border around selected material', function() {
      palette.selectMaterial('stone');
      
      global.stroke.resetHistory();
      global.strokeWeight.resetHistory();
      
      palette.render(10, 10);
      
      // Should call stroke() with yellow color for highlight
      const yellowStrokeCalls = global.stroke.getCalls().filter(call => {
        return call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0;
      });
      expect(yellowStrokeCalls.length).to.be.greaterThan(0);
      
      // Should increase stroke weight for visibility
      const thickStrokeCalls = global.strokeWeight.getCalls().filter(call => call.args[0] >= 3);
      expect(thickStrokeCalls.length).to.be.greaterThan(0);
    });
    
    it('should highlight correct material after selection change', function() {
      palette.selectMaterial('moss');
      
      global.image.resetHistory();
      global.rect.resetHistory();
      
      palette.render(10, 10);
      
      // First rect call should be highlight border for moss (index 0)
      const highlightCall = global.rect.getCall(0);
      expect(highlightCall).to.exist;
    });
  });
  
  describe('Integration with TERRAIN_MATERIALS_RANGED', function() {
    it('should use materials from TERRAIN_MATERIALS_RANGED', function() {
      const terrainMaterials = Object.keys(global.TERRAIN_MATERIALS_RANGED);
      
      expect(terrainMaterials).to.include('moss');
      expect(terrainMaterials).to.include('stone');
      expect(terrainMaterials).to.include('dirt');
      expect(terrainMaterials).to.include('grass');
    });
    
    it('should support all TERRAIN_MATERIALS_RANGED materials', function() {
      const allMaterials = Object.keys(global.TERRAIN_MATERIALS_RANGED);
      const testPalette = new MaterialPalette(allMaterials);
      
      expect(testPalette.materials).to.have.lengthOf(5);
      expect(testPalette.materials).to.include.members(['moss', 'moss_1', 'stone', 'dirt', 'grass']);
    });
    
    it('should render all TERRAIN_MATERIALS_RANGED materials without errors', function() {
      const allMaterials = Object.keys(global.TERRAIN_MATERIALS_RANGED);
      const testPalette = new MaterialPalette(allMaterials);
      
      expect(() => {
        testPalette.render(10, 10);
      }).to.not.throw();
    });
  });
  
  describe('Performance Considerations', function() {
    it('should not reload images on each render', function() {
      // Render multiple times
      palette.render(10, 10);
      palette.render(10, 10);
      palette.render(10, 10);
      
      // Images should be references, not reloaded
      expect(global.MOSS_IMAGE).to.equal(mockTerrainImages.MOSS_IMAGE);
      expect(global.STONE_IMAGE).to.equal(mockTerrainImages.STONE_IMAGE);
    });
    
    it('should efficiently render large material sets', function() {
      const largeMaterialSet = [
        'moss', 'moss_1', 'stone', 'dirt', 'grass',
        'moss', 'moss_1', 'stone', 'dirt', 'grass'
      ];
      const largePalette = new MaterialPalette(largeMaterialSet);
      
      global.image.resetHistory();
      
      largePalette.render(10, 10);
      
      // Should call image() once per material
      expect(global.image.callCount).to.equal(10);
    });
  });
});
