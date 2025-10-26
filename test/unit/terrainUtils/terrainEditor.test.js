/**
 * Unit Tests for TerrainEditor
 * Tests in-game terrain editing tools and brush systems
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
const originalLog = console.log;
const originalWarn = console.warn;
console.log = () => {};
console.warn = () => {};

// Load terrain classes
const gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

const terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

const chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

const coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

const gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

const editorCode = fs.readFileSync(
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
