/**
 * Unit tests for CustomTerrain texture rendering
 * 
 * Verifies that CustomTerrain uses TERRAIN_MATERIALS_RANGED textures
 * instead of solid colors when rendering tiles.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('CustomTerrain Texture Rendering', function() {
  let CustomTerrain;
  let mockTERRAIN_MATERIALS_RANGED;
  let mockImages;

  beforeEach(function() {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.image = sinon.stub();

    // Mock images
    mockImages = {
      MOSS_IMAGE: { width: 16, height: 16 },
      STONE_IMAGE: { width: 16, height: 16 },
      DIRT_IMAGE: { width: 16, height: 16 },
      GRASS_IMAGE: { width: 16, height: 16 }
    };

    global.MOSS_IMAGE = mockImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockImages.GRASS_IMAGE;

    // Mock TERRAIN_MATERIALS_RANGED
    mockTERRAIN_MATERIALS_RANGED = {
      'NONE': [
        [[0, 0]],
        (x, y, squareSize) => image(MOSS_IMAGE, x, y, squareSize, squareSize)
      ],
      'moss': [
        [[0, 0.3]],
        (x, y, squareSize) => image(MOSS_IMAGE, x, y, squareSize, squareSize)
      ],
      'moss_1': [
        [[0.3, 0.5]],
        (x, y, squareSize) => image(MOSS_IMAGE, x, y, squareSize, squareSize)
      ],
      'stone': [
        [[0.5, 0.7]],
        (x, y, squareSize) => image(STONE_IMAGE, x, y, squareSize, squareSize)
      ],
      'dirt': [
        [[0.7, 0.85]],
        (x, y, squareSize) => image(DIRT_IMAGE, x, y, squareSize, squareSize)
      ],
      'grass': [
        [[0.85, 1.0]],
        (x, y, squareSize) => image(GRASS_IMAGE, x, y, squareSize, squareSize)
      ]
    };

    global.TERRAIN_MATERIALS_RANGED = mockTERRAIN_MATERIALS_RANGED;

    // Load CustomTerrain
    delete require.cache[require.resolve('../../../Classes/terrainUtils/CustomTerrain.js')];
    CustomTerrain = require('../../../Classes/terrainUtils/CustomTerrain.js');
  });

  afterEach(function() {
    sinon.restore();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.rect;
    delete global.image;
    delete global.MOSS_IMAGE;
    delete global.STONE_IMAGE;
    delete global.DIRT_IMAGE;
    delete global.GRASS_IMAGE;
    delete global.TERRAIN_MATERIALS_RANGED;
  });

  describe('Texture Rendering', function() {
    it('should use TERRAIN_MATERIALS_RANGED render function for moss tiles', function() {
      const terrain = new CustomTerrain(3, 3, 32);
      
      // Set all tiles to moss
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          terrain.setTile(x, y, 'moss');
        }
      }

      terrain.render();

      // image() should be called for each tile (3x3 = 9 tiles)
      expect(global.image.callCount).to.equal(9);
      
      // First argument should be MOSS_IMAGE
      expect(global.image.firstCall.args[0]).to.equal(mockImages.MOSS_IMAGE);
    });

    it('should use TERRAIN_MATERIALS_RANGED render function for stone tiles', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      
      // Set all tiles to stone
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          terrain.setTile(x, y, 'stone');
        }
      }

      terrain.render();

      // image() should be called with STONE_IMAGE
      expect(global.image.callCount).to.equal(4);
      expect(global.image.firstCall.args[0]).to.equal(mockImages.STONE_IMAGE);
    });

    it('should use TERRAIN_MATERIALS_RANGED render function for dirt tiles', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      
      // Set all tiles to dirt
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          terrain.setTile(x, y, 'dirt');
        }
      }

      terrain.render();

      // image() should be called with DIRT_IMAGE
      expect(global.image.callCount).to.equal(4);
      expect(global.image.firstCall.args[0]).to.equal(mockImages.DIRT_IMAGE);
    });

    it('should use TERRAIN_MATERIALS_RANGED render function for grass tiles', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      
      // Set all tiles to grass
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          terrain.setTile(x, y, 'grass');
        }
      }

      terrain.render();

      // image() should be called with GRASS_IMAGE
      expect(global.image.callCount).to.equal(4);
      expect(global.image.firstCall.args[0]).to.equal(mockImages.GRASS_IMAGE);
    });

    it('should render different materials with their respective textures', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      
      // Create a mix of materials
      terrain.setTile(0, 0, 'moss');
      terrain.setTile(1, 0, 'stone');
      terrain.setTile(0, 1, 'dirt');
      terrain.setTile(1, 1, 'grass');

      terrain.render();

      // Should call image() 4 times
      expect(global.image.callCount).to.equal(4);
      
      // Check that different images were used
      const images = global.image.getCalls().map(call => call.args[0]);
      expect(images).to.include(mockImages.MOSS_IMAGE);
      expect(images).to.include(mockImages.STONE_IMAGE);
      expect(images).to.include(mockImages.DIRT_IMAGE);
      expect(images).to.include(mockImages.GRASS_IMAGE);
    });

    it('should pass correct coordinates and size to render function', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      terrain.setTile(0, 0, 'moss');

      terrain.render();

      // Check first call to image()
      const firstCall = global.image.firstCall;
      expect(firstCall.args[0]).to.equal(mockImages.MOSS_IMAGE); // image
      expect(firstCall.args[1]).to.be.a('number'); // x position
      expect(firstCall.args[2]).to.be.a('number'); // y position
      expect(firstCall.args[3]).to.equal(32); // width (tileSize)
      expect(firstCall.args[4]).to.equal(32); // height (tileSize)
    });
  });

  describe('Fallback to Solid Colors', function() {
    it('should use solid color if TERRAIN_MATERIALS_RANGED is undefined', function() {
      delete global.TERRAIN_MATERIALS_RANGED;
      
      const terrain = new CustomTerrain(2, 2, 32);
      terrain.setTile(0, 0, 'moss');

      terrain.render();

      // Should use fill() and rect() instead of image()
      expect(global.fill.called).to.be.true;
      expect(global.rect.called).to.be.true;
      expect(global.image.called).to.be.false;
    });

    it('should use solid color if material not in TERRAIN_MATERIALS_RANGED', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      terrain.setTile(0, 0, 'unknown_material');

      terrain.render();

      // Should use fill() and rect() for unknown material
      expect(global.fill.called).to.be.true;
      expect(global.rect.called).to.be.true;
    });

    it('should use solid color if render function is not a function', function() {
      // Break the render function
      global.TERRAIN_MATERIALS_RANGED['moss'][1] = null;
      
      const terrain = new CustomTerrain(2, 2, 32);
      terrain.setTile(0, 0, 'moss');

      terrain.render();

      // Should fall back to solid color
      expect(global.fill.called).to.be.true;
      expect(global.rect.called).to.be.true;
    });

    it('should use correct fallback colors for materials', function() {
      delete global.TERRAIN_MATERIALS_RANGED;
      
      const terrain = new CustomTerrain(2, 2, 32);
      
      // Test dirt color (120, 80, 40)
      terrain.setTile(0, 0, 'dirt');
      terrain.render();
      
      expect(global.fill.calledWith(120, 80, 40)).to.be.true;
    });
  });

  describe('Rendering Performance', function() {
    it('should call push/pop once for entire render', function() {
      const terrain = new CustomTerrain(3, 3, 32);
      
      terrain.render();

      expect(global.push.callCount).to.equal(1);
      expect(global.pop.callCount).to.equal(1);
    });

    it('should render all tiles in correct order', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      
      // Set unique materials to track order
      terrain.setTile(0, 0, 'moss');
      terrain.setTile(1, 0, 'stone');
      terrain.setTile(0, 1, 'dirt');
      terrain.setTile(1, 1, 'grass');

      terrain.render();

      // Check rendering order (row by row, left to right)
      const calls = global.image.getCalls();
      expect(calls[0].args[0]).to.equal(mockImages.MOSS_IMAGE);  // (0,0)
      expect(calls[1].args[0]).to.equal(mockImages.STONE_IMAGE); // (1,0)
      expect(calls[2].args[0]).to.equal(mockImages.DIRT_IMAGE);  // (0,1)
      expect(calls[3].args[0]).to.equal(mockImages.GRASS_IMAGE); // (1,1)
    });
  });

  describe('Regression: No More Brown Solid Colors', function() {
    it('should NOT use fill(120, 80, 40) for dirt tiles when textures available', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      terrain.setTile(0, 0, 'dirt');

      terrain.render();

      // Should use image(), NOT fill with brown color
      expect(global.image.called).to.be.true;
      expect(global.fill.calledWith(120, 80, 40)).to.be.false;
    });

    it('should NOT use rect() when textures are available', function() {
      const terrain = new CustomTerrain(2, 2, 32);
      terrain.setTile(0, 0, 'moss');

      terrain.render();

      // Should NOT use rect() when texture is available
      expect(global.image.called).to.be.true;
      expect(global.rect.called).to.be.false;
    });

    it('should use textures for all standard materials', function() {
      const terrain = new CustomTerrain(1, 5, 32);
      
      // One tile of each standard material
      terrain.setTile(0, 0, 'moss');
      terrain.setTile(0, 1, 'stone');
      terrain.setTile(0, 2, 'dirt');
      terrain.setTile(0, 3, 'grass');
      terrain.setTile(0, 4, 'moss_1');

      terrain.render();

      // All should use image(), none should use fill+rect
      expect(global.image.callCount).to.equal(5);
      expect(global.rect.called).to.be.false;
    });
  });
});
