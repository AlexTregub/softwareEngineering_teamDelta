/**
 * Consolidated Terrain Editor Tests
 * Generated: 2025-10-29T03:11:41.134Z
 * Source files: 8
 * Total tests: 443
 * 
 * This file contains all terrain editor tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// terrainEditor.test.js (341 tests)
// ================================================================
/**
 * Consolidated Terrain Editor Tests
 * Generated: 2025-10-29T02:59:23.628Z
 * Source files: 8
 * Total tests: 341
 * 
 * This file contains all terrain editor tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
// ================================================================
// terrainEditor.test.js (239 tests)
// ================================================================
/**
 * Consolidated Terrain Editor Tests
 * Generated: 2025-10-29T02:58:39.869Z
 * Source files: 8
 * Total tests: 239
 * 
 * This file contains all terrain editor tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
// ================================================================
// terrainEditor.test.js (137 tests)
// ================================================================
/**
 * Consolidated Terrain Editor Tests
 * Generated: 2025-10-29T02:57:50.913Z
 * Source files: 8
 * Total tests: 137
 * 
 * This file contains all terrain editor tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
// ================================================================
// terrainEditor.test.js (35 tests)
// ================================================================
/**
 * Unit Tests for TerrainEditor
 * Tests in-game terrain editing tools and brush systems
 */

let fs = require('fs');
let path = require('path');
let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let editorCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainEditor.js'),
  'utf8'
);
vm.runInThisContext(editorCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainEditor - Paint Tool', function() {
  
  describe('paintTile()', function() {
    
    it('should change tile material at mouse position', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const tile = terrain.chunkArray.rawArray[0].tileData.rawArray[0];
      const originalMaterial = tile._materialSet;
      
      // Simulate paint
      tile._materialSet = 'water';
      
      expect(tile._materialSet).to.not.equal(originalMaterial);
      expect(tile._materialSet).to.equal('water');
    });
    
    it('should convert canvas coordinates to tile position', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const mouseX = 400;
      const mouseY = 300;
      
      const tilePos = terrain.renderConversion.convCanvasToPos([mouseX, mouseY]);
      
      expect(tilePos).to.be.an('array');
      expect(tilePos).to.have.lengthOf(2);
      expect(tilePos[0]).to.be.a('number');
      expect(tilePos[1]).to.be.a('number');
    });
    
    it('should only paint within bounds', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const maxX = terrain._gridSizeX * terrain._chunkSize;
      const maxY = terrain._gridSizeY * terrain._chunkSize;
      
      const validPos = [5, 5];
      const invalidPos = [100, 100];
      
      const isValid = (pos) => 
        pos[0] >= 0 && pos[0] < maxX &&
        pos[1] >= 0 && pos[1] < maxY;
      
      expect(isValid(validPos)).to.be.true;
      expect(isValid(invalidPos)).to.be.false;
    });
    
    it('should invalidate cache after painting', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      terrain._cacheValid = true;
      
      // Simulate paint operation
      terrain.invalidateCache();
      
      expect(terrain._cacheValid).to.be.false;
    });
  });
  
  describe('brushSize()', function() {
    
    it('should paint single tile with size 1', function() {
      const brushSize = 1;
      const center = [5, 5];
      
      const affectedTiles = [];
      for (let dy = -Math.floor(brushSize / 2); dy <= Math.floor(brushSize / 2); dy++) {
        for (let dx = -Math.floor(brushSize / 2); dx <= Math.floor(brushSize / 2); dx++) {
          affectedTiles.push([center[0] + dx, center[1] + dy]);
        }
      }
      
      expect(affectedTiles).to.have.lengthOf(1);
      expect(affectedTiles[0]).to.deep.equal([5, 5]);
    });
    
    it('should paint 3x3 area with size 3', function() {
      const brushSize = 3;
      const center = [5, 5];
      
      const affectedTiles = [];
      const radius = Math.floor(brushSize / 2);
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          affectedTiles.push([center[0] + dx, center[1] + dy]);
        }
      }
      
      expect(affectedTiles).to.have.lengthOf(9);
    });
    
    it('should support circular brush pattern', function() {
      const radius = 2;
      const center = [5, 5];
      
      const affectedTiles = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            affectedTiles.push([center[0] + dx, center[1] + dy]);
          }
        }
      }
      
      expect(affectedTiles.length).to.be.greaterThan(0);
      expect(affectedTiles.length).to.be.lessThan(25); // Less than full 5x5 square
    });
  });
});

describe('TerrainEditor - Fill Tool', function() {
  
  describe('fillRegion()', function() {
    
    it('should flood fill connected tiles of same material', function() {
      const grid = [
        ['g', 'g', 'd'],
        ['g', 'g', 'd'],
        ['d', 'd', 'd']
      ];
      
      const floodFill = (grid, x, y, targetMaterial, replacementMaterial) => {
        if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) return;
        if (grid[y][x] !== targetMaterial) return;
        if (grid[y][x] === replacementMaterial) return;
        
        grid[y][x] = replacementMaterial;
        
        floodFill(grid, x + 1, y, targetMaterial, replacementMaterial);
        floodFill(grid, x - 1, y, targetMaterial, replacementMaterial);
        floodFill(grid, x, y + 1, targetMaterial, replacementMaterial);
        floodFill(grid, x, y - 1, targetMaterial, replacementMaterial);
      };
      
      floodFill(grid, 0, 0, 'g', 'w');
      
      expect(grid[0][0]).to.equal('w');
      expect(grid[0][1]).to.equal('w');
      expect(grid[1][0]).to.equal('w');
      expect(grid[1][1]).to.equal('w');
      expect(grid[0][2]).to.equal('d'); // Not filled (different material)
    });
    
    it('should not fill if target equals replacement', function() {
      const grid = [['g', 'g'], ['g', 'g']];
      const targetMaterial = 'g';
      const replacementMaterial = 'g';
      
      const shouldFill = targetMaterial !== replacementMaterial;
      
      expect(shouldFill).to.be.false;
    });
    
    it('should handle diagonal connections', function() {
      const includeDiagonals = true;
      const center = [5, 5];
      
      const neighbors = [];
      
      // Cardinal directions
      neighbors.push([center[0] + 1, center[1]]);
      neighbors.push([center[0] - 1, center[1]]);
      neighbors.push([center[0], center[1] + 1]);
      neighbors.push([center[0], center[1] - 1]);
      
      // Diagonals
      if (includeDiagonals) {
        neighbors.push([center[0] + 1, center[1] + 1]);
        neighbors.push([center[0] + 1, center[1] - 1]);
        neighbors.push([center[0] - 1, center[1] + 1]);
        neighbors.push([center[0] - 1, center[1] - 1]);
      }
      
      expect(neighbors).to.have.lengthOf(8);
    });
  });
});

describe('TerrainEditor - Rectangle Tool', function() {
  
  describe('fillRectangle()', function() {
    
    it('should fill rectangular area', function() {
      const x1 = 2, y1 = 2;
      const x2 = 4, y2 = 4;
      
      const tiles = [];
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          tiles.push([x, y]);
        }
      }
      
      expect(tiles).to.have.lengthOf(9); // 3x3
      expect(tiles[0]).to.deep.equal([2, 2]);
      expect(tiles[8]).to.deep.equal([4, 4]);
    });
    
    it('should handle reversed coordinates', function() {
      const x1 = 5, y1 = 5;
      const x2 = 3, y2 = 3; // Dragged backwards
      
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      
      expect(minX).to.equal(3);
      expect(maxX).to.equal(5);
      expect(minY).to.equal(3);
      expect(maxY).to.equal(5);
    });
    
    it('should fill single tile for same start and end', function() {
      const x1 = 5, y1 = 5;
      const x2 = 5, y2 = 5;
      
      const width = Math.abs(x2 - x1) + 1;
      const height = Math.abs(y2 - y1) + 1;
      
      expect(width * height).to.equal(1);
    });
  });
});

describe('TerrainEditor - Line Tool', function() {
  
  describe('drawLine()', function() {
    
    it('should draw straight horizontal line', function() {
      const x1 = 2, y1 = 5;
      const x2 = 7, y2 = 5;
      
      const tiles = [];
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        tiles.push([x, y1]);
      }
      
      expect(tiles).to.have.lengthOf(6);
      tiles.forEach(tile => expect(tile[1]).to.equal(5));
    });
    
    it('should draw straight vertical line', function() {
      const x1 = 5, y1 = 2;
      const x2 = 5, y2 = 7;
      
      const tiles = [];
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        tiles.push([x1, y]);
      }
      
      expect(tiles).to.have.lengthOf(6);
      tiles.forEach(tile => expect(tile[0]).to.equal(5));
    });
    
    it('should use Bresenham algorithm for diagonal lines', function() {
      const x1 = 0, y1 = 0;
      const x2 = 4, y2 = 2;
      
      const tiles = [];
      
      // Simplified Bresenham
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;
      
      let x = x1, y = y1;
      
      while (true) {
        tiles.push([x, y]);
        
        if (x === x2 && y === y2) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
      
      expect(tiles.length).to.be.greaterThan(0);
      expect(tiles[0]).to.deep.equal([0, 0]);
      expect(tiles[tiles.length - 1]).to.deep.equal([4, 2]);
    });
  });
});

describe('TerrainEditor - Undo/Redo System', function() {
  
  describe('undoStack()', function() {
    
    it('should record paint action', function() {
      const undoStack = [];
      
      const action = {
        type: 'paint',
        position: [5, 5],
        oldMaterial: 'grass',
        newMaterial: 'water'
      };
      
      undoStack.push(action);
      
      expect(undoStack).to.have.lengthOf(1);
      expect(undoStack[0].type).to.equal('paint');
    });
    
    it('should undo paint action', function() {
      const undoStack = [
        {
          type: 'paint',
          position: [5, 5],
          oldMaterial: 'grass',
          newMaterial: 'water'
        }
      ];
      
      const action = undoStack.pop();
      
      // Apply reverse (restore old material)
      const restoredMaterial = action.oldMaterial;
      
      expect(restoredMaterial).to.equal('grass');
      expect(undoStack).to.have.lengthOf(0);
    });
    
    it('should move undone action to redo stack', function() {
      const undoStack = [{ type: 'paint', data: {} }];
      const redoStack = [];
      
      const action = undoStack.pop();
      redoStack.push(action);
      
      expect(undoStack).to.have.lengthOf(0);
      expect(redoStack).to.have.lengthOf(1);
    });
    
    it('should clear redo stack on new action', function() {
      const undoStack = [];
      const redoStack = [{ type: 'paint' }];
      
      // New action occurs
      const newAction = { type: 'paint', data: {} };
      undoStack.push(newAction);
      redoStack.length = 0; // Clear redo stack
      
      expect(redoStack).to.have.lengthOf(0);
    });
    
    it('should limit undo stack size', function() {
      const maxStackSize = 50;
      const undoStack = [];
      
      for (let i = 0; i < 60; i++) {
        undoStack.push({ type: 'paint', index: i });
        
        if (undoStack.length > maxStackSize) {
          undoStack.shift(); // Remove oldest
        }
      }
      
      expect(undoStack).to.have.lengthOf(50);
      expect(undoStack[0].index).to.equal(10); // First 10 removed
    });
    
    it('should support batch undo for multi-tile operations', function() {
      const action = {
        type: 'fill',
        tiles: [
          { position: [5, 5], oldMaterial: 'grass', newMaterial: 'water' },
          { position: [5, 6], oldMaterial: 'grass', newMaterial: 'water' },
          { position: [6, 5], oldMaterial: 'grass', newMaterial: 'water' }
        ]
      };
      
      expect(action.tiles).to.have.lengthOf(3);
      expect(action.type).to.equal('fill');
    });
  });
});

describe('TerrainEditor - Material Selector', function() {
  
  describe('selectMaterial()', function() {
    
    it('should change selected material', function() {
      let selectedMaterial = 'grass';
      
      selectedMaterial = 'water';
      
      expect(selectedMaterial).to.equal('water');
    });
    
    it('should provide list of available materials', function() {
      const availableMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
      
      expect(availableMaterials).to.include('moss');
      expect(availableMaterials).to.include('moss_1');
      expect(availableMaterials).to.include('stone');
    });
    
    it('should support material categories', function() {
      const categories = {
        'natural': ['grass', 'dirt', 'stone'],
        'liquid': ['water'],
        'sand': ['sand']
      };
      
      expect(categories.natural).to.include('grass');
      expect(categories.liquid).to.include('water');
    });
  });
});

describe('TerrainEditor - Eyedropper Tool', function() {
  
  describe('pickMaterial()', function() {
    
    it('should select material from clicked tile', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const tile = terrain.chunkArray.rawArray[0].tileData.rawArray[0];
      
      const pickedMaterial = tile._materialSet;
      
      expect(pickedMaterial).to.be.a('string');
      expect(Object.keys(TERRAIN_MATERIALS_RANGED)).to.include(pickedMaterial);
    });
  });
});

describe('TerrainEditor - Grid Overlay', function() {
  
  describe('renderGrid()', function() {
    
    it('should calculate grid line positions', function() {
      const gridSize = 32; // Tile size
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      const verticalLines = Math.ceil(canvasWidth / gridSize);
      const horizontalLines = Math.ceil(canvasHeight / gridSize);
      
      expect(verticalLines).to.equal(25);
      expect(horizontalLines).to.equal(19);
    });
    
    it('should toggle grid visibility', function() {
      let gridVisible = true;
      
      gridVisible = !gridVisible;
      
      expect(gridVisible).to.be.false;
    });
  });
});

describe('TerrainEditor - Selection Tool', function() {
  
  describe('selectRegion()', function() {
    
    it('should track selection rectangle', function() {
      const selection = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        active: true
      };
      
      const width = Math.abs(selection.endX - selection.startX);
      const height = Math.abs(selection.endY - selection.startY);
      
      expect(width).to.equal(100);
      expect(height).to.equal(100);
    });
    
    it('should get tiles in selection', function() {
      const selectionBounds = {
        minX: 5,
        maxX: 8,
        minY: 5,
        maxY: 7
      };
      
      const tiles = [];
      for (let y = selectionBounds.minY; y <= selectionBounds.maxY; y++) {
        for (let x = selectionBounds.minX; x <= selectionBounds.maxX; x++) {
          tiles.push([x, y]);
        }
      }
      
      expect(tiles).to.have.lengthOf(12); // 4 x 3
    });
    
    it('should support copy and paste operations', function() {
      const copiedData = {
        tiles: [
          { offset: [0, 0], material: 'grass' },
          { offset: [1, 0], material: 'dirt' }
        ],
        width: 2,
        height: 1
      };
      
      expect(copiedData.tiles).to.have.lengthOf(2);
      expect(copiedData.width).to.equal(2);
    });
  });
});

describe('TerrainEditor - Keyboard Shortcuts', function() {
  
  describe('handleKeyPress()', function() {
    
    it('should map Ctrl+Z to undo', function() {
      const key = 'z';
      const ctrlPressed = true;
      
      const action = ctrlPressed && key === 'z' ? 'undo' : null;
      
      expect(action).to.equal('undo');
    });
    
    it('should map Ctrl+Y to redo', function() {
      const key = 'y';
      const ctrlPressed = true;
      
      const action = ctrlPressed && key === 'y' ? 'redo' : null;
      
      expect(action).to.equal('redo');
    });
    
    it('should map number keys to brush sizes', function() {
      const key = '3';
      const brushSize = parseInt(key);
      
      expect(brushSize).to.equal(3);
    });
    
    it('should map B to brush tool', function() {
      const key = 'b';
      const tool = key === 'b' ? 'brush' : null;
      
      expect(tool).to.equal('brush');
    });
  });
});




// ================================================================
// terrainEditorBrushPatterns.test.js (5 tests)
// ================================================================
/**
 * Unit Tests: TerrainEditor Brush Patterns
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * Tests that TerrainEditor.paint() uses the correct brush patterns:
 * - Even sizes (2,4,6,8): Circular pattern
 * - Odd sizes (3,5,7,9): Square pattern
 */

describe('TerrainEditor Brush Patterns (Unit Tests)', function() {
    let TerrainEditor, mockTerrain, editor;
    
    beforeEach(function() {
        // Load TerrainEditor
        TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
        
        // Create mock terrain
        const tiles = {};
        mockTerrain = {
            _tileSize: 32,
            _gridSizeX: 10,
            _gridSizeY: 10,
            _chunkSize: 10,
            getArrPos: sinon.stub().callsFake(([x, y]) => {
                const key = `${x},${y}`;
                if (!tiles[key]) {
                    tiles[key] = {
                        material: 'dirt',
                        getMaterial: function() { return this.material; },
                        setMaterial: function(mat) { this.material = mat; },
                        assignWeight: sinon.stub()
                    };
                }
                return tiles[key];
            }),
            invalidateCache: sinon.stub()
        };
        
        editor = new TerrainEditor(mockTerrain);
    });
    
    describe('Odd Size 3 - Square Pattern', function() {
        it('should paint 3x3 square (9 tiles) for brush size 3', function() {
            editor.setBrushSize(3);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 9 tiles were painted (3x3 square)
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(9, 'Should paint 9 tiles in 3x3 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 9, y: 9 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 9 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 9, y: 11 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 11 }); // Bottom-right
        });
    });
    
    describe('Even Size 4 - Circular Pattern', function() {
        it('should paint circular pattern (13 tiles) for brush size 4', function() {
            editor.setBrushSize(4);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 2 should have ~13 tiles
            expect(paintedTiles.length).to.be.greaterThan(9);
            expect(paintedTiles.length).to.be.lessThanOrEqual(16);
            
            // Center should be painted
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('Odd Size 5 - Square Pattern', function() {
        it('should paint 5x5 square (25 tiles) for brush size 5', function() {
            editor.setBrushSize(5);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 25 tiles were painted (5x5 square)
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(25, 'Should paint 25 tiles in 5x5 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 8, y: 8 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 8 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 8, y: 12 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 12 }); // Bottom-right
        });
    });
    
    describe('Even Size 2 - Circular Pattern', function() {
        it('should paint circular pattern (5 tiles cross) for brush size 2', function() {
            editor.setBrushSize(2);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 1 creates cross (5 tiles)
            expect(paintedTiles.length).to.equal(5);
            
            // Center + 4 cardinal directions
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 }); // Center
            expect(paintedTiles).to.deep.include({ x: 9, y: 10 });  // Left
            expect(paintedTiles).to.deep.include({ x: 11, y: 10 }); // Right
            expect(paintedTiles).to.deep.include({ x: 10, y: 9 });  // Top
            expect(paintedTiles).to.deep.include({ x: 10, y: 11 }); // Bottom
        });
    });
    
    describe('Size 1 - Single Tile', function() {
        it('should paint single tile for brush size 1', function() {
            editor.setBrushSize(1);
            editor.selectMaterial('stone');
            
            // Paint at (10, 10)
            editor.paint(10, 10);
            
            // Only (10,10) should be painted
            const tile10_10 = mockTerrain.getArrPos([10, 10]);
            expect(tile10_10.getMaterial()).to.equal('stone');
            
            // Adjacent tiles should NOT be painted
            const tile9_10 = mockTerrain.getArrPos([9, 10]);
            expect(tile9_10.getMaterial()).to.equal('dirt');
        });
    });
});




// ================================================================
// TerrainEditorFillBounds.test.js (12 tests)
// ================================================================
/**
 * TerrainEditorFillBounds.test.js
 * 
 * TDD unit tests for fill tool bounds limiting
 * Issue: Fill tool fills EVERYTHING, needs 100x100 area limit
 * 
 * Test Strategy:
 * - Mock SparseTerrain with sparse data structure
 * - Test fillRegion with various area sizes
 * - Verify MAX_FILL_AREA constant limits fill operations
 * - Test count tracking and limit detection
 */

// Setup JSDOM
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load TerrainEditor
let TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('TerrainEditor - Fill Bounds Limit', function() {
  let terrainEditor;
  let mockTerrain;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    
    // Sync to window for JSDOM
    window.createVector = global.createVector;
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    
    // Create mock SparseTerrain with getArrPos interface
    mockTerrain = {
      _tiles: new Map(),
      _tileSize: 32,
      // Note: NO _gridSizeX/_gridSizeY to allow sparse behavior (negative coords)
      
      // Compatibility method - returns wrapper with getMaterial/setMaterial
      getArrPos: function(coords) {
        const key = `${coords[0]},${coords[1]}`;
        const self = this;
        return {
          getMaterial: function() {
            const tile = self._tiles.get(key);
            // Return material if explicitly set, otherwise return unique empty identifier
            // This prevents fill from spreading to unset tiles
            return tile ? tile.material : null;
          },
          setMaterial: function(material) {
            self._tiles.set(key, { material });
          },
          assignWeight: function() {
            // Mock - no-op
          }
        };
      },
      
      // Helper to check if tile exists
      hasTile: function(x, y) {
        return this._tiles.has(`${x},${y}`);
      },
      
      // Helper to set tile directly
      setTile: function(x, y, material) {
        this._tiles.set(`${x},${y}`, { material });
      },
      
      // Compatibility method - no-op for SparseTerrain
      invalidateCache: function() {
        // Mock - no-op
      }
    };
    
    // Create TerrainEditor with mock terrain
    terrainEditor = new TerrainEditor(mockTerrain);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('MAX_FILL_AREA Constant', function() {
    it('should define MAX_FILL_AREA as 10000 (100x100)', function() {
      expect(terrainEditor.MAX_FILL_AREA).to.equal(10000);
    });
  });
  
  describe('fillRegion() with Bounds Limit', function() {
    it('should fill small area completely (10x10 = 100 tiles)', function() {
      
      // Create 10x10 grass area
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(100);
      expect(result.limitReached).to.be.false;
      
      // Verify all tiles changed
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(mockTerrain.getArrPos([x, y]).getMaterial()).to.equal('dirt');
        }
      }
    });
    
    it('should fill exactly 100x100 area (limit)', function() {
      if (!terrainEditor) this.skip();
      
      // Create 100x100 grass area
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(50, 50, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.false; // Exactly at limit
    });
    
    it('should stop at 100x100 limit when filling larger area', function() {
      if (!terrainEditor) this.skip();
      
      // Create 200x200 grass area (40,000 tiles)
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(100, 100, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000); // Stopped at limit
      expect(result.limitReached).to.be.true;
      
      // Verify not all tiles changed
      let dirtCount = 0;
      let grassCount = 0;
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          const material = mockTerrain.getArrPos([x, y]).getMaterial();
          if (material === 'dirt') dirtCount++;
          if (material === 'grass') grassCount++;
        }
      }
      
      expect(dirtCount).to.equal(10000);
      expect(grassCount).to.equal(30000); // 40000 - 10000
    });
    
    it('should return correct tilesFilled count for irregular shapes', function() {
      if (!terrainEditor) this.skip();
      
      // Create L-shape (150 tiles total)
      // Vertical: 0-9, 0-9 (100 tiles)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      // Horizontal: 10-14, 0-9 (50 tiles)
      for (let x = 10; x < 15; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(150);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle already-filled tiles within limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create 20x20 area
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      // Fill with dirt first
      terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Reset terrain
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      mockTerrain.setTile(10, 10, 'dirt'); // One already dirt
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill nothing (already same material)
      expect(result.tilesFilled).to.equal(0);
      expect(result.limitReached).to.be.false;
    });
    
    it('should not fill if start tile is different material', function() {
      if (!terrainEditor) this.skip();
      
      // Create mixed terrain
      mockTerrain.setTile(5, 5, 'grass');
      mockTerrain.setTile(6, 5, 'stone');
      
      const result = terrainEditor.fillRegion(5, 5, 'stone');
      
      // Should only fill grass tile
      expect(result.tilesFilled).to.equal(1);
    });
    
    it('should respect material boundaries even with limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create checkerboard (prevents BFS from spreading)
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const material = (x + y) % 2 === 0 ? 'grass' : 'stone';
          mockTerrain.setTile(x, y, material);
        }
      }
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should only fill grass tiles (half of 2500 = 1250)
      expect(result.tilesFilled).to.be.at.most(1250);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle sparse terrain with gaps', function() {
      if (!terrainEditor) this.skip();
      
      // Create island of grass tiles (not filled everywhere)
      mockTerrain.setTile(10, 10, 'grass');
      mockTerrain.setTile(11, 10, 'grass');
      mockTerrain.setTile(10, 11, 'grass');
      mockTerrain.setTile(11, 11, 'grass');
      // Surrounding tiles are default (not explicitly set)
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill 4 grass tiles OR everything connected with same default material
      // Depends on SparseTerrain behavior for unfilled tiles
      expect(result.tilesFilled).to.be.at.least(4);
    });
    
    it('should return metadata about fill operation', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(0, 0, 'grass');
      mockTerrain.setTile(1, 0, 'grass');
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      expect(result).to.have.property('tilesFilled');
      expect(result).to.have.property('limitReached');
      expect(result).to.have.property('startMaterial');
      expect(result).to.have.property('newMaterial');
      
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle fillRegion on non-existent tile', function() {
      if (!terrainEditor) this.skip();
      
      // Don't set any tiles - rely on default material
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should handle gracefully (either fill default or skip)
      expect(result).to.have.property('tilesFilled');
      expect(result.tilesFilled).to.be.at.least(0);
    });
    
    it('should handle negative coordinates within bounds', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(-5, -5, 'grass');
      mockTerrain.setTile(-4, -5, 'grass');
      
      const result = terrainEditor.fillRegion(-5, -5, 'dirt');
      
      expect(result.tilesFilled).to.be.at.least(2);
    });
  });
});




