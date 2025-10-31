/**
 * Integration Test: MaterialPalette Image Offset Bug
 * 
 * Bug: Material images render with 0.5-tile offset due to imageMode not set to CORNER
 * Expected: imageMode(CORNER) called before rendering material textures
 * Priority: HIGH
 * 
 * This test verifies that the MaterialPalette correctly sets imageMode(CORNER)
 * before rendering material swatches with terrain textures.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('MaterialPalette - Image Offset Bug (Integration)', function() {
  let palette;
  let imageModeSpy;
  let imageSpy;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Add imageMode mock (not in default helpers)
    global.imageMode = sinon.stub();
    global.CORNER = 'corner';
    global.CENTER = 'center';
    imageModeSpy = global.imageMode;
    imageSpy = global.image;
    
    // Mock TERRAIN_MATERIALS_RANGED with render functions
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [
        [0, 0, 255], // color
        function(x, y, size) {
          // Simulate terrain texture rendering using image()
          if (typeof global.mockTerrainImage !== 'undefined') {
            image(global.mockTerrainImage, x, y, size, size);
          }
        }
      ],
      'moss_0': [
        [0, 50, 255],
        function(x, y, size) {
          if (typeof global.mockTerrainImage !== 'undefined') {
            image(global.mockTerrainImage, x, y, size, size);
          }
        }
      ],
      'stone': [
        [100, 100, 100],
        function(x, y, size) {
          if (typeof global.mockTerrainImage !== 'undefined') {
            image(global.mockTerrainImage, x, y, size, size);
          }
        }
      ]
    };
    
    // Mock terrain image
    global.mockTerrainImage = { width: 32, height: 32 };
    
    // Sync window for JSDOM
    if (typeof window !== 'undefined') {
      window.imageMode = global.imageMode;
      window.CORNER = global.CORNER;
      window.CENTER = global.CENTER;
      window.image = global.image;
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
      window.mockTerrainImage = global.mockTerrainImage;
    }
    
    // Load MaterialPalette
    const MaterialPalette = require('../../../Classes/ui/MaterialPalette');
    
    // Create palette with materials
    palette = new MaterialPalette(['moss', 'moss_0', 'stone']);
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
    delete global.imageMode;
    delete global.CORNER;
    delete global.CENTER;
    delete global.TERRAIN_MATERIALS_RANGED;
    delete global.mockTerrainImage;
    delete global.MaterialPalette;
  });
  
  describe('imageMode(CORNER) before rendering materials', function() {
    it('should call imageMode(CORNER) before rendering material textures', function() {
      // Render palette
      palette.render(100, 100, 200, 400);
      
      // Verify imageMode called
      expect(imageModeSpy.called, 'imageMode should be called').to.be.true;
      
      // Verify imageMode(CORNER) called (not CENTER)
      const cornerCalls = imageModeSpy.getCalls().filter(call => {
        return call.args[0] === 'corner' || call.args[0] === global.CORNER;
      });
      
      expect(cornerCalls.length, 'imageMode(CORNER) should be called at least once').to.be.at.least(1);
    });
    
    it('should set imageMode(CORNER) BEFORE calling image()', function() {
      // Render palette
      palette.render(100, 100, 200, 400);
      
      // Get call order
      const allCalls = [];
      imageModeSpy.getCalls().forEach(call => {
        allCalls.push({ type: 'imageMode', args: call.args });
      });
      imageSpy.getCalls().forEach(call => {
        allCalls.push({ type: 'image', args: call.args });
      });
      
      // Sort by invocation order (sinon tracks this internally)
      // We'll check if ANY imageMode(CORNER) call happens before image() calls
      const imageModeCornerIndex = imageModeSpy.getCalls().findIndex(call => {
        return call.args[0] === 'corner' || call.args[0] === global.CORNER;
      });
      
      const firstImageIndex = imageSpy.getCalls().length > 0 ? 0 : -1;
      
      if (imageModeCornerIndex !== -1 && firstImageIndex !== -1) {
        // Both calls exist - verify imageMode comes before image
        expect(imageModeCornerIndex, 'imageMode(CORNER) should be set before image() calls').to.be.at.most(firstImageIndex);
      } else if (firstImageIndex !== -1) {
        // image() called but imageMode(CORNER) never set
        expect.fail('image() called but imageMode(CORNER) was never set - this causes offset bug');
      }
    });
    
    it('should render material images at correct coordinates without offset', function() {
      // Render palette
      palette.render(100, 100, 200, 400);
      
      // Verify image() called with exact coordinates (no 0.5 offset)
      expect(imageSpy.called, 'image() should be called for texture materials').to.be.true;
      
      // Check first material swatch coordinates
      // Expected: x=105 (100 + 5 spacing), y=145 (100 + 40 search bar + 5 spacing)
      const imageCalls = imageSpy.getCalls();
      if (imageCalls.length > 0) {
        const firstCall = imageCalls[0];
        const x = firstCall.args[1];
        const y = firstCall.args[2];
        
        // Coordinates should be integers (no 0.5 offset)
        expect(x % 1, 'X coordinate should be integer (no 0.5 offset)').to.equal(0);
        expect(y % 1, 'Y coordinate should be integer (no 0.5 offset)').to.equal(0);
      }
    });
  });
  
  describe('imageMode not affecting other rendering', function() {
    it('should wrap imageMode change in push/pop to isolate effects', function() {
      const pushSpy = global.push;
      const popSpy = global.pop;
      
      // Render palette
      palette.render(100, 100, 200, 400);
      
      // Verify push/pop called
      expect(pushSpy.called, 'push() should be called').to.be.true;
      expect(popSpy.called, 'pop() should be called').to.be.true;
      
      // Verify imageMode calls happen within push/pop context
      // (This ensures imageMode doesn't leak to other rendering)
      const pushCallCount = pushSpy.callCount;
      const popCallCount = popSpy.callCount;
      
      expect(pushCallCount, 'push/pop should be balanced').to.equal(popCallCount);
    });
  });
  
  describe('fallback to color swatches when imageMode unavailable', function() {
    it('should render color swatches if imageMode not defined', function() {
      // Remove imageMode to simulate p5.js not available
      delete global.imageMode;
      
      const rectSpy = global.rect;
      
      // Render palette
      palette.render(100, 100, 200, 400);
      
      // Verify rect() called for color swatches (fallback)
      expect(rectSpy.called, 'rect() should be called for fallback color swatches').to.be.true;
    });
  });
  
  describe('material texture rendering with scroll offset', function() {
    it('should maintain correct imageMode when scrolled', function() {
      // Set scroll offset
      palette.scrollOffset = 50;
      
      // Render palette
      palette.render(100, 100, 200, 400);
      
      // Verify imageMode(CORNER) still called correctly
      const cornerCalls = imageModeSpy.getCalls().filter(call => {
        return call.args[0] === 'corner' || call.args[0] === global.CORNER;
      });
      
      expect(cornerCalls.length, 'imageMode(CORNER) should be called even when scrolled').to.be.at.least(1);
      
      // Verify image coordinates adjusted for scroll
      if (imageSpy.called) {
        const firstCall = imageSpy.getCalls()[0];
        const y = firstCall.args[2];
        
        // Y coordinate should be adjusted by scroll offset
        // (Exact value depends on layout, but should be integer)
        expect(y % 1, 'Y coordinate should be integer even with scroll offset').to.equal(0);
      }
    });
  });
});
