/**
 * Unit Tests for CoordinateSystem Class
 * Tests coordinate conversion between canvas pixels and grid positions
 */

const { expect } = require('chai');

// Mock p5.js global functions
global.floor = Math.floor;
global.round = Math.round;

// Load the CoordinateSystem class
const coordSystemCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
eval(coordSystemCode);

describe('CoordinateSystem Class', function() {
  
  describe('Constructor', function() {
    
    it('should create coordinate system with correct parameters', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      
      expect(coordSys._gCX).to.equal(10);
      expect(coordSys._gCY).to.equal(10);
      expect(coordSys._tS).to.equal(32);
      expect(coordSys._cOX).to.equal(0);
      expect(coordSys._cOY).to.equal(0);
    });
    
    it('should accept different grid sizes', function() {
      const coordSys = new CoordinateSystem(20, 15, 64, 100, 50);
      
      expect(coordSys._gCX).to.equal(20);
      expect(coordSys._gCY).to.equal(15);
      expect(coordSys._tS).to.equal(64);
      expect(coordSys._cOX).to.equal(100);
      expect(coordSys._cOY).to.equal(50);
    });
  });
  
  describe('Backing Canvas Conversions', function() {
    
    describe('convBackingCanvasToPos()', function() {
      
      it('should convert center canvas position to grid origin', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        // Center of 10x10 grid with 32px tiles is at pixel 160 (floor(10/2)*32)
        // Grid origin (0,0) should be at center
        const centerPixel = Math.floor(10/2) * 32;
        const gridPos = coordSys.convBackingCanvasToPos([centerPixel, centerPixel]);
        
        expect(gridPos[0]).to.be.closeTo(0.5, 0.01);
        expect(gridPos[1]).to.be.closeTo(0.5, 0.01);
      });
      
      it('should handle top-left corner correctly', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        const gridPos = coordSys.convBackingCanvasToPos([0, 0]);
        
        // Top-left should be negative grid coordinates
        expect(gridPos[0]).to.be.lessThan(0);
        expect(gridPos[1]).to.be.lessThan(0);
      });
      
      it('should scale correctly with different tile sizes', function() {
        const coordSys32 = new CoordinateSystem(10, 10, 32, 0, 0);
        const coordSys64 = new CoordinateSystem(10, 10, 64, 0, 0);
        
        const pos32 = coordSys32.convBackingCanvasToPos([64, 64]);
        const pos64 = coordSys64.convBackingCanvasToPos([128, 128]);
        
        // Should result in same grid position
        expect(pos32[0]).to.be.closeTo(pos64[0], 0.01);
        expect(pos32[1]).to.be.closeTo(pos64[1], 0.01);
      });
    });
    
    describe('convPosToBackingCanvas()', function() {
      
      it('should convert grid position to canvas pixels', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        const canvasPos = coordSys.convPosToBackingCanvas([0.5, 0.5]);
        const expectedCenter = Math.floor(10/2) * 32;
        
        expect(canvasPos[0]).to.equal(expectedCenter);
        expect(canvasPos[1]).to.equal(expectedCenter);
      });
      
      it('should handle negative grid positions', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        const canvasPos = coordSys.convPosToBackingCanvas([-1, -1]);
        
        expect(canvasPos[0]).to.be.a('number');
        expect(canvasPos[1]).to.be.a('number');
      });
      
      it('should be inverse of convBackingCanvasToPos()', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        const originalCanvas = [123, 456];
        const gridPos = coordSys.convBackingCanvasToPos(originalCanvas);
        const backToCanvas = coordSys.convPosToBackingCanvas(gridPos);
        
        expect(backToCanvas[0]).to.be.closeTo(originalCanvas[0], 0.01);
        expect(backToCanvas[1]).to.be.closeTo(originalCanvas[1], 0.01);
      });
    });
  });
  
  describe('Viewing Canvas Conversions', function() {
    
    describe('setViewCornerBC()', function() {
      
      it('should set view offset', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        coordSys.setViewCornerBC([100, 200]);
        
        expect(coordSys._cOX).to.equal(100);
        expect(coordSys._cOY).to.equal(200);
      });
      
      it('should handle negative offsets', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        coordSys.setViewCornerBC([-50, -75]);
        
        expect(coordSys._cOX).to.equal(-50);
        expect(coordSys._cOY).to.equal(-75);
      });
    });
    
    describe('convCanvasToPos()', function() {
      
      it('should convert viewing canvas to grid position', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        coordSys.setViewCornerBC([0, 0]);
        
        const gridPos = coordSys.convCanvasToPos([160, 160]);
        
        expect(gridPos[0]).to.be.closeTo(0.5, 0.01);
        expect(gridPos[1]).to.be.closeTo(0.5, 0.01);
      });
      
      it('should account for view offset', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        // No offset
        coordSys.setViewCornerBC([0, 0]);
        const pos1 = coordSys.convCanvasToPos([160, 160]);
        
        // With offset
        coordSys.setViewCornerBC([32, 32]);
        const pos2 = coordSys.convCanvasToPos([160, 160]);
        
        // With offset, the grid position should be shifted
        expect(pos2[0]).to.be.greaterThan(pos1[0]);
        expect(pos2[1]).to.be.greaterThan(pos1[1]);
      });
      
      it('should handle panning (offset changes)', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        // Start with no offset
        coordSys.setViewCornerBC([0, 0]);
        const original = coordSys.convCanvasToPos([100, 100]);
        
        // Pan right and down (increase offset)
        coordSys.setViewCornerBC([64, 64]);
        const panned = coordSys.convCanvasToPos([100, 100]);
        
        // Same screen position should now point to different grid position
        expect(panned[0]).to.equal(original[0] + 2); // 64px / 32px per tile = 2 tiles
        expect(panned[1]).to.equal(original[1] + 2);
      });
    });
    
    describe('convPosToCanvas()', function() {
      
      it('should convert grid position to viewing canvas', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        coordSys.setViewCornerBC([0, 0]);
        
        const canvasPos = coordSys.convPosToCanvas([0.5, 0.5]);
        
        expect(canvasPos[0]).to.equal(160); // floor(10/2)*32
        expect(canvasPos[1]).to.equal(160);
      });
      
      it('should account for view offset', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        
        // No offset
        coordSys.setViewCornerBC([0, 0]);
        const pos1 = coordSys.convPosToCanvas([0.5, 0.5]);
        
        // With offset
        coordSys.setViewCornerBC([32, 32]);
        const pos2 = coordSys.convPosToCanvas([0.5, 0.5]);
        
        // Grid position should appear shifted on screen
        expect(pos2[0]).to.equal(pos1[0] - 32);
        expect(pos2[1]).to.equal(pos1[1] - 32);
      });
      
      it('should be inverse of convCanvasToPos()', function() {
        const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
        coordSys.setViewCornerBC([50, 75]);
        
        const originalCanvas = [200, 300];
        const gridPos = coordSys.convCanvasToPos(originalCanvas);
        const backToCanvas = coordSys.convPosToCanvas(gridPos);
        
        expect(backToCanvas[0]).to.be.closeTo(originalCanvas[0], 0.01);
        expect(backToCanvas[1]).to.be.closeTo(originalCanvas[1], 0.01);
      });
    });
  });
  
  describe('roundToTilePos()', function() {
    
    it('should round coordinates to nearest integer', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      
      const pos1 = coordSys.roundToTilePos([1.4, 2.6]);
      expect(pos1).to.deep.equal([1, 3]);
      
      const pos2 = coordSys.roundToTilePos([3.5, 4.5]);
      expect(pos2).to.deep.equal([4, 5]);
    });
    
    it('should handle negative zero correctly', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      
      const pos = coordSys.roundToTilePos([-0.3, 0.3]);
      
      // Should convert -0 to 0
      expect(pos[0]).to.equal(0);
      expect(1 / pos[0]).to.be.greaterThan(0); // Positive zero check
    });
    
    it('should handle negative coordinates', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      
      const pos = coordSys.roundToTilePos([-2.6, -3.4]);
      expect(pos).to.deep.equal([-3, -3]);
    });
  });
  
  describe('Integration Tests', function() {
    
    it('should handle camera panning simulation', function() {
      const coordSys = new CoordinateSystem(20, 20, 32, 0, 0);
      
      // Start centered
      coordSys.setViewCornerBC([0, 0]);
      
      // Click at screen position [200, 200]
      const initialGridPos = coordSys.convCanvasToPos([200, 200]);
      
      // Pan camera right by 3 tiles (96 pixels)
      coordSys.setViewCornerBC([96, 0]);
      
      // Same screen click should now point to different grid position
      const pannedGridPos = coordSys.convCanvasToPos([200, 200]);
      
      expect(pannedGridPos[0]).to.equal(initialGridPos[0] + 3);
      expect(pannedGridPos[1]).to.equal(initialGridPos[1]);
    });
    
    it('should maintain consistency across different tile sizes', function() {
      const coordSys16 = new CoordinateSystem(10, 10, 16, 0, 0);
      const coordSys32 = new CoordinateSystem(10, 10, 32, 0, 0);
      
      // Same grid position
      const gridPos = [2.5, 3.5];
      
      const canvas16 = coordSys16.convPosToBackingCanvas(gridPos);
      const canvas32 = coordSys32.convPosToBackingCanvas(gridPos);
      
      // Pixel positions should scale with tile size
      expect(canvas32[0]).to.equal(canvas16[0] * 2);
      expect(canvas32[1]).to.equal(canvas16[1] * 2);
    });
    
    it('should handle different grid sizes', function() {
      const coordSys5x5 = new CoordinateSystem(5, 5, 32, 0, 0);
      const coordSys10x10 = new CoordinateSystem(10, 10, 32, 0, 0);
      
      // Grid origin should be at different pixel locations
      const origin5x5 = coordSys5x5.convPosToBackingCanvas([0.5, 0.5]);
      const origin10x10 = coordSys10x10.convPosToBackingCanvas([0.5, 0.5]);
      
      expect(origin5x5[0]).to.be.lessThan(origin10x10[0]);
      expect(origin5x5[1]).to.be.lessThan(origin10x10[1]);
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle zero tile size gracefully', function() {
      const coordSys = new CoordinateSystem(10, 10, 0, 0, 0);
      
      // Division by zero - should handle gracefully
      const gridPos = coordSys.convBackingCanvasToPos([100, 100]);
      
      expect(gridPos[0]).to.satisfy((val) => 
        !isNaN(val) && (val === Infinity || val === -Infinity)
      );
    });
    
    it('should handle very large coordinates', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      
      const largePos = [100000, 100000];
      const gridPos = coordSys.convBackingCanvasToPos(largePos);
      
      expect(gridPos[0]).to.be.a('number');
      expect(gridPos[1]).to.be.a('number');
      expect(gridPos[0]).to.be.greaterThan(1000);
    });
    
    it('should handle fractional tile sizes', function() {
      const coordSys = new CoordinateSystem(10, 10, 32.5, 0, 0);
      
      const canvasPos = coordSys.convPosToBackingCanvas([1, 1]);
      const backToGrid = coordSys.convBackingCanvasToPos(canvasPos);
      
      expect(backToGrid[0]).to.be.closeTo(1, 0.01);
      expect(backToGrid[1]).to.be.closeTo(1, 0.01);
    });
    
    it('should handle 1x1 grid', function() {
      const coordSys = new CoordinateSystem(1, 1, 32, 0, 0);
      
      const canvasPos = coordSys.convPosToBackingCanvas([0.5, 0.5]);
      
      expect(canvasPos[0]).to.be.a('number');
      expect(canvasPos[1]).to.be.a('number');
    });
  });
  
  describe('Round-trip Conversions', function() {
    
    it('should maintain precision through multiple conversions', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      coordSys.setViewCornerBC([50, 75]);
      
      const original = [123.456, 789.012];
      
      // Canvas -> Grid -> Canvas
      const gridPos = coordSys.convCanvasToPos(original);
      const backToCanvas = coordSys.convPosToCanvas(gridPos);
      
      expect(backToCanvas[0]).to.be.closeTo(original[0], 0.001);
      expect(backToCanvas[1]).to.be.closeTo(original[1], 0.001);
    });
    
    it('should maintain integer coordinates through conversions', function() {
      const coordSys = new CoordinateSystem(10, 10, 32, 0, 0);
      
      const gridPos = [5, 7];
      
      // Grid -> Canvas -> Grid (via backing canvas)
      const canvasPos = coordSys.convPosToBackingCanvas(gridPos);
      const backToGrid = coordSys.convBackingCanvasToPos(canvasPos);
      
      expect(backToGrid[0]).to.equal(gridPos[0]);
      expect(backToGrid[1]).to.equal(gridPos[1]);
    });
  });
});
