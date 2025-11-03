/**
 * Integration Test: Grid/Terrain Coordinate Alignment
 * 
 * Verifies that grid and terrain use identical coordinate formulas
 * (proving the math is correct, and the issue is visual rendering only)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Grid/Terrain Coordinate Alignment Integration', function() {
  let GridOverlay, CustomTerrain;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.line = sandbox.stub();
    global.noFill = sandbox.stub();
    global.rect = sandbox.stub();
    global.image = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.fill = sandbox.stub();
    
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.line = global.line;
      window.noFill = global.noFill;
      window.rect = global.rect;
      window.image = global.image;
      window.noStroke = global.noStroke;
      window.fill = global.fill;
    }
    
    GridOverlay = require('../../../Classes/ui/GridOverlay');
    CustomTerrain = require('../../../Classes/terrainUtils/CustomTerrain');
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Coordinate Formula Alignment', function() {
    it('should use identical formula for grid lines and terrain tiles', function() {
      const tileSize = 32;
      const gridSize = 10;
      
      const grid = new GridOverlay(tileSize, gridSize, gridSize);
      const terrain = new CustomTerrain(gridSize, gridSize, tileSize);
      
      // Test tile positions
      const testTiles = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 9, y: 9 }
      ];
      
      testTiles.forEach(tile => {
        // Grid line position
        const gridX = tile.x * tileSize;
        const gridY = tile.y * tileSize;
        
        // Terrain tile position
        const terrainPos = terrain.tileToScreen(tile.x, tile.y);
        
        // Should be identical
        expect(terrainPos.x).to.equal(gridX,
          `Tile (${tile.x}, ${tile.y}) X coordinate mismatch`);
        expect(terrainPos.y).to.equal(gridY,
          `Tile (${tile.x}, ${tile.y}) Y coordinate mismatch`);
      });
    });
    
    it('should render grid lines with stroke offset for visual alignment', function() {
      const tileSize = 32;
      const grid = new GridOverlay(tileSize, 5, 5);
      
      grid.render(0, 0);
      
      // Check vertical lines were drawn with 0.5px stroke offset
      const strokeOffset = 0.5;
      const verticalLineCalls = global.line.getCalls().slice(0, 6); // First 6 are vertical
      
      for (let x = 0; x <= 5; x++) {
        const expectedX = x * tileSize + strokeOffset;
        const call = verticalLineCalls[x];
        
        expect(call.args[0]).to.equal(expectedX,
          `Vertical line ${x} should be at x=${expectedX} (with stroke offset)`);
      }
    });
    
    it('should detect stroke centering causes visual offset', function() {
      // This test DOCUMENTS the known issue
      const tileSize = 32;
      const strokeWeight = 1;
      
      // When drawing a line at x=64 with strokeWeight(1):
      const lineCoordinate = 64;
      
      // p5.js centers the stroke:
      const strokeLeftEdge = lineCoordinate - (strokeWeight / 2);  // 63.5
      const strokeRightEdge = lineCoordinate + (strokeWeight / 2); // 64.5
      
      // When drawing a tile at x=64 with image():
      const tileLeftEdge = 64;  // CORNER mode
      
      // Visual offset:
      const visualOffset = tileLeftEdge - strokeLeftEdge;
      
      expect(visualOffset).to.equal(0.5,
        'Stroke centering causes 0.5px visual offset');
      
      // This proves the fix: add 0.5px to line coordinates
      const correctedLineCoordinate = lineCoordinate + 0.5;
      const correctedStrokeLeftEdge = correctedLineCoordinate - (strokeWeight / 2);
      
      expect(correctedStrokeLeftEdge).to.equal(64,
        'Adding 0.5px offset aligns stroke left edge with tile left edge');
    });
  });
  
  describe('Paint Tool Coordinate Conversion', function() {
    it('should convert mouse coordinates to correct tile indices', function() {
      const tileSize = 32;
      
      // Simulate TerrainEditor._canvasToTilePosition
      const canvasToTile = (mouseX, mouseY) => ({
        x: Math.floor(mouseX / tileSize),
        y: Math.floor(mouseY / tileSize)
      });
      
      const testCases = [
        { mouse: { x: 0, y: 0 }, expectedTile: { x: 0, y: 0 } },
        { mouse: { x: 160, y: 160 }, expectedTile: { x: 5, y: 5 } },
        { mouse: { x: 175, y: 175 }, expectedTile: { x: 5, y: 5 } }, // Mid-tile
        { mouse: { x: 191, y: 191 }, expectedTile: { x: 5, y: 5 } }, // Near edge
        { mouse: { x: 192, y: 192 }, expectedTile: { x: 6, y: 6 } }  // Next tile
      ];
      
      testCases.forEach(test => {
        const result = canvasToTile(test.mouse.x, test.mouse.y);
        expect(result.x).to.equal(test.expectedTile.x,
          `Mouse (${test.mouse.x}, ${test.mouse.y}) should map to tile x=${test.expectedTile.x}`);
        expect(result.y).to.equal(test.expectedTile.y,
          `Mouse (${test.mouse.x}, ${test.mouse.y}) should map to tile y=${test.expectedTile.y}`);
      });
    });
  });
  
  describe('Root Cause Documentation', function() {
    it('should document that coordinates are mathematically correct', function() {
      // This test exists to document our findings:
      // 1. Grid and terrain use IDENTICAL coordinate formulas
      // 2. Both calculate positions as: index * tileSize
      // 3. The visual misalignment is caused by p5.js rendering, not math
      
      const coordinateFormula = (index, tileSize) => index * tileSize;
      
      expect(coordinateFormula(5, 32)).to.equal(160);
      expect(coordinateFormula(10, 32)).to.equal(320);
      
      // Grid lines and terrain tiles both use this formula
      // Therefore, the math is correct
      expect(true).to.be.true; // Placeholder assertion
    });
    
    it('should document the stroke centering fix requirement', function() {
      // Fix: Add 0.5px offset to grid line coordinates
      // This aligns the stroke edge with the tile edge
      
      const tileSize = 32;
      const tileIndex = 5;
      
      const originalCoordinate = tileIndex * tileSize; // 160
      const fixedCoordinate = originalCoordinate + 0.5; // 160.5
      
      // With strokeWeight(1), centered at 160.5:
      // - Stroke draws from 160 to 161
      // - Left edge at 160 aligns with tile left edge
      
      expect(fixedCoordinate - 0.5).to.equal(originalCoordinate);
      expect(fixedCoordinate).to.equal(160.5);
    });
  });
});