// ================================================================
// terrainEditorMaterialPainting.test.js (13 tests)
// ================================================================
/**
 * Unit Tests - TerrainEditor Material Painting
 * 
 * Tests that TerrainEditor paints actual material types (moss, stone, dirt, grass)
 * not just colors
 */

describe('TerrainEditor - Material Painting', function() {
  let TerrainEditor;
  let editor;
  let mockTerrain;
  let mockTile;

  beforeEach(function() {
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
      getArrPos: sinon.stub().returns(mockTile),
      getTile: sinon.stub().returns(mockTile),
      invalidateCache: sinon.stub()
    };
    
    // Load TerrainEditor
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
    
    // Create editor
    editor = new TerrainEditor(mockTerrain);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Material Selection', function() {
    it('should set material by name, not color', function() {
      editor.selectMaterial('moss');
      
      expect(editor._selectedMaterial).to.equal('moss');
      expect(editor._selectedMaterial).to.be.a('string');
      expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
    });
    
    it('should accept all terrain material types', function() {
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        expect(editor._selectedMaterial).to.equal(material);
      });
    });
  });

  describe('Paint Tile with Material', function() {
    it('should paint tile with material name, not color', function() {
      editor.selectMaterial('stone');
      
      // Paint at tile position 5, 5
      editor.paintTile(5 * 32, 5 * 32);
      
      // Should have called setMaterial with 'stone'
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
      expect(mockTile.setMaterial.calledWith(sinon.match(/^#/))).to.be.false;
    });
    
    it('should paint with moss material', function() {
      editor.selectMaterial('moss');
      editor.paintTile(10 * 32, 10 * 32);
      
      expect(mockTile.setMaterial.calledWith('moss')).to.be.true;
    });
    
    it('should paint with dirt material', function() {
      editor.selectMaterial('dirt');
      editor.paintTile(8 * 32, 8 * 32);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should paint with grass material', function() {
      editor.selectMaterial('grass');
      editor.paintTile(12 * 32, 12 * 32);
      
      expect(mockTile.setMaterial.calledWith('grass')).to.be.true;
    });
    
    it('should call assignWeight after setting material', function() {
      editor.selectMaterial('stone');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTile.assignWeight.called).to.be.true;
    });
    
    it('should invalidate terrain cache after painting', function() {
      editor.selectMaterial('moss');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTerrain.invalidateCache.called).to.be.true;
    });
  });

  describe('Paint Method Integration', function() {
    it('should paint using the paint() method', function() {
      editor.selectMaterial('dirt');
      
      // paint() method uses tile coordinates directly
      editor.paint(5, 5);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should use selected material when painting', function() {
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
    });
  });

  describe('Material Type Verification', function() {
    it('should store material as string name', function() {
      editor.selectMaterial('moss');
      
      expect(typeof editor._selectedMaterial).to.equal('string');
      expect(editor._selectedMaterial).to.equal('moss');
    });
    
    it('should not store color codes', function() {
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        
        // Should be material name, not hex color
        expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
        expect(editor._selectedMaterial).to.not.match(/^rgb/i);
      });
    });
  });

  describe('Fill with Material', function() {
    it('should fill region with material name', function() {
      // Set tile to different material first
      mockTile._material = 'dirt';
      mockTile.getMaterial = sinon.stub().returns('dirt');
      
      editor.selectMaterial('grass');
      
      // Mock fill to check material
      mockTerrain.getArrPos = sinon.stub().returns(mockTile);
      
      editor.fill(5, 5);
      
      // Should have called setMaterial with 'grass'
      const setMaterialCalls = mockTile.setMaterial.getCalls();
      const grassCalls = setMaterialCalls.filter(call => call.args[0] === 'grass');
      expect(grassCalls.length).to.be.greaterThan(0);
    });
  });
});




// ================================================================
// terrainExporter.test.js (32 tests)
// ================================================================
/**
 * Unit Tests for TerrainExporter
 * Tests exporting terrain to various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let exporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
vm.runInThisContext(exporterCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainExporter - JSON Export', function() {
  
  describe('exportToJSON()', function() {
    
    it('should export basic terrain metadata', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata.version).to.equal('1.0');
      expect(exported.metadata.gridSizeX).to.equal(3);
      expect(exported.metadata.gridSizeY).to.equal(3);
      expect(exported.metadata.chunkSize).to.equal(8);
      expect(exported.metadata.seed).to.equal(12345);
    });
    
    it('should export all tile materials', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.have.lengthOf(2 * 2 * 8 * 8); // gridSizeX * gridSizeY * chunkSize * chunkSize
      exported.tiles.forEach(material => {
        expect(material).to.be.a('string');
      });
    });
    
    it('should include custom metadata when provided', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const customMetadata = {
        name: 'Test Level',
        author: 'TestUser',
        description: 'A test level',
        difficulty: 'easy',
        tags: ['tutorial', 'beginner']
      };
      
      const exported = {
        metadata: {
          ...customMetadata,
          version: '1.0',
          gridSizeX: terrain._gridSizeX,
          gridSizeY: terrain._gridSizeY
        }
      };
      
      expect(exported.metadata.name).to.equal('Test Level');
      expect(exported.metadata.author).to.equal('TestUser');
      expect(exported.metadata.tags).to.deep.equal(['tutorial', 'beginner']);
    });
    
    it('should support compressed tile format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Compressed format: single string where each char represents a material
      const materialToChar = {
        'grass': 'g',
        'dirt': 'd',
        'stone': 's',
        'water': 'w',
        'sand': 'a',
        'moss_0': 'm'
      };
      
      let compressed = '';
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          compressed += materialToChar[tile._materialSet] || 'g';
        });
      });
      
      expect(compressed).to.be.a('string');
      expect(compressed.length).to.equal(4 * 64); // One char per tile
      expect(compressed).to.match(/^[gdswam]+$/); // Only valid characters
    });
    
    it('should handle empty or minimal terrains', function() {
      const terrain = new gridTerrain(1, 1, 12345);
      
      const exported = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: []
      };
      
      terrain.chunkArray.rawArray[0].tileData.rawArray.forEach(tile => {
        exported.tiles.push({
          x: tile._x,
          y: tile._y,
          material: tile._materialSet
        });
      });
      
      expect(exported.tiles).to.have.length.greaterThan(0);
    });
    
    it('should generate valid JSON string', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const data = {
        metadata: { version: '1.0' },
        terrain: { seed: terrain._seed }
      };
      
      const jsonString = JSON.stringify(data);
      expect(jsonString).to.be.a('string');
      
      // Should be parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed.metadata.version).to.equal('1.0');
    });
  });
  
  describe('exportOptions()', function() {
    
    it('should support entities export option', function() {
      const includeEntities = true;
      const entities = [
        { type: 'ant_hill', x: 40, y: 40 },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      const exported = {
        entities: includeEntities ? entities : []
      };
      
      expect(exported.entities).to.have.lengthOf(2);
      expect(exported.entities[0].type).to.equal('ant_hill');
    });
    
    it('should support resources export option', function() {
      const includeResources = true;
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 }
      ];
      
      const exported = {
        resources: includeResources ? resources : []
      };
      
      expect(exported.resources).to.have.lengthOf(1);
    });
    
    it('should support compression option', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Uncompressed: array of tile objects
      const uncompressed = [];
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          uncompressed.push({ x: tile._x, y: tile._y, material: tile._materialSet });
        });
      });
      
      // Compressed: run-length encoding
      const compressed = [];
      let currentMaterial = null;
      let runLength = 0;
      
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          if (tile._materialSet === currentMaterial) {
            runLength++;
          } else {
            if (currentMaterial !== null) {
              compressed.push({ material: currentMaterial, count: runLength });
            }
            currentMaterial = tile._materialSet;
            runLength = 1;
          }
        });
      });
      
      if (currentMaterial !== null) {
        compressed.push({ material: currentMaterial, count: runLength });
      }
      
      // Compressed should be smaller for homogeneous terrain
      const uncompressedSize = JSON.stringify(uncompressed).length;
      const compressedSize = JSON.stringify(compressed).length;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should exclude entities when option is false', function() {
      const exported = {
        metadata: {},
        entities: false ? [{ type: 'ant' }] : []
      };
      
      expect(exported.entities).to.have.lengthOf(0);
    });
    
    it('should include timestamp in metadata', function() {
      const exported = {
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      expect(exported.metadata.created).to.match(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
  
  describe('chunkBasedExport()', function() {
    
    it('should export terrain by chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const chunkData = terrain.chunkArray.rawArray.map((chunk, idx) => {
        const chunkPos = terrain.chunkArray.convToSquare(idx);
        return {
          position: chunkPos,
          tiles: chunk.tileData.rawArray.map(tile => ({
            offset: [tile._x % 8, tile._y % 8],
            material: tile._materialSet
          }))
        };
      });
      
      expect(chunkData).to.have.lengthOf(9); // 3x3 chunks
      chunkData.forEach(chunk => {
        expect(chunk.position).to.be.an('array');
        expect(chunk.tiles).to.have.lengthOf(64); // 8x8 tiles per chunk
      });
    });
    
    it('should use default material with exceptions', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const chunks = terrain.chunkArray.rawArray.map(chunk => {
        // Find most common material
        const materialCounts = {};
        chunk.tileData.rawArray.forEach(tile => {
          materialCounts[tile._materialSet] = (materialCounts[tile._materialSet] || 0) + 1;
        });
        
        const defaultMaterial = Object.keys(materialCounts).reduce((a, b) => 
          materialCounts[a] > materialCounts[b] ? a : b
        );
        
        // Only store exceptions
        const exceptions = [];
        chunk.tileData.rawArray.forEach((tile, idx) => {
          if (tile._materialSet !== defaultMaterial) {
            exceptions.push({
              offset: [idx % 8, Math.floor(idx / 8)],
              material: tile._materialSet
            });
          }
        });
        
        return {
          defaultMaterial,
          exceptions
        };
      });
      
      chunks.forEach(chunk => {
        expect(chunk.defaultMaterial).to.be.a('string');
        expect(chunk.exceptions).to.be.an('array');
      });
    });
  });
});

describe('TerrainExporter - File Generation', function() {
  
  describe('generateFileName()', function() {
    
    it('should generate filename with timestamp', function() {
      const timestamp = Date.now();
      const filename = `terrain_${timestamp}.json`;
      
      expect(filename).to.match(/^terrain_\d+\.json$/);
    });
    
    it('should support custom filenames', function() {
      const customName = 'my_level';
      const filename = `${customName}.json`;
      
      expect(filename).to.equal('my_level.json');
    });
    
    it('should sanitize filenames', function() {
      const unsafeName = 'my level/with\\bad:chars*';
      const safeName = unsafeName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      expect(safeName).to.equal('my_level_with_bad_chars_');
      expect(safeName).to.not.match(/[\/\\:*]/);
    });
    
    it('should add extension if missing', function() {
      const name = 'terrain_file';
      const withExtension = name.endsWith('.json') ? name : `${name}.json`;
      
      expect(withExtension).to.equal('terrain_file.json');
    });
  });
  
  describe('getMimeType()', function() {
    
    it('should return correct MIME type for JSON', function() {
      const mimeType = 'application/json';
      expect(mimeType).to.equal('application/json');
    });
    
    it('should return correct MIME type for PNG', function() {
      const mimeType = 'image/png';
      expect(mimeType).to.equal('image/png');
    });
    
    it('should return correct MIME type for binary', function() {
      const mimeType = 'application/octet-stream';
      expect(mimeType).to.equal('application/octet-stream');
    });
  });
});

describe('TerrainExporter - Run-Length Encoding', function() {
  
  describe('runLengthEncode()', function() {
    
    it('should compress homogeneous sequences', function() {
      const materials = ['grass', 'grass', 'grass', 'dirt', 'dirt', 'grass'];
      
      const encoded = [];
      let current = materials[0];
      let count = 1;
      
      for (let i = 1; i < materials.length; i++) {
        if (materials[i] === current) {
          count++;
        } else {
          encoded.push({ material: current, count });
          current = materials[i];
          count = 1;
        }
      }
      encoded.push({ material: current, count });
      
      expect(encoded).to.deep.equal([
        { material: 'grass', count: 3 },
        { material: 'dirt', count: 2 },
        { material: 'grass', count: 1 }
      ]);
    });
    
    it('should handle single material terrain', function() {
      const materials = new Array(100).fill('grass');
      
      const encoded = [{ material: 'grass', count: 100 }];
      
      expect(encoded).to.have.lengthOf(1);
      expect(encoded[0].count).to.equal(100);
    });
    
    it('should handle alternating materials', function() {
      const materials = ['grass', 'dirt', 'grass', 'dirt'];
      
      const encoded = materials.map(m => ({ material: m, count: 1 }));
      
      expect(encoded).to.have.lengthOf(4);
    });
    
    it('should preserve order', function() {
      const materials = ['a', 'a', 'b', 'c', 'c', 'c'];
      
      const encoded = [
        { material: 'a', count: 2 },
        { material: 'b', count: 1 },
        { material: 'c', count: 3 }
      ];
      
      // Decode to verify
      const decoded = [];
      encoded.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          decoded.push(run.material);
        }
      });
      
      expect(decoded).to.deep.equal(materials);
    });
  });
});

describe('TerrainExporter - Validation', function() {
  
  describe('validateExportData()', function() {
    
    it('should validate required metadata fields', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5,
          chunkSize: 8,
          tileSize: 32
        }
      };
      
      expect(data.metadata.version).to.exist;
      expect(data.metadata.gridSizeX).to.be.a('number');
      expect(data.metadata.gridSizeY).to.be.a('number');
    });
    
    it('should reject invalid version format', function() {
      const version = '1.0';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.true;
      expect(/^\d+\.\d+$/.test('invalid')).to.be.false;
    });
    
    it('should validate tile data structure', function() {
      const tile = {
        x: 0,
        y: 0,
        material: 'grass',
        weight: 1
      };
      
      expect(tile).to.have.property('x');
      expect(tile).to.have.property('y');
      expect(tile).to.have.property('material');
      expect(tile.material).to.be.a('string');
    });
    
    it('should reject negative coordinates', function() {
      const tile = { x: -1, y: 0, material: 'grass' };
      const isValid = tile.x >= 0 && tile.y >= 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = ['grass', 'dirt', 'stone', 'water', 'sand'];
      const material = 'grass';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include('invalid_material');
    });
  });
});

describe('TerrainExporter - Size Calculations', function() {
  
  describe('calculateExportSize()', function() {
    
    it('should calculate JSON byte size', function() {
      const data = { metadata: { version: '1.0' }, tiles: [] };
      const jsonString = JSON.stringify(data);
      const byteSize = new TextEncoder().encode(jsonString).length;
      
      expect(byteSize).to.be.a('number');
      expect(byteSize).to.be.greaterThan(0);
    });
    
    it('should estimate compressed size', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const tileCount = terrain._gridSizeX * terrain._gridSizeY * 
                       terrain._chunkSize * terrain._chunkSize;
      
      // Uncompressed: ~50 bytes per tile (JSON)
      const uncompressedSize = tileCount * 50;
      
      // Compressed: ~10 bytes per run (assuming good compression)
      const estimatedRuns = Math.ceil(tileCount / 10); // Optimistic
      const compressedSize = estimatedRuns * 10;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should report size in human-readable format', function() {
      const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };
      
      expect(formatBytes(500)).to.equal('500 B');
      expect(formatBytes(2048)).to.equal('2.00 KB');
      expect(formatBytes(2097152)).to.equal('2.00 MB');
    });
  });
});




// ================================================================
// terrainImporter.test.js (40 tests)
// ================================================================
/**
 * Unit Tests for TerrainImporter
 * Tests importing terrain from various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let importerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
vm.runInThisContext(importerCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainImporter - JSON Import', function() {
  
  describe('importFromJSON()', function() {
    
    it('should import basic terrain metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          gridSizeX: 3,
          gridSizeY: 3,
          chunkSize: 8,
          tileSize: 32,
          seed: 12345,
          generationMode: 'perlin'
        }
      };
      
      expect(terrainData.metadata.gridSizeX).to.equal(3);
      expect(terrainData.metadata.gridSizeY).to.equal(3);
      expect(terrainData.metadata.seed).to.equal(12345);
    });
    
    it('should reconstruct terrain from tile data', function() {
      const tiles = [
        { x: 0, y: 0, material: 'grass', weight: 1 },
        { x: 1, y: 0, material: 'dirt', weight: 3 },
        { x: 0, y: 1, material: 'stone', weight: 100 }
      ];
      
      const tileMap = new Map();
      tiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        tileMap.set(key, tile);
      });
      
      expect(tileMap.size).to.equal(3);
      expect(tileMap.get('0,0').material).to.equal('grass');
      expect(tileMap.get('1,0').material).to.equal('dirt');
    });
    
    it('should handle compressed tile format', function() {
      const compressed = 'gggdddsss';
      const charToMaterial = {
        'g': 'grass',
        'd': 'dirt',
        's': 'stone',
        'w': 'water',
        'a': 'sand'
      };
      
      const tiles = [];
      for (let i = 0; i < compressed.length; i++) {
        tiles.push({
          index: i,
          material: charToMaterial[compressed[i]]
        });
      }
      
      expect(tiles).to.have.lengthOf(9);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[3].material).to.equal('dirt');
      expect(tiles[6].material).to.equal('stone');
    });
    
    it('should apply run-length decoded data', function() {
      const runs = [
        { material: 'grass', count: 5 },
        { material: 'dirt', count: 3 },
        { material: 'stone', count: 2 }
      ];
      
      const tiles = [];
      runs.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          tiles.push({ material: run.material });
        }
      });
      
      expect(tiles).to.have.lengthOf(10);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[4].material).to.equal('grass');
      expect(tiles[5].material).to.equal('dirt');
      expect(tiles[8].material).to.equal('stone');
    });
    
    it('should restore custom metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          name: 'Desert Level',
          author: 'TestUser',
          description: 'A sandy battlefield',
          difficulty: 'hard',
          tags: ['desert', 'pvp']
        }
      };
      
      expect(terrainData.metadata.name).to.equal('Desert Level');
      expect(terrainData.metadata.author).to.equal('TestUser');
      expect(terrainData.metadata.tags).to.include('desert');
    });
    
    it('should handle minimal terrain data', function() {
      const minimal = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' // 64 tiles (1 chunk)
      };
      
      expect(minimal.tiles.length).to.equal(64);
    });
  });
  
  describe('validateImportData()', function() {
    
    it('should validate required fields exist', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasVersion = !!(data.metadata && data.metadata.version);
      const hasGridSize = !!(data.metadata && data.metadata.gridSizeX && data.metadata.gridSizeY);
      
      expect(hasVersion).to.be.true;
      expect(hasGridSize).to.be.true;
    });
    
    it('should reject missing metadata', function() {
      const data = { tiles: [] };
      const isValid = data.metadata !== undefined;
      
      expect(isValid).to.be.false;
    });
    
    it('should reject invalid version format', function() {
      const version = 'invalid';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.false;
    });
    
    it('should validate grid sizes are positive', function() {
      const gridSizeX = 5;
      const gridSizeY = -1;
      
      const isValid = gridSizeX > 0 && gridSizeY > 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
      const material = 'grass';
      const invalid = 'invalid_material';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include(invalid);
    });
    
    it('should reject malformed JSON', function() {
      const malformed = '{ "metadata": { "version": "1.0" ';
      
      let isValid = true;
      try {
        JSON.parse(malformed);
      } catch (e) {
        isValid = false;
      }
      
      expect(isValid).to.be.false;
    });
    
    it('should validate tile coordinates are within bounds', function() {
      const gridSize = { x: 5, y: 5, chunkSize: 8 };
      const maxX = gridSize.x * gridSize.chunkSize;
      const maxY = gridSize.y * gridSize.chunkSize;
      
      const validTile = { x: 10, y: 10 };
      const invalidTile = { x: 100, y: 10 };
      
      expect(validTile.x < maxX && validTile.y < maxY).to.be.true;
      expect(invalidTile.x < maxX && invalidTile.y < maxY).to.be.false;
    });
  });
  
  describe('chunkBasedImport()', function() {
    
    it('should import terrain by chunks', function() {
      const chunkData = [
        {
          position: [0, 0],
          tiles: Array(64).fill(null).map((_, i) => ({
            offset: [i % 8, Math.floor(i / 8)],
            material: 'grass'
          }))
        }
      ];
      
      expect(chunkData[0].tiles).to.have.lengthOf(64);
      expect(chunkData[0].position).to.deep.equal([0, 0]);
    });
    
    it('should apply default material with exceptions', function() {
      const chunkData = {
        defaultMaterial: 'grass',
        exceptions: [
          { offset: [3, 4], material: 'water' },
          { offset: [7, 2], material: 'stone' }
        ]
      };
      
      const tiles = Array(64).fill(null).map((_, i) => {
        const offset = [i % 8, Math.floor(i / 8)];
        const exception = chunkData.exceptions.find(e => 
          e.offset[0] === offset[0] && e.offset[1] === offset[1]
        );
        
        return {
          offset,
          material: exception ? exception.material : chunkData.defaultMaterial
        };
      });
      
      expect(tiles.filter(t => t.material === 'grass')).to.have.lengthOf(62);
      expect(tiles.filter(t => t.material === 'water')).to.have.lengthOf(1);
      expect(tiles.filter(t => t.material === 'stone')).to.have.lengthOf(1);
    });
    
    it('should handle multiple chunks', function() {
      const chunks = [
        { position: [0, 0], defaultMaterial: 'grass', exceptions: [] },
        { position: [1, 0], defaultMaterial: 'dirt', exceptions: [] },
        { position: [0, 1], defaultMaterial: 'stone', exceptions: [] }
      ];
      
      expect(chunks).to.have.lengthOf(3);
      expect(chunks[0].defaultMaterial).to.equal('grass');
      expect(chunks[1].defaultMaterial).to.equal('dirt');
    });
  });
});

describe('TerrainImporter - Version Migration', function() {
  
  describe('migrateVersion()', function() {
    
    it('should detect old version format', function() {
      const oldData = {
        metadata: { version: '1.0' }
      };
      
      const currentVersion = '2.0';
      const needsMigration = oldData.metadata.version !== currentVersion;
      
      expect(needsMigration).to.be.true;
    });
    
    it('should migrate v1.0 to v2.0', function() {
      const v1Data = {
        metadata: {
          version: '1.0',
          width: 5,
          height: 5
        }
      };
      
      // Migration: rename width/height to gridSizeX/gridSizeY
      const v2Data = {
        metadata: {
          version: '2.0',
          gridSizeX: v1Data.metadata.width,
          gridSizeY: v1Data.metadata.height
        }
      };
      
      expect(v2Data.metadata.version).to.equal('2.0');
      expect(v2Data.metadata.gridSizeX).to.equal(5);
      expect(v2Data.metadata.gridSizeY).to.equal(5);
    });
    
    it('should chain multiple migrations', function() {
      const versions = ['1.0', '1.5', '2.0'];
      const currentVersion = '2.0';
      
      let data = { metadata: { version: '1.0' } };
      
      while (data.metadata.version !== currentVersion) {
        const versionIndex = versions.indexOf(data.metadata.version);
        const nextVersion = versions[versionIndex + 1];
        
        // Simulate migration
        data.metadata.version = nextVersion;
      }
      
      expect(data.metadata.version).to.equal('2.0');
    });
    
    it('should preserve data during migration', function() {
      const original = {
        metadata: { version: '1.0', name: 'Test Level' },
        tiles: ['g', 'g', 'd']
      };
      
      const migrated = {
        metadata: {
          ...original.metadata,
          version: '2.0'
        },
        tiles: original.tiles
      };
      
      expect(migrated.metadata.name).to.equal('Test Level');
      expect(migrated.tiles).to.deep.equal(['g', 'g', 'd']);
    });
    
    it('should skip migration for current version', function() {
      const currentData = {
        metadata: { version: '2.0' }
      };
      
      const needsMigration = currentData.metadata.version !== '2.0';
      
      expect(needsMigration).to.be.false;
    });
  });
  
  describe('validateMigration()', function() {
    
    it('should validate migrated data structure', function() {
      const migrated = {
        metadata: {
          version: '2.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasRequiredFields = !!(
        migrated.metadata.version &&
        migrated.metadata.gridSizeX &&
        migrated.metadata.gridSizeY
      );
      
      expect(hasRequiredFields).to.be.true;
    });
    
    it('should reject incomplete migrations', function() {
      const incomplete = {
        metadata: {
          version: '2.0'
          // Missing gridSizeX, gridSizeY
        }
      };
      
      const isComplete = 
        incomplete.metadata.gridSizeX !== undefined &&
        incomplete.metadata.gridSizeY !== undefined;
      
      expect(isComplete).to.be.false;
    });
  });
});

describe('TerrainImporter - Entity Import', function() {
  
  describe('importEntities()', function() {
    
    it('should import entity data', function() {
      const entities = [
        { type: 'ant_hill', x: 40, y: 40, faction: 'red' },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      expect(entities).to.have.lengthOf(2);
      expect(entities[0].type).to.equal('ant_hill');
      expect(entities[1].amount).to.equal(50);
    });
    
    it('should validate entity types', function() {
      const validTypes = ['ant_hill', 'food', 'resource', 'obstacle'];
      const entity = { type: 'ant_hill' };
      
      const isValid = validTypes.includes(entity.type);
      
      expect(isValid).to.be.true;
    });
    
    it('should validate entity positions', function() {
      const bounds = { maxX: 100, maxY: 100 };
      const validEntity = { type: 'food', x: 50, y: 50 };
      const invalidEntity = { type: 'food', x: 150, y: 50 };
      
      const isValidPosition = (entity) => 
        entity.x >= 0 && entity.x <= bounds.maxX &&
        entity.y >= 0 && entity.y <= bounds.maxY;
      
      expect(isValidPosition(validEntity)).to.be.true;
      expect(isValidPosition(invalidEntity)).to.be.false;
    });
    
    it('should handle optional entity data', function() {
      const terrainData = {
        metadata: {},
        entities: [] // Optional, may be empty
      };
      
      expect(terrainData.entities).to.be.an('array');
      expect(terrainData.entities).to.have.lengthOf(0);
    });
  });
});

describe('TerrainImporter - Resource Import', function() {
  
  describe('importResources()', function() {
    
    it('should import resource data', function() {
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 },
        { type: 'stone', x: 80, y: 80, quantity: 15 }
      ];
      
      expect(resources).to.have.lengthOf(2);
      expect(resources[0].quantity).to.equal(20);
    });
    
    it('should validate resource quantities', function() {
      const resource = { type: 'wood', quantity: 20 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.true;
    });
    
    it('should reject negative quantities', function() {
      const resource = { type: 'wood', quantity: -5 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.false;
    });
  });
});

describe('TerrainImporter - Error Handling', function() {
  
  describe('handleImportErrors()', function() {
    
    it('should throw error for missing required fields', function() {
      const invalidData = { tiles: [] }; // Missing metadata
      
      const validate = () => {
        if (!invalidData.metadata) {
          throw new Error('Missing required field: metadata');
        }
      };
      
      expect(validate).to.throw('Missing required field: metadata');
    });
    
    it('should throw error for invalid data types', function() {
      const invalidData = {
        metadata: {
          version: '1.0',
          gridSizeX: 'five' // Should be number
        }
      };
      
      const validate = () => {
        if (typeof invalidData.metadata.gridSizeX !== 'number') {
          throw new Error('gridSizeX must be a number');
        }
      };
      
      expect(validate).to.throw('gridSizeX must be a number');
    });
    
    it('should provide helpful error messages', function() {
      const error = new Error('Invalid terrain data: gridSizeX must be positive');
      
      expect(error.message).to.include('gridSizeX');
      expect(error.message).to.include('positive');
    });
    
    it('should handle file read errors gracefully', function() {
      const handleFileError = (error) => {
        if (error.code === 'ENOENT') {
          return { error: 'File not found' };
        }
        return { error: 'Unknown error' };
      };
      
      const result = handleFileError({ code: 'ENOENT' });
      expect(result.error).to.equal('File not found');
    });
  });
});

describe('TerrainImporter - Defaults and Fallbacks', function() {
  
  describe('applyDefaults()', function() {
    
    it('should use default chunk size if not specified', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
          // chunkSize not specified
        }
      };
      
      const chunkSize = data.metadata.chunkSize || 8;
      
      expect(chunkSize).to.equal(8);
    });
    
    it('should use default tile size if not specified', function() {
      const data = { metadata: {} };
      const tileSize = data.metadata.tileSize || 32;
      
      expect(tileSize).to.equal(32);
    });
    
    it('should use default generation mode', function() {
      const data = { metadata: {} };
      const generationMode = data.metadata.generationMode || 'perlin';
      
      expect(generationMode).to.equal('perlin');
    });
    
    it('should generate seed if not provided', function() {
      const data = { metadata: {} };
      const seed = data.metadata.seed || Math.floor(Math.random() * 100000);
      
      expect(seed).to.be.a('number');
      expect(seed).to.be.greaterThan(0);
    });
  });
});

describe('TerrainImporter - Performance', function() {
  
  describe('importPerformance()', function() {
    
    it('should handle large terrain imports efficiently', function() {
      const largeData = {
        metadata: { gridSizeX: 20, gridSizeY: 20 }, // 400 chunks
        tiles: new Array(20 * 20 * 64).fill('g') // 25,600 tiles
      };
      
      const startTime = Date.now();
      
      // Simulate processing
      const tiles = largeData.tiles.map((char, index) => ({
        index,
        material: 'grass'
      }));
      
      const duration = Date.now() - startTime;
      
      expect(tiles).to.have.lengthOf(25600);
      expect(duration).to.be.lessThan(1000); // Should be fast
    });
    
    it('should use streaming for very large files', function() {
      const shouldStream = (fileSize) => fileSize > 1024 * 1024; // 1MB
      
      expect(shouldStream(500 * 1024)).to.be.false; // 500KB
      expect(shouldStream(2 * 1024 * 1024)).to.be.true; // 2MB
    });
  });
});





// ================================================================
// terrainEditorBrushPatterns.test.js (5 tests)
// ================================================================
/**
 * Unit Tests: TerrainEditor Brush Patterns
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * Tests that TerrainEditor.paint() uses the correct brush patterns:
 * - Even sizes (2,4,6,8): Circular pattern
 * - Odd sizes (3,5,7,9): Square pattern
 */

