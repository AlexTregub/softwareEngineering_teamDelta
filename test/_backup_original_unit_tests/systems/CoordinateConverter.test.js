/**
 * Unit Tests for CoordinateConverter
 * Tests coordinate system conversion utilities
 */

const { expect } = require('chai');

// Mock globals
global.TILE_SIZE = 32;
global.window = global;
global.g_activeMap = null;

// Load CoordinateConverter
const CoordinateConverter = require('../../../Classes/systems/CoordinateConverter');

describe('CoordinateConverter', function() {
  
  beforeEach(function() {
    // Reset mock state before each test
    global.g_activeMap = null;
    global.cameraX = 0;
    global.cameraY = 0;
  });
  
  describe('getTileSize()', function() {
    
    it('should return TILE_SIZE when defined', function() {
      global.TILE_SIZE = 32;
      
      expect(CoordinateConverter.getTileSize()).to.equal(32);
    });
    
    it('should return default 32 when TILE_SIZE undefined', function() {
      const oldTileSize = global.TILE_SIZE;
      delete global.TILE_SIZE;
      
      expect(CoordinateConverter.getTileSize()).to.equal(32);
      
      global.TILE_SIZE = oldTileSize; // Restore
    });
  });
  
  describe('isAvailable()', function() {
    
    it('should return false when g_activeMap undefined', function() {
      global.g_activeMap = undefined;
      
      expect(CoordinateConverter.isAvailable()).to.be.false;
    });
    
    it('should return false when g_activeMap null', function() {
      global.g_activeMap = null;
      
      expect(CoordinateConverter.isAvailable()).to.be.false;
    });
    
    it('should return false when renderConversion missing', function() {
      global.g_activeMap = {};
      
      expect(CoordinateConverter.isAvailable()).to.be.false;
    });
    
    it('should return true when terrain system available', function() {
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: () => [0, 0],
          convPosToCanvas: () => [0, 0]
        }
      };
      global.TILE_SIZE = 32;
      
      expect(CoordinateConverter.isAvailable()).to.be.true;
    });
  });
  
  describe('worldToTile()', function() {
    
    it('should convert world pixels to tile coordinates', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(64, 96);
      
      expect(tile.x).to.equal(2); // 64 / 32
      expect(tile.y).to.equal(3); // 96 / 32
    });
    
    it('should floor tile coordinates', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(75, 110);
      
      expect(tile.x).to.equal(2); // floor(75 / 32)
      expect(tile.y).to.equal(3); // floor(110 / 32)
    });
    
    it('should handle negative coordinates', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(-64, -96);
      
      expect(tile.x).to.equal(-2);
      expect(tile.y).to.equal(-3);
    });
    
    it('should handle origin correctly', function() {
      global.TILE_SIZE = 32;
      
      const tile = CoordinateConverter.worldToTile(0, 0);
      
      expect(tile.x).to.equal(0);
      expect(tile.y).to.equal(0);
    });
  });
  
  describe('tileToWorld()', function() {
    
    it('should convert tile coordinates to world pixels', function() {
      global.TILE_SIZE = 32;
      
      const world = CoordinateConverter.tileToWorld(5, 10);
      
      expect(world.x).to.equal(160); // 5 * 32
      expect(world.y).to.equal(320); // 10 * 32
    });
    
    it('should handle negative tile coordinates', function() {
      global.TILE_SIZE = 32;
      
      const world = CoordinateConverter.tileToWorld(-3, -5);
      
      expect(world.x).to.equal(-96);
      expect(world.y).to.equal(-160);
    });
    
    it('should handle zero coordinates', function() {
      global.TILE_SIZE = 32;
      
      const world = CoordinateConverter.tileToWorld(0, 0);
      
      expect(world.x).to.equal(0);
      expect(world.y).to.equal(0);
    });
  });
  
  describe('screenToWorld() with terrain system', function() {
    
    it('should use terrain system when available', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            return [screenPos[0] / 32, screenPos[1] / 32];
          }
        }
      };
      
      const world = CoordinateConverter.screenToWorld(320, 480);
      
      expect(world.x).to.equal(320); // (320/32) * 32
      expect(world.y).to.equal(480); // (480/32) * 32
    });
    
    it('should handle terrain system with camera offset', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            // Mock camera at (10, 10) in tile space
            return [screenPos[0] / 32 + 10, screenPos[1] / 32 + 10];
          }
        }
      };
      
      const world = CoordinateConverter.screenToWorld(0, 0);
      
      expect(world.x).to.equal(320); // (0 + 10) * 32
      expect(world.y).to.equal(320); // (0 + 10) * 32
    });
  });
  
  describe('screenToWorld() fallback modes', function() {
    
    it('should use fallback camera globals when terrain unavailable', function() {
      global.g_activeMap = null;
      global.cameraX = 100;
      global.cameraY = 200;
      
      const world = CoordinateConverter.screenToWorld(50, 75);
      
      expect(world.x).to.equal(150); // 50 + 100
      expect(world.y).to.equal(275); // 75 + 200
    });
    
    it('should handle missing camera globals', function() {
      global.g_activeMap = null;
      delete global.cameraX;
      delete global.cameraY;
      
      const world = CoordinateConverter.screenToWorld(100, 200);
      
      expect(world.x).to.equal(100); // No offset
      expect(world.y).to.equal(200); // No offset
    });
  });
  
  describe('worldToScreen() with terrain system', function() {
    
    it('should use terrain system when available', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: (tilePos) => {
            return [tilePos[0] * 32, tilePos[1] * 32];
          }
        }
      };
      
      const screen = CoordinateConverter.worldToScreen(160, 320);
      
      expect(screen.x).to.equal(160); // (160/32) * 32
      expect(screen.y).to.equal(320); // (320/32) * 32
    });
  });
  
  describe('worldToScreen() fallback modes', function() {
    
    it('should use fallback camera globals when terrain unavailable', function() {
      global.g_activeMap = null;
      global.cameraX = 100;
      global.cameraY = 200;
      
      const screen = CoordinateConverter.worldToScreen(250, 450);
      
      expect(screen.x).to.equal(150); // 250 - 100
      expect(screen.y).to.equal(250); // 450 - 200
    });
  });
  
  describe('screenToWorldTile()', function() {
    
    it('should convert screen to tile coordinates via terrain', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            return [screenPos[0] / 32, screenPos[1] / 32];
          }
        }
      };
      
      const tile = CoordinateConverter.screenToWorldTile(96, 128);
      
      expect(tile.x).to.equal(3); // floor(96 / 32)
      expect(tile.y).to.equal(4); // floor(128 / 32)
    });
    
    it('should floor tile coordinates', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: (screenPos) => {
            return [screenPos[0] / 32 + 0.7, screenPos[1] / 32 + 0.3];
          }
        }
      };
      
      const tile = CoordinateConverter.screenToWorldTile(0, 0);
      
      expect(tile.x).to.equal(0); // floor(0.7)
      expect(tile.y).to.equal(0); // floor(0.3)
    });
  });
  
  describe('worldTileToScreen()', function() {
    
    it('should convert tile coordinates to screen via terrain', function() {
      global.TILE_SIZE = 32;
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: (tilePos) => {
            return [tilePos[0] * 32, tilePos[1] * 32];
          }
        }
      };
      
      const screen = CoordinateConverter.worldTileToScreen(5, 10);
      
      expect(screen.x).to.equal(160); // 5 * 32
      expect(screen.y).to.equal(320); // 10 * 32
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information object', function() {
      const info = CoordinateConverter.getDebugInfo();
      
      expect(info).to.be.an('object');
      expect(info.terrainSystemAvailable).to.be.a('boolean');
      expect(info.g_activeMapExists).to.be.a('boolean');
      expect(info.tileSizeDefined).to.be.a('boolean');
      expect(info.tileSize).to.be.a('number');
    });
    
    it('should reflect terrain system availability', function() {
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: () => [0, 0],
          convPosToCanvas: () => [0, 0]
        }
      };
      global.TILE_SIZE = 32;
      
      const info = CoordinateConverter.getDebugInfo();
      
      expect(info.terrainSystemAvailable).to.be.true;
      expect(info.g_activeMapExists).to.be.true;
      expect(info.renderConversionExists).to.be.true;
    });
    
    it('should reflect missing terrain system', function() {
      global.g_activeMap = null;
      
      const info = CoordinateConverter.getDebugInfo();
      
      expect(info.terrainSystemAvailable).to.be.false;
      expect(info.g_activeMapExists).to.be.false;
    });
  });
  
  describe('Round-trip Conversions', function() {
    
    it('should preserve tile coordinates in round trip', function() {
      global.TILE_SIZE = 32;
      
      const originalTile = { x: 10, y: 15 };
      const worldPos = CoordinateConverter.tileToWorld(originalTile.x, originalTile.y);
      const backToTile = CoordinateConverter.worldToTile(worldPos.x, worldPos.y);
      
      expect(backToTile.x).to.equal(originalTile.x);
      expect(backToTile.y).to.equal(originalTile.y);
    });
  });
  
  describe('Error Handling', function() {
    
    it('should handle errors in screenToWorld gracefully', function() {
      global.g_activeMap = {
        renderConversion: {
          convCanvasToPos: () => {
            throw new Error('Mock error');
          }
        }
      };
      
      // Should not throw, should fall back
      const result = CoordinateConverter.screenToWorld(100, 100);
      
      expect(result).to.exist;
      expect(result.x).to.be.a('number');
      expect(result.y).to.be.a('number');
    });
    
    it('should handle errors in worldToScreen gracefully', function() {
      global.g_activeMap = {
        renderConversion: {
          convPosToCanvas: () => {
            throw new Error('Mock error');
          }
        }
      };
      
      // Should not throw, should fall back
      const result = CoordinateConverter.worldToScreen(100, 100);
      
      expect(result).to.exist;
      expect(result.x).to.be.a('number');
      expect(result.y).to.be.a('number');
    });
  });
});
