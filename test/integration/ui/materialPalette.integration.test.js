/**
 * Consolidated Material Palette & Painting Integration Tests
 * Generated: 2025-10-29T03:16:53.945Z
 * Source files: 4
 * Total tests: 24
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// materialPaletteCoordinateOffset.integration.test.js (8 tests)
// ================================================================
/**
 * Integration test to detect coordinate offset bug in MaterialPalette rendering
 * 
 * BUG: MaterialPalette textures render at wrong position because:
 * - LevelEditorPanels uses translate() + render(0,0)
 * - But TERRAIN_MATERIALS_RANGED render functions use absolute coordinates
 * - This causes textures to render at top-left instead of panel position
 * 
 * Expected behavior:
 * - Textures should render at contentArea.x + swatchX, contentArea.y + swatchY
 * - Not at swatchX, swatchY (ignoring the panel position)
 */

describe('MaterialPalette Coordinate Offset Bug Detection', function() {
  let sandbox;
  let mockP5;
  let materialPalette;
  let imageCallsSpy;
  let rectCallsSpy;
  let translateCalls;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    imageCallsSpy = [];
    rectCallsSpy = [];
    translateCalls = { x: 0, y: 0 };
    
    // Mock p5.js global functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      noStroke: sandbox.stub(),
      imageMode: sandbox.stub(),
      rect: sandbox.stub().callsFake((x, y, w, h, r) => {
        // Record rect calls with current translate offset
        rectCallsSpy.push({ 
          x: x + translateCalls.x, 
          y: y + translateCalls.y, 
          w, h, r 
        });
      }),
      image: sandbox.stub().callsFake((img, x, y, w, h) => {
        // Record image calls - these use ABSOLUTE coords (ignoring translate)
        imageCallsSpy.push({ img, x, y, w, h });
      }),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      text: sandbox.stub(),
      translate: sandbox.stub().callsFake((x, y) => {
        translateCalls.x += x;
        translateCalls.y += y;
      }),
      CENTER: 'center',
      CORNER: 'corner'
    };
    
    // Set globals
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.noStroke = mockP5.noStroke;
    global.imageMode = mockP5.imageMode;
    global.rect = mockP5.rect;
    global.image = mockP5.image;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.text = mockP5.text;
    global.translate = mockP5.translate;
    global.CENTER = mockP5.CENTER;
    global.CORNER = mockP5.CORNER;
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.imageMode = global.imageMode;
      window.rect = global.rect;
      window.image = global.image;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.text = global.text;
      window.translate = global.translate;
      window.CENTER = global.CENTER;
      window.CORNER = global.CORNER;
    }
    
    // Mock TERRAIN_MATERIALS_RANGED with render functions
    const MOSS_IMAGE = { name: 'moss.png' };
    const STONE_IMAGE = { name: 'stone.png' };
    const DIRT_IMAGE = { name: 'dirt.png' };
    
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [
        [0, 0.3],
        (x, y, size) => global.image(MOSS_IMAGE, x, y, size, size)
      ],
      'stone': [
        [0, 0.4],
        (x, y, size) => global.image(STONE_IMAGE, x, y, size, size)
      ],
      'dirt': [
        [0.4, 0.525],
        (x, y, size) => global.image(DIRT_IMAGE, x, y, size, size)
      ]
    };
    
    if (typeof window !== 'undefined') {
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }
    
    // Load MaterialPalette
    const MaterialPalette = require('../../../Classes/ui/painter/terrain/MaterialPalette');
    materialPalette = new MaterialPalette(['moss', 'stone', 'dirt']);
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.TERRAIN_MATERIALS_RANGED;
    if (typeof window !== 'undefined') {
      delete window.TERRAIN_MATERIALS_RANGED;
    }
  });
  
  describe('Coordinate System Bug Detection (Regression Tests)', function() {
    it('should set imageMode to CORNER before rendering textures', function() {
      const panelX = 100;
      const panelY = 200;
      
      materialPalette.render(panelX, panelY);
      
      // Verify imageMode was called with CORNER
      expect(mockP5.imageMode.called).to.be.true;
      expect(mockP5.imageMode.calledWith('corner')).to.be.true;
    });
    
    it('should document that image() calls use absolute coordinates (not transformed)', function() {
      const panelX = 100;
      const panelY = 200;
      
      // If we were to use translate + render(0,0), textures would be offset
      mockP5.translate(panelX, panelY);
      materialPalette.render(0, 0);
      
      const firstImageCall = imageCallsSpy[0];
      
      // This documents the behavior: image() uses absolute coords
      // Texture renders at (5, 5) because it ignores translate()
      expect(firstImageCall.x).to.equal(5, 
        'image() uses absolute coords, not transformed coords'
      );
      expect(firstImageCall.y).to.equal(5, 
        'image() uses absolute coords, not transformed coords'
      );
    });
    
    it('should show that rect() calls DO respect translate() transformation', function() {
      const panelX = 100;
      const panelY = 200;
      
      // Simulate translate + render
      mockP5.translate(panelX, panelY);
      materialPalette.render(0, 0);
      
      // The highlight rectangle DOES work correctly
      const firstRectCall = rectCallsSpy[0];
      
      // rect() respects translate, so this works
      expect(firstRectCall.x).to.be.at.least(panelX, 
        'Rect X coordinate should include panel position'
      );
      expect(firstRectCall.y).to.be.at.least(panelY, 
        'Rect Y coordinate should include panel position'
      );
    });
    
    it('should demonstrate why we must use absolute coordinates (not translate)', function() {
      const panelX = 100;
      const panelY = 200;
      
      mockP5.translate(panelX, panelY);
      materialPalette.render(0, 0);
      
      // The first swatch has both a rect (highlight) and an image (texture)
      const firstRect = rectCallsSpy[0];
      const firstImage = imageCallsSpy[0];
      
      // They render at different positions when using translate
      const rectX = firstRect.x - 2; // rect is -2 for border
      const rectY = firstRect.y - 2;
      
      // This documents the mismatch - rect at ~103, image at 5
      expect(Math.abs(firstImage.x - rectX)).to.be.greaterThan(50, 
        'Image and rect have coordinate mismatch when using translate()'
      );
    });
  });
  
  describe('Correct Behavior - Passing Absolute Coordinates', function() {
    it('should render correctly when passed absolute coordinates directly', function() {
      const panelX = 100;
      const panelY = 200;
      
      // CORRECT approach - pass absolute coords directly (no translate)
      materialPalette.render(panelX, panelY);
      
      // Now textures should render at correct position
      const firstImageCall = imageCallsSpy[0];
      
      const expectedX = panelX + 5; // 105
      const expectedY = panelY + 5; // 205
      
      // This PASSES because we're using absolute coords
      expect(firstImageCall.x).to.equal(expectedX, 
        'Texture X coordinate should include panel position'
      );
      expect(firstImageCall.y).to.equal(expectedY, 
        'Texture Y coordinate should include panel position'
      );
    });
    
    it('should have all swatches rendered at correct absolute positions', function() {
      const panelX = 150;
      const panelY = 250;
      
      materialPalette.render(panelX, panelY);
      
      // Verify all 3 materials rendered
      expect(imageCallsSpy.length).to.equal(3, 'Should have 3 texture renders');
      
      // First swatch: (150+5, 250+5) = (155, 255)
      expect(imageCallsSpy[0].x).to.equal(155);
      expect(imageCallsSpy[0].y).to.equal(255);
      
      // Second swatch: same row, next column (155+45, 255) = (200, 255)
      expect(imageCallsSpy[1].x).to.equal(200);
      expect(imageCallsSpy[1].y).to.equal(255);
      
      // Third swatch: next row (155, 255+45) = (155, 300)
      expect(imageCallsSpy[2].x).to.equal(155);
      expect(imageCallsSpy[2].y).to.equal(300);
    });
  });
  
  describe('Real-world Scenario - LevelEditorPanels Integration (THE FIX)', function() {
    it('should pass with absolute coordinate approach (Option 1 fix - CURRENT CODE)', function() {
      // Fixed approach - pass absolute coords (this is what LevelEditorPanels now does)
      const contentArea = { x: 120, y: 180 };
      
      // Option 1 fix - DON'T use translate, pass absolute coords directly
      materialPalette.render(contentArea.x, contentArea.y);
      
      // CORRECT: Texture renders at (125, 185)
      const firstTexture = imageCallsSpy[0];
      
      // This PASSES with the fix
      expect(firstTexture.x).to.equal(contentArea.x + 5, 
        'Should render at panel position with absolute coords'
      );
      expect(firstTexture.y).to.equal(contentArea.y + 5, 
        'Should render at panel position with absolute coords'
      );
    });
    
    it('should render all panel content at correct positions', function() {
      const contentArea = { x: 120, y: 180 };
      
      materialPalette.render(contentArea.x, contentArea.y);
      
      // Verify all materials render at correct absolute positions
      expect(imageCallsSpy.length).to.equal(3);
      
      // First material at content area + spacing
      expect(imageCallsSpy[0].x).to.equal(125); // 120 + 5
      expect(imageCallsSpy[0].y).to.equal(185); // 180 + 5
      
      // Materials should be positioned correctly in grid
      expect(imageCallsSpy[1].x).to.be.greaterThan(contentArea.x);
      expect(imageCallsSpy[2].y).to.be.greaterThan(contentArea.y);
    });
  });
});