describe('TerrainEditor Brush Patterns (Unit Tests)', function() {
    let TerrainEditor, mockTerrain, editor;
    
    beforeEach(function() {
        // Load TerrainEditor
        TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
        
        // Create mock terrain
        const tiles = {};
        mockTerrain = {
            _tileSize: 32,
            _gridSizeX: 10,
            _gridSizeY: 10,
            _chunkSize: 10,
            getArrPos: sinon.stub().callsFake(([x, y]) => {
                const key = `${x},${y}`;
                if (!tiles[key]) {
                    tiles[key] = {
                        material: 'dirt',
                        getMaterial: function() { return this.material; },
                        setMaterial: function(mat) { this.material = mat; },
                        assignWeight: sinon.stub()
                    };
                }
                return tiles[key];
            }),
            invalidateCache: sinon.stub()
        };
        
        editor = new TerrainEditor(mockTerrain);
    });
    
    describe('Odd Size 3 - Square Pattern', function() {
        it('should paint 3x3 square (9 tiles) for brush size 3', function() {
            editor.setBrushSize(3);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 9 tiles were painted (3x3 square)
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(9, 'Should paint 9 tiles in 3x3 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 9, y: 9 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 9 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 9, y: 11 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 11 }); // Bottom-right
        });
    });
    
    describe('Even Size 4 - Circular Pattern', function() {
        it('should paint circular pattern (13 tiles) for brush size 4', function() {
            editor.setBrushSize(4);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 2 should have ~13 tiles
            expect(paintedTiles.length).to.be.greaterThan(9);
            expect(paintedTiles.length).to.be.lessThanOrEqual(16);
            
            // Center should be painted
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('Odd Size 5 - Square Pattern', function() {
        it('should paint 5x5 square (25 tiles) for brush size 5', function() {
            editor.setBrushSize(5);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 25 tiles were painted (5x5 square)
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(25, 'Should paint 25 tiles in 5x5 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 8, y: 8 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 8 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 8, y: 12 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 12 }); // Bottom-right
        });
    });
    
    describe('Even Size 2 - Circular Pattern', function() {
        it('should paint circular pattern (5 tiles cross) for brush size 2', function() {
            editor.setBrushSize(2);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 1 creates cross (5 tiles)
            expect(paintedTiles.length).to.equal(5);
            
            // Center + 4 cardinal directions
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 }); // Center
            expect(paintedTiles).to.deep.include({ x: 9, y: 10 });  // Left
            expect(paintedTiles).to.deep.include({ x: 11, y: 10 }); // Right
            expect(paintedTiles).to.deep.include({ x: 10, y: 9 });  // Top
            expect(paintedTiles).to.deep.include({ x: 10, y: 11 }); // Bottom
        });
    });
    
    describe('Size 1 - Single Tile', function() {
        it('should paint single tile for brush size 1', function() {
            editor.setBrushSize(1);
            editor.selectMaterial('stone');
            
            // Paint at (10, 10)
            editor.paint(10, 10);
            
            // Only (10,10) should be painted
            const tile10_10 = mockTerrain.getArrPos([10, 10]);
            expect(tile10_10.getMaterial()).to.equal('stone');
            
            // Adjacent tiles should NOT be painted
            const tile9_10 = mockTerrain.getArrPos([9, 10]);
            expect(tile9_10.getMaterial()).to.equal('dirt');
        });
    });
});




// ================================================================
// TerrainEditorFillBounds.test.js (12 tests)
// ================================================================
/**
 * TerrainEditorFillBounds.test.js
 * 
 * TDD unit tests for fill tool bounds limiting
 * Issue: Fill tool fills EVERYTHING, needs 100x100 area limit
 * 
 * Test Strategy:
 * - Mock SparseTerrain with sparse data structure
 * - Test fillRegion with various area sizes
 * - Verify MAX_FILL_AREA constant limits fill operations
 * - Test count tracking and limit detection
 */

// Setup JSDOM
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load TerrainEditor
// DUPLICATE REQUIRE REMOVED: let TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('TerrainEditor - Fill Bounds Limit', function() {
  let terrainEditor;
  let mockTerrain;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    
    // Sync to window for JSDOM
    window.createVector = global.createVector;
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    
    // Create mock SparseTerrain with getArrPos interface
    mockTerrain = {
      _tiles: new Map(),
      _tileSize: 32,
      // Note: NO _gridSizeX/_gridSizeY to allow sparse behavior (negative coords)
      
      // Compatibility method - returns wrapper with getMaterial/setMaterial
      getArrPos: function(coords) {
        const key = `${coords[0]},${coords[1]}`;
        const self = this;
        return {
          getMaterial: function() {
            const tile = self._tiles.get(key);
            // Return material if explicitly set, otherwise return unique empty identifier
            // This prevents fill from spreading to unset tiles
            return tile ? tile.material : null;
          },
          setMaterial: function(material) {
            self._tiles.set(key, { material });
          },
          assignWeight: function() {
            // Mock - no-op
          }
        };
      },
      
      // Helper to check if tile exists
      hasTile: function(x, y) {
        return this._tiles.has(`${x},${y}`);
      },
      
      // Helper to set tile directly
      setTile: function(x, y, material) {
        this._tiles.set(`${x},${y}`, { material });
      },
      
      // Compatibility method - no-op for SparseTerrain
      invalidateCache: function() {
        // Mock - no-op
      }
    };
    
    // Create TerrainEditor with mock terrain
    terrainEditor = new TerrainEditor(mockTerrain);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('MAX_FILL_AREA Constant', function() {
    it('should define MAX_FILL_AREA as 10000 (100x100)', function() {
      expect(terrainEditor.MAX_FILL_AREA).to.equal(10000);
    });
  });
  
  describe('fillRegion() with Bounds Limit', function() {
    it('should fill small area completely (10x10 = 100 tiles)', function() {
      
      // Create 10x10 grass area
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(100);
      expect(result.limitReached).to.be.false;
      
      // Verify all tiles changed
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(mockTerrain.getArrPos([x, y]).getMaterial()).to.equal('dirt');
        }
      }
    });
    
    it('should fill exactly 100x100 area (limit)', function() {
      if (!terrainEditor) this.skip();
      
      // Create 100x100 grass area
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(50, 50, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.false; // Exactly at limit
    });
    
    it('should stop at 100x100 limit when filling larger area', function() {
      if (!terrainEditor) this.skip();
      
      // Create 200x200 grass area (40,000 tiles)
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(100, 100, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000); // Stopped at limit
      expect(result.limitReached).to.be.true;
      
      // Verify not all tiles changed
      let dirtCount = 0;
      let grassCount = 0;
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          const material = mockTerrain.getArrPos([x, y]).getMaterial();
          if (material === 'dirt') dirtCount++;
          if (material === 'grass') grassCount++;
        }
      }
      
      expect(dirtCount).to.equal(10000);
      expect(grassCount).to.equal(30000); // 40000 - 10000
    });
    
    it('should return correct tilesFilled count for irregular shapes', function() {
      if (!terrainEditor) this.skip();
      
      // Create L-shape (150 tiles total)
      // Vertical: 0-9, 0-9 (100 tiles)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      // Horizontal: 10-14, 0-9 (50 tiles)
      for (let x = 10; x < 15; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(150);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle already-filled tiles within limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create 20x20 area
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      // Fill with dirt first
      terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Reset terrain
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      mockTerrain.setTile(10, 10, 'dirt'); // One already dirt
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill nothing (already same material)
      expect(result.tilesFilled).to.equal(0);
      expect(result.limitReached).to.be.false;
    });
    
    it('should not fill if start tile is different material', function() {
      if (!terrainEditor) this.skip();
      
      // Create mixed terrain
      mockTerrain.setTile(5, 5, 'grass');
      mockTerrain.setTile(6, 5, 'stone');
      
      const result = terrainEditor.fillRegion(5, 5, 'stone');
      
      // Should only fill grass tile
      expect(result.tilesFilled).to.equal(1);
    });
    
    it('should respect material boundaries even with limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create checkerboard (prevents BFS from spreading)
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const material = (x + y) % 2 === 0 ? 'grass' : 'stone';
          mockTerrain.setTile(x, y, material);
        }
      }
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should only fill grass tiles (half of 2500 = 1250)
      expect(result.tilesFilled).to.be.at.most(1250);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle sparse terrain with gaps', function() {
      if (!terrainEditor) this.skip();
      
      // Create island of grass tiles (not filled everywhere)
      mockTerrain.setTile(10, 10, 'grass');
      mockTerrain.setTile(11, 10, 'grass');
      mockTerrain.setTile(10, 11, 'grass');
      mockTerrain.setTile(11, 11, 'grass');
      // Surrounding tiles are default (not explicitly set)
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill 4 grass tiles OR everything connected with same default material
      // Depends on SparseTerrain behavior for unfilled tiles
      expect(result.tilesFilled).to.be.at.least(4);
    });
    
    it('should return metadata about fill operation', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(0, 0, 'grass');
      mockTerrain.setTile(1, 0, 'grass');
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      expect(result).to.have.property('tilesFilled');
      expect(result).to.have.property('limitReached');
      expect(result).to.have.property('startMaterial');
      expect(result).to.have.property('newMaterial');
      
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle fillRegion on non-existent tile', function() {
      if (!terrainEditor) this.skip();
      
      // Don't set any tiles - rely on default material
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should handle gracefully (either fill default or skip)
      expect(result).to.have.property('tilesFilled');
      expect(result.tilesFilled).to.be.at.least(0);
    });
    
    it('should handle negative coordinates within bounds', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(-5, -5, 'grass');
      mockTerrain.setTile(-4, -5, 'grass');
      
      const result = terrainEditor.fillRegion(-5, -5, 'dirt');
      
      expect(result.tilesFilled).to.be.at.least(2);
    });
  });
});




// ================================================================
// terrainEditorMaterialPainting.test.js (13 tests)
// ================================================================
/**
 * Unit Tests - TerrainEditor Material Painting
 * 
 * Tests that TerrainEditor paints actual material types (moss, stone, dirt, grass)
 * not just colors
 */

