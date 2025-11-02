/**
 * GridTerrain Integration Test Helper
 * Provides common setup for gridTerrain, pathfinding, and terrain system tests
 * 
 * Usage:
 *   const { setupGridTerrainTest, loadGridTerrainClasses, createMockGridTerrain } = require('../../helpers/gridTerrainTestHelper');
 * 
 *   beforeEach(function() {
 *     setupGridTerrainTest();
 *     loadGridTerrainClasses();
 *   });
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

let dom;

/**
 * Setup gridTerrain test environment
 * Creates comprehensive mocks for gridTerrain, pathfinding, and terrain materials
 */
function setupGridTerrainTest() {
  // Setup JSDOM
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;

  // Mock p5.js constants
  global.CHUNK_SIZE = 8;
  global.TILE_SIZE = 32;
  global.PERLIN_SCALE = 0.08;
  global.NONE = '\0';
  global.CORNER = 'corner';
  global.CENTER = 'center';
  global.g_canvasX = 800;
  global.g_canvasY = 600;

  // Mock p5.js functions
  global.floor = Math.floor;
  global.round = Math.round;
  global.ceil = Math.ceil;
  global.abs = Math.abs;
  global.sqrt = Math.sqrt;
  global.max = Math.max;
  global.min = Math.min;
  global.noise = (x, y) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  global.noiseSeed = () => {};
  global.noiseDetail = () => {};
  global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
  global.randomSeed = () => {};

  // Mock p5.js rendering
  global.createGraphics = (w, h) => ({
    width: w || 800,
    height: h || 600,
    _width: w,
    _height: h,
    push: sinon.stub(),
    pop: sinon.stub(),
    imageMode: sinon.stub(),
    image: sinon.stub(),
    noSmooth: sinon.stub(),
    smooth: sinon.stub(),
    clear: sinon.stub(),
    remove: sinon.stub(),
    translate: sinon.stub()
  });
  global.push = sinon.stub();
  global.pop = sinon.stub();
  global.imageMode = sinon.stub();
  global.image = sinon.stub();
  global.noSmooth = sinon.stub();
  global.smooth = sinon.stub();
  global.fill = sinon.stub();
  global.rect = sinon.stub();
  global.strokeWeight = sinon.stub();

  // Mock image objects
  global.GRASS_IMAGE = {};
  global.DIRT_IMAGE = {};
  global.STONE_IMAGE = {};
  global.MOSS_IMAGE = {};

  // Mock terrain materials (will be overwritten by terrianGen.js)
  global.TERRAIN_MATERIALS_RANGED = {
    'moss': [[0, 0.3], sinon.stub()],
    'moss_0': [[0, 0.3], sinon.stub()],
    'moss_1': [[0.375, 0.4], sinon.stub()],
    'stone': [[0, 0.4], sinon.stub()],
    'dirt': [[0.4, 0.525], sinon.stub()],
    'grass': [[0, 1], sinon.stub()]
  };

  // Mock rendering utilities
  global.renderMaterialToContext = sinon.stub();
  global.cameraManager = { cameraZoom: 1.0 };

  // Mock logging
  global.print = sinon.stub();
  global.logVerbose = sinon.stub();
  global.logInfo = sinon.stub();
  global.logError = sinon.stub();
  global.logNormal = sinon.stub();

  // Sync with window
  global.window.createGraphics = global.createGraphics;
  global.window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
  global.window.localStorage = {
    getItem: sinon.stub().returns(null),
    setItem: sinon.stub(),
    removeItem: sinon.stub(),
    clear: sinon.stub()
  };
}

// Track if classes are already loaded
let _gridTerrainClassesLoaded = false;
let _terrainEditorClassesLoaded = false;
let _pathfindingClassesLoaded = false;
let _uiClassesLoaded = false;

/**
 * Load gridTerrain-related classes using vm.runInThisContext
 * Loads: terrianGen, grid, chunk, gridTerrain, coordinateSystem
 */
function loadGridTerrainClasses() {
  // Skip if already loaded
  if (_gridTerrainClassesLoaded) {
    return;
  }
  _gridTerrainClassesLoaded = true;

  const basePath = path.join(__dirname, '../../Classes/terrainUtils');

  // Load in dependency order
  const terrianGenCode = fs.readFileSync(path.join(basePath, 'terrianGen.js'), 'utf8');
  vm.runInThisContext(terrianGenCode);

  const gridCode = fs.readFileSync(path.join(basePath, 'grid.js'), 'utf8');
  vm.runInThisContext(gridCode);

  const chunkCode = fs.readFileSync(path.join(basePath, 'chunk.js'), 'utf8');
  vm.runInThisContext(chunkCode);

  const gridTerrainCode = fs.readFileSync(path.join(basePath, 'gridTerrain.js'), 'utf8');
  vm.runInThisContext(gridTerrainCode);

  const coordinateSystemCode = fs.readFileSync(path.join(basePath, 'coordinateSystem.js'), 'utf8');
  vm.runInThisContext(coordinateSystemCode);
}