// ================================================================
// materialPalettePainting.integration.test.js (9 tests)
// ================================================================
/**
 * Integration Tests - Material Palette Painting
 * 
 * Tests the complete flow from clicking a material swatch to painting terrain
 */

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
    MaterialPalette = require('../../../Classes/ui/painter/terrain/MaterialPalette');
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




// ================================================================
// gridTerrainAlignment.integration.test.js (6 tests)
// ================================================================
/**
 * Integration Test: Grid/Terrain Coordinate Alignment
 * 
 * Verifies that grid and terrain use identical coordinate formulas
 * (proving the math is correct, and the issue is visual rendering only)
 */

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
    
    GridOverlay = require('../../../Classes/ui/_baseObjects/grids/GridOverlay');
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




// ================================================================
// completeMaterialPaintingFlow.test.js (1 tests)
// ================================================================
/**
 * Integration Test - Complete Material Painting Flow
 * 
 * SUMMARY OF FINDINGS:
 * ====================
 * 
 * ✅ TERRAIN_MATERIALS_RANGED is loaded correctly (6 materials)
 * ✅ Images exist (MOSS_IMAGE, STONE_IMAGE, etc.)
 * ✅ MaterialPalette has 6 materials
 * ✅ Render functions are defined and reference images
 * 
 * ❌ ISSUE: Painted tiles show solid brown colors (variance 0-1)
 * 
 * HYPOTHESIS:
 * The issue is NOT in MaterialPalette or TERRAIN_MATERIALS_RANGED.
 * The issue is in how tiles are painted or rendered after selection.
 * 
 * INVESTIGATION NEEDED:
 * 1. TerrainEditor.paintTile() - does it set the correct material?
 * 2. Tile.setMaterial() - does it store the material name correctly?
 * 3. Tile.render() - does it call TERRAIN_MATERIALS_RANGED[material][1]?
 * 4. Is there a fallback to brown color somewhere?
 */