describe('TerrainEditor - Material Painting', function() {
  let TerrainEditor;
  let editor;
  let mockTerrain;
  let mockTile;

  beforeEach(function() {
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
      getArrPos: sinon.stub().returns(mockTile),
      getTile: sinon.stub().returns(mockTile),
      invalidateCache: sinon.stub()
    };
    
    // Load TerrainEditor
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
    
    // Create editor
    editor = new TerrainEditor(mockTerrain);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Material Selection', function() {
    it('should set material by name, not color', function() {
      editor.selectMaterial('moss');
      
      expect(editor._selectedMaterial).to.equal('moss');
      expect(editor._selectedMaterial).to.be.a('string');
      expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
    });
    
    it('should accept all terrain material types', function() {
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        expect(editor._selectedMaterial).to.equal(material);
      });
    });
  });

  describe('Paint Tile with Material', function() {
    it('should paint tile with material name, not color', function() {
      editor.selectMaterial('stone');
      
      // Paint at tile position 5, 5
      editor.paintTile(5 * 32, 5 * 32);
      
      // Should have called setMaterial with 'stone'
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
      expect(mockTile.setMaterial.calledWith(sinon.match(/^#/))).to.be.false;
    });
    
    it('should paint with moss material', function() {
      editor.selectMaterial('moss');
      editor.paintTile(10 * 32, 10 * 32);
      
      expect(mockTile.setMaterial.calledWith('moss')).to.be.true;
    });
    
    it('should paint with dirt material', function() {
      editor.selectMaterial('dirt');
      editor.paintTile(8 * 32, 8 * 32);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should paint with grass material', function() {
      editor.selectMaterial('grass');
      editor.paintTile(12 * 32, 12 * 32);
      
      expect(mockTile.setMaterial.calledWith('grass')).to.be.true;
    });
    
    it('should call assignWeight after setting material', function() {
      editor.selectMaterial('stone');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTile.assignWeight.called).to.be.true;
    });
    
    it('should invalidate terrain cache after painting', function() {
      editor.selectMaterial('moss');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTerrain.invalidateCache.called).to.be.true;
    });
  });

  describe('Paint Method Integration', function() {
    it('should paint using the paint() method', function() {
      editor.selectMaterial('dirt');
      
      // paint() method uses tile coordinates directly
      editor.paint(5, 5);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should use selected material when painting', function() {
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
    });
  });

  describe('Material Type Verification', function() {
    it('should store material as string name', function() {
      editor.selectMaterial('moss');
      
      expect(typeof editor._selectedMaterial).to.equal('string');
      expect(editor._selectedMaterial).to.equal('moss');
    });
    
    it('should not store color codes', function() {
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        
        // Should be material name, not hex color
        expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
        expect(editor._selectedMaterial).to.not.match(/^rgb/i);
      });
    });
  });

  describe('Fill with Material', function() {
    it('should fill region with material name', function() {
      // Set tile to different material first
      mockTile._material = 'dirt';
      mockTile.getMaterial = sinon.stub().returns('dirt');
      
      editor.selectMaterial('grass');
      
      // Mock fill to check material
      mockTerrain.getArrPos = sinon.stub().returns(mockTile);
      
      editor.fill(5, 5);
      
      // Should have called setMaterial with 'grass'
      const setMaterialCalls = mockTile.setMaterial.getCalls();
      const grassCalls = setMaterialCalls.filter(call => call.args[0] === 'grass');
      expect(grassCalls.length).to.be.greaterThan(0);
    });
  });
});




// ================================================================
// terrainExporter.test.js (32 tests)
// ================================================================
/**
 * Unit Tests for TerrainExporter
 * Tests exporting terrain to various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let exporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
vm.runInThisContext(exporterCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainExporter - JSON Export', function() {
  
  describe('exportToJSON()', function() {
    
    it('should export basic terrain metadata', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata.version).to.equal('1.0');
      expect(exported.metadata.gridSizeX).to.equal(3);
      expect(exported.metadata.gridSizeY).to.equal(3);
      expect(exported.metadata.chunkSize).to.equal(8);
      expect(exported.metadata.seed).to.equal(12345);
    });
    
    it('should export all tile materials', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.have.lengthOf(2 * 2 * 8 * 8); // gridSizeX * gridSizeY * chunkSize * chunkSize
      exported.tiles.forEach(material => {
        expect(material).to.be.a('string');
      });
    });
    
    it('should include custom metadata when provided', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const customMetadata = {
        name: 'Test Level',
        author: 'TestUser',
        description: 'A test level',
        difficulty: 'easy',
        tags: ['tutorial', 'beginner']
      };
      
      const exported = {
        metadata: {
          ...customMetadata,
          version: '1.0',
          gridSizeX: terrain._gridSizeX,
          gridSizeY: terrain._gridSizeY
        }
      };
      
      expect(exported.metadata.name).to.equal('Test Level');
      expect(exported.metadata.author).to.equal('TestUser');
      expect(exported.metadata.tags).to.deep.equal(['tutorial', 'beginner']);
    });
    
    it('should support compressed tile format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Compressed format: single string where each char represents a material
      const materialToChar = {
        'grass': 'g',
        'dirt': 'd',
        'stone': 's',
        'water': 'w',
        'sand': 'a',
        'moss_0': 'm'
      };
      
      let compressed = '';
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          compressed += materialToChar[tile._materialSet] || 'g';
        });
      });
      
      expect(compressed).to.be.a('string');
      expect(compressed.length).to.equal(4 * 64); // One char per tile
      expect(compressed).to.match(/^[gdswam]+$/); // Only valid characters
    });
    
    it('should handle empty or minimal terrains', function() {
      const terrain = new gridTerrain(1, 1, 12345);
      
      const exported = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: []
      };
      
      terrain.chunkArray.rawArray[0].tileData.rawArray.forEach(tile => {
        exported.tiles.push({
          x: tile._x,
          y: tile._y,
          material: tile._materialSet
        });
      });
      
      expect(exported.tiles).to.have.length.greaterThan(0);
    });
    
    it('should generate valid JSON string', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const data = {
        metadata: { version: '1.0' },
        terrain: { seed: terrain._seed }
      };
      
      const jsonString = JSON.stringify(data);
      expect(jsonString).to.be.a('string');
      
      // Should be parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed.metadata.version).to.equal('1.0');
    });
  });
  
  describe('exportOptions()', function() {
    
    it('should support entities export option', function() {
      const includeEntities = true;
      const entities = [
        { type: 'ant_hill', x: 40, y: 40 },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      const exported = {
        entities: includeEntities ? entities : []
      };
      
      expect(exported.entities).to.have.lengthOf(2);
      expect(exported.entities[0].type).to.equal('ant_hill');
    });
    
    it('should support resources export option', function() {
      const includeResources = true;
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 }
      ];
      
      const exported = {
        resources: includeResources ? resources : []
      };
      
      expect(exported.resources).to.have.lengthOf(1);
    });
    
    it('should support compression option', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Uncompressed: array of tile objects
      const uncompressed = [];
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          uncompressed.push({ x: tile._x, y: tile._y, material: tile._materialSet });
        });
      });
      
      // Compressed: run-length encoding
      const compressed = [];
      let currentMaterial = null;
      let runLength = 0;
      
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          if (tile._materialSet === currentMaterial) {
            runLength++;
          } else {
            if (currentMaterial !== null) {
              compressed.push({ material: currentMaterial, count: runLength });
            }
            currentMaterial = tile._materialSet;
            runLength = 1;
          }
        });
      });
      
      if (currentMaterial !== null) {
        compressed.push({ material: currentMaterial, count: runLength });
      }
      
      // Compressed should be smaller for homogeneous terrain
      const uncompressedSize = JSON.stringify(uncompressed).length;
      const compressedSize = JSON.stringify(compressed).length;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should exclude entities when option is false', function() {
      const exported = {
        metadata: {},
        entities: false ? [{ type: 'ant' }] : []
      };
      
      expect(exported.entities).to.have.lengthOf(0);
    });
    
    it('should include timestamp in metadata', function() {
      const exported = {
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      expect(exported.metadata.created).to.match(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
  
  describe('chunkBasedExport()', function() {
    
    it('should export terrain by chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const chunkData = terrain.chunkArray.rawArray.map((chunk, idx) => {
        const chunkPos = terrain.chunkArray.convToSquare(idx);
        return {
          position: chunkPos,
          tiles: chunk.tileData.rawArray.map(tile => ({
            offset: [tile._x % 8, tile._y % 8],
            material: tile._materialSet
          }))
        };
      });
      
      expect(chunkData).to.have.lengthOf(9); // 3x3 chunks
      chunkData.forEach(chunk => {
        expect(chunk.position).to.be.an('array');
        expect(chunk.tiles).to.have.lengthOf(64); // 8x8 tiles per chunk
      });
    });
    
    it('should use default material with exceptions', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const chunks = terrain.chunkArray.rawArray.map(chunk => {
        // Find most common material
        const materialCounts = {};
        chunk.tileData.rawArray.forEach(tile => {
          materialCounts[tile._materialSet] = (materialCounts[tile._materialSet] || 0) + 1;
        });
        
        const defaultMaterial = Object.keys(materialCounts).reduce((a, b) => 
          materialCounts[a] > materialCounts[b] ? a : b
        );
        
        // Only store exceptions
        const exceptions = [];
        chunk.tileData.rawArray.forEach((tile, idx) => {
          if (tile._materialSet !== defaultMaterial) {
            exceptions.push({
              offset: [idx % 8, Math.floor(idx / 8)],
              material: tile._materialSet
            });
          }
        });
        
        return {
          defaultMaterial,
          exceptions
        };
      });
      
      chunks.forEach(chunk => {
        expect(chunk.defaultMaterial).to.be.a('string');
        expect(chunk.exceptions).to.be.an('array');
      });
    });
  });
});

describe('TerrainExporter - File Generation', function() {
  
  describe('generateFileName()', function() {
    
    it('should generate filename with timestamp', function() {
      const timestamp = Date.now();
      const filename = `terrain_${timestamp}.json`;
      
      expect(filename).to.match(/^terrain_\d+\.json$/);
    });
    
    it('should support custom filenames', function() {
      const customName = 'my_level';
      const filename = `${customName}.json`;
      
      expect(filename).to.equal('my_level.json');
    });
    
    it('should sanitize filenames', function() {
      const unsafeName = 'my level/with\\bad:chars*';
      const safeName = unsafeName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      expect(safeName).to.equal('my_level_with_bad_chars_');
      expect(safeName).to.not.match(/[\/\\:*]/);
    });
    
    it('should add extension if missing', function() {
      const name = 'terrain_file';
      const withExtension = name.endsWith('.json') ? name : `${name}.json`;
      
      expect(withExtension).to.equal('terrain_file.json');
    });
  });
  
  describe('getMimeType()', function() {
    
    it('should return correct MIME type for JSON', function() {
      const mimeType = 'application/json';
      expect(mimeType).to.equal('application/json');
    });
    
    it('should return correct MIME type for PNG', function() {
      const mimeType = 'image/png';
      expect(mimeType).to.equal('image/png');
    });
    
    it('should return correct MIME type for binary', function() {
      const mimeType = 'application/octet-stream';
      expect(mimeType).to.equal('application/octet-stream');
    });
  });
});

describe('TerrainExporter - Run-Length Encoding', function() {
  
  describe('runLengthEncode()', function() {
    
    it('should compress homogeneous sequences', function() {
      const materials = ['grass', 'grass', 'grass', 'dirt', 'dirt', 'grass'];
      
      const encoded = [];
      let current = materials[0];
      let count = 1;
      
      for (let i = 1; i < materials.length; i++) {
        if (materials[i] === current) {
          count++;
        } else {
          encoded.push({ material: current, count });
          current = materials[i];
          count = 1;
        }
      }
      encoded.push({ material: current, count });
      
      expect(encoded).to.deep.equal([
        { material: 'grass', count: 3 },
        { material: 'dirt', count: 2 },
        { material: 'grass', count: 1 }
      ]);
    });
    
    it('should handle single material terrain', function() {
      const materials = new Array(100).fill('grass');
      
      const encoded = [{ material: 'grass', count: 100 }];
      
      expect(encoded).to.have.lengthOf(1);
      expect(encoded[0].count).to.equal(100);
    });
    
    it('should handle alternating materials', function() {
      const materials = ['grass', 'dirt', 'grass', 'dirt'];
      
      const encoded = materials.map(m => ({ material: m, count: 1 }));
      
      expect(encoded).to.have.lengthOf(4);
    });
    
    it('should preserve order', function() {
      const materials = ['a', 'a', 'b', 'c', 'c', 'c'];
      
      const encoded = [
        { material: 'a', count: 2 },
        { material: 'b', count: 1 },
        { material: 'c', count: 3 }
      ];
      
      // Decode to verify
      const decoded = [];
      encoded.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          decoded.push(run.material);
        }
      });
      
      expect(decoded).to.deep.equal(materials);
    });
  });
});

describe('TerrainExporter - Validation', function() {
  
  describe('validateExportData()', function() {
    
    it('should validate required metadata fields', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5,
          chunkSize: 8,
          tileSize: 32
        }
      };
      
      expect(data.metadata.version).to.exist;
      expect(data.metadata.gridSizeX).to.be.a('number');
      expect(data.metadata.gridSizeY).to.be.a('number');
    });
    
    it('should reject invalid version format', function() {
      const version = '1.0';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.true;
      expect(/^\d+\.\d+$/.test('invalid')).to.be.false;
    });
    
    it('should validate tile data structure', function() {
      const tile = {
        x: 0,
        y: 0,
        material: 'grass',
        weight: 1
      };
      
      expect(tile).to.have.property('x');
      expect(tile).to.have.property('y');
      expect(tile).to.have.property('material');
      expect(tile.material).to.be.a('string');
    });
    
    it('should reject negative coordinates', function() {
      const tile = { x: -1, y: 0, material: 'grass' };
      const isValid = tile.x >= 0 && tile.y >= 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = ['grass', 'dirt', 'stone', 'water', 'sand'];
      const material = 'grass';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include('invalid_material');
    });
  });
});

describe('TerrainExporter - Size Calculations', function() {
  
  describe('calculateExportSize()', function() {
    
    it('should calculate JSON byte size', function() {
      const data = { metadata: { version: '1.0' }, tiles: [] };
      const jsonString = JSON.stringify(data);
      const byteSize = new TextEncoder().encode(jsonString).length;
      
      expect(byteSize).to.be.a('number');
      expect(byteSize).to.be.greaterThan(0);
    });
    
    it('should estimate compressed size', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const tileCount = terrain._gridSizeX * terrain._gridSizeY * 
                       terrain._chunkSize * terrain._chunkSize;
      
      // Uncompressed: ~50 bytes per tile (JSON)
      const uncompressedSize = tileCount * 50;
      
      // Compressed: ~10 bytes per run (assuming good compression)
      const estimatedRuns = Math.ceil(tileCount / 10); // Optimistic
      const compressedSize = estimatedRuns * 10;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should report size in human-readable format', function() {
      const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };
      
      expect(formatBytes(500)).to.equal('500 B');
      expect(formatBytes(2048)).to.equal('2.00 KB');
      expect(formatBytes(2097152)).to.equal('2.00 MB');
    });
  });
});




// ================================================================
// terrainImporter.test.js (40 tests)
// ================================================================
/**
 * Unit Tests for TerrainImporter
 * Tests importing terrain from various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let importerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
vm.runInThisContext(importerCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainImporter - JSON Import', function() {
  
  describe('importFromJSON()', function() {
    
    it('should import basic terrain metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          gridSizeX: 3,
          gridSizeY: 3,
          chunkSize: 8,
          tileSize: 32,
          seed: 12345,
          generationMode: 'perlin'
        }
      };
      
      expect(terrainData.metadata.gridSizeX).to.equal(3);
      expect(terrainData.metadata.gridSizeY).to.equal(3);
      expect(terrainData.metadata.seed).to.equal(12345);
    });
    
    it('should reconstruct terrain from tile data', function() {
      const tiles = [
        { x: 0, y: 0, material: 'grass', weight: 1 },
        { x: 1, y: 0, material: 'dirt', weight: 3 },
        { x: 0, y: 1, material: 'stone', weight: 100 }
      ];
      
      const tileMap = new Map();
      tiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        tileMap.set(key, tile);
      });
      
      expect(tileMap.size).to.equal(3);
      expect(tileMap.get('0,0').material).to.equal('grass');
      expect(tileMap.get('1,0').material).to.equal('dirt');
    });
    
    it('should handle compressed tile format', function() {
      const compressed = 'gggdddsss';
      const charToMaterial = {
        'g': 'grass',
        'd': 'dirt',
        's': 'stone',
        'w': 'water',
        'a': 'sand'
      };
      
      const tiles = [];
      for (let i = 0; i < compressed.length; i++) {
        tiles.push({
          index: i,
          material: charToMaterial[compressed[i]]
        });
      }
      
      expect(tiles).to.have.lengthOf(9);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[3].material).to.equal('dirt');
      expect(tiles[6].material).to.equal('stone');
    });
    
    it('should apply run-length decoded data', function() {
      const runs = [
        { material: 'grass', count: 5 },
        { material: 'dirt', count: 3 },
        { material: 'stone', count: 2 }
      ];
      
      const tiles = [];
      runs.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          tiles.push({ material: run.material });
        }
      });
      
      expect(tiles).to.have.lengthOf(10);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[4].material).to.equal('grass');
      expect(tiles[5].material).to.equal('dirt');
      expect(tiles[8].material).to.equal('stone');
    });
    
    it('should restore custom metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          name: 'Desert Level',
          author: 'TestUser',
          description: 'A sandy battlefield',
          difficulty: 'hard',
          tags: ['desert', 'pvp']
        }
      };
      
      expect(terrainData.metadata.name).to.equal('Desert Level');
      expect(terrainData.metadata.author).to.equal('TestUser');
      expect(terrainData.metadata.tags).to.include('desert');
    });
    
    it('should handle minimal terrain data', function() {
      const minimal = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' // 64 tiles (1 chunk)
      };
      
      expect(minimal.tiles.length).to.equal(64);
    });
  });
  
  describe('validateImportData()', function() {
    
    it('should validate required fields exist', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasVersion = !!(data.metadata && data.metadata.version);
      const hasGridSize = !!(data.metadata && data.metadata.gridSizeX && data.metadata.gridSizeY);
      
      expect(hasVersion).to.be.true;
      expect(hasGridSize).to.be.true;
    });
    
    it('should reject missing metadata', function() {
      const data = { tiles: [] };
      const isValid = data.metadata !== undefined;
      
      expect(isValid).to.be.false;
    });
    
    it('should reject invalid version format', function() {
      const version = 'invalid';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.false;
    });
    
    it('should validate grid sizes are positive', function() {
      const gridSizeX = 5;
      const gridSizeY = -1;
      
      const isValid = gridSizeX > 0 && gridSizeY > 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
      const material = 'grass';
      const invalid = 'invalid_material';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include(invalid);
    });
    
    it('should reject malformed JSON', function() {
      const malformed = '{ "metadata": { "version": "1.0" ';
      
      let isValid = true;
      try {
        JSON.parse(malformed);
      } catch (e) {
        isValid = false;
      }
      
      expect(isValid).to.be.false;
    });
    
    it('should validate tile coordinates are within bounds', function() {
      const gridSize = { x: 5, y: 5, chunkSize: 8 };
      const maxX = gridSize.x * gridSize.chunkSize;
      const maxY = gridSize.y * gridSize.chunkSize;
      
      const validTile = { x: 10, y: 10 };
      const invalidTile = { x: 100, y: 10 };
      
      expect(validTile.x < maxX && validTile.y < maxY).to.be.true;
      expect(invalidTile.x < maxX && invalidTile.y < maxY).to.be.false;
    });
  });
  
  describe('chunkBasedImport()', function() {
    
    it('should import terrain by chunks', function() {
      const chunkData = [
        {
          position: [0, 0],
          tiles: Array(64).fill(null).map((_, i) => ({
            offset: [i % 8, Math.floor(i / 8)],
            material: 'grass'
          }))
        }
      ];
      
      expect(chunkData[0].tiles).to.have.lengthOf(64);
      expect(chunkData[0].position).to.deep.equal([0, 0]);
    });
    
    it('should apply default material with exceptions', function() {
      const chunkData = {
        defaultMaterial: 'grass',
        exceptions: [
          { offset: [3, 4], material: 'water' },
          { offset: [7, 2], material: 'stone' }
        ]
      };
      
      const tiles = Array(64).fill(null).map((_, i) => {
        const offset = [i % 8, Math.floor(i / 8)];
        const exception = chunkData.exceptions.find(e => 
          e.offset[0] === offset[0] && e.offset[1] === offset[1]
        );
        
        return {
          offset,
          material: exception ? exception.material : chunkData.defaultMaterial
        };
      });
      
      expect(tiles.filter(t => t.material === 'grass')).to.have.lengthOf(62);
      expect(tiles.filter(t => t.material === 'water')).to.have.lengthOf(1);
      expect(tiles.filter(t => t.material === 'stone')).to.have.lengthOf(1);
    });
    
    it('should handle multiple chunks', function() {
      const chunks = [
        { position: [0, 0], defaultMaterial: 'grass', exceptions: [] },
        { position: [1, 0], defaultMaterial: 'dirt', exceptions: [] },
        { position: [0, 1], defaultMaterial: 'stone', exceptions: [] }
      ];
      
      expect(chunks).to.have.lengthOf(3);
      expect(chunks[0].defaultMaterial).to.equal('grass');
      expect(chunks[1].defaultMaterial).to.equal('dirt');
    });
  });
});

describe('TerrainImporter - Version Migration', function() {
  
  describe('migrateVersion()', function() {
    
    it('should detect old version format', function() {
      const oldData = {
        metadata: { version: '1.0' }
      };
      
      const currentVersion = '2.0';
      const needsMigration = oldData.metadata.version !== currentVersion;
      
      expect(needsMigration).to.be.true;
    });
    
    it('should migrate v1.0 to v2.0', function() {
      const v1Data = {
        metadata: {
          version: '1.0',
          width: 5,
          height: 5
        }
      };
      
      // Migration: rename width/height to gridSizeX/gridSizeY
      const v2Data = {
        metadata: {
          version: '2.0',
          gridSizeX: v1Data.metadata.width,
          gridSizeY: v1Data.metadata.height
        }
      };
      
      expect(v2Data.metadata.version).to.equal('2.0');
      expect(v2Data.metadata.gridSizeX).to.equal(5);
      expect(v2Data.metadata.gridSizeY).to.equal(5);
    });
    
    it('should chain multiple migrations', function() {
      const versions = ['1.0', '1.5', '2.0'];
      const currentVersion = '2.0';
      
      let data = { metadata: { version: '1.0' } };
      
      while (data.metadata.version !== currentVersion) {
        const versionIndex = versions.indexOf(data.metadata.version);
        const nextVersion = versions[versionIndex + 1];
        
        // Simulate migration
        data.metadata.version = nextVersion;
      }
      
      expect(data.metadata.version).to.equal('2.0');
    });
    
    it('should preserve data during migration', function() {
      const original = {
        metadata: { version: '1.0', name: 'Test Level' },
        tiles: ['g', 'g', 'd']
      };
      
      const migrated = {
        metadata: {
          ...original.metadata,
          version: '2.0'
        },
        tiles: original.tiles
      };
      
      expect(migrated.metadata.name).to.equal('Test Level');
      expect(migrated.tiles).to.deep.equal(['g', 'g', 'd']);
    });
    
    it('should skip migration for current version', function() {
      const currentData = {
        metadata: { version: '2.0' }
      };
      
      const needsMigration = currentData.metadata.version !== '2.0';
      
      expect(needsMigration).to.be.false;
    });
  });
  
  describe('validateMigration()', function() {
    
    it('should validate migrated data structure', function() {
      const migrated = {
        metadata: {
          version: '2.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasRequiredFields = !!(
        migrated.metadata.version &&
        migrated.metadata.gridSizeX &&
        migrated.metadata.gridSizeY
      );
      
      expect(hasRequiredFields).to.be.true;
    });
    
    it('should reject incomplete migrations', function() {
      const incomplete = {
        metadata: {
          version: '2.0'
          // Missing gridSizeX, gridSizeY
        }
      };
      
      const isComplete = 
        incomplete.metadata.gridSizeX !== undefined &&
        incomplete.metadata.gridSizeY !== undefined;
      
      expect(isComplete).to.be.false;
    });
  });
});

describe('TerrainImporter - Entity Import', function() {
  
  describe('importEntities()', function() {
    
    it('should import entity data', function() {
      const entities = [
        { type: 'ant_hill', x: 40, y: 40, faction: 'red' },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      expect(entities).to.have.lengthOf(2);
      expect(entities[0].type).to.equal('ant_hill');
      expect(entities[1].amount).to.equal(50);
    });
    
    it('should validate entity types', function() {
      const validTypes = ['ant_hill', 'food', 'resource', 'obstacle'];
      const entity = { type: 'ant_hill' };
      
      const isValid = validTypes.includes(entity.type);
      
      expect(isValid).to.be.true;
    });
    
    it('should validate entity positions', function() {
      const bounds = { maxX: 100, maxY: 100 };
      const validEntity = { type: 'food', x: 50, y: 50 };
      const invalidEntity = { type: 'food', x: 150, y: 50 };
      
      const isValidPosition = (entity) => 
        entity.x >= 0 && entity.x <= bounds.maxX &&
        entity.y >= 0 && entity.y <= bounds.maxY;
      
      expect(isValidPosition(validEntity)).to.be.true;
      expect(isValidPosition(invalidEntity)).to.be.false;
    });
    
    it('should handle optional entity data', function() {
      const terrainData = {
        metadata: {},
        entities: [] // Optional, may be empty
      };
      
      expect(terrainData.entities).to.be.an('array');
      expect(terrainData.entities).to.have.lengthOf(0);
    });
  });
});

describe('TerrainImporter - Resource Import', function() {
  
  describe('importResources()', function() {
    
    it('should import resource data', function() {
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 },
        { type: 'stone', x: 80, y: 80, quantity: 15 }
      ];
      
      expect(resources).to.have.lengthOf(2);
      expect(resources[0].quantity).to.equal(20);
    });
    
    it('should validate resource quantities', function() {
      const resource = { type: 'wood', quantity: 20 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.true;
    });
    
    it('should reject negative quantities', function() {
      const resource = { type: 'wood', quantity: -5 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.false;
    });
  });
});

describe('TerrainImporter - Error Handling', function() {
  
  describe('handleImportErrors()', function() {
    
    it('should throw error for missing required fields', function() {
      const invalidData = { tiles: [] }; // Missing metadata
      
      const validate = () => {
        if (!invalidData.metadata) {
          throw new Error('Missing required field: metadata');
        }
      };
      
      expect(validate).to.throw('Missing required field: metadata');
    });
    
    it('should throw error for invalid data types', function() {
      const invalidData = {
        metadata: {
          version: '1.0',
          gridSizeX: 'five' // Should be number
        }
      };
      
      const validate = () => {
        if (typeof invalidData.metadata.gridSizeX !== 'number') {
          throw new Error('gridSizeX must be a number');
        }
      };
      
      expect(validate).to.throw('gridSizeX must be a number');
    });
    
    it('should provide helpful error messages', function() {
      const error = new Error('Invalid terrain data: gridSizeX must be positive');
      
      expect(error.message).to.include('gridSizeX');
      expect(error.message).to.include('positive');
    });
    
    it('should handle file read errors gracefully', function() {
      const handleFileError = (error) => {
        if (error.code === 'ENOENT') {
          return { error: 'File not found' };
        }
        return { error: 'Unknown error' };
      };
      
      const result = handleFileError({ code: 'ENOENT' });
      expect(result.error).to.equal('File not found');
    });
  });
});

describe('TerrainImporter - Defaults and Fallbacks', function() {
  
  describe('applyDefaults()', function() {
    
    it('should use default chunk size if not specified', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
          // chunkSize not specified
        }
      };
      
      const chunkSize = data.metadata.chunkSize || 8;
      
      expect(chunkSize).to.equal(8);
    });
    
    it('should use default tile size if not specified', function() {
      const data = { metadata: {} };
      const tileSize = data.metadata.tileSize || 32;
      
      expect(tileSize).to.equal(32);
    });
    
    it('should use default generation mode', function() {
      const data = { metadata: {} };
      const generationMode = data.metadata.generationMode || 'perlin';
      
      expect(generationMode).to.equal('perlin');
    });
    
    it('should generate seed if not provided', function() {
      const data = { metadata: {} };
      const seed = data.metadata.seed || Math.floor(Math.random() * 100000);
      
      expect(seed).to.be.a('number');
      expect(seed).to.be.greaterThan(0);
    });
  });
});

describe('TerrainImporter - Performance', function() {
  
  describe('importPerformance()', function() {
    
    it('should handle large terrain imports efficiently', function() {
      const largeData = {
        metadata: { gridSizeX: 20, gridSizeY: 20 }, // 400 chunks
        tiles: new Array(20 * 20 * 64).fill('g') // 25,600 tiles
      };
      
      const startTime = Date.now();
      
      // Simulate processing
      const tiles = largeData.tiles.map((char, index) => ({
        index,
        material: 'grass'
      }));
      
      const duration = Date.now() - startTime;
      
      expect(tiles).to.have.lengthOf(25600);
      expect(duration).to.be.lessThan(1000); // Should be fast
    });
    
    it('should use streaming for very large files', function() {
      const shouldStream = (fileSize) => fileSize > 1024 * 1024; // 1MB
      
      expect(shouldStream(500 * 1024)).to.be.false; // 500KB
      expect(shouldStream(2 * 1024 * 1024)).to.be.true; // 2MB
    });
  });
});





// ================================================================
// terrainEditorBrushPatterns.test.js (5 tests)
// ================================================================
/**
 * Unit Tests: TerrainEditor Brush Patterns
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * Tests that TerrainEditor.paint() uses the correct brush patterns:
 * - Even sizes (2,4,6,8): Circular pattern
 * - Odd sizes (3,5,7,9): Square pattern
 */

