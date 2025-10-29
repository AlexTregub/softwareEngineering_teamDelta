/**
 * Unit Tests - CustomTerrain Size Validation
 * 
 * Tests to ensure terrain dimensions are validated:
 * - Maximum size of 100x100 tiles
 * - Minimum size of 1x1 tiles
 * - Proper error messages
 */

const { expect } = require('chai');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('CustomTerrain - Size Validation', function() {
  let CustomTerrain;
  let cleanup;

  beforeEach(function() {
    // Setup UI test environment (includes p5.js mocks and console)
    cleanup = setupUITestEnvironment();

    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'dirt': [[0, 1], () => {}],
      'grass': [[0, 1], () => {}],
      'stone': [[0, 1], () => {}]
    };

    if (typeof window !== 'undefined') {
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }

    // Load CustomTerrain
    delete require.cache[require.resolve('../../../Classes/terrainUtils/CustomTerrain.js')];
    CustomTerrain = require('../../../Classes/terrainUtils/CustomTerrain.js');
  });

  afterEach(function() {
    delete global.TERRAIN_MATERIALS_RANGED;
    if (typeof window !== 'undefined') {
      delete window.TERRAIN_MATERIALS_RANGED;
    }
    if (cleanup) cleanup();
  });

  describe('Maximum Size Validation', function() {
    it('should have MAX_TERRAIN_SIZE constant of 100', function() {
      expect(CustomTerrain.MAX_TERRAIN_SIZE).to.equal(100);
    });

    it('should allow terrain at maximum size (100x100)', function() {
      expect(() => {
        new CustomTerrain(100, 100);
      }).to.not.throw();
    });

    it('should reject terrain width exceeding 100', function() {
      expect(() => {
        new CustomTerrain(101, 50);
      }).to.throw(Error, /cannot exceed 100x100/);
    });

    it('should reject terrain height exceeding 100', function() {
      expect(() => {
        new CustomTerrain(50, 101);
      }).to.throw(Error, /cannot exceed 100x100/);
    });

    it('should reject terrain with both dimensions exceeding 100', function() {
      expect(() => {
        new CustomTerrain(150, 150);
      }).to.throw(Error, /cannot exceed 100x100/);
    });

    it('should include actual requested dimensions in error message', function() {
      try {
        new CustomTerrain(120, 130);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('120x130');
      }
    });
  });

  describe('Minimum Size Validation', function() {
    it('should allow minimum terrain size (1x1)', function() {
      expect(() => {
        new CustomTerrain(1, 1);
      }).to.not.throw();
    });

    it('should reject terrain with width less than 1', function() {
      expect(() => {
        new CustomTerrain(0, 10);
      }).to.throw(Error, /must be at least 1x1/);
    });

    it('should reject terrain with height less than 1', function() {
      expect(() => {
        new CustomTerrain(10, 0);
      }).to.throw(Error, /must be at least 1x1/);
    });

    it('should reject negative dimensions', function() {
      expect(() => {
        new CustomTerrain(-5, -5);
      }).to.throw(Error, /must be at least 1x1/);
    });
  });

  describe('Valid Terrain Creation', function() {
    it('should create small terrain (10x10)', function() {
      const terrain = new CustomTerrain(10, 10);
      expect(terrain.width).to.equal(10);
      expect(terrain.height).to.equal(10);
    });

    it('should create medium terrain (50x50)', function() {
      const terrain = new CustomTerrain(50, 50);
      expect(terrain.width).to.equal(50);
      expect(terrain.height).to.equal(50);
    });

    it('should create rectangular terrain within limits', function() {
      const terrain = new CustomTerrain(80, 60);
      expect(terrain.width).to.equal(80);
      expect(terrain.height).to.equal(60);
    });

    it('should calculate correct tile count for valid terrain', function() {
      const terrain = new CustomTerrain(25, 40);
      expect(terrain.getTileCount()).to.equal(1000); // 25 * 40
    });
  });

  describe('Performance Considerations', function() {
    it('should create terrain at max size without hanging', function() {
      this.timeout(5000); // Allow 5 seconds max
      
      const start = Date.now();
      const terrain = new CustomTerrain(100, 100);
      const duration = Date.now() - start;
      
      expect(terrain.getTileCount()).to.equal(10000);
      expect(duration).to.be.lessThan(2000); // Should create in under 2 seconds
    });

    it('should allocate correct number of tiles for max terrain', function() {
      const terrain = new CustomTerrain(100, 100);
      
      expect(terrain.tiles).to.have.lengthOf(100);
      expect(terrain.tiles[0]).to.have.lengthOf(100);
      expect(terrain.tiles[99]).to.have.lengthOf(100);
    });
  });

  describe('Edge Cases', function() {
    it('should handle exact maximum width', function() {
      expect(() => {
        new CustomTerrain(100, 50);
      }).to.not.throw();
    });

    it('should handle exact maximum height', function() {
      expect(() => {
        new CustomTerrain(50, 100);
      }).to.not.throw();
    });

    it('should reject width one above maximum', function() {
      expect(() => {
        new CustomTerrain(101, 1);
      }).to.throw(Error);
    });

    it('should reject height one above maximum', function() {
      expect(() => {
        new CustomTerrain(1, 101);
      }).to.throw(Error);
    });
  });

  describe('Error Messages', function() {
    it('should provide clear error for oversized terrain', function() {
      try {
        new CustomTerrain(200, 200);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).to.include('cannot exceed');
        expect(error.message).to.include('100x100');
        expect(error.message).to.include('200x200');
      }
    });

    it('should provide clear error for undersized terrain', function() {
      try {
        new CustomTerrain(0, 5);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).to.include('at least 1x1');
        expect(error.message).to.include('0x5');
      }
    });
  });
});