/**
 * Load terrain editor and exporter/importer classes
 */
function loadTerrainEditorClasses() {
  // Skip if already loaded
  if (_terrainEditorClassesLoaded) {
    return;
  }
  _terrainEditorClassesLoaded = true;

  const basePath = path.join(__dirname, '../../Classes/terrainUtils');

  const exporterCode = fs.readFileSync(path.join(basePath, 'TerrainExporter.js'), 'utf8');
  vm.runInThisContext(exporterCode);

  const importerCode = fs.readFileSync(path.join(basePath, 'TerrainImporter.js'), 'utf8');
  vm.runInThisContext(importerCode);

  const editorCode = fs.readFileSync(path.join(basePath, 'TerrainEditor.js'), 'utf8');
  vm.runInThisContext(editorCode);
}

/**
 * Load pathfinding classes
 */
function loadPathfindingClasses() {
  // Skip if already loaded
  if (_pathfindingClassesLoaded) {
    return;
  }
  _pathfindingClassesLoaded = true;

  const pathfindingCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/pathfinding/pathfinding.js'),
    'utf8'
  );
  vm.runInThisContext(pathfindingCode);
}

/**
 * Load UI components (MaterialPalette, ToolBar, SaveDialog, LoadDialog, etc.)
 */
function loadUIClasses() {
  // Skip if already loaded
  if (_uiClassesLoaded) {
    return;
  }
  _uiClassesLoaded = true;
  const materialPaletteCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/ui/painter/terrain/MaterialPalette.js'),
    'utf8'
  );
  vm.runInThisContext(materialPaletteCode);

  const toolBarCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/ui/_baseObjects/bar/toolBar/ToolBar.js'),
    'utf8'
  );
  vm.runInThisContext(toolBarCode);

  const saveDialogCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/ui/levelEditor/fileIO/SaveDialog.js'),
    'utf8'
  );
  vm.runInThisContext(saveDialogCode);

  const loadDialogCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/ui/levelEditor/fileIO/LoadDialog.js'),
    'utf8'
  );
  vm.runInThisContext(loadDialogCode);

  const localStorageManagerCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/ui/levelEditor/fileIO/LocalStorageManager.js'),
    'utf8'
  );
  vm.runInThisContext(localStorageManagerCode);

  const formatConverterCode = fs.readFileSync(
    path.join(__dirname, '../../Classes/ui/levelEditor/fileIO/FormatConverter.js'),
    'utf8'
  );
  vm.runInThisContext(formatConverterCode);
}

/**
 * Create mock gridTerrain instance
 * @param {number} chunksX - Number of chunks in X direction (default: 2)
 * @param {number} chunksY - Number of chunks in Y direction (default: 2)
 * @param {number} seed - Random seed (default: 12345)
 * @returns {gridTerrain} Mock terrain instance
 */
function createMockGridTerrain(chunksX = 2, chunksY = 2, seed = 12345) {
  const terrain = new gridTerrain(
    chunksX,
    chunksY,
    seed,
    8,                // chunkSize
    32,               // tileSize
    [800, 600],       // canvasSize
    'perlin'          // generationMode
  );

  // Store actual tile dimensions for tests
  terrain._actualTilesX = chunksX * 8;
  terrain._actualTilesY = chunksY * 8;

  return terrain;
}

/**
 * Cleanup gridTerrain test environment
 */
function cleanupGridTerrainTest() {
  sinon.restore();

  // Clean up globals
  delete global.window;
  delete global.document;
  delete global.CHUNK_SIZE;
  delete global.TILE_SIZE;
  delete global.PERLIN_SCALE;
  delete global.NONE;
  delete global.CORNER;
  delete global.CENTER;
  delete global.g_canvasX;
  delete global.g_canvasY;
  delete global.TERRAIN_MATERIALS_RANGED;
  delete global.GRASS_IMAGE;
  delete global.DIRT_IMAGE;
  delete global.STONE_IMAGE;
  delete global.MOSS_IMAGE;
  delete global.renderMaterialToContext;
  delete global.cameraManager;
  delete global.print;
  delete global.logVerbose;
  delete global.logInfo;
  delete global.logError;
  delete global.logNormal;

  // Clean up p5.js functions
  delete global.floor;
  delete global.round;
  delete global.ceil;
  delete global.abs;
  delete global.sqrt;
  delete global.max;
  delete global.min;
  delete global.noise;
  delete global.noiseSeed;
  delete global.noiseDetail;
  delete global.random;
  delete global.randomSeed;
  delete global.createGraphics;
  delete global.push;
  delete global.pop;
  delete global.imageMode;
  delete global.image;
  delete global.noSmooth;
  delete global.smooth;
  delete global.fill;
  delete global.rect;
  delete global.strokeWeight;
}

module.exports = {
  setupGridTerrainTest,
  loadGridTerrainClasses,
  loadTerrainEditorClasses,
  loadPathfindingClasses,
  loadUIClasses,
  createMockGridTerrain,
  cleanupGridTerrainTest
};