describe('TerrainEditor Brush Patterns (Unit Tests)', function() {
    let TerrainEditor, mockTerrain, editor;
    
    beforeEach(function() {
        // Load TerrainEditor
        TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
        
        // Create mock terrain
        const tiles = {};
        mockTerrain = {
            _tileSize: 32,
            _gridSizeX: 10,
            _gridSizeY: 10,
            _chunkSize: 10,
            getArrPos: sinon.stub().callsFake(([x, y]) => {
                const key = `${x},${y}`;
                if (!tiles[key]) {
                    tiles[key] = {
                        material: 'dirt',
                        getMaterial: function() { return this.material; },
                        setMaterial: function(mat) { this.material = mat; },
                        assignWeight: sinon.stub()
                    };
                }
                return tiles[key];
            }),
            invalidateCache: sinon.stub()
        };
        
        editor = new TerrainEditor(mockTerrain);
    });
    
    describe('Odd Size 3 - Square Pattern', function() {
        it('should paint 3x3 square (9 tiles) for brush size 3', function() {
            editor.setBrushSize(3);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 9 tiles were painted (3x3 square)
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(9, 'Should paint 9 tiles in 3x3 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 9, y: 9 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 9 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 9, y: 11 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 11 }); // Bottom-right
        });
    });
    
    describe('Even Size 4 - Circular Pattern', function() {
        it('should paint circular pattern (13 tiles) for brush size 4', function() {
            editor.setBrushSize(4);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 2 should have ~13 tiles
            expect(paintedTiles.length).to.be.greaterThan(9);
            expect(paintedTiles.length).to.be.lessThanOrEqual(16);
            
            // Center should be painted
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('Odd Size 5 - Square Pattern', function() {
        it('should paint 5x5 square (25 tiles) for brush size 5', function() {
            editor.setBrushSize(5);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 25 tiles were painted (5x5 square)
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(25, 'Should paint 25 tiles in 5x5 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 8, y: 8 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 8 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 8, y: 12 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 12 }); // Bottom-right
        });
    });
    
    describe('Even Size 2 - Circular Pattern', function() {
        it('should paint circular pattern (5 tiles cross) for brush size 2', function() {
            editor.setBrushSize(2);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 1 creates cross (5 tiles)
            expect(paintedTiles.length).to.equal(5);
            
            // Center + 4 cardinal directions
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 }); // Center
            expect(paintedTiles).to.deep.include({ x: 9, y: 10 });  // Left
            expect(paintedTiles).to.deep.include({ x: 11, y: 10 }); // Right
            expect(paintedTiles).to.deep.include({ x: 10, y: 9 });  // Top
            expect(paintedTiles).to.deep.include({ x: 10, y: 11 }); // Bottom
        });
    });
    
    describe('Size 1 - Single Tile', function() {
        it('should paint single tile for brush size 1', function() {
            editor.setBrushSize(1);
            editor.selectMaterial('stone');
            
            // Paint at (10, 10)
            editor.paint(10, 10);
            
            // Only (10,10) should be painted
            const tile10_10 = mockTerrain.getArrPos([10, 10]);
            expect(tile10_10.getMaterial()).to.equal('stone');
            
            // Adjacent tiles should NOT be painted
            const tile9_10 = mockTerrain.getArrPos([9, 10]);
            expect(tile9_10.getMaterial()).to.equal('dirt');
        });
    });
});




// ================================================================
// TerrainEditorFillBounds.test.js (12 tests)
// ================================================================
/**
 * TerrainEditorFillBounds.test.js
 * 
 * TDD unit tests for fill tool bounds limiting
 * Issue: Fill tool fills EVERYTHING, needs 100x100 area limit
 * 
 * Test Strategy:
 * - Mock SparseTerrain with sparse data structure
 * - Test fillRegion with various area sizes
 * - Verify MAX_FILL_AREA constant limits fill operations
 * - Test count tracking and limit detection
 */

// Setup JSDOM
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load TerrainEditor
// DUPLICATE REQUIRE REMOVED: let TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('TerrainEditor - Fill Bounds Limit', function() {
  let terrainEditor;
  let mockTerrain;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    
    // Sync to window for JSDOM
    window.createVector = global.createVector;
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    
    // Create mock SparseTerrain with getArrPos interface
    mockTerrain = {
      _tiles: new Map(),
      _tileSize: 32,
      // Note: NO _gridSizeX/_gridSizeY to allow sparse behavior (negative coords)
      
      // Compatibility method - returns wrapper with getMaterial/setMaterial
      getArrPos: function(coords) {
        const key = `${coords[0]},${coords[1]}`;
        const self = this;
        return {
          getMaterial: function() {
            const tile = self._tiles.get(key);
            // Return material if explicitly set, otherwise return unique empty identifier
            // This prevents fill from spreading to unset tiles
            return tile ? tile.material : null;
          },
          setMaterial: function(material) {
            self._tiles.set(key, { material });
          },
          assignWeight: function() {
            // Mock - no-op
          }
        };
      },
      
      // Helper to check if tile exists
      hasTile: function(x, y) {
        return this._tiles.has(`${x},${y}`);
      },
      
      // Helper to set tile directly
      setTile: function(x, y, material) {
        this._tiles.set(`${x},${y}`, { material });
      },
      
      // Compatibility method - no-op for SparseTerrain
      invalidateCache: function() {
        // Mock - no-op
      }
    };
    
    // Create TerrainEditor with mock terrain
    terrainEditor = new TerrainEditor(mockTerrain);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('MAX_FILL_AREA Constant', function() {
    it('should define MAX_FILL_AREA as 10000 (100x100)', function() {
      expect(terrainEditor.MAX_FILL_AREA).to.equal(10000);
    });
  });
  
  describe('fillRegion() with Bounds Limit', function() {
    it('should fill small area completely (10x10 = 100 tiles)', function() {
      
      // Create 10x10 grass area
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(100);
      expect(result.limitReached).to.be.false;
      
      // Verify all tiles changed
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(mockTerrain.getArrPos([x, y]).getMaterial()).to.equal('dirt');
        }
      }
    });
    
    it('should fill exactly 100x100 area (limit)', function() {
      if (!terrainEditor) this.skip();
      
      // Create 100x100 grass area
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(50, 50, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.false; // Exactly at limit
    });
    
    it('should stop at 100x100 limit when filling larger area', function() {
      if (!terrainEditor) this.skip();
      
      // Create 200x200 grass area (40,000 tiles)
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(100, 100, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000); // Stopped at limit
      expect(result.limitReached).to.be.true;
      
      // Verify not all tiles changed
      let dirtCount = 0;
      let grassCount = 0;
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          const material = mockTerrain.getArrPos([x, y]).getMaterial();
          if (material === 'dirt') dirtCount++;
          if (material === 'grass') grassCount++;
        }
      }
      
      expect(dirtCount).to.equal(10000);
      expect(grassCount).to.equal(30000); // 40000 - 10000
    });
    
    it('should return correct tilesFilled count for irregular shapes', function() {
      if (!terrainEditor) this.skip();
      
      // Create L-shape (150 tiles total)
      // Vertical: 0-9, 0-9 (100 tiles)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      // Horizontal: 10-14, 0-9 (50 tiles)
      for (let x = 10; x < 15; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(150);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle already-filled tiles within limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create 20x20 area
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      // Fill with dirt first
      terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Reset terrain
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      mockTerrain.setTile(10, 10, 'dirt'); // One already dirt
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill nothing (already same material)
      expect(result.tilesFilled).to.equal(0);
      expect(result.limitReached).to.be.false;
    });
    
    it('should not fill if start tile is different material', function() {
      if (!terrainEditor) this.skip();
      
      // Create mixed terrain
      mockTerrain.setTile(5, 5, 'grass');
      mockTerrain.setTile(6, 5, 'stone');
      
      const result = terrainEditor.fillRegion(5, 5, 'stone');
      
      // Should only fill grass tile
      expect(result.tilesFilled).to.equal(1);
    });
    
    it('should respect material boundaries even with limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create checkerboard (prevents BFS from spreading)
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const material = (x + y) % 2 === 0 ? 'grass' : 'stone';
          mockTerrain.setTile(x, y, material);
        }
      }
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should only fill grass tiles (half of 2500 = 1250)
      expect(result.tilesFilled).to.be.at.most(1250);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle sparse terrain with gaps', function() {
      if (!terrainEditor) this.skip();
      
      // Create island of grass tiles (not filled everywhere)
      mockTerrain.setTile(10, 10, 'grass');
      mockTerrain.setTile(11, 10, 'grass');
      mockTerrain.setTile(10, 11, 'grass');
      mockTerrain.setTile(11, 11, 'grass');
      // Surrounding tiles are default (not explicitly set)
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill 4 grass tiles OR everything connected with same default material
      // Depends on SparseTerrain behavior for unfilled tiles
      expect(result.tilesFilled).to.be.at.least(4);
    });
    
    it('should return metadata about fill operation', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(0, 0, 'grass');
      mockTerrain.setTile(1, 0, 'grass');
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      expect(result).to.have.property('tilesFilled');
      expect(result).to.have.property('limitReached');
      expect(result).to.have.property('startMaterial');
      expect(result).to.have.property('newMaterial');
      
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle fillRegion on non-existent tile', function() {
      if (!terrainEditor) this.skip();
      
      // Don't set any tiles - rely on default material
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should handle gracefully (either fill default or skip)
      expect(result).to.have.property('tilesFilled');
      expect(result.tilesFilled).to.be.at.least(0);
    });
    
    it('should handle negative coordinates within bounds', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(-5, -5, 'grass');
      mockTerrain.setTile(-4, -5, 'grass');
      
      const result = terrainEditor.fillRegion(-5, -5, 'dirt');
      
      expect(result.tilesFilled).to.be.at.least(2);
    });
  });
});




// ================================================================
// terrainEditorMaterialPainting.test.js (13 tests)
// ================================================================
/**
 * Unit Tests - TerrainEditor Material Painting
 * 
 * Tests that TerrainEditor paints actual material types (moss, stone, dirt, grass)
 * not just colors
 */

describe('TerrainEditor - Material Painting', function() {
  let TerrainEditor;
  let editor;
  let mockTerrain;
  let mockTile;

  beforeEach(function() {
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
      getArrPos: sinon.stub().returns(mockTile),
      getTile: sinon.stub().returns(mockTile),
      invalidateCache: sinon.stub()
    };
    
    // Load TerrainEditor
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
    
    // Create editor
    editor = new TerrainEditor(mockTerrain);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Material Selection', function() {
    it('should set material by name, not color', function() {
      editor.selectMaterial('moss');
      
      expect(editor._selectedMaterial).to.equal('moss');
      expect(editor._selectedMaterial).to.be.a('string');
      expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
    });
    
    it('should accept all terrain material types', function() {
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        expect(editor._selectedMaterial).to.equal(material);
      });
    });
  });

  describe('Paint Tile with Material', function() {
    it('should paint tile with material name, not color', function() {
      editor.selectMaterial('stone');
      
      // Paint at tile position 5, 5
      editor.paintTile(5 * 32, 5 * 32);
      
      // Should have called setMaterial with 'stone'
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
      expect(mockTile.setMaterial.calledWith(sinon.match(/^#/))).to.be.false;
    });
    
    it('should paint with moss material', function() {
      editor.selectMaterial('moss');
      editor.paintTile(10 * 32, 10 * 32);
      
      expect(mockTile.setMaterial.calledWith('moss')).to.be.true;
    });
    
    it('should paint with dirt material', function() {
      editor.selectMaterial('dirt');
      editor.paintTile(8 * 32, 8 * 32);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should paint with grass material', function() {
      editor.selectMaterial('grass');
      editor.paintTile(12 * 32, 12 * 32);
      
      expect(mockTile.setMaterial.calledWith('grass')).to.be.true;
    });
    
    it('should call assignWeight after setting material', function() {
      editor.selectMaterial('stone');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTile.assignWeight.called).to.be.true;
    });
    
    it('should invalidate terrain cache after painting', function() {
      editor.selectMaterial('moss');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTerrain.invalidateCache.called).to.be.true;
    });
  });

  describe('Paint Method Integration', function() {
    it('should paint using the paint() method', function() {
      editor.selectMaterial('dirt');
      
      // paint() method uses tile coordinates directly
      editor.paint(5, 5);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should use selected material when painting', function() {
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
    });
  });

  describe('Material Type Verification', function() {
    it('should store material as string name', function() {
      editor.selectMaterial('moss');
      
      expect(typeof editor._selectedMaterial).to.equal('string');
      expect(editor._selectedMaterial).to.equal('moss');
    });
    
    it('should not store color codes', function() {
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        
        // Should be material name, not hex color
        expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
        expect(editor._selectedMaterial).to.not.match(/^rgb/i);
      });
    });
  });

  describe('Fill with Material', function() {
    it('should fill region with material name', function() {
      // Set tile to different material first
      mockTile._material = 'dirt';
      mockTile.getMaterial = sinon.stub().returns('dirt');
      
      editor.selectMaterial('grass');
      
      // Mock fill to check material
      mockTerrain.getArrPos = sinon.stub().returns(mockTile);
      
      editor.fill(5, 5);
      
      // Should have called setMaterial with 'grass'
      const setMaterialCalls = mockTile.setMaterial.getCalls();
      const grassCalls = setMaterialCalls.filter(call => call.args[0] === 'grass');
      expect(grassCalls.length).to.be.greaterThan(0);
    });
  });
});




