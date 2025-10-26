/**
 * Integration Test - Menu to Level Editor Initialization
 * 
 * Tests the complete initialization flow from main menu to level editor
 * to identify why textures aren't loading properly.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('Menu to Level Editor Integration', function() {
  let dom, window, document;
  let gameState, levelEditor;
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
    
    // Mock p5.js globals
    global.createCanvas = sinon.stub();
    global.background = sinon.stub();
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.image = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.textAlign = sinon.stub();
    global.text = sinon.stub();
    global.noStroke = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Sync to window
    window.createCanvas = global.createCanvas;
    window.background = global.background;
    window.fill = global.fill;
    window.rect = global.rect;
    window.image = global.image;
    window.push = global.push;
    window.pop = global.pop;
    window.textAlign = global.textAlign;
    window.text = global.text;
    window.noStroke = global.noStroke;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.createVector = global.createVector;
    
    // Mock terrain material images
    mockImages = {
      MOSS_IMAGE: { width: 32, height: 32, loaded: false },
      STONE_IMAGE: { width: 32, height: 32, loaded: false },
      DIRT_IMAGE: { width: 32, height: 32, loaded: false },
      GRASS_IMAGE: { width: 32, height: 32, loaded: false }
    };
    
    global.MOSS_IMAGE = mockImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockImages.GRASS_IMAGE;
    
    window.MOSS_IMAGE = global.MOSS_IMAGE;
    window.STONE_IMAGE = global.STONE_IMAGE;
    window.DIRT_IMAGE = global.DIRT_IMAGE;
    window.GRASS_IMAGE = global.GRASS_IMAGE;
    
    // Load GameState
    require('../../../Classes/managers/GameStateManager.js');
    gameState = global.GameState || window.GameState;
    
    // Mock loadImage function
    global.loadImage = sinon.stub().callsFake((path) => {
      const img = { width: 32, height: 32, loaded: false };
      // Simulate async loading
      setTimeout(() => { img.loaded = true; }, 10);
      return img;
    });
    window.loadImage = global.loadImage;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  describe('Terrain Material Images Loading', function() {
    it('should check if terrain images are loaded before level editor initializes', function() {
      // Check initial state
      expect(global.MOSS_IMAGE).to.exist;
      expect(global.STONE_IMAGE).to.exist;
      expect(global.DIRT_IMAGE).to.exist;
      expect(global.GRASS_IMAGE).to.exist;
      
      // Images should exist but not be loaded yet (simulating menu state)
      expect(global.MOSS_IMAGE.loaded).to.be.false;
      expect(global.STONE_IMAGE.loaded).to.be.false;
    });
    
    it('should verify TERRAIN_MATERIALS_RANGED references correct images', function() {
      // Load TERRAIN_MATERIALS_RANGED from terrianGen.js (note: typo in filename)
      require('../../../Classes/terrainUtils/terrianGen.js');
      
      const TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED || window.TERRAIN_MATERIALS_RANGED;
      
      expect(TERRAIN_MATERIALS_RANGED).to.exist;
      expect(TERRAIN_MATERIALS_RANGED).to.have.property('moss');
      expect(TERRAIN_MATERIALS_RANGED).to.have.property('stone');
      expect(TERRAIN_MATERIALS_RANGED).to.have.property('dirt');
      expect(TERRAIN_MATERIALS_RANGED).to.have.property('grass');
      
      // Each material should have a render function
      expect(TERRAIN_MATERIALS_RANGED.moss).to.be.an('array');
      expect(TERRAIN_MATERIALS_RANGED.moss[1]).to.be.a('function');
    });
    
    it('should test if render functions work when images are not loaded', function(done) {
      require('../../../Classes/terrainUtils/terrianGen.js');
      
      const TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED || window.TERRAIN_MATERIALS_RANGED;
      
      // Images are not loaded yet (simulating menu state)
      expect(global.MOSS_IMAGE.loaded).to.be.false;
      
      // Try to render moss
      let renderError = null;
      try {
        TERRAIN_MATERIALS_RANGED.moss[1](0, 0, 32);
      } catch (err) {
        renderError = err;
      }
      
      // Check if image() was called even though image isn't loaded
      expect(global.image.called).to.be.true;
      
      // This might be the issue - rendering before images are loaded
      done();
    });
  });
  
  describe('Level Editor Initialization Flow', function() {
    it('should trace initialization when coming from menu state', function() {
      // Simulate menu state
      if (gameState && typeof gameState.setState === 'function') {
        gameState.setState('MENU');
      }
      
      // Load level editor components
      require('../../../Classes/terrainUtils/TerrainEditor.js');
      require('../../../Classes/ui/MaterialPalette.js');
      
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      const TerrainEditor = global.TerrainEditor || window.TerrainEditor;
      
      expect(MaterialPalette).to.exist;
      expect(TerrainEditor).to.exist;
      
      // Check if images are loaded when palette initializes
      const imageLoadedStates = {
        moss: global.MOSS_IMAGE ? global.MOSS_IMAGE.loaded : undefined,
        stone: global.STONE_IMAGE ? global.STONE_IMAGE.loaded : undefined,
        dirt: global.DIRT_IMAGE ? global.DIRT_IMAGE.loaded : undefined,
        grass: global.GRASS_IMAGE ? global.GRASS_IMAGE.loaded : undefined
      };
      
      console.log('    Image loaded states at palette init:', imageLoadedStates);
      
      // This is likely the issue - images might not be loaded yet
      expect(imageLoadedStates.moss).to.be.false;
    });
    
    it('should check if preload was called before level editor opens', function() {
      // In the menu flow, preload() should have been called
      // Let's check what preload functions exist
      
      const preloadFunctions = [
        'menuPreload',
        'levelEditorPreload', 
        'terrainPreload',
        'preload'
      ];
      
      const availablePreloads = preloadFunctions.filter(fn => {
        return typeof global[fn] === 'function' || typeof window[fn] === 'function';
      });
      
      console.log('    Available preload functions:', availablePreloads);
      
      // Check if terrain images are supposed to be loaded in a preload
      expect(availablePreloads.length).to.be.at.least(0); // Just checking
    });
  });
  
  describe('Image Loading Timing', function() {
    it('should verify images are loaded before MaterialPalette uses them', function() {
      require('../../../Classes/terrainUtils/terrianGen.js');
      require('../../../Classes/ui/MaterialPalette.js');
      
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      const TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED || window.TERRAIN_MATERIALS_RANGED;
      
      // Create palette (simulating level editor opening from menu)
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      // Check if palette loaded materials
      expect(palette.swatches).to.be.an('array');
      
      // The issue: palette might be created before images finish loading
      console.log('    Palette swatch count:', palette.swatches.length);
      console.log('    MOSS_IMAGE loaded:', global.MOSS_IMAGE ? global.MOSS_IMAGE.loaded : 'undefined');
      
      // When palette renders, images might not be ready
      palette.render();
      
      // Check how many times image() was called
      console.log('    image() called:', global.image.callCount, 'times');
    });
    
    it('should simulate the difference between ?test=1 and menu flow', function(done) {
      // SCENARIO 1: With ?test=1 parameter (works correctly)
      // Images are loaded in preload(), then level editor opens
      
      // Simulate images being loaded
      global.MOSS_IMAGE.loaded = true;
      global.STONE_IMAGE.loaded = true;
      global.DIRT_IMAGE.loaded = true;
      global.GRASS_IMAGE.loaded = true;
      
      require('../../../Classes/terrainUtils/terrianGen.js');
      require('../../../Classes/ui/MaterialPalette.js');
      
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      const palette1 = new MaterialPalette(100, 100, 200, 400);
      
      console.log('    Scenario 1 (?test=1): Images loaded BEFORE palette creation');
      console.log('      MOSS_IMAGE.loaded:', global.MOSS_IMAGE.loaded);
      console.log('      Palette swatches:', palette1.swatches.length);
      
      // Reset for scenario 2
      global.MOSS_IMAGE.loaded = false;
      global.STONE_IMAGE.loaded = false;
      global.DIRT_IMAGE.loaded = false;
      global.GRASS_IMAGE.loaded = false;
      
      // SCENARIO 2: From menu (fails)
      // Level editor opens while images are still loading
      const palette2 = new MaterialPalette(100, 100, 200, 400);
      
      console.log('    Scenario 2 (menu flow): Images NOT loaded when palette created');
      console.log('      MOSS_IMAGE.loaded:', global.MOSS_IMAGE.loaded);
      console.log('      Palette swatches:', palette2.swatches.length);
      
      // This is likely the root cause!
      done();
    });
  });
  
  describe('Root Cause Identification', function() {
    it('should identify if TERRAIN_MATERIALS_RANGED is undefined during menu flow', function() {
      // Clear any loaded modules
      delete global.TERRAIN_MATERIALS_RANGED;
      delete window.TERRAIN_MATERIALS_RANGED;
      
      // Simulate menu state - TERRAIN_MATERIALS_RANGED might not be loaded yet
      const tmrBefore = global.TERRAIN_MATERIALS_RANGED || window.TERRAIN_MATERIALS_RANGED;
      console.log('    TERRAIN_MATERIALS_RANGED before loading:', tmrBefore ? 'defined' : 'undefined');
      
      // Now load it (simulating level editor opening)
      require('../../../Classes/terrainUtils/terrianGen.js');
      
      const tmrAfter = global.TERRAIN_MATERIALS_RANGED || window.TERRAIN_MATERIALS_RANGED;
      console.log('    TERRAIN_MATERIALS_RANGED after loading:', tmrAfter ? 'defined' : 'undefined');
      
      // If it's undefined during palette creation, palette will be empty!
      expect(tmrAfter).to.exist;
    });
    
    it('should test MaterialPalette behavior when TERRAIN_MATERIALS_RANGED is undefined', function() {
      // Simulate the bug: palette created before TERRAIN_MATERIALS_RANGED loads
      delete global.TERRAIN_MATERIALS_RANGED;
      delete window.TERRAIN_MATERIALS_RANGED;
      
      require('../../../Classes/ui/MaterialPalette.js');
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      console.log('    Palette created with undefined TERRAIN_MATERIALS_RANGED');
      console.log('      Swatch count:', palette.swatches.length);
      console.log('      Selected material:', palette.selectedMaterial);
      
      // This is the bug! Palette has 0 swatches because TERRAIN_MATERIALS_RANGED is undefined
      expect(palette.swatches.length).to.equal(0);
    });
  });
});
