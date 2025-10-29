/**
 * Integration Test - Level Editor Script Loading Order Issue
 * 
 * This test identifies the ROOT CAUSE of why textures don't load from the main menu.
 * 
 * KEY FINDING: MaterialPalette.js loads TERRAIN_MATERIALS_RANGED in its constructor,
 * but when coming from the menu, the terrain images (MOSS_IMAGE, STONE_IMAGE, etc.)
 * might not be fully loaded yet, even though terrainPreloader() was called.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('Level Editor Script Loading Order Issue', function() {
  let dom, window, document;
  
  beforeEach(function() {
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
    global.textAlign = sinon.stub();
    global.text = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.noStroke = sinon.stub();
    
    window.image = global.image;
    window.fill = global.fill;
    window.rect = global.rect;
    window.textAlign = global.textAlign;
    window.text = global.text;
    window.push = global.push;
    window.pop = global.pop;
    window.noStroke = global.noStroke;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
    delete global.TERRAIN_MATERIALS_RANGED;
    delete window.TERRAIN_MATERIALS_RANGED;
    delete global.MOSS_IMAGE;
    delete global.STONE_IMAGE;
    delete global.DIRT_IMAGE;
    delete global.GRASS_IMAGE;
  });
  
  describe('Root Cause: MaterialPalette loads before terrain images', function() {
    it('should show that MaterialPalette creates empty swatches when TERRAIN_MATERIALS_RANGED is undefined', function() {
      // SCENARIO: Menu loads, user clicks Level Editor BEFORE terrain images finish loading
      
      // Terrain images don't exist yet (or aren't loaded)
      expect(global.MOSS_IMAGE).to.be.undefined;
      expect(global.STONE_IMAGE).to.be.undefined;
      
      // TERRAIN_MATERIALS_RANGED doesn't exist yet
      expect(global.TERRAIN_MATERIALS_RANGED).to.be.undefined;
      expect(window.TERRAIN_MATERIALS_RANGED).to.be.undefined;
      
      // Load MaterialPalette (simulating LevelEditor opening)
      require('../../../Classes/ui/MaterialPalette.js');
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      
      // Create palette - THIS IS WHERE THE BUG OCCURS
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      // CRITICAL BUG: Palette has 0 swatches because TERRAIN_MATERIALS_RANGED is undefined!
      console.log('    🐛 Palette swatches when TERRAIN_MATERIALS_RANGED is undefined:', palette.swatches.length);
      expect(palette.swatches.length).to.equal(0);
      
      // When palette renders, it has nothing to show
      // When user clicks to select material, nothing happens
      // When user paints, selectedMaterial is used but it falls back to default color
    });
    
    it('should show that MaterialPalette.js reads TERRAIN_MATERIALS_RANGED at construction time', function() {
      // Let's verify MaterialPalette constructor behavior
      
      // Set up TERRAIN_MATERIALS_RANGED AFTER palette class is loaded but BEFORE instantiation
      global.TERRAIN_MATERIALS_RANGED = {
        'moss': [[0,0.3], sinon.stub()],
        'stone': [[0,0.4], sinon.stub()],
        'dirt': [[0.4,0.525], sinon.stub()],
        'grass': [[0,1], sinon.stub()]
      };
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
      
      // Load and create palette
      delete require.cache[require.resolve('../../../Classes/ui/MaterialPalette.js')];
      require('../../../Classes/ui/MaterialPalette.js');
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      // NOW it should have swatches
      console.log('    ✅ Palette swatches when TERRAIN_MATERIALS_RANGED exists:', palette.swatches.length);
      expect(palette.swatches.length).to.be.greaterThan(0);
    });
    
    it('should demonstrate the timing issue: ?test=1 vs menu flow', function() {
      // WORKING SCENARIO: With ?test=1 parameter
      // 1. preload() runs and loads images
      // 2. terrianGen.js loads and creates TERRAIN_MATERIALS_RANGED
      // 3. setup() runs
      // 4. User clicks Level Editor
      // 5. MaterialPalette is created with TERRAIN_MATERIALS_RANGED defined ✅
      
      console.log('    📋 Working flow (?test=1):');
      console.log('       1. preload() → terrainPreloader() → images loading...');
      console.log('       2. terrianGen.js loads → TERRAIN_MATERIALS_RANGED created');
      console.log('       3. MaterialPalette created → swatches loaded ✅');
      
      // BROKEN SCENARIO: From main menu
      // 1. preload() runs and loads images
      // 2. Menu shows
      // 3. User clicks Level Editor
      // 4. LevelEditor.js tries to create MaterialPalette
      // 5. BUT terrianGen.js might not be fully initialized yet
      // 6. TERRAIN_MATERIALS_RANGED might be undefined
      // 7. MaterialPalette gets 0 swatches ❌
      
      console.log('    🐛 Broken flow (from menu):');
      console.log('       1. preload() → images loading...');
      console.log('       2. Menu shows (user might click BEFORE images fully load)');
      console.log('       3. Level Editor opens');
      console.log('       4. MaterialPalette created → TERRAIN_MATERIALS_RANGED undefined?');
      console.log('       5. Palette has 0 swatches → no textures ❌');
      
      // This is a RACE CONDITION between:
      // - Image loading (async)
      // - User clicking Level Editor button
      // - MaterialPalette initialization
    });
  });
  
  describe('Verification: Check MaterialPalette constructor', function() {
    it('should verify MaterialPalette loads swatches from TERRAIN_MATERIALS_RANGED', function() {
      // Set up environment
      global.TERRAIN_MATERIALS_RANGED = {
        'moss': [[0,0.3], (x,y,s) => {}],
        'stone': [[0,0.4], (x,y,s) => {}],
        'dirt': [[0.4,0.525], (x,y,s) => {}],
        'grass': [[0,1], (x,y,s) => {}]
      };
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
      
      // Load MaterialPalette
      delete require.cache[require.resolve('../../../Classes/ui/MaterialPalette.js')];
      require('../../../Classes/ui/MaterialPalette.js');
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      
      // Create palette
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      // Verify swatches were created from TERRAIN_MATERIALS_RANGED
      expect(palette.swatches).to.be.an('array');
      expect(palette.swatches.length).to.equal(4); // moss, stone, dirt, grass
      
      // Check that each swatch has the material name
      const materialNames = palette.swatches.map(s => s.material);
      console.log('    Material names in palette:', materialNames);
      
      expect(materialNames).to.include('moss');
      expect(materialNames).to.include('stone');
      expect(materialNames).to.include('dirt');
      expect(materialNames).to.include('grass');
    });
  });
  
  describe('Solution Hypothesis', function() {
    it('should demonstrate that palette needs to check if TERRAIN_MATERIALS_RANGED exists', function() {
      console.log('    💡 SOLUTION: MaterialPalette should:');
      console.log('       1. Check if TERRAIN_MATERIALS_RANGED is defined');
      console.log('       2. If undefined, defer swatch loading');
      console.log('       3. Or provide a reload/refresh method');
      console.log('       4. Or LevelEditor should wait for TERRAIN_MATERIALS_RANGED before creating palette');
      
      // The fix could be in LevelEditor.initialize() or MaterialPalette constructor
      // Need to ensure TERRAIN_MATERIALS_RANGED is loaded before palette creation
    });
  });
});