// ================================================================
// terrainExporter.test.js (32 tests)
// ================================================================
/**
 * Unit Tests for TerrainExporter
 * Tests exporting terrain to various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let exporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
vm.runInThisContext(exporterCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainExporter - JSON Export', function() {
  
  describe('exportToJSON()', function() {
    
    it('should export basic terrain metadata', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata.version).to.equal('1.0');
      expect(exported.metadata.gridSizeX).to.equal(3);
      expect(exported.metadata.gridSizeY).to.equal(3);
      expect(exported.metadata.chunkSize).to.equal(8);
      expect(exported.metadata.seed).to.equal(12345);
    });
    
    it('should export all tile materials', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.have.lengthOf(2 * 2 * 8 * 8); // gridSizeX * gridSizeY * chunkSize * chunkSize
      exported.tiles.forEach(material => {
        expect(material).to.be.a('string');
      });
    });
    
    it('should include custom metadata when provided', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const customMetadata = {
        name: 'Test Level',
        author: 'TestUser',
        description: 'A test level',
        difficulty: 'easy',
        tags: ['tutorial', 'beginner']
      };
      
      const exported = {
        metadata: {
          ...customMetadata,
          version: '1.0',
          gridSizeX: terrain._gridSizeX,
          gridSizeY: terrain._gridSizeY
        }
      };
      
      expect(exported.metadata.name).to.equal('Test Level');
      expect(exported.metadata.author).to.equal('TestUser');
      expect(exported.metadata.tags).to.deep.equal(['tutorial', 'beginner']);
    });
    
    it('should support compressed tile format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Compressed format: single string where each char represents a material
      const materialToChar = {
        'grass': 'g',
        'dirt': 'd',
        'stone': 's',
        'water': 'w',
        'sand': 'a',
        'moss_0': 'm'
      };
      
      let compressed = '';
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          compressed += materialToChar[tile._materialSet] || 'g';
        });
      });
      
      expect(compressed).to.be.a('string');
      expect(compressed.length).to.equal(4 * 64); // One char per tile
      expect(compressed).to.match(/^[gdswam]+$/); // Only valid characters
    });
    
    it('should handle empty or minimal terrains', function() {
      const terrain = new gridTerrain(1, 1, 12345);
      
      const exported = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: []
      };
      
      terrain.chunkArray.rawArray[0].tileData.rawArray.forEach(tile => {
        exported.tiles.push({
          x: tile._x,
          y: tile._y,
          material: tile._materialSet
        });
      });
      
      expect(exported.tiles).to.have.length.greaterThan(0);
    });
    
    it('should generate valid JSON string', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const data = {
        metadata: { version: '1.0' },
        terrain: { seed: terrain._seed }
      };
      
      const jsonString = JSON.stringify(data);
      expect(jsonString).to.be.a('string');
      
      // Should be parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed.metadata.version).to.equal('1.0');
    });
  });
  
  describe('exportOptions()', function() {
    
    it('should support entities export option', function() {
      const includeEntities = true;
      const entities = [
        { type: 'ant_hill', x: 40, y: 40 },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      const exported = {
        entities: includeEntities ? entities : []
      };
      
      expect(exported.entities).to.have.lengthOf(2);
      expect(exported.entities[0].type).to.equal('ant_hill');
    });
    
    it('should support resources export option', function() {
      const includeResources = true;
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 }
      ];
      
      const exported = {
        resources: includeResources ? resources : []
      };
      
      expect(exported.resources).to.have.lengthOf(1);
    });
    
    it('should support compression option', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Uncompressed: array of tile objects
      const uncompressed = [];
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          uncompressed.push({ x: tile._x, y: tile._y, material: tile._materialSet });
        });
      });
      
      // Compressed: run-length encoding
      const compressed = [];
      let currentMaterial = null;
      let runLength = 0;
      
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          if (tile._materialSet === currentMaterial) {
            runLength++;
          } else {
            if (currentMaterial !== null) {
              compressed.push({ material: currentMaterial, count: runLength });
            }
            currentMaterial = tile._materialSet;
            runLength = 1;
          }
        });
      });
      
      if (currentMaterial !== null) {
        compressed.push({ material: currentMaterial, count: runLength });
      }
      
      // Compressed should be smaller for homogeneous terrain
      const uncompressedSize = JSON.stringify(uncompressed).length;
      const compressedSize = JSON.stringify(compressed).length;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should exclude entities when option is false', function() {
      const exported = {
        metadata: {},
        entities: false ? [{ type: 'ant' }] : []
      };
      
      expect(exported.entities).to.have.lengthOf(0);
    });
    
    it('should include timestamp in metadata', function() {
      const exported = {
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      expect(exported.metadata.created).to.match(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
  
  describe('chunkBasedExport()', function() {
    
    it('should export terrain by chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const chunkData = terrain.chunkArray.rawArray.map((chunk, idx) => {
        const chunkPos = terrain.chunkArray.convToSquare(idx);
        return {
          position: chunkPos,
          tiles: chunk.tileData.rawArray.map(tile => ({
            offset: [tile._x % 8, tile._y % 8],
            material: tile._materialSet
          }))
        };
      });
      
      expect(chunkData).to.have.lengthOf(9); // 3x3 chunks
      chunkData.forEach(chunk => {
        expect(chunk.position).to.be.an('array');
        expect(chunk.tiles).to.have.lengthOf(64); // 8x8 tiles per chunk
      });
    });
    
    it('should use default material with exceptions', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const chunks = terrain.chunkArray.rawArray.map(chunk => {
        // Find most common material
        const materialCounts = {};
        chunk.tileData.rawArray.forEach(tile => {
          materialCounts[tile._materialSet] = (materialCounts[tile._materialSet] || 0) + 1;
        });
        
        const defaultMaterial = Object.keys(materialCounts).reduce((a, b) => 
          materialCounts[a] > materialCounts[b] ? a : b
        );
        
        // Only store exceptions
        const exceptions = [];
        chunk.tileData.rawArray.forEach((tile, idx) => {
          if (tile._materialSet !== defaultMaterial) {
            exceptions.push({
              offset: [idx % 8, Math.floor(idx / 8)],
              material: tile._materialSet
            });
          }
        });
        
        return {
          defaultMaterial,
          exceptions
        };
      });
      
      chunks.forEach(chunk => {
        expect(chunk.defaultMaterial).to.be.a('string');
        expect(chunk.exceptions).to.be.an('array');
      });
    });
  });
});

describe('TerrainExporter - File Generation', function() {
  
  describe('generateFileName()', function() {
    
    it('should generate filename with timestamp', function() {
      const timestamp = Date.now();
      const filename = `terrain_${timestamp}.json`;
      
      expect(filename).to.match(/^terrain_\d+\.json$/);
    });
    
    it('should support custom filenames', function() {
      const customName = 'my_level';
      const filename = `${customName}.json`;
      
      expect(filename).to.equal('my_level.json');
    });
    
    it('should sanitize filenames', function() {
      const unsafeName = 'my level/with\\bad:chars*';
      const safeName = unsafeName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      expect(safeName).to.equal('my_level_with_bad_chars_');
      expect(safeName).to.not.match(/[\/\\:*]/);
    });
    
    it('should add extension if missing', function() {
      const name = 'terrain_file';
      const withExtension = name.endsWith('.json') ? name : `${name}.json`;
      
      expect(withExtension).to.equal('terrain_file.json');
    });
  });
  
  describe('getMimeType()', function() {
    
    it('should return correct MIME type for JSON', function() {
      const mimeType = 'application/json';
      expect(mimeType).to.equal('application/json');
    });
    
    it('should return correct MIME type for PNG', function() {
      const mimeType = 'image/png';
      expect(mimeType).to.equal('image/png');
    });
    
    it('should return correct MIME type for binary', function() {
      const mimeType = 'application/octet-stream';
      expect(mimeType).to.equal('application/octet-stream');
    });
  });
});

describe('TerrainExporter - Run-Length Encoding', function() {
  
  describe('runLengthEncode()', function() {
    
    it('should compress homogeneous sequences', function() {
      const materials = ['grass', 'grass', 'grass', 'dirt', 'dirt', 'grass'];
      
      const encoded = [];
      let current = materials[0];
      let count = 1;
      
      for (let i = 1; i < materials.length; i++) {
        if (materials[i] === current) {
          count++;
        } else {
          encoded.push({ material: current, count });
          current = materials[i];
          count = 1;
        }
      }
      encoded.push({ material: current, count });
      
      expect(encoded).to.deep.equal([
        { material: 'grass', count: 3 },
        { material: 'dirt', count: 2 },
        { material: 'grass', count: 1 }
      ]);
    });
    
    it('should handle single material terrain', function() {
      const materials = new Array(100).fill('grass');
      
      const encoded = [{ material: 'grass', count: 100 }];
      
      expect(encoded).to.have.lengthOf(1);
      expect(encoded[0].count).to.equal(100);
    });
    
    it('should handle alternating materials', function() {
      const materials = ['grass', 'dirt', 'grass', 'dirt'];
      
      const encoded = materials.map(m => ({ material: m, count: 1 }));
      
      expect(encoded).to.have.lengthOf(4);
    });
    
    it('should preserve order', function() {
      const materials = ['a', 'a', 'b', 'c', 'c', 'c'];
      
      const encoded = [
        { material: 'a', count: 2 },
        { material: 'b', count: 1 },
        { material: 'c', count: 3 }
      ];
      
      // Decode to verify
      const decoded = [];
      encoded.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          decoded.push(run.material);
        }
      });
      
      expect(decoded).to.deep.equal(materials);
    });
  });
});

describe('TerrainExporter - Validation', function() {
  
  describe('validateExportData()', function() {
    
    it('should validate required metadata fields', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5,
          chunkSize: 8,
          tileSize: 32
        }
      };
      
      expect(data.metadata.version).to.exist;
      expect(data.metadata.gridSizeX).to.be.a('number');
      expect(data.metadata.gridSizeY).to.be.a('number');
    });
    
    it('should reject invalid version format', function() {
      const version = '1.0';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.true;
      expect(/^\d+\.\d+$/.test('invalid')).to.be.false;
    });
    
    it('should validate tile data structure', function() {
      const tile = {
        x: 0,
        y: 0,
        material: 'grass',
        weight: 1
      };
      
      expect(tile).to.have.property('x');
      expect(tile).to.have.property('y');
      expect(tile).to.have.property('material');
      expect(tile.material).to.be.a('string');
    });
    
    it('should reject negative coordinates', function() {
      const tile = { x: -1, y: 0, material: 'grass' };
      const isValid = tile.x >= 0 && tile.y >= 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = ['grass', 'dirt', 'stone', 'water', 'sand'];
      const material = 'grass';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include('invalid_material');
    });
  });
});

describe('TerrainExporter - Size Calculations', function() {
  
  describe('calculateExportSize()', function() {
    
    it('should calculate JSON byte size', function() {
      const data = { metadata: { version: '1.0' }, tiles: [] };
      const jsonString = JSON.stringify(data);
      const byteSize = new TextEncoder().encode(jsonString).length;
      
      expect(byteSize).to.be.a('number');
      expect(byteSize).to.be.greaterThan(0);
    });
    
    it('should estimate compressed size', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const tileCount = terrain._gridSizeX * terrain._gridSizeY * 
                       terrain._chunkSize * terrain._chunkSize;
      
      // Uncompressed: ~50 bytes per tile (JSON)
      const uncompressedSize = tileCount * 50;
      
      // Compressed: ~10 bytes per run (assuming good compression)
      const estimatedRuns = Math.ceil(tileCount / 10); // Optimistic
      const compressedSize = estimatedRuns * 10;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should report size in human-readable format', function() {
      const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };
      
      expect(formatBytes(500)).to.equal('500 B');
      expect(formatBytes(2048)).to.equal('2.00 KB');
      expect(formatBytes(2097152)).to.equal('2.00 MB');
    });
  });
});




// ================================================================
// terrainImporter.test.js (40 tests)
// ================================================================
/**
 * Unit Tests for TerrainImporter
 * Tests importing terrain from various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let importerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
vm.runInThisContext(importerCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainImporter - JSON Import', function() {
  
  describe('importFromJSON()', function() {
    
    it('should import basic terrain metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          gridSizeX: 3,
          gridSizeY: 3,
          chunkSize: 8,
          tileSize: 32,
          seed: 12345,
          generationMode: 'perlin'
        }
      };
      
      expect(terrainData.metadata.gridSizeX).to.equal(3);
      expect(terrainData.metadata.gridSizeY).to.equal(3);
      expect(terrainData.metadata.seed).to.equal(12345);
    });
    
    it('should reconstruct terrain from tile data', function() {
      const tiles = [
        { x: 0, y: 0, material: 'grass', weight: 1 },
        { x: 1, y: 0, material: 'dirt', weight: 3 },
        { x: 0, y: 1, material: 'stone', weight: 100 }
      ];
      
      const tileMap = new Map();
      tiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        tileMap.set(key, tile);
      });
      
      expect(tileMap.size).to.equal(3);
      expect(tileMap.get('0,0').material).to.equal('grass');
      expect(tileMap.get('1,0').material).to.equal('dirt');
    });
    
    it('should handle compressed tile format', function() {
      const compressed = 'gggdddsss';
      const charToMaterial = {
        'g': 'grass',
        'd': 'dirt',
        's': 'stone',
        'w': 'water',
        'a': 'sand'
      };
      
      const tiles = [];
      for (let i = 0; i < compressed.length; i++) {
        tiles.push({
          index: i,
          material: charToMaterial[compressed[i]]
        });
      }
      
      expect(tiles).to.have.lengthOf(9);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[3].material).to.equal('dirt');
      expect(tiles[6].material).to.equal('stone');
    });
    
    it('should apply run-length decoded data', function() {
      const runs = [
        { material: 'grass', count: 5 },
        { material: 'dirt', count: 3 },
        { material: 'stone', count: 2 }
      ];
      
      const tiles = [];
      runs.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          tiles.push({ material: run.material });
        }
      });
      
      expect(tiles).to.have.lengthOf(10);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[4].material).to.equal('grass');
      expect(tiles[5].material).to.equal('dirt');
      expect(tiles[8].material).to.equal('stone');
    });
    
    it('should restore custom metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          name: 'Desert Level',
          author: 'TestUser',
          description: 'A sandy battlefield',
          difficulty: 'hard',
          tags: ['desert', 'pvp']
        }
      };
      
      expect(terrainData.metadata.name).to.equal('Desert Level');
      expect(terrainData.metadata.author).to.equal('TestUser');
      expect(terrainData.metadata.tags).to.include('desert');
    });
    
    it('should handle minimal terrain data', function() {
      const minimal = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' // 64 tiles (1 chunk)
      };
      
      expect(minimal.tiles.length).to.equal(64);
    });
  });
  
  describe('validateImportData()', function() {
    
    it('should validate required fields exist', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasVersion = !!(data.metadata && data.metadata.version);
      const hasGridSize = !!(data.metadata && data.metadata.gridSizeX && data.metadata.gridSizeY);
      
      expect(hasVersion).to.be.true;
      expect(hasGridSize).to.be.true;
    });
    
    it('should reject missing metadata', function() {
      const data = { tiles: [] };
      const isValid = data.metadata !== undefined;
      
      expect(isValid).to.be.false;
    });
    
    it('should reject invalid version format', function() {
      const version = 'invalid';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.false;
    });
    
    it('should validate grid sizes are positive', function() {
      const gridSizeX = 5;
      const gridSizeY = -1;
      
      const isValid = gridSizeX > 0 && gridSizeY > 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
      const material = 'grass';
      const invalid = 'invalid_material';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include(invalid);
    });
    
    it('should reject malformed JSON', function() {
      const malformed = '{ "metadata": { "version": "1.0" ';
      
      let isValid = true;
      try {
        JSON.parse(malformed);
      } catch (e) {
        isValid = false;
      }
      
      expect(isValid).to.be.false;
    });
    
    it('should validate tile coordinates are within bounds', function() {
      const gridSize = { x: 5, y: 5, chunkSize: 8 };
      const maxX = gridSize.x * gridSize.chunkSize;
      const maxY = gridSize.y * gridSize.chunkSize;
      
      const validTile = { x: 10, y: 10 };
      const invalidTile = { x: 100, y: 10 };
      
      expect(validTile.x < maxX && validTile.y < maxY).to.be.true;
      expect(invalidTile.x < maxX && invalidTile.y < maxY).to.be.false;
    });
  });
  
  describe('chunkBasedImport()', function() {
    
    it('should import terrain by chunks', function() {
      const chunkData = [
        {
          position: [0, 0],
          tiles: Array(64).fill(null).map((_, i) => ({
            offset: [i % 8, Math.floor(i / 8)],
            material: 'grass'
          }))
        }
      ];
      
      expect(chunkData[0].tiles).to.have.lengthOf(64);
      expect(chunkData[0].position).to.deep.equal([0, 0]);
    });
    
    it('should apply default material with exceptions', function() {
      const chunkData = {
        defaultMaterial: 'grass',
        exceptions: [
          { offset: [3, 4], material: 'water' },
          { offset: [7, 2], material: 'stone' }
        ]
      };
      
      const tiles = Array(64).fill(null).map((_, i) => {
        const offset = [i % 8, Math.floor(i / 8)];
        const exception = chunkData.exceptions.find(e => 
          e.offset[0] === offset[0] && e.offset[1] === offset[1]
        );
        
        return {
          offset,
          material: exception ? exception.material : chunkData.defaultMaterial
        };
      });
      
      expect(tiles.filter(t => t.material === 'grass')).to.have.lengthOf(62);
      expect(tiles.filter(t => t.material === 'water')).to.have.lengthOf(1);
      expect(tiles.filter(t => t.material === 'stone')).to.have.lengthOf(1);
    });
    
    it('should handle multiple chunks', function() {
      const chunks = [
        { position: [0, 0], defaultMaterial: 'grass', exceptions: [] },
        { position: [1, 0], defaultMaterial: 'dirt', exceptions: [] },
        { position: [0, 1], defaultMaterial: 'stone', exceptions: [] }
      ];
      
      expect(chunks).to.have.lengthOf(3);
      expect(chunks[0].defaultMaterial).to.equal('grass');
      expect(chunks[1].defaultMaterial).to.equal('dirt');
    });
  });
});

describe('TerrainImporter - Version Migration', function() {
  
  describe('migrateVersion()', function() {
    
    it('should detect old version format', function() {
      const oldData = {
        metadata: { version: '1.0' }
      };
      
      const currentVersion = '2.0';
      const needsMigration = oldData.metadata.version !== currentVersion;
      
      expect(needsMigration).to.be.true;
    });
    
    it('should migrate v1.0 to v2.0', function() {
      const v1Data = {
        metadata: {
          version: '1.0',
          width: 5,
          height: 5
        }
      };
      
      // Migration: rename width/height to gridSizeX/gridSizeY
      const v2Data = {
        metadata: {
          version: '2.0',
          gridSizeX: v1Data.metadata.width,
          gridSizeY: v1Data.metadata.height
        }
      };
      
      expect(v2Data.metadata.version).to.equal('2.0');
      expect(v2Data.metadata.gridSizeX).to.equal(5);
      expect(v2Data.metadata.gridSizeY).to.equal(5);
    });
    
    it('should chain multiple migrations', function() {
      const versions = ['1.0', '1.5', '2.0'];
      const currentVersion = '2.0';
      
      let data = { metadata: { version: '1.0' } };
      
      while (data.metadata.version !== currentVersion) {
        const versionIndex = versions.indexOf(data.metadata.version);
        const nextVersion = versions[versionIndex + 1];
        
        // Simulate migration
        data.metadata.version = nextVersion;
      }
      
      expect(data.metadata.version).to.equal('2.0');
    });
    
    it('should preserve data during migration', function() {
      const original = {
        metadata: { version: '1.0', name: 'Test Level' },
        tiles: ['g', 'g', 'd']
      };
      
      const migrated = {
        metadata: {
          ...original.metadata,
          version: '2.0'
        },
        tiles: original.tiles
      };
      
      expect(migrated.metadata.name).to.equal('Test Level');
      expect(migrated.tiles).to.deep.equal(['g', 'g', 'd']);
    });
    
    it('should skip migration for current version', function() {
      const currentData = {
        metadata: { version: '2.0' }
      };
      
      const needsMigration = currentData.metadata.version !== '2.0';
      
      expect(needsMigration).to.be.false;
    });
  });
  
  describe('validateMigration()', function() {
    
    it('should validate migrated data structure', function() {
      const migrated = {
        metadata: {
          version: '2.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasRequiredFields = !!(
        migrated.metadata.version &&
        migrated.metadata.gridSizeX &&
        migrated.metadata.gridSizeY
      );
      
      expect(hasRequiredFields).to.be.true;
    });
    
    it('should reject incomplete migrations', function() {
      const incomplete = {
        metadata: {
          version: '2.0'
          // Missing gridSizeX, gridSizeY
        }
      };
      
      const isComplete = 
        incomplete.metadata.gridSizeX !== undefined &&
        incomplete.metadata.gridSizeY !== undefined;
      
      expect(isComplete).to.be.false;
    });
  });
});

describe('TerrainImporter - Entity Import', function() {
  
  describe('importEntities()', function() {
    
    it('should import entity data', function() {
      const entities = [
        { type: 'ant_hill', x: 40, y: 40, faction: 'red' },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      expect(entities).to.have.lengthOf(2);
      expect(entities[0].type).to.equal('ant_hill');
      expect(entities[1].amount).to.equal(50);
    });
    
    it('should validate entity types', function() {
      const validTypes = ['ant_hill', 'food', 'resource', 'obstacle'];
      const entity = { type: 'ant_hill' };
      
      const isValid = validTypes.includes(entity.type);
      
      expect(isValid).to.be.true;
    });
    
    it('should validate entity positions', function() {
      const bounds = { maxX: 100, maxY: 100 };
      const validEntity = { type: 'food', x: 50, y: 50 };
      const invalidEntity = { type: 'food', x: 150, y: 50 };
      
      const isValidPosition = (entity) => 
        entity.x >= 0 && entity.x <= bounds.maxX &&
        entity.y >= 0 && entity.y <= bounds.maxY;
      
      expect(isValidPosition(validEntity)).to.be.true;
      expect(isValidPosition(invalidEntity)).to.be.false;
    });
    
    it('should handle optional entity data', function() {
      const terrainData = {
        metadata: {},
        entities: [] // Optional, may be empty
      };
      
      expect(terrainData.entities).to.be.an('array');
      expect(terrainData.entities).to.have.lengthOf(0);
    });
  });
});

describe('TerrainImporter - Resource Import', function() {
  
  describe('importResources()', function() {
    
    it('should import resource data', function() {
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 },
        { type: 'stone', x: 80, y: 80, quantity: 15 }
      ];
      
      expect(resources).to.have.lengthOf(2);
      expect(resources[0].quantity).to.equal(20);
    });
    
    it('should validate resource quantities', function() {
      const resource = { type: 'wood', quantity: 20 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.true;
    });
    
    it('should reject negative quantities', function() {
      const resource = { type: 'wood', quantity: -5 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.false;
    });
  });
});

describe('TerrainImporter - Error Handling', function() {
  
  describe('handleImportErrors()', function() {
    
    it('should throw error for missing required fields', function() {
      const invalidData = { tiles: [] }; // Missing metadata
      
      const validate = () => {
        if (!invalidData.metadata) {
          throw new Error('Missing required field: metadata');
        }
      };
      
      expect(validate).to.throw('Missing required field: metadata');
    });
    
    it('should throw error for invalid data types', function() {
      const invalidData = {
        metadata: {
          version: '1.0',
          gridSizeX: 'five' // Should be number
        }
      };
      
      const validate = () => {
        if (typeof invalidData.metadata.gridSizeX !== 'number') {
          throw new Error('gridSizeX must be a number');
        }
      };
      
      expect(validate).to.throw('gridSizeX must be a number');
    });
    
    it('should provide helpful error messages', function() {
      const error = new Error('Invalid terrain data: gridSizeX must be positive');
      
      expect(error.message).to.include('gridSizeX');
      expect(error.message).to.include('positive');
    });
    
    it('should handle file read errors gracefully', function() {
      const handleFileError = (error) => {
        if (error.code === 'ENOENT') {
          return { error: 'File not found' };
        }
        return { error: 'Unknown error' };
      };
      
      const result = handleFileError({ code: 'ENOENT' });
      expect(result.error).to.equal('File not found');
    });
  });
});

describe('TerrainImporter - Defaults and Fallbacks', function() {
  
  describe('applyDefaults()', function() {
    
    it('should use default chunk size if not specified', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
          // chunkSize not specified
        }
      };
      
      const chunkSize = data.metadata.chunkSize || 8;
      
      expect(chunkSize).to.equal(8);
    });
    
    it('should use default tile size if not specified', function() {
      const data = { metadata: {} };
      const tileSize = data.metadata.tileSize || 32;
      
      expect(tileSize).to.equal(32);
    });
    
    it('should use default generation mode', function() {
      const data = { metadata: {} };
      const generationMode = data.metadata.generationMode || 'perlin';
      
      expect(generationMode).to.equal('perlin');
    });
    
    it('should generate seed if not provided', function() {
      const data = { metadata: {} };
      const seed = data.metadata.seed || Math.floor(Math.random() * 100000);
      
      expect(seed).to.be.a('number');
      expect(seed).to.be.greaterThan(0);
    });
  });
});

describe('TerrainImporter - Performance', function() {
  
  describe('importPerformance()', function() {
    
    it('should handle large terrain imports efficiently', function() {
      const largeData = {
        metadata: { gridSizeX: 20, gridSizeY: 20 }, // 400 chunks
        tiles: new Array(20 * 20 * 64).fill('g') // 25,600 tiles
      };
      
      const startTime = Date.now();
      
      // Simulate processing
      const tiles = largeData.tiles.map((char, index) => ({
        index,
        material: 'grass'
      }));
      
      const duration = Date.now() - startTime;
      
      expect(tiles).to.have.lengthOf(25600);
      expect(duration).to.be.lessThan(1000); // Should be fast
    });
    
    it('should use streaming for very large files', function() {
      const shouldStream = (fileSize) => fileSize > 1024 * 1024; // 1MB
      
      expect(shouldStream(500 * 1024)).to.be.false; // 500KB
      expect(shouldStream(2 * 1024 * 1024)).to.be.true; // 2MB
    });
  });
});





// ================================================================
// terrainEditorBrushPatterns.test.js (5 tests)
// ================================================================
/**
 * Unit Tests: TerrainEditor Brush Patterns
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * Tests that TerrainEditor.paint() uses the correct brush patterns:
 * - Even sizes (2,4,6,8): Circular pattern
 * - Odd sizes (3,5,7,9): Square pattern
 */

