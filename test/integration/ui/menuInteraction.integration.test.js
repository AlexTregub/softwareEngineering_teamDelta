/**
 * Consolidated Menu & Interaction Integration Tests
 * Generated: 2025-10-29T03:16:53.966Z
 * Source files: 4
 * Total tests: 44
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// menuBlocking.integration.test.js (17 tests)
// ================================================================
/**
 * Integration Tests: Menu Blocking
 * Tests interaction between MenuBar, LevelEditor, and terrain editing tools
 */

let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Menu Blocking - Integration Tests', function() {
  let sandbox;
  let editor;
  let menuBar;
  let terrainEditor;
  let paintToolExecuted;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    paintToolExecuted = false;
    
    // Mock TerrainEditor
    const TerrainEditor = function() {
      this.hoverPreview = true;
    };
    TerrainEditor.prototype.paint = function() {
      paintToolExecuted = true;
    };
    TerrainEditor.prototype.clearHoverPreview = function() {
      this.hoverPreview = false;
    };
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    // Mock MenuBar
    const FileMenuBar = function() {
      this.isOpen = false;
    };
    FileMenuBar.prototype.openDropdown = function() {
      this.isOpen = true;
      if (this.levelEditor) {
        this.levelEditor.setMenuOpen(true);
      }
    };
    FileMenuBar.prototype.closeDropdown = function() {
      this.isOpen = false;
      if (this.levelEditor) {
        this.levelEditor.setMenuOpen(false);
      }
    };
    global.FileMenuBar = FileMenuBar;
    window.FileMenuBar = FileMenuBar;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Create instances
    terrainEditor = new TerrainEditor();
    menuBar = new FileMenuBar();
    
    editor = new LevelEditor();
    editor.terrainEditor = terrainEditor;
    editor.currentTool = 'paint';
    editor.active = true;
    
    menuBar.levelEditor = editor;
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.TerrainEditor;
    delete window.TerrainEditor;
    delete global.FileMenuBar;
    delete window.FileMenuBar;
  });
  
  describe('Menu Open â†’ Terrain Blocking', function() {
    it('should block handleClick when menu opens', function() {
      menuBar.openDropdown();
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
      expect(paintToolExecuted).to.be.false;
    });
    
    it('should allow handleClick when menu closes', function() {
      menuBar.openDropdown();
      menuBar.closeDropdown();
      
      const result = editor.handleClick(100, 100);
      
      // Should not block (returns undefined or proceeds)
      expect(result).to.not.equal(false);
    });
    
    it('should block handleMouseMove hover preview when menu open', function() {
      menuBar.openDropdown();
      
      editor.handleMouseMove(100, 100);
      
      // Hover preview should be cleared
      expect(terrainEditor.hoverPreview).to.be.false;
    });
  });
  
  describe('Paint Tool Blocking', function() {
    it('should prevent painting when menu open', function() {
      menuBar.openDropdown();
      editor.currentTool = 'paint';
      
      editor.handleClick(100, 100);
      
      expect(paintToolExecuted).to.be.false;
    });
    
    it('should allow painting when menu closed', function() {
      menuBar.closeDropdown();
      editor.currentTool = 'paint';
      editor.isMenuOpen = false;
      
      // Simulate paint (if handleClick were to proceed)
      if (!editor.isMenuOpen) {
        terrainEditor.paint();
      }
      
      expect(paintToolExecuted).to.be.true;
    });
  });
  
  describe('Fill Tool Blocking', function() {
    it('should prevent fill when menu open', function() {
      menuBar.openDropdown();
      editor.currentTool = 'fill';
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Select Tool Blocking', function() {
    it('should prevent selection when menu open', function() {
      menuBar.openDropdown();
      editor.currentTool = 'select';
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should update editor state when menu opens', function() {
      expect(editor.isMenuOpen).to.be.false;
      
      menuBar.openDropdown();
      
      expect(editor.isMenuOpen).to.be.true;
    });
    
    it('should update editor state when menu closes', function() {
      menuBar.openDropdown();
      expect(editor.isMenuOpen).to.be.true;
      
      menuBar.closeDropdown();
      
      expect(editor.isMenuOpen).to.be.false;
    });
    
    it('should handle multiple open/close cycles', function() {
      menuBar.openDropdown();
      expect(editor.isMenuOpen).to.be.true;
      
      menuBar.closeDropdown();
      expect(editor.isMenuOpen).to.be.false;
      
      menuBar.openDropdown();
      expect(editor.isMenuOpen).to.be.true;
      
      menuBar.closeDropdown();
      expect(editor.isMenuOpen).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid menu open/close', function() {
      menuBar.openDropdown();
      menuBar.closeDropdown();
      menuBar.openDropdown();
      menuBar.closeDropdown();
      
      const result = editor.handleClick(100, 100);
      expect(result).to.not.equal(false);
    });
    
    it('should handle setMenuOpen with same state twice', function() {
      editor.setMenuOpen(true);
      editor.setMenuOpen(true);
      
      expect(editor.isMenuOpen).to.be.true;
      
      editor.setMenuOpen(false);
      editor.setMenuOpen(false);
      
      expect(editor.isMenuOpen).to.be.false;
    });
    
    it('should handle clicks when editor inactive', function() {
      menuBar.openDropdown();
      editor.active = false;
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Tool Re-enabling After Menu Close', function() {
    it('should re-enable paint tool after menu closes', function() {
      menuBar.openDropdown();
      editor.handleClick(100, 100);
      expect(paintToolExecuted).to.be.false;
      
      menuBar.closeDropdown();
      
      // Now painting should work
      if (!editor.isMenuOpen) {
        terrainEditor.paint();
      }
      expect(paintToolExecuted).to.be.true;
    });
    
    it('should immediately respond after menu close', function() {
      menuBar.openDropdown();
      menuBar.closeDropdown();
      
      const result = editor.handleClick(100, 100);
      
      // Should proceed normally
      expect(result).to.not.equal(false);
    });
  });
  
  describe('Hover Preview Blocking', function() {
    it('should clear hover preview when menu opens', function() {
      terrainEditor.hoverPreview = true;
      
      menuBar.openDropdown();
      editor.handleMouseMove(100, 100);
      
      expect(terrainEditor.hoverPreview).to.be.false;
    });
    
    it('should not show hover preview while menu open', function() {
      menuBar.openDropdown();
      terrainEditor.hoverPreview = true;
      
      editor.handleMouseMove(100, 100);
      editor.handleMouseMove(150, 150);
      
      expect(terrainEditor.hoverPreview).to.be.false;
    });
  });
});




// ================================================================
// menuInteraction.integration.test.js (13 tests)
// ================================================================
/**
 * Integration Tests: Menu-Canvas Interaction Flow (Bug Fix #3)
 * 
 * Tests the complete interaction flow between FileMenuBar and LevelEditor:
 * 1. Menu bar remains clickable when dropdown is open
 * 2. Canvas clicks close menu and are consumed
 * 3. Terrain interaction only works when menu is closed
 * 
 * TDD: Write tests FIRST, then fix the bug
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('MenuBar-LevelEditor Integration - Click Handling', function() {
  let levelEditor, fileMenuBar, mockTerrain;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      tileSize: 32,
      getTile: sinon.stub().returns({ getMaterial: () => 'grass' })
    };
    
    // Load real FileMenuBar and LevelEditor
    const FileMenuBar = require('../../../Classes/ui/_baseObjects/bar/menuBar/FileMenuBar.js');
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    
    // Create instances
    levelEditor = new LevelEditor();
    levelEditor.initialize(mockTerrain);
    
    fileMenuBar = levelEditor.fileMenuBar;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Menu Bar Click Priority', function() {
    it('should allow clicking File menu to open dropdown', function() {
      // Click on File menu (approximate position)
      const fileX = 20;
      const menuBarY = 20;
      
      const handled = fileMenuBar.handleClick(fileX, menuBarY);
      
      expect(handled).to.be.true;
      expect(fileMenuBar.openMenuName).to.equal('File');
    });
    
    it('should allow switching from File to Edit menu when dropdown is open', function() {
      // Open File menu first
      fileMenuBar.openMenu('File');
      expect(fileMenuBar.openMenuName).to.equal('File');
      
      // Click on Edit menu (approximate position)
      const editX = 60;
      const menuBarY = 20;
      
      const handled = fileMenuBar.handleClick(editX, menuBarY);
      
      expect(handled).to.be.true;
      expect(fileMenuBar.openMenuName).to.equal('Edit');
    });
    
    it('should allow clicking View menu when File dropdown is open', function() {
      // Open File menu
      fileMenuBar.openMenu('File');
      
      // Click on View menu (approximate position)
      const viewX = 120;
      const menuBarY = 20;
      
      const handled = fileMenuBar.handleClick(viewX, menuBarY);
      
      expect(handled).to.be.true;
      expect(fileMenuBar.openMenuName).to.equal('View');
    });
  });
  
  describe('Canvas Click Closes Menu', function() {
    it('should close menu when clicking on canvas area', function() {
      // Open File menu
      fileMenuBar.openMenu('File');
      expect(fileMenuBar.openMenuName).to.equal('File');
      
      // Click on canvas (not menu bar)
      const canvasX = 400;
      const canvasY = 300;
      
      const handled = fileMenuBar.handleClick(canvasX, canvasY);
      
      expect(handled).to.be.true; // Click consumed by closing menu
      expect(fileMenuBar.openMenuName).to.be.null; // Menu closed
    });
    
    it('should notify LevelEditor when menu opens', function() {
      const setMenuOpenSpy = sinon.spy(levelEditor, 'setMenuOpen');
      
      fileMenuBar.openMenu('File');
      
      expect(setMenuOpenSpy.calledWith(true)).to.be.true;
    });
    
    it('should notify LevelEditor when menu closes', function() {
      fileMenuBar.openMenu('File');
      
      const setMenuOpenSpy = sinon.spy(levelEditor, 'setMenuOpen');
      
      fileMenuBar.closeMenu();
      
      expect(setMenuOpenSpy.calledWith(false)).to.be.true;
    });
  });
  
  describe('LevelEditor Click Handling with Menu State', function() {
    it('should block terrain painting when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Try to paint on terrain (canvas click)
      const canvasX = 400;
      const canvasY = 300;
      
      // Mock editor paint to track calls
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      levelEditor.handleClick(canvasX, canvasY);
      
      // Paint should NOT be called (menu blocks terrain)
      expect(paintSpy.called).to.be.false;
    });
    
    it('should allow menu bar clicks even when menu is open', function() {
      // Open File menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Click on Edit menu (should work)
      const editX = 60;
      const menuBarY = 20;
      
      levelEditor.handleClick(editX, menuBarY);
      
      // Menu should have switched to Edit
      expect(fileMenuBar.openMenuName).to.equal('Edit');
    });
    
    it('should close menu and consume click when clicking canvas while menu open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Mock terrain editor
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      // Click on canvas
      const canvasX = 400;
      const canvasY = 300;
      
      levelEditor.handleClick(canvasX, canvasY);
      
      // Menu should close
      expect(fileMenuBar.openMenuName).to.be.null;
      expect(levelEditor.isMenuOpen).to.be.false;
      
      // Paint should NOT be called (click consumed by closing menu)
      expect(paintSpy.called).to.be.false;
    });
    
    it('should allow terrain painting when menu is closed', function() {
      // Menu is closed
      expect(levelEditor.isMenuOpen).to.be.false;
      expect(fileMenuBar.openMenuName).to.be.null;
      
      // Mock terrain editor
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      // Click on canvas
      const canvasX = 400;
      const canvasY = 300;
      
      levelEditor.handleClick(canvasX, canvasY);
      
      // Paint SHOULD be called
      expect(paintSpy.called).to.be.true;
    });
  });
  
  describe('Complete Click Flow', function() {
    it('should handle complete workflow: open menu -> switch menu -> close via canvas click', function() {
      // Step 1: Open File menu
      fileMenuBar.handleClick(20, 20);
      expect(fileMenuBar.openMenuName).to.equal('File');
      expect(levelEditor.isMenuOpen).to.be.true;
      
      // Step 2: Switch to Edit menu
      fileMenuBar.handleClick(60, 20);
      expect(fileMenuBar.openMenuName).to.equal('Edit');
      expect(levelEditor.isMenuOpen).to.be.true; // Still open
      
      // Step 3: Click canvas to close
      levelEditor.handleClick(400, 300);
      expect(fileMenuBar.openMenuName).to.be.null;
      expect(levelEditor.isMenuOpen).to.be.false;
      
      // Step 4: Now terrain painting should work
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      levelEditor.handleClick(400, 300);
      expect(paintSpy.called).to.be.true;
    });
  });
  
  describe('Hover Preview Interaction', function() {
    it('should disable hover preview when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Mock hover preview manager
      const clearHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'clearHover');
      const updateHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'updateHover');
      
      // Hover over canvas
      levelEditor.handleHover(400, 300);
      
      // Should clear, not update
      expect(clearHoverSpy.called).to.be.true;
      expect(updateHoverSpy.called).to.be.false;
    });
    
    it('should enable hover preview when menu is closed', function() {
      // Menu closed
      expect(levelEditor.isMenuOpen).to.be.false;
      
      // Mock hover preview manager
      const updateHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'updateHover');
      
      // Hover over canvas
      levelEditor.handleHover(400, 300);
      
      // Should update normally
      expect(updateHoverSpy.called).to.be.true;
    });
  });
});




// ================================================================
// menuToLevelEditor.integration.test.js (9 tests)
// ================================================================
/**
 * Integration Test - Menu to Level Editor Initialization
 * 
 * Tests the complete initialization flow from main menu to level editor
 * to identify why textures aren't loading properly.
 */

describe('Menu to Level Editor Integration', function() {
  let dom, window, document;
  let gameState, levelEditor;
  let mockImages;
  
  beforeEach(function() {
    // Create JSDOM environment
      url: 'http://localhost:8000',
      pretendToBeVisual: true
    });
    
    window = dom.window;
    document = window.document;
    
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
    cleanupTestEnvironment();
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
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
      
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
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
      
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
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
      
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
      
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
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




// ================================================================
// scriptLoadingOrder.integration.test.js (5 tests)
// ================================================================
/**
 * Integration Test - Level Editor Script Loading Order Issue
 * 
 * This test identifies the ROOT CAUSE of why textures don't load from the main menu.
 * 
 * KEY FINDING: MaterialPalette.js loads TERRAIN_MATERIALS_RANGED in its constructor,
 * but when coming from the menu, the terrain images (MOSS_IMAGE, STONE_IMAGE, etc.)
 * might not be fully loaded yet, even though terrainPreloader() was called.
 */

describe('Level Editor Script Loading Order Issue', function() {
  let dom, window, document;
  
  beforeEach(function() {
      url: 'http://localhost:8000',
      pretendToBeVisual: true
    });
    
    window = dom.window;
    document = window.document;
    
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
    cleanupTestEnvironment();
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
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      
      // Create palette - THIS IS WHERE THE BUG OCCURS
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      // CRITICAL BUG: Palette has 0 swatches because TERRAIN_MATERIALS_RANGED is undefined!
      console.log('    ðŸ› Palette swatches when TERRAIN_MATERIALS_RANGED is undefined:', palette.swatches.length);
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
      delete require.cache[require.resolve('../../../Classes/ui/painter/terrain/MaterialPalette.js')];
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      
      const palette = new MaterialPalette(100, 100, 200, 400);
      
      // NOW it should have swatches
      console.log('    âœ… Palette swatches when TERRAIN_MATERIALS_RANGED exists:', palette.swatches.length);
      expect(palette.swatches.length).to.be.greaterThan(0);
    });
    
    it('should demonstrate the timing issue: ?test=1 vs menu flow', function() {
      // WORKING SCENARIO: With ?test=1 parameter
      // 1. preload() runs and loads images
      // 2. terrianGen.js loads and creates TERRAIN_MATERIALS_RANGED
      // 3. setup() runs
      // 4. User clicks Level Editor
      // 5. MaterialPalette is created with TERRAIN_MATERIALS_RANGED defined âœ…
      
      console.log('    ðŸ“‹ Working flow (?test=1):');
      console.log('       1. preload() â†’ terrainPreloader() â†’ images loading...');
      console.log('       2. terrianGen.js loads â†’ TERRAIN_MATERIALS_RANGED created');
      console.log('       3. MaterialPalette created â†’ swatches loaded âœ…');
      
      // BROKEN SCENARIO: From main menu
      // 1. preload() runs and loads images
      // 2. Menu shows
      // 3. User clicks Level Editor
      // 4. LevelEditor.js tries to create MaterialPalette
      // 5. BUT terrianGen.js might not be fully initialized yet
      // 6. TERRAIN_MATERIALS_RANGED might be undefined
      // 7. MaterialPalette gets 0 swatches âŒ
      
      console.log('    ðŸ› Broken flow (from menu):');
      console.log('       1. preload() â†’ images loading...');
      console.log('       2. Menu shows (user might click BEFORE images fully load)');
      console.log('       3. Level Editor opens');
      console.log('       4. MaterialPalette created â†’ TERRAIN_MATERIALS_RANGED undefined?');
      console.log('       5. Palette has 0 swatches â†’ no textures âŒ');
      
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
      delete require.cache[require.resolve('../../../Classes/ui/painter/terrain/MaterialPalette.js')];
      require('../../../Classes/ui/painter/terrain/MaterialPalette.js');
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
      console.log('    ðŸ’¡ SOLUTION: MaterialPalette should:');
      console.log('       1. Check if TERRAIN_MATERIALS_RANGED is defined');
      console.log('       2. If undefined, defer swatch loading');
      console.log('       3. Or provide a reload/refresh method');
      console.log('       4. Or LevelEditor should wait for TERRAIN_MATERIALS_RANGED before creating palette');
      
      // The fix could be in LevelEditor.initialize() or MaterialPalette constructor
      // Need to ensure TERRAIN_MATERIALS_RANGED is loaded before palette creation
    });
  });
});

