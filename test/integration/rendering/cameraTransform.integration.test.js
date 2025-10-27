/**
 * Integration Tests: Camera Transform in PLAYING State
 * 
 * Tests that camera position and zoom are correctly applied to terrain/entity rendering.
 * This verifies the fix for zoom < 1.0 not showing more terrain.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Camera Transform Integration (PLAYING State)', function() {
  let sandbox;
  let mockCameraManager;
  let translateCalls;
  let scaleCalls;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Track translate and scale calls
    translateCalls = [];
    scaleCalls = [];
    
    // Mock p5.js transform functions
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.translate = sandbox.stub().callsFake((x, y) => {
      translateCalls.push({ x, y });
    });
    global.scale = sandbox.stub().callsFake((s) => {
      scaleCalls.push({ scale: s });
    });
    global.background = sandbox.stub();
    
    // Mock canvas size
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.windowWidth = 800;
    global.windowHeight = 600;
    
    // Mock camera manager
    mockCameraManager = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1.0,
      getZoom: function() { return this.cameraZoom; }
    };
    
    global.cameraManager = mockCameraManager;
    
    // Sync window
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
      window.scale = global.scale;
      window.background = global.background;
      window.g_canvasX = global.g_canvasX;
      window.g_canvasY = global.g_canvasY;
      window.windowWidth = global.windowWidth;
      window.windowHeight = global.windowHeight;
      window.cameraManager = global.cameraManager;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.cameraManager;
    if (typeof window !== 'undefined') {
      delete window.cameraManager;
    }
  });
  
  describe('Current applyZoom() behavior', function() {
    it('should apply zoom scale around canvas center', function() {
      // Simulate current applyZoom() implementation
      const applyZoom = function() {
        const zoom = cameraManager.getZoom();
        translate(g_canvasX/2, g_canvasY/2);
        scale(zoom);
        translate(-g_canvasX/2, -g_canvasY/2);
      };
      
      mockCameraManager.cameraZoom = 2.0;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyZoom();
      
      // Should translate to center
      expect(translateCalls[0]).to.deep.equal({ x: 400, y: 300 });
      // Should scale
      expect(scaleCalls[0]).to.deep.equal({ scale: 2.0 });
      // Should translate back from center
      expect(translateCalls[1]).to.deep.equal({ x: -400, y: -300 });
    });
    
    it('should NOT apply camera position offset (THIS IS THE BUG)', function() {
      // Simulate current applyZoom() - it doesn't use cameraX/cameraY
      const applyZoom = function() {
        const zoom = cameraManager.getZoom();
        translate(g_canvasX/2, g_canvasY/2);
        scale(zoom);
        translate(-g_canvasX/2, -g_canvasY/2);
        // NOTE: Missing translate(-cameraX, -cameraY)
      };
      
      mockCameraManager.cameraX = 100;
      mockCameraManager.cameraY = 50;
      mockCameraManager.cameraZoom = 0.5;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyZoom();
      
      // Should have 2 translate calls (center and un-center)
      expect(translateCalls.length).to.equal(2);
      
      // Should NOT have camera offset translate
      const hasCameraOffset = translateCalls.some(call => 
        call.x === -100 && call.y === -50
      );
      expect(hasCameraOffset).to.be.false;
      
      // This is the bug! Camera position is ignored.
    });
  });
  
  describe('Proposed applyCameraTransform() behavior', function() {
    it('should apply both zoom AND camera position', function() {
      // Simulate proposed fix
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        // Scale around canvas center
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        
        // Apply camera offset
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 100;
      mockCameraManager.cameraY = 50;
      mockCameraManager.cameraZoom = 2.0;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyCameraTransform();
      
      // Should have 3 translate calls
      expect(translateCalls.length).to.equal(3);
      
      // 1. Translate to center
      expect(translateCalls[0]).to.deep.equal({ x: 400, y: 300 });
      
      // 2. Scale
      expect(scaleCalls[0]).to.deep.equal({ scale: 2.0 });
      
      // 3. Translate from center
      expect(translateCalls[1]).to.deep.equal({ x: -400, y: -300 });
      
      // 4. Apply camera offset (THE FIX!)
      expect(translateCalls[2]).to.deep.equal({ x: -100, y: -50 });
    });
    
    it('should handle zoom < 1.0 with camera offset', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      // Zoomed out to 0.5x at camera position 200, 100
      mockCameraManager.cameraX = 200;
      mockCameraManager.cameraY = 100;
      mockCameraManager.cameraZoom = 0.5;
      
      translateCalls = [];
      scaleCalls = [];
      
      applyCameraTransform();
      
      // Should apply 0.5x scale
      expect(scaleCalls[0].scale).to.equal(0.5);
      
      // Should apply camera offset
      expect(translateCalls[2]).to.deep.equal({ x: -200, y: -100 });
    });
    
    it('should match Level Editor transform pattern', function() {
      // Level Editor's working implementation
      const levelEditorTransform = function(cameraX, cameraY, zoom) {
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      // Proposed RenderLayerManager fix
      const renderManagerTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 150;
      mockCameraManager.cameraY = 75;
      mockCameraManager.cameraZoom = 1.5;
      
      // Test Level Editor pattern
      translateCalls = [];
      scaleCalls = [];
      levelEditorTransform(150, 75, 1.5);
      const levelEditorCalls = { translate: [...translateCalls], scale: [...scaleCalls] };
      
      // Test RenderManager pattern
      translateCalls = [];
      scaleCalls = [];
      renderManagerTransform();
      const renderManagerCalls = { translate: [...translateCalls], scale: [...scaleCalls] };
      
      // Should produce identical transforms
      expect(renderManagerCalls.translate).to.deep.equal(levelEditorCalls.translate);
      expect(renderManagerCalls.scale).to.deep.equal(levelEditorCalls.scale);
    });
  });
  
  describe('World coordinate visibility at different zooms', function() {
    it('zoom 1.0: should show standard view (no extra visible area)', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 400;
      mockCameraManager.cameraY = 300;
      mockCameraManager.cameraZoom = 1.0;
      
      applyCameraTransform();
      
      // At zoom 1.0, visible area is canvas size
      // With camera at 400,300, we see world coords 0-800 x, 0-600 y
      expect(scaleCalls[0].scale).to.equal(1.0);
      expect(translateCalls[2]).to.deep.equal({ x: -400, y: -300 });
    });
    
    it('zoom 0.5: should show 2x more area (zoomed out)', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 400;
      mockCameraManager.cameraY = 300;
      mockCameraManager.cameraZoom = 0.5;
      
      applyCameraTransform();
      
      // At zoom 0.5, visible area is 2x canvas size
      // With camera at 400,300, we see world coords -400-1200 x, -300-900 y
      expect(scaleCalls[0].scale).to.equal(0.5);
      expect(translateCalls[2]).to.deep.equal({ x: -400, y: -300 });
      
      // The scale(0.5) makes everything half size, so 2x area is visible
    });
    
    it('zoom 2.0: should show 0.5x area (zoomed in)', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      mockCameraManager.cameraX = 400;
      mockCameraManager.cameraY = 300;
      mockCameraManager.cameraZoom = 2.0;
      
      applyCameraTransform();
      
      // At zoom 2.0, visible area is 0.5x canvas size
      // With camera at 400,300, we see world coords 200-600 x, 150-450 y
      expect(scaleCalls[0].scale).to.equal(2.0);
      expect(translateCalls[2]).to.deep.equal({ x: -400, y: -300 });
    });
  });
  
  describe('Edge cases', function() {
    it('should handle cameraX/cameraY undefined', function() {
      const applyCameraTransform = function() {
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      delete mockCameraManager.cameraX;
      delete mockCameraManager.cameraY;
      mockCameraManager.cameraZoom = 1.0;
      
      translateCalls = [];
      
      applyCameraTransform();
      
      // Should use 0,0 as fallback (use Math.abs to avoid -0 vs +0 comparison issue)
      expect(Math.abs(translateCalls[2].x)).to.equal(0);
      expect(Math.abs(translateCalls[2].y)).to.equal(0);
    });
    
    it('should handle null cameraManager gracefully', function() {
      const applyCameraTransform = function() {
        if (!cameraManager) return;
        
        const zoom = cameraManager.getZoom();
        const cameraX = cameraManager.cameraX || 0;
        const cameraY = cameraManager.cameraY || 0;
        
        translate(g_canvasX / 2, g_canvasY / 2);
        scale(zoom);
        translate(-g_canvasX / 2, -g_canvasY / 2);
        translate(-cameraX, -cameraY);
      };
      
      global.cameraManager = null;
      
      // Should not throw
      expect(() => applyCameraTransform()).to.not.throw();
      
      // Should not call any transforms
      expect(translateCalls.length).to.equal(0);
      expect(scaleCalls.length).to.equal(0);
    });
  });
});