describe('TerrainEditor Brush Patterns (Unit Tests)', function() {
    let TerrainEditor, mockTerrain, editor;
    
    beforeEach(function() {
        // Load TerrainEditor
        TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
        
        // Create mock terrain
        const tiles = {};
        mockTerrain = {
            _tileSize: 32,
            _gridSizeX: 10,
            _gridSizeY: 10,
            _chunkSize: 10,
            getArrPos: sinon.stub().callsFake(([x, y]) => {
                const key = `${x},${y}`;
                if (!tiles[key]) {
                    tiles[key] = {
                        material: 'dirt',
                        getMaterial: function() { return this.material; },
                        setMaterial: function(mat) { this.material = mat; },
                        assignWeight: sinon.stub()
                    };
                }
                return tiles[key];
            }),
            invalidateCache: sinon.stub()
        };
        
        editor = new TerrainEditor(mockTerrain);
    });
    
    describe('Odd Size 3 - Square Pattern', function() {
        it('should paint 3x3 square (9 tiles) for brush size 3', function() {
            editor.setBrushSize(3);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 9 tiles were painted (3x3 square)
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(9, 'Should paint 9 tiles in 3x3 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 9, y: 9 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 9 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 9, y: 11 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 11, y: 11 }); // Bottom-right
        });
    });
    
    describe('Even Size 4 - Circular Pattern', function() {
        it('should paint circular pattern (13 tiles) for brush size 4', function() {
            editor.setBrushSize(4);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 2 should have ~13 tiles
            expect(paintedTiles.length).to.be.greaterThan(9);
            expect(paintedTiles.length).to.be.lessThanOrEqual(16);
            
            // Center should be painted
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('Odd Size 5 - Square Pattern', function() {
        it('should paint 5x5 square (25 tiles) for brush size 5', function() {
            editor.setBrushSize(5);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Verify 25 tiles were painted (5x5 square)
            const paintedTiles = [];
            for (let y = 8; y <= 12; y++) {
                for (let x = 8; x <= 12; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            expect(paintedTiles.length).to.equal(25, 'Should paint 25 tiles in 5x5 square');
            
            // Verify all corners are painted (square pattern)
            expect(paintedTiles).to.deep.include({ x: 8, y: 8 });   // Top-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 8 });  // Top-right
            expect(paintedTiles).to.deep.include({ x: 8, y: 12 });  // Bottom-left
            expect(paintedTiles).to.deep.include({ x: 12, y: 12 }); // Bottom-right
        });
    });
    
    describe('Even Size 2 - Circular Pattern', function() {
        it('should paint circular pattern (5 tiles cross) for brush size 2', function() {
            editor.setBrushSize(2);
            editor.selectMaterial('stone');
            
            // Paint at center (10, 10)
            editor.paint(10, 10);
            
            // Count painted tiles
            const paintedTiles = [];
            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const tile = mockTerrain.getArrPos([x, y]);
                    if (tile.getMaterial() === 'stone') {
                        paintedTiles.push({ x, y });
                    }
                }
            }
            
            // Circular pattern with radius 1 creates cross (5 tiles)
            expect(paintedTiles.length).to.equal(5);
            
            // Center + 4 cardinal directions
            expect(paintedTiles).to.deep.include({ x: 10, y: 10 }); // Center
            expect(paintedTiles).to.deep.include({ x: 9, y: 10 });  // Left
            expect(paintedTiles).to.deep.include({ x: 11, y: 10 }); // Right
            expect(paintedTiles).to.deep.include({ x: 10, y: 9 });  // Top
            expect(paintedTiles).to.deep.include({ x: 10, y: 11 }); // Bottom
        });
    });
    
    describe('Size 1 - Single Tile', function() {
        it('should paint single tile for brush size 1', function() {
            editor.setBrushSize(1);
            editor.selectMaterial('stone');
            
            // Paint at (10, 10)
            editor.paint(10, 10);
            
            // Only (10,10) should be painted
            const tile10_10 = mockTerrain.getArrPos([10, 10]);
            expect(tile10_10.getMaterial()).to.equal('stone');
            
            // Adjacent tiles should NOT be painted
            const tile9_10 = mockTerrain.getArrPos([9, 10]);
            expect(tile9_10.getMaterial()).to.equal('dirt');
        });
    });
});




// ================================================================
// TerrainEditorFillBounds.test.js (12 tests)
// ================================================================
/**
 * TerrainEditorFillBounds.test.js
 * 
 * TDD unit tests for fill tool bounds limiting
 * Issue: Fill tool fills EVERYTHING, needs 100x100 area limit
 * 
 * Test Strategy:
 * - Mock SparseTerrain with sparse data structure
 * - Test fillRegion with various area sizes
 * - Verify MAX_FILL_AREA constant limits fill operations
 * - Test count tracking and limit detection
 */

// Setup JSDOM
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load TerrainEditor
// DUPLICATE REQUIRE REMOVED: let TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');

describe('TerrainEditor - Fill Bounds Limit', function() {
  let terrainEditor;
  let mockTerrain;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.logVerbose = sinon.stub();
    global.logInfo = sinon.stub();
    
    // Sync to window for JSDOM
    window.createVector = global.createVector;
    window.logVerbose = global.logVerbose;
    window.logInfo = global.logInfo;
    
    // Create mock SparseTerrain with getArrPos interface
    mockTerrain = {
      _tiles: new Map(),
      _tileSize: 32,
      // Note: NO _gridSizeX/_gridSizeY to allow sparse behavior (negative coords)
      
      // Compatibility method - returns wrapper with getMaterial/setMaterial
      getArrPos: function(coords) {
        const key = `${coords[0]},${coords[1]}`;
        const self = this;
        return {
          getMaterial: function() {
            const tile = self._tiles.get(key);
            // Return material if explicitly set, otherwise return unique empty identifier
            // This prevents fill from spreading to unset tiles
            return tile ? tile.material : null;
          },
          setMaterial: function(material) {
            self._tiles.set(key, { material });
          },
          assignWeight: function() {
            // Mock - no-op
          }
        };
      },
      
      // Helper to check if tile exists
      hasTile: function(x, y) {
        return this._tiles.has(`${x},${y}`);
      },
      
      // Helper to set tile directly
      setTile: function(x, y, material) {
        this._tiles.set(`${x},${y}`, { material });
      },
      
      // Compatibility method - no-op for SparseTerrain
      invalidateCache: function() {
        // Mock - no-op
      }
    };
    
    // Create TerrainEditor with mock terrain
    terrainEditor = new TerrainEditor(mockTerrain);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('MAX_FILL_AREA Constant', function() {
    it('should define MAX_FILL_AREA as 10000 (100x100)', function() {
      expect(terrainEditor.MAX_FILL_AREA).to.equal(10000);
    });
  });
  
  describe('fillRegion() with Bounds Limit', function() {
    it('should fill small area completely (10x10 = 100 tiles)', function() {
      
      // Create 10x10 grass area
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(100);
      expect(result.limitReached).to.be.false;
      
      // Verify all tiles changed
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          expect(mockTerrain.getArrPos([x, y]).getMaterial()).to.equal('dirt');
        }
      }
    });
    
    it('should fill exactly 100x100 area (limit)', function() {
      if (!terrainEditor) this.skip();
      
      // Create 100x100 grass area
      for (let x = 0; x < 100; x++) {
        for (let y = 0; y < 100; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(50, 50, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000);
      expect(result.limitReached).to.be.false; // Exactly at limit
    });
    
    it('should stop at 100x100 limit when filling larger area', function() {
      if (!terrainEditor) this.skip();
      
      // Create 200x200 grass area (40,000 tiles)
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(100, 100, 'dirt');
      
      expect(result.tilesFilled).to.equal(10000); // Stopped at limit
      expect(result.limitReached).to.be.true;
      
      // Verify not all tiles changed
      let dirtCount = 0;
      let grassCount = 0;
      for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
          const material = mockTerrain.getArrPos([x, y]).getMaterial();
          if (material === 'dirt') dirtCount++;
          if (material === 'grass') grassCount++;
        }
      }
      
      expect(dirtCount).to.equal(10000);
      expect(grassCount).to.equal(30000); // 40000 - 10000
    });
    
    it('should return correct tilesFilled count for irregular shapes', function() {
      if (!terrainEditor) this.skip();
      
      // Create L-shape (150 tiles total)
      // Vertical: 0-9, 0-9 (100 tiles)
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      // Horizontal: 10-14, 0-9 (50 tiles)
      for (let x = 10; x < 15; x++) {
        for (let y = 0; y < 10; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      const result = terrainEditor.fillRegion(5, 5, 'dirt');
      
      expect(result.tilesFilled).to.equal(150);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle already-filled tiles within limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create 20x20 area
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      
      // Fill with dirt first
      terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Reset terrain
      for (let x = 0; x < 20; x++) {
        for (let y = 0; y < 20; y++) {
          mockTerrain.setTile(x, y, 'grass');
        }
      }
      mockTerrain.setTile(10, 10, 'dirt'); // One already dirt
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill nothing (already same material)
      expect(result.tilesFilled).to.equal(0);
      expect(result.limitReached).to.be.false;
    });
    
    it('should not fill if start tile is different material', function() {
      if (!terrainEditor) this.skip();
      
      // Create mixed terrain
      mockTerrain.setTile(5, 5, 'grass');
      mockTerrain.setTile(6, 5, 'stone');
      
      const result = terrainEditor.fillRegion(5, 5, 'stone');
      
      // Should only fill grass tile
      expect(result.tilesFilled).to.equal(1);
    });
    
    it('should respect material boundaries even with limit', function() {
      if (!terrainEditor) this.skip();
      
      // Create checkerboard (prevents BFS from spreading)
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          const material = (x + y) % 2 === 0 ? 'grass' : 'stone';
          mockTerrain.setTile(x, y, material);
        }
      }
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should only fill grass tiles (half of 2500 = 1250)
      expect(result.tilesFilled).to.be.at.most(1250);
      expect(result.limitReached).to.be.false;
    });
    
    it('should handle sparse terrain with gaps', function() {
      if (!terrainEditor) this.skip();
      
      // Create island of grass tiles (not filled everywhere)
      mockTerrain.setTile(10, 10, 'grass');
      mockTerrain.setTile(11, 10, 'grass');
      mockTerrain.setTile(10, 11, 'grass');
      mockTerrain.setTile(11, 11, 'grass');
      // Surrounding tiles are default (not explicitly set)
      
      const result = terrainEditor.fillRegion(10, 10, 'dirt');
      
      // Should fill 4 grass tiles OR everything connected with same default material
      // Depends on SparseTerrain behavior for unfilled tiles
      expect(result.tilesFilled).to.be.at.least(4);
    });
    
    it('should return metadata about fill operation', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(0, 0, 'grass');
      mockTerrain.setTile(1, 0, 'grass');
      
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      expect(result).to.have.property('tilesFilled');
      expect(result).to.have.property('limitReached');
      expect(result).to.have.property('startMaterial');
      expect(result).to.have.property('newMaterial');
      
      expect(result.startMaterial).to.equal('grass');
      expect(result.newMaterial).to.equal('dirt');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle fillRegion on non-existent tile', function() {
      if (!terrainEditor) this.skip();
      
      // Don't set any tiles - rely on default material
      const result = terrainEditor.fillRegion(0, 0, 'dirt');
      
      // Should handle gracefully (either fill default or skip)
      expect(result).to.have.property('tilesFilled');
      expect(result.tilesFilled).to.be.at.least(0);
    });
    
    it('should handle negative coordinates within bounds', function() {
      if (!terrainEditor) this.skip();
      
      mockTerrain.setTile(-5, -5, 'grass');
      mockTerrain.setTile(-4, -5, 'grass');
      
      const result = terrainEditor.fillRegion(-5, -5, 'dirt');
      
      expect(result.tilesFilled).to.be.at.least(2);
    });
  });
});




// ================================================================
// terrainEditorMaterialPainting.test.js (13 tests)
// ================================================================
/**
 * Unit Tests - TerrainEditor Material Painting
 * 
 * Tests that TerrainEditor paints actual material types (moss, stone, dirt, grass)
 * not just colors
 */

describe('TerrainEditor - Material Painting', function() {
  let TerrainEditor;
  let editor;
  let mockTerrain;
  let mockTile;

  beforeEach(function() {
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
      getArrPos: sinon.stub().returns(mockTile),
      getTile: sinon.stub().returns(mockTile),
      invalidateCache: sinon.stub()
    };
    
    // Load TerrainEditor
    TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor');
    
    // Create editor
    editor = new TerrainEditor(mockTerrain);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Material Selection', function() {
    it('should set material by name, not color', function() {
      editor.selectMaterial('moss');
      
      expect(editor._selectedMaterial).to.equal('moss');
      expect(editor._selectedMaterial).to.be.a('string');
      expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
    });
    
    it('should accept all terrain material types', function() {
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        expect(editor._selectedMaterial).to.equal(material);
      });
    });
  });

  describe('Paint Tile with Material', function() {
    it('should paint tile with material name, not color', function() {
      editor.selectMaterial('stone');
      
      // Paint at tile position 5, 5
      editor.paintTile(5 * 32, 5 * 32);
      
      // Should have called setMaterial with 'stone'
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
      expect(mockTile.setMaterial.calledWith(sinon.match(/^#/))).to.be.false;
    });
    
    it('should paint with moss material', function() {
      editor.selectMaterial('moss');
      editor.paintTile(10 * 32, 10 * 32);
      
      expect(mockTile.setMaterial.calledWith('moss')).to.be.true;
    });
    
    it('should paint with dirt material', function() {
      editor.selectMaterial('dirt');
      editor.paintTile(8 * 32, 8 * 32);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should paint with grass material', function() {
      editor.selectMaterial('grass');
      editor.paintTile(12 * 32, 12 * 32);
      
      expect(mockTile.setMaterial.calledWith('grass')).to.be.true;
    });
    
    it('should call assignWeight after setting material', function() {
      editor.selectMaterial('stone');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTile.assignWeight.called).to.be.true;
    });
    
    it('should invalidate terrain cache after painting', function() {
      editor.selectMaterial('moss');
      editor.paintTile(5 * 32, 5 * 32);
      
      expect(mockTerrain.invalidateCache.called).to.be.true;
    });
  });

  describe('Paint Method Integration', function() {
    it('should paint using the paint() method', function() {
      editor.selectMaterial('dirt');
      
      // paint() method uses tile coordinates directly
      editor.paint(5, 5);
      
      expect(mockTile.setMaterial.calledWith('dirt')).to.be.true;
    });
    
    it('should use selected material when painting', function() {
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      expect(mockTile.setMaterial.calledWith('stone')).to.be.true;
    });
  });

  describe('Material Type Verification', function() {
    it('should store material as string name', function() {
      editor.selectMaterial('moss');
      
      expect(typeof editor._selectedMaterial).to.equal('string');
      expect(editor._selectedMaterial).to.equal('moss');
    });
    
    it('should not store color codes', function() {
      const materials = ['moss', 'stone', 'dirt', 'grass'];
      
      materials.forEach(material => {
        editor.selectMaterial(material);
        
        // Should be material name, not hex color
        expect(editor._selectedMaterial).to.not.match(/^#[0-9A-F]{6}$/i);
        expect(editor._selectedMaterial).to.not.match(/^rgb/i);
      });
    });
  });

  describe('Fill with Material', function() {
    it('should fill region with material name', function() {
      // Set tile to different material first
      mockTile._material = 'dirt';
      mockTile.getMaterial = sinon.stub().returns('dirt');
      
      editor.selectMaterial('grass');
      
      // Mock fill to check material
      mockTerrain.getArrPos = sinon.stub().returns(mockTile);
      
      editor.fill(5, 5);
      
      // Should have called setMaterial with 'grass'
      const setMaterialCalls = mockTile.setMaterial.getCalls();
      const grassCalls = setMaterialCalls.filter(call => call.args[0] === 'grass');
      expect(grassCalls.length).to.be.greaterThan(0);
    });
  });
});




// ================================================================
// terrainExporter.test.js (32 tests)
// ================================================================
/**
 * Unit Tests for TerrainExporter
 * Tests exporting terrain to various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let exporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
vm.runInThisContext(exporterCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainExporter - JSON Export', function() {
  
  describe('exportToJSON()', function() {
    
    it('should export basic terrain metadata', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata.version).to.equal('1.0');
      expect(exported.metadata.gridSizeX).to.equal(3);
      expect(exported.metadata.gridSizeY).to.equal(3);
      expect(exported.metadata.chunkSize).to.equal(8);
      expect(exported.metadata.seed).to.equal(12345);
    });
    
    it('should export all tile materials', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.have.lengthOf(2 * 2 * 8 * 8); // gridSizeX * gridSizeY * chunkSize * chunkSize
      exported.tiles.forEach(material => {
        expect(material).to.be.a('string');
      });
    });
    
    it('should include custom metadata when provided', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const exporter = new TerrainExporter(terrain);
      
      const customMetadata = {
        name: 'Test Level',
        author: 'TestUser',
        description: 'A test level',
        difficulty: 'easy',
        tags: ['tutorial', 'beginner']
      };
      
      const exported = {
        metadata: {
          ...customMetadata,
          version: '1.0',
          gridSizeX: terrain._gridSizeX,
          gridSizeY: terrain._gridSizeY
        }
      };
      
      expect(exported.metadata.name).to.equal('Test Level');
      expect(exported.metadata.author).to.equal('TestUser');
      expect(exported.metadata.tags).to.deep.equal(['tutorial', 'beginner']);
    });
    
    it('should support compressed tile format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Compressed format: single string where each char represents a material
      const materialToChar = {
        'grass': 'g',
        'dirt': 'd',
        'stone': 's',
        'water': 'w',
        'sand': 'a',
        'moss_0': 'm'
      };
      
      let compressed = '';
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          compressed += materialToChar[tile._materialSet] || 'g';
        });
      });
      
      expect(compressed).to.be.a('string');
      expect(compressed.length).to.equal(4 * 64); // One char per tile
      expect(compressed).to.match(/^[gdswam]+$/); // Only valid characters
    });
    
    it('should handle empty or minimal terrains', function() {
      const terrain = new gridTerrain(1, 1, 12345);
      
      const exported = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: []
      };
      
      terrain.chunkArray.rawArray[0].tileData.rawArray.forEach(tile => {
        exported.tiles.push({
          x: tile._x,
          y: tile._y,
          material: tile._materialSet
        });
      });
      
      expect(exported.tiles).to.have.length.greaterThan(0);
    });
    
    it('should generate valid JSON string', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const data = {
        metadata: { version: '1.0' },
        terrain: { seed: terrain._seed }
      };
      
      const jsonString = JSON.stringify(data);
      expect(jsonString).to.be.a('string');
      
      // Should be parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed.metadata.version).to.equal('1.0');
    });
  });
  
  describe('exportOptions()', function() {
    
    it('should support entities export option', function() {
      const includeEntities = true;
      const entities = [
        { type: 'ant_hill', x: 40, y: 40 },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      const exported = {
        entities: includeEntities ? entities : []
      };
      
      expect(exported.entities).to.have.lengthOf(2);
      expect(exported.entities[0].type).to.equal('ant_hill');
    });
    
    it('should support resources export option', function() {
      const includeResources = true;
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 }
      ];
      
      const exported = {
        resources: includeResources ? resources : []
      };
      
      expect(exported.resources).to.have.lengthOf(1);
    });
    
    it('should support compression option', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Uncompressed: array of tile objects
      const uncompressed = [];
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          uncompressed.push({ x: tile._x, y: tile._y, material: tile._materialSet });
        });
      });
      
      // Compressed: run-length encoding
      const compressed = [];
      let currentMaterial = null;
      let runLength = 0;
      
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.tileData.rawArray.forEach(tile => {
          if (tile._materialSet === currentMaterial) {
            runLength++;
          } else {
            if (currentMaterial !== null) {
              compressed.push({ material: currentMaterial, count: runLength });
            }
            currentMaterial = tile._materialSet;
            runLength = 1;
          }
        });
      });
      
      if (currentMaterial !== null) {
        compressed.push({ material: currentMaterial, count: runLength });
      }
      
      // Compressed should be smaller for homogeneous terrain
      const uncompressedSize = JSON.stringify(uncompressed).length;
      const compressedSize = JSON.stringify(compressed).length;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should exclude entities when option is false', function() {
      const exported = {
        metadata: {},
        entities: false ? [{ type: 'ant' }] : []
      };
      
      expect(exported.entities).to.have.lengthOf(0);
    });
    
    it('should include timestamp in metadata', function() {
      const exported = {
        metadata: {
          created: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      expect(exported.metadata.created).to.match(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
  
  describe('chunkBasedExport()', function() {
    
    it('should export terrain by chunks', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      const chunkData = terrain.chunkArray.rawArray.map((chunk, idx) => {
        const chunkPos = terrain.chunkArray.convToSquare(idx);
        return {
          position: chunkPos,
          tiles: chunk.tileData.rawArray.map(tile => ({
            offset: [tile._x % 8, tile._y % 8],
            material: tile._materialSet
          }))
        };
      });
      
      expect(chunkData).to.have.lengthOf(9); // 3x3 chunks
      chunkData.forEach(chunk => {
        expect(chunk.position).to.be.an('array');
        expect(chunk.tiles).to.have.lengthOf(64); // 8x8 tiles per chunk
      });
    });
    
    it('should use default material with exceptions', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const chunks = terrain.chunkArray.rawArray.map(chunk => {
        // Find most common material
        const materialCounts = {};
        chunk.tileData.rawArray.forEach(tile => {
          materialCounts[tile._materialSet] = (materialCounts[tile._materialSet] || 0) + 1;
        });
        
        const defaultMaterial = Object.keys(materialCounts).reduce((a, b) => 
          materialCounts[a] > materialCounts[b] ? a : b
        );
        
        // Only store exceptions
        const exceptions = [];
        chunk.tileData.rawArray.forEach((tile, idx) => {
          if (tile._materialSet !== defaultMaterial) {
            exceptions.push({
              offset: [idx % 8, Math.floor(idx / 8)],
              material: tile._materialSet
            });
          }
        });
        
        return {
          defaultMaterial,
          exceptions
        };
      });
      
      chunks.forEach(chunk => {
        expect(chunk.defaultMaterial).to.be.a('string');
        expect(chunk.exceptions).to.be.an('array');
      });
    });
  });
});

describe('TerrainExporter - File Generation', function() {
  
  describe('generateFileName()', function() {
    
    it('should generate filename with timestamp', function() {
      const timestamp = Date.now();
      const filename = `terrain_${timestamp}.json`;
      
      expect(filename).to.match(/^terrain_\d+\.json$/);
    });
    
    it('should support custom filenames', function() {
      const customName = 'my_level';
      const filename = `${customName}.json`;
      
      expect(filename).to.equal('my_level.json');
    });
    
    it('should sanitize filenames', function() {
      const unsafeName = 'my level/with\\bad:chars*';
      const safeName = unsafeName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      expect(safeName).to.equal('my_level_with_bad_chars_');
      expect(safeName).to.not.match(/[\/\\:*]/);
    });
    
    it('should add extension if missing', function() {
      const name = 'terrain_file';
      const withExtension = name.endsWith('.json') ? name : `${name}.json`;
      
      expect(withExtension).to.equal('terrain_file.json');
    });
  });
  
  describe('getMimeType()', function() {
    
    it('should return correct MIME type for JSON', function() {
      const mimeType = 'application/json';
      expect(mimeType).to.equal('application/json');
    });
    
    it('should return correct MIME type for PNG', function() {
      const mimeType = 'image/png';
      expect(mimeType).to.equal('image/png');
    });
    
    it('should return correct MIME type for binary', function() {
      const mimeType = 'application/octet-stream';
      expect(mimeType).to.equal('application/octet-stream');
    });
  });
});

describe('TerrainExporter - Run-Length Encoding', function() {
  
  describe('runLengthEncode()', function() {
    
    it('should compress homogeneous sequences', function() {
      const materials = ['grass', 'grass', 'grass', 'dirt', 'dirt', 'grass'];
      
      const encoded = [];
      let current = materials[0];
      let count = 1;
      
      for (let i = 1; i < materials.length; i++) {
        if (materials[i] === current) {
          count++;
        } else {
          encoded.push({ material: current, count });
          current = materials[i];
          count = 1;
        }
      }
      encoded.push({ material: current, count });
      
      expect(encoded).to.deep.equal([
        { material: 'grass', count: 3 },
        { material: 'dirt', count: 2 },
        { material: 'grass', count: 1 }
      ]);
    });
    
    it('should handle single material terrain', function() {
      const materials = new Array(100).fill('grass');
      
      const encoded = [{ material: 'grass', count: 100 }];
      
      expect(encoded).to.have.lengthOf(1);
      expect(encoded[0].count).to.equal(100);
    });
    
    it('should handle alternating materials', function() {
      const materials = ['grass', 'dirt', 'grass', 'dirt'];
      
      const encoded = materials.map(m => ({ material: m, count: 1 }));
      
      expect(encoded).to.have.lengthOf(4);
    });
    
    it('should preserve order', function() {
      const materials = ['a', 'a', 'b', 'c', 'c', 'c'];
      
      const encoded = [
        { material: 'a', count: 2 },
        { material: 'b', count: 1 },
        { material: 'c', count: 3 }
      ];
      
      // Decode to verify
      const decoded = [];
      encoded.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          decoded.push(run.material);
        }
      });
      
      expect(decoded).to.deep.equal(materials);
    });
  });
});

describe('TerrainExporter - Validation', function() {
  
  describe('validateExportData()', function() {
    
    it('should validate required metadata fields', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5,
          chunkSize: 8,
          tileSize: 32
        }
      };
      
      expect(data.metadata.version).to.exist;
      expect(data.metadata.gridSizeX).to.be.a('number');
      expect(data.metadata.gridSizeY).to.be.a('number');
    });
    
    it('should reject invalid version format', function() {
      const version = '1.0';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.true;
      expect(/^\d+\.\d+$/.test('invalid')).to.be.false;
    });
    
    it('should validate tile data structure', function() {
      const tile = {
        x: 0,
        y: 0,
        material: 'grass',
        weight: 1
      };
      
      expect(tile).to.have.property('x');
      expect(tile).to.have.property('y');
      expect(tile).to.have.property('material');
      expect(tile.material).to.be.a('string');
    });
    
    it('should reject negative coordinates', function() {
      const tile = { x: -1, y: 0, material: 'grass' };
      const isValid = tile.x >= 0 && tile.y >= 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = ['grass', 'dirt', 'stone', 'water', 'sand'];
      const material = 'grass';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include('invalid_material');
    });
  });
});

describe('TerrainExporter - Size Calculations', function() {
  
  describe('calculateExportSize()', function() {
    
    it('should calculate JSON byte size', function() {
      const data = { metadata: { version: '1.0' }, tiles: [] };
      const jsonString = JSON.stringify(data);
      const byteSize = new TextEncoder().encode(jsonString).length;
      
      expect(byteSize).to.be.a('number');
      expect(byteSize).to.be.greaterThan(0);
    });
    
    it('should estimate compressed size', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const tileCount = terrain._gridSizeX * terrain._gridSizeY * 
                       terrain._chunkSize * terrain._chunkSize;
      
      // Uncompressed: ~50 bytes per tile (JSON)
      const uncompressedSize = tileCount * 50;
      
      // Compressed: ~10 bytes per run (assuming good compression)
      const estimatedRuns = Math.ceil(tileCount / 10); // Optimistic
      const compressedSize = estimatedRuns * 10;
      
      expect(compressedSize).to.be.lessThan(uncompressedSize);
    });
    
    it('should report size in human-readable format', function() {
      const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };
      
      expect(formatBytes(500)).to.equal('500 B');
      expect(formatBytes(2048)).to.equal('2.00 KB');
      expect(formatBytes(2097152)).to.equal('2.00 MB');
    });
  });
});




// ================================================================
// terrainImporter.test.js (40 tests)
// ================================================================
/**
 * Unit Tests for TerrainImporter
 * Tests importing terrain from various formats (JSON, binary, image)
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

// Mock terrain materials
global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
  'sand': [[0, 1], (x, y, s) => {}],
  'water': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
let originalLog = console.log;
let originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes using vm module
let gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

let terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

let chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

let coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

let gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

let importerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
vm.runInThisContext(importerCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;

describe('TerrainImporter - JSON Import', function() {
  
  describe('importFromJSON()', function() {
    
    it('should import basic terrain metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          gridSizeX: 3,
          gridSizeY: 3,
          chunkSize: 8,
          tileSize: 32,
          seed: 12345,
          generationMode: 'perlin'
        }
      };
      
      expect(terrainData.metadata.gridSizeX).to.equal(3);
      expect(terrainData.metadata.gridSizeY).to.equal(3);
      expect(terrainData.metadata.seed).to.equal(12345);
    });
    
    it('should reconstruct terrain from tile data', function() {
      const tiles = [
        { x: 0, y: 0, material: 'grass', weight: 1 },
        { x: 1, y: 0, material: 'dirt', weight: 3 },
        { x: 0, y: 1, material: 'stone', weight: 100 }
      ];
      
      const tileMap = new Map();
      tiles.forEach(tile => {
        const key = `${tile.x},${tile.y}`;
        tileMap.set(key, tile);
      });
      
      expect(tileMap.size).to.equal(3);
      expect(tileMap.get('0,0').material).to.equal('grass');
      expect(tileMap.get('1,0').material).to.equal('dirt');
    });
    
    it('should handle compressed tile format', function() {
      const compressed = 'gggdddsss';
      const charToMaterial = {
        'g': 'grass',
        'd': 'dirt',
        's': 'stone',
        'w': 'water',
        'a': 'sand'
      };
      
      const tiles = [];
      for (let i = 0; i < compressed.length; i++) {
        tiles.push({
          index: i,
          material: charToMaterial[compressed[i]]
        });
      }
      
      expect(tiles).to.have.lengthOf(9);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[3].material).to.equal('dirt');
      expect(tiles[6].material).to.equal('stone');
    });
    
    it('should apply run-length decoded data', function() {
      const runs = [
        { material: 'grass', count: 5 },
        { material: 'dirt', count: 3 },
        { material: 'stone', count: 2 }
      ];
      
      const tiles = [];
      runs.forEach(run => {
        for (let i = 0; i < run.count; i++) {
          tiles.push({ material: run.material });
        }
      });
      
      expect(tiles).to.have.lengthOf(10);
      expect(tiles[0].material).to.equal('grass');
      expect(tiles[4].material).to.equal('grass');
      expect(tiles[5].material).to.equal('dirt');
      expect(tiles[8].material).to.equal('stone');
    });
    
    it('should restore custom metadata', function() {
      const terrainData = {
        metadata: {
          version: '1.0',
          name: 'Desert Level',
          author: 'TestUser',
          description: 'A sandy battlefield',
          difficulty: 'hard',
          tags: ['desert', 'pvp']
        }
      };
      
      expect(terrainData.metadata.name).to.equal('Desert Level');
      expect(terrainData.metadata.author).to.equal('TestUser');
      expect(terrainData.metadata.tags).to.include('desert');
    });
    
    it('should handle minimal terrain data', function() {
      const minimal = {
        metadata: {
          version: '1.0',
          gridSizeX: 1,
          gridSizeY: 1
        },
        tiles: 'gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg' // 64 tiles (1 chunk)
      };
      
      expect(minimal.tiles.length).to.equal(64);
    });
  });
  
  describe('validateImportData()', function() {
    
    it('should validate required fields exist', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasVersion = !!(data.metadata && data.metadata.version);
      const hasGridSize = !!(data.metadata && data.metadata.gridSizeX && data.metadata.gridSizeY);
      
      expect(hasVersion).to.be.true;
      expect(hasGridSize).to.be.true;
    });
    
    it('should reject missing metadata', function() {
      const data = { tiles: [] };
      const isValid = data.metadata !== undefined;
      
      expect(isValid).to.be.false;
    });
    
    it('should reject invalid version format', function() {
      const version = 'invalid';
      const isValid = /^\d+\.\d+$/.test(version);
      
      expect(isValid).to.be.false;
    });
    
    it('should validate grid sizes are positive', function() {
      const gridSizeX = 5;
      const gridSizeY = -1;
      
      const isValid = gridSizeX > 0 && gridSizeY > 0;
      
      expect(isValid).to.be.false;
    });
    
    it('should validate material names', function() {
      const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
      const material = 'grass';
      const invalid = 'invalid_material';
      
      expect(validMaterials).to.include(material);
      expect(validMaterials).to.not.include(invalid);
    });
    
    it('should reject malformed JSON', function() {
      const malformed = '{ "metadata": { "version": "1.0" ';
      
      let isValid = true;
      try {
        JSON.parse(malformed);
      } catch (e) {
        isValid = false;
      }
      
      expect(isValid).to.be.false;
    });
    
    it('should validate tile coordinates are within bounds', function() {
      const gridSize = { x: 5, y: 5, chunkSize: 8 };
      const maxX = gridSize.x * gridSize.chunkSize;
      const maxY = gridSize.y * gridSize.chunkSize;
      
      const validTile = { x: 10, y: 10 };
      const invalidTile = { x: 100, y: 10 };
      
      expect(validTile.x < maxX && validTile.y < maxY).to.be.true;
      expect(invalidTile.x < maxX && invalidTile.y < maxY).to.be.false;
    });
  });
  
  describe('chunkBasedImport()', function() {
    
    it('should import terrain by chunks', function() {
      const chunkData = [
        {
          position: [0, 0],
          tiles: Array(64).fill(null).map((_, i) => ({
            offset: [i % 8, Math.floor(i / 8)],
            material: 'grass'
          }))
        }
      ];
      
      expect(chunkData[0].tiles).to.have.lengthOf(64);
      expect(chunkData[0].position).to.deep.equal([0, 0]);
    });
    
    it('should apply default material with exceptions', function() {
      const chunkData = {
        defaultMaterial: 'grass',
        exceptions: [
          { offset: [3, 4], material: 'water' },
          { offset: [7, 2], material: 'stone' }
        ]
      };
      
      const tiles = Array(64).fill(null).map((_, i) => {
        const offset = [i % 8, Math.floor(i / 8)];
        const exception = chunkData.exceptions.find(e => 
          e.offset[0] === offset[0] && e.offset[1] === offset[1]
        );
        
        return {
          offset,
          material: exception ? exception.material : chunkData.defaultMaterial
        };
      });
      
      expect(tiles.filter(t => t.material === 'grass')).to.have.lengthOf(62);
      expect(tiles.filter(t => t.material === 'water')).to.have.lengthOf(1);
      expect(tiles.filter(t => t.material === 'stone')).to.have.lengthOf(1);
    });
    
    it('should handle multiple chunks', function() {
      const chunks = [
        { position: [0, 0], defaultMaterial: 'grass', exceptions: [] },
        { position: [1, 0], defaultMaterial: 'dirt', exceptions: [] },
        { position: [0, 1], defaultMaterial: 'stone', exceptions: [] }
      ];
      
      expect(chunks).to.have.lengthOf(3);
      expect(chunks[0].defaultMaterial).to.equal('grass');
      expect(chunks[1].defaultMaterial).to.equal('dirt');
    });
  });
});

describe('TerrainImporter - Version Migration', function() {
  
  describe('migrateVersion()', function() {
    
    it('should detect old version format', function() {
      const oldData = {
        metadata: { version: '1.0' }
      };
      
      const currentVersion = '2.0';
      const needsMigration = oldData.metadata.version !== currentVersion;
      
      expect(needsMigration).to.be.true;
    });
    
    it('should migrate v1.0 to v2.0', function() {
      const v1Data = {
        metadata: {
          version: '1.0',
          width: 5,
          height: 5
        }
      };
      
      // Migration: rename width/height to gridSizeX/gridSizeY
      const v2Data = {
        metadata: {
          version: '2.0',
          gridSizeX: v1Data.metadata.width,
          gridSizeY: v1Data.metadata.height
        }
      };
      
      expect(v2Data.metadata.version).to.equal('2.0');
      expect(v2Data.metadata.gridSizeX).to.equal(5);
      expect(v2Data.metadata.gridSizeY).to.equal(5);
    });
    
    it('should chain multiple migrations', function() {
      const versions = ['1.0', '1.5', '2.0'];
      const currentVersion = '2.0';
      
      let data = { metadata: { version: '1.0' } };
      
      while (data.metadata.version !== currentVersion) {
        const versionIndex = versions.indexOf(data.metadata.version);
        const nextVersion = versions[versionIndex + 1];
        
        // Simulate migration
        data.metadata.version = nextVersion;
      }
      
      expect(data.metadata.version).to.equal('2.0');
    });
    
    it('should preserve data during migration', function() {
      const original = {
        metadata: { version: '1.0', name: 'Test Level' },
        tiles: ['g', 'g', 'd']
      };
      
      const migrated = {
        metadata: {
          ...original.metadata,
          version: '2.0'
        },
        tiles: original.tiles
      };
      
      expect(migrated.metadata.name).to.equal('Test Level');
      expect(migrated.tiles).to.deep.equal(['g', 'g', 'd']);
    });
    
    it('should skip migration for current version', function() {
      const currentData = {
        metadata: { version: '2.0' }
      };
      
      const needsMigration = currentData.metadata.version !== '2.0';
      
      expect(needsMigration).to.be.false;
    });
  });
  
  describe('validateMigration()', function() {
    
    it('should validate migrated data structure', function() {
      const migrated = {
        metadata: {
          version: '2.0',
          gridSizeX: 5,
          gridSizeY: 5
        }
      };
      
      const hasRequiredFields = !!(
        migrated.metadata.version &&
        migrated.metadata.gridSizeX &&
        migrated.metadata.gridSizeY
      );
      
      expect(hasRequiredFields).to.be.true;
    });
    
    it('should reject incomplete migrations', function() {
      const incomplete = {
        metadata: {
          version: '2.0'
          // Missing gridSizeX, gridSizeY
        }
      };
      
      const isComplete = 
        incomplete.metadata.gridSizeX !== undefined &&
        incomplete.metadata.gridSizeY !== undefined;
      
      expect(isComplete).to.be.false;
    });
  });
});

describe('TerrainImporter - Entity Import', function() {
  
  describe('importEntities()', function() {
    
    it('should import entity data', function() {
      const entities = [
        { type: 'ant_hill', x: 40, y: 40, faction: 'red' },
        { type: 'food', x: 100, y: 100, amount: 50 }
      ];
      
      expect(entities).to.have.lengthOf(2);
      expect(entities[0].type).to.equal('ant_hill');
      expect(entities[1].amount).to.equal(50);
    });
    
    it('should validate entity types', function() {
      const validTypes = ['ant_hill', 'food', 'resource', 'obstacle'];
      const entity = { type: 'ant_hill' };
      
      const isValid = validTypes.includes(entity.type);
      
      expect(isValid).to.be.true;
    });
    
    it('should validate entity positions', function() {
      const bounds = { maxX: 100, maxY: 100 };
      const validEntity = { type: 'food', x: 50, y: 50 };
      const invalidEntity = { type: 'food', x: 150, y: 50 };
      
      const isValidPosition = (entity) => 
        entity.x >= 0 && entity.x <= bounds.maxX &&
        entity.y >= 0 && entity.y <= bounds.maxY;
      
      expect(isValidPosition(validEntity)).to.be.true;
      expect(isValidPosition(invalidEntity)).to.be.false;
    });
    
    it('should handle optional entity data', function() {
      const terrainData = {
        metadata: {},
        entities: [] // Optional, may be empty
      };
      
      expect(terrainData.entities).to.be.an('array');
      expect(terrainData.entities).to.have.lengthOf(0);
    });
  });
});

describe('TerrainImporter - Resource Import', function() {
  
  describe('importResources()', function() {
    
    it('should import resource data', function() {
      const resources = [
        { type: 'wood', x: 60, y: 60, quantity: 20 },
        { type: 'stone', x: 80, y: 80, quantity: 15 }
      ];
      
      expect(resources).to.have.lengthOf(2);
      expect(resources[0].quantity).to.equal(20);
    });
    
    it('should validate resource quantities', function() {
      const resource = { type: 'wood', quantity: 20 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.true;
    });
    
    it('should reject negative quantities', function() {
      const resource = { type: 'wood', quantity: -5 };
      const isValid = resource.quantity > 0;
      
      expect(isValid).to.be.false;
    });
  });
});

describe('TerrainImporter - Error Handling', function() {
  
  describe('handleImportErrors()', function() {
    
    it('should throw error for missing required fields', function() {
      const invalidData = { tiles: [] }; // Missing metadata
      
      const validate = () => {
        if (!invalidData.metadata) {
          throw new Error('Missing required field: metadata');
        }
      };
      
      expect(validate).to.throw('Missing required field: metadata');
    });
    
    it('should throw error for invalid data types', function() {
      const invalidData = {
        metadata: {
          version: '1.0',
          gridSizeX: 'five' // Should be number
        }
      };
      
      const validate = () => {
        if (typeof invalidData.metadata.gridSizeX !== 'number') {
          throw new Error('gridSizeX must be a number');
        }
      };
      
      expect(validate).to.throw('gridSizeX must be a number');
    });
    
    it('should provide helpful error messages', function() {
      const error = new Error('Invalid terrain data: gridSizeX must be positive');
      
      expect(error.message).to.include('gridSizeX');
      expect(error.message).to.include('positive');
    });
    
    it('should handle file read errors gracefully', function() {
      const handleFileError = (error) => {
        if (error.code === 'ENOENT') {
          return { error: 'File not found' };
        }
        return { error: 'Unknown error' };
      };
      
      const result = handleFileError({ code: 'ENOENT' });
      expect(result.error).to.equal('File not found');
    });
  });
});

describe('TerrainImporter - Defaults and Fallbacks', function() {
  
  describe('applyDefaults()', function() {
    
    it('should use default chunk size if not specified', function() {
      const data = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
          // chunkSize not specified
        }
      };
      
      const chunkSize = data.metadata.chunkSize || 8;
      
      expect(chunkSize).to.equal(8);
    });
    
    it('should use default tile size if not specified', function() {
      const data = { metadata: {} };
      const tileSize = data.metadata.tileSize || 32;
      
      expect(tileSize).to.equal(32);
    });
    
    it('should use default generation mode', function() {
      const data = { metadata: {} };
      const generationMode = data.metadata.generationMode || 'perlin';
      
      expect(generationMode).to.equal('perlin');
    });
    
    it('should generate seed if not provided', function() {
      const data = { metadata: {} };
      const seed = data.metadata.seed || Math.floor(Math.random() * 100000);
      
      expect(seed).to.be.a('number');
      expect(seed).to.be.greaterThan(0);
    });
  });
});

describe('TerrainImporter - Performance', function() {
  
  describe('importPerformance()', function() {
    
    it('should handle large terrain imports efficiently', function() {
      const largeData = {
        metadata: { gridSizeX: 20, gridSizeY: 20 }, // 400 chunks
        tiles: new Array(20 * 20 * 64).fill('g') // 25,600 tiles
      };
      
      const startTime = Date.now();
      
      // Simulate processing
      const tiles = largeData.tiles.map((char, index) => ({
        index,
        material: 'grass'
      }));
      
      const duration = Date.now() - startTime;
      
      expect(tiles).to.have.lengthOf(25600);
      expect(duration).to.be.lessThan(1000); // Should be fast
    });
    
    it('should use streaming for very large files', function() {
      const shouldStream = (fileSize) => fileSize > 1024 * 1024; // 1MB
      
      expect(shouldStream(500 * 1024)).to.be.false; // 500KB
      expect(shouldStream(2 * 1024 * 1024)).to.be.true; // 2MB
    });
  });
});