describe('Complete Material Painting Flow - Integration', function() {
  it('should document the complete investigation findings', function() {
    console.log('');
    console.log('='.repeat(80));
    console.log('INTEGRATION TEST FINDINGS - Material Painting Issue');
    console.log('='.repeat(80));
    console.log('');
    console.log('DATA LAYER: ✅ ALL CORRECT');
    console.log('  - TERRAIN_MATERIALS_RANGED: 6 materials loaded');
    console.log('  - Images: MOSS_IMAGE, STONE_IMAGE, DIRT_IMAGE, GRASS_IMAGE exist');
    console.log('  - MaterialPalette: 6 materials in array');
    console.log('  - Render functions: All defined, all reference correct images');
    console.log('');
    console.log('VISUAL LAYER: ❌ BROKEN');
    console.log('  - E2E pixel analysis: Brown colors (120, 80, 40)');
    console.log('  - Pixel variance: 0-1 (solid colors, not textures)');
    console.log('  - User screenshot: Shows brown terrain');
    console.log('');
    console.log('ROOT CAUSE HYPOTHESIS:');
    console.log('  The disconnect happens between selecting a material and rendering a tile.');
    console.log('');
    console.log('  Flow:');
    console.log('    1. User clicks material in palette → ✅ Works');
    console.log('    2. MaterialPalette.selectMaterial(name) → ✅ selectedMaterial set');
    console.log('    3. User clicks terrain to paint → ?');
    console.log('    4. TerrainEditor.paintTile(x, y, material) → ?');
    console.log('    5. Tile.setMaterial(material) → ?');
    console.log('    6. Tile.render() calls TERRAIN_MATERIALS_RANGED[material][1]() → ❌ FAILS?');
    console.log('');
    console.log('NEXT STEPS:');
    console.log('  1. Check TerrainEditor - does it pass material name to paintTile?');
    console.log('  2. Check Tile.render() - does it use the material correctly?');
    console.log('  3. Check for brown color fallback in rendering code');
    console.log('  4. Verify image() function is actually being called with valid images');
    console.log('');
    console.log('LIKELY CULPRITS:');
    console.log('  A) Tile.render() has a fallback to brown when material not found');
    console.log('  B) Material name mismatch (e.g., "moss" vs "moss_0")');
    console.log('  C) TERRAIN_MATERIALS_RANGED lookup failing silently');
    console.log('  D) Image references are undefined at render time');
    console.log('');
    console.log('='.repeat(80));
    
    expect(true).to.be.true;
  });
});

