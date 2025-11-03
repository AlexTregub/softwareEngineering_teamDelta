/**
 * Integration Test - Tile Rendering Investigation
 * 
 * This test investigates the tile rendering phase to identify why
 * tiles show brown solid colors instead of textures.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('Tile Rendering Investigation', function() {
  let dom, window, document;
  let mockImages;
  
  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="defaultCanvas0"></canvas></body></html>', {
      url: 'http://localhost:8000',
      pretendToBeVisual: true
    });
    
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    
    // Mock p5.js functions
    global.image = sinon.stub();
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.noStroke = sinon.stub();
    
    window.image = global.image;
    window.fill = global.fill;
    window.rect = global.rect;
    window.push = global.push;
    window.pop = global.pop;
    window.noStroke = global.noStroke;
    
    // Mock terrain images
    mockImages = {
      MOSS_IMAGE: { width: 32, height: 32, loaded: true },
      STONE_IMAGE: { width: 32, height: 32, loaded: true },
      DIRT_IMAGE: { width: 32, height: 32, loaded: true },
      GRASS_IMAGE: { width: 32, height: 32, loaded: true }
    };
    
    global.MOSS_IMAGE = mockImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockImages.GRASS_IMAGE;
    
    window.MOSS_IMAGE = global.MOSS_IMAGE;
    window.STONE_IMAGE = global.STONE_IMAGE;
    window.DIRT_IMAGE = global.DIRT_IMAGE;
    window.GRASS_IMAGE = global.GRASS_IMAGE;
    
    // Set up TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'NONE': [[0,0], (x,y,s) => global.image(global.MOSS_IMAGE, x, y, s, s)],
      'moss': [[0,0.3], (x,y,s) => global.image(global.MOSS_IMAGE, x, y, s, s)],
      'stone': [[0,0.4], (x,y,s) => global.image(global.STONE_IMAGE, x, y, s, s)],
      'dirt': [[0.4,0.525], (x,y,s) => global.image(global.DIRT_IMAGE, x, y, s, s)],
      'grass': [[0,1], (x,y,s) => global.image(global.GRASS_IMAGE, x, y, s, s)]
    };
    window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  describe('Tile.render() Method Investigation', function() {
    it('should check what Tile.render() actually does', function() {
      // Load Tile class from gridTerrain.js
      require('../../../Classes/terrainUtils/gridTerrain.js');
      
      const Tile = global.Tile || window.Tile;
      expect(Tile).to.exist;
      
      // Create a tile
      const tile = new Tile(0, 0, 32);
      
      // Set material to 'moss'
      tile.setMaterial('moss');
      
      console.log('    Tile created and material set to "moss"');
      console.log('    Tile material property:', tile.material || tile._materialSet);
      
      // Try to render it
      global.image.resetHistory();
      global.fill.resetHistory();
      global.rect.resetHistory();
      
      tile.render();
      
      // Check what was called
      console.log('    After tile.render():');
      console.log('      image() called:', global.image.callCount, 'times');
      console.log('      fill() called:', global.fill.callCount, 'times');
      console.log('      rect() called:', global.rect.callCount, 'times');
      
      if (global.image.callCount > 0) {
        const imageCall = global.image.getCall(0);
        console.log('      image() called with:', imageCall.args);
        console.log('      First arg is MOSS_IMAGE?', imageCall.args[0] === global.MOSS_IMAGE);
      }
      
      if (global.fill.callCount > 0) {
        const fillCall = global.fill.getCall(0);
        console.log('      fill() called with:', fillCall.args);
        
        // Check if it's brown color
        if (fillCall.args.length === 3) {
          const [r, g, b] = fillCall.args;
          console.log('      RGB values:', { r, g, b });
          if (r > 100 && r < 180 && g > 40 && g < 100 && b > 0 && b < 50) {
            console.log('      ⚠️  BROWN COLOR DETECTED!');
          }
        }
      }
    });
    
    it('should check if Tile uses TERRAIN_MATERIALS_RANGED or falls back to color', function() {
      require('../../../Classes/terrainUtils/gridTerrain.js');
      
      const Tile = global.Tile || window.Tile;
      const tile = new Tile(0, 0, 32);
      
      // Test with material that exists in TERRAIN_MATERIALS_RANGED
      tile.setMaterial('moss');
      
      global.image.resetHistory();
      global.fill.resetHistory();
      
      tile.render();
      
      const usedImage = global.image.callCount > 0;
      const usedFill = global.fill.callCount > 0;
      
      console.log('    Material "moss":');
      console.log('      Used image()?', usedImage);
      console.log('      Used fill()?', usedFill);
      
      if (usedFill && !usedImage) {
        console.log('      🐛 Tile is using fill() instead of image() - this is the bug!');
      } else if (usedImage) {
        console.log('      ✓ Tile is using image() as expected');
      }
    });
    
    it('should test if Tile.render() source code uses TERRAIN_MATERIALS_RANGED', function() {
      require('../../../Classes/terrainUtils/gridTerrain.js');
      
      const Tile = global.Tile || window.Tile;
      
      // Check if Tile has a render method
      expect(Tile.prototype.render).to.be.a('function');
      
      // Get the source code of render method
      const renderSource = Tile.prototype.render.toString();
      
      console.log('    Tile.render() source code analysis:');
      console.log('      Contains "TERRAIN_MATERIALS_RANGED"?', renderSource.includes('TERRAIN_MATERIALS_RANGED'));
      console.log('      Contains "image("?', renderSource.includes('image('));
      console.log('      Contains "fill("?', renderSource.includes('fill('));
      console.log('      Contains "_materialSet"?', renderSource.includes('_materialSet'));
      console.log('      Contains "material"?', renderSource.includes('material'));
      
      // Look for specific patterns
      const hasTerrainLookup = /TERRAIN_MATERIALS_RANGED\[.*\]/.test(renderSource);
      const hasImageCall = /image\(/.test(renderSource);
      const hasFillCall = /fill\(/.test(renderSource);
      
      console.log('      Has TERRAIN_MATERIALS_RANGED lookup?', hasTerrainLookup);
      console.log('      Has image() call?', hasImageCall);
      console.log('      Has fill() call?', hasFillCall);
      
      // Print first 500 chars of render method
      console.log('\n      First 500 chars of render():');
      console.log('      ' + renderSource.substring(0, 500).split('\n').join('\n      '));
    });
    
    it('should check material name matching between palette and tile', function() {
      require('../../../Classes/terrainUtils/gridTerrain.js');
      require('../../../Classes/ui/MaterialPalette.js');
      
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      const Tile = global.Tile || window.Tile;
      
      // Create palette
      const palette = new MaterialPalette();
      
      console.log('    MaterialPalette materials:', palette.materials);
      console.log('    TERRAIN_MATERIALS_RANGED keys:', Object.keys(global.TERRAIN_MATERIALS_RANGED));
      
      // Check if all palette materials exist in TERRAIN_MATERIALS_RANGED
      const mismatches = [];
      palette.materials.forEach(material => {
        if (!global.TERRAIN_MATERIALS_RANGED[material]) {
          mismatches.push(material);
        }
      });
      
      if (mismatches.length > 0) {
        console.log('    🐛 MISMATCH FOUND! Materials in palette but not in TERRAIN_MATERIALS_RANGED:');
        mismatches.forEach(m => console.log('      -', m));
      } else {
        console.log('    ✓ All palette materials exist in TERRAIN_MATERIALS_RANGED');
      }
      
      // Test rendering with each palette material
      console.log('\n    Testing render for each material:');
      palette.materials.slice(0, 3).forEach(material => {
        const tile = new Tile(0, 0, 32);
        tile.setMaterial(material);
        
        global.image.resetHistory();
        global.fill.resetHistory();
        
        tile.render();
        
        console.log(`      ${material}: image=${global.image.callCount}, fill=${global.fill.callCount}`);
      });
    });
  });
  
  describe('TerrainEditor Paint Investigation', function() {
    it('should check how TerrainEditor.paintTile passes material name', function() {
      // Load TerrainEditor
      const TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor.js');
      
      expect(TerrainEditor).to.exist;
      
      // Check paintTile method
      const paintTileSource = TerrainEditor.prototype.paintTile.toString();
      
      console.log('    TerrainEditor.paintTile() analysis:');
      console.log('      Contains "setMaterial"?', paintTileSource.includes('setMaterial'));
      console.log('      Contains "material" parameter?', paintTileSource.includes('material'));
      
      // Print first 300 chars
      console.log('\n      First 300 chars of paintTile():');
      console.log('      ' + paintTileSource.substring(0, 300).split('\n').join('\n      '));
    });
  });
  
  describe('Render Function Direct Test', function() {
    it('should directly call TERRAIN_MATERIALS_RANGED render functions', function() {
      console.log('    Direct render function tests:');
      
      // Reset mocks
      global.image.resetHistory();
      
      // Call moss render function directly
      const mossRenderFunc = global.TERRAIN_MATERIALS_RANGED['moss'][1];
      expect(mossRenderFunc).to.be.a('function');
      
      mossRenderFunc(10, 10, 32);
      
      console.log('      Called moss render function directly');
      console.log('      image() called?', global.image.callCount > 0);
      if (global.image.callCount > 0) {
        const args = global.image.getCall(0).args;
        console.log('      image() args:', args);
        console.log('      First arg is MOSS_IMAGE?', args[0] === global.MOSS_IMAGE);
      }
      
      // Try with stone
      global.image.resetHistory();
      const stoneRenderFunc = global.TERRAIN_MATERIALS_RANGED['stone'][1];
      stoneRenderFunc(20, 20, 32);
      
      console.log('      Called stone render function directly');
      console.log('      image() called?', global.image.callCount > 0);
      if (global.image.callCount > 0) {
        const args = global.image.getCall(0).args;
        console.log('      First arg is STONE_IMAGE?', args[0] === global.STONE_IMAGE);
      }
    });
  });
});
