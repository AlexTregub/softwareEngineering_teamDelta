/**
 * Shared Test Helper for Terrain Integration Tests
 * Consolidates common mocks and file loading
 * 
 * Usage:
 *   const { setupTerrainTest, cleanupTerrainTest, getMockP5 } = require('../helpers/terrainTestHelper');
 * 
 *   beforeEach(function() {
 *     setupTerrainTest();
 *   });
 * 
 *   afterEach(function() {
 *     cleanupTerrainTest();
 *   });
 */

const { JSDOM } = require('jsdom');
const sinon = require('sinon');

// Shared state
let dom;
let mockP5;

/**
 * Setup terrain test environment
 * Creates JSDOM, mocks p5.js, syncs global/window
 */
function setupTerrainTest() {
  // Create JSDOM environment
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true
  });
  
  global.window = dom.window;
  global.document = dom.window.document;
  
  // Mock p5.js functions (comprehensive set for all terrain tests)
  mockP5 = {
    // Drawing functions
    push: sinon.stub(),
    pop: sinon.stub(),
    imageMode: sinon.stub(),
    image: sinon.stub(),
    fill: sinon.stub(),
    noStroke: sinon.stub(),
    rect: sinon.stub(),
    noSmooth: sinon.stub(),
    background: sinon.stub(),
    
    // Graphics creation
    createGraphics: sinon.stub().returns({
      width: 800,
      height: 600,
      push: sinon.stub(),
      pop: sinon.stub(),
      imageMode: sinon.stub(),
      image: sinon.stub(),
      noSmooth: sinon.stub(),
      clear: sinon.stub(),
      remove: sinon.stub()
    }),
    
    // Constants
    CORNER: 'CORNER',
    CENTER: 'CENTER'
  };
  
  // Set p5.js globals
  global.push = mockP5.push;
  global.pop = mockP5.pop;
  global.imageMode = mockP5.imageMode;
  global.image = mockP5.image;
  global.fill = mockP5.fill;
  global.noStroke = mockP5.noStroke;
  global.rect = mockP5.rect;
  global.noSmooth = mockP5.noSmooth;
  global.background = mockP5.background;
  global.createGraphics = mockP5.createGraphics;
  global.CORNER = mockP5.CORNER;
  global.CENTER = mockP5.CENTER;
  
  // Sync with window
  global.window.push = global.push;
  global.window.pop = global.pop;
  global.window.imageMode = global.imageMode;
  global.window.image = global.image;
  global.window.fill = global.fill;
  global.window.noStroke = global.noStroke;
  global.window.rect = global.rect;
  global.window.noSmooth = global.noSmooth;
  global.window.background = global.background;
  global.window.createGraphics = global.createGraphics;
  global.window.CORNER = global.CORNER;
  global.window.CENTER = global.CENTER;
  
  // Mock TERRAIN_MATERIALS_RANGED (used by CustomTerrain)
  global.TERRAIN_MATERIALS_RANGED = {
    'grass': [[0, 1], sinon.stub()],
    'dirt': [[0, 1], sinon.stub()],
    'stone': [[0, 1], sinon.stub()],
    'moss': [[0, 1], sinon.stub()],
    'moss_0': [[0, 0.3], sinon.stub()],
    'moss_1': [[0.375, 0.4], sinon.stub()],
    'sand': [[0, 1], sinon.stub()],
    'water': [[0, 1], sinon.stub()]
  };
  global.window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
  
  // Mock logging functions
  global.logVerbose = sinon.stub();
  global.logInfo = sinon.stub();
  global.logError = sinon.stub();
  global.print = sinon.stub();
  
  global.window.logVerbose = global.logVerbose;
  global.window.logInfo = global.logInfo;
  global.window.logError = global.logError;
  global.window.print = global.print;
}

/**
 * Cleanup terrain test environment
 */
function cleanupTerrainTest() {
  sinon.restore();
  
  // Clean up globals
  delete global.window;
  delete global.document;
  delete global.TERRAIN_MATERIALS_RANGED;
  delete global.logVerbose;
  delete global.logInfo;
  delete global.logError;
  delete global.print;
  
  // Clean up p5.js globals
  delete global.push;
  delete global.pop;
  delete global.imageMode;
  delete global.image;
  delete global.fill;
  delete global.noStroke;
  delete global.rect;
  delete global.noSmooth;
  delete global.background;
  delete global.createGraphics;
  delete global.CORNER;
  delete global.CENTER;
}

/**
 * Get mock p5.js object for test assertions
 * @returns {Object} Mock p5.js with spy methods
 */
function getMockP5() {
  return mockP5;
}

/**
 * Get specific spy from mockP5
 * @param {string} name - Name of the spy (e.g., 'imageMode', 'image')
 * @returns {sinon.SinonStub}
 */
function getSpy(name) {
  return mockP5[name];
}

module.exports = {
  setupTerrainTest,
  cleanupTerrainTest,
  getMockP5,
  getSpy
};
